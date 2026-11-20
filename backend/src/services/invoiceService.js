import jsonStore from '../storage/jsonStore.js';
import sequenceService from './sequenceService.js';
import auditService from './auditService.js';
import taxEngine from '../accounting/taxEngine.js';
import accountingEngine from '../accounting/accountingEngine.js';
import { roundNumber, add, subtract } from '../accounting/currency.js';
import { v4 as uuidv4 } from 'uuid';

class InvoiceService {
  getAll() {
    return jsonStore.readSync('invoices.json') || [];
  }

  getById(id) {
    const list = this.getAll();
    return list.find((inv) => inv.id === id || inv.invoiceNumber === id);
  }

  async create(invoiceData, user = 'System User') {
    if (!invoiceData.customerId) throw new Error('Customer is required.');
    if (!invoiceData.items || invoiceData.items.length === 0) {
      throw new Error('At least one line item is required.');
    }

    const company = jsonStore.readSync('company.json');
    const customers = jsonStore.readSync('customers.json');
    const customer = customers.find((c) => c.id === invoiceData.customerId);
    if (!customer) throw new Error('Invalid customer selected.');

    const calculated = taxEngine.calculateDocumentTotals({
      items: invoiceData.items,
      partyStateCode: customer.stateCode,
      companyStateCode: company.stateCode,
      isTaxInclusive: Boolean(invoiceData.isTaxInclusive),
      otherCharges: invoiceData.otherCharges || 0
    });

    const invoiceNumber = await sequenceService.getNextNumber('INV');
    const invoiceDate = invoiceData.invoiceDate || new Date().toISOString().slice(0, 10);

    let dueDate = invoiceData.dueDate;
    if (!dueDate) {
      const d = new Date(invoiceDate);
      d.setDate(d.getDate() + (invoiceData.paymentTermsDays || 30));
      dueDate = d.toISOString().slice(0, 10);
    }

    const newInvoice = {
      id: uuidv4(),
      invoiceNumber,
      customerId: customer.id,
      customerName: customer.name,
      customerGstin: customer.gstin || '',
      customerAddress: customer.address || '',
      partyStateCode: customer.stateCode,
      invoiceDate,
      dueDate,
      paymentTerms: invoiceData.paymentTerms || 'Net 30',
      description: invoiceData.description || 'Sales Invoice',
      currency: company.baseCurrency || 'INR',
      isTaxInclusive: Boolean(invoiceData.isTaxInclusive),
      taxType: calculated.taxType,
      items: calculated.items,
      subtotal: calculated.subtotal,
      totalDiscount: calculated.totalDiscount,
      taxableTotal: calculated.taxableTotal,
      cgstTotal: calculated.cgstTotal,
      sgstTotal: calculated.sgstTotal,
      igstTotal: calculated.igstTotal,
      totalTax: calculated.totalTax,
      otherCharges: calculated.otherCharges,
      grandTotal: calculated.grandTotal,
      paidAmount: 0,
      outstandingAmount: calculated.grandTotal,
      creditNotesApplied: 0,
      status: invoiceData.status === 'Submitted' ? 'Pending Approval' : 'Draft',
      notes: invoiceData.notes || '',
      createdBy: user,
      createdAt: new Date().toISOString(),
      postedDate: null,
      journalEntryId: null
    };

    return jsonStore.transaction(['invoices.json'], async (tx) => {
      const invoices = tx.get('invoices.json');
      invoices.push(newInvoice);
      tx.set('invoices.json', invoices);

      await auditService.log({
        user,
        action: 'Create Invoice',
        transactionType: 'INVOICE',
        transactionId: newInvoice.id,
        afterValues: { invoiceNumber, grandTotal: newInvoice.grandTotal, status: newInvoice.status },
        sourceModule: 'Sales & Receivables'
      });

      return newInvoice;
    });
  }

  async update(id, invoiceData, user = 'System User') {
    return jsonStore.transaction(['invoices.json'], async (tx) => {
      const invoices = tx.get('invoices.json');
      const idx = invoices.findIndex((inv) => inv.id === id);
      if (idx === -1) throw new Error(`Invoice ${id} not found.`);

      const existing = invoices[idx];
      if (existing.status === 'Posted' || existing.status === 'Paid' || existing.status === 'Partially Paid') {
        throw new Error(`Cannot modify posted or paid invoice '${existing.invoiceNumber}'. Use credit notes instead.`);
      }

      const company = jsonStore.readSync('company.json');
      const customers = jsonStore.readSync('customers.json');
      const customer = customers.find((c) => c.id === (invoiceData.customerId || existing.customerId));
      if (!customer) throw new Error('Customer not found.');

      const calculated = taxEngine.calculateDocumentTotals({
        items: invoiceData.items || existing.items,
        partyStateCode: customer.stateCode,
        companyStateCode: company.stateCode,
        isTaxInclusive: invoiceData.isTaxInclusive !== undefined ? invoiceData.isTaxInclusive : existing.isTaxInclusive,
        otherCharges: invoiceData.otherCharges !== undefined ? invoiceData.otherCharges : existing.otherCharges
      });

      const before = { ...existing };
      const updated = {
        ...existing,
        customerId: customer.id,
        customerName: customer.name,
        customerGstin: customer.gstin || '',
        customerAddress: customer.address || '',
        partyStateCode: customer.stateCode,
        invoiceDate: invoiceData.invoiceDate || existing.invoiceDate,
        dueDate: invoiceData.dueDate || existing.dueDate,
        paymentTerms: invoiceData.paymentTerms || existing.paymentTerms,
        description: invoiceData.description !== undefined ? invoiceData.description : existing.description,
        isTaxInclusive: Boolean(calculated.isTaxInclusive),
        taxType: calculated.taxType,
        items: calculated.items,
        subtotal: calculated.subtotal,
        totalDiscount: calculated.totalDiscount,
        taxableTotal: calculated.taxableTotal,
        cgstTotal: calculated.cgstTotal,
        sgstTotal: calculated.sgstTotal,
        igstTotal: calculated.igstTotal,
        totalTax: calculated.totalTax,
        otherCharges: calculated.otherCharges,
        grandTotal: calculated.grandTotal,
        outstandingAmount: calculated.grandTotal,
        notes: invoiceData.notes !== undefined ? invoiceData.notes : existing.notes,
        status: invoiceData.status || existing.status
      };

      invoices[idx] = updated;
      tx.set('invoices.json', invoices);

      await auditService.log({
        user,
        action: 'Update Invoice',
        transactionType: 'INVOICE',
        transactionId: id,
        beforeValues: before,
        afterValues: updated,
        sourceModule: 'Sales & Receivables'
      });

      return updated;
    });
  }

  async delete(id, user = 'System User') {
    return jsonStore.transaction(['invoices.json'], async (tx) => {
      const invoices = tx.get('invoices.json');
      const idx = invoices.findIndex((i) => i.id === id);
      if (idx === -1) throw new Error(`Invoice ${id} not found.`);

      const inv = invoices[idx];
      if (inv.status !== 'Draft' && inv.status !== 'Pending Approval') {
        throw new Error(`Cannot delete invoice in status '${inv.status}'. Only Draft invoices can be deleted.`);
      }

      invoices.splice(idx, 1);
      tx.set('invoices.json', invoices);

      await auditService.log({
        user,
        action: 'Delete Invoice',
        transactionType: 'INVOICE',
        transactionId: id,
        beforeValues: inv,
        sourceModule: 'Sales & Receivables'
      });

      return { success: true, message: `Invoice ${inv.invoiceNumber} deleted.` };
    });
  }

  async approve(id, user = 'System User') {
    return jsonStore.transaction(['invoices.json'], async (tx) => {
      const invoices = tx.get('invoices.json');
      const inv = invoices.find((i) => i.id === id);
      if (!inv) throw new Error(`Invoice ${id} not found.`);
      if (inv.status !== 'Draft' && inv.status !== 'Pending Approval') {
        throw new Error(`Cannot approve invoice in status '${inv.status}'`);
      }

      inv.status = 'Approved';
      inv.approvedBy = user;
      inv.approvedAt = new Date().toISOString();
      tx.set('invoices.json', invoices);

      await auditService.log({
        user,
        action: 'Approve Invoice',
        transactionType: 'INVOICE',
        transactionId: id,
        afterValues: { status: 'Approved' },
        sourceModule: 'Sales & Receivables'
      });

      return inv;
    });
  }

  async post(id, user = 'System User') {
    const invoices = this.getAll();
    const inv = invoices.find((i) => i.id === id);
    if (!inv) throw new Error(`Invoice ${id} not found.`);
    if (inv.status === 'Posted') throw new Error(`Invoice '${inv.invoiceNumber}' is already posted.`);
    if (inv.status === 'Cancelled') throw new Error(`Cannot post cancelled invoice.`);

    const postingDate = new Date().toISOString().slice(0, 10);

    const journalLines = [
      {
        accountCode: '1200',
        debit: inv.grandTotal,
        credit: 0,
        description: `Receivable from ${inv.customerName} for ${inv.invoiceNumber}`
      },
      {
        accountCode: '4010',
        debit: 0,
        credit: inv.taxableTotal,
        description: `Sales revenue for ${inv.invoiceNumber}`
      }
    ];

    if (inv.cgstTotal > 0) {
      journalLines.push({
        accountCode: '2110',
        debit: 0,
        credit: inv.cgstTotal,
        description: `Output CGST for ${inv.invoiceNumber}`
      });
    }
    if (inv.sgstTotal > 0) {
      journalLines.push({
        accountCode: '2120',
        debit: 0,
        credit: inv.sgstTotal,
        description: `Output SGST for ${inv.invoiceNumber}`
      });
    }
    if (inv.igstTotal > 0) {
      journalLines.push({
        accountCode: '2130',
        debit: 0,
        credit: inv.igstTotal,
        description: `Output IGST for ${inv.invoiceNumber}`
      });
    }

    const journal = await accountingEngine.postJournal({
      transactionDate: inv.invoiceDate,
      postingDate,
      referenceNumber: inv.invoiceNumber,
      transactionType: 'INVOICE',
      description: `Invoice ${inv.invoiceNumber} posted for ${inv.customerName}`,
      sourceModule: 'Sales & Receivables',
      lines: journalLines,
      createdBy: user,
      linkedTransactionId: inv.id,
      status: 'Posted'
    });

    try {
      await jsonStore.transaction(['invoices.json', 'customers.json', 'tax_records.json'], async (tx) => {
        const invList = tx.get('invoices.json');
        const targetInv = invList.find((i) => i.id === id);
        const customers = tx.get('customers.json');
        const customer = customers.find((c) => c.id === inv.customerId);

        targetInv.status = 'Posted';
        targetInv.postedDate = postingDate;
        targetInv.journalEntryId = journal.id;
        inv.status = 'Posted';
        inv.postedDate = postingDate;
        inv.journalEntryId = journal.id;
        tx.set('invoices.json', invList);

        if (customer) {
          customer.balance = roundNumber(add(customer.balance || 0, inv.grandTotal));
          tx.set('customers.json', customers);
        }

        const taxRecords = tx.get('tax_records.json') || [];
        taxRecords.push({
          id: uuidv4(),
          transactionType: 'INVOICE',
          transactionId: inv.id,
          referenceNumber: inv.invoiceNumber,
          date: inv.invoiceDate,
          partyName: inv.customerName,
          partyGstin: inv.customerGstin,
          taxType: inv.taxType,
          taxableAmount: inv.taxableTotal,
          cgst: inv.cgstTotal,
          sgst: inv.sgstTotal,
          igst: inv.igstTotal,
          totalTax: inv.totalTax,
          direction: 'OUTPUT'
        });
        tx.set('tax_records.json', taxRecords);
      });
    } catch (err) {
      await accountingEngine.reverseJournal(journal.id, { reason: 'Rollback on invoice post failure', user });
      throw err;
    }

    await auditService.log({
      user,
      action: 'Post Invoice',
      transactionType: 'INVOICE',
      transactionId: inv.id,
      afterValues: { invoiceNumber: inv.invoiceNumber, journalId: journal.id, grandTotal: inv.grandTotal },
      sourceModule: 'Sales & Receivables'
    });

    return { invoice: inv, journal };
  }
}

export const invoiceService = new InvoiceService();
export default invoiceService;
