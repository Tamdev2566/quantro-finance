import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { apiClient } from '../../api/client';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  MenuItem,
  Typography,
  Box,
  Divider,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from '@mui/material';

export default function PaymentFormModal({ open, onClose, onSuccess }) {
  const [customers, setCustomers] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState([]);
  const [allocations, setAllocations] = useState({});
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      customerId: '',
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMethod: 'Bank Transfer',
      bankAccountId: 'BANK-001',
      reference: '',
      amount: '',
      notes: ''
    }
  });

  const watchedCustomerId = watch('customerId');
  const watchedAmount = parseFloat(watch('amount') || 0);

  useEffect(() => {
    if (open) {
      Promise.all([
        apiClient.getCustomers(),
        apiClient.getBankAccounts(),
        apiClient.getInvoices()
      ]).then(([cRes, bRes, iRes]) => {
        setCustomers(cRes.data || []);
        setBankAccounts(bRes.data || []);
        if (cRes.data?.length > 0 && !watchedCustomerId) {
          setValue('customerId', cRes.data[0].id);
        }
      });
    }
  }, [open]);

  useEffect(() => {
    if (watchedCustomerId) {
      apiClient.getInvoices().then((res) => {
        const matching = (res.data || []).filter(
          (inv) => inv.customerId === watchedCustomerId &&
                   (inv.status === 'Posted' || inv.status === 'Partially Paid') &&
                   inv.outstandingAmount > 0
        );
        setUnpaidInvoices(matching);

        // Auto-allocate against earliest invoices if amount entered
        const newAlloc = {};
        let rem = watchedAmount;
        matching.forEach((inv) => {
          if (rem > 0) {
            const take = Math.min(rem, inv.outstandingAmount);
            newAlloc[inv.id] = take;
            rem -= take;
          } else {
            newAlloc[inv.id] = 0;
          }
        });
        setAllocations(newAlloc);
      });
    }
  }, [watchedCustomerId, watchedAmount]);

  const handleAllocChange = (invId, val) => {
    setAllocations((prev) => ({
      ...prev,
      [invId]: parseFloat(val || 0)
    }));
  };

  const totalAllocated = Object.values(allocations).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
  const unallocated = Math.max(0, watchedAmount - totalAllocated);

  const onSubmit = async (formData) => {
    try {
      setLoading(true);
      const allocPayload = Object.entries(allocations)
        .filter(([_, amt]) => parseFloat(amt) > 0)
        .map(([invoiceId, amount]) => ({ invoiceId, amount: parseFloat(amount) }));

      await apiClient.createPayment({
        ...formData,
        amount: parseFloat(formData.amount),
        allocations: allocPayload
      });

      onSuccess('Customer payment received and double-entry posted successfully!');
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>Record Customer Payment Receipt</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers sx={{ p: 3 }}>
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Customer"
                size="small"
                {...register('customerId', { required: 'Customer is required' })}
              >
                {customers.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
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
                InputLabelProps={{ shrink: true }}
                {...register('paymentDate', { required: true })}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                select
                fullWidth
                label="Payment Method"
                size="small"
                {...register('paymentMethod')}
              >
                <MenuItem value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</MenuItem>
                <MenuItem value="UPI">UPI</MenuItem>
                <MenuItem value="Cheque">Cheque</MenuItem>
                <MenuItem value="Card">Card</MenuItem>
                <MenuItem value="Cash">Cash</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                label="Deposit To Account"
                size="small"
                {...register('bankAccountId')}
              >
                {bankAccounts.map((b) => (
                  <MenuItem key={b.id} value={b.id}>
                    {b.accountName} ({b.bankName})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Received Amount (₹)"
                size="small"
                inputProps={{ min: 0.01, step: 0.01 }}
                {...register('amount', { required: 'Amount is required' })}
                error={!!errors.amount}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Payment Ref / Cheque / UTR #"
                size="small"
                {...register('reference')}
              />
            </Grid>
          </Grid>

          {/* Allocation Table */}
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            Allocate Payment to Outstanding Invoices
          </Typography>
          {unpaidInvoices.length === 0 ? (
            <Typography variant="body2" sx={{ color: '#64748b', fontStyle: 'italic', py: 2 }}>
              No unpaid invoices found for this customer. Payment will be held as customer advance.
            </Typography>
          ) : (
            <Table size="small" sx={{ mb: 2, border: '1px solid #e2e8f0' }}>
              <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Invoice #</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Total (₹)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Outstanding (₹)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, width: 150 }}>Allocate (₹)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {unpaidInvoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell sx={{ fontWeight: 600, color: '#2563eb' }}>{inv.invoiceNumber}</TableCell>
                    <TableCell>{inv.invoiceDate}</TableCell>
                    <TableCell align="right">₹{inv.grandTotal?.toLocaleString('en-IN')}</TableCell>
                    <TableCell align="right" sx={{ color: '#dc2626', fontWeight: 600 }}>
                      ₹{inv.outstandingAmount?.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        size="small"
                        inputProps={{ min: 0, max: inv.outstandingAmount, step: 0.01 }}
                        value={allocations[inv.id] !== undefined ? allocations[inv.id] : ''}
                        onChange={(e) => handleAllocChange(inv.id, e.target.value)}
                        sx={{ width: 130 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Allocation summary */}
          <Box sx={{ p: 2, backgroundColor: '#f8fafc', borderRadius: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b' }}>Allocated to Invoices</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>₹{totalAllocated.toLocaleString('en-IN')}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b' }}>Unallocated / Advance</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#059669' }}>
                ₹{unallocated.toLocaleString('en-IN')}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b' }}>Total Received</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#2563eb' }}>
                ₹{watchedAmount.toLocaleString('en-IN')}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Posting...' : 'Record & Post Payment'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
