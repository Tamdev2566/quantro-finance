import fs from 'fs';
import path from 'path';
import { AsyncLocalStorage } from 'async_hooks';
import { STORAGE_DIR, BACKUP_DIR, STORAGE_FILES } from '../config/constants.js';
import { DEFAULT_ACCOUNTS } from '../accounting/defaultAccounts.js';

class JsonStore {
  constructor() {
    this.storageDir = STORAGE_DIR;
    this.backupDir = BACKUP_DIR;
    this.lockQueue = Promise.resolve();
    this.asyncLocalStorage = new AsyncLocalStorage();
    this.inMemoryCache = {};
    this.version = '1.0.0';
    this.init();
  }

  // Ensure storage directories exist and default seed files are initialized
  init() {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }

    STORAGE_FILES.forEach((file) => {
      const filePath = path.join(this.storageDir, file);
      if (!fs.existsSync(filePath)) {
        let initialData = [];
        if (file === 'company.json') {
          initialData = {
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
            fiscalYearStartMonth: 4, // April
            decimalPrecision: 2
          };
        } else if (file === 'settings.json') {
          initialData = {
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
          initialData = JSON.parse(JSON.stringify(DEFAULT_ACCOUNTS));
        } else if (file === 'periods.json') {
          initialData = [
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
          initialData = [
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
          initialData = {
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
        } else if (file === 'customers.json') {
          initialData = [];
        } else if (file === 'vendors.json') {
          initialData = [];
        } else if (file === 'bank_accounts.json') {
          initialData = [];
        }

        this.atomicWriteSync(filePath, initialData);
      }
    });
  }

  // Safe atomic file write: writes to a unique temporary file first, then atomically replaces target file
  atomicWriteSync(filePath, data) {
    const tmpPath = `${filePath}.${Date.now()}.${Math.random().toString(36).substring(2, 9)}.tmp`;
    const serialized = JSON.stringify(data, null, 2);
    fs.writeFileSync(tmpPath, serialized, 'utf8');
    fs.renameSync(tmpPath, filePath);
  }

  // Concurrency serialization lock (reentrant with AsyncLocalStorage)
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

  // Read data with caching check
  readSync(filename) {
    const safeFilename = path.basename(filename);
    const filePath = path.join(this.storageDir, safeFilename);
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  }

  // Aliases for readSync and writeSync
  read(filename) {
    return this.readSync(filename);
  }

  write(filename, data) {
    return this.writeSync(filename, data);
  }

  // Write file atomically inside the storage folder
  writeSync(filename, data) {
    const safeFilename = path.basename(filename);
    const filePath = path.join(this.storageDir, safeFilename);
    this.atomicWriteSync(filePath, data);
  }

  // Transaction support: take snapshot of files involved, execute mutator, commit or rollback on error
  async transaction(involvedFiles, executor) {
    return this.runExclusive(async () => {
      const snapshots = {};
      for (const file of involvedFiles) {
        snapshots[file] = this.readSync(file);
      }

      // Staging container for changes
      const staged = {};
      for (const file of involvedFiles) {
        // Deep copy of snapshot to allow mutation in memory
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
        // If succeeded, write all files atomically
        for (const file of involvedFiles) {
          this.writeSync(file, staged[file]);
        }
        return result;
      } catch (err) {
        // Rollback occurred implicitly because staged changes were not committed to disk
        throw err;
      }
    });
  }

  // Create full backup of current storage files
  createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const targetBackupFolder = path.join(this.backupDir, `backup_${timestamp}`);
    fs.mkdirSync(targetBackupFolder, { recursive: true });

    const backedUpFiles = [];
    STORAGE_FILES.forEach((file) => {
      const src = path.join(this.storageDir, file);
      if (fs.existsSync(src)) {
        const dest = path.join(targetBackupFolder, file);
        fs.copyFileSync(src, dest);
        backedUpFiles.push(file);
      }
    });

    const meta = {
      timestamp,
      version: this.version,
      filesCount: backedUpFiles.length,
      files: backedUpFiles
    };
    fs.writeFileSync(path.join(targetBackupFolder, 'backup_manifest.json'), JSON.stringify(meta, null, 2), 'utf8');

    return {
      backupId: `backup_${timestamp}`,
      timestamp,
      filesCount: backedUpFiles.length
    };
  }

  // List all available backups
  listBackups() {
    if (!fs.existsSync(this.backupDir)) return [];
    const entries = fs.readdirSync(this.backupDir, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory())
      .map((dir) => {
        const manifestPath = path.join(this.backupDir, dir.name, 'backup_manifest.json');
        if (fs.existsSync(manifestPath)) {
          return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        }
        return { backupId: dir.name, timestamp: dir.name.replace('backup_', '') };
      })
      .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
  }

  // Restore from a specific backup
  restoreBackup(backupId) {
    const safeBackupId = path.basename(backupId);
    const backupFolder = path.join(this.backupDir, safeBackupId);
    if (!fs.existsSync(backupFolder)) {
      throw new Error(`Backup folder not found: ${backupId}`);
    }

    const files = fs.readdirSync(backupFolder);
    files.forEach((file) => {
      if (file !== 'backup_manifest.json') {
        const src = path.join(backupFolder, file);
        const dest = path.join(this.storageDir, file);
        this.atomicWriteSync(dest, JSON.parse(fs.readFileSync(src, 'utf8')));
      }
    });

    return { success: true, restoredBackupId: safeBackupId };
  }

  // Export full finance package as JSON bundle
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

  // Import finance package bundle
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

export const jsonStore = new JsonStore();
export default jsonStore;
