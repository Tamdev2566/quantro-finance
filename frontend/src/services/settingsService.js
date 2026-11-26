import httpClient from '../api/client';

export const settingsService = {
  getPeriods: () => httpClient.get('/periods'),
  createPeriod: (data) => httpClient.post('/periods', data),
  lockMonth: (id, data) => httpClient.post(`/periods/${id}/lock-month`, data),
  closeFiscalYear: (id) => httpClient.post(`/periods/${id}/close-year`),

  getAuditLogs: (params) => httpClient.get('/audit-logs', { params }),

  getCompany: () => httpClient.get('/company'),
  updateCompany: (data) => httpClient.put('/company', data),
  getSettings: () => httpClient.get('/settings'),
  updateSettings: (data) => httpClient.put('/settings', data),

  createBackup: () => httpClient.post('/backup'),
  getBackups: () => httpClient.get('/backups'),
  restoreBackup: (data) => httpClient.post('/restore', data),
  exportData: () => httpClient.get('/export'),
  importData: (data) => httpClient.post('/import', data)
};

export default settingsService;
