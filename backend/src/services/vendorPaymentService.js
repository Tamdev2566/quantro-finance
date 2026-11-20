import jsonStore from '../storage/jsonStore.js';
import sequenceService from './sequenceService.js';
import auditService from './auditService.js';
import accountingEngine from '../accounting/accountingEngine.js';
import { roundNumber, add, subtract, toDecimal } from '../accounting/currency.js';
import { v4 as uuidv4 } from 'uuid';

class VendorPaymentService {
  getAll() {
    return jsonStore.readSync('vendor_payments.json') || [];
  }

  getById(id) {
    const list = this.getAll();
    return list.find((p) => p.id === id || p.paymentNumber === id);
  }

  async createPayment({
    vendorId,
    paymentDate = new Date().toISOString().slice(0, 10),
    paymentMethod = 'Bank Transfer',
    reference = '',
    bankAccountId,
    amount,
    allocations = [],
    notes = '',
    user = 'System User'
  }) {
    const totalAmount = roundNumber(amount);
    if (totalAmount <= 0) throw new Error('Payment amount must be greater than zero.');

    const paymentNumber = await sequenceService.getNextNumber('VPAY');

    const vendors = jsonStore.readSync('vendors.json');
    const bills = jsonStore.readSync('vendor_bills.json');
    const bankAccounts = jsonStore.readSync('bank_accounts.json');

    const vendor = vendors.find((v) => v.id === vendorId);
    if (!vendor) throw new Error('Vendor not found.');

    let creditAccountCode = '1020';
    let bankAccount = null;

    if (paymentMethod === 'Cash') {
      creditAccountCode = '1010';
    } else if (bankAccountId) {
      bankAccount = bankAccounts.find((b) => b.id === bankAccountId || b.ledgerAccountCode === bankAccountId);
      if (bankAccount) {
        creditAccountCode = bankAccount.ledgerAccountCode;
      }
    }

    let allocatedSum = toDecimal(0);
    const validAllocations = [];

    for (const alloc of allocations) {
      const bill = bills.find((b) => b.id === alloc.billId);
      if (!bill) throw new Error(`Bill ${alloc.billId} not found.`);
      if (bill.status !== 'Posted' && bill.status !== 'Partially Paid') {
        throw new Error(`Cannot apply payment to bill '${bill.billNumber}' with status '${bill.status}'`);
      }

      const allocAmount = toDecimal(alloc.amount);
      if (allocAmount.isLessThanOrEqualTo(0)) continue;

      if (allocAmount.isGreaterThan(bill.outstandingAmount)) {
        throw new Error(`Allocation of ₹${roundNumber(allocAmount)} exceeds bill '${bill.billNumber}' balance of ₹${bill.outstandingAmount}`);
      }

      allocatedSum = add(allocatedSum, allocAmount);
      validAllocations.push({
        billId: bill.id,
        billNumber: bill.billNumber,
        amount: roundNumber(allocAmount)
      });
    }

    const unallocatedAmount = roundNumber(subtract(totalAmount, allocatedSum));
    if (unallocatedAmount < -0.01) {
      throw new Error('Allocated sum cannot exceed total payment amount.');
    }

        const journal = await accountingEngine.postJournal({
          transactionDate: paymentDate,
          postingDate: paymentDate,
          referenceNumber: paymentNumber,
          transactionType: 'VENDOR_PAYMENT',
          description: `Disbursement to vendor ${vendor.name} via ${paymentMethod} (${paymentNumber})`,
          sourceModule: 'Purchases & Payables',
          lines: [
            {
              accountCode: '2010',
              debit: totalAmount,
              credit: 0,
              description: `Payment against payables to ${vendor.name}`
            },
            {
              accountCode: creditAccountCode,
              debit: 0,
              credit: totalAmount,
              description: `Withdrawal/transfer for vendor ${vendor.name}`
            }
          ],
          createdBy: user,
          status: 'Posted'
        });

        const paymentRecord = {
          id: uuidv4(),
          paymentNumber,
          vendorId: vendor.id,
          vendorName: vendor.name,
          paymentDate,
          paymentMethod,
          reference,
          creditAccountCode,
          bankAccountId: bankAccount ? bankAccount.id : null,
          amount: totalAmount,
          allocatedAmount: roundNumber(allocatedSum),
          unallocatedAmount,
          allocations: validAllocations,
          notes,
          journalEntryId: journal.id,
          status: 'Posted',
          createdBy: user,
          createdAt: new Date().toISOString()
        };

        try {
          await jsonStore.transaction(
            ['vendor_payments.json', 'vendor_bills.json', 'vendors.json', 'bank_accounts.json', 'bank_transactions.json'],
            async (tx) => {
              const vendors = tx.get('vendors.json');
              const bills = tx.get('vendor_bills.json');
              const bankAccounts = tx.get('bank_accounts.json');
              const payments = tx.get('vendor_payments.json') || [];
              const bankTransactions = tx.get('bank_transactions.json') || [];

              const v = vendors.find((vend) => vend.id === vendorId);
              if (v) {
                v.balance = roundNumber(subtract(v.balance || 0, totalAmount));
              }

              for (const alloc of validAllocations) {
                const bill = bills.find((b) => b.id === alloc.billId);
                if (bill) {
                  bill.paidAmount = roundNumber(add(bill.paidAmount, alloc.amount));
                  bill.outstandingAmount = roundNumber(subtract(bill.grandTotal, bill.paidAmount));
                  bill.status = bill.outstandingAmount <= 0.001 ? 'Paid' : 'Partially Paid';
                }
              }

              if (bankAccount) {
                const bAcc = bankAccounts.find((b) => b.id === bankAccount.id);
                if (bAcc) {
                  bAcc.currentBalance = roundNumber(subtract(bAcc.currentBalance || 0, totalAmount));
                  bankTransactions.push({
                    id: uuidv4(),
                    bankAccountId: bAcc.id,
                    accountNumber: bAcc.accountNumber,
                    date: paymentDate,
                    type: 'DEBIT',
                    amount: totalAmount,
                    reference: paymentNumber,
                    description: `Payment to ${vendor.name} (${reference || paymentMethod})`,
                    runningBalance: bAcc.currentBalance,
                    reconciled: false,
                    sourceModule: 'Vendor Payment',
                    linkedId: paymentNumber
                  });
                }
              }

              payments.push(paymentRecord);
              tx.set('vendor_payments.json', payments);
              tx.set('vendor_bills.json', bills);
              tx.set('vendors.json', vendors);
              tx.set('bank_accounts.json', bankAccounts);
              tx.set('bank_transactions.json', bankTransactions);
            }
          );
        } catch (err) {
          await accountingEngine.reverseJournal(journal.id, { reason: 'Rollback vendor payment', user });
          throw err;
        }

    await auditService.log({
      user,
      action: 'Pay Vendor Bill',
      transactionType: 'VENDOR_PAYMENT',
      transactionId: paymentRecord.id,
      afterValues: { paymentNumber, amount: totalAmount, allocations: validAllocations },
      sourceModule: 'Purchases & Payables'
    });

    return paymentRecord;
  }

  async reversePayment(paymentId, { reason = 'Vendor Payment Reversal', user = 'System User' } = {}) {
    return jsonStore.transaction(
      [
        'vendor_payments.json',
        'vendor_bills.json',
        'vendors.json',
        'bank_accounts.json',
        'accounts.json',
        'journal_entries.json',
        'periods.json'
      ],
      async (tx) => {
        const payments = tx.get('vendor_payments.json');
        const bills = tx.get('vendor_bills.json');
        const vendors = tx.get('vendors.json');
        const bankAccounts = tx.get('bank_accounts.json');

        const payment = payments.find((p) => p.id === paymentId || p.paymentNumber === paymentId);
        if (!payment) throw new Error(`Vendor payment ${paymentId} not found.`);
        if (payment.status === 'Reversed') throw new Error('Payment is already reversed.');

        for (const alloc of payment.allocations || []) {
          const bill = bills.find((b) => b.id === alloc.billId);
          if (bill) {
            bill.paidAmount = roundNumber(subtract(bill.paidAmount, alloc.amount));
            bill.outstandingAmount = roundNumber(subtract(bill.grandTotal, bill.paidAmount));
            bill.status = bill.outstandingAmount < bill.grandTotal ? 'Partially Paid' : 'Posted';
          }
        }

        const vendor = vendors.find((v) => v.id === payment.vendorId);
        if (vendor) {
          vendor.balance = roundNumber(add(vendor.balance || 0, payment.amount));
        }

        if (payment.bankAccountId) {
          const bank = bankAccounts.find((b) => b.id === payment.bankAccountId);
          if (bank) {
            bank.currentBalance = roundNumber(add(bank.currentBalance || 0, payment.amount));
          }
        }

        if (payment.journalEntryId) {
          await accountingEngine.reverseJournal(payment.journalEntryId, { reason, user });
        }

        payment.status = 'Reversed';
        payment.reversedAt = new Date().toISOString();
        payment.reversalReason = reason;

        tx.set('vendor_payments.json', payments);
        tx.set('vendor_bills.json', bills);
        tx.set('vendors.json', vendors);
        tx.set('bank_accounts.json', bankAccounts);

        await auditService.log({
          user,
          action: 'Reverse Vendor Payment',
          transactionType: 'VENDOR_PAYMENT',
          transactionId: payment.id,
          reason,
          sourceModule: 'Purchases & Payables'
        });

        return payment;
      }
    );
  }
}

export const vendorPaymentService = new VendorPaymentService();
export default vendorPaymentService;
