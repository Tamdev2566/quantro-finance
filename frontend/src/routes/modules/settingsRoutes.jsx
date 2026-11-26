import React from 'react';
import CompanySettingsView from '../../views/Settings/CompanySettingsView';
import BackupRestoreView from '../../views/Settings/BackupRestoreView';
import AuditLogsView from '../../views/Settings/AuditLogsView';

export const settingsRoutes = [
  { path: '/company-settings', element: <CompanySettingsView /> },
  { path: '/backup-restore', element: <BackupRestoreView /> },
  { path: '/audit-logs', element: <AuditLogsView /> }
];

export default settingsRoutes;
