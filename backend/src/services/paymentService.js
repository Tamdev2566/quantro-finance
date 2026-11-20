import jsonStore from '../storage/jsonStore.js';
import sequenceService from './sequenceService.js';
import auditService from './auditService.js';
import accountingEngine from '../accounting/accountingEngine.js';
import { roundNumber, add, subtract, toDecimal } from '../accounting/currency.js';
import { v4 as uuidv4 } from 'uuid';

class PaymentService {
  getAll() {
    return jsonStore.readSync('payments.json') || [];
  }

  getById(id) {
    const list = this.getAll();
    return list.find((p) => p.id === id || p.paymentNumber === id);
  }

  async createPayment({
    customerId,
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

    const paymentNumber = await sequenceService.getNextNumber('PAY');

    const customers = jsonStore.readSync('customers.json');
    const invoices = jsonStore.readSync('invoices.json');
    const bankAccounts = jsonStore.readSync('bank_accounts.json');

    const customer = customers.find((c) => c.id === customerId);
    if (!customer) throw new Error('Customer not found.');

    let depositAccountCode = '1020';
    let bankAccount = null;

    if (paymentMethod === 'Cash') {
      depositAccountCode = '1010';
    } else if (bankAccountId) {
      bankAccount = bankAccounts.find((b) => b.id === bankAccountId || b.ledgerAccountCode === bankAccountId);
      if (bankAccount) {
        depositAccountCode = bankAccount.ledgerAccountCode;
      }
    }

    let allocatedSum = toDecimal(0);
    const validAllocations = [];

    for (const alloc of allocations) {
      const inv = invoices.find((i) => i.id === alloc.invoiceId);
      if (!inv) throw new Error(`Invoice ${alloc.invoiceId} not found.`);
      if (inv.status !== 'Posted' && inv.status !== 'Partially Paid') {
        throw new Error(`Cannot apply payment to invoice '${inv.invoiceNumber}' with status '${inv.status}'`);
      }

      const allocAmount = toDecimal(alloc.amount);
      if (allocAmount.isLessThanOrEqualTo(0)) continue;

      if (allocAmount.isGreaterThan(inv.outstandingAmount)) {
        throw new Error(
          `Allocation of ₹${roundNumber(allocAmount)} exceeds invoice '${inv.invoiceNumber}' outstanding balance of ₹${inv.outstandingAmount}`
        );
      }

      allocatedSum = add(allocatedSum, allocAmount);
      validAllocations.push({
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        amount: roundNumber(allocAmount)
      });
    }

    const unallocatedAmount = roundNumber(subtract(totalAmount, allocatedSum));
    if (unallocatedAmount < -0.01) {
      throw new Error(`Allocated total cannot exceed the received payment amount.`);
    }

        const journal = await accountingEngine.postJournal({
          transactionDate: paymentDate,
          postingDate: paymentDate,
          referenceNumber: paymentNumber,
          transactionType: 'PAYMENT',
          description: `Customer payment received from ${customer.name} via ${paymentMethod} (${paymentNumber})`,
          sourceModule: 'Sales & Receivables',
          lines: [
            {
              accountCode: depositAccountCode,
              debit: totalAmount,
              credit: 0,
              description: `Receipt from ${customer.name}`
            },
            {
              accountCode: '1200',
              debit: 0,
              credit: totalAmount,
              description: `Payment applied to customer account ${customer.name}`
            }
          ],
          createdBy: user,
          status: 'Posted'
        });

        const paymentRecord = {
          id: uuidv4(),
          paymentNumber,
          customerId: customer.id,
          customerName: customer.name,
          paymentDate,
          paymentMethod,
          reference,
          depositAccountCode,
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
            ['payments.json', 'invoices.json', 'customers.json', 'bank_accounts.json', 'bank_transactions.json'],
            async (tx) => {
              const invoices = tx.get('invoices.json');
              const customers = tx.get('customers.json');
              const bankAccounts = tx.get('bank_accounts.json');
              const payments = tx.get('payments.json');
              const bankTransactions = tx.get('bank_transactions.json') || [];

              const cust = customers.find((c) => c.id === customerId);
              if (cust) {
                cust.balance = roundNumber(subtract(cust.balance || 0, totalAmount));
              }

              for (const alloc of validAllocations) {
                const inv = invoices.find((i) => i.id === alloc.invoiceId);
                if (inv) {
                  inv.paidAmount = roundNumber(add(inv.paidAmount, alloc.amount));
                  inv.outstandingAmount = roundNumber(subtract(inv.grandTotal, inv.paidAmount));
                  inv.status = inv.outstandingAmount <= 0.001 ? 'Paid' : 'Partially Paid';
                }
              }

              if (bankAccount) {
                const bAcc = bankAccounts.find((b) => b.id === bankAccount.id);
                if (bAcc) {
                  bAcc.currentBalance = roundNumber(add(bAcc.currentBalance || 0, totalAmount));
                  bankTransactions.push({
                    id: uuidv4(),
                    bankAccountId: bAcc.id,
                    accountNumber: bAcc.accountNumber,
                    date: paymentDate,
                    type: 'CREDIT',
                    amount: totalAmount,
                    reference: paymentNumber,
                    description: `Payment from ${customer.name} (${reference || paymentMethod})`,
                    runningBalance: bAcc.currentBalance,
                    reconciled: false,
                    sourceModule: 'Customer Payment',
                    linkedId: paymentNumber
                  });
                }
              }

              payments.push(paymentRecord);
              tx.set('payments.json', payments);
              tx.set('invoices.json', invoices);
              tx.set('customers.json', customers);
              tx.set('bank_accounts.json', bankAccounts);
              tx.set('bank_transactions.json', bankTransactions);
            }
          );
        } catch (err) {
          await accountingEngine.reverseJournal(journal.id, { reason: 'Rollback payment failure', user });
          throw err;
        }

    await auditService.log({
      user,
      action: 'Receive Payment',
      transactionType: 'PAYMENT',
      transactionId: paymentRecord.id,
      afterValues: { paymentNumber, amount: totalAmount, allocations: validAllocations },
      sourceModule: 'Sales & Receivables'
    });

    return paymentRecord;
  }

  async reversePayment(paymentId, { reason = 'Customer Cheque Bounce / Void', user = 'System User' } = {}) {
    return jsonStore.transaction(
      [
        'payments.json',
        'invoices.json',
        'customers.json',
        'bank_accounts.json',
        'accounts.json',
        'journal_entries.json',
        'periods.json'
      ],
      async (tx) => {
        const payments = tx.get('payments.json');
        const invoices = tx.get('invoices.json');
        const customers = tx.get('customers.json');
        const bankAccounts = tx.get('bank_accounts.json');

        const payment = payments.find((p) => p.id === paymentId || p.paymentNumber === paymentId);
        if (!payment) throw new Error(`Payment ${paymentId} not found.`);
        if (payment.status === 'Reversed') throw new Error(`Payment is already reversed.`);

        for (const alloc of payment.allocations || []) {
          const inv = invoices.find((i) => i.id === alloc.invoiceId);
          if (inv) {
            inv.paidAmount = roundNumber(subtract(inv.paidAmount, alloc.amount));
            inv.outstandingAmount = roundNumber(subtract(inv.grandTotal, inv.paidAmount));
            inv.status = inv.outstandingAmount < inv.grandTotal ? 'Partially Paid' : 'Posted';
          }
        }

        const customer = customers.find((c) => c.id === payment.customerId);
        if (customer) {
          customer.balance = roundNumber(add(customer.balance || 0, payment.amount));
        }

        if (payment.bankAccountId) {
          const bank = bankAccounts.find((b) => b.id === payment.bankAccountId);
          if (bank) {
            bank.currentBalance = roundNumber(subtract(bank.currentBalance || 0, payment.amount));
          }
        }

        if (payment.journalEntryId) {
          await accountingEngine.reverseJournal(payment.journalEntryId, { reason, user });
        }

        payment.status = 'Reversed';
        payment.reversedAt = new Date().toISOString();
        payment.reversalReason = reason;

        tx.set('payments.json', payments);
        tx.set('invoices.json', invoices);
        tx.set('customers.json', customers);
        tx.set('bank_accounts.json', bankAccounts);

        await auditService.log({
          user,
          action: 'Reverse Payment',
          transactionType: 'PAYMENT',
          transactionId: payment.id,
          reason,
          sourceModule: 'Sales & Receivables'
        });

        return payment;
      }
    );
  }
}

export const paymentService = new PaymentService();
export default paymentService;
