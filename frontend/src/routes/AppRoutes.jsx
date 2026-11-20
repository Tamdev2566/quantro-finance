import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layout & Protected Route Guard
import MainLayout from '../layouts/MainLayout';
import ProtectedRoute from '../components/Auth/ProtectedRoute';

// Public Authentication View
import LoginView from '../views/Auth/LoginView';

// Enterprise Finance Views
import DashboardView from '../views/Dashboard/DashboardView';
import InvoicesView from '../views/Sales/InvoicesView';
import PaymentsView from '../views/Sales/PaymentsView';
import CreditNotesView from '../views/Sales/CreditNotesView';
import CustomersView from '../views/Sales/CustomersView';
import VendorBillsView from '../views/Purchases/VendorBillsView';
import VendorPaymentsView from '../views/Purchases/VendorPaymentsView';
import DebitNotesView from '../views/Purchases/DebitNotesView';
import VendorsView from '../views/Purchases/VendorsView';
import ExpensesView from '../views/Expenses/ExpensesView';
import ExpenseCategoriesView from '../views/Expenses/ExpenseCategoriesView';
import AccountsView from '../views/Accounting/AccountsView';
import JournalEntriesView from '../views/Accounting/JournalEntriesView';
import GeneralLedgerView from '../views/Reports/GeneralLedgerView';
import TrialBalanceView from '../views/Reports/TrialBalanceView';
import BankAccountsView from '../views/Banking/BankAccountsView';
import ReconciliationView from '../views/Banking/ReconciliationView';
import TaxSummaryView from '../views/Tax/TaxSummaryView';
import ProfitLossView from '../views/Reports/ProfitLossView';
import BalanceSheetView from '../views/Reports/BalanceSheetView';
import CashFlowView from '../views/Reports/CashFlowView';
import AgingReportsView from '../views/Reports/AgingReportsView';
import BudgetsView from '../views/Budget/BudgetsView';
import CompanySettingsView from '../views/Settings/CompanySettingsView';
import BackupRestoreView from '../views/Settings/BackupRestoreView';
import AuditLogsView from '../views/Settings/AuditLogsView';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Authentication Route */}
      <Route path="/login" element={<LoginView />} />

      {/* Protected Routes using ProtectedRoute Guard */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardView />} />

          {/* Sales & Receivables (AR) */}
          <Route path="/invoices" element={<InvoicesView />} />
          <Route path="/payments" element={<PaymentsView />} />
          <Route path="/credit-notes" element={<CreditNotesView />} />
          <Route path="/customers" element={<CustomersView />} />
          <Route path="/customer-master" element={<CustomersView />} />
          <Route path="/receivables-aging" element={<AgingReportsView defaultType="receivables" />} />

          {/* Purchases & Payables (AP) */}
          <Route path="/vendor-bills" element={<VendorBillsView />} />
          <Route path="/vendor-payments" element={<VendorPaymentsView />} />
          <Route path="/debit-notes" element={<DebitNotesView />} />
          <Route path="/vendors" element={<VendorsView />} />
          <Route path="/payables-aging" element={<AgingReportsView defaultType="payables" />} />

          {/* Operating Expenses */}
          <Route path="/expenses" element={<ExpensesView />} />
          <Route path="/expense-categories" element={<ExpenseCategoriesView />} />

          {/* Accounting & General Ledger */}
          <Route path="/accounts" element={<AccountsView />} />
          <Route path="/journals" element={<JournalEntriesView />} />

          {/* Banking & Cash Management */}
          <Route path="/bank-accounts" element={<BankAccountsView />} />
          <Route path="/reconciliation" element={<ReconciliationView />} />

          {/* Tax / GST Ledger */}
          <Route path="/tax" element={<TaxSummaryView />} />

          {/* Financial Statements & Intelligence */}
          <Route path="/general-ledger" element={<GeneralLedgerView />} />
          <Route path="/trial-balance" element={<TrialBalanceView />} />
          <Route path="/profit-loss" element={<ProfitLossView />} />
          <Route path="/balance-sheet" element={<BalanceSheetView />} />
          <Route path="/cash-flow" element={<CashFlowView />} />

          {/* Department Budgets */}
          <Route path="/budgets" element={<BudgetsView />} />

          {/* System Settings, Backups & Audit */}
          <Route path="/company-settings" element={<CompanySettingsView />} />
          <Route path="/backup-restore" element={<BackupRestoreView />} />
          <Route path="/audit-logs" element={<AuditLogsView />} />

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
