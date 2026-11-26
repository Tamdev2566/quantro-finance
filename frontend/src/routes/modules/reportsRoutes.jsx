import React from 'react';
import TaxSummaryView from '../../views/Tax/TaxSummaryView';
import GeneralLedgerView from '../../views/Reports/GeneralLedgerView';
import TrialBalanceView from '../../views/Reports/TrialBalanceView';
import ProfitLossView from '../../views/Reports/ProfitLossView';
import BalanceSheetView from '../../views/Reports/BalanceSheetView';
import CashFlowView from '../../views/Reports/CashFlowView';
import BudgetsView from '../../views/Budget/BudgetsView';

export const reportsRoutes = [
  { path: '/tax', element: <TaxSummaryView /> },
  { path: '/general-ledger', element: <GeneralLedgerView /> },
  { path: '/trial-balance', element: <TrialBalanceView /> },
  { path: '/profit-loss', element: <ProfitLossView /> },
  { path: '/balance-sheet', element: <BalanceSheetView /> },
  { path: '/cash-flow', element: <CashFlowView /> },
  { path: '/budgets', element: <BudgetsView /> }
];

export default reportsRoutes;
