import jsonStore from '../storage/jsonStore.js';
import { roundNumber, add, subtract, toDecimal } from '../accounting/currency.js';

class ReportService {
  getGeneralLedger({ accountCode = null, startDate = null, endDate = null } = {}) {
    const accounts = jsonStore.readSync('accounts.json') || [];
    const journals = jsonStore.readSync('journal_entries.json') || [];

    const targetAccounts = accountCode
      ? accounts.filter((a) => a.code === accountCode)
      : accounts;

    const ledgers = targetAccounts.map((acc) => {
      let runningBalance = toDecimal(acc.openingBalance || 0);
      const isDebitNormal = acc.type === 'Assets' || acc.type === 'Expenses';

      const entries = [];
      journals
        .filter((j) => j.status === 'Posted')
        .sort((a, b) => (a.postingDate || '').localeCompare(b.postingDate || ''))
        .forEach((j) => {
          if (startDate && j.postingDate < startDate) return;
          if (endDate && j.postingDate > endDate) return;

          (j.lines || []).forEach((line) => {
            if (line.accountCode === acc.code) {
              const debit = toDecimal(line.debit || 0);
              const credit = toDecimal(line.credit || 0);

              if (isDebitNormal) {
                runningBalance = add(runningBalance, subtract(debit, credit));
              } else {
                runningBalance = add(runningBalance, subtract(credit, debit));
              }

              entries.push({
                journalId: j.id,
                journalNumber: j.journalNumber,
                postingDate: j.postingDate,
                referenceNumber: j.referenceNumber,
                transactionType: j.transactionType,
                description: line.description || j.description,
                debit: roundNumber(debit),
                credit: roundNumber(credit),
                runningBalance: roundNumber(runningBalance)
              });
            }
          });
        });

      return {
        accountCode: acc.code,
        accountName: acc.name,
        accountType: acc.type,
        category: acc.category,
        openingBalance: acc.openingBalance || 0,
        closingBalance: roundNumber(runningBalance),
        totalDebit: roundNumber(entries.reduce((sum, e) => add(sum, e.debit), toDecimal(0))),
        totalCredit: roundNumber(entries.reduce((sum, e) => add(sum, e.credit), toDecimal(0))),
        entries
      };
    });

    return accountCode ? ledgers[0] || null : ledgers;
  }

  getTrialBalance({ startDate = null, endDate = null } = {}) {
    const accounts = jsonStore.readSync('accounts.json') || [];
    const journals = jsonStore.readSync('journal_entries.json') || [];

    let totalOpeningDebit = toDecimal(0);
    let totalOpeningCredit = toDecimal(0);
    let totalPeriodDebit = toDecimal(0);
    let totalPeriodCredit = toDecimal(0);
    let totalClosingDebit = toDecimal(0);
    let totalClosingCredit = toDecimal(0);

    const rows = accounts.map((acc) => {
      const isDebitNormal = acc.type === 'Assets' || acc.type === 'Expenses';
      let periodDebit = toDecimal(0);
      let periodCredit = toDecimal(0);

      journals
        .filter((j) => j.status === 'Posted')
        .forEach((j) => {
          if (startDate && j.postingDate < startDate) return;
          if (endDate && j.postingDate > endDate) return;

          (j.lines || []).forEach((line) => {
            if (line.accountCode === acc.code) {
              periodDebit = add(periodDebit, line.debit || 0);
              periodCredit = add(periodCredit, line.credit || 0);
            }
          });
        });

      const openingBal = toDecimal(acc.openingBalance || 0);
      let closingBal;
      if (isDebitNormal) {
        closingBal = add(openingBal, subtract(periodDebit, periodCredit));
      } else {
        closingBal = add(openingBal, subtract(periodCredit, periodDebit));
      }

      const openingDebit = isDebitNormal ? (openingBal.isGreaterThan(0) ? openingBal : toDecimal(0)) : toDecimal(0);
      const openingCredit = !isDebitNormal ? (openingBal.isGreaterThan(0) ? openingBal : toDecimal(0)) : toDecimal(0);

      const closingDebit = isDebitNormal
        ? (closingBal.isGreaterThan(0) ? closingBal : toDecimal(0))
        : (closingBal.isLessThan(0) ? closingBal.abs() : toDecimal(0));
      const closingCredit = !isDebitNormal
        ? (closingBal.isGreaterThan(0) ? closingBal : toDecimal(0))
        : (closingBal.isLessThan(0) ? closingBal.abs() : toDecimal(0));

      totalOpeningDebit = add(totalOpeningDebit, openingDebit);
      totalOpeningCredit = add(totalOpeningCredit, openingCredit);
      totalPeriodDebit = add(totalPeriodDebit, periodDebit);
      totalPeriodCredit = add(totalPeriodCredit, periodCredit);
      totalClosingDebit = add(totalClosingDebit, closingDebit);
      totalClosingCredit = add(totalClosingCredit, closingCredit);

      return {
        accountCode: acc.code,
        accountName: acc.name,
        accountType: acc.type,
        category: acc.category,
        openingDebit: roundNumber(openingDebit),
        openingCredit: roundNumber(openingCredit),
        periodDebit: roundNumber(periodDebit),
        periodCredit: roundNumber(periodCredit),
        closingDebit: roundNumber(closingDebit),
        closingCredit: roundNumber(closingCredit)
      };
    });

    return {
      rows,
      totals: {
        openingDebit: roundNumber(totalOpeningDebit),
        openingCredit: roundNumber(totalOpeningCredit),
        periodDebit: roundNumber(totalPeriodDebit),
        periodCredit: roundNumber(totalPeriodCredit),
        closingDebit: roundNumber(totalClosingDebit),
        closingCredit: roundNumber(totalClosingCredit),
        isBalanced: Math.abs(roundNumber(subtract(totalPeriodDebit, totalPeriodCredit))) < 0.01
      }
    };
  }

  getProfitAndLoss({ startDate = null, endDate = null } = {}) {
    const accounts = jsonStore.readSync('accounts.json') || [];
    const journals = jsonStore.readSync('journal_entries.json') || [];

    const accountTotals = {};
    accounts.forEach((a) => {
      accountTotals[a.code] = { debit: toDecimal(0), credit: toDecimal(0), account: a };
    });

    journals
      .filter((j) => j.status === 'Posted')
      .forEach((j) => {
        if (startDate && j.postingDate < startDate) return;
        if (endDate && j.postingDate > endDate) return;

        (j.lines || []).forEach((line) => {
          if (accountTotals[line.accountCode]) {
            accountTotals[line.accountCode].debit = add(accountTotals[line.accountCode].debit, line.debit || 0);
            accountTotals[line.accountCode].credit = add(accountTotals[line.accountCode].credit, line.credit || 0);
          }
        });
      });

    const revenueItems = [];
    const cogsItems = [];
    const operatingExpenseItems = [];

    let totalRevenue = toDecimal(0);
    let totalCogs = toDecimal(0);
    let totalOperatingExpenses = toDecimal(0);

    Object.values(accountTotals).forEach(({ debit, credit, account }) => {
      if (account.type === 'Revenue') {
        const netRev = subtract(credit, debit);
        if (!netRev.isZero()) {
          revenueItems.push({
            code: account.code,
            name: account.name,
            category: account.category,
            amount: roundNumber(netRev)
          });
          totalRevenue = add(totalRevenue, netRev);
        }
      } else if (account.type === 'Expenses') {
        const netExp = subtract(debit, credit);
        if (!netExp.isZero()) {
          if (account.category === 'Cost of Goods Sold' || account.code === '5010') {
            cogsItems.push({
              code: account.code,
              name: account.name,
              category: account.category,
              amount: roundNumber(netExp)
            });
            totalCogs = add(totalCogs, netExp);
          } else {
            operatingExpenseItems.push({
              code: account.code,
              name: account.name,
              category: account.category,
              amount: roundNumber(netExp)
            });
            totalOperatingExpenses = add(totalOperatingExpenses, netExp);
          }
        }
      }
    });

    const grossProfit = subtract(totalRevenue, totalCogs);
    const totalExpenses = add(totalCogs, totalOperatingExpenses);
    const netProfit = subtract(totalRevenue, totalExpenses);

    return {
      revenue: {
        items: revenueItems,
        total: roundNumber(totalRevenue)
      },
      costOfGoodsSold: {
        items: cogsItems,
        total: roundNumber(totalCogs)
      },
      grossProfit: roundNumber(grossProfit),
      operatingExpenses: {
        items: operatingExpenseItems,
        total: roundNumber(totalOperatingExpenses)
      },
      totalExpenses: roundNumber(totalExpenses),
      netProfit: roundNumber(netProfit),
      isProfitable: netProfit.isGreaterThanOrEqualTo(0)
    };
  }

  getBalanceSheet({ asOfDate = null } = {}) {
    const accounts = jsonStore.readSync('accounts.json') || [];
    const pnl = this.getProfitAndLoss({ endDate: asOfDate });
    const currentPeriodNetIncome = pnl.netProfit;

    const assets = {
      cashAndBank: [],
      receivables: [],
      otherCurrentAssets: [],
      fixedAssets: [],
      total: 0
    };

    const liabilities = {
      payables: [],
      taxLiabilities: [],
      otherLiabilities: [],
      total: 0
    };

    const equity = {
      items: [],
      currentPeriodProfit: currentPeriodNetIncome,
      total: 0
    };

    let totalAssets = toDecimal(0);
    let totalLiabilities = toDecimal(0);
    let totalEquity = toDecimal(0);

    accounts.forEach((acc) => {
      const bal = toDecimal(acc.currentBalance || 0);

      if (acc.type === 'Assets') {
        const item = { code: acc.code, name: acc.name, category: acc.category, balance: roundNumber(bal) };
        if (acc.category === 'Cash' || acc.category === 'Bank') {
          assets.cashAndBank.push(item);
        } else if (acc.category === 'Accounts Receivable') {
          assets.receivables.push(item);
        } else if (acc.category === 'Fixed Assets') {
          assets.fixedAssets.push(item);
        } else {
          assets.otherCurrentAssets.push(item);
        }
        totalAssets = add(totalAssets, bal);
      } else if (acc.type === 'Liabilities') {
        const item = { code: acc.code, name: acc.name, category: acc.category, balance: roundNumber(bal) };
        if (acc.category === 'Accounts Payable') {
          liabilities.payables.push(item);
        } else if (acc.category === 'Output GST') {
          liabilities.taxLiabilities.push(item);
        } else {
          liabilities.otherLiabilities.push(item);
        }
        totalLiabilities = add(totalLiabilities, bal);
      } else if (acc.type === 'Equity') {
        const item = { code: acc.code, name: acc.name, category: acc.category, balance: roundNumber(bal) };
        equity.items.push(item);
        totalEquity = add(totalEquity, bal);
      }
    });

    totalEquity = add(totalEquity, currentPeriodNetIncome);

    assets.total = roundNumber(totalAssets);
    liabilities.total = roundNumber(totalLiabilities);
    equity.total = roundNumber(totalEquity);

    const totalLiabilitiesAndEquity = roundNumber(add(totalLiabilities, totalEquity));
    const isBalanced = Math.abs(assets.total - totalLiabilitiesAndEquity) < 0.01;

    return {
      asOfDate: asOfDate || new Date().toISOString().slice(0, 10),
      assets,
      liabilities,
      equity,
      totalAssets: assets.total,
      totalLiabilities: liabilities.total,
      totalEquity: equity.total,
      totalLiabilitiesAndEquity,
      isBalanced
    };
  }

  getCashFlow({ startDate = null, endDate = null } = {}) {
    const journals = jsonStore.readSync('journal_entries.json') || [];
    const accounts = jsonStore.readSync('accounts.json') || [];

    const cashAccountCodes = accounts
      .filter((a) => a.category === 'Cash' || a.category === 'Bank')
      .map((a) => a.code);

    let operatingInflow = toDecimal(0);
    let operatingOutflow = toDecimal(0);
    let financingInflow = toDecimal(0);
    let financingOutflow = toDecimal(0);
    let investingInflow = toDecimal(0);
    let investingOutflow = toDecimal(0);

    journals
      .filter((j) => j.status === 'Posted')
      .forEach((j) => {
        if (startDate && j.postingDate < startDate) return;
        if (endDate && j.postingDate > endDate) return;

        (j.lines || []).forEach((line) => {
          if (cashAccountCodes.includes(line.accountCode)) {
            const isDebit = line.debit > 0;
            const amt = toDecimal(isDebit ? line.debit : line.credit);

            if (j.transactionType === 'PAYMENT' || j.sourceModule.includes('Sales')) {
              operatingInflow = add(operatingInflow, amt);
            } else if (j.transactionType === 'VENDOR_PAYMENT' || j.transactionType === 'EXPENSE') {
              operatingOutflow = add(operatingOutflow, amt);
            } else if (j.transactionType === 'CAPITAL') {
              if (isDebit) financingInflow = add(financingInflow, amt);
              else financingOutflow = add(financingOutflow, amt);
            } else {
              if (isDebit) operatingInflow = add(operatingInflow, amt);
              else operatingOutflow = add(operatingOutflow, amt);
            }
          }
        });
      });

    const netOperating = subtract(operatingInflow, operatingOutflow);
    const netInvesting = subtract(investingInflow, investingOutflow);
    const netFinancing = subtract(financingInflow, financingOutflow);
    const netCashFlow = add(netOperating, add(netInvesting, netFinancing));

    const currentCashTotal = accounts
      .filter((a) => cashAccountCodes.includes(a.code))
      .reduce((sum, a) => add(sum, a.currentBalance || 0), toDecimal(0));

    return {
      operatingActivities: {
        inflow: roundNumber(operatingInflow),
        outflow: roundNumber(operatingOutflow),
        net: roundNumber(netOperating)
      },
      investingActivities: {
        inflow: roundNumber(investingInflow),
        outflow: roundNumber(investingOutflow),
        net: roundNumber(netInvesting)
      },
      financingActivities: {
        inflow: roundNumber(financingInflow),
        outflow: roundNumber(financingOutflow),
        net: roundNumber(netFinancing)
      },
      netCashFlow: roundNumber(netCashFlow),
      closingCashBalance: roundNumber(currentCashTotal)
    };
  }

  getReceivablesAging({ asOfDate = null } = {}) {
    const invoices = jsonStore.readSync('invoices.json') || [];
    const customers = jsonStore.readSync('customers.json') || [];
    const reportDate = asOfDate ? new Date(asOfDate) : new Date();

    const customerMap = {};
    customers.forEach((c) => {
      customerMap[c.id] = {
        customerId: c.id,
        customerName: c.name,
        current: toDecimal(0),
        days31To60: toDecimal(0),
        days61To90: toDecimal(0),
        days90Plus: toDecimal(0),
        totalOutstanding: toDecimal(0),
        invoices: []
      };
    });

    invoices.forEach((inv) => {
      if (inv.status === 'Posted' || inv.status === 'Partially Paid') {
        const outstanding = toDecimal(inv.outstandingAmount || 0);
        if (outstanding.isGreaterThan(0)) {
          const invDate = new Date(inv.dueDate || inv.invoiceDate);
          const diffDays = Math.max(0, Math.floor((reportDate - invDate) / (1000 * 60 * 60 * 24)));

          const target = customerMap[inv.customerId] || {
            customerId: inv.customerId,
            customerName: inv.customerName,
            current: toDecimal(0),
            days31To60: toDecimal(0),
            days61To90: toDecimal(0),
            days90Plus: toDecimal(0),
            totalOutstanding: toDecimal(0),
            invoices: []
          };

          if (diffDays <= 30) {
            target.current = add(target.current, outstanding);
          } else if (diffDays <= 60) {
            target.days31To60 = add(target.days31To60, outstanding);
          } else if (diffDays <= 90) {
            target.days61To90 = add(target.days61To90, outstanding);
          } else {
            target.days90Plus = add(target.days90Plus, outstanding);
          }

          target.totalOutstanding = add(target.totalOutstanding, outstanding);
          target.invoices.push({
            invoiceNumber: inv.invoiceNumber,
            invoiceDate: inv.invoiceDate,
            dueDate: inv.dueDate,
            daysOverdue: diffDays,
            grandTotal: inv.grandTotal,
            outstandingAmount: roundNumber(outstanding)
          });

          customerMap[inv.customerId] = target;
        }
      }
    });

    let totalCurrent = toDecimal(0);
    let total31to60 = toDecimal(0);
    let total61to90 = toDecimal(0);
    let total90Plus = toDecimal(0);
    let grandTotal = toDecimal(0);

    const rows = Object.values(customerMap)
      .filter((c) => c.totalOutstanding.isGreaterThan(0))
      .map((c) => {
        totalCurrent = add(totalCurrent, c.current);
        total31to60 = add(total31to60, c.days31To60);
        total61to90 = add(total61to90, c.days61To90);
        total90Plus = add(total90Plus, c.days90Plus);
        grandTotal = add(grandTotal, c.totalOutstanding);

        return {
          customerId: c.customerId,
          customerName: c.customerName,
          current: roundNumber(c.current),
          days31To60: roundNumber(c.days31To60),
          days61To90: roundNumber(c.days61To90),
          days90Plus: roundNumber(c.days90Plus),
          totalOutstanding: roundNumber(c.totalOutstanding),
          invoices: c.invoices
        };
      });

    return {
      rows,
      summary: {
        current: roundNumber(totalCurrent),
        days31To60: roundNumber(total31to60),
        days61To90: roundNumber(total61to90),
        days90Plus: roundNumber(total90Plus),
        totalOutstanding: roundNumber(grandTotal)
      }
    };
  }

  getPayablesAging({ asOfDate = null } = {}) {
    const bills = jsonStore.readSync('vendor_bills.json') || [];
    const vendors = jsonStore.readSync('vendors.json') || [];
    const reportDate = asOfDate ? new Date(asOfDate) : new Date();

    const vendorMap = {};
    vendors.forEach((v) => {
      vendorMap[v.id] = {
        vendorId: v.id,
        vendorName: v.name,
        current: toDecimal(0),
        days31To60: toDecimal(0),
        days61To90: toDecimal(0),
        days90Plus: toDecimal(0),
        totalOutstanding: toDecimal(0),
        bills: []
      };
    });

    bills.forEach((b) => {
      if (b.status === 'Posted' || b.status === 'Partially Paid') {
        const outstanding = toDecimal(b.outstandingAmount || 0);
        if (outstanding.isGreaterThan(0)) {
          const bDate = new Date(b.dueDate || b.billDate);
          const diffDays = Math.max(0, Math.floor((reportDate - bDate) / (1000 * 60 * 60 * 24)));

          const target = vendorMap[b.vendorId] || {
            vendorId: b.vendorId,
            vendorName: b.vendorName,
            current: toDecimal(0),
            days31To60: toDecimal(0),
            days61To90: toDecimal(0),
            days90Plus: toDecimal(0),
            totalOutstanding: toDecimal(0),
            bills: []
          };

          if (diffDays <= 30) {
            target.current = add(target.current, outstanding);
          } else if (diffDays <= 60) {
            target.days31To60 = add(target.days31To60, outstanding);
          } else if (diffDays <= 90) {
            target.days61To90 = add(target.days61To90, outstanding);
          } else {
            target.days90Plus = add(target.days90Plus, outstanding);
          }

          target.totalOutstanding = add(target.totalOutstanding, outstanding);
          target.bills.push({
            billNumber: b.billNumber,
            billDate: b.billDate,
            dueDate: b.dueDate,
            daysOverdue: diffDays,
            grandTotal: b.grandTotal,
            outstandingAmount: roundNumber(outstanding)
          });

          vendorMap[b.vendorId] = target;
        }
      }
    });

    let totalCurrent = toDecimal(0);
    let total31to60 = toDecimal(0);
    let total61to90 = toDecimal(0);
    let total90Plus = toDecimal(0);
    let grandTotal = toDecimal(0);

    const rows = Object.values(vendorMap)
      .filter((v) => v.totalOutstanding.isGreaterThan(0))
      .map((v) => {
        totalCurrent = add(totalCurrent, v.current);
        total31to60 = add(total31to60, v.days31To60);
        total61to90 = add(total61to90, v.days61To90);
        total90Plus = add(total90Plus, v.days90Plus);
        grandTotal = add(grandTotal, v.totalOutstanding);

        return {
          vendorId: v.vendorId,
          vendorName: v.vendorName,
          current: roundNumber(v.current),
          days31To60: roundNumber(v.days31To60),
          days61To90: roundNumber(v.days61To90),
          days90Plus: roundNumber(v.days90Plus),
          totalOutstanding: roundNumber(v.totalOutstanding),
          bills: v.bills
        };
      });

    return {
      rows,
      summary: {
        current: roundNumber(totalCurrent),
        days31To60: roundNumber(total31to60),
        days61To90: roundNumber(total61to90),
        days90Plus: roundNumber(total90Plus),
        totalOutstanding: roundNumber(grandTotal)
      }
    };
  }

  getGstSummary({ startDate = null, endDate = null } = {}) {
    const taxRecords = jsonStore.readSync('tax_records.json') || [];

    let inputCgst = toDecimal(0);
    let inputSgst = toDecimal(0);
    let inputIgst = toDecimal(0);
    let outputCgst = toDecimal(0);
    let outputSgst = toDecimal(0);
    let outputIgst = toDecimal(0);

    taxRecords.forEach((r) => {
      if (startDate && r.date < startDate) return;
      if (endDate && r.date > endDate) return;

      const cgst = toDecimal(r.cgst || 0);
      const sgst = toDecimal(r.sgst || 0);
      const igst = toDecimal(r.igst || 0);

      if (r.direction === 'INPUT' || r.direction === 'OUTPUT_REVERSAL') {
        inputCgst = add(inputCgst, cgst);
        inputSgst = add(inputSgst, sgst);
        inputIgst = add(inputIgst, igst);
      } else if (r.direction === 'OUTPUT' || r.direction === 'INPUT_REVERSAL') {
        outputCgst = add(outputCgst, cgst);
        outputSgst = add(outputSgst, sgst);
        outputIgst = add(outputIgst, igst);
      }
    });

    const totalInputGst = add(inputCgst, add(inputSgst, inputIgst));
    const totalOutputGst = add(outputCgst, add(outputSgst, outputIgst));
    const netTaxLiability = subtract(totalOutputGst, totalInputGst);

    return {
      inputGst: {
        cgst: roundNumber(inputCgst),
        sgst: roundNumber(inputSgst),
        igst: roundNumber(inputIgst),
        total: roundNumber(totalInputGst)
      },
      outputGst: {
        cgst: roundNumber(outputCgst),
        sgst: roundNumber(outputSgst),
        igst: roundNumber(outputIgst),
        total: roundNumber(totalOutputGst)
      },
      netTaxLiability: roundNumber(netTaxLiability),
      isRefundable: netTaxLiability.isLessThan(0),
      records: taxRecords
    };
  }
}

export const reportService = new ReportService();
export default reportService;
