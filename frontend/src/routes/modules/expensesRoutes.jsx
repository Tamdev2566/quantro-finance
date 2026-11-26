import React from 'react';
import ExpensesView from '../../views/Expenses/ExpensesView';
import ExpenseCategoriesView from '../../views/Expenses/ExpenseCategoriesView';

export const expensesRoutes = [
  { path: '/expenses', element: <ExpensesView /> },
  { path: '/expense-categories', element: <ExpenseCategoriesView /> }
];

export default expensesRoutes;
