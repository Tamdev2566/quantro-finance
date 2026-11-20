import { test, describe, before, beforeEach } from 'node:test';
import assert from 'node:assert';
import jsonStore from '../src/storage/jsonStore.js';
import currency from '../src/accounting/currency.js';
import taxEngine from '../src/accounting/taxEngine.js';
import accountingEngine from '../src/accounting/accountingEngine.js';
import invoiceService from '../src/services/invoiceService.js';
import paymentService from '../src/services/paymentService.js';
import creditNoteService from '../src/services/creditNoteService.js';
import vendorBillService from '../src/services/vendorBillService.js';
import vendorPaymentService from '../src/services/vendorPaymentService.js';
import expenseService from '../src/services/expenseService.js';
import bankingService from '../src/services/bankingService.js';
import reportService from '../src/services/reportService.js';
import periodService from '../src/services/periodService.js';

describe('Finance & Accounting Engine Core Tests', () => {

  test('Decimal-Safe Currency Math avoids floating point inaccuracies', () => {
    // 0.1 + 0.2 in JS float is 0.30000000000000004
    const sum = currency.add(0.1, 0.2);
    assert.strictEqual(currency.roundCurrency(sum, 2), '0.30');
    assert.strictEqual(currency.roundNumber(sum, 2), 0.3);

    const mult = currency.multiply(19.99, 3);
    assert.strictEqual(currency.roundNumber(mult, 2), 59.97);

    const div = currency.divide(100, 3);
    assert.strictEqual(currency.roundCurrency(div, 2), '33.33');
  });

  test('Tax Engine: Intra-State GST Calculation (CGST 9% + SGST 9%)', () => {
    const calc = taxEngine.calculateLineTax({
      quantity: 2,
      unitPrice: 5000,
      discountPercent: 10,
      taxRate: 18,
      isTaxInclusive: false,
      isInterState: false
    });

    // Line total: 2 * 5000 = 10,000
    // Discount 10%: 1,000
    // Taxable amount: 9,000
    // CGST 9%: 810
    // SGST 9%: 810
    // Total Tax: 1,620
    // Grand Total: 10,620
    assert.strictEqual(calc.lineTotal, 10000);
    assert.strictEqual(calc.discountAmount, 1000);
    assert.strictEqual(calc.taxableAmount, 9000);
    assert.strictEqual(calc.cgstAmount, 810);
    assert.strictEqual(calc.sgstAmount, 810);
    assert.strictEqual(calc.igstAmount, 0);
    assert.strictEqual(calc.totalTax, 1620);
    assert.strictEqual(calc.totalAmount, 10620);
  });

  test('Tax Engine: Inter-State GST Calculation (IGST 18%)', () => {
    const calc = taxEngine.calculateLineTax({
      quantity: 1,
      unitPrice: 20000,
      discountAmount: 2000,
      taxRate: 18,
      isTaxInclusive: false,
      isInterState: true
    });

    // Taxable: 18,000
    // IGST 18%: 3,240
    // Grand Total: 21,240
    assert.strictEqual(calc.taxableAmount, 18000);
    assert.strictEqual(calc.cgstAmount, 0);
    assert.strictEqual(calc.sgstAmount, 0);
    assert.strictEqual(calc.igstAmount, 3240);
    assert.strictEqual(calc.totalTax, 3240);
    assert.strictEqual(calc.totalAmount, 21240);
  });

  test('Tax Engine: Tax-Inclusive Pricing Calculation', () => {
    const calc = taxEngine.calculateLineTax({
      quantity: 1,
      unitPrice: 1180,
      discountPercent: 0,
      taxRate: 18,
      isTaxInclusive: true,
      isInterState: false
    });

    // Taxable: 1180 / 1.18 = 1000
    // Total Tax: 180 (CGST 90, SGST 90)
    // Grand Total: 1180
    assert.strictEqual(calc.taxableAmount, 1000);
    assert.strictEqual(calc.cgstAmount, 90);
    assert.strictEqual(calc.sgstAmount, 90);
    assert.strictEqual(calc.totalTax, 180);
    assert.strictEqual(calc.totalAmount, 1180);
  });

  test('Accounting Engine rejects unbalanced journal entries', async () => {
    await assert.rejects(
      async () => {
        await accountingEngine.postJournal({
          transactionType: 'MANUAL',
          description: 'Unbalanced test entry',
          lines: [
            { accountCode: '1010', debit: 500, credit: 0 },
            { accountCode: '4010', debit: 0, credit: 400 } // Unbalanced by 100
          ]
        });
      },
      /Journal is unbalanced/
    );
  });

  test('Accounting Engine rejects negative line amounts', async () => {
    await assert.rejects(
      async () => {
        await accountingEngine.postJournal({
          transactionType: 'MANUAL',
          description: 'Negative line test',
          lines: [
            { accountCode: '1010', debit: -500, credit: 0 },
            { accountCode: '4010', debit: 0, credit: -500 }
          ]
        });
      },
      /Line amount cannot be negative/
    );
  });

  test('Invoice Workflow: Create Draft -> Post -> Double-Entry Balances Checked', async () => {
    const inv = await invoiceService.create({
      customerId: 'CUST-001',
      invoiceDate: '2026-05-10',
      description: 'Consulting and Cloud Architecture',
      items: [
        {
          description: 'Senior System Architecture Consulting',
          quantity: 10,
          unitPrice: 10000,
          discountPercent: 5,
          taxRate: 18
        }
      ]
    });

    assert.strictEqual(inv.status, 'Draft');
    assert.strictEqual(inv.subtotal, 100000);
    assert.strictEqual(inv.totalDiscount, 5000);
    assert.strictEqual(inv.taxableTotal, 95000);
    // 95000 * 18% = 17100
    assert.strictEqual(inv.totalTax, 17100);
    assert.strictEqual(inv.grandTotal, 112100);

    // Post the invoice
    const { invoice: postedInv, journal } = await invoiceService.post(inv.id);
    assert.strictEqual(postedInv.status, 'Posted');
    assert.strictEqual(journal.totalDebit, journal.totalCredit);
    assert.strictEqual(journal.totalDebit, 112100);
  });

  test('Payment Workflow: Customer Payment Allocation and Balance Update', async () => {
    // Find customer and an unpaid invoice
    const invoices = invoiceService.getAll().filter((i) => i.status === 'Posted' && i.outstandingAmount > 0);
    assert.ok(invoices.length > 0, 'Should have at least one posted invoice');
    const targetInv = invoices[0];
    const initialOutstanding = targetInv.outstandingAmount;

    // Make partial payment of ₹50,000
    const payAmount = Math.min(50000, initialOutstanding);
    const payment = await paymentService.createPayment({
      customerId: targetInv.customerId,
      paymentMethod: 'Bank Transfer',
      bankAccountId: 'BANK-001',
      amount: payAmount,
      allocations: [{ invoiceId: targetInv.id, amount: payAmount }]
    });

    assert.strictEqual(payment.status, 'Posted');
    assert.strictEqual(payment.allocatedAmount, payAmount);

    // Verify invoice outstanding reduced
    const refreshedInv = invoiceService.getById(targetInv.id);
    assert.strictEqual(refreshedInv.paidAmount, payAmount);
    assert.strictEqual(refreshedInv.outstandingAmount, initialOutstanding - payAmount);
  });

  test('Credit Note Workflow: Reverses Revenue & Tax correctly', async () => {
    const invoices = invoiceService.getAll().filter((i) => i.status === 'Partially Paid' || i.status === 'Posted');
    const targetInv = invoices[0];

    const cn = await creditNoteService.createCreditNote({
      invoiceId: targetInv.id,
      reason: 'Quality discount adjustment',
      items: [
        {
          description: 'Adjustment',
          quantity: 1,
          unitPrice: 1000,
          taxRate: 18
        }
      ]
    });

    assert.strictEqual(cn.status, 'Posted');
    assert.strictEqual(cn.taxableTotal, 1000);
    assert.strictEqual(cn.totalTax, 180);
    assert.strictEqual(cn.grandTotal, 1180);
  });

  test('Vendor Bill Workflow: Bill -> Post -> Double-Entry AP Checked', async () => {
    const bill = await vendorBillService.create({
      vendorId: 'VEND-001',
      vendorBillNumber: `INV-VEND-${Date.now()}`,
      billDate: '2026-05-15',
      items: [
        {
          description: 'Office Server Equipment',
          quantity: 2,
          unitCost: 15000,
          unitPrice: 15000,
          taxRate: 18
        }
      ]
    });

    assert.strictEqual(bill.status, 'Draft');
    assert.strictEqual(bill.taxableTotal, 30000);
    assert.strictEqual(bill.totalTax, 5400);
    assert.strictEqual(bill.grandTotal, 35400);

    const { bill: postedBill, journal } = await vendorBillService.post(bill.id);
    assert.strictEqual(postedBill.status, 'Posted');
    assert.strictEqual(journal.totalDebit, journal.totalCredit);
    assert.strictEqual(journal.totalDebit, 35400);
  });

  test('Vendor Payment Workflow: Reduces AP and Bank balance', async () => {
    const bills = vendorBillService.getAll().filter((b) => b.status === 'Posted' && b.outstandingAmount > 0);
    const targetBill = bills[0];

    const pay = await vendorPaymentService.createPayment({
      vendorId: targetBill.vendorId,
      amount: 10000,
      paymentMethod: 'Bank Transfer',
      bankAccountId: 'BANK-001',
      allocations: [{ billId: targetBill.id, amount: 10000 }]
    });

    assert.strictEqual(pay.status, 'Posted');
    assert.strictEqual(pay.allocatedAmount, 10000);
  });

  test('Expense Workflow: Records direct operational expense with proper tax credit', async () => {
    const exp = await expenseService.create({
      category: 'Utilities & Internet',
      amount: 11800,
      taxRate: 18,
      isTaxInclusive: true,
      paymentMethod: 'Bank Transfer',
      bankAccountId: 'BANK-001',
      description: 'Fiber internet leased line for office'
    });

    assert.strictEqual(exp.status, 'Posted');
    assert.strictEqual(exp.taxableAmount, 10000);
    assert.strictEqual(exp.totalTax, 1800);
    assert.strictEqual(exp.totalAmount, 11800);
  });

  test('Bank Transfer: Moves funds with balanced journal entry', async () => {
    const transfer = await bankingService.transferFunds({
      fromAccountCode: '1020', // HDFC Bank
      toAccountCode: '1010',   // Petty Cash
      amount: 5000,
      description: 'Cash withdrawal for office petty expenses'
    });

    assert.strictEqual(transfer.amount, 5000);
    assert.strictEqual(transfer.journal.totalDebit, 5000);
    assert.strictEqual(transfer.journal.totalCredit, 5000);
  });

  test('Financial Reports: Trial Balance MUST be perfectly balanced (Debits = Credits)', () => {
    const tb = reportService.getTrialBalance();
    assert.strictEqual(tb.totals.isBalanced, true, 'Trial balance must be balanced');
    assert.strictEqual(
      tb.totals.periodDebit,
      tb.totals.periodCredit,
      `Period Debit (${tb.totals.periodDebit}) must equal Period Credit (${tb.totals.periodCredit})`
    );
  });

  test('Financial Reports: Balance Sheet Equation (Assets = Liabilities + Equity)', () => {
    const bs = reportService.getBalanceSheet();
    assert.strictEqual(bs.isBalanced, true, 'Balance sheet must balance: Assets = Liabilities + Equity');
    assert.strictEqual(
      bs.totalAssets,
      bs.totalLiabilitiesAndEquity,
      `Total Assets (${bs.totalAssets}) must equal Total Liabilities & Equity (${bs.totalLiabilitiesAndEquity})`
    );
  });

  test('Financial Reports: Profit & Loss Net Profit calculation', () => {
    const pnl = reportService.getProfitAndLoss();
    const expectedNet = pnl.revenue.total - pnl.totalExpenses;
    assert.strictEqual(pnl.netProfit, expectedNet);
  });

  test('Period Locking: Prevents posting into locked months', async () => {
    const periods = periodService.getPeriods();
    assert.ok(periods.length > 0);
    const p = periods[0];

    // Lock month '2026-06' (June 2026, inside FY 2026-2027)
    await periodService.toggleLockMonth(p.id, '2026-06', true);

    await assert.rejects(
      async () => {
        await accountingEngine.postJournal({
          postingDate: '2026-06-15',
          description: 'Attempt to post into locked month',
          lines: [
            { accountCode: '1010', debit: 100, credit: 0 },
            { accountCode: '4010', debit: 0, credit: 100 }
          ]
        });
      },
      /locked against mutations/
    );

    // Unlock month
    await periodService.toggleLockMonth(p.id, '2026-06', false);
  });

  test('Atomic Storage & Persistence across file reload', () => {
    const backup = jsonStore.createBackup();
    assert.ok(backup.backupId);
    assert.ok(backup.filesCount > 0);

    const reloadedAccounts = jsonStore.readSync('accounts.json');
    assert.ok(Array.isArray(reloadedAccounts));
    assert.ok(reloadedAccounts.length >= 20);
  });
});
