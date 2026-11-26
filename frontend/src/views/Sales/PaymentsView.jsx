import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { salesService } from '../../services/salesService';
import { showNotification } from '../../store';
import DataTable from '../../components/Common/DataTable';
import PaymentFormModal from './PaymentFormModal';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import {
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  Tooltip,
  TextField
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import UndoIcon from '@mui/icons-material/Undo';

export default function PaymentsView() {
  const dispatch = useDispatch();
  const refreshKey = useSelector((state) => state.finance.refreshKey);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [confirmReversePayment, setConfirmReversePayment] = useState(null);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await salesService.getPayments();
      setPayments(res.data || []);
    } catch (err) {
      dispatch(showNotification({ message: err.message, severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [refreshKey]);

  const handleReverse = async () => {
    if (!confirmReversePayment) return;
    try {
      await salesService.reversePayment(confirmReversePayment.id, {
        reason: 'Payment reversal by controller'
      });
      dispatch(showNotification({ message: `Payment ${confirmReversePayment.paymentNumber} reversed successfully`, severity: 'success' }));
      setConfirmReversePayment(null);
      fetchPayments();
    } catch (err) {
      dispatch(showNotification({ message: err.message, severity: 'error' }));
    }
  };

  const filtered = payments.filter((p) => {
    if (!searchText) return true;
    const q = searchText.toLowerCase();
    return p.paymentNumber?.toLowerCase().includes(q) ||
           p.customerName?.toLowerCase().includes(q) ||
           p.reference?.toLowerCase().includes(q);
  });

  const columns = [
    {
      header: 'Payment #',
      field: 'paymentNumber',
      width: 140,
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#e5a93c' }}>
          {row.paymentNumber}
        </Typography>
      )
    },
    { header: 'Customer', field: 'customerName', minWidth: 170 },
    { header: 'Date', field: 'paymentDate', width: 110 },
    { header: 'Method', field: 'paymentMethod', width: 130 },
    { header: 'Reference', field: 'reference', width: 130 },
    {
      header: 'Amount (₹)',
      align: 'right',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 800, color: '#16a34a' }}>
          ₹{(row.amount || 0).toLocaleString('en-IN')}
        </Typography>
      )
    },
    {
      header: 'Allocated (₹)',
      align: 'right',
      render: (row) => `₹${(row.allocatedAmount || 0).toLocaleString('en-IN')}`
    },
    {
      header: 'Status',
      align: 'center',
      render: (row) => (
        <Chip
          label={row.status}
          size="small"
          color={row.status === 'Posted' ? 'success' : 'error'}
          sx={{ fontWeight: 700, fontSize: '0.72rem', borderRadius: '8px' }}
        />
      )
    },
    {
      header: 'Actions',
      align: 'center',
      render: (row) => {
        if (row.status === 'Reversed') return '—';
        return (
          <Tooltip title="Reverse Payment">
            <IconButton size="small" color="error" onClick={() => setConfirmReversePayment(row)}>
              <UndoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        );
      }
    }
  ];

  if (openModal) {
    return (
      <PaymentFormModal
        open={true}
        onClose={() => setOpenModal(false)}
        onSuccess={(msg) => {
          dispatch(showNotification({ message: msg, severity: 'success' }));
          setOpenModal(false);
          fetchPayments();
        }}
      />
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto', height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1.5, flexShrink: 0 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', fontSize: { xs: '1.2rem', sm: '1.35rem' } }}>
            Customer Payments Received
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
            boxShadow: '0 4px 14px rgba(229, 169, 60, 0.3)',
            '&:hover': { bgcolor: '#b88019' }
          }}
        >
          Receive Payment
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5, flexShrink: 0 }}>
        <TextField
          size="small"
          placeholder="Search payments by #, customer, reference..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{ width: { xs: '100%', sm: 320 } }}
        />
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <DataTable
          columns={columns}
          rows={filtered}
          loading={loading}
          emptyMessage="No customer payments found."
        />
      </Box>

      <ConfirmDialog
        open={Boolean(confirmReversePayment)}
        title="Reverse Customer Payment?"
        content={`Reversing payment ${confirmReversePayment?.paymentNumber} of ₹${confirmReversePayment?.amount?.toLocaleString('en-IN')} will restore invoice outstanding balances, decrease bank account balance, and post a reversing journal entry.`}
        confirmText="Reverse Payment"
        confirmColor="error"
        onConfirm={handleReverse}
        onCancel={() => setConfirmReversePayment(null)}
      />
    </Box>
  );
}
