import httpClient from '../api/client';

export const accountingService = {
  getAccounts: () => httpClient.get('/accounts'),
  createAccount: (data) => httpClient.post('/accounts', data),
  updateAccount: (code, data) => httpClient.put(`/accounts/${code}`, data),
  deleteAccount: (code) => httpClient.delete(`/accounts/${code}`),

  getJournals: () => httpClient.get('/journals'),
  getJournal: (id) => httpClient.get(`/journals/${id}`),
  createJournal: (data) => httpClient.post('/journals', data),
  reverseJournal: (id, data) => httpClient.post(`/journals/${id}/reverse`, data)
};

export default accountingService;
