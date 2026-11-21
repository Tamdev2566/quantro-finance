import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, isPostgres } from './db.js';
import { STORAGE_FILES, STORAGE_DIR } from '../config/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function initPostgres() {
  if (!isPostgres()) {
    console.log('No DATABASE_URL found. Using local JSON store.');
    return false;
  }

  const client = await pool.connect();
  try {
    console.log('Initializing PostgreSQL database schema...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS app_data (
        collection VARCHAR(100) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(100) UNIQUE,
        role VARCHAR(50),
        data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS accounts (
        code VARCHAR(20) PRIMARY KEY,
        name VARCHAR(100),
        type VARCHAR(50),
        category VARCHAR(50),
        current_balance NUMERIC(15,2) DEFAULT 0,
        data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(150),
        email VARCHAR(100),
        gstin VARCHAR(50),
        outstanding_balance NUMERIC(15,2) DEFAULT 0,
        data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS vendors (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(150),
        email VARCHAR(100),
        gstin VARCHAR(50),
        outstanding_balance NUMERIC(15,2) DEFAULT 0,
        data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS invoices (
        id VARCHAR(50) PRIMARY KEY,
        invoice_number VARCHAR(50) UNIQUE,
        customer_id VARCHAR(50),
        issue_date DATE,
        due_date DATE,
        total_amount NUMERIC(15,2) DEFAULT 0,
        status VARCHAR(30),
        data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR(50) PRIMARY KEY,
        payment_number VARCHAR(50) UNIQUE,
        payment_date DATE,
        amount NUMERIC(15,2) DEFAULT 0,
        payment_mode VARCHAR(50),
        data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS journal_entries (
        id VARCHAR(50) PRIMARY KEY,
        journal_number VARCHAR(50) UNIQUE,
        posting_date DATE,
        total_debit NUMERIC(15,2) DEFAULT 0,
        total_credit NUMERIC(15,2) DEFAULT 0,
        status VARCHAR(30),
        data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS bank_accounts (
        id VARCHAR(50) PRIMARY KEY,
        account_name VARCHAR(150),
        bank_name VARCHAR(100),
        account_number VARCHAR(50),
        current_balance NUMERIC(15,2) DEFAULT 0,
        data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS budgets (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(150),
        department VARCHAR(50),
        budget_amount NUMERIC(15,2) DEFAULT 0,
        data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        action VARCHAR(100),
        user_name VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        details JSONB
      );
    `);

    // Migrate or Seed initial data from local JSON storage if empty in Postgres
    for (const file of STORAGE_FILES) {
      const collectionName = file.replace('.json', '');
      const localFilePath = path.join(STORAGE_DIR, file);

      const check = await client.query('SELECT collection FROM app_data WHERE collection = $1', [collectionName]);
      if (check.rows.length === 0) {
        let initialData = [];
        if (fs.existsSync(localFilePath)) {
          try {
            initialData = JSON.parse(fs.readFileSync(localFilePath, 'utf8'));
          } catch (e) {
            initialData = [];
          }
        }
        await client.query(
          'INSERT INTO app_data (collection, data, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (collection) DO NOTHING',
          [collectionName, JSON.stringify(initialData)]
        );
        console.log(`Seeded '${collectionName}' into PostgreSQL.`);
      }
    }

    console.log('PostgreSQL schema and initial data verified successfully!');
    return true;
  } catch (err) {
    console.error('Failed to initialize PostgreSQL schema:', err);
    throw err;
  } finally {
    client.release();
  }
}

export default initPostgres;
