import jsonStore from '../storage/jsonStore.js';
import sequenceService from './sequenceService.js';
import auditService from './auditService.js';
import accountingEngine from '../accounting/accountingEngine.js';
import taxEngine from '../accounting/taxEngine.js';
import { roundNumber, subtract, add } from '../accounting/currency.js';
import { v4 as uuidv4 } from 'uuid';

class CreditNoteService {
  getAll() {
    return jsonStore.readSync('credit_notes.json') || [];
  }

  getById(id) {
    const list = this.getAll();
    return list.find((cn) => cn.id === id || cn.creditNoteNumber === id);
  }

  async createCreditNote({
    invoiceId,
    date = new Date().toISOString().slice(0, 10),
    reason = 'Sales Return',
    items = [],
    notes = '',
    user = 'System User'
  }) {
    const creditNoteNumber = await sequenceService.getNextNumber('CN');

    const invoices = jsonStore.readSync('invoices.json');
    const inv = invoices.find((i) => i.id === invoiceId || i.invoiceNumber === invoiceId);
    if (!inv) throw new Error(`Invoice ${invoiceId} not found.`);
    if (inv.status !== 'Posted' && inv.status !== 'Partially Paid' && inv.status !== 'Paid') {
      throw new Error(`Credit notes can only be issued against posted invoices.`);
    }

    const company = jsonStore.readSync('company.json');
        const calculated = taxEngine.calculateDocumentTotals({
          items,
          partyStateCode: inv.partyStateCode,
          companyStateCode: company.stateCode,
          isTaxInclusive: inv.isTaxInclusive
        });

        if (calculated.grandTotal > inv.outstandingAmount + 0.01 && inv.status !== 'Paid') {
          if (calculated.grandTotal > inv.grandTotal) {
            throw new Error(`Credit note amount (₹${calculated.grandTotal}) cannot exceed the total invoice amount (₹${inv.grandTotal}).`);
          }
        }

        const journalLines = [
          {
            accountCode: '4010',
            debit: calculated.taxableTotal,
            credit: 0,
            description: `Revenue reversal for CN ${creditNoteNumber}`
          }
        ];

        if (calculated.cgstTotal > 0) {
          journalLines.push({
            accountCode: '2110',
            debit: calculated.cgstTotal,
            credit: 0,
            description: `Output CGST reversal for CN ${creditNoteNumber}`
          });
        }
        if (calculated.sgstTotal > 0) {
          journalLines.push({
            accountCode: '2120',
            debit: calculated.sgstTotal,
            credit: 0,
            description: `Output SGST reversal for CN ${creditNoteNumber}`
          });
        }
        if (calculated.igstTotal > 0) {
          journalLines.push({
            accountCode: '2130',
            debit: calculated.igstTotal,
            credit: 0,
            description: `Output IGST reversal for CN ${creditNoteNumber}`
          });
        }

        journalLines.push({
          accountCode: '1200',
          debit: 0,
          credit: calculated.grandTotal,
          description: `Receivable reduction for CN ${creditNoteNumber} on ${inv.invoiceNumber}`
        });

        const journal = await accountingEngine.postJournal({
          transactionDate: date,
          postingDate: date,
          referenceNumber: creditNoteNumber,
          transactionType: 'CREDIT_NOTE',
          description: `Credit note ${creditNoteNumber} against ${inv.invoiceNumber} (${reason})`,
          sourceModule: 'Sales & Receivables',
          lines: journalLines,
          createdBy: user,
          status: 'Posted'
        });

        const creditNote = {
          id: uuidv4(),
          creditNoteNumber,
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          customerId: inv.customerId,
          customerName: inv.customerName,
          date,
          reason,
          items: calculated.items,
          subtotal: calculated.subtotal,
          taxableTotal: calculated.taxableTotal,
          cgstTotal: calculated.cgstTotal,
          sgstTotal: calculated.sgstTotal,
          igstTotal: calculated.igstTotal,
          totalTax: calculated.totalTax,
          grandTotal: calculated.grandTotal,
          journalEntryId: journal.id,
          status: 'Posted',
          notes,
          createdBy: user,
          createdAt: new Date().toISOString()
        };

        try {
          await jsonStore.transaction(
            ['credit_notes.json', 'invoices.json', 'customers.json', 'tax_records.json'],
            async (tx2) => {
              const invoices2 = tx2.get('invoices.json');
              const creditNotes2 = tx2.get('credit_notes.json') || [];
              const customers2 = tx2.get('customers.json');
              const taxRecords2 = tx2.get('tax_records.json') || [];

              const targetInv = invoices2.find((i) => i.id === inv.id);
              if (targetInv) {
                targetInv.creditNotesApplied = roundNumber(add(targetInv.creditNotesApplied || 0, calculated.grandTotal));
                targetInv.outstandingAmount = roundNumber(subtract(targetInv.outstandingAmount, calculated.grandTotal));
                if (targetInv.outstandingAmount <= 0.01) {
                  targetInv.outstandingAmount = 0;
                  targetInv.status = 'Paid';
                }
              }

              const targetCustomer = customers2.find((c) => c.id === inv.customerId);
              if (targetCustomer) {
                targetCustomer.balance = roundNumber(subtract(targetCustomer.balance || 0, calculated.grandTotal));
              }

              taxRecords2.push({
                id: uuidv4(),
                transactionType: 'CREDIT_NOTE',
                transactionId: creditNoteNumber,
                referenceNumber: creditNoteNumber,
                date,
                partyName: inv.customerName,
                partyGstin: inv.customerGstin,
                taxType: calculated.taxType,
                taxableAmount: -calculated.taxableTotal,
                cgst: -calculated.cgstTotal,
                sgst: -calculated.sgstTotal,
                igst: -calculated.igstTotal,
                totalTax: -calculated.totalTax,
                direction: 'OUTPUT_REVERSAL'
              });

              creditNotes2.push(creditNote);
              tx2.set('credit_notes.json', creditNotes2);
              tx2.set('invoices.json', invoices2);
              tx2.set('customers.json', customers2);
              tx2.set('tax_records.json', taxRecords2);
            }
          );
        } catch (err) {
          await accountingEngine.reverseJournal(journal.id, { reason: 'Rollback CN failure', user });
          throw err;
        }

    await auditService.log({
      user,
      action: 'Create Credit Note',
      transactionType: 'CREDIT_NOTE',
      transactionId: creditNote.id,
      afterValues: { creditNoteNumber, invoiceNumber: inv.invoiceNumber, grandTotal: creditNote.grandTotal },
      sourceModule: 'Sales & Receivables'
    });

    return creditNote;
  }
}

export const creditNoteService = new CreditNoteService();
export default creditNoteService;
