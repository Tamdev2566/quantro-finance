import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { apiClient } from '../../api/client';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import {
  Card,
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
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function PaymentFormModal({ open, onClose, onSuccess }) {
  const [customers, setCustomers] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState([]);
  const [allocations, setAllocations] = useState({});
  const [loading, setLoading] = useState(false);

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      customerId: '',
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMethod: 'Bank Transfer',
      bankAccountId: '',
      reference: '',
      amount: '',
      notes: ''
    }
  });

  const watchedCustomerId = watch('customerId');
  const watchedAmount = parseFloat(watch('amount') || 0);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (watchedCustomerId) {
      apiClient.getInvoices().then((res) => {
        const matching = (res.data || []).filter(
          (inv) => inv.customerId === watchedCustomerId &&
                   (inv.status === 'Posted' || inv.status === 'Partially Paid') &&
                   inv.outstandingAmount > 0
        );
        setUnpaidInvoices(matching);

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
    <Box sx={{ width: '100%', maxWidth: 1100, mx: 'auto', p: { xs: 1, sm: 2 } }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={onClose}
          sx={{ color: '#64748b', fontWeight: 600, textTransform: 'none', borderRadius: '4px' }}
        >
          Back to Customer Receipts
        </Button>
      </Box>

      <Card sx={{ p: { xs: 2.5, sm: 4 }, border: '1px solid #e2e8f0', borderRadius: '6px', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)' }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5 }}>
          Record Customer Payment Receipt
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mb: 3.5 }}>
          Record inward collection, allocate against open invoices, and update Accounts Receivable
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Customer"
                size="small"
                {...register('customerId', { required: 'Customer is required' })}
                error={!!errors.customerId}
              >
                {customers.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name} (Balance: ₹{(c.currentBalance || 0).toLocaleString('en-IN')})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="paymentDate"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <DatePicker
                    label="Payment Date"
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(val) => field.onChange(val && val.isValid() ? val.format('YYYY-MM-DD') : '')}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                        required: true
                      }
                    }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Amount Received (₹)"
                size="small"
                type="number"
                placeholder="0.00"
                inputProps={{ min: 0.01, step: 0.01 }}
                {...register('amount', { required: 'Amount is required' })}
                error={!!errors.amount}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                label="Payment Method"
                size="small"
                {...register('paymentMethod')}
              >
                <MenuItem value="Bank Transfer">Bank Transfer / NEFT / RTGS</MenuItem>
                <MenuItem value="UPI / QR">UPI / Immediate Payment</MenuItem>
                <MenuItem value="Cheque">Cheque Deposit</MenuItem>
                <MenuItem value="Cash">Cash Receipt</MenuItem>
                <MenuItem value="Credit Card">Corporate Card</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                label="Deposit To (Bank Account)"
                size="small"
                {...register('bankAccountId', { required: 'Bank Account is required' })}
                error={!!errors.bankAccountId}
              >
                {bankAccounts.map((b) => (
                  <MenuItem key={b.id} value={b.id}>
                    {b.accountName} ({b.bankName})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Transaction / Reference #"
                size="small"
                placeholder="UTR, Check #, Transaction ID"
                {...register('reference')}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Receipt Notes / Narration"
                size="small"
                placeholder="Customer receipt narration..."
                {...register('notes')}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2.5 }} />

          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: '#0f172a' }}>
            Allocate Against Outstanding Invoices:
          </Typography>

          {unpaidInvoices.length === 0 ? (
            <Typography variant="body2" sx={{ color: '#94a3b8', fontStyle: 'italic', py: 2 }}>
              No unpaid invoices found for this customer. Any amount entered will be recorded as unallocated customer advance.
            </Typography>
          ) : (
            <Box sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', mb: 3 }}>
              <Table size="small" sx={{ minWidth: 600, border: '1px solid #f1f5f9', borderRadius: '4px' }}>
                <TableHead sx={{ bgcolor: '#12131c' }}>
                  <TableRow>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 700 }}>Invoice #</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 700 }}>Invoice Date</TableCell>
                    <TableCell align="right" sx={{ color: '#ffffff', fontWeight: 700 }}>Total (₹)</TableCell>
                    <TableCell align="right" sx={{ color: '#ffffff', fontWeight: 700 }}>Outstanding (₹)</TableCell>
                    <TableCell align="right" sx={{ color: '#ffffff', fontWeight: 700, width: 150 }}>Allocate (₹)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {unpaidInvoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell sx={{ fontWeight: 600, color: '#e5a93c' }}>{inv.invoiceNumber}</TableCell>
                      <TableCell>{inv.invoiceDate}</TableCell>
                      <TableCell align="right">₹{inv.grandTotal?.toLocaleString('en-IN')}</TableCell>
                      <TableCell align="right" sx={{ color: '#ef4444', fontWeight: 600 }}>
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
            </Box>
          )}

          <Box sx={{ p: 2, backgroundColor: '#f8fafc', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, border: '1px solid #e2e8f0' }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b' }}>Allocated to Invoices</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>₹{totalAllocated.toLocaleString('en-IN')}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b' }}>Unallocated / Advance</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#10b981' }}>
                ₹{unallocated.toLocaleString('en-IN')}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b' }}>Total Received</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#e5a93c' }}>
                ₹{watchedAmount.toLocaleString('en-IN')}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4, pt: 3, borderTop: '1px solid #f1f5f9' }}>
            <Button onClick={onClose} color="inherit" sx={{ borderRadius: '4px' }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={loading} sx={{ bgcolor: '#e5a93c', borderRadius: '4px', px: 4, fontWeight: 700 }}>
              {loading ? 'Posting...' : 'Record & Post Payment'}
            </Button>
          </Box>
        </form>
      </Card>
    </Box>
  );
}
