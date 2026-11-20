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
  FormControlLabel,
  Switch
} from '@mui/material';

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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>
        {accountToEdit ? `Edit Account: ${accountToEdit.code}` : 'Create Chart of Accounts Code'}
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers sx={{ p: 3 }}>
          <Grid container spacing={2}>
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
                placeholder="e.g. Secondary Bank Account"
                {...register('name', { required: 'Name is required' })}
                error={!!errors.name}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Account Type"
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
                label="Account Category"
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
                label="Description"
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
                  inputProps={{ step: 0.01 }}
                  {...register('openingBalance', { valueAsNumber: true })}
                />
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={<Switch defaultChecked {...register('isActive')} />}
                label="Account Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Saving...' : 'Save Account'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
