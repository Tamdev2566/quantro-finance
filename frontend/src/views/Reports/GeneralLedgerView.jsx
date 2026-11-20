import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { apiClient } from '../../api/client';
import { showNotification } from '../../store';
import DataTable from '../../components/Common/DataTable';
import {
  Box,
  Typography,
  Card,
  Grid,
  TextField,
  MenuItem
} from '@mui/material';

export default function GeneralLedgerView() {
  const dispatch = useDispatch();
  const refreshKey = useSelector((state) => state.finance.refreshKey);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountCode, setSelectedAccountCode] = useState('1200');
  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.getAccounts().then((res) => {
      setAccounts(res.data || []);
      if (res.data?.length > 0 && !selectedAccountCode) {
        setSelectedAccountCode(res.data[0].code);
      }
    });
  }, [refreshKey]);

  useEffect(() => {
    if (selectedAccountCode) {
      setLoading(true);
      apiClient.getGeneralLedger({ accountCode: selectedAccountCode })
        .then((res) => {
          setLedgerData(res.data);
        })
        .catch((err) => {
          dispatch(showNotification({ message: err.message, severity: 'error' }));
        })
        .finally(() => setLoading(false));
    }
  }, [selectedAccountCode, refreshKey]);

  const columns = [
    { header: 'Posting Date', field: 'postingDate', width: 120 },
    {
      header: 'Journal #',
      field: 'journalNumber',
      width: 150,
      cellStyle: { fontWeight: 700, color: '#e5a93c' }
    },
    { header: 'Reference', field: 'referenceNumber', width: 140 },
    { header: 'Type', field: 'transactionType', width: 130 },
    { header: 'Narration / Description', field: 'description', minWidth: 220 },
    {
      header: 'Debit (₹)',
      field: 'debit',
      align: 'right',
      width: 130,
      cellStyle: (r) => ({ fontWeight: r.debit > 0 ? 700 : 400 }),
      render: (r) => (r.debit ? `₹${r.debit.toLocaleString('en-IN')}` : '—')
    },
    {
      header: 'Credit (₹)',
      field: 'credit',
      align: 'right',
      width: 130,
      cellStyle: (r) => ({ fontWeight: r.credit > 0 ? 700 : 400 }),
      render: (r) => (r.credit ? `₹${r.credit.toLocaleString('en-IN')}` : '—')
    },
    {
      header: 'Running Balance (₹)',
      field: 'runningBalance',
      align: 'right',
      width: 160,
      cellStyle: { fontWeight: 800, color: '#0f172a' },
      render: (r) => (r.runningBalance !== undefined ? `₹${r.runningBalance.toLocaleString('en-IN')}` : '₹0')
    }
  ];

  return (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
          General Ledger & Account Statements
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
          Real-time transaction audit trail, debit/credit entries, and incremental running balance
        </Typography>
      </Box>

      {/* Account Selector Banner */}
      <Card
        sx={{
          p: { xs: 2, sm: 2.5 },
          mb: 3,
          borderRadius: { xs: '16px', sm: '20px' },
          boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.03)',
          border: '1px solid #f1f5f9'
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} sm={5}>
            <TextField
              select
              fullWidth
              size="small"
              label="Select Ledger Account"
              value={selectedAccountCode}
              onChange={(e) => setSelectedAccountCode(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            >
              {accounts.map((a) => (
                <MenuItem key={a.code} value={a.code}>
                  {a.code} – {a.name} ({a.type})
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={7}>
            <Box sx={{ display: 'flex', gap: { xs: 2, sm: 4 }, justifyContent: { xs: 'space-between', sm: 'flex-end' }, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Opening Balance</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  ₹{ledgerData?.openingBalance?.toLocaleString('en-IN') || '0.00'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Total Debits</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#e5a93c' }}>
                  ₹{ledgerData?.totalDebit?.toLocaleString('en-IN') || '0.00'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Total Credits</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#e5a93c' }}>
                  ₹{ledgerData?.totalCredit?.toLocaleString('en-IN') || '0.00'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Closing Balance</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#10b981' }}>
                  ₹{ledgerData?.closingBalance?.toLocaleString('en-IN') || '0.00'}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Card>

      {/* MUI Data Table */}
      <DataTable
        columns={columns}
        rows={ledgerData?.entries || []}
        loading={loading}
        emptyMessage="No ledger entries recorded for this account."
      />
    </Box>
  );
}
