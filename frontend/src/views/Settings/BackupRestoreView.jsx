import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { apiClient } from '../../api/client';
import { showNotification } from '../../store';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import {
  Box,
  Typography,
  Card,
  Grid,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  CircularProgress
} from '@mui/material';
import BackupIcon from '@mui/icons-material/Backup';
import RestoreIcon from '@mui/icons-material/Restore';
import ExportIcon from '@mui/icons-material/FileDownload';
import ImportIcon from '@mui/icons-material/FileUpload';

export default function BackupRestoreView() {
  const dispatch = useDispatch();
  const refreshKey = useSelector((state) => state.finance.refreshKey);
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmRestoreId, setConfirmRestoreId] = useState(null);

  const fetchBackups = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getBackups();
      setBackups(res.data || []);
    } catch (err) {
      dispatch(showNotification({ message: err.message, severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, [refreshKey]);

  const handleCreateBackup = async () => {
    try {
      const res = await apiClient.createBackup();
      dispatch(showNotification({
        message: `Backup created: ${res.data?.backupId} (${res.data?.filesCount} files)`,
        severity: 'success'
      }));
      fetchBackups();
    } catch (err) {
      dispatch(showNotification({ message: err.message, severity: 'error' }));
    }
  };

  const handleRestore = async () => {
    if (!confirmRestoreId) return;
    try {
      await apiClient.restoreBackup({ backupId: confirmRestoreId });
      dispatch(showNotification({ message: `Successfully restored storage from ${confirmRestoreId}`, severity: 'success' }));
      setConfirmRestoreId(null);
      fetchBackups();
    } catch (err) {
      dispatch(showNotification({ message: err.message, severity: 'error' }));
    }
  };

  const handleExport = async () => {
    try {
      const res = await apiClient.exportData();
      const jsonStr = JSON.stringify(res, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finance_export_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      dispatch(showNotification({ message: 'Finance database exported successfully', severity: 'success' }));
    } catch (err) {
      dispatch(showNotification({ message: err.message, severity: 'error' }));
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bundle = JSON.parse(evt.target.result);
        await apiClient.importData(bundle);
        dispatch(showNotification({ message: 'Finance data bundle imported successfully!', severity: 'success' }));
        fetchBackups();
      } catch (err) {
        dispatch(showNotification({ message: `Import failed: ${err.message}`, severity: 'error' }));
      }
    };
    reader.readAsText(file);
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Storage Backup, Restore & Data Migration
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Atomic snapshots of all finance JSON databases, point-in-time recovery, and portable export/import
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" startIcon={<ExportIcon />} onClick={handleExport}>
            Export JSON Data
          </Button>
          <Button variant="outlined" component="label" startIcon={<ImportIcon />}>
            Import Data
            <input type="file" accept=".json" hidden onChange={handleImport} />
          </Button>
          <Button variant="contained" startIcon={<BackupIcon />} onClick={handleCreateBackup}>
            Create Snapshot Now
          </Button>
        </Box>
      </Box>

      <Card sx={{ p: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
          Available Snapshot Archives
        </Typography>

        <Table size="small" sx={{ border: '1px solid #e2e8f0' }}>
          <TableHead sx={{ backgroundColor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Backup ID / Folder</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Timestamp</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Files Included</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {backups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3, color: '#64748b' }}>
                  No backup snapshots taken yet. Click "Create Snapshot Now" above.
                </TableCell>
              </TableRow>
            ) : (
              backups.map((b) => (
                <TableRow key={b.backupId}>
                  <TableCell sx={{ fontWeight: 600, color: '#2563eb' }}>{b.backupId}</TableCell>
                  <TableCell>{b.timestamp}</TableCell>
                  <TableCell>{b.filesCount ? `${b.filesCount} JSON Files` : 'All'}</TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="outlined"
                      color="warning"
                      startIcon={<RestoreIcon />}
                      onClick={() => setConfirmRestoreId(b.backupId)}
                    >
                      Restore Snapshot
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <ConfirmDialog
        open={Boolean(confirmRestoreId)}
        title="Restore Storage Snapshot?"
        content={`Restoring '${confirmRestoreId}' will replace the current active JSON storage files with this backup archive. Unsaved transactions will be overwritten.`}
        confirmText="Restore Snapshot"
        confirmColor="warning"
        onConfirm={handleRestore}
        onCancel={() => setConfirmRestoreId(null)}
      />
    </Box>
  );
}
