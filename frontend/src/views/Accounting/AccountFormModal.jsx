import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { apiClient } from '../../api/client';
import {
  Card,
  Button,
  Grid,
  TextField,
  MenuItem,
  FormControlLabel,
  Switch,
  Typography,
  Box
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const ACCOUNT_CATEGORIES = {
  Assets: ['Cash', 'Bank', 'Accounts Receivable', 'Inventory', 'Fixed Assets', 'Prepaid Expenses', 'Input GST', 'Other Assets'],
  Liabilities: ['Accounts Payable', 'Output GST', 'Loans', 'Accrued Expenses', 'Other Liabilities'],
  Equity: ['Owner Capital', 'Retained Earnings', 'Drawings'],
  Revenue: ['Sales Revenue', 'Service Revenue', 'Other Income'],
  Expenses: ['Salaries', 'Rent', 'Utilities', 'Travel', 'Office Expenses', 'Marketing', 'Bank Charges', 'Depreciation', 'Cost of Goods Sold', 'Other Expenses']
};

export default function AccountFormModal({ open, accountToEdit, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    defaultValues: {
      code: '',
      name: '',
      type: 'Assets',
      category: 'Cash',
      description: '',
      openingBalance: 0,
      isActive: true
    }
  });

  const watchedType = watch('type');

  useEffect(() => {
    if (accountToEdit) {
      reset({
        code: accountToEdit.code,
        name: accountToEdit.name,
        type: accountToEdit.type,
        category: accountToEdit.category,
        description: accountToEdit.description || '',
        openingBalance: accountToEdit.openingBalance || 0,
        isActive: accountToEdit.isActive !== false
      });
    } else {
      reset({
        code: '',
        name: '',
        type: 'Assets',
        category: 'Cash',
        description: '',
        openingBalance: 0,
        isActive: true
      });
    }
  }, [accountToEdit, open]);

  useEffect(() => {
    const availableCategories = ACCOUNT_CATEGORIES[watchedType] || [];
    if (availableCategories.length > 0) {
      setValue('category', availableCategories[0]);
    }
  }, [watchedType]);

  const onSubmit = async (formData) => {
    try {
      setLoading(true);
      if (accountToEdit) {
        await apiClient.updateAccount(accountToEdit.code, formData);
        onSuccess('Account updated successfully');
      } else {
        await apiClient.createAccount(formData);
        onSuccess('Account created in Chart of Accounts');
      }
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={onClose}
          sx={{ color: '#64748b', fontWeight: 600, textTransform: 'none', borderRadius: '4px' }}
        >
          Back to Chart of Accounts
        </Button>
      </Box>

      <Card sx={{ p: { xs: 2.5, sm: 4 }, border: '1px solid #e2e8f0', borderRadius: '6px', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)' }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5 }}>
          {accountToEdit ? `Edit Ledger Account: ${accountToEdit.code} - ${accountToEdit.name}` : 'New Chart of Accounts Entry'}
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mb: 3.5 }}>
          Define general ledger hierarchy, asset/liability classifications, and financial statement mapping
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Account Code"
                disabled={Boolean(accountToEdit)}
                placeholder="e.g. 1040"
                {...register('code', { required: 'Code is required' })}
                error={!!errors.code}
              />
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                size="small"
                label="Account Name"
                placeholder="e.g. Corporate HDFC Current A/c"
                {...register('name', { required: 'Name is required' })}
                error={!!errors.name}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Account Classification (Type)"
                disabled={Boolean(accountToEdit?.isSystem)}
                {...register('type', { required: true })}
              >
                <MenuItem value="Assets">Assets</MenuItem>
                <MenuItem value="Liabilities">Liabilities</MenuItem>
                <MenuItem value="Equity">Equity</MenuItem>
                <MenuItem value="Revenue">Revenue</MenuItem>
                <MenuItem value="Expenses">Expenses</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Sub-Category"
                disabled={Boolean(accountToEdit?.isSystem)}
                {...register('category', { required: true })}
              >
                {(ACCOUNT_CATEGORIES[watchedType] || []).map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Account Purpose & Description"
                placeholder="Internal audit and accounting description..."
                {...register('description')}
              />
            </Grid>
            {!accountToEdit && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Opening Balance (₹)"
                  placeholder="0.00"
                  inputProps={{ step: 0.01 }}
                  {...register('openingBalance', { valueAsNumber: true })}
                />
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={<Switch defaultChecked {...register('isActive')} color="success" />}
                label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Account Active & Posting Enabled</Typography>}
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4, pt: 3, borderTop: '1px solid #f1f5f9' }}>
            <Button onClick={onClose} color="inherit" sx={{ borderRadius: '4px' }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={loading} sx={{ bgcolor: '#e5a93c', borderRadius: '4px', px: 4, fontWeight: 700 }}>
              {loading ? 'Saving...' : 'Save Account'}
            </Button>
          </Box>
        </form>
      </Card>
    </Box>
  );
}
