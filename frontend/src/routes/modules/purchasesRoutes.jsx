import React from 'react';
import VendorBillsView from '../../views/Purchases/VendorBillsView';
import VendorPaymentsView from '../../views/Purchases/VendorPaymentsView';
import DebitNotesView from '../../views/Purchases/DebitNotesView';
import VendorsView from '../../views/Purchases/VendorsView';
import AgingReportsView from '../../views/Reports/AgingReportsView';

export const purchasesRoutes = [
  { path: '/vendor-bills', element: <VendorBillsView /> },
  { path: '/vendor-payments', element: <VendorPaymentsView /> },
  { path: '/debit-notes', element: <DebitNotesView /> },
  { path: '/vendors', element: <VendorsView /> },
  { path: '/payables-aging', element: <AgingReportsView defaultType="payables" /> }
];

export default purchasesRoutes;
