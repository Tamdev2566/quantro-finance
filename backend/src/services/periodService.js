import jsonStore from '../storage/jsonStore.js';
import auditService from './auditService.js';
import accountingEngine from '../accounting/accountingEngine.js';
import sequenceService from './sequenceService.js';
import { roundNumber, add, subtract, toDecimal } from '../accounting/currency.js';
import { v4 as uuidv4 } from 'uuid';

class PeriodService {
  getPeriods() {
    return jsonStore.readSync('periods.json') || [];
  }

  async createPeriod({ name, startDate, endDate }, user = 'System User') {
    if (!name || !startDate || !endDate) {
      throw new Error('Period name, start date, and end date are required.');
    }

    return jsonStore.transaction(['periods.json'], async (tx) => {
      const periods = tx.get('periods.json') || [];
      const newPeriod = {
        id: `FY-${name.replace(/\s+/g, '')}`,
        name,
        startDate,
        endDate,
        isClosed: false,
        lockedMonths: []
      };

      periods.push(newPeriod);
      tx.set('periods.json', periods);

      await auditService.log({
        user,
        action: 'Create Financial Period',
        transactionType: 'PERIOD',
        transactionId: newPeriod.id,
        afterValues: newPeriod,
        sourceModule: 'Accounting'
      });

      return newPeriod;
    });
  }

  async toggleLockMonth(periodId, monthStr, lock = true, user = 'System User') {
    return jsonStore.transaction(['periods.json'], async (tx) => {
      const periods = tx.get('periods.json');
      const period = periods.find((p) => p.id === periodId);
      if (!period) throw new Error(`Period ${periodId} not found.`);

      period.lockedMonths = period.lockedMonths || [];
      if (lock) {
        if (!period.lockedMonths.includes(monthStr)) {
          period.lockedMonths.push(monthStr);
        }
      } else {
        period.lockedMonths = period.lockedMonths.filter((m) => m !== monthStr);
      }

      tx.set('periods.json', periods);

      await auditService.log({
        user,
        action: lock ? 'Lock Month' : 'Unlock Month',
        transactionType: 'PERIOD',
        transactionId: periodId,
        afterValues: { lockedMonths: period.lockedMonths },
        reason: `Month ${monthStr} ${lock ? 'locked' : 'unlocked'}`,
        sourceModule: 'Accounting'
      });

      return period;
    });
  }

  async closeFiscalYear(periodId, user = 'System User') {
    return jsonStore.transaction(
      ['periods.json', 'accounts.json', 'journal_entries.json'],
      async (tx) => {
        const periods = tx.get('periods.json');
        const period = periods.find((p) => p.id === periodId);
        if (!period) throw new Error(`Period ${periodId} not found.`);
        if (period.isClosed) throw new Error(`Period ${period.name} is already closed.`);

        const accounts = tx.get('accounts.json');
        const journals = tx.get('journal_entries.json');

        let totalRevenue = toDecimal(0);
        let totalExpense = toDecimal(0);
        const closingLines = [];

        accounts.forEach((acc) => {
          if (acc.type === 'Revenue' && acc.currentBalance !== 0) {
            closingLines.push({
              accountCode: acc.code,
              debit: Math.abs(acc.currentBalance),
              credit: 0,
              description: `Closing revenue account ${acc.name} to Retained Earnings`
            });
            totalRevenue = add(totalRevenue, acc.currentBalance);
          } else if (acc.type === 'Expenses' && acc.currentBalance !== 0) {
            closingLines.push({
              accountCode: acc.code,
              debit: 0,
              credit: Math.abs(acc.currentBalance),
              description: `Closing expense account ${acc.name} to Retained Earnings`
            });
            totalExpense = add(totalExpense, acc.currentBalance);
          }
        });

        const netProfit = subtract(totalRevenue, totalExpense);

        if (closingLines.length === 0) {
          throw new Error('No revenue or expense activity to close.');
        }

        if (netProfit.isGreaterThan(0)) {
          closingLines.push({
            accountCode: '3020',
            debit: 0,
            credit: roundNumber(netProfit),
            description: `Year-end net profit transferred to Retained Earnings for ${period.name}`
          });
        } else if (netProfit.isLessThan(0)) {
          closingLines.push({
            accountCode: '3020',
            debit: roundNumber(netProfit.abs()),
            credit: 0,
            description: `Year-end net loss transferred from Retained Earnings for ${period.name}`
          });
        }

        const journal = await accountingEngine.postJournal({
          transactionDate: period.endDate,
          postingDate: period.endDate,
          referenceNumber: `CLOSE-${period.name}`,
          transactionType: 'YEAR_END_CLOSE',
          description: `Year-End Close for ${period.name} transferring net profit/loss to Retained Earnings`,
          sourceModule: 'Accounting',
          lines: closingLines,
          createdBy: user,
          status: 'Posted'
        });

        period.isClosed = true;
        period.closedAt = new Date().toISOString();
        period.closingJournalId = journal.id;
        tx.set('periods.json', periods);

        await auditService.log({
          user,
          action: 'Close Fiscal Year',
          transactionType: 'PERIOD',
          transactionId: period.id,
          afterValues: { netProfit: roundNumber(netProfit), journalId: journal.id },
          sourceModule: 'Accounting'
        });

        return { period, journal, netProfit: roundNumber(netProfit) };
      }
    );
  }
}

export const periodService = new PeriodService();
export default periodService;
