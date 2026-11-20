import { toDecimal, add, subtract, roundNumber, isZero } from './currency.js';
import jsonStore from '../storage/jsonStore.js';
import sequenceService from '../services/sequenceService.js';
import auditService from '../services/auditService.js';
import { v4 as uuidv4 } from 'uuid';

class AccountingEngine {
  /**
   * Validate double entry balance and accounts
   */
  validateJournal(lines, { accountsMap, postingDate, periods }) {
    if (!lines || lines.length < 2) {
      throw new Error('A journal entry must contain at least 2 lines.');
    }

    // Check locked period
    if (postingDate && periods) {
      this.checkPeriodLock(postingDate, periods);
    }

    let totalDebit = toDecimal(0);
    let totalCredit = toDecimal(0);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const debit = toDecimal(line.debit || 0);
      const credit = toDecimal(line.credit || 0);

      if (debit.isLessThan(0) || credit.isLessThan(0)) {
        throw new Error(`Line ${i + 1}: Line amount cannot be negative.`);
      }
      if (debit.isZero() && credit.isZero()) {
        throw new Error(`Line ${i + 1}: Either debit or credit must be greater than zero.`);
      }
      if (!debit.isZero() && !credit.isZero()) {
        throw new Error(`Line ${i + 1}: A line cannot contain both debit and credit.`);
      }

      const account = accountsMap[line.accountCode];
      if (!account) {
        throw new Error(`Line ${i + 1}: Account code '${line.accountCode}' does not exist.`);
      }
      if (!account.isActive) {
        throw new Error(`Line ${i + 1}: Account '${account.name}' (${line.accountCode}) is deactivated.`);
      }

      totalDebit = add(totalDebit, debit);
      totalCredit = add(totalCredit, credit);
    }

    const diff = subtract(totalDebit, totalCredit).abs();
    if (diff.isGreaterThan(0.01)) {
      throw new Error(`Journal is unbalanced! Total Debits (${roundNumber(totalDebit)}) != Total Credits (${roundNumber(totalCredit)}). Difference: ${roundNumber(diff)}`);
    }

    return {
      totalDebit: roundNumber(totalDebit),
      totalCredit: roundNumber(totalCredit)
    };
  }

  /**
   * Checks whether postingDate falls into a locked period or closed fiscal year
   */
  checkPeriodLock(postingDate, periods) {
    const postTime = new Date(postingDate).getTime();
    const postMonthStr = postingDate.slice(0, 7); // e.g. "2026-04"

    for (const period of periods) {
      const start = new Date(period.startDate).getTime();
      const end = new Date(period.endDate).getTime();

      if (postTime >= start && postTime <= end) {
        if (period.isClosed) {
          throw new Error(`Financial period '${period.name}' is closed. Transactions cannot be posted.`);
        }
        if (period.lockedMonths && period.lockedMonths.includes(postMonthStr)) {
          throw new Error(`Posting period for month '${postMonthStr}' is locked against mutations.`);
        }
      }
    }
  }

  /**
   * Recalculates account balances based on all POSTED journal lines + opening balances
   */
  recomputeAccountBalances(accounts, journals) {
    const balanceMap = {};
    accounts.forEach((acc) => {
      balanceMap[acc.code] = {
        debitSum: toDecimal(0),
        creditSum: toDecimal(0),
        opening: toDecimal(acc.openingBalance || 0),
        type: acc.type
      };
    });

    journals.forEach((j) => {
      if (j.status === 'Posted') {
        (j.lines || []).forEach((line) => {
          if (balanceMap[line.accountCode]) {
            balanceMap[line.accountCode].debitSum = add(balanceMap[line.accountCode].debitSum, line.debit || 0);
            balanceMap[line.accountCode].creditSum = add(balanceMap[line.accountCode].creditSum, line.credit || 0);
          }
        });
      }
    });

    return accounts.map((acc) => {
      const b = balanceMap[acc.code];
      let currentBal;
      // Normal balance rules:
      // Assets and Expenses = Debit normal (Opening + Debit - Credit)
      // Liabilities, Equity, Revenue = Credit normal (Opening + Credit - Debit)
      if (acc.type === 'Assets' || acc.type === 'Expenses') {
        currentBal = add(b.opening, subtract(b.debitSum, b.creditSum));
      } else {
        currentBal = add(b.opening, subtract(b.creditSum, b.debitSum));
      }

      return {
        ...acc,
        currentBalance: roundNumber(currentBal)
      };
    });
  }

  /**
   * Post a journal entry and atomically update account balances
   */
  async postJournal({
    transactionDate = new Date().toISOString().slice(0, 10),
    postingDate = new Date().toISOString().slice(0, 10),
    referenceNumber = '',
    transactionType = 'MANUAL',
    description = '',
    sourceModule = 'General Ledger',
    lines = [],
    currency = 'INR',
    createdBy = 'System User',
    linkedTransactionId = null,
    status = 'Posted' // 'Draft' or 'Posted'
  }) {
    const journalNumber = await sequenceService.getNextNumber('JE');

    return jsonStore.transaction(['accounts.json', 'journal_entries.json', 'periods.json'], async (tx) => {
      const accounts = tx.get('accounts.json');
      const journals = tx.get('journal_entries.json');
      const periods = tx.get('periods.json');

      const accountsMap = {};
      accounts.forEach((a) => {
        accountsMap[a.code] = a;
      });

      // Enrich lines with account names
      const enrichedLines = lines.map((l) => ({
        accountCode: l.accountCode,
        accountName: accountsMap[l.accountCode] ? accountsMap[l.accountCode].name : '',
        debit: roundNumber(l.debit || 0),
        credit: roundNumber(l.credit || 0),
        description: l.description || description
      }));

      const { totalDebit, totalCredit } = this.validateJournal(enrichedLines, {
        accountsMap,
        postingDate,
        periods
      });

      const journalEntry = {
        id: uuidv4(),
        journalNumber,
        transactionDate,
        postingDate,
        referenceNumber,
        transactionType,
        description,
        sourceModule,
        lines: enrichedLines,
        totalDebit,
        totalCredit,
        currency,
        createdBy,
        createdDate: new Date().toISOString(),
        status,
        linkedTransactionId
      };

      journals.push(journalEntry);
      tx.set('journal_entries.json', journals);

      // If posting, update account current balances
      if (status === 'Posted') {
        const updatedAccounts = this.recomputeAccountBalances(accounts, journals);
        tx.set('accounts.json', updatedAccounts);
      }

      await auditService.log({
        user: createdBy,
        action: 'Post Journal',
        transactionType,
        transactionId: journalEntry.id,
        afterValues: { journalNumber, totalDebit, totalCredit, status },
        sourceModule
      });

      return journalEntry;
    });
  }

  /**
   * Reverse an existing posted journal entry
   */
  async reverseJournal(journalId, { reason = 'Correction Reversal', user = 'System User' } = {}) {
    return jsonStore.transaction(['accounts.json', 'journal_entries.json', 'periods.json'], async (tx) => {
      const journals = tx.get('journal_entries.json');
      const accounts = tx.get('accounts.json');
      const periods = tx.get('periods.json');

      const targetJournal = journals.find((j) => j.id === journalId);
      if (!targetJournal) {
        throw new Error(`Journal ${journalId} not found.`);
      }
      if (targetJournal.status !== 'Posted') {
        throw new Error(`Only posted journals can be reversed. Current status: ${targetJournal.status}`);
      }

      // Check current period lock
      const today = new Date().toISOString().slice(0, 10);
      this.checkPeriodLock(today, periods);

      // Create opposite lines (swap debit and credit)
      const reversalLines = targetJournal.lines.map((line) => ({
        accountCode: line.accountCode,
        accountName: line.accountName,
        debit: line.credit,
        credit: line.debit,
        description: `Reversal of ${targetJournal.journalNumber}: ${line.description || ''}`
      }));

      const reversalNumber = await sequenceService.getNextNumber('JE');
      const reversalEntry = {
        id: uuidv4(),
        journalNumber: reversalNumber,
        transactionDate: today,
        postingDate: today,
        referenceNumber: targetJournal.journalNumber,
        transactionType: 'REVERSAL',
        description: `Reversal of ${targetJournal.journalNumber} - Reason: ${reason}`,
        sourceModule: targetJournal.sourceModule,
        lines: reversalLines,
        totalDebit: targetJournal.totalCredit,
        totalCredit: targetJournal.totalDebit,
        currency: targetJournal.currency,
        createdBy: user,
        createdDate: new Date().toISOString(),
        status: 'Posted',
        linkedTransactionId: targetJournal.id
      };

      targetJournal.status = 'Reversed';
      targetJournal.reversalJournalId = reversalEntry.id;

      journals.push(reversalEntry);
      tx.set('journal_entries.json', journals);

      const updatedAccounts = this.recomputeAccountBalances(accounts, journals);
      tx.set('accounts.json', updatedAccounts);

      await auditService.log({
        user,
        action: 'Reverse Journal',
        transactionType: 'REVERSAL',
        transactionId: reversalEntry.id,
        beforeValues: { reversedJournal: targetJournal.journalNumber },
        afterValues: { reversalNumber, totalDebit: reversalEntry.totalDebit },
        reason,
        sourceModule: targetJournal.sourceModule
      });

      return reversalEntry;
    });
  }
}

export const accountingEngine = new AccountingEngine();
export default accountingEngine;
