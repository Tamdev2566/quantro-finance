import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { apiClient } from '../../api/client';
import { showNotification } from '../../store';
import DataTable from '../../components/Common/DataTable';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import {
  Box,
  Typography,
  Button,
  Card,
  Grid,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import UndoIcon from '@mui/icons-material/Undo';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function VendorPaymentsView() {
  const dispatch = useDispatch();
  const refreshKey = useSelector((state) => state.finance.refreshKey);
  const [payments, setPayments] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [unpaidBills, setUnpaidBills] = useState([]);
  const [allocations, setAllocations] = useState({});
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [confirmReverse, setConfirmReverse] = useState(null);

  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [bankAccountId, setBankAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getVendorPayments();
      setPayments(res.data || []);
    } catch (err) {
      dispatch(showNotification({ message: err.message, severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [vRes, bRes] = await Promise.all([apiClient.getVendors(), apiClient.getBankAccounts()]);
      setVendors(vRes.data || []);
      setBankAccounts(bRes.data || []);
      if (bRes.data?.length > 0) setBankAccountId(bRes.data[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchDependencies();
  }, [refreshKey]);

  useEffect(() => {
    if (selectedVendorId) {
      apiClient.getVendorBills().then((res) => {
        const matching = (res.data || []).filter(
          (b) => b.vendorId === selectedVendorId && (b.status === 'Posted' || b.status === 'Partially Paid') && b.outstandingAmount > 0
        );
        setUnpaidBills(matching);

        const alloc = {};
        let rem = parseFloat(amount || 0);
        matching.forEach((b) => {
          if (rem > 0) {
            const take = Math.min(rem, b.outstandingAmount);
            alloc[b.id] = take;
            rem -= take;
          } else {
            alloc[b.id] = 0;
          }
        });
        setAllocations(alloc);
      });
    } else {
      setUnpaidBills([]);
      setAllocations({});
    }
  }, [selectedVendorId, amount]);

  const handleOpenCreate = () => {
    setSelectedVendorId(vendors[0]?.id || '');
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setPaymentMethod('Bank Transfer');
    setBankAccountId(bankAccounts[0]?.id || '');
    setAmount('');
    setReference('');
    setOpenModal(true);
  };

  const handlePay = async () => {
    if (!selectedVendorId || !amount || parseFloat(amount) <= 0 || !bankAccountId) {
      alert('Please select a vendor, enter amount, and select payment bank account.');
      return;
    }

    try {
      const allocPayload = Object.entries(allocations)
        .filter(([_, amt]) => parseFloat(amt) > 0)
        .map(([billId, amt]) => ({ billId, amount: parseFloat(amt) }));

      await apiClient.createVendorPayment({
        vendorId: selectedVendorId,
        paymentDate,
        paymentMethod,
        bankAccountId,
        amount: parseFloat(amount),
        reference,
        allocations: allocPayload
      });

      dispatch(showNotification({ message: 'Vendor payment disbursed and Accounts Payable debited!', severity: 'success' }));
      setOpenModal(false);
      fetchPayments();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReverse = async () => {
    if (!confirmReverse) return;
    try {
      await apiClient.reverseVendorPayment(confirmReverse.id, { reason: 'Controller disbursement void' });
      dispatch(showNotification({ message: 'Vendor disbursement reversed successfully!', severity: 'info' }));
      setConfirmReverse(null);
      fetchPayments();
    } catch (err) {
      alert(err.message);
    }
  };

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
    { header: 'Payment Date', field: 'paymentDate', width: 130 },
    { header: 'Vendor / Payee', field: 'vendorName', minWidth: 200 },
    { header: 'Method', field: 'paymentMethod', width: 140 },
    { header: 'Reference', field: 'reference', width: 150 },
    {
      header: 'Disbursed (₹)',
      align: 'right',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#ef4444' }}>
          ₹{(row.amount || 0).toLocaleString('en-IN')}
        </Typography>
      )
    },
    {
      header: 'Status',
      width: 120,
      render: (row) => (
        <Chip
          size="small"
          label={row.status}
          color={row.status === 'Reversed' ? 'error' : 'success'}
          sx={{ fontWeight: 700, fontSize: '0.72rem', borderRadius: '4px' }}
        />
      )
    },
    {
      header: 'Actions',
      width: 90,
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

  if (openModal) {
    return (
      <Box sx={{ width: '100%', maxWidth: 1100, mx: 'auto', p: { xs: 1, sm: 2 } }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => setOpenModal(false)}
            sx={{ color: '#64748b', fontWeight: 600, textTransform: 'none', borderRadius: '4px' }}
          >
            Back to Vendor Payments
          </Button>
        </Box>

        <Card sx={{ p: { xs: 2.5, sm: 4 }, border: '1px solid #e2e8f0', borderRadius: '6px', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)' }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5 }}>
            Record Vendor Disbursement
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 3.5 }}>
            Disburse supplier payment, allocate against unpaid vendor bills, and credit banking ledger
          </Typography>

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
                    {v.name} (Payable: ₹{(v.currentBalance || 0).toLocaleString('en-IN')})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <DatePicker
                label="Payment Date"
                value={paymentDate ? dayjs(paymentDate) : null}
                onChange={(val) => setPaymentDate(val && val.isValid() ? val.format('YYYY-MM-DD') : '')}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                    required: true
                  }
                }}
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
                <MenuItem value="Bank Transfer">Bank Transfer / NEFT</MenuItem>
                <MenuItem value="UPI">UPI / Instant Transfer</MenuItem>
                <MenuItem value="Cheque">Corporate Cheque</MenuItem>
                <MenuItem value="Cash">Cash Disbursement</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Paid From (Bank / Cash Account)"
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
                inputProps={{ min: 0.01, step: 0.01 }}
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

          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#0f172a' }}>
            Allocate to Outstanding Vendor Bills:
          </Typography>

          {unpaidBills.length === 0 ? (
            <Typography variant="body2" sx={{ color: '#94a3b8', fontStyle: 'italic', py: 2 }}>
              No unpaid bills found for this vendor. Amount will be recorded as unallocated supplier advance.
            </Typography>
          ) : (
            <Box sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', mb: 3 }}>
              <Table size="small" sx={{ minWidth: 600, border: '1px solid #f1f5f9', borderRadius: '4px' }}>
                <TableHead sx={{ bgcolor: '#12131c' }}>
                  <TableRow>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 700 }}>Bill #</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 700 }}>Bill Date</TableCell>
                    <TableCell align="right" sx={{ color: '#ffffff', fontWeight: 700 }}>Bill Total (₹)</TableCell>
                    <TableCell align="right" sx={{ color: '#ffffff', fontWeight: 700 }}>Due (₹)</TableCell>
                    <TableCell align="right" sx={{ color: '#ffffff', fontWeight: 700, width: 150 }}>Allocate (₹)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {unpaidBills.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell sx={{ fontWeight: 600, color: '#e5a93c' }}>{b.billNumber}</TableCell>
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
            </Box>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4, pt: 3, borderTop: '1px solid #f1f5f9' }}>
            <Button onClick={() => setOpenModal(false)} color="inherit" sx={{ borderRadius: '4px' }}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handlePay} sx={{ bgcolor: '#e5a93c', borderRadius: '4px', px: 4, fontWeight: 700 }}>
              Disburse Payment
            </Button>
          </Box>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            Vendor Payments & Disbursements
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
            Pay supplier bills, manage Accounts Payable reductions, and record bank ledger debits
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{
            bgcolor: '#e5a93c',
            borderRadius: '4px',
            fontWeight: 700,
            width: { xs: '100%', sm: 'auto' },
            boxShadow: '0 4px 14px rgba(229, 169, 60, 0.3)',
            '&:hover': { bgcolor: '#b88019' }
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
