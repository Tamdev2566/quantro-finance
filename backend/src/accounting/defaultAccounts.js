export const DEFAULT_ACCOUNTS = [
  // --- ASSETS (1000-1999) ---
  {
    code: '1010',
    name: 'Petty Cash',
    type: 'Assets',
    category: 'Cash',
    description: 'Physical cash on hand for day-to-day minor expenses',
    isActive: true,
    isSystem: true,
    openingBalance: 0,
    currentBalance: 0
  },
  {
    code: '1020',
    name: 'HDFC Operating Bank Account',
    type: 'Assets',
    category: 'Bank',
    description: 'Primary corporate checking bank account',
    isActive: true,
    isSystem: true,
    openingBalance: 0,
    currentBalance: 0
  },
  {
    code: '1030',
    name: 'ICICI Reserve Bank Account',
    type: 'Assets',
    category: 'Bank',
    description: 'Secondary reserve and tax reserve account',
    isActive: true,
    isSystem: true,
    openingBalance: 0,
    currentBalance: 0
  },
  {
    code: '1200',
    name: 'Accounts Receivable (Trade Debtors)',
    type: 'Assets',
    category: 'Accounts Receivable',
    description: 'Outstanding customer receivables from sales invoices',
    isActive: true,
    isSystem: true,
    openingBalance: 0,
    currentBalance: 0
  },
  {
    code: '1300',
    name: 'Merchandise Inventory',
    type: 'Assets',
    category: 'Inventory',
    description: 'Stock on hand for sale',
    isActive: true,
    isSystem: false,
    openingBalance: 0,
    currentBalance: 0
  },
  {
    code: '1400',
    name: 'Office Equipment & Computers',
    type: 'Assets',
    category: 'Fixed Assets',
    description: 'IT hardware and office machinery',
    isActive: true,
    isSystem: false,
    openingBalance: 0,
    currentBalance: 0
  },
  {
    code: '1450',
    name: 'Accumulated Depreciation',
    type: 'Assets',
    category: 'Fixed Assets',
    description: 'Contra-asset for depreciation of fixed assets',
    isActive: true,
    isSystem: false,
    openingBalance: 0,
    currentBalance: 0
  },
  {
    code: '1500',
    name: 'Prepaid Expenses',
    type: 'Assets',
    category: 'Prepaid Expenses',
    description: 'Prepaid insurance, software licenses, or rent',
    isActive: true,
    isSystem: false,
    openingBalance: 0,
    currentBalance: 0
  },
  {
    code: '1610',
    name: 'Input CGST',
    type: 'Assets',
    category: 'Input GST',
    description: 'Central GST tax credit paid on purchases',
    isActive: true,
    isSystem: true,
    openingBalance: 0,
    currentBalance: 0
  },
  {
    code: '1620',
    name: 'Input SGST',
    type: 'Assets',
    category: 'Input GST',
    description: 'State GST tax credit paid on purchases',
    isActive: true,
    isSystem: true,
    openingBalance: 0,
    currentBalance: 0
  },
  {
    code: '1630',
    name: 'Input IGST',
    type: 'Assets',
    category: 'Input GST',
    description: 'Integrated GST tax credit paid on inter-state purchases',
    isActive: true,
    isSystem: true,
    openingBalance: 0,
    currentBalance: 0
  },
  {
    code: '1900',
    name: 'Other Current Assets',
    type: 'Assets',
    category: 'Other Assets',
    description: 'Security deposits and other receivables',
    isActive: true,
    isSystem: false,
    openingBalance: 0,
    currentBalance: 0
  },

  // --- LIABILITIES (2000-2999) ---
  {
    code: '2010',
    name: 'Accounts Payable (Trade Creditors)',
    type: 'Liabilities',
    category: 'Accounts Payable',
    description: 'Amounts owed to suppliers for bills and goods',
    isActive: true,
    isSystem: true,
    openingBalance: 0,
    currentBalance: 0
  },
  {
    code: '2110',
    name: 'Output CGST',
    type: 'Liabilities',
    category: 'Output GST',
    description: 'Central GST collected on sales',
    isActive: true,
    isSystem: true,
    openingBalance: 0,
    currentBalance: 0
  },
  {
    code: '2120',
    name: 'Output SGST',
    type: 'Liabilities',
    category: 'Output GST',
    description: 'State GST collected on sales',
    isActive: true,
    isSystem: true,
    openingBalance: 0,
    currentBalance: 0
  },
  {
    code: '2130',
    name: 'Output IGST',
    type: 'Liabilities',
    category: 'Output GST',
    description: 'Integrated GST collected on inter-state sales',
    isActive: true,
    isSystem: true,
    openingBalance: 0,
    currentBalance: 0
  },
  {
    code: '2200',
    name: 'Bank Loans & Term Borrowings',
    type: 'Liabilities',
    category: 'Loans',
    description: 'Long-term and short-term debt obligations',
    isActive: true,
    isSystem: false,
    openingBalance: 0,
    currentBalance: 0
  },
  {
    code: '2300',
    name: 'Accrued Expenses & Salaries Payable',
    type: 'Liabilities',
    category: 'Accrued Expenses',
    description: 'Incurred expenses unpaid at period end',
    isActive: true,
    isSystem: false,
    openingBalance: 0,
    currentBalance: 0
  },
  {
    code: '2900',
    name: 'Other Current Liabilities',
    type: 'Liabilities',
    category: 'Other Liabilities',
    description: 'Customer advances and statutory withholdings',
    isActive: true,
    isSystem: false,
    openingBalance: 0,
    currentBalance: 0
  },

  // --- EQUITY (3000-3999) ---
  {
    code: '3010',
    name: "Owner's / Share Capital",
    type: 'Equity',
    category: 'Owner Capital',
    description: 'Initial and contributed capital from founders/owners',
    isActive: true,
    isSystem: true,
    openingBalance: 0,
    currentBalance: 0
  },
  {
    code: '3020',
    name: 'Retained Earnings',
    type: 'Equity',
    category: 'Retained Earnings',
    description: 'Accumulated net profit/loss from prior financial years',
    isActive: true,
    isSystem: true,
    openingBalance: 0,
    currentBalance: 0
  },
  {
    code: '3030',
    name: "Owner's Drawings",
    type: 'Equity',
    category: 'Drawings',
    description: 'Withdrawals by owners for personal use',
    isActive: true,
    isSystem: false,
    openingBalance: 0,
    currentBalance: 0
  },

  // --- REVENUE (4000-4999) ---
  {
    code: '4010',
    name: 'Sales Revenue - Products',
    type: 'Revenue',
    category: 'Sales Revenue',
    description: 'Income earned from selling goods and products',
    isActive: true,
    isSystem: true,
    openingBalance: 0,
    currentBalance: 0
  },
  {
    code: '4020',
    name: 'Service Revenue - Consulting & Services',
    type: 'Revenue',
    category: 'Service Revenue',
    description: 'Income earned from professional and technical services',
    isActive: true,
    isSystem: true,
    openingBalance: 0,
    currentBalance: 0
  },
  {
    code: '4900',
    name: 'Other Income / Interest Earned',
    type: 'Revenue',
    category: 'Other Income',
    description: 'Non-operating revenue including interest and rebates',
    isActive: true,
    isSystem: false,
    openingBalance: 0,
    currentBalance: 0
  },

  // --- EXPENSES (5000-5999) ---
  {
    code: '5010',
    name: 'Cost of Goods Sold (COGS)',
    type: 'Expenses',
    category: 'Cost of Goods Sold',
    description: 'Direct procurement and production costs',
    isActive: true,
    isSystem: true,
    openingBalance: 0,
    currentBalance: 0
  },
  {
    code: '5110',
    name: 'Salaries & Wages',
    type: 'Expenses',
    category: 'Salaries',
    description: 'Employee payroll, bonuses, and contractor pay',
    isActive: true,
    isSystem: false,
    openingBalance: 0,
    currentBalance: 0
  },
  {
    code: '5120',
    name: 'Rent & Lease Expense',
    type: 'Expenses',
    category: 'Rent',
    description: 'Office and warehouse rental expenses',
    isActive: true,
    isSystem: false,
    openingBalance: 0,
    currentBalance: 0
  },
  {
    code: '5130',
    name: 'Utilities & Internet',
    type: 'Expenses',
    category: 'Utilities',
    description: 'Electricity, water, telephone, and high-speed internet',
    isActive: true,
    isSystem: false,
    openingBalance: 0,
    currentBalance: 0
  },
  {
    code: '5140',
    name: 'Travel & Conveyance',
    type: 'Expenses',
    category: 'Travel',
    description: 'Business trips, local transport, and lodging',
    isActive: true,
    isSystem: false,
    openingBalance: 0,
    currentBalance: 0
  },
  {
    code: '5150',
    name: 'Office & Admin Supplies',
    type: 'Expenses',
    category: 'Office Expenses',
    description: 'Stationery, pantry supplies, printing',
    isActive: true,
    isSystem: false,
    openingBalance: 0,
    currentBalance: 0
  },
  {
    code: '5160',
    name: 'Marketing & Advertising',
    type: 'Expenses',
    category: 'Marketing',
    description: 'Digital campaigns, ads, events, and promotions',
    isActive: true,
    isSystem: false,
    openingBalance: 0,
    currentBalance: 0
  },
  {
    code: '5170',
    name: 'Bank Charges & Payment Gateway Fees',
    type: 'Expenses',
    category: 'Bank Charges',
    description: 'Transaction fees, wire costs, and gateway cuts',
    isActive: true,
    isSystem: true,
    openingBalance: 0,
    currentBalance: 0
  },
  {
    code: '5180',
    name: 'Depreciation & Amortization',
    type: 'Expenses',
    category: 'Depreciation',
    description: 'Non-cash write-down of asset values over time',
    isActive: true,
    isSystem: false,
    openingBalance: 0,
    currentBalance: 0
  },
  {
    code: '5990',
    name: 'General & Miscellaneous Expenses',
    type: 'Expenses',
    category: 'Other Expenses',
    description: 'Other incidental operational expenses',
    isActive: true,
    isSystem: false,
    openingBalance: 0,
    currentBalance: 0
  }
];
