import jsonStore from '../storage/jsonStore.js';
import sequenceService from './sequenceService.js';
import auditService from './auditService.js';
import accountingEngine from '../accounting/accountingEngine.js';
import { roundNumber, add, subtract } from '../accounting/currency.js';
import { v4 as uuidv4 } from 'uuid';

class BankingService {
  getAccounts() {
    return jsonStore.readSync('bank_accounts.json') || [];
  }

  getAccountById(id) {
    const list = this.getAccounts();
    return list.find((b) => b.id === id);
  }

  getTransactions(bankAccountId = null) {
    const txns = jsonStore.readSync('bank_transactions.json') || [];
    if (bankAccountId) {
      return txns.filter((t) => t.bankAccountId === bankAccountId);
    }
    return txns;
  }

  getReconciliations(bankAccountId = null) {
    const recs = jsonStore.readSync('reconciliations.json') || [];
    if (bankAccountId) {
      return recs.filter((r) => r.bankAccountId === bankAccountId);
    }
    return recs;
  }

  async createAccount(data, user = 'System User') {
    if (!data.accountName || !data.accountNumber || !data.bankName) {
      throw new Error('Account name, account number, and bank name are required.');
    }

    return jsonStore.transaction(['bank_accounts.json', 'accounts.json'], async (tx) => {
      const bankAccounts = tx.get('bank_accounts.json');
      const accounts = tx.get('accounts.json');

      const id = `BANK-${Date.now().toString().slice(-4)}`;
      let ledgerCode = data.ledgerAccountCode;

      if (!ledgerCode) {
        ledgerCode = `10${bankAccounts.length + 2}0`;
        accounts.push({
          code: ledgerCode,
          name: `${data.bankName} - ${data.accountName}`,
          type: 'Assets',
          category: 'Bank',
          description: `Bank account ${data.accountNumber}`,
          isActive: true,
          isSystem: false,
          openingBalance: roundNumber(data.openingBalance || 0),
          currentBalance: roundNumber(data.openingBalance || 0)
        });
        tx.set('accounts.json', accounts);
      }

      const newBankAccount = {
        id,
        accountName: data.accountName.trim(),
        accountNumber: data.accountNumber.trim(),
        bankName: data.bankName.trim(),
        ifsc: (data.ifsc || '').trim().toUpperCase(),
        branch: data.branch || '',
        ledgerAccountCode: ledgerCode,
        currentBalance: roundNumber(data.openingBalance || 0),
        isActive: true
      };

      bankAccounts.push(newBankAccount);
      tx.set('bank_accounts.json', bankAccounts);

      await auditService.log({
        user,
        action: 'Create Bank Account',
        transactionType: 'BANK_ACCOUNT',
        transactionId: newBankAccount.id,
        afterValues: newBankAccount,
        sourceModule: 'Banking'
      });

      return newBankAccount;
    });
  }

  async transferFunds({
    fromAccountCode,
    toAccountCode,
    amount,
    date = new Date().toISOString().slice(0, 10),
    reference = '',
    description = '',
    user = 'System User'
  }) {
    const transferAmount = roundNumber(amount);
    if (transferAmount <= 0) throw new Error('Transfer amount must be greater than zero.');
    if (fromAccountCode === toAccountCode) throw new Error('Source and destination accounts must be different.');

    const txnNumber = await sequenceService.getNextNumber('TXN');

    const bankAccounts = this.getAccounts();
    const fromBank = bankAccounts.find((b) => b.id === fromAccountCode || b.ledgerAccountCode === fromAccountCode);
    const toBank = bankAccounts.find((b) => b.id === toAccountCode || b.ledgerAccountCode === toAccountCode);

    const fromLedger = fromBank ? fromBank.ledgerAccountCode : fromAccountCode;
    const toLedger = toBank ? toBank.ledgerAccountCode : toAccountCode;

    const journal = await accountingEngine.postJournal({
      transactionDate: date,
      postingDate: date,
      referenceNumber: txnNumber,
      transactionType: 'BANK_TRANSFER',
      description: description || `Internal fund transfer from ${fromLedger} to ${toLedger} (${reference})`,
      sourceModule: 'Banking',
      lines: [
        {
          accountCode: toLedger,
          debit: transferAmount,
          credit: 0,
          description: `Fund transfer receipt from ${fromLedger}`
        },
        {
          accountCode: fromLedger,
          debit: 0,
          credit: transferAmount,
          description: `Fund transfer payout to ${toLedger}`
        }
      ],
      createdBy: user,
      status: 'Posted'
    });

    try {
      await jsonStore.transaction(['bank_accounts.json', 'bank_transactions.json'], async (tx) => {
        const accountsList = tx.get('bank_accounts.json');
        const bankTransactions = tx.get('bank_transactions.json') || [];

        const fBank = accountsList.find((b) => b.id === fromAccountCode || b.ledgerAccountCode === fromAccountCode);
        const tBank = accountsList.find((b) => b.id === toAccountCode || b.ledgerAccountCode === toAccountCode);

        if (fBank) {
          fBank.currentBalance = roundNumber(subtract(fBank.currentBalance || 0, transferAmount));
          bankTransactions.push({
            id: uuidv4(),
            bankAccountId: fBank.id,
            accountNumber: fBank.accountNumber,
            date,
            type: 'DEBIT',
            amount: transferAmount,
            reference: txnNumber,
            description: `Transfer to ${tBank ? tBank.accountName : toLedger} (${reference})`,
            runningBalance: fBank.currentBalance,
            reconciled: false,
            sourceModule: 'Transfer Out',
            linkedId: txnNumber
          });
        }

        if (tBank) {
          tBank.currentBalance = roundNumber(add(tBank.currentBalance || 0, transferAmount));
          bankTransactions.push({
            id: uuidv4(),
            bankAccountId: tBank.id,
            accountNumber: tBank.accountNumber,
            date,
            type: 'CREDIT',
            amount: transferAmount,
            reference: txnNumber,
            description: `Transfer from ${fBank ? fBank.accountName : fromLedger} (${reference})`,
            runningBalance: tBank.currentBalance,
            reconciled: false,
            sourceModule: 'Transfer In',
            linkedId: txnNumber
          });
        }

        tx.set('bank_accounts.json', accountsList);
        tx.set('bank_transactions.json', bankTransactions);
      });
    } catch (err) {
      await accountingEngine.reverseJournal(journal.id, { reason: 'Rollback transfer failure', user });
      throw err;
    }

    await auditService.log({
      user,
      action: 'Bank Transfer',
      transactionType: 'BANK_TRANSFER',
      transactionId: txnNumber,
      afterValues: { fromLedger, toLedger, amount: transferAmount, journalId: journal.id },
      sourceModule: 'Banking'
    });

    return { txnNumber, journal, amount: transferAmount };
  }

  async reconcile({
    bankAccountId,
    periodStart,
    periodEnd,
    statementOpeningBalance,
    statementClosingBalance,
    matchedTransactionIds = [],
    adjustments = [],
    notes = '',
    user = 'System User'
  }) {
    const recNumber = await sequenceService.getNextNumber('REC');

    return jsonStore.transaction(['reconciliations.json', 'bank_transactions.json'], async (tx) => {
      const reconciliations = tx.get('reconciliations.json') || [];
      const bankTransactions = tx.get('bank_transactions.json') || [];

      let matchedCredits = 0;
      let matchedDebits = 0;

      bankTransactions.forEach((t) => {
        if (matchedTransactionIds.includes(t.id)) {
          t.reconciled = true;
          t.reconciledAt = new Date().toISOString();
          t.reconciliationId = recNumber;
          if (t.type === 'CREDIT') matchedCredits = roundNumber(add(matchedCredits, t.amount));
          if (t.type === 'DEBIT') matchedDebits = roundNumber(add(matchedDebits, t.amount));
        }
      });

      const calculatedBookClosing = roundNumber(add(statementOpeningBalance, subtract(matchedCredits, matchedDebits)));
      const difference = roundNumber(subtract(statementClosingBalance, calculatedBookClosing));

      const recRecord = {
        id: uuidv4(),
        reconciliationNumber: recNumber,
        bankAccountId,
        periodStart,
        periodEnd,
        statementOpeningBalance: roundNumber(statementOpeningBalance),
        statementClosingBalance: roundNumber(statementClosingBalance),
        matchedCredits,
        matchedDebits,
        calculatedBookClosing,
        difference,
        isBalanced: Math.abs(difference) < 0.01,
        matchedCount: matchedTransactionIds.length,
        matchedTransactionIds,
        adjustments,
        notes,
        completedAt: new Date().toISOString(),
        completedBy: user
      };

      reconciliations.push(recRecord);
      tx.set('reconciliations.json', reconciliations);
      tx.set('bank_transactions.json', bankTransactions);

      await auditService.log({
        user,
        action: 'Bank Reconciliation',
        transactionType: 'RECONCILIATION',
        transactionId: recRecord.id,
        afterValues: { recNumber, difference, matchedCount: recRecord.matchedCount },
        sourceModule: 'Banking'
      });

      return recRecord;
    });
  }
}

export const bankingService = new BankingService();
export default bankingService;
