import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    'x-user': 'Finance Controller'
  }
});

// Interceptor to unwrap { success: true, data } or throw message
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const msg = error.response?.data?.message || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(msg));
  }
);

export const apiClient = {
  // Auth
  login: (data) => api.post('/auth/login', data),
  getAuthUsers: () => api.get('/auth/users'),
  logout: () => api.post('/auth/logout'),
  setAuthUser: (user) => {
    api.defaults.headers['x-user'] = user ? `${user.name} (${user.role})` : 'Finance Controller';
  },

  // Dashboard
  getDashboard: (params) => api.get('/dashboard', { params }),

  // Accounts
  getAccounts: () => api.get('/accounts'),
  createAccount: (data) => api.post('/accounts', data),
  updateAccount: (code, data) => api.put(`/accounts/${code}`, data),
  deleteAccount: (code) => api.delete(`/accounts/${code}`),

  // Journals
  getJournals: () => api.get('/journals'),
  getJournal: (id) => api.get(`/journals/${id}`),
  createJournal: (data) => api.post('/journals', data),
  reverseJournal: (id, data) => api.post(`/journals/${id}/reverse`, data),

  // Invoices
  getInvoices: () => api.get('/invoices'),
  getInvoice: (id) => api.get(`/invoices/${id}`),
  createInvoice: (data) => api.post('/invoices', data),
  updateInvoice: (id, data) => api.put(`/invoices/${id}`, data),
  deleteInvoice: (id) => api.delete(`/invoices/${id}`),
  approveInvoice: (id) => api.post(`/invoices/${id}/approve`),
  postInvoice: (id) => api.post(`/invoices/${id}/post`),

  // Payments
  getPayments: () => api.get('/payments'),
  createPayment: (data) => api.post('/payments', data),
  reversePayment: (id, data) => api.post(`/payments/${id}/reverse`, data),

  // Credit Notes
  getCreditNotes: () => api.get('/credit-notes'),
  createCreditNote: (data) => api.post('/credit-notes', data),

  // Vendor Bills
  getVendorBills: () => api.get('/vendor-bills'),
  getVendorBill: (id) => api.get(`/vendor-bills/${id}`),
  createVendorBill: (data) => api.post('/vendor-bills', data),
  approveVendorBill: (id) => api.post(`/vendor-bills/${id}/approve`),
  postVendorBill: (id) => api.post(`/vendor-bills/${id}/post`),

  // Vendor Payments
  getVendorPayments: () => api.get('/vendor-payments'),
  createVendorPayment: (data) => api.post('/vendor-payments', data),
  reverseVendorPayment: (id, data) => api.post(`/vendor-payments/${id}/reverse`, data),

  // Debit Notes
  getDebitNotes: () => api.get('/debit-notes'),
  createDebitNote: (data) => api.post('/debit-notes', data),

  // Expenses
  getExpenses: () => api.get('/expenses'),
  getExpenseCategories: () => api.get('/expenses/categories'),
  createExpense: (data) => api.post('/expenses', data),

  // Customers & Vendors
  getCustomers: () => api.get('/customers'),
  createCustomer: (data) => api.post('/customers', data),
  updateCustomer: (id, data) => api.put(`/customers/${id}`, data),
  getVendors: () => api.get('/vendors'),
  createVendor: (data) => api.post('/vendors', data),
  updateVendor: (id, data) => api.put(`/vendors/${id}`, data),

  // Banking
  getBankAccounts: () => api.get('/banking/accounts'),
  createBankAccount: (data) => api.post('/banking/accounts', data),
  getBankTransactions: (params) => api.get('/banking/transactions', { params }),
  transferFunds: (data) => api.post('/banking/transfer', data),
  reconcileBank: (data) => api.post('/banking/reconcile', data),
  getReconciliations: (params) => api.get('/banking/reconciliations', { params }),

  // Budgets
  getBudgets: () => api.get('/budgets'),
  createBudget: (data) => api.post('/budgets', data),
  getBudgetVsActual: (params) => api.get('/budgets/vs-actual', { params }),

  // Reports
  getGeneralLedger: (params) => api.get('/reports/general-ledger', { params }),
  getTrialBalance: (params) => api.get('/reports/trial-balance', { params }),
  getProfitAndLoss: (params) => api.get('/reports/profit-loss', { params }),
  getBalanceSheet: (params) => api.get('/reports/balance-sheet', { params }),
  getCashFlow: (params) => api.get('/reports/cash-flow', { params }),
  getReceivablesAging: (params) => api.get('/reports/receivables-aging', { params }),
  getPayablesAging: (params) => api.get('/reports/payables-aging', { params }),

  // Tax & GST
  getTaxSummary: (params) => api.get('/tax/summary', { params }),
  getTaxRecords: () => api.get('/tax/records'),

  // Periods
  getPeriods: () => api.get('/periods'),
  createPeriod: (data) => api.post('/periods', data),
  lockMonth: (id, data) => api.post(`/periods/${id}/lock-month`, data),
  closeFiscalYear: (id) => api.post(`/periods/${id}/close-year`),

  // Audit Logs
  getAuditLogs: (params) => api.get('/audit-logs', { params }),

  // Settings & Backups
  getCompany: () => api.get('/company'),
  updateCompany: (data) => api.put('/company', data),
  getSettings: () => api.get('/settings'),
  updateSettings: (data) => api.put('/settings', data),
  createBackup: () => api.post('/backup'),
  getBackups: () => api.get('/backups'),
  restoreBackup: (data) => api.post('/restore', data),
  exportData: () => api.get('/export'),
  importData: (data) => api.post('/import', data)
};

export default apiClient;
