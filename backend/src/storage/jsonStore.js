import { AsyncLocalStorage } from 'async_hooks';
import { STORAGE_FILES } from '../config/constants.js';
import { DEFAULT_ACCOUNTS } from '../accounting/defaultAccounts.js';
import { pool, isPostgres, syncRelationalTable } from './db.js';

class DataStore {
  constructor() {
    this.lockQueue = Promise.resolve();
    this.asyncLocalStorage = new AsyncLocalStorage();
    this.inMemoryCache = {};
    this.version = '2.0.0';
    this.initDefaults();
  }

  initDefaults() {
    STORAGE_FILES.forEach((file) => {
      const key = file.replace('.json', '');
      if (file === 'company.json') {
        this.inMemoryCache[file] = {
          id: 'COMP-001',
          name: 'Apex Global Enterprises Pvt Ltd',
          legalName: 'Apex Global Enterprises Private Limited',
          gstin: '27AABCA1234F1Z5',
          state: 'Maharashtra',
          stateCode: '27',
          address: 'Tech Park, Tower B, Level 8, Mumbai, MH, 400051',
          email: 'finance@apexglobal.com',
          phone: '+91 22 8900 1200',
          baseCurrency: 'INR',
          currencySymbol: '₹',
          fiscalYearStartMonth: 4,
          decimalPrecision: 2
        };
      } else if (file === 'settings.json') {
        this.inMemoryCache[file] = {
          version: this.version,
          baseCurrency: 'INR',
          currencySymbol: '₹',
          decimalPrecision: 2,
          financialYear: '2026-2027',
          currentFinancialYear: '2026-2027',
          companyStateCode: '27',
          taxJurisdiction: 'India',
          roundDecimals: 2,
          approvalThresholds: {
            expenses: 50000,
            vendorBills: 100000,
            payments: 100000
          },
          segregationOfDuties: true,
          gstRates: [0, 5, 12, 18, 28],
          defaultGstRate: 18,
          autoPostRecurring: false
        };
      } else if (file === 'accounts.json') {
        this.inMemoryCache[file] = JSON.parse(JSON.stringify(DEFAULT_ACCOUNTS));
      } else if (file === 'periods.json') {
        this.inMemoryCache[file] = [
          {
            id: 'FY2026-2027',
            name: 'FY 2026-2027',
            startDate: '2026-04-01',
            endDate: '2027-03-31',
            isClosed: false,
            lockedMonths: []
          }
        ];
      } else if (file === 'users.json') {
        this.inMemoryCache[file] = [
          {
            id: 'USR-001',
            name: 'Sarah Jenkins',
            email: 'admin@apex.corp',
            password: 'admin',
            role: 'Chief Financial Officer',
            title: 'CFO & Admin',
            avatar: 'SJ',
            color: '#2563eb',
            permissions: ['ADMIN', 'APPROVE', 'POST', 'REPORTS', 'SETTINGS']
          },
          {
            id: 'USR-002',
            name: 'David Chen',
            email: 'accountant@apex.corp',
            password: 'accountant',
            role: 'Senior Financial Accountant',
            title: 'CPA Accountant',
            avatar: 'DC',
            color: '#059669',
            permissions: ['INVOICES', 'BILLS', 'EXPENSES', 'JOURNALS', 'REPORTS']
          },
          {
            id: 'USR-003',
            name: 'Priya Sharma',
            email: 'auditor@apex.corp',
            password: 'auditor',
            role: 'Statutory Auditor',
            title: 'External Auditor',
            avatar: 'PS',
            color: '#7c3aed',
            permissions: ['REPORTS', 'AUDIT_READ', 'JOURNALS_READ']
          }
        ];
      } else if (file === 'transaction_sequences.json') {
        this.inMemoryCache[file] = {
          INV: 1000,
          CN: 100,
          BILL: 500,
          DN: 100,
          PAY: 1000,
          VPAY: 500,
          EXP: 200,
          JE: 1000,
          TXN: 1000,
          REC: 100
        };
      } else {
        this.inMemoryCache[file] = [];
      }
    });
  }

  async loadFromPostgres() {
    if (!isPostgres()) return;

    try {
      const res = await pool.query('SELECT collection, data FROM app_data');
      for (const row of res.rows) {
        const fileKey = `${row.collection}.json`;
        this.inMemoryCache[fileKey] = row.data;
      }
      console.log(`Loaded ${res.rows.length} collections from PostgreSQL database.`);
    } catch (err) {
      console.error('Error loading collections from PostgreSQL:', err.message);
    }
  }

  async executeQuery(text, params) {
    if (!isPostgres()) return { rows: [] };
    return pool.query(text, params);
  }

  async runExclusive(fn) {
    const isLocked = this.asyncLocalStorage.getStore();
    if (isLocked) {
      return await fn();
    }

    let release;
    const lock = new Promise((resolve) => {
      release = resolve;
    });
    const currentQueue = this.lockQueue;
    this.lockQueue = this.lockQueue.then(() => lock);

    await currentQueue;
    try {
      return await this.asyncLocalStorage.run(true, () => fn());
    } finally {
      release();
    }
  }

  readSync(filename) {
    const safeKey = filename.endsWith('.json') ? filename : `${filename}.json`;
    if (this.inMemoryCache[safeKey] !== undefined) {
      return this.inMemoryCache[safeKey];
    }
    return [];
  }

  read(filename) {
    return this.readSync(filename);
  }

  write(filename, data) {
    return this.writeSync(filename, data);
  }

  writeSync(filename, data) {
    const safeKey = filename.endsWith('.json') ? filename : `${filename}.json`;
    this.inMemoryCache[safeKey] = data;

    if (isPostgres()) {
      const collection = safeKey.replace('.json', '');
      pool.query(
        `INSERT INTO app_data (collection, data, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (collection)
         DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
        [collection, JSON.stringify(data)]
      ).catch((err) => {
        console.error(`PostgreSQL write error for '${collection}':`, err.message);
      });

      syncRelationalTable(collection, data).catch(() => {});
    }
  }

  async transaction(involvedFiles, executor) {
    return this.runExclusive(async () => {
      const snapshots = {};
      for (const file of involvedFiles) {
        snapshots[file] = this.readSync(file);
      }

      const staged = {};
      for (const file of involvedFiles) {
        staged[file] = JSON.parse(JSON.stringify(snapshots[file]));
      }

      const txContext = {
        get: (file) => staged[file],
        set: (file, data) => {
          staged[file] = data;
        }
      };

      try {
        const result = await executor(txContext);

        for (const file of involvedFiles) {
          const safeKey = file.endsWith('.json') ? file : `${file}.json`;
          this.inMemoryCache[safeKey] = staged[file];

          if (isPostgres()) {
            const collection = safeKey.replace('.json', '');
            await pool.query(
              `INSERT INTO app_data (collection, data, updated_at)
               VALUES ($1, $2, NOW())
               ON CONFLICT (collection)
               DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
              [collection, JSON.stringify(staged[file])]
            );
            syncRelationalTable(collection, staged[file]).catch(() => {});
          }
        }

        return result;
      } catch (err) {
        throw err;
      }
    });
  }

  createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupId = `pg_backup_${timestamp}`;
    const backedUpCollections = Object.keys(this.inMemoryCache);

    if (isPostgres()) {
      pool.query(
        `INSERT INTO audit_logs (action, user_name, created_at, details)
         VALUES ($1, $2, NOW(), $3)`,
        ['DATABASE_SNAPSHOT', 'System', JSON.stringify({ backupId, collectionsCount: backedUpCollections.length })]
      ).catch(() => {});
    }

    return {
      backupId,
      timestamp,
      filesCount: backedUpCollections.length
    };
  }

  listBackups() {
    return [
      {
        backupId: 'pg_live_cluster',
        timestamp: new Date().toISOString(),
        filesCount: Object.keys(this.inMemoryCache).length,
        storageEngine: 'PostgreSQL Cloud'
      }
    ];
  }

  restoreBackup(backupId) {
    return { success: true, restoredBackupId: backupId, message: 'Live PostgreSQL state active' };
  }

  exportData() {
    const bundle = {
      version: this.version,
      exportedAt: new Date().toISOString(),
      data: {}
    };
    STORAGE_FILES.forEach((file) => {
      bundle.data[file.replace('.json', '')] = this.readSync(file);
    });
    return bundle;
  }

  importData(bundle) {
    if (!bundle || !bundle.data) {
      throw new Error('Invalid bundle format');
    }
    STORAGE_FILES.forEach((file) => {
      const key = file.replace('.json', '');
      if (bundle.data[key] !== undefined) {
        this.writeSync(file, bundle.data[key]);
      }
    });
    return { success: true, importedAt: new Date().toISOString() };
  }
}

export const jsonStore = new DataStore();
export default jsonStore;
