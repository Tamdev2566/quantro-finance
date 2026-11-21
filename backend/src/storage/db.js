import pg from 'pg';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

let pool = null;

if (connectionString) {
  pool = new Pool({
    connectionString,
    ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000
  });

  pool.on('error', (err) => {
    console.error('PostgreSQL Pool Error:', err.message);
  });
}

export const isPostgres = () => Boolean(pool);

export const query = async (text, params) => {
  if (!pool) return { rows: [] };
  return pool.query(text, params);
};

export const getClient = async () => {
  if (!pool) throw new Error('Database pool not initialized (DATABASE_URL missing)');
  return pool.connect();
};

export async function syncRelationalTable(collection, data) {
  if (!pool || !Array.isArray(data)) return;

  try {
    if (collection === 'accounts') {
      for (const a of data) {
        if (!a.code) continue;
        await pool.query(
          `INSERT INTO accounts (code, name, type, category, current_balance, data, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())
           ON CONFLICT (code) DO UPDATE
           SET name = EXCLUDED.name, type = EXCLUDED.type, category = EXCLUDED.category,
               current_balance = EXCLUDED.current_balance, data = EXCLUDED.data`,
          [a.code, a.name, a.type, a.category, a.currentBalance || 0, JSON.stringify(a)]
        );
      }
    } else if (collection === 'users') {
      for (const u of data) {
        if (!u.id) continue;
        await pool.query(
          `INSERT INTO users (id, name, email, role, data, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())
           ON CONFLICT (id) DO UPDATE
           SET name = EXCLUDED.name, email = EXCLUDED.email, role = EXCLUDED.role, data = EXCLUDED.data`,
          [u.id, u.name, u.email, u.role, JSON.stringify(u)]
        );
      }
    } else if (collection === 'customers') {
      for (const c of data) {
        if (!c.id) continue;
        await pool.query(
          `INSERT INTO customers (id, name, email, gstin, outstanding_balance, data, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())
           ON CONFLICT (id) DO UPDATE
           SET name = EXCLUDED.name, email = EXCLUDED.email, gstin = EXCLUDED.gstin,
               outstanding_balance = EXCLUDED.outstanding_balance, data = EXCLUDED.data`,
          [c.id, c.name, c.email || '', c.gstin || '', c.outstandingBalance || 0, JSON.stringify(c)]
        );
      }
    } else if (collection === 'vendors') {
      for (const v of data) {
        if (!v.id) continue;
        await pool.query(
          `INSERT INTO vendors (id, name, email, gstin, outstanding_balance, data, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())
           ON CONFLICT (id) DO UPDATE
           SET name = EXCLUDED.name, email = EXCLUDED.email, gstin = EXCLUDED.gstin,
               outstanding_balance = EXCLUDED.outstanding_balance, data = EXCLUDED.data`,
          [v.id, v.name, v.email || '', v.gstin || '', v.outstandingBalance || 0, JSON.stringify(v)]
        );
      }
    } else if (collection === 'invoices') {
      for (const inv of data) {
        if (!inv.id && !inv.invoiceNumber) continue;
        await pool.query(
          `INSERT INTO invoices (id, invoice_number, customer_id, issue_date, due_date, total_amount, status, data, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
           ON CONFLICT (invoice_number) DO UPDATE
           SET id = EXCLUDED.id, status = EXCLUDED.status, customer_id = EXCLUDED.customer_id,
               issue_date = EXCLUDED.issue_date, due_date = EXCLUDED.due_date,
               total_amount = EXCLUDED.total_amount, data = EXCLUDED.data`,
          [inv.id, inv.invoiceNumber, inv.customerId || null, inv.invoiceDate || inv.issueDate || null, inv.dueDate || null, inv.grandTotal || inv.totalAmount || 0, inv.status, JSON.stringify(inv)]
        );
      }
    } else if (collection === 'payments') {
      for (const p of data) {
        if (!p.id && !p.paymentNumber) continue;
        await pool.query(
          `INSERT INTO payments (id, payment_number, payment_date, amount, payment_mode, data, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())
           ON CONFLICT (payment_number) DO UPDATE
           SET id = EXCLUDED.id, amount = EXCLUDED.amount, payment_date = EXCLUDED.payment_date,
               payment_mode = EXCLUDED.payment_mode, data = EXCLUDED.data`,
          [p.id, p.paymentNumber, p.paymentDate || null, p.amount || 0, p.paymentMode || p.paymentMethod || '', JSON.stringify(p)]
        );
      }
    } else if (collection === 'journal_entries') {
      for (const j of data) {
        if (!j.id && !j.journalNumber) continue;
        await pool.query(
          `INSERT INTO journal_entries (id, journal_number, posting_date, total_debit, total_credit, status, data, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
           ON CONFLICT (journal_number) DO UPDATE
           SET id = EXCLUDED.id, posting_date = EXCLUDED.posting_date, total_debit = EXCLUDED.total_debit,
               total_credit = EXCLUDED.total_credit, status = EXCLUDED.status, data = EXCLUDED.data`,
          [j.id, j.journalNumber, j.postingDate || null, j.totalDebit || 0, j.totalCredit || 0, j.status, JSON.stringify(j)]
        );
      }
    } else if (collection === 'bank_accounts') {
      for (const b of data) {
        if (!b.id) continue;
        await pool.query(
          `INSERT INTO bank_accounts (id, account_name, bank_name, account_number, current_balance, data, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())
           ON CONFLICT (id) DO UPDATE
           SET account_name = EXCLUDED.account_name, bank_name = EXCLUDED.bank_name,
               current_balance = EXCLUDED.current_balance, data = EXCLUDED.data`,
          [b.id, b.accountName, b.bankName || '', b.accountNumber || '', b.currentBalance || 0, JSON.stringify(b)]
        );
      }
    } else if (collection === 'budgets') {
      for (const bg of data) {
        if (!bg.id) continue;
        await pool.query(
          `INSERT INTO budgets (id, name, department, budget_amount, data, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())
           ON CONFLICT (id) DO UPDATE
           SET name = EXCLUDED.name, department = EXCLUDED.department,
               budget_amount = EXCLUDED.budget_amount, data = EXCLUDED.data`,
          [bg.id, bg.name, bg.department, bg.budgetAmount || 0, JSON.stringify(bg)]
        );
      }
    }
  } catch (err) {
    console.error(`Error syncing relational table '${collection}':`, err.message);
  }
}

export { pool };
export default { pool, query, getClient, isPostgres, syncRelationalTable };
