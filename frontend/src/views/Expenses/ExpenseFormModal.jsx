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
  FormControlLabel,
  Switch,
  Typography,
  Box,
  Divider
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function ExpenseFormModal({ open, onClose, onSuccess }) {
  const [categories, setCategories] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(false);

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      category: '',
      accountCode: '',
      expenseDate: new Date().toISOString().slice(0, 10),
      vendorName: '',
      description: '',
      amount: '',
      discount: 0,
      taxRate: 18,
      isTaxInclusive: false,
      isInterState: false,
      isItcEligible: true,
      isPaid: true,
      paymentMethod: 'Bank Transfer',
      bankAccountId: '',
      reference: '',
      notes: ''
    }
  });

  const watchedCategory = watch('category');
  const watchedAmount = parseFloat(watch('amount') || 0);
  const watchedTaxRate = parseFloat(watch('taxRate') || 0);
  const watchedTaxInclusive = watch('isTaxInclusive');

  useEffect(() => {
    Promise.all([apiClient.getExpenseCategories(), apiClient.getBankAccounts()]).then(([cRes, bRes]) => {
      setCategories(cRes.data || []);
      setBankAccounts(bRes.data || []);
      if (bRes.data?.length > 0) {
        setValue('bankAccountId', bRes.data[0].id);
      }
    });
  }, []);

  useEffect(() => {
    const selected = categories.find((c) => c.name === watchedCategory);
    if (selected) {
      setValue('accountCode', selected.defaultAccountCode);
    }
  }, [watchedCategory, categories]);

  // Preview calculations
  let taxable = watchedAmount;
  let tax = (taxable * watchedTaxRate) / 100;
  let total = taxable + tax;

  if (watchedTaxInclusive) {
    taxable = watchedAmount / (1 + watchedTaxRate / 100);
    tax = watchedAmount - taxable;
    total = watchedAmount;
  }

  const onSubmit = async (formData) => {
    try {
      setLoading(true);
      await apiClient.createExpense({
        ...formData,
        amount: parseFloat(formData.amount),
        taxRate: parseFloat(formData.taxRate || 0),
        discount: parseFloat(formData.discount || 0)
      });
      onSuccess('Expense recorded and balanced journal posted!');
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
          Back to Expenses
        </Button>
      </Box>

      <Card sx={{ p: { xs: 2.5, sm: 4 }, border: '1px solid #e2e8f0', borderRadius: '6px', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)' }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5 }}>
          Record Operating Expense
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mb: 3.5 }}>
          Log direct operational expenses, allocate department categories, and claim input GST
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2.5} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Expense Category"
                {...register('category', { required: true })}
              >
                {categories.map((c) => (
                  <MenuItem key={c.name} value={c.name}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Controller
                name="expenseDate"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <DatePicker
                    label="Expense Date"
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(val) => field.onChange(val && val.isValid() ? val.format('YYYY-MM-DD') : '')}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                        required: true,
                        error: !!errors.expenseDate
                      }
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size="small"
                label="Payee / Merchant"
                placeholder="Vendor or payee name..."
                {...register('vendorName')}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                type="number"
                label="Amount (₹)"
                size="small"
                placeholder="0.00"
                inputProps={{ min: 0.01, step: 0.01 }}
                {...register('amount', { required: true })}
                error={!!errors.amount}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                size="small"
                label="GST Tax Rate (%)"
                {...register('taxRate')}
              >
                <MenuItem value={0}>0% (Exempt / Nil)</MenuItem>
                <MenuItem value={5}>5%</MenuItem>
                <MenuItem value={12}>12%</MenuItem>
                <MenuItem value={18}>18% (Standard)</MenuItem>
                <MenuItem value={28}>28%</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                size="small"
                label="Discount (₹)"
                placeholder="0.00"
                {...register('discount')}
              />
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                size="small"
                label="Expense Narration / Purpose"
                placeholder="Business purpose, project, or travel details..."
                {...register('description')}
              />
            </Grid>
            <Grid item xs={12} sm={4} sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={<Switch {...register('isTaxInclusive')} color="warning" />}
                label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Amount is Tax Inclusive</Typography>}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2.5 }} />

          {/* Payment & Settlement Details */}
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#0f172a' }}>
            Payment & Settlement Mode:
          </Typography>

          <Grid container spacing={2.5} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                size="small"
                label="Payment Method"
                {...register('paymentMethod')}
              >
                <MenuItem value="Bank Transfer">Bank Transfer / Net Banking</MenuItem>
                <MenuItem value="UPI / QR">UPI / Immediate Transfer</MenuItem>
                <MenuItem value="Corporate Card">Corporate Credit / Debit Card</MenuItem>
                <MenuItem value="Petty Cash">Petty Cash Voucher</MenuItem>
                <MenuItem value="Cheque">Bank Cheque</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                size="small"
                label="Disbursed From (Bank / Cash Account)"
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
                size="small"
                label="Payment Ref / Cheque / UTR #"
                placeholder="UTR, transaction ID..."
                {...register('reference')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={<Switch defaultChecked {...register('isItcEligible')} color="success" />}
                label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Eligible for Input Tax Credit (ITC)</Typography>}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={<Switch {...register('isInterState')} color="warning" />}
                label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Inter-State Supplier (IGST)</Typography>}
              />
            </Grid>
          </Grid>

          {/* Tax breakdown summary box */}
          <Box sx={{ p: 2.5, backgroundColor: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0', mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" sx={{ color: '#64748b' }}>Taxable Expense</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>₹{taxable.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" sx={{ color: '#64748b' }}>Input GST (ITC Credit)</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#10b981' }}>
                  ₹{tax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" sx={{ color: '#64748b' }}>Total Cash Outflow</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#e5a93c' }}>
                  ₹{total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4, pt: 3, borderTop: '1px solid #f1f5f9' }}>
            <Button onClick={onClose} color="inherit" sx={{ borderRadius: '4px' }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={loading} sx={{ bgcolor: '#e5a93c', borderRadius: '4px', px: 4, fontWeight: 700 }}>
              {loading ? 'Posting...' : 'Record & Post Expense'}
            </Button>
          </Box>
        </form>
      </Card>
    </Box>
  );
}
