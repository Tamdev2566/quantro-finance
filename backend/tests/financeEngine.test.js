import { test, describe, before, after, beforeEach } from 'node:test';
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

  before(async () => {
    const customers = jsonStore.readSync('customers.json') || [];
    if (!customers.find((c) => c.id === 'CUST-001')) {
      customers.push({
        id: 'CUST-001',
        name: 'Test Customer Acme',
        state: 'Maharashtra',
        stateCode: '27',
        gstin: '27AAACA9999P1ZV',
        balance: 0,
        isActive: true
      });
      jsonStore.writeSync('customers.json', customers);
    }

    const vendors = jsonStore.readSync('vendors.json') || [];
    if (!vendors.find((v) => v.id === 'VEND-001')) {
      vendors.push({
        id: 'VEND-001',
        name: 'Test Vendor InfraSpace',
        state: 'Maharashtra',
        stateCode: '27',
        gstin: '27AAGCI3321L1Z9',
        balance: 0,
        isActive: true
      });
      jsonStore.writeSync('vendors.json', vendors);
    }

    const bankAccounts = jsonStore.readSync('bank_accounts.json') || [];
    if (!bankAccounts.find((b) => b.id === 'BANK-001')) {
      bankAccounts.push({
        id: 'BANK-001',
        accountName: 'Test Bank Account',
        accountNumber: '50200012345678',
        bankName: 'Test Bank',
        ifsc: 'HDFC0000060',
        branch: 'Fort, Mumbai',
        ledgerAccountCode: '1020',
        currentBalance: 500000,
        isActive: true
      });
      jsonStore.writeSync('bank_accounts.json', bankAccounts);
    }
  });

  after(async () => {
    jsonStore.writeSync('customers.json', []);
    jsonStore.writeSync('vendors.json', []);
    jsonStore.writeSync('bank_accounts.json', []);
    jsonStore.writeSync('invoices.json', []);
    jsonStore.writeSync('invoice_items.json', []);
    jsonStore.writeSync('payments.json', []);
    jsonStore.writeSync('credit_notes.json', []);
    jsonStore.writeSync('vendor_bills.json', []);
    jsonStore.writeSync('vendor_payments.json', []);
    jsonStore.writeSync('debit_notes.json', []);
    jsonStore.writeSync('expenses.json', []);
    jsonStore.writeSync('journal_entries.json', []);
    jsonStore.writeSync('tax_records.json', []);
    jsonStore.writeSync('bank_transactions.json', []);
    jsonStore.writeSync('reconciliations.json', []);
    jsonStore.writeSync('recurring_transactions.json', []);
    jsonStore.writeSync('budgets.json', []);
    jsonStore.writeSync('opening_balances.json', []);
    jsonStore.writeSync('audit_logs.json', []);
    const cleanAccounts = (jsonStore.readSync('accounts.json') || []).map((a) => ({
      ...a,
      openingBalance: 0,
      currentBalance: 0
    }));
    jsonStore.writeSync('accounts.json', cleanAccounts);
    jsonStore.writeSync('transaction_sequences.json', {
      INV: 1000,
      CN: 100,
      BILL: 500,
      DN: 100,
      PAY: 1000,
      VPAY: 500,
      EXP: 200,
      JE: 1000,
      TXN: 1000,
      REC: 100
    });
  });

  test('Decimal-Safe Currency Math avoids floating point inaccuracies', () => {
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
            { accountCode: '4010', debit: 0, credit: 400 }
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
    assert.strictEqual(inv.totalTax, 17100);
    assert.strictEqual(inv.grandTotal, 112100);

    const { invoice: postedInv, journal } = await invoiceService.post(inv.id);
    assert.strictEqual(postedInv.status, 'Posted');
    assert.strictEqual(journal.totalDebit, journal.totalCredit);
    assert.strictEqual(journal.totalDebit, 112100);
  });

  test('Payment Workflow: Customer Payment Allocation and Balance Update', async () => {
    const invoices = invoiceService.getAll().filter((i) => i.status === 'Posted' && i.outstandingAmount > 0);
    assert.ok(invoices.length > 0, 'Should have at least one posted invoice');
    const targetInv = invoices[0];
    const initialOutstanding = targetInv.outstandingAmount;

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
      fromAccountCode: '1020',
      toAccountCode: '1010',
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
