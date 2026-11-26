import httpClient from '../api/client';

export const expensesService = {
  getExpenses: () => httpClient.get('/expenses'),
  getExpenseCategories: () => httpClient.get('/expenses/categories'),
  createExpense: (data) => httpClient.post('/expenses', data)
};

export default expensesService;
