import { query, pool } from '../src/storage/db.js';

async function inspect() {
  console.log('Connecting to Render PostgreSQL...\n');

  try {
    const res = await query(`
      SELECT collection, updated_at, jsonb_array_length(CASE WHEN jsonb_typeof(data) = 'array' THEN data ELSE '[]'::jsonb END) as item_count 
      FROM app_data 
      ORDER BY collection ASC;
    `);

    console.log('====================================================');
    console.log('       LIVE DATA IN RENDER POSTGRESQL (app_data)     ');
    console.log('====================================================');
    console.table(res.rows);

    // Also check relational users & accounts
    const users = await query('SELECT id, name, email, role FROM users LIMIT 5');
    if (users.rows.length > 0) {
      console.log('\n--- Sample Records in users table ---');
      console.table(users.rows);
    }

    const accounts = await query('SELECT code, name, type, current_balance FROM accounts LIMIT 5');
    if (accounts.rows.length > 0) {
      console.log('\n--- Sample Records in accounts table ---');
      console.table(accounts.rows);
    }

    console.log('\n Database connection successful and live!');
  } catch (err) {
    console.error('Error querying database:', err.message);
  } finally {
    if (pool) await pool.end();
  }
}

inspect();
