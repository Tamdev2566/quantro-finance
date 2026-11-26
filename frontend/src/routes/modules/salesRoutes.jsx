import React from 'react';
import InvoicesView from '../../views/Sales/InvoicesView';
import PaymentsView from '../../views/Sales/PaymentsView';
import CreditNotesView from '../../views/Sales/CreditNotesView';
import CustomersView from '../../views/Sales/CustomersView';
import AgingReportsView from '../../views/Reports/AgingReportsView';

export const salesRoutes = [
  { path: '/invoices', element: <InvoicesView /> },
  { path: '/payments', element: <PaymentsView /> },
  { path: '/credit-notes', element: <CreditNotesView /> },
  { path: '/customers', element: <CustomersView /> },
  { path: '/customer-master', element: <CustomersView /> },
  { path: '/receivables-aging', element: <AgingReportsView defaultType="receivables" /> }
];

export default salesRoutes;
