import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { apiClient } from '../../api/client';
import { showNotification } from '../../store';
import DataTable from '../../components/Common/DataTable';
import AccountFormModal from './AccountFormModal';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import {
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  MenuItem
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';

export default function AccountsView() {
  const dispatch = useDispatch();
  const refreshKey = useSelector((state) => state.finance.refreshKey);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [searchText, setSearchText] = useState('');

  const [openModal, setOpenModal] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState(null);
  const [accountToDelete, setAccountToDelete] = useState(null);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getAccounts();
      setAccounts(res.data || []);
    } catch (err) {
      dispatch(showNotification({ message: err.message, severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [refreshKey]);

  const handleDelete = async () => {
    if (!accountToDelete) return;
    try {
      await apiClient.deleteAccount(accountToDelete.code);
      dispatch(showNotification({ message: `Account ${accountToDelete.code} deleted`, severity: 'success' }));
      setAccountToDelete(null);
      fetchAccounts();
    } catch (err) {
      dispatch(showNotification({ message: err.message, severity: 'error' }));
    }
  };

  const filtered = accounts.filter((a) => {
    const matchesType = typeFilter === 'ALL' || a.type === typeFilter;
    const matchesSearch = !searchText ||
      a.code.toLowerCase().includes(searchText.toLowerCase()) ||
      a.name.toLowerCase().includes(searchText.toLowerCase()) ||
      a.category.toLowerCase().includes(searchText.toLowerCase());
    return matchesType && matchesSearch;
  });

  const columns = [
    {
      header: 'Code',
      field: 'code',
      width: 110,
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 800, color: '#e5a93c' }}>
          {row.code}
        </Typography>
      )
    },
    {
      header: 'Account Name',
      field: 'name',
      minWidth: 220,
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
          {row.name}
        </Typography>
      )
    },
    {
      header: 'Type',
      field: 'type',
      width: 130,
      render: (row) => {
        const t = row.type;
        const color =
          t === 'Assets' ? '#22c55e' :
          t === 'Liabilities' ? '#e5a93c' :
          t === 'Equity' ? '#8b5cf6' :
          t === 'Revenue' ? '#e5a93c' : '#ef4444';
        return (
          <Chip
            label={t}
            size="small"
            sx={{ bgcolor: `${color}15`, color, fontWeight: 700, fontSize: '0.72rem', borderRadius: '4px' }}
          />
        );
      }
    },
    { header: 'Category', field: 'category', width: 170 },
    {
      header: 'Current Balance (₹)',
      align: 'right',
      render: (row) => (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 800,
            color: row.currentBalance < 0 ? '#ef4444' : '#0f172a'
          }}
        >
          ₹{(row.currentBalance !== undefined ? row.currentBalance : 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </Typography>
      )
    },
    {
      header: 'Status',
      align: 'center',
      render: (row) => (
        <Chip
          label={row.isActive ? 'Active' : 'Inactive'}
          size="small"
          color={row.isActive ? 'success' : 'default'}
          sx={{ fontWeight: 700, fontSize: '0.72rem', borderRadius: '8px' }}
        />
      )
    },
    {
      header: 'Actions',
      align: 'center',
      render: (row) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
          <Tooltip title="Edit Account">
            <IconButton size="small" onClick={() => { setAccountToEdit(row); setOpenModal(true); }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {!row.isSystem && (
            <Tooltip title="Delete Account">
              <IconButton size="small" color="error" onClick={() => setAccountToDelete(row)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )
    }
  ];

  // Full-Screen Account Form View
  if (openModal) {
    return (
      <AccountFormModal
        open={true}
        accountToEdit={accountToEdit}
        onClose={() => { setOpenModal(false); setAccountToEdit(null); }}
        onSuccess={(msg) => {
          dispatch(showNotification({ message: msg, severity: 'success' }));
          setOpenModal(false);
          setAccountToEdit(null);
          fetchAccounts();
        }}
      />
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            Chart of Accounts
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
            Hierarchical ledger classifications: Assets, Liabilities, Equity, Revenue, and Expenses
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => { setAccountToEdit(null); setOpenModal(true); }}
          sx={{
            width: { xs: '100%', sm: 'auto' },
            bgcolor: '#e5a93c',
            borderRadius: '4px',
            fontWeight: 700,
            boxShadow: '0 4px 14px rgba(91, 91, 214, 0.3)',
            '&:hover': { bgcolor: '#4b4bc0' }
          }}
        >
          New Account
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 2.5, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search by code, name, category..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{ width: { xs: '100%', sm: 320 } }}
        />
        <TextField
          select
          size="small"
          label="Account Type"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          sx={{ width: { xs: '100%', sm: 170 } }}
        >
          <MenuItem value="ALL">All Types</MenuItem>
          <MenuItem value="Assets">Assets</MenuItem>
          <MenuItem value="Liabilities">Liabilities</MenuItem>
          <MenuItem value="Equity">Equity</MenuItem>
          <MenuItem value="Revenue">Revenue</MenuItem>
          <MenuItem value="Expenses">Expenses</MenuItem>
        </TextField>
      </Box>

      <DataTable
        columns={columns}
        rows={filtered}
        loading={loading}
        emptyMessage="No ledger accounts found."
      />

      <AccountFormModal
        open={openModal}
        accountToEdit={accountToEdit}
        onClose={() => setOpenModal(false)}
        onSuccess={(msg) => {
          dispatch(showNotification({ message: msg, severity: 'success' }));
          fetchAccounts();
        }}
      />

      <ConfirmDialog
        open={Boolean(accountToDelete)}
        title="Delete Ledger Account?"
        content={`Are you sure you want to delete account ${accountToDelete?.code} - ${accountToDelete?.name}? Note that accounts carrying historical financial transactions cannot be deleted.`}
        confirmText="Delete Account"
        confirmColor="error"
        onConfirm={handleDelete}
        onCancel={() => setAccountToDelete(null)}
      />
    </Box>
  );
}
