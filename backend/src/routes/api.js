import express from 'express';
import accountService from '../services/accountService.js';
import accountingEngine from '../accounting/accountingEngine.js';
import invoiceService from '../services/invoiceService.js';
import paymentService from '../services/paymentService.js';
import creditNoteService from '../services/creditNoteService.js';
import vendorBillService from '../services/vendorBillService.js';
import vendorPaymentService from '../services/vendorPaymentService.js';
import debitNoteService from '../services/debitNoteService.js';
import expenseService from '../services/expenseService.js';
import bankingService from '../services/bankingService.js';
import budgetService from '../services/budgetService.js';
import reportService from '../services/reportService.js';
import dashboardService from '../services/dashboardService.js';
import periodService from '../services/periodService.js';
import settingsService from '../services/settingsService.js';
import auditService from '../services/auditService.js';
import customerService from '../services/customerService.js';
import vendorService from '../services/vendorService.js';
import authService from '../services/authService.js';
import jsonStore from '../storage/jsonStore.js';

const router = express.Router();

// Helper for async route handlers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ---------------- AUTHENTICATION ----------------
router.post('/auth/login', asyncHandler(async (req, res) => {
  const result = authService.login(req.body);
  res.json({ success: true, data: result });
}));

router.get('/auth/users', asyncHandler(async (req, res) => {
  const users = authService.getAllUsers().map(({ password, ...u }) => u);
  res.json({ success: true, data: users });
}));

router.post('/auth/logout', asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
}));

// ---------------- DASHBOARD ----------------
router.get('/dashboard', asyncHandler(async (req, res) => {
  const { filter, customStart, customEnd } = req.query;
  const data = dashboardService.getDashboardData({ filter, customStart, customEnd });
  res.json({ success: true, data });
}));

// ---------------- CHART OF ACCOUNTS ----------------
router.get('/accounts', asyncHandler(async (req, res) => {
  const accounts = accountService.getAll();
  res.json({ success: true, data: accounts });
}));

router.post('/accounts', asyncHandler(async (req, res) => {
  const account = await accountService.create(req.body, req.headers['x-user'] || 'Finance Admin');
  res.status(201).json({ success: true, data: account });
}));

router.put('/accounts/:code', asyncHandler(async (req, res) => {
  const account = await accountService.update(req.params.code, req.body, req.headers['x-user'] || 'Finance Admin');
  res.json({ success: true, data: account });
}));

router.delete('/accounts/:code', asyncHandler(async (req, res) => {
  const result = await accountService.deleteAccount(req.params.code, req.headers['x-user'] || 'Finance Admin');
  res.json({ success: true, ...result });
}));

// ---------------- JOURNAL ENTRIES ----------------
router.get('/journals', asyncHandler(async (req, res) => {
  const journals = jsonStore.readSync('journal_entries.json') || [];
  // sort latest first
  journals.sort((a, b) => (b.createdDate || '').localeCompare(a.createdDate || ''));
  res.json({ success: true, data: journals });
}));

router.get('/journals/:id', asyncHandler(async (req, res) => {
  const journals = jsonStore.readSync('journal_entries.json') || [];
  const journal = journals.find((j) => j.id === req.params.id || j.journalNumber === req.params.id);
  if (!journal) return res.status(404).json({ success: false, message: 'Journal not found' });
  res.json({ success: true, data: journal });
}));

router.post('/journals', asyncHandler(async (req, res) => {
  const journal = await accountingEngine.postJournal({
    ...req.body,
    createdBy: req.headers['x-user'] || 'Finance Admin'
  });
  res.status(201).json({ success: true, data: journal });
}));

router.post('/journals/:id/reverse', asyncHandler(async (req, res) => {
  const reversal = await accountingEngine.reverseJournal(req.params.id, {
    reason: req.body.reason,
    user: req.headers['x-user'] || 'Finance Admin'
  });
  res.json({ success: true, data: reversal });
}));

// ---------------- INVOICES ----------------
router.get('/invoices', asyncHandler(async (req, res) => {
  const invoices = invoiceService.getAll();
  invoices.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  res.json({ success: true, data: invoices });
}));

router.get('/invoices/:id', asyncHandler(async (req, res) => {
  const inv = invoiceService.getById(req.params.id);
  if (!inv) return res.status(404).json({ success: false, message: 'Invoice not found' });
  res.json({ success: true, data: inv });
}));

router.post('/invoices', asyncHandler(async (req, res) => {
  const invoice = await invoiceService.create(req.body, req.headers['x-user'] || 'Finance Admin');
  res.status(201).json({ success: true, data: invoice });
}));

router.put('/invoices/:id', asyncHandler(async (req, res) => {
  const updated = await invoiceService.update(req.params.id, req.body, req.headers['x-user'] || 'Finance Admin');
  res.json({ success: true, data: updated });
}));

router.delete('/invoices/:id', asyncHandler(async (req, res) => {
  const result = await invoiceService.delete(req.params.id, req.headers['x-user'] || 'Finance Admin');
  res.json({ success: true, data: result });
}));

router.post('/invoices/:id/approve', asyncHandler(async (req, res) => {
  const approved = await invoiceService.approve(req.params.id, req.headers['x-user'] || 'Finance Admin');
  res.json({ success: true, data: approved });
}));

router.post('/invoices/:id/post', asyncHandler(async (req, res) => {
  const posted = await invoiceService.post(req.params.id, req.headers['x-user'] || 'Finance Admin');
  res.json({ success: true, data: posted });
}));

// ---------------- PAYMENTS (CUSTOMER) ----------------
router.get('/payments', asyncHandler(async (req, res) => {
  const payments = paymentService.getAll();
  payments.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  res.json({ success: true, data: payments });
}));

router.get('/payments/:id', asyncHandler(async (req, res) => {
  const payment = paymentService.getById(req.params.id);
  if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
  res.json({ success: true, data: payment });
}));

router.post('/payments', asyncHandler(async (req, res) => {
  const payment = await paymentService.createPayment({
    ...req.body,
    user: req.headers['x-user'] || 'Finance Admin'
  });
  res.status(201).json({ success: true, data: payment });
}));

router.post('/payments/:id/reverse', asyncHandler(async (req, res) => {
  const result = await paymentService.reversePayment(req.params.id, {
    reason: req.body.reason,
    user: req.headers['x-user'] || 'Finance Admin'
  });
  res.json({ success: true, data: result });
}));

// ---------------- CREDIT NOTES ----------------
router.get('/credit-notes', asyncHandler(async (req, res) => {
  const notes = creditNoteService.getAll();
  notes.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  res.json({ success: true, data: notes });
}));

router.post('/credit-notes', asyncHandler(async (req, res) => {
  const note = await creditNoteService.createCreditNote({
    ...req.body,
    user: req.headers['x-user'] || 'Finance Admin'
  });
  res.status(201).json({ success: true, data: note });
}));

// ---------------- VENDOR BILLS ----------------
router.get('/vendor-bills', asyncHandler(async (req, res) => {
  const bills = vendorBillService.getAll();
  bills.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  res.json({ success: true, data: bills });
}));

router.get('/vendor-bills/:id', asyncHandler(async (req, res) => {
  const bill = vendorBillService.getById(req.params.id);
  if (!bill) return res.status(404).json({ success: false, message: 'Vendor bill not found' });
  res.json({ success: true, data: bill });
}));

router.post('/vendor-bills', asyncHandler(async (req, res) => {
  const bill = await vendorBillService.create(req.body, req.headers['x-user'] || 'Finance Admin');
  res.status(201).json({ success: true, data: bill });
}));

router.post('/vendor-bills/:id/approve', asyncHandler(async (req, res) => {
  const approved = await vendorBillService.approve(req.params.id, req.headers['x-user'] || 'Finance Admin');
  res.json({ success: true, data: approved });
}));

router.post('/vendor-bills/:id/post', asyncHandler(async (req, res) => {
  const posted = await vendorBillService.post(req.params.id, req.headers['x-user'] || 'Finance Admin');
  res.json({ success: true, data: posted });
}));

// ---------------- VENDOR PAYMENTS ----------------
router.get('/vendor-payments', asyncHandler(async (req, res) => {
  const list = vendorPaymentService.getAll();
  list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  res.json({ success: true, data: list });
}));

router.post('/vendor-payments', asyncHandler(async (req, res) => {
  const payment = await vendorPaymentService.createPayment({
    ...req.body,
    user: req.headers['x-user'] || 'Finance Admin'
  });
  res.status(201).json({ success: true, data: payment });
}));

router.post('/vendor-payments/:id/reverse', asyncHandler(async (req, res) => {
  const result = await vendorPaymentService.reversePayment(req.params.id, {
    reason: req.body.reason,
    user: req.headers['x-user'] || 'Finance Admin'
  });
  res.json({ success: true, data: result });
}));

// ---------------- DEBIT NOTES ----------------
router.get('/debit-notes', asyncHandler(async (req, res) => {
  const notes = debitNoteService.getAll();
  notes.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  res.json({ success: true, data: notes });
}));

router.post('/debit-notes', asyncHandler(async (req, res) => {
  const note = await debitNoteService.createDebitNote({
    ...req.body,
    user: req.headers['x-user'] || 'Finance Admin'
  });
  res.status(201).json({ success: true, data: note });
}));

// ---------------- EXPENSES ----------------
router.get('/expenses', asyncHandler(async (req, res) => {
  const expenses = expenseService.getAll();
  expenses.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  res.json({ success: true, data: expenses });
}));

router.get('/expenses/categories', asyncHandler(async (req, res) => {
  res.json({ success: true, data: expenseService.getCategories() });
}));

router.post('/expenses', asyncHandler(async (req, res) => {
  const expense = await expenseService.create(req.body, req.headers['x-user'] || 'Finance Admin');
  res.status(201).json({ success: true, data: expense });
}));

// ---------------- CUSTOMERS & VENDORS ----------------
router.get('/customers', asyncHandler(async (req, res) => {
  res.json({ success: true, data: customerService.getAll() });
}));

router.post('/customers', asyncHandler(async (req, res) => {
  const customer = await customerService.create(req.body, req.headers['x-user'] || 'Finance Admin');
  res.status(201).json({ success: true, data: customer });
}));

router.put('/customers/:id', asyncHandler(async (req, res) => {
  const updated = await customerService.update(req.params.id, req.body, req.headers['x-user'] || 'Finance Admin');
  res.json({ success: true, data: updated });
}));

router.get('/vendors', asyncHandler(async (req, res) => {
  res.json({ success: true, data: vendorService.getAll() });
}));

router.post('/vendors', asyncHandler(async (req, res) => {
  const vendor = await vendorService.create(req.body, req.headers['x-user'] || 'Finance Admin');
  res.status(201).json({ success: true, data: vendor });
}));

router.put('/vendors/:id', asyncHandler(async (req, res) => {
  const updated = await vendorService.update(req.params.id, req.body, req.headers['x-user'] || 'Finance Admin');
  res.json({ success: true, data: updated });
}));

// ---------------- BANKING ----------------
router.get('/banking/accounts', asyncHandler(async (req, res) => {
  res.json({ success: true, data: bankingService.getAccounts() });
}));

router.post('/banking/accounts', asyncHandler(async (req, res) => {
  const account = await bankingService.createAccount(req.body, req.headers['x-user'] || 'Finance Admin');
  res.status(201).json({ success: true, data: account });
}));

router.get('/banking/transactions', asyncHandler(async (req, res) => {
  const txns = bankingService.getTransactions(req.query.bankAccountId);
  txns.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  res.json({ success: true, data: txns });
}));

router.post('/banking/transfer', asyncHandler(async (req, res) => {
  const transfer = await bankingService.transferFunds({
    ...req.body,
    user: req.headers['x-user'] || 'Finance Admin'
  });
  res.status(201).json({ success: true, data: transfer });
}));

router.post('/banking/reconcile', asyncHandler(async (req, res) => {
  const rec = await bankingService.reconcile({
    ...req.body,
    user: req.headers['x-user'] || 'Finance Admin'
  });
  res.status(201).json({ success: true, data: rec });
}));

router.get('/banking/reconciliations', asyncHandler(async (req, res) => {
  res.json({ success: true, data: bankingService.getReconciliations(req.query.bankAccountId) });
}));

// ---------------- BUDGETS ----------------
router.get('/budgets', asyncHandler(async (req, res) => {
  res.json({ success: true, data: budgetService.getAll() });
}));

router.post('/budgets', asyncHandler(async (req, res) => {
  const budget = await budgetService.create(req.body, req.headers['x-user'] || 'Finance Admin');
  res.status(201).json({ success: true, data: budget });
}));

router.get('/budgets/vs-actual', asyncHandler(async (req, res) => {
  const data = budgetService.getBudgetVsActual(req.query.fiscalYear);
  res.json({ success: true, data });
}));

// ---------------- REPORTS ----------------
router.get('/reports/general-ledger', asyncHandler(async (req, res) => {
  const data = reportService.getGeneralLedger({
    accountCode: req.query.accountCode,
    startDate: req.query.startDate,
    endDate: req.query.endDate
  });
  res.json({ success: true, data });
}));

router.get('/reports/trial-balance', asyncHandler(async (req, res) => {
  const data = reportService.getTrialBalance({
    startDate: req.query.startDate,
    endDate: req.query.endDate
  });
  res.json({ success: true, data });
}));

router.get('/reports/profit-loss', asyncHandler(async (req, res) => {
  const data = reportService.getProfitAndLoss({
    startDate: req.query.startDate,
    endDate: req.query.endDate
  });
  res.json({ success: true, data });
}));

router.get('/reports/balance-sheet', asyncHandler(async (req, res) => {
  const data = reportService.getBalanceSheet({
    asOfDate: req.query.asOfDate
  });
  res.json({ success: true, data });
}));

router.get('/reports/cash-flow', asyncHandler(async (req, res) => {
  const data = reportService.getCashFlow({
    startDate: req.query.startDate,
    endDate: req.query.endDate
  });
  res.json({ success: true, data });
}));

router.get('/reports/receivables-aging', asyncHandler(async (req, res) => {
  const data = reportService.getReceivablesAging({ asOfDate: req.query.asOfDate });
  res.json({ success: true, data });
}));

router.get('/reports/payables-aging', asyncHandler(async (req, res) => {
  const data = reportService.getPayablesAging({ asOfDate: req.query.asOfDate });
  res.json({ success: true, data });
}));

// ---------------- TAX & GST ----------------
router.get('/tax/summary', asyncHandler(async (req, res) => {
  const summary = reportService.getGstSummary({
    startDate: req.query.startDate,
    endDate: req.query.endDate
  });
  res.json({ success: true, data: summary });
}));

router.get('/tax/records', asyncHandler(async (req, res) => {
  const records = jsonStore.readSync('tax_records.json') || [];
  records.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  res.json({ success: true, data: records });
}));

// ---------------- PERIODS & FISCAL YEAR ----------------
router.get('/periods', asyncHandler(async (req, res) => {
  res.json({ success: true, data: periodService.getPeriods() });
}));

router.post('/periods', asyncHandler(async (req, res) => {
  const p = await periodService.createPeriod(req.body, req.headers['x-user'] || 'Finance Admin');
  res.status(201).json({ success: true, data: p });
}));

router.post('/periods/:id/lock-month', asyncHandler(async (req, res) => {
  const { month, lock } = req.body;
  const p = await periodService.toggleLockMonth(req.params.id, month, lock !== false, req.headers['x-user'] || 'Finance Admin');
  res.json({ success: true, data: p });
}));

router.post('/periods/:id/close-year', asyncHandler(async (req, res) => {
  const result = await periodService.closeFiscalYear(req.params.id, req.headers['x-user'] || 'Finance Admin');
  res.json({ success: true, data: result });
}));

// ---------------- AUDIT LOGS ----------------
router.get('/audit-logs', asyncHandler(async (req, res) => {
  const logs = auditService.getLogs({
    transactionId: req.query.transactionId,
    transactionType: req.query.transactionType,
    limit: parseInt(req.query.limit || '200')
  });
  res.json({ success: true, data: logs });
}));

// ---------------- SETTINGS & BACKUP ----------------
router.get('/company', asyncHandler(async (req, res) => {
  res.json({ success: true, data: settingsService.getCompany() });
}));

router.put('/company', asyncHandler(async (req, res) => {
  const updated = await settingsService.updateCompany(req.body, req.headers['x-user'] || 'Finance Admin');
  res.json({ success: true, data: updated });
}));

router.get('/settings', asyncHandler(async (req, res) => {
  res.json({ success: true, data: settingsService.getSettings() });
}));

router.put('/settings', asyncHandler(async (req, res) => {
  const updated = await settingsService.updateSettings(req.body, req.headers['x-user'] || 'Finance Admin');
  res.json({ success: true, data: updated });
}));

router.post('/backup', asyncHandler(async (req, res) => {
  const backup = settingsService.createBackup(req.headers['x-user'] || 'Finance Admin');
  res.json({ success: true, data: backup });
}));

router.get('/backups', asyncHandler(async (req, res) => {
  res.json({ success: true, data: settingsService.listBackups() });
}));

router.post('/restore', asyncHandler(async (req, res) => {
  const result = settingsService.restoreBackup(req.body.backupId, req.headers['x-user'] || 'Finance Admin');
  res.json({ success: true, data: result });
}));

router.get('/export', asyncHandler(async (req, res) => {
  const bundle = settingsService.exportData(req.headers['x-user'] || 'Finance Admin');
  res.json(bundle);
}));

router.post('/import', asyncHandler(async (req, res) => {
  const result = settingsService.importData(req.body, req.headers['x-user'] || 'Finance Admin');
  res.json({ success: true, data: result });
}));

export default router;
