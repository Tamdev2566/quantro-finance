import jsonStore from '../storage/jsonStore.js';
import auditService from './auditService.js';
import { roundNumber, subtract, divide, multiply, toDecimal } from '../accounting/currency.js';
import { v4 as uuidv4 } from 'uuid';

class BudgetService {
  getAll() {
    return jsonStore.readSync('budgets.json') || [];
  }

  getById(id) {
    const list = this.getAll();
    return list.find((b) => b.id === id);
  }

  async create(budgetData, user = 'System User') {
    if (!budgetData.name || !budgetData.accountCode || !budgetData.budgetAmount) {
      throw new Error('Budget name, account code, and budget amount are required.');
    }

    const accounts = jsonStore.readSync('accounts.json');
    const account = accounts.find((a) => a.code === budgetData.accountCode);
    if (!account) throw new Error(`Account '${budgetData.accountCode}' not found.`);

    const newBudget = {
      id: uuidv4(),
      name: budgetData.name.trim(),
      fiscalYear: budgetData.fiscalYear || '2026-2027',
      periodType: budgetData.periodType || 'Annual',
      month: budgetData.month || null,
      department: budgetData.department || 'General',
      accountCode: account.code,
      accountName: account.name,
      accountType: account.type,
      budgetAmount: roundNumber(budgetData.budgetAmount),
      notes: budgetData.notes || '',
      createdAt: new Date().toISOString(),
      createdBy: user
    };

    return jsonStore.transaction(['budgets.json'], async (tx) => {
      const budgets = tx.get('budgets.json') || [];
      budgets.push(newBudget);
      tx.set('budgets.json', budgets);

      await auditService.log({
        user,
        action: 'Create Budget',
        transactionType: 'BUDGET',
        transactionId: newBudget.id,
        afterValues: newBudget,
        sourceModule: 'Budget'
      });

      return newBudget;
    });
  }

  getBudgetVsActual(fiscalYear = '2026-2027') {
    const budgets = this.getAll().filter((b) => !fiscalYear || b.fiscalYear === fiscalYear);
    const journals = jsonStore.readSync('journal_entries.json') || [];

    const actualMap = {};
    journals.forEach((j) => {
      if (j.status === 'Posted') {
        (j.lines || []).forEach((line) => {
          actualMap[line.accountCode] = (actualMap[line.accountCode] || 0) + (line.debit || 0) - (line.credit || 0);
        });
      }
    });

    return budgets.map((b) => {
      let actual = actualMap[b.accountCode] || 0;
      if (b.accountType === 'Revenue') {
        actual = -actual;
      }
      actual = Math.max(0, roundNumber(actual));

      const variance = roundNumber(subtract(b.budgetAmount, actual));
      const variancePercent = b.budgetAmount > 0
        ? roundNumber(multiply(divide(variance, b.budgetAmount), 100))
        : 0;
      const isExceeded = actual > b.budgetAmount;

      return {
        ...b,
        actualAmount: actual,
        variance,
        variancePercent,
        isExceeded,
        warningMessage: isExceeded
          ? `Budget exceeded by ₹${roundNumber(actual - b.budgetAmount)} (${Math.abs(variancePercent)}%)`
          : 'Within budget'
      };
    });
  }
}

export const budgetService = new BudgetService();
export default budgetService;
