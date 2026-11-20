import jsonStore from '../storage/jsonStore.js';
import auditService from './auditService.js';

class SettingsService {
  getCompany() {
    return jsonStore.readSync('company.json');
  }

  getSettings() {
    return jsonStore.readSync('settings.json');
  }

  async updateCompany(data, user = 'System User') {
    return jsonStore.transaction(['company.json'], async (tx) => {
      const company = tx.get('company.json');
      const before = { ...company };
      const updated = {
        ...company,
        ...data,
        stateCode: data.stateCode || (data.gstin ? data.gstin.slice(0, 2) : company.stateCode)
      };

      tx.set('company.json', updated);

      await auditService.log({
        user,
        action: 'Update Company Profile',
        transactionType: 'SETTINGS',
        transactionId: updated.id || 'COMP-001',
        beforeValues: before,
        afterValues: updated,
        sourceModule: 'Settings'
      });

      return updated;
    });
  }

  async updateSettings(data, user = 'System User') {
    return jsonStore.transaction(['settings.json'], async (tx) => {
      const settings = tx.get('settings.json');
      const before = { ...settings };
      const updated = {
        ...settings,
        ...data
      };

      tx.set('settings.json', updated);

      await auditService.log({
        user,
        action: 'Update Settings',
        transactionType: 'SETTINGS',
        transactionId: 'SETTINGS',
        beforeValues: before,
        afterValues: updated,
        sourceModule: 'Settings'
      });

      return updated;
    });
  }

  createBackup(user = 'System User') {
    const backup = jsonStore.createBackup();
    auditService.log({
      user,
      action: 'Create Backup',
      transactionType: 'BACKUP',
      transactionId: backup.backupId,
      sourceModule: 'Settings'
    });
    return backup;
  }

  listBackups() {
    return jsonStore.listBackups();
  }

  restoreBackup(backupId, user = 'System User') {
    const result = jsonStore.restoreBackup(backupId);
    auditService.log({
      user,
      action: 'Restore Backup',
      transactionType: 'BACKUP',
      transactionId: backupId,
      sourceModule: 'Settings'
    });
    return result;
  }

  exportData(user = 'System User') {
    const data = jsonStore.exportData();
    auditService.log({
      user,
      action: 'Export Finance Data',
      transactionType: 'EXPORT',
      transactionId: 'BUNDLE',
      sourceModule: 'Settings'
    });
    return data;
  }

  importData(bundle, user = 'System User') {
    const result = jsonStore.importData(bundle);
    auditService.log({
      user,
      action: 'Import Finance Data',
      transactionType: 'IMPORT',
      transactionId: 'BUNDLE',
      sourceModule: 'Settings'
    });
    return result;
  }
}

export const settingsService = new SettingsService();
export default settingsService;
