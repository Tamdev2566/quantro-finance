import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { apiClient } from '../../api/client';
import { showNotification } from '../../store';
import DataTable from '../../components/Common/DataTable';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import {
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  MenuItem,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import UndoIcon from '@mui/icons-material/Undo';

export default function VendorPaymentsView() {
  const dispatch = useDispatch();
  const refreshKey = useSelector((state) => state.finance.refreshKey);
  const [payments, setPayments] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [unpaidBills, setUnpaidBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [confirmReverse, setConfirmReverse] = useState(null);

  // Form state
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [bankAccountId, setBankAccountId] = useState('BANK-001');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [allocations, setAllocations] = useState({});

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const [pRes, vRes, bRes] = await Promise.all([
        apiClient.getVendorPayments(),
        apiClient.getVendors(),
        apiClient.getBankAccounts()
      ]);
      setPayments(pRes.data || []);
      setVendors(vRes.data || []);
      setBankAccounts(bRes.data || []);
      if (vRes.data?.length > 0 && !selectedVendorId) {
        setSelectedVendorId(vRes.data[0].id);
      }
    } catch (err) {
      dispatch(showNotification({ message: err.message, severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [refreshKey]);

  useEffect(() => {
    if (selectedVendorId) {
      apiClient.getVendorBills().then((res) => {
        const vBills = (res.data || []).filter(
          (b) => b.vendorId === selectedVendorId && (b.status === 'Posted' || b.status === 'Partially Paid') && b.outstandingAmount > 0
        );
        setUnpaidBills(vBills);
        const initial = {};
        vBills.forEach((b) => {
          initial[b.id] = 0;
        });
        setAllocations(initial);
      });
    }
  }, [selectedVendorId]);

  const handlePay = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      dispatch(showNotification({ message: 'Enter a valid payment amount', severity: 'error' }));
      return;
    }

    const billAllocations = Object.entries(allocations)
      .filter(([_, amt]) => parseFloat(amt) > 0)
      .map(([billId, amt]) => ({ billId, amount: parseFloat(amt) }));

    try {
      await apiClient.createVendorPayment({
        vendorId: selectedVendorId,
        paymentDate,
        paymentMethod,
        bankAccountId,
        amount: parseFloat(amount),
        reference,
        allocations: billAllocations
      });
      dispatch(showNotification({ message: 'Vendor payment recorded and AP reduced successfully', severity: 'success' }));
      setOpenModal(false);
      fetchPayments();
    } catch (err) {
      dispatch(showNotification({ message: err.message, severity: 'error' }));
    }
  };

  const handleReverse = async () => {
    if (!confirmReverse) return;
    try {
      await apiClient.reverseVendorPayment(confirmReverse.id, { reason: 'Disbursement reversal' });
      dispatch(showNotification({ message: `Vendor payment ${confirmReverse.paymentNumber} reversed`, severity: 'success' }));
      setConfirmReverse(null);
      fetchPayments();
    } catch (err) {
      dispatch(showNotification({ message: err.message, severity: 'error' }));
    }
  };

  const columns = [
    {
      header: 'Disbursement #',
      field: 'paymentNumber',
      width: 150,
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#e5a93c' }}>
          {row.paymentNumber}
        </Typography>
      )
    },
    { header: 'Vendor', field: 'vendorName', minWidth: 170 },
    { header: 'Date', field: 'paymentDate', width: 110 },
    { header: 'Method', field: 'paymentMethod', width: 130 },
    { header: 'Reference', field: 'reference', width: 130 },
    {
      header: 'Amount Paid (₹)',
      align: 'right',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 800, color: '#ef4444' }}>
          ₹{(row.amount || 0).toLocaleString('en-IN')}
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
          <Tooltip title="Reverse Disbursement">
            <IconButton size="small" color="error" onClick={() => setConfirmReverse(row)}>
              <UndoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        );
      }
    }
  ];

  return (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
            Vendor Payments & Disbursements
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
            Pay supplier bills, manage Accounts Payable reductions, and record bank ledger debits
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenModal(true)}
          sx={{
            bgcolor: '#e5a93c',
            borderRadius: '14px',
            fontWeight: 700,
            boxShadow: '0 4px 14px rgba(91, 91, 214, 0.3)',
            '&:hover': { bgcolor: '#4b4bc0' }
          }}
        >
          Pay Vendor
        </Button>
      </Box>

      <DataTable
        columns={columns}
        rows={payments}
        loading={loading}
        emptyMessage="No vendor payments found."
      />

      {/* Pay Vendor Modal */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Record Vendor Payment</DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Vendor"
                size="small"
                value={selectedVendorId}
                onChange={(e) => setSelectedVendorId(e.target.value)}
              >
                {vendors.map((v) => (
                  <MenuItem key={v.id} value={v.id}>
                    {v.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                type="date"
                label="Payment Date"
                size="small"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                select
                fullWidth
                label="Payment Method"
                size="small"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                <MenuItem value="UPI">UPI</MenuItem>
                <MenuItem value="Cheque">Cheque</MenuItem>
                <MenuItem value="Cash">Cash</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Paid From (Bank / Cash)"
                size="small"
                value={bankAccountId}
                onChange={(e) => setBankAccountId(e.target.value)}
              >
                {bankAccounts.map((b) => (
                  <MenuItem key={b.id} value={b.id}>
                    {b.accountName} ({b.bankName})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Total Amount (₹)"
                size="small"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Payment Reference #"
                size="small"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. UTR / Cheque #"
              />
            </Grid>
          </Grid>

          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
            Allocate to Outstanding Vendor Bills:
          </Typography>

          {unpaidBills.length === 0 ? (
            <Typography variant="body2" sx={{ color: '#94a3b8', fontStyle: 'italic', py: 2 }}>
              No unpaid bills found for this vendor. Amount will be recorded as unallocated advance.
            </Typography>
          ) : (
            <Table size="small" sx={{ border: '1px solid #f1f5f9', borderRadius: '12px' }}>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Bill #</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Date</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Bill Total (₹)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Due (₹)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Allocate Payment (₹)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {unpaidBills.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell sx={{ fontWeight: 600 }}>{b.billNumber}</TableCell>
                    <TableCell>{b.billDate}</TableCell>
                    <TableCell align="right">₹{b.grandTotal.toLocaleString('en-IN')}</TableCell>
                    <TableCell align="right" sx={{ color: '#ef4444', fontWeight: 700 }}>
                      ₹{b.outstandingAmount.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small"
                        type="number"
                        sx={{ width: 130 }}
                        value={allocations[b.id] || ''}
                        onChange={(e) => setAllocations({ ...allocations, [b.id]: e.target.value })}
                        placeholder="0.00"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenModal(false)} color="inherit">
            Cancel
          </Button>
          <Button variant="contained" onClick={handlePay} sx={{ bgcolor: '#e5a93c', borderRadius: '12px' }}>
            Disburse Payment
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(confirmReverse)}
        title="Reverse Vendor Payment?"
        content={`Reversing vendor disbursement ${confirmReverse?.paymentNumber} of ₹${confirmReverse?.amount?.toLocaleString('en-IN')} will restore bill outstanding balances, increase bank account balance, and post a reversing journal entry.`}
        confirmText="Reverse Payment"
        confirmColor="error"
        onConfirm={handleReverse}
        onCancel={() => setConfirmReverse(null)}
      />
    </Box>
  );
}
