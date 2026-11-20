import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const STORAGE_DIR = path.resolve(__dirname, '../../finance/storage');
export const BACKUP_DIR = path.resolve(__dirname, '../../finance/backups');

export const STORAGE_FILES = [
  'company.json',
  'settings.json',
  'accounts.json',
  'journal_entries.json',
  'invoices.json',
  'invoice_items.json',
  'payments.json',
  'credit_notes.json',
  'vendor_bills.json',
  'vendor_payments.json',
  'debit_notes.json',
  'expenses.json',
  'tax_records.json',
  'bank_accounts.json',
  'bank_transactions.json',
  'reconciliations.json',
  'budgets.json',
  'customers.json',
  'vendors.json',
  'recurring_transactions.json',
  'audit_logs.json',
  'transaction_sequences.json',
  'opening_balances.json',
  'periods.json',
  'users.json'
];

export const ACCOUNT_TYPES = {
  ASSETS: 'Assets',
  LIABILITIES: 'Liabilities',
  EQUITY: 'Equity',
  REVENUE: 'Revenue',
  EXPENSES: 'Expenses'
};

export const ACCOUNT_CATEGORIES = {
  // Assets
  CASH: 'Cash',
  BANK: 'Bank',
  ACCOUNTS_RECEIVABLE: 'Accounts Receivable',
  INVENTORY: 'Inventory',
  FIXED_ASSETS: 'Fixed Assets',
  PREPAID_EXPENSES: 'Prepaid Expenses',
  INPUT_GST: 'Input GST',
  OTHER_ASSETS: 'Other Assets',
  
  // Liabilities
  ACCOUNTS_PAYABLE: 'Accounts Payable',
  OUTPUT_GST: 'Output GST',
  LOANS: 'Loans',
  ACCRUED_EXPENSES: 'Accrued Expenses',
  OTHER_LIABILITIES: 'Other Liabilities',
  
  // Equity
  OWNER_CAPITAL: 'Owner Capital',
  RETAINED_EARNINGS: 'Retained Earnings',
  DRAWINGS: 'Drawings',
  
  // Revenue
  SALES_REVENUE: 'Sales Revenue',
  SERVICE_REVENUE: 'Service Revenue',
  OTHER_INCOME: 'Other Income',
  
  // Expenses
  SALARIES: 'Salaries',
  RENT: 'Rent',
  UTILITIES: 'Utilities',
  TRAVEL: 'Travel',
  OFFICE_EXPENSES: 'Office Expenses',
  MARKETING: 'Marketing',
  BANK_CHARGES: 'Bank Charges',
  DEPRECIATION: 'Depreciation',
  COGS: 'Cost of Goods Sold',
  OTHER_EXPENSES: 'Other Expenses'
};
