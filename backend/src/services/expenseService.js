import jsonStore from '../storage/jsonStore.js';
import sequenceService from './sequenceService.js';
import auditService from './auditService.js';
import accountingEngine from '../accounting/accountingEngine.js';
import taxEngine from '../accounting/taxEngine.js';
import { roundNumber, add, subtract } from '../accounting/currency.js';
import { v4 as uuidv4 } from 'uuid';

export const EXPENSE_CATEGORIES = [
  { name: 'Rent', defaultAccountCode: '5120' },
  { name: 'Salaries & Payroll', defaultAccountCode: '5110' },
  { name: 'Utilities & Internet', defaultAccountCode: '5130' },
  { name: 'Travel & Conveyance', defaultAccountCode: '5140' },
  { name: 'Office Supplies', defaultAccountCode: '5150' },
  { name: 'Marketing & Ads', defaultAccountCode: '5160' },
  { name: 'Bank Charges & Fees', defaultAccountCode: '5170' },
  { name: 'Software & SaaS', defaultAccountCode: '5150' },
  { name: 'Insurance & Licenses', defaultAccountCode: '5990' },
  { name: 'Repairs & Maintenance', defaultAccountCode: '5990' },
  { name: 'Other Operating Expenses', defaultAccountCode: '5990' }
];

class ExpenseService {
  getAll() {
    return jsonStore.readSync('expenses.json') || [];
  }

  getById(id) {
    const list = this.getAll();
    return list.find((e) => e.id === id || e.expenseNumber === id);
  }

  getCategories() {
    return EXPENSE_CATEGORIES;
  }

  async create(expenseData, user = 'System User') {
    if (!expenseData.amount || expenseData.amount <= 0) {
      throw new Error('Expense amount must be greater than zero.');
    }

    const expenseNumber = await sequenceService.getNextNumber('EXP');
    const company = jsonStore.readSync('company.json');

    // Tax calculation
    const taxRate = expenseData.taxRate || 0;
    const taxCalculation = taxEngine.calculateLineTax({
      quantity: 1,
      unitPrice: expenseData.amount,
      discountAmount: expenseData.discount || 0,
      taxRate,
      isTaxInclusive: Boolean(expenseData.isTaxInclusive),
      isInterState: Boolean(expenseData.isInterState)
    });

    const isPaid = expenseData.isPaid !== undefined ? expenseData.isPaid : true;
    const paymentMethod = expenseData.paymentMethod || 'Bank Transfer';
    const expenseDate = expenseData.expenseDate || new Date().toISOString().slice(0, 10);

    const expenseRecord = {
      id: uuidv4(),
      expenseNumber,
      expenseDate,
      category: expenseData.category || 'Office Supplies',
      accountCode: expenseData.accountCode || '5150',
      vendorName: expenseData.vendorName || '',
      description: expenseData.description || `${expenseData.category || 'Expense'} expense`,
      isPaid,
      paymentMethod,
      bankAccountId: expenseData.bankAccountId || null,
      paymentAccountCode: paymentMethod === 'Cash' ? '1010' : (expenseData.paymentAccountCode || '1020'),
      isTaxInclusive: Boolean(expenseData.isTaxInclusive),
      isInterState: Boolean(expenseData.isInterState),
      taxRate: Number(taxRate),
      taxableAmount: taxCalculation.taxableAmount,
      cgstAmount: taxCalculation.cgstAmount,
      sgstAmount: taxCalculation.sgstAmount,
      igstAmount: taxCalculation.igstAmount,
      totalTax: taxCalculation.totalTax,
      totalAmount: taxCalculation.totalAmount,
      isItcEligible: expenseData.isItcEligible !== undefined ? expenseData.isItcEligible : true,
      reference: expenseData.reference || '',
      notes: expenseData.notes || '',
      status: expenseData.status || 'Posted', // can be Draft, Approved, Posted
      createdBy: user,
      createdAt: new Date().toISOString()
    };

    // If status is Posted, generate double entry journal immediately
    let journal = null;
    if (expenseRecord.status === 'Posted') {
      const journalLines = [
        {
          accountCode: expenseRecord.accountCode,
          debit: expenseRecord.taxableAmount,
          credit: 0,
          description: `${expenseRecord.category}: ${expenseRecord.description}`
        }
      ];

      // Add Input GST lines if tax exists & ITC is eligible
      if (expenseRecord.isItcEligible) {
        if (expenseRecord.cgstAmount > 0) {
          journalLines.push({
            accountCode: '1610',
            debit: expenseRecord.cgstAmount,
            credit: 0,
            description: `Input CGST on ${expenseRecord.expenseNumber}`
          });
        }
        if (expenseRecord.sgstAmount > 0) {
          journalLines.push({
            accountCode: '1620',
            debit: expenseRecord.sgstAmount,
            credit: 0,
            description: `Input SGST on ${expenseRecord.expenseNumber}`
          });
        }
        if (expenseRecord.igstAmount > 0) {
          journalLines.push({
            accountCode: '1630',
            debit: expenseRecord.igstAmount,
            credit: 0,
            description: `Input IGST on ${expenseRecord.expenseNumber}`
          });
        }
      } else if (expenseRecord.totalTax > 0) {
        // If ITC is ineligible, capitalize tax into expense
        journalLines[0].debit = expenseRecord.totalAmount;
      }

      // Credit line: Bank/Cash if paid, or Accrued Expenses (2300) if unpaid
      const creditCode = isPaid ? expenseRecord.paymentAccountCode : '2300';
      journalLines.push({
        accountCode: creditCode,
        debit: 0,
        credit: expenseRecord.totalAmount,
        description: isPaid
          ? `Payment for ${expenseRecord.expenseNumber} via ${paymentMethod}`
          : `Accrual for ${expenseRecord.expenseNumber}`
      });

      journal = await accountingEngine.postJournal({
        transactionDate: expenseDate,
        postingDate: expenseDate,
        referenceNumber: expenseNumber,
        transactionType: 'EXPENSE',
        description: `Expense ${expenseNumber} (${expenseRecord.category}): ${expenseRecord.description}`,
        sourceModule: 'Expenses',
        lines: journalLines,
        createdBy: user,
        status: 'Posted'
      });

      expenseRecord.journalEntryId = journal.id;
    }

    try {
      await jsonStore.transaction(
        ['expenses.json', 'bank_accounts.json', 'bank_transactions.json', 'tax_records.json'],
        async (tx) => {
          const expenses = tx.get('expenses.json') || [];
          const bankAccounts = tx.get('bank_accounts.json');
          const bankTransactions = tx.get('bank_transactions.json') || [];
          const taxRecords = tx.get('tax_records.json') || [];

          if (isPaid && expenseRecord.paymentAccountCode !== '1010') {
            const bank = bankAccounts.find(
              (b) => b.id === expenseRecord.bankAccountId || b.ledgerAccountCode === expenseRecord.paymentAccountCode
            );
            if (bank) {
              bank.currentBalance = roundNumber(subtract(bank.currentBalance || 0, expenseRecord.totalAmount));
              bankTransactions.push({
                id: uuidv4(),
                bankAccountId: bank.id,
                accountNumber: bank.accountNumber,
                date: expenseDate,
                type: 'DEBIT',
                amount: expenseRecord.totalAmount,
                reference: expenseNumber,
                description: `${expenseRecord.category} - ${expenseRecord.vendorName || expenseRecord.description}`,
                runningBalance: bank.currentBalance,
                reconciled: false,
                sourceModule: 'Expense',
                linkedId: expenseNumber
              });
              tx.set('bank_transactions.json', bankTransactions);
              tx.set('bank_accounts.json', bankAccounts);
            }
          }

          if (expenseRecord.totalTax > 0 && expenseRecord.isItcEligible) {
            taxRecords.push({
              id: uuidv4(),
              transactionType: 'EXPENSE',
              transactionId: expenseRecord.id,
              referenceNumber: expenseNumber,
              date: expenseDate,
              partyName: expenseRecord.vendorName || 'General Payee',
              partyGstin: '',
              taxType: expenseRecord.isInterState ? 'INTER' : 'INTRA',
              taxableAmount: expenseRecord.taxableAmount,
              cgst: expenseRecord.cgstAmount,
              sgst: expenseRecord.sgstAmount,
              igst: expenseRecord.igstAmount,
              totalTax: expenseRecord.totalTax,
              direction: 'INPUT'
            });
            tx.set('tax_records.json', taxRecords);
          }

          expenses.push(expenseRecord);
          tx.set('expenses.json', expenses);
        }
      );
    } catch (err) {
      if (journal) {
        await accountingEngine.reverseJournal(journal.id, { reason: 'Rollback expense post', user });
      }
      throw err;
    }

    await auditService.log({
      user,
      action: 'Record Expense',
      transactionType: 'EXPENSE',
      transactionId: expenseRecord.id,
      afterValues: { expenseNumber, totalAmount: expenseRecord.totalAmount, category: expenseRecord.category },
      sourceModule: 'Expenses'
    });

    return expenseRecord;
  }
}

export const expenseService = new ExpenseService();
export default expenseService;
