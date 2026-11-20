import jsonStore from '../storage/jsonStore.js';
import sequenceService from './sequenceService.js';
import auditService from './auditService.js';
import taxEngine from '../accounting/taxEngine.js';
import accountingEngine from '../accounting/accountingEngine.js';
import { roundNumber, add } from '../accounting/currency.js';
import { v4 as uuidv4 } from 'uuid';

class VendorBillService {
  getAll() {
    return jsonStore.readSync('vendor_bills.json') || [];
  }

  getById(id) {
    const list = this.getAll();
    return list.find((b) => b.id === id || b.billNumber === id);
  }

  async create(billData, user = 'System User') {
    if (!billData.vendorId) throw new Error('Vendor is required.');
    if (!billData.vendorBillNumber) throw new Error('Vendor invoice/bill reference number is required.');
    if (!billData.items || billData.items.length === 0) {
      throw new Error('At least one line item is required.');
    }

    const bills = this.getAll();
    const duplicate = bills.find(
      (b) =>
        b.vendorId === billData.vendorId &&
        b.vendorBillNumber.toLowerCase() === billData.vendorBillNumber.trim().toLowerCase() &&
        b.status !== 'Cancelled'
    );
    if (duplicate) {
      throw new Error(`Vendor bill '${billData.vendorBillNumber}' already exists for this vendor.`);
    }

    const company = jsonStore.readSync('company.json');
    const vendors = jsonStore.readSync('vendors.json');
    const vendor = vendors.find((v) => v.id === billData.vendorId);
    if (!vendor) throw new Error('Vendor not found.');

    const calculated = taxEngine.calculateDocumentTotals({
      items: billData.items,
      partyStateCode: vendor.stateCode,
      companyStateCode: company.stateCode,
      isTaxInclusive: Boolean(billData.isTaxInclusive),
      otherCharges: billData.otherCharges || 0
    });

    const billNumber = await sequenceService.getNextNumber('BILL');
    const billDate = billData.billDate || new Date().toISOString().slice(0, 10);
    let dueDate = billData.dueDate;
    if (!dueDate) {
      const d = new Date(billDate);
      d.setDate(d.getDate() + (billData.paymentTermsDays || 30));
      dueDate = d.toISOString().slice(0, 10);
    }

    const newBill = {
      id: uuidv4(),
      billNumber,
      vendorBillNumber: billData.vendorBillNumber.trim(),
      vendorId: vendor.id,
      vendorName: vendor.name,
      vendorGstin: vendor.gstin || '',
      partyStateCode: vendor.stateCode,
      billDate,
      dueDate,
      paymentTerms: billData.paymentTerms || 'Net 30',
      description: billData.description || 'Vendor Supply Bill',
      currency: company.baseCurrency || 'INR',
      expenseAccountCode: billData.expenseAccountCode || '5010',
      isTaxInclusive: Boolean(billData.isTaxInclusive),
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
      status: billData.status === 'Submitted' ? 'Pending Approval' : 'Draft',
      notes: billData.notes || '',
      createdBy: user,
      createdAt: new Date().toISOString(),
      postedDate: null,
      journalEntryId: null
    };

    return jsonStore.transaction(['vendor_bills.json'], async (tx) => {
      const currentBills = tx.get('vendor_bills.json');
      currentBills.push(newBill);
      tx.set('vendor_bills.json', currentBills);

      await auditService.log({
        user,
        action: 'Create Vendor Bill',
        transactionType: 'VENDOR_BILL',
        transactionId: newBill.id,
        afterValues: { billNumber, grandTotal: newBill.grandTotal, status: newBill.status },
        sourceModule: 'Purchases & Payables'
      });

      return newBill;
    });
  }

  async approve(id, user = 'System User') {
    return jsonStore.transaction(['vendor_bills.json'], async (tx) => {
      const bills = tx.get('vendor_bills.json');
      const bill = bills.find((b) => b.id === id);
      if (!bill) throw new Error(`Bill ${id} not found.`);
      if (bill.status !== 'Draft' && bill.status !== 'Pending Approval') {
        throw new Error(`Cannot approve bill in status '${bill.status}'`);
      }

      bill.status = 'Approved';
      bill.approvedBy = user;
      bill.approvedAt = new Date().toISOString();
      tx.set('vendor_bills.json', bills);

      await auditService.log({
        user,
        action: 'Approve Vendor Bill',
        transactionType: 'VENDOR_BILL',
        transactionId: id,
        afterValues: { status: 'Approved' },
        sourceModule: 'Purchases & Payables'
      });

      return bill;
    });
  }

  async post(id, user = 'System User') {
    const bills = this.getAll();
    const bill = bills.find((b) => b.id === id);
    if (!bill) throw new Error(`Bill ${id} not found.`);
    if (bill.status === 'Posted') throw new Error(`Bill '${bill.billNumber}' is already posted.`);
    if (bill.status === 'Cancelled') throw new Error('Cannot post cancelled bill.');

    const postingDate = new Date().toISOString().slice(0, 10);

    const journalLines = [
      {
        accountCode: bill.expenseAccountCode || '5010',
        debit: bill.taxableTotal,
        credit: 0,
        description: `Procurement expense for ${bill.billNumber} from ${bill.vendorName}`
      }
    ];

    if (bill.cgstTotal > 0) {
      journalLines.push({
        accountCode: '1610',
        debit: bill.cgstTotal,
        credit: 0,
        description: `Input CGST on bill ${bill.billNumber}`
      });
    }
    if (bill.sgstTotal > 0) {
      journalLines.push({
        accountCode: '1620',
        debit: bill.sgstTotal,
        credit: 0,
        description: `Input SGST on bill ${bill.billNumber}`
      });
    }
    if (bill.igstTotal > 0) {
      journalLines.push({
        accountCode: '1630',
        debit: bill.igstTotal,
        credit: 0,
        description: `Input IGST on bill ${bill.billNumber}`
      });
    }

    journalLines.push({
      accountCode: '2010',
      debit: 0,
      credit: bill.grandTotal,
      description: `Payable to ${bill.vendorName} for bill ${bill.billNumber}`
    });

    const journal = await accountingEngine.postJournal({
      transactionDate: bill.billDate,
      postingDate,
      referenceNumber: bill.billNumber,
      transactionType: 'VENDOR_BILL',
      description: `Vendor Bill ${bill.billNumber} (${bill.vendorBillNumber}) posted for ${bill.vendorName}`,
      sourceModule: 'Purchases & Payables',
      lines: journalLines,
      createdBy: user,
      linkedTransactionId: bill.id,
      status: 'Posted'
    });

    try {
      await jsonStore.transaction(['vendor_bills.json', 'vendors.json', 'tax_records.json'], async (tx) => {
        const currentBills = tx.get('vendor_bills.json');
        const targetBill = currentBills.find((b) => b.id === id);
        const vendors = tx.get('vendors.json');
        const vendor = vendors.find((v) => v.id === bill.vendorId);

        targetBill.status = 'Posted';
        targetBill.postedDate = postingDate;
        targetBill.journalEntryId = journal.id;
        bill.status = 'Posted';
        bill.postedDate = postingDate;
        bill.journalEntryId = journal.id;
        tx.set('vendor_bills.json', currentBills);

        if (vendor) {
          vendor.balance = roundNumber(add(vendor.balance || 0, bill.grandTotal));
          tx.set('vendors.json', vendors);
        }

        const taxRecords = tx.get('tax_records.json') || [];
        taxRecords.push({
          id: uuidv4(),
          transactionType: 'VENDOR_BILL',
          transactionId: bill.id,
          referenceNumber: bill.billNumber,
          date: bill.billDate,
          partyName: bill.vendorName,
          partyGstin: bill.vendorGstin,
          taxType: bill.taxType,
          taxableAmount: bill.taxableTotal,
          cgst: bill.cgstTotal,
          sgst: bill.sgstTotal,
          igst: bill.igstTotal,
          totalTax: bill.totalTax,
          direction: 'INPUT'
        });
        tx.set('tax_records.json', taxRecords);
      });
    } catch (err) {
      await accountingEngine.reverseJournal(journal.id, { reason: 'Rollback vendor bill failure', user });
      throw err;
    }

    await auditService.log({
      user,
      action: 'Post Vendor Bill',
      transactionType: 'VENDOR_BILL',
      transactionId: bill.id,
      afterValues: { billNumber: bill.billNumber, grandTotal: bill.grandTotal, journalId: journal.id },
      sourceModule: 'Purchases & Payables'
    });

    return { bill, journal };
  }
}

export const vendorBillService = new VendorBillService();
export default vendorBillService;
