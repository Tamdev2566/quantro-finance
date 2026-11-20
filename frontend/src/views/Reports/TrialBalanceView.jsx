import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { apiClient } from '../../api/client';
import { showNotification } from '../../store';
import DataTable from '../../components/Common/DataTable';
import {
  Box,
  Typography,
  Card,
  Button,
  Chip
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import BalancedIcon from '@mui/icons-material/CheckCircle';

export default function TrialBalanceView() {
  const dispatch = useDispatch();
  const refreshKey = useSelector((state) => state.finance.refreshKey);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTrialBalance = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getTrialBalance();
      setReport(res.data);
    } catch (err) {
      dispatch(showNotification({ message: err.message, severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrialBalance();
  }, [refreshKey]);

  const rows = report?.rows || [];
  const totals = report?.totals || {};

  const columns = [
    { header: 'Code', field: 'accountCode', width: 100, cellStyle: { fontWeight: 700, color: '#e5a93c' } },
    { header: 'Account Name', field: 'accountName', minWidth: 200, cellStyle: { fontWeight: 600 } },
    { header: 'Type', field: 'accountType', width: 130 },
    {
      header: 'Period Debit (₹)',
      field: 'periodDebit',
      align: 'right',
      width: 150,
      render: (r) => (r.periodDebit ? `₹${r.periodDebit.toLocaleString('en-IN')}` : '—')
    },
    {
      header: 'Period Credit (₹)',
      field: 'periodCredit',
      align: 'right',
      width: 150,
      render: (r) => (r.periodCredit ? `₹${r.periodCredit.toLocaleString('en-IN')}` : '—')
    },
    {
      header: 'Closing Debit (₹)',
      field: 'closingDebit',
      align: 'right',
      width: 150,
      cellStyle: { fontWeight: 700 },
      render: (r) => (r.closingDebit ? `₹${r.closingDebit.toLocaleString('en-IN')}` : '—')
    },
    {
      header: 'Closing Credit (₹)',
      field: 'closingCredit',
      align: 'right',
      width: 150,
      cellStyle: { fontWeight: 700 },
      render: (r) => (r.closingCredit ? `₹${r.closingCredit.toLocaleString('en-IN')}` : '—')
    }
  ];

  return (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            Trial Balance Report
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
            Verification of arithmetic accuracy across all debit and credit account balances
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'space-between', sm: 'flex-end' } }}>
          {totals.isBalanced && (
            <Chip
              icon={<BalancedIcon sx={{ color: '#10b981 !important' }} />}
              label="Debit & Credit Balanced"
              sx={{
                fontWeight: 600,
                backgroundColor: '#f0fdf4',
                color: '#16a34a',
                borderRadius: '10px',
                fontSize: { xs: '0.75rem', sm: '0.8125rem' }
              }}
            />
          )}
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
            sx={{ width: { xs: '100%', sm: 'auto' }, borderRadius: '12px', textTransform: 'none' }}
          >
            Print
          </Button>
        </Box>
      </Box>

      {/* Totals Summary Banner */}
      <Card
        sx={{
          p: { xs: 2, sm: 2.5 },
          mb: 3,
          backgroundColor: '#ffffff',
          borderRadius: { xs: '16px', sm: '20px' },
          border: '1px solid #f1f5f9',
          boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.03)'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Period Total Debits</Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#e5a93c' }}>
              ₹{totals.periodDebit?.toLocaleString('en-IN') || '0.00'}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Period Total Credits</Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#e5a93c' }}>
              ₹{totals.periodCredit?.toLocaleString('en-IN') || '0.00'}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Closing Total Debits</Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#10b981' }}>
              ₹{totals.closingDebit?.toLocaleString('en-IN') || '0.00'}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Closing Total Credits</Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#10b981' }}>
              ₹{totals.closingCredit?.toLocaleString('en-IN') || '0.00'}
            </Typography>
          </Box>
        </Box>
      </Card>

      {/* MUI Data Table */}
      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        defaultPageSize={15}
        emptyMessage="No trial balance figures generated yet."
      />
    </Box>
  );
}
