import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { salesService } from '../../services/salesService';
import { showNotification } from '../../store';
import DataTable from '../../components/Common/DataTable';
import InvoiceFormModal from './InvoiceFormModal';
import PrintableInvoiceModal from '../../components/Common/PrintableInvoiceModal';
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
import PrintIcon from '@mui/icons-material/Print';
import ApproveIcon from '@mui/icons-material/CheckCircleOutline';
import PostIcon from '@mui/icons-material/PostAdd';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';

export default function InvoicesView() {
  const dispatch = useDispatch();
  const refreshKey = useSelector((state) => state.finance.refreshKey);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchText, setSearchText] = useState('');

  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [selectedInvoiceForEdit, setSelectedInvoiceForEdit] = useState(null);
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState(null);
  const [confirmPostInv, setConfirmPostInv] = useState(null);
  const [confirmDeleteInv, setConfirmDeleteInv] = useState(null);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await salesService.getInvoices();
      setInvoices(res.data || []);
    } catch (err) {
      dispatch(showNotification({ message: err.message, severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [refreshKey]);

  const handleApprove = async (id) => {
    try {
      await salesService.approveInvoice(id);
      dispatch(showNotification({ message: 'Invoice approved successfully', severity: 'success' }));
      fetchInvoices();
    } catch (err) {
      dispatch(showNotification({ message: err.message, severity: 'error' }));
    }
  };

  const handlePost = async () => {
    if (!confirmPostInv) return;
    try {
      await salesService.postInvoice(confirmPostInv.id);
      dispatch(showNotification({ message: `Invoice ${confirmPostInv.invoiceNumber} posted to General Ledger!`, severity: 'success' }));
      setConfirmPostInv(null);
      fetchInvoices();
    } catch (err) {
      dispatch(showNotification({ message: err.message, severity: 'error' }));
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteInv) return;
    try {
      await salesService.deleteInvoice(confirmDeleteInv.id);
      dispatch(showNotification({ message: `Invoice ${confirmDeleteInv.invoiceNumber} deleted.`, severity: 'info' }));
      setConfirmDeleteInv(null);
      fetchInvoices();
    } catch (err) {
      dispatch(showNotification({ message: err.message, severity: 'error' }));
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    const matchesSearch = !searchText ||
      (inv.invoiceNumber || '').toLowerCase().includes(searchText.toLowerCase()) ||
      (inv.customerName || '').toLowerCase().includes(searchText.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const columns = [
    {
      header: 'Invoice #',
      field: 'invoiceNumber',
      width: 140,
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#e5a93c' }}>
          {row.invoiceNumber}
        </Typography>
      )
    },
    { header: 'Customer', field: 'customerName', minWidth: 170 },
    { header: 'Date', field: 'invoiceDate', width: 110 },
    { header: 'Due Date', field: 'dueDate', width: 110 },
    {
      header: 'Taxable (₹)',
      align: 'right',
      render: (row) => `₹${(row.taxableTotal || 0).toLocaleString('en-IN')}`
    },
    {
      header: 'GST (₹)',
      align: 'right',
      render: (row) => `₹${(row.totalTax || 0).toLocaleString('en-IN')}`
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
          <Tooltip title="Preview / Print Tax Invoice">
            <IconButton size="small" onClick={() => setSelectedInvoiceForPrint(row)}>
              <PrintIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {(row.status === 'Draft' || row.status === 'Pending Approval') && (
            <Tooltip title="Edit Invoice">
              <IconButton size="small" color="primary" onClick={() => setSelectedInvoiceForEdit(row)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {(row.status === 'Draft' || row.status === 'Pending Approval') && (
            <Tooltip title="Approve Invoice">
              <IconButton size="small" color="info" onClick={() => handleApprove(row.id)}>
                <ApproveIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {(row.status === 'Approved' || row.status === 'Draft') && (
            <Tooltip title="Post to General Ledger">
              <IconButton size="small" color="success" onClick={() => setConfirmPostInv(row)}>
                <PostIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {row.status === 'Draft' && (
            <Tooltip title="Delete Draft Invoice">
              <IconButton size="small" color="error" onClick={() => setConfirmDeleteInv(row)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )
    }
  ];

  const handleEdit = (inv) => {
    setSelectedInvoiceForEdit(inv);
    setOpenCreateModal(true);
  };

  if (openCreateModal || selectedInvoiceForEdit) {
    return (
      <InvoiceFormModal
        open={true}
        invoiceToEdit={selectedInvoiceForEdit}
        onClose={() => {
          setOpenCreateModal(false);
          setSelectedInvoiceForEdit(null);
        }}
        onSuccess={(msg) => {
          dispatch(showNotification({ message: msg, severity: 'success' }));
          setOpenCreateModal(false);
          setSelectedInvoiceForEdit(null);
          fetchInvoices();
        }}
      />
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto', height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 1.5, flexWrap: 'wrap', gap: 1.5, flexShrink: 0 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', fontSize: { xs: '1.2rem', sm: '1.35rem' } }}>
            Sales Invoices (Accounts Receivable)
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreateModal(true)}
          sx={{
            bgcolor: 'var(--theme-10, #e5a93c)',
            color: 'var(--theme-10-contrast, #0f172a)',
            borderRadius: '4px',
            fontWeight: 700,
            fontSize: '0.82rem',
            width: { xs: '100%', sm: 'auto' },
            boxShadow: '0 4px 14px rgba(229, 169, 60, 0.3)',
            '&:hover': { bgcolor: '#d49b28' }
          }}
        >
          New Sales Invoice
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
        <TextField
          size="small"
          placeholder="Search by invoice # or customer..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{ width: { xs: '100%', sm: 280 } }}
        />
        <TextField
          select
          size="small"
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ width: { xs: '100%', sm: 160 } }}
        >
          <MenuItem value="ALL">All Statuses</MenuItem>
          <MenuItem value="Draft">Draft</MenuItem>
          <MenuItem value="Approved">Approved</MenuItem>
          <MenuItem value="Posted">Posted</MenuItem>
          <MenuItem value="Partially Paid">Partially Paid</MenuItem>
          <MenuItem value="Paid">Paid</MenuItem>
        </TextField>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <DataTable
          columns={columns}
          rows={filteredInvoices}
          loading={loading}
          emptyMessage="No invoices found matching criteria."
        />
      </Box>

      <PrintableInvoiceModal
        open={Boolean(selectedInvoiceForPrint)}
        invoice={selectedInvoiceForPrint}
        onClose={() => setSelectedInvoiceForPrint(null)}
      />

      <ConfirmDialog
        open={Boolean(confirmPostInv)}
        title="Post Invoice to Ledger?"
        content={`Posting invoice ${confirmPostInv?.invoiceNumber} for ₹${confirmPostInv?.grandTotal?.toLocaleString('en-IN')} will create double-entry journal entries (Debiting Accounts Receivable, Crediting Revenue and Output GST) and update customer balances. This action cannot be undone.`}
        confirmText="Post to Ledger"
        onConfirm={handlePost}
        onCancel={() => setConfirmPostInv(null)}
      />

      <ConfirmDialog
        open={Boolean(confirmDeleteInv)}
        title="Delete Draft Invoice?"
        content={`Are you sure you want to delete draft invoice ${confirmDeleteInv?.invoiceNumber}? This action cannot be undone.`}
        confirmText="Delete Invoice"
        confirmColor="error"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteInv(null)}
      />
    </Box>
  );
}
