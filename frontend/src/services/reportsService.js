import httpClient from '../api/client';

export const reportsService = {
  getGeneralLedger: (params) => httpClient.get('/reports/general-ledger', { params }),
  getTrialBalance: (params) => httpClient.get('/reports/trial-balance', { params }),
  getProfitAndLoss: (params) => httpClient.get('/reports/profit-loss', { params }),
  getBalanceSheet: (params) => httpClient.get('/reports/balance-sheet', { params }),
  getCashFlow: (params) => httpClient.get('/reports/cash-flow', { params }),
  getReceivablesAging: (params) => httpClient.get('/reports/receivables-aging', { params }),
  getPayablesAging: (params) => httpClient.get('/reports/payables-aging', { params }),
  getTaxSummary: (params) => httpClient.get('/tax/summary', { params }),
  getTaxRecords: () => httpClient.get('/tax/records')
};

export default reportsService;
