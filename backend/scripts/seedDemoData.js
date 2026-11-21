import jsonStore from '../src/storage/jsonStore.js';
import { pool, syncRelationalTable } from '../src/storage/db.js';
import customerService from '../src/services/customerService.js';
import vendorService from '../src/services/vendorService.js';
import bankingService from '../src/services/bankingService.js';
import invoiceService from '../src/services/invoiceService.js';
import paymentService from '../src/services/paymentService.js';
import expenseService from '../src/services/expenseService.js';
import budgetService from '../src/services/budgetService.js';

async function seed() {
  console.log('Seeding Demo Data into live PostgreSQL database...\n');

  // 1. Wait for jsonStore to sync in-memory cache from PostgreSQL
  await jsonStore.initPromise;

  // 2. Sync core users and accounts to relational tables
  const users = jsonStore.readSync('users.json');
  if (users.length > 0) {
    console.log(`Syncing ${users.length} users to relational 'users' table...`);
    await syncRelationalTable('users', users);
  }

  const accounts = jsonStore.readSync('accounts.json');
  if (accounts.length > 0) {
    console.log(`Syncing ${accounts.length} accounts to relational 'accounts' table...`);
    await syncRelationalTable('accounts', accounts);
  }

  // 3. Seed Bank Accounts
  let bankAccounts = bankingService.getAccounts();
  let hdfcBank = bankAccounts.find(b => b.accountNumber === '50100439281726');
  if (!hdfcBank) {
    console.log('Adding demo Bank Accounts...');
    hdfcBank = await bankingService.createAccount({
      bankName: 'HDFC Bank',
      accountName: 'HDFC Corporate Current A/C',
      accountNumber: '50100439281726',
      openingBalance: 500000,
      currency: 'INR'
    });

    await bankingService.createAccount({
      bankName: 'ICICI Bank',
      accountName: 'ICICI Operations A/C',
      accountNumber: '002105009876',
      openingBalance: 250000,
      currency: 'INR'
    });
  }

  // 4. Seed Customers
  let customers = customerService.getAll();
  let tcs = customers.find(c => c.name.includes('Tata Consultancy'));
  if (!tcs) {
    console.log('Adding demo Customers...');
    tcs = await customerService.create({
      name: 'Tata Consultancy Services Ltd',
      contactPerson: 'Rajesh Gopinathan',
      email: 'accounts@tcs.com',
      phone: '+91 22 6778 9999',
      gstin: '27AAACT2727Q1ZW',
      state: 'Maharashtra',
      stateCode: '27',
      address: 'TCS House, Raveline Street, Fort, Mumbai - 400001'
    });

    await customerService.create({
      name: 'Infosys Limited',
      contactPerson: 'Salil Parekh',
      email: 'finance@infosys.com',
      phone: '+91 80 2852 0261',
      gstin: '29AAACI4321A1ZB',
      state: 'Karnataka',
      stateCode: '29',
      address: 'Electronics City, Hosur Road, Bengaluru - 560100'
    });

    await customerService.create({
      name: 'Zoho Corporation Pvt Ltd',
      contactPerson: 'Sridhar Vembu',
      email: 'billing@zohocorp.com',
      phone: '+91 44 6744 7070',
      gstin: '33AABCZ9988G1ZQ',
      state: 'Tamil Nadu',
      stateCode: '33',
      address: 'Estancia IT Park, Guduvanchery, Chennai - 603202'
    });
  }

  // 5. Seed Vendors
  let vendors = vendorService.getAll();
  let awsVendor = vendors.find(v => v.name.includes('Amazon'));
  if (!awsVendor) {
    console.log('Adding demo Vendors...');
    awsVendor = await vendorService.create({
      name: 'Amazon Web Services India Pvt Ltd',
      contactPerson: 'AWS Billing Team',
      email: 'billing@amazon.in',
      phone: '+91 11 4110 5000',
      gstin: '27AARCA1234B1ZZ',
      state: 'Maharashtra',
      stateCode: '27',
      address: 'BKC, Bandra East, Mumbai - 400051'
    });

    await vendorService.create({
      name: 'Dell Technologies India',
      contactPerson: 'Alok Ohrie',
      email: 'orders@dell.com',
      phone: '+91 80 2500 0000',
      gstin: '29AAACD1234F1Z8',
      state: 'Karnataka',
      stateCode: '29',
      address: 'Divyasree Greens, Koramangala, Bengaluru - 560071'
    });
  }

  // 6. Seed Invoices
  let invoices = invoiceService.getAll();
  let tcsInvoice = invoices.find(inv => inv.customerId === tcs.id);
  if (!tcsInvoice) {
    console.log('Adding demo Invoices...');
    const createdInvoice = await invoiceService.create({
      customerId: tcs.id,
      invoiceDate: new Date().toISOString().slice(0, 10),
      paymentTermsDays: 30,
      notes: 'Demo project invoice - Enterprise Platform License & Maintenance',
      items: [
        {
          description: 'Enterprise Financial Platform Suite - Annual License',
          accountCode: '4010',
          quantity: 1,
          unitPrice: 150000,
          taxRate: 18
        },
        {
          description: 'Cloud Infrastructure & High Availability Setup',
          accountCode: '4020',
          quantity: 1,
          unitPrice: 50000,
          taxRate: 18
        }
      ]
    });

    // Post the invoice to record accounting entries
    const postResult = await invoiceService.post(createdInvoice.id);
    tcsInvoice = postResult.invoice;
    console.log(`Created & Posted Invoice: ${tcsInvoice.invoiceNumber} (Total: ₹${tcsInvoice.grandTotal})`);
  }

  // 7. Seed Payment
  let payments = paymentService.getAll();
  let tcsPayment = payments.find(p => p.customerId === tcs.id);
  if (!tcsPayment && tcsInvoice) {
    console.log('Adding demo Customer Payment...');
    tcsPayment = await paymentService.createPayment({
      customerId: tcs.id,
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMethod: 'Bank Transfer',
      reference: 'HDFC-NEFT-9847120',
      bankAccountId: hdfcBank.id,
      amount: 100000,
      allocations: [
        {
          invoiceId: tcsInvoice.id,
          amount: 100000
        }
      ],
      notes: 'Part-payment received from TCS for enterprise software'
    });
    console.log(`Recorded Payment: ${tcsPayment.paymentNumber} (Amount: ₹${tcsPayment.amount})`);
  }

  // 8. Seed Expense
  let expenses = expenseService.getAll ? expenseService.getAll() : [];
  if (expenses.length === 0 && expenseService.create) {
    console.log('Adding demo Operational Expense...');
    try {
      await expenseService.create({
        expenseDate: new Date().toISOString().slice(0, 10),
        accountCode: '5010', // Software & Cloud Subscription Expense
        paymentMethod: 'Bank Transfer',
        bankAccountId: hdfcBank.id,
        vendorId: awsVendor ? awsVendor.id : null,
        amount: 25000,
        taxRate: 18,
        description: 'Monthly Cloud Infrastructure & Database Hosting (Render & AWS)',
        reference: 'AWS-INV-7721'
      });
      console.log('Recorded Demo Expense: ₹25,000');
    } catch (e) {
      console.log('Expense create note:', e.message);
    }
  }

  // 9. Seed Budgets
  let budgets = budgetService.getAll();
  if (budgets.length === 0) {
    console.log('Adding demo Budgets...');
    await budgetService.create({
      name: 'IT, Cloud Hosting & Internet 2026',
      department: 'Engineering',
      accountCode: '5130',
      budgetAmount: 1200000,
      notes: 'Annual cloud servers, hosting & infrastructure budget'
    });

    await budgetService.create({
      name: 'Corporate Marketing & Advertising',
      department: 'Marketing',
      accountCode: '5160',
      budgetAmount: 600000,
      notes: 'Annual brand awareness & customer acquisition budget'
    });
  }

  // 10. Explicitly sync all relational tables to ensure Postgres relational rows match
  const syncCollections = [
    'users',
    'accounts',
    'customers',
    'vendors',
    'invoices',
    'payments',
    'journal_entries',
    'bank_accounts',
    'budgets'
  ];

  for (const coll of syncCollections) {
    const data = jsonStore.readSync(`${coll}.json`);
    if (data && data.length > 0) {
      await syncRelationalTable(coll, data);
    }
  }

  console.log('\n Demo Data successfully seeded into Render PostgreSQL!');
  if (pool) await pool.end();
}

seed().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
