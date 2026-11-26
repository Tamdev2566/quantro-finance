import React from 'react';
import AccountsView from '../../views/Accounting/AccountsView';
import JournalEntriesView from '../../views/Accounting/JournalEntriesView';

export const accountingRoutes = [
  { path: '/accounts', element: <AccountsView /> },
  { path: '/journals', element: <JournalEntriesView /> }
];

export default accountingRoutes;
