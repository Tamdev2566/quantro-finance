import httpClient from '../api/client';

export const bankingService = {
  getBankAccounts: () => httpClient.get('/banking/accounts'),
  createBankAccount: (data) => httpClient.post('/banking/accounts', data),
  getBankTransactions: (params) => httpClient.get('/banking/transactions', { params }),
  transferFunds: (data) => httpClient.post('/banking/transfer', data),
  reconcileBank: (data) => httpClient.post('/banking/reconcile', data),
  getReconciliations: (params) => httpClient.get('/banking/reconciliations', { params })
};

export default bankingService;
