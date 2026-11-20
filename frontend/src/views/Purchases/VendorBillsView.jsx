import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { apiClient } from '../../api/client';
import { showNotification } from '../../store';
import DataTable from '../../components/Common/DataTable';
import VendorBillFormModal from './VendorBillFormModal';
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
import ApproveIcon from '@mui/icons-material/CheckCircleOutline';
import PostIcon from '@mui/icons-material/PostAdd';

export default function VendorBillsView() {
  const dispatch = useDispatch();
  const refreshKey = useSelector((state) => state.finance.refreshKey);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchText, setSearchText] = useState('');
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [confirmPostBill, setConfirmPostBill] = useState(null);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getVendorBills();
      setBills(res.data || []);
    } catch (err) {
      dispatch(showNotification({ message: err.message, severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [refreshKey]);

  const handleApprove = async (id) => {
    try {
      await apiClient.approveVendorBill(id);
      dispatch(showNotification({ message: 'Vendor Bill approved', severity: 'success' }));
      fetchBills();
    } catch (err) {
      dispatch(showNotification({ message: err.message, severity: 'error' }));
    }
  };

  const handlePost = async () => {
    if (!confirmPostBill) return;
    try {
      await apiClient.postVendorBill(confirmPostBill.id);
      dispatch(showNotification({ message: `Bill ${confirmPostBill.billNumber} posted to Accounts Payable & General Ledger!`, severity: 'success' }));
      setConfirmPostBill(null);
      fetchBills();
    } catch (err) {
      dispatch(showNotification({ message: err.message, severity: 'error' }));
    }
  };

  const filteredBills = bills.filter((b) => {
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    const matchesSearch = !searchText ||
      (b.billNumber || '').toLowerCase().includes(searchText.toLowerCase()) ||
      (b.vendorBillNumber || '').toLowerCase().includes(searchText.toLowerCase()) ||
      (b.vendorName || '').toLowerCase().includes(searchText.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const columns = [
    {
      header: 'Internal #',
      field: 'billNumber',
      width: 140,
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#e5a93c' }}>
          {row.billNumber}
        </Typography>
      )
    },
    { header: 'Vendor Bill #', field: 'vendorBillNumber', width: 150 },
    { header: 'Vendor', field: 'vendorName', minWidth: 170 },
    { header: 'Bill Date', field: 'billDate', width: 110 },
    { header: 'Due Date', field: 'dueDate', width: 110 },
    {
      header: 'Taxable (₹)',
      align: 'right',
      render: (row) => `₹${(row.taxableTotal || 0).toLocaleString('en-IN')}`
    },
    {
      header: 'Total (₹)',
      align: 'right',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a' }}>
          ₹{(row.grandTotal || 0).toLocaleString('en-IN')}
        </Typography>
      )
    },
    {
      header: 'Outstanding (₹)',
      align: 'right',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: row.outstandingAmount > 0 ? '#ef4444' : '#16a34a' }}>
          ₹{(row.outstandingAmount !== undefined ? row.outstandingAmount : 0).toLocaleString('en-IN')}
        </Typography>
      )
    },
    {
      header: 'Status',
      align: 'center',
      render: (row) => {
        const val = row.status;
        const color =
          val === 'Paid' ? 'success' :
          val === 'Posted' ? 'primary' :
          val === 'Partially Paid' ? 'warning' :
          val === 'Approved' ? 'info' : 'default';
        return <Chip label={val} size="small" color={color} sx={{ fontWeight: 700, fontSize: '0.72rem', borderRadius: '8px' }} />;
      }
    },
    {
      header: 'Actions',
      align: 'center',
      render: (row) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
          {(row.status === 'Draft' || row.status === 'Pending Approval') && (
            <Tooltip title="Approve Bill">
              <IconButton size="small" color="info" onClick={() => handleApprove(row.id)}>
                <ApproveIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {(row.status === 'Approved' || row.status === 'Draft') && (
            <Tooltip title="Post to AP Ledger">
              <IconButton size="small" color="success" onClick={() => setConfirmPostBill(row)}>
                <PostIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )
    }
  ];

  return (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            Vendor Bills (Accounts Payable)
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
            Record supplier invoices, match purchase orders, and claim Input Tax Credit
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreateModal(true)}
          sx={{
            bgcolor: '#e5a93c',
            borderRadius: '14px',
            fontWeight: 700,
            width: { xs: '100%', sm: 'auto' },
            boxShadow: '0 4px 14px rgba(91, 91, 214, 0.3)',
            '&:hover': { bgcolor: '#4b4bc0' }
          }}
        >
          New Vendor Bill
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 2.5, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search by bill #, vendor, reference..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{ width: { xs: '100%', sm: 320 } }}
        />
        <TextField
          select
          size="small"
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ width: { xs: '100%', sm: 170 } }}
        >
          <MenuItem value="ALL">All Statuses</MenuItem>
          <MenuItem value="Draft">Draft</MenuItem>
          <MenuItem value="Approved">Approved</MenuItem>
          <MenuItem value="Posted">Posted</MenuItem>
          <MenuItem value="Partially Paid">Partially Paid</MenuItem>
          <MenuItem value="Paid">Paid</MenuItem>
        </TextField>
      </Box>

      <DataTable
        columns={columns}
        rows={filteredBills}
        loading={loading}
        emptyMessage="No vendor bills found."
      />

      <VendorBillFormModal
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        onSuccess={(msg) => {
          dispatch(showNotification({ message: msg, severity: 'success' }));
          fetchBills();
        }}
      />

      <ConfirmDialog
        open={Boolean(confirmPostBill)}
        title="Post Vendor Bill to Ledger?"
        content={`Posting bill ${confirmPostBill?.billNumber} for ₹${confirmPostBill?.grandTotal?.toLocaleString('en-IN')} will debit COGS/Expenses, debit Input GST Credit, credit Accounts Payable, and update vendor balances. This action cannot be undone.`}
        confirmText="Post to Ledger"
        onConfirm={handlePost}
        onCancel={() => setConfirmPostBill(null)}
      />
    </Box>
  );
}
