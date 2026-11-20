import jsonStore from '../storage/jsonStore.js';
import sequenceService from './sequenceService.js';
import auditService from './auditService.js';
import accountingEngine from '../accounting/accountingEngine.js';
import taxEngine from '../accounting/taxEngine.js';
import { roundNumber, subtract, add } from '../accounting/currency.js';
import { v4 as uuidv4 } from 'uuid';

class DebitNoteService {
  getAll() {
    return jsonStore.readSync('debit_notes.json') || [];
  }

  getById(id) {
    const list = this.getAll();
    return list.find((dn) => dn.id === id || dn.debitNoteNumber === id);
  }

  async createDebitNote({
    billId,
    date = new Date().toISOString().slice(0, 10),
    reason = 'Purchase Return',
    items = [],
    notes = '',
    user = 'System User'
  }) {
    const debitNoteNumber = await sequenceService.getNextNumber('DN');

    const bills = jsonStore.readSync('vendor_bills.json');
    const bill = bills.find((b) => b.id === billId || b.billNumber === billId);
    if (!bill) throw new Error(`Vendor bill ${billId} not found.`);
    if (bill.status !== 'Posted' && bill.status !== 'Partially Paid' && bill.status !== 'Paid') {
      throw new Error('Debit note can only be created for posted vendor bills.');
    }

        const company = jsonStore.readSync('company.json');
        const calculated = taxEngine.calculateDocumentTotals({
          items,
          partyStateCode: bill.partyStateCode,
          companyStateCode: company.stateCode,
          isTaxInclusive: bill.isTaxInclusive
        });

        if (calculated.grandTotal > bill.grandTotal) {
          throw new Error(`Debit note amount (₹${calculated.grandTotal}) cannot exceed original bill amount (₹${bill.grandTotal}).`);
        }

        // Journal Lines for Debit Note (reverses bill):
        // Debit: Accounts Payable (2010)
        // Credit: Expense / COGS (5010)
        // Credit: Input GST (1610 / 1620 / 1630)
        const journalLines = [
          {
            accountCode: '2010',
            debit: calculated.grandTotal,
            credit: 0,
            description: `Payable reduction for DN ${debitNoteNumber} on ${bill.billNumber}`
          },
          {
            accountCode: bill.expenseAccountCode || '5010',
            debit: 0,
            credit: calculated.taxableTotal,
            description: `Procurement expense reversal for DN ${debitNoteNumber}`
          }
        ];

        if (calculated.cgstTotal > 0) {
          journalLines.push({
            accountCode: '1610',
            debit: 0,
            credit: calculated.cgstTotal,
            description: `Input CGST reversal for DN ${debitNoteNumber}`
          });
        }
        if (calculated.sgstTotal > 0) {
          journalLines.push({
            accountCode: '1620',
            debit: 0,
            credit: calculated.sgstTotal,
            description: `Input SGST reversal for DN ${debitNoteNumber}`
          });
        }
        if (calculated.igstTotal > 0) {
          journalLines.push({
            accountCode: '1630',
            debit: 0,
            credit: calculated.igstTotal,
            description: `Input IGST reversal for DN ${debitNoteNumber}`
          });
        }

        const journal = await accountingEngine.postJournal({
          transactionDate: date,
          postingDate: date,
          referenceNumber: debitNoteNumber,
          transactionType: 'DEBIT_NOTE',
          description: `Debit note ${debitNoteNumber} against ${bill.billNumber} (${reason})`,
          sourceModule: 'Purchases & Payables',
          lines: journalLines,
          createdBy: user,
          status: 'Posted'
        });

        const debitNote = {
          id: uuidv4(),
          debitNoteNumber,
          billId: bill.id,
          billNumber: bill.billNumber,
          vendorId: bill.vendorId,
          vendorName: bill.vendorName,
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
            ['debit_notes.json', 'vendor_bills.json', 'vendors.json', 'tax_records.json'],
            async (tx2) => {
              const bills2 = tx2.get('vendor_bills.json');
              const debitNotes2 = tx2.get('debit_notes.json') || [];
              const vendors2 = tx2.get('vendors.json');
              const taxRecords2 = tx2.get('tax_records.json') || [];

              const targetBill = bills2.find((b) => b.id === bill.id);
              if (targetBill) {
                targetBill.outstandingAmount = roundNumber(subtract(targetBill.outstandingAmount, calculated.grandTotal));
                if (targetBill.outstandingAmount <= 0.01) {
                  targetBill.outstandingAmount = 0;
                  targetBill.status = 'Paid';
                }
              }

              const targetVendor = vendors2.find((v) => v.id === bill.vendorId);
              if (targetVendor) {
                targetVendor.balance = roundNumber(subtract(targetVendor.balance || 0, calculated.grandTotal));
              }

              taxRecords2.push({
                id: uuidv4(),
                transactionType: 'DEBIT_NOTE',
                transactionId: debitNoteNumber,
                referenceNumber: debitNoteNumber,
                date,
                partyName: bill.vendorName,
                partyGstin: bill.vendorGstin,
                taxType: calculated.taxType,
                taxableAmount: -calculated.taxableTotal,
                cgst: -calculated.cgstTotal,
                sgst: -calculated.sgstTotal,
                igst: -calculated.igstTotal,
                totalTax: -calculated.totalTax,
                direction: 'INPUT_REVERSAL'
              });

              debitNotes2.push(debitNote);
              tx2.set('debit_notes.json', debitNotes2);
              tx2.set('vendor_bills.json', bills2);
              tx2.set('vendors.json', vendors2);
              tx2.set('tax_records.json', taxRecords2);
            }
          );
        } catch (err) {
          await accountingEngine.reverseJournal(journal.id, { reason: 'Rollback DN failure', user });
          throw err;
        }

        await auditService.log({
          user,
          action: 'Create Debit Note',
          transactionType: 'DEBIT_NOTE',
          transactionId: debitNote.id,
          afterValues: { debitNoteNumber, billNumber: bill.billNumber, grandTotal: debitNote.grandTotal },
          sourceModule: 'Purchases & Payables'
        });

        return debitNote;
  }
}

export const debitNoteService = new DebitNoteService();
export default debitNoteService;
