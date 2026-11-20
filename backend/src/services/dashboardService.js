import jsonStore from '../storage/jsonStore.js';
import reportService from './reportService.js';
import { roundNumber, add, subtract, toDecimal } from '../accounting/currency.js';

class DashboardService {
  getDateRange(filter = 'This Month', customStart = null, customEnd = null) {
    const now = new Date();
    let startDate = null;
    let endDate = now.toISOString().slice(0, 10);

    if (filter === 'Today') {
      startDate = endDate;
    } else if (filter === 'This Week') {
      const d = new Date(now);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      d.setDate(diff);
      startDate = d.toISOString().slice(0, 10);
    } else if (filter === 'This Month') {
      startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    } else if (filter === 'This Quarter') {
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = `${now.getFullYear()}-${String(quarter * 3 + 1).padStart(2, '0')}-01`;
    } else if (filter === 'This Financial Year') {
      const fiscalStartYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
      startDate = `${fiscalStartYear}-04-01`;
      endDate = `${fiscalStartYear + 1}-03-31`;
    } else if (filter === 'Custom' && customStart) {
      startDate = customStart;
      endDate = customEnd || endDate;
    }

    return { startDate, endDate };
  }

  getDashboardData({ filter = 'This Financial Year', customStart = null, customEnd = null } = {}) {
    const { startDate, endDate } = this.getDateRange(filter, customStart, customEnd);

    const pnl = reportService.getProfitAndLoss({ startDate, endDate });
    const gst = reportService.getGstSummary({ startDate, endDate });
    const recAging = reportService.getReceivablesAging();
    const payAging = reportService.getPayablesAging();
    const accounts = jsonStore.readSync('accounts.json') || [];
    const bankAccounts = jsonStore.readSync('bank_accounts.json') || [];
    const journals = jsonStore.readSync('journal_entries.json') || [];
    const expenses = jsonStore.readSync('expenses.json') || [];
    const invoices = jsonStore.readSync('invoices.json') || [];
    const customers = jsonStore.readSync('customers.json') || [];

    let cashBalance = toDecimal(0);
    let bankBalance = toDecimal(0);

    accounts.forEach((acc) => {
      if (acc.category === 'Cash') {
        cashBalance = add(cashBalance, acc.currentBalance || 0);
      } else if (acc.category === 'Bank') {
        bankBalance = add(bankBalance, acc.currentBalance || 0);
      }
    });

    const overdueReceivables = recAging.summary.days31To60 + recAging.summary.days61To90 + recAging.summary.days90Plus;
    const overduePayables = payAging.summary.days31To60 + payAging.summary.days61To90 + payAging.summary.days90Plus;

    const monthBuckets = {};
    const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    months.forEach((m) => {
      monthBuckets[m] = { month: m, income: 0, expenses: 0, profit: 0, cashIn: 0, cashOut: 0 };
    });

    journals
      .filter((j) => j.status === 'Posted')
      .forEach((j) => {
        const postDate = new Date(j.postingDate);
        const monthName = postDate.toLocaleString('default', { month: 'short' });
        if (monthBuckets[monthName]) {
          (j.lines || []).forEach((line) => {
            const acc = accounts.find((a) => a.code === line.accountCode);
            if (acc) {
              if (acc.type === 'Revenue') {
                const rev = (line.credit || 0) - (line.debit || 0);
                monthBuckets[monthName].income = roundNumber(add(monthBuckets[monthName].income, rev));
              } else if (acc.type === 'Expenses') {
                const exp = (line.debit || 0) - (line.credit || 0);
                monthBuckets[monthName].expenses = roundNumber(add(monthBuckets[monthName].expenses, exp));
              }

              if (acc.category === 'Cash' || acc.category === 'Bank') {
                if (line.debit > 0) monthBuckets[monthName].cashIn = roundNumber(add(monthBuckets[monthName].cashIn, line.debit));
                if (line.credit > 0) monthBuckets[monthName].cashOut = roundNumber(add(monthBuckets[monthName].cashOut, line.credit));
              }
            }
          });
          monthBuckets[monthName].profit = roundNumber(subtract(monthBuckets[monthName].income, monthBuckets[monthName].expenses));
        }
      });

    const expenseCategoryMap = {};
    pnl.operatingExpenses.items.forEach((item) => {
      const cat = item.category || 'Other';
      expenseCategoryMap[cat] = (expenseCategoryMap[cat] || 0) + item.amount;
    });
    if (pnl.costOfGoodsSold.total > 0) {
      expenseCategoryMap['Cost of Goods Sold'] = pnl.costOfGoodsSold.total;
    }
    const expenseCategoryBreakdown = Object.entries(expenseCategoryMap).map(([category, amount]) => ({
      category,
      amount: roundNumber(amount)
    }));

    const revenueCategoryMap = {};
    pnl.revenue.items.forEach((item) => {
      const cat = item.category || 'Sales';
      revenueCategoryMap[cat] = (revenueCategoryMap[cat] || 0) + item.amount;
    });
    const revenueCategoryBreakdown = Object.entries(revenueCategoryMap).map(([category, amount]) => ({
      category,
      amount: roundNumber(amount)
    }));

    const bankAccountBalances = bankAccounts.map((b) => ({
      id: b.id,
      accountName: b.accountName,
      bankName: b.bankName,
      accountNumber: b.accountNumber,
      currentBalance: b.currentBalance || 0
    }));

    const recentOrders = invoices.slice(0, 5).map((inv) => ({
      id: inv.invoiceNumber || inv.id,
      name: inv.customerName || 'Customer',
      amount: inv.totalAmount || 0,
      status: inv.status || 'Draft',
      date: inv.invoiceDate || inv.issueDate || ''
    }));

    const productMap = {};
    invoices.forEach((inv) => {
      (inv.items || inv.lineItems || []).forEach((item) => {
        const desc = item.description || 'General Item';
        if (!productMap[desc]) {
          productMap[desc] = { name: desc, orders: 0, revenue: 0 };
        }
        productMap[desc].orders += (item.quantity || 1);
        productMap[desc].revenue = roundNumber(add(productMap[desc].revenue, item.amount || ((item.quantity || 1) * (item.unitPrice || 0))));
      });
    });
    const topProducts = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    const locationMap = {};
    customers.forEach((c) => {
      const loc = c.state || 'Local';
      locationMap[loc] = (locationMap[loc] || 0) + 1;
    });
    const customersByLocation = Object.entries(locationMap).map(([location, count]) => ({ location, count }));

    return {
      filter,
      dateRange: { startDate, endDate },
      ordersCount: invoices.length,
      customersCount: customers.length,
      cards: {
        totalRevenue: pnl.revenue.total,
        totalExpenses: pnl.totalExpenses,
        netProfit: pnl.netProfit >= 0 ? pnl.netProfit : 0,
        netLoss: pnl.netProfit < 0 ? Math.abs(pnl.netProfit) : 0,
        cashBalance: roundNumber(cashBalance),
        bankBalance: roundNumber(bankBalance),
        totalReceivables: recAging.summary.totalOutstanding,
        totalPayables: payAging.summary.totalOutstanding,
        overdueReceivables: roundNumber(overdueReceivables),
        overduePayables: roundNumber(overduePayables),
        inputGst: gst.inputGst.total,
        outputGst: gst.outputGst.total,
        netTaxLiability: gst.netTaxLiability
      },
      visualizations: {
        monthlyTrend: Object.values(monthBuckets),
        receivableAging: [
          { name: '0-30 Days', value: recAging.summary.current },
          { name: '31-60 Days', value: recAging.summary.days31To60 },
          { name: '61-90 Days', value: recAging.summary.days61To90 },
          { name: '90+ Days', value: recAging.summary.days90Plus }
        ],
        payableAging: [
          { name: '0-30 Days', value: payAging.summary.current },
          { name: '31-60 Days', value: payAging.summary.days31To60 },
          { name: '61-90 Days', value: payAging.summary.days61To90 },
          { name: '90+ Days', value: payAging.summary.days90Plus }
        ],
        expenseCategoryBreakdown,
        revenueCategoryBreakdown,
        bankAccountBalances,
        recentOrders,
        topProducts,
        customersByLocation
      }
    };
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;
