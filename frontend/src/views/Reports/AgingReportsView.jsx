import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { apiClient } from '../../api/client';
import { showNotification } from '../../store';
import StatCard from '../../components/Common/StatCard';
import DataTable from '../../components/Common/DataTable';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Grid
} from '@mui/material';
import Receipt from '@mui/icons-material/Receipt';
import ShoppingCart from '@mui/icons-material/ShoppingCart';

export default function AgingReportsView({ defaultType = 'receivables' }) {
  const dispatch = useDispatch();
  const refreshKey = useSelector((state) => state.finance.refreshKey);
  const [tab, setTab] = useState(defaultType === 'payables' ? 1 : 0);
  const [recData, setRecData] = useState(null);
  const [payData, setPayData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAging = async () => {
    try {
      setLoading(true);
      const [rRes, pRes] = await Promise.all([
        apiClient.getReceivablesAging(),
        apiClient.getPayablesAging()
      ]);
      setRecData(rRes.data);
      setPayData(pRes.data);
    } catch (err) {
      dispatch(showNotification({ message: err.message, severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAging();
  }, [refreshKey]);

  const activeData = tab === 0 ? recData : payData;
  const summary = activeData?.summary || {};
  const rows = activeData?.rows || [];

  const columns = [
    {
      header: tab === 0 ? 'Customer' : 'Vendor',
      field: tab === 0 ? 'customerName' : 'vendorName',
      minWidth: 200,
      cellStyle: { fontWeight: 700, color: '#e5a93c' }
    },
    {
      header: 'Current (0–30 Days)',
      field: 'current',
      align: 'right',
      width: 160,
      render: (r) => (r.current ? `₹${r.current.toLocaleString('en-IN')}` : '₹0')
    },
    {
      header: '31–60 Days',
      field: 'days31To60',
      align: 'right',
      width: 150,
      cellStyle: (r) => ({
        color: r.days31To60 > 0 ? '#d97706' : '#64748b',
        fontWeight: r.days31To60 > 0 ? 600 : 400
      }),
      render: (r) => (r.days31To60 ? `₹${r.days31To60.toLocaleString('en-IN')}` : '₹0')
    },
    {
      header: '61–90 Days',
      field: 'days61To90',
      align: 'right',
      width: 150,
      cellStyle: (r) => ({
        color: r.days61To90 > 0 ? '#ea580c' : '#64748b',
        fontWeight: r.days61To90 > 0 ? 600 : 400
      }),
      render: (r) => (r.days61To90 ? `₹${r.days61To90.toLocaleString('en-IN')}` : '₹0')
    },
    {
      header: '90+ Days (High Risk)',
      field: 'days90Plus',
      align: 'right',
      width: 170,
      cellStyle: (r) => ({
        color: r.days90Plus > 0 ? '#dc2626' : '#64748b',
        fontWeight: r.days90Plus > 0 ? 700 : 400
      }),
      render: (r) => (r.days90Plus ? `₹${r.days90Plus.toLocaleString('en-IN')}` : '₹0')
    },
    {
      header: 'Total Outstanding (₹)',
      field: 'totalOutstanding',
      align: 'right',
      width: 180,
      cellStyle: { fontWeight: 800, color: '#0f172a' },
      render: (r) => (r.totalOutstanding ? `₹${r.totalOutstanding.toLocaleString('en-IN')}` : '₹0')
    }
  ];

  return (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
          Aging Analysis (Accounts Receivable & Payable)
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
          Credit exposure and liability aging across 0-30, 31-60, 61-90, and 90+ day overdue buckets
        </Typography>
      </Box>

      <Tabs
        value={tab}
        onChange={(_, val) => setTab(val)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{
          mb: 3,
          '& .MuiTab-root': {
            borderRadius: '4px',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.9rem',
            mr: 1
          },
          '& .Mui-selected': {
            color: '#e5a93c !important'
          },
          '& .MuiTabs-indicator': {
            backgroundColor: '#e5a93c',
            height: 3,
            borderRadius: 3
          }
        }}
      >
        <Tab icon={<Receipt />} iconPosition="start" label="Customer Receivables Aging" />
        <Tab icon={<ShoppingCart />} iconPosition="start" label="Vendor Payables Aging" />
      </Tabs>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="0–30 Days (Current)" value={summary.current || 0} color="#10b981" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="31–60 Days" value={summary.days31To60 || 0} color="#e5a93c" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="61–90 Days" value={summary.days61To90 || 0} color="#ea580c" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="90+ Days Overdue" value={summary.days90Plus || 0} color="#ef4444" />
        </Grid>
      </Grid>

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        emptyMessage="No overdue aging balances found in this ledger."
      />
    </Box>
  );
}
