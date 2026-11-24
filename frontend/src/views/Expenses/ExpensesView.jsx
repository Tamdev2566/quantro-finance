import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { apiClient } from '../../api/client';
import { showNotification } from '../../store';
import DataTable from '../../components/Common/DataTable';
import ExpenseFormModal from './ExpenseFormModal';
import {
  Box,
  Typography,
  Button,
  Chip,
  TextField,
  MenuItem
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

export default function ExpensesView() {
  const dispatch = useDispatch();
  const refreshKey = useSelector((state) => state.finance.refreshKey);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [openModal, setOpenModal] = useState(false);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getExpenses();
      setExpenses(res.data || []);
    } catch (err) {
      dispatch(showNotification({ message: err.message, severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [refreshKey]);

  const filtered = expenses.filter((e) => {
    const matchesCategory = categoryFilter === 'ALL' || e.category === categoryFilter;
    const matchesSearch = !searchText ||
      e.expenseNumber?.toLowerCase().includes(searchText.toLowerCase()) ||
      e.description?.toLowerCase().includes(searchText.toLowerCase()) ||
      e.vendorName?.toLowerCase().includes(searchText.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const columns = [
    {
      header: 'Expense #',
      field: 'expenseNumber',
      width: 140,
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#e5a93c' }}>
          {row.expenseNumber}
        </Typography>
      )
    },
    { header: 'Date', field: 'expenseDate', width: 110 },
    {
      header: 'Category',
      field: 'category',
      width: 160,
      render: (row) => (
        <Chip
          label={row.category}
          size="small"
          sx={{ bgcolor: '#f1f5f9', color: '#475569', fontWeight: 600, fontSize: '0.72rem', borderRadius: '8px' }}
        />
      )
    },
    { header: 'Description', field: 'description', minWidth: 180 },
    { header: 'Payee / Vendor', field: 'vendorName', width: 150 },
    { header: 'Method', field: 'paymentMethod', width: 130 },
    {
      header: 'Taxable (₹)',
      align: 'right',
      render: (row) => `₹${(row.taxableAmount || 0).toLocaleString('en-IN')}`
    },
    {
      header: 'Input GST (₹)',
      align: 'right',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#16a34a' }}>
          ₹{(row.totalTax || 0).toLocaleString('en-IN')}
        </Typography>
      )
    },
    {
      header: 'Total Paid (₹)',
      align: 'right',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 800, color: '#ef4444' }}>
          ₹{(row.totalAmount || 0).toLocaleString('en-IN')}
        </Typography>
      )
    },
    {
      header: 'Status',
      align: 'center',
      render: (row) => (
        <Chip
          label={row.status}
          size="small"
          color="primary"
          sx={{ fontWeight: 700, fontSize: '0.72rem', borderRadius: '8px' }}
        />
      )
    }
  ];

  if (openModal) {
    return (
      <ExpenseFormModal
        open={true}
        onClose={() => setOpenModal(false)}
        onSuccess={(msg) => {
          dispatch(showNotification({ message: msg, severity: 'success' }));
          setOpenModal(false);
          fetchExpenses();
        }}
      />
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto', height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 1.5, flexWrap: 'wrap', gap: 1.5, flexShrink: 0 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', fontSize: { xs: '1.2rem', sm: '1.35rem' } }}>
            Operating Expense Management
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setOpenModal(true)}
          sx={{
            bgcolor: '#e5a93c',
            borderRadius: '4px',
            fontWeight: 700,
            fontSize: '0.82rem',
            width: { xs: '100%', sm: 'auto' },
            boxShadow: '0 4px 14px rgba(229, 169, 60, 0.3)',
            '&:hover': { bgcolor: '#b88019' }
          }}
        >
          Record Expense
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5, flexWrap: 'wrap', flexShrink: 0 }}>
        <TextField
          size="small"
          placeholder="Search expenses..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{ width: { xs: '100%', sm: 280 } }}
        />
        <TextField
          select
          size="small"
          label="Category"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          sx={{ width: { xs: '100%', sm: 180 } }}
        >
          <MenuItem value="ALL">All Categories</MenuItem>
          <MenuItem value="Rent">Rent</MenuItem>
          <MenuItem value="Salaries & Payroll">Salaries & Payroll</MenuItem>
          <MenuItem value="Utilities & Internet">Utilities & Internet</MenuItem>
          <MenuItem value="Travel & Conveyance">Travel & Conveyance</MenuItem>
          <MenuItem value="Office Supplies">Office Supplies</MenuItem>
          <MenuItem value="Marketing & Ads">Marketing & Ads</MenuItem>
          <MenuItem value="Bank Charges & Fees">Bank Charges & Fees</MenuItem>
        </TextField>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <DataTable
          columns={columns}
          rows={filtered}
          loading={loading}
          emptyMessage="No expenses recorded."
        />
      </Box>

    </Box>
  );
}
