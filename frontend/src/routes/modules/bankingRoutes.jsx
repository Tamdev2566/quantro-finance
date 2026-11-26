import React from 'react';
import BankAccountsView from '../../views/Banking/BankAccountsView';
import ReconciliationView from '../../views/Banking/ReconciliationView';

export const bankingRoutes = [
  { path: '/bank-accounts', element: <BankAccountsView /> },
  { path: '/reconciliation', element: <ReconciliationView /> }
];

export default bankingRoutes;
