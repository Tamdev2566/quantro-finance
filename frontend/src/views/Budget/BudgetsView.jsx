import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { apiClient } from '../../api/client';
import { showNotification } from '../../store';
import DataTable from '../../components/Common/DataTable';
import {
  Box,
  Card,
  Typography,
  Button,
  Grid,
  TextField,
  MenuItem,
  Chip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';

export default function BudgetsView() {
  const dispatch = useDispatch();
  const refreshKey = useSelector((state) => state.finance.refreshKey);
  const [budgetList, setBudgetList] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    accountCode: '',
    department: 'General',
    fiscalYear: '2026-2027',
    periodType: 'Annual',
    budgetAmount: ''
  });

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const [bRes, aRes] = await Promise.all([
        apiClient.getBudgetVsActual(),
        apiClient.getAccounts()
      ]);
      setBudgetList(bRes.data || []);
      const expenseAccounts = (aRes.data || []).filter((a) => a.type === 'Expenses' || a.type === 'Revenue');
      setAccounts(expenseAccounts);
    } catch (err) {
      dispatch(showNotification({ message: err.message, severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [refreshKey]);

  const handleCreate = async () => {
    try {
      await apiClient.createBudget({
        ...formData,
        budgetAmount: parseFloat(formData.budgetAmount)
      });
      dispatch(showNotification({ message: 'Budget target configured successfully', severity: 'success' }));
      setOpenModal(false);
      setFormData({
        name: '',
        accountCode: '',
        department: 'General',
        fiscalYear: '2026-2027',
        periodType: 'Annual',
        budgetAmount: ''
      });
      fetchBudgets();
    } catch (err) {
      dispatch(showNotification({ message: err.message, severity: 'error' }));
    }
  };

  const columns = [
    { header: 'Budget Name', field: 'name', minWidth: 200, cellStyle: { fontWeight: 600 } },
    { header: 'Department', field: 'department', width: 140 },
    { header: 'Account', field: 'accountName', width: 180 },
    {
      header: 'Budget (₹)',
      field: 'budgetAmount',
      align: 'right',
      width: 140,
      cellStyle: { fontWeight: 700 },
      render: (r) => (r.budgetAmount ? `₹${r.budgetAmount.toLocaleString('en-IN')}` : '₹0')
    },
    {
      header: 'Actual Spent (₹)',
      field: 'actualAmount',
      align: 'right',
      width: 150,
      cellStyle: (r) => ({ fontWeight: 700, color: r.isExceeded ? '#ef4444' : '#e5a93c' }),
      render: (r) => (r.actualAmount !== undefined ? `₹${r.actualAmount.toLocaleString('en-IN')}` : '₹0')
    },
    {
      header: 'Variance (₹)',
      field: 'variance',
      align: 'right',
      width: 140,
      render: (r) => (r.variance !== undefined ? `₹${r.variance.toLocaleString('en-IN')}` : '₹0')
    },
    {
      header: 'Variance %',
      field: 'variancePercent',
      align: 'right',
      width: 120,
      render: (r) => `${r.variancePercent || 0}%`
    },
    {
      header: 'Warning Status',
      width: 160,
      align: 'center',
      render: (r) => (
        <Chip
          size="small"
          label={r.isExceeded ? 'Budget Exceeded' : 'Within Budget'}
          sx={{
            fontWeight: 600,
            backgroundColor: r.isExceeded ? '#fef2f2' : '#f0fdf4',
            color: r.isExceeded ? '#dc2626' : '#16a34a',
            borderRadius: '4px'
          }}
        />
      )
    }
  ];

  if (openModal) {
    return (
      <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto', height: '100%', overflowY: 'auto', pr: { xs: 0.5, md: 1 }, pb: 4 }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => setOpenModal(false)}
            sx={{ color: '#64748b', fontWeight: 600, textTransform: 'none', borderRadius: '4px' }}
          >
            Back to Budgets
          </Button>
        </Box>

        <Card sx={{ p: { xs: 2.5, sm: 4 }, border: '1px solid #e2e8f0', borderRadius: '4px', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)' }}>
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
              Create Department Budget
            </Typography>
          </Box>

          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Budget Name"
                placeholder="e.g. Q4 Marketing Growth Budget"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              >
                <MenuItem value="General">General Administration</MenuItem>
                <MenuItem value="Engineering">Engineering & IT</MenuItem>
                <MenuItem value="Marketing">Marketing & Growth</MenuItem>
                <MenuItem value="Sales">Sales & Business Dev</MenuItem>
                <MenuItem value="Operations">Operations & HR</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Ledger Account"
                value={formData.accountCode}
                onChange={(e) => setFormData({ ...formData, accountCode: e.target.value })}
              >
                {accounts.map((a) => (
                  <MenuItem key={a.code} value={a.code}>
                    {a.code} – {a.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Fiscal Year"
                value={formData.fiscalYear}
                onChange={(e) => setFormData({ ...formData, fiscalYear: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Budget Amount (₹)"
                placeholder="0.00"
                value={formData.budgetAmount}
                onChange={(e) => setFormData({ ...formData, budgetAmount: e.target.value })}
                inputProps={{ min: 1 }}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3.5, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button onClick={() => setOpenModal(false)} color="inherit" sx={{ borderRadius: '4px' }}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              variant="contained"
              disabled={!formData.name || !formData.accountCode || !formData.budgetAmount}
              sx={{ bgcolor: '#e5a93c', color: '#000000', fontWeight: 700, borderRadius: '4px', '&:hover': { bgcolor: '#d49b28' } }}
            >
              Save Budget
            </Button>
          </Box>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto', height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Box sx={{ flexShrink: 0, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1.5, mb: 1.5 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', fontSize: { xs: '1.25rem', sm: '1.45rem' } }}>
            Budget Management & Variance Analysis
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenModal(true)}
          sx={{ width: { xs: '100%', sm: 'auto' }, borderRadius: '4px', textTransform: 'none', px: 2.5 }}
        >
          New Budget
        </Button>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <DataTable
          columns={columns}
          rows={budgetList}
          loading={loading}
          defaultPageSize={10}
          emptyMessage="No department budgets found. Click 'New Budget' to configure targets."
        />
      </Box>
    </Box>
  );
}
