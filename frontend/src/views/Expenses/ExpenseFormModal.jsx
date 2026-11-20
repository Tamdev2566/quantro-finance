import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { apiClient } from '../../api/client';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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

export default function ExpenseFormModal({ open, onClose, onSuccess }) {
  const [categories, setCategories] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(false);

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      category: 'Office Supplies',
      accountCode: '5150',
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
      bankAccountId: 'BANK-001',
      reference: '',
      notes: ''
    }
  });

  const watchedCategory = watch('category');
  const watchedAmount = parseFloat(watch('amount') || 0);
  const watchedTaxRate = parseFloat(watch('taxRate') || 0);
  const watchedTaxInclusive = watch('isTaxInclusive');

  useEffect(() => {
    if (open) {
      Promise.all([apiClient.getExpenseCategories(), apiClient.getBankAccounts()]).then(([cRes, bRes]) => {
        setCategories(cRes.data || []);
        setBankAccounts(bRes.data || []);
      });
    }
  }, [open]);

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
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>Record Direct Operating Expense</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers sx={{ p: 3 }}>
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
                placeholder="Vendor or payee..."
                {...register('vendorName')}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Amount (₹)"
                inputProps={{ min: 0.01, step: 0.01 }}
                {...register('amount', { required: 'Amount is required' })}
                error={!!errors.amount}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                size="small"
                label="Applicable GST Rate"
                {...register('taxRate')}
              >
                <MenuItem value={0}>0% (Exempt)</MenuItem>
                <MenuItem value={5}>5%</MenuItem>
                <MenuItem value={12}>12%</MenuItem>
                <MenuItem value={18}>18%</MenuItem>
                <MenuItem value={28}>28%</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                size="small"
                label="Payment Method"
                {...register('paymentMethod')}
              >
                <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                <MenuItem value="Card">Corporate Credit Card</MenuItem>
                <MenuItem value="UPI">UPI</MenuItem>
                <MenuItem value="Cash">Petty Cash</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Paid From Account"
                {...register('bankAccountId')}
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
                size="small"
                label="Reference / Invoice / Receipt #"
                {...register('reference')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Expense Description / Purpose"
                {...register('description', { required: true })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={<Switch {...register('isTaxInclusive')} />}
                label="Tax Inclusive Price"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={<Switch defaultChecked {...register('isItcEligible')} />}
                label="Eligible for Input Tax Credit"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={<Switch {...register('isInterState')} />}
                label="Inter-State (IGST)"
              />
            </Grid>
          </Grid>

          {/* Tax breakdown summary box */}
          <Box sx={{ p: 2, backgroundColor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Typography variant="caption" sx={{ color: '#64748b' }}>Taxable Expense</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>₹{taxable.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" sx={{ color: '#64748b' }}>Input GST (ITC)</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#059669' }}>
                  ₹{tax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" sx={{ color: '#64748b' }}>Total Payout</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#2563eb' }}>
                  ₹{total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Posting...' : 'Record & Post Expense'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
