import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { apiClient } from '../../api/client';
import { showNotification } from '../../store';
import DataTable from '../../components/Common/DataTable';
import {
  Box,
  Typography,
  Chip,
  TextField,
  InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

export default function AuditLogsView() {
  const dispatch = useDispatch();
  const refreshKey = useSelector((state) => state.finance.refreshKey);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getAuditLogs();
      setLogs(res.data || []);
    } catch (err) {
      dispatch(showNotification({ message: err.message, severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [refreshKey]);

  const filtered = logs.filter((l) => {
    if (!searchText) return true;
    const q = searchText.toLowerCase();
    return (
      l.action?.toLowerCase().includes(q) ||
      l.transactionType?.toLowerCase().includes(q) ||
      l.user?.toLowerCase().includes(q) ||
      l.sourceModule?.toLowerCase().includes(q) ||
      l.transactionId?.toLowerCase().includes(q)
    );
  });

  const columns = [
    { header: 'Timestamp', field: 'timestamp', width: 180 },
    { header: 'User', field: 'user', width: 140, cellStyle: { fontWeight: 600 } },
    {
      header: 'Action',
      field: 'action',
      width: 170,
      render: (r) => (
        <Chip
          label={r.action}
          size="small"
          sx={{
            fontWeight: 600,
            fontSize: '0.75rem',
            backgroundColor: '#eef2ff',
            color: '#4f46e5',
            borderRadius: '6px'
          }}
        />
      )
    },
    { header: 'Transaction Type', field: 'transactionType', width: 160 },
    {
      header: 'Transaction ID / Ref',
      field: 'transactionId',
      width: 170,
      cellStyle: { fontWeight: 600, color: '#e5a93c' }
    },
    { header: 'Module', field: 'sourceModule', width: 150 },
    {
      header: 'Audit Snapshot / Reason',
      minWidth: 260,
      render: (r) => {
        if (r.reason) return `Reason: ${r.reason}`;
        if (r.afterValues) return JSON.stringify(r.afterValues);
        return '—';
      }
    }
  ];

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
          Immutable Financial Audit Trail
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
          Append-only chronological audit log of all financial creations, approvals, postings, and reversals
        </Typography>
      </Box>

      <Box sx={{ mb: 2.5 }}>
        <TextField
          size="small"
          placeholder="Search audit trail by user, action, transaction..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{
            width: { xs: '100%', sm: 380 },
            backgroundColor: '#ffffff',
            '& .MuiOutlinedInput-root': { borderRadius: '4px' }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
              </InputAdornment>
            )
          }}
        />
      </Box>

      {/* MUI Data Table */}
      <DataTable
        columns={columns}
        rows={filtered}
        loading={loading}
        defaultPageSize={12}
        emptyMessage="No matching audit trail records found."
      />
    </Box>
  );
}
