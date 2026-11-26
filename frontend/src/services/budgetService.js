import httpClient from '../api/client';

export const budgetService = {
  getBudgets: () => httpClient.get('/budgets'),
  createBudget: (data) => httpClient.post('/budgets', data),
  getBudgetVsActual: (params) => httpClient.get('/budgets/vs-actual', { params })
};

export default budgetService;
