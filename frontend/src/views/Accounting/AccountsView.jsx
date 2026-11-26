import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { accountingService } from '../../services/accountingService';
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
      const res = await accountingService.getAccounts();
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
      await accountingService.deleteAccount(accountToDelete.code);
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
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto', height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 1.5, flexWrap: 'wrap', gap: 1.5, flexShrink: 0 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', fontSize: { xs: '1.2rem', sm: '1.35rem' } }}>
            Chart of Accounts
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => { setAccountToEdit(null); setOpenModal(true); }}
          sx={{
            width: { xs: '100%', sm: 'auto' },
            bgcolor: 'var(--theme-10, #e5a93c)',
            color: 'var(--theme-10-contrast, #0f172a)',
            borderRadius: '4px',
            fontWeight: 700,
            fontSize: '0.82rem',
            boxShadow: '0 4px 14px rgba(229, 169, 60, 0.3)',
            '&:hover': { bgcolor: '#b88019' }
          }}
        >
          New Account
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5, flexWrap: 'wrap', flexShrink: 0 }}>
        <TextField
          size="small"
          placeholder="Search by code, name, category..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{ width: { xs: '100%', sm: 300 } }}
        />
        <TextField
          select
          size="small"
          label="Account Type"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          sx={{ width: { xs: '100%', sm: 160 } }}
        >
          <MenuItem value="ALL">All Types</MenuItem>
          <MenuItem value="Assets">Assets</MenuItem>
          <MenuItem value="Liabilities">Liabilities</MenuItem>
          <MenuItem value="Equity">Equity</MenuItem>
          <MenuItem value="Revenue">Revenue</MenuItem>
          <MenuItem value="Expenses">Expenses</MenuItem>
        </TextField>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <DataTable
          columns={columns}
          rows={filtered}
          loading={loading}
          emptyMessage="No ledger accounts found."
        />
      </Box>

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
