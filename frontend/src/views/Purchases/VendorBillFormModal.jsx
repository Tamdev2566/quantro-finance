import React, { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { apiClient } from '../../api/client';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import FormLayout from '../../components/Common/FormLayout';
import AsyncAutocomplete from '../../components/Common/AsyncAutocomplete';
import {
  Grid,
  TextField,
  MenuItem,
  Typography,
  Box,
  IconButton,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Divider,
  FormControlLabel,
  Switch,
  Button
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

export default function VendorBillFormModal({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      vendorId: '',
      vendorBillNumber: '',
      billDate: new Date().toISOString().slice(0, 10),
      dueDate: '',
      paymentTerms: 'Net 30',
      description: '',
      expenseAccountCode: '',
      isTaxInclusive: false,
      items: [
        { description: '', quantity: 1, unitPrice: '', discountPercent: 0, taxRate: 18 }
      ],
      notes: ''
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const watchedItems = watch('items') || [];
  const watchedTaxInclusive = watch('isTaxInclusive');

  let subtotal = 0;
  let totalDiscount = 0;
  let taxableTotal = 0;
  let totalTax = 0;
  let grandTotal = 0;

  watchedItems.forEach((item) => {
    const qty = parseFloat(item.quantity || 0);
    const price = parseFloat(item.unitPrice || 0);
    const discPercent = parseFloat(item.discountPercent || 0);
    const rate = parseFloat(item.taxRate || 0);

    const lineTotal = qty * price;
    const discount = (lineTotal * discPercent) / 100;
    const net = Math.max(0, lineTotal - discount);

    let taxable = net;
    let tax = (taxable * rate) / 100;

    if (watchedTaxInclusive) {
      taxable = net / (1 + rate / 100);
      tax = net - taxable;
    }

    subtotal += lineTotal;
    totalDiscount += discount;
    taxableTotal += taxable;
    totalTax += tax;
    grandTotal += watchedTaxInclusive ? net : (taxable + tax);
  });

  const onSubmit = async (formData) => {
    try {
      setLoading(true);
      await apiClient.createVendorBill(formData);
      onSuccess('Vendor Bill created successfully as Draft');
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormLayout
      title="Record Vendor / Supplier Bill"
      backLabel="Back to Vendor Bills"
      onBack={onClose}
      onCancel={onClose}
      onSubmit={handleSubmit(onSubmit)}
      saveLabel="Save Draft Vendor Bill"
      savingLabel="Saving..."
      loading={loading}
    >
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Controller
            name="vendorId"
            control={control}
            rules={{ required: 'Vendor is required' }}
            render={({ field }) => (
              <AsyncAutocomplete
                type="vendors"
                label="Vendor *"
                placeholder="Type to search vendor..."
                value={field.value}
                onChange={(val) => field.onChange(val)}
                error={!!errors.vendorId}
                helperText={errors.vendorId?.message}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            required
            label="Supplier Bill / Invoice #"
            size="small"
            placeholder="e.g. INV-SUPP-9821"
            {...register('vendorBillNumber', { required: 'Bill number is required' })}
            error={!!errors.vendorBillNumber}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Controller
            name="expenseAccountCode"
            control={control}
            render={({ field }) => (
              <AsyncAutocomplete
                type="accounts"
                accountType="Expenses"
                label="Expense Account Mapping"
                placeholder="Type code or name (e.g. 5110)..."
                value={field.value}
                onChange={(val) => field.onChange(val)}
                extraOptions={[{ id: '', label: 'Auto-allocate per items' }]}
              />
            )}
          />
        </Grid>
            <Grid item xs={12} sm={3}>
              <Controller
                name="billDate"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <DatePicker
                    label="Bill Date"
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
            <Grid item xs={12} sm={3}>
              <Controller
                name="dueDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    label="Due Date"
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(val) => field.onChange(val && val.isValid() ? val.format('YYYY-MM-DD') : '')}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small'
                      }
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                select
                fullWidth
                label="Payment Terms"
                size="small"
                {...register('paymentTerms')}
              >
                <MenuItem value="Immediate">Immediate / Due on Receipt</MenuItem>
                <MenuItem value="Net 15">Net 15 Days</MenuItem>
                <MenuItem value="Net 30">Net 30 Days</MenuItem>
                <MenuItem value="Net 60">Net 60 Days</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3} sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={<Switch {...register('isTaxInclusive')} color="warning" />}
                label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Prices are Tax Inclusive</Typography>}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bill Narration / Scope Description"
                size="small"
                placeholder="Purchase description or PO reference..."
                {...register('description')}
              />
            </Grid>
          </Grid>

          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: '#0f172a' }}>
            Bill Purchased Items & Services:
          </Typography>

          <Box sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', mb: 3 }}>
            <Table size="small" sx={{ minWidth: 700, border: '1px solid #f1f5f9', borderRadius: '4px' }}>
              <TableHead sx={{ bgcolor: '#12131c' }}>
                <TableRow>
                  <TableCell sx={{ color: '#ffffff', fontWeight: 700, width: '38%' }}>Item Description</TableCell>
                  <TableCell sx={{ color: '#ffffff', fontWeight: 700, width: '12%' }} align="right">Qty</TableCell>
                  <TableCell sx={{ color: '#ffffff', fontWeight: 700, width: '16%' }} align="right">Unit Price (₹)</TableCell>
                  <TableCell sx={{ color: '#ffffff', fontWeight: 700, width: '12%' }} align="right">Disc %</TableCell>
                  <TableCell sx={{ color: '#ffffff', fontWeight: 700, width: '14%' }} align="right">GST Rate</TableCell>
                  <TableCell sx={{ color: '#ffffff', fontWeight: 700, width: '8%' }} align="center"></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fields.map((field, idx) => (
                  <TableRow key={field.id}>
                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Item or service description..."
                        {...register(`items.${idx}.description`, { required: true })}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small"
                        type="number"
                        inputProps={{ min: 1 }}
                        sx={{ width: 80 }}
                        {...register(`items.${idx}.quantity`, { required: true })}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small"
                        type="number"
                        inputProps={{ min: 0, step: 0.01 }}
                        placeholder="0.00"
                        sx={{ width: 120 }}
                        {...register(`items.${idx}.unitPrice`, { required: true })}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small"
                        type="number"
                        inputProps={{ min: 0, max: 100 }}
                        sx={{ width: 75 }}
                        {...register(`items.${idx}.discountPercent`)}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        select
                        size="small"
                        sx={{ width: 110 }}
                        {...register(`items.${idx}.taxRate`)}
                      >
                        <MenuItem value={0}>0% (Exempt)</MenuItem>
                        <MenuItem value={5}>5%</MenuItem>
                        <MenuItem value={12}>12%</MenuItem>
                        <MenuItem value={18}>18% (Standard)</MenuItem>
                        <MenuItem value={28}>28%</MenuItem>
                      </TextField>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="error"
                        disabled={fields.length === 1}
                        onClick={() => remove(idx)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>

          <Button
            startIcon={<AddIcon />}
            variant="outlined"
            size="small"
            onClick={() => append({ description: '', quantity: 1, unitPrice: '', discountPercent: 0, taxRate: 18 })}
            sx={{ mb: 3, borderRadius: '4px', textTransform: 'none', fontWeight: 600 }}
          >
            Add Purchased Item
          </Button>

          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={7}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Internal Audit & Payment Notes"
                size="small"
                placeholder="Disbursement remarks, PO reference, approval tags..."
                {...register('notes')}
              />
            </Grid>
            <Grid item xs={12} md={5}>
              <Box sx={{ p: 2.5, backgroundColor: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>Subtotal:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{subtotal.toLocaleString('en-IN')}</Typography>
                </Box>
                {totalDiscount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, color: '#dc2626' }}>
                    <Typography variant="body2">Discount:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>-₹{totalDiscount.toLocaleString('en-IN')}</Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>Taxable Value:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{taxableTotal.toLocaleString('en-IN')}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>Input GST (ITC):</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{totalTax.toLocaleString('en-IN')}</Typography>
                </Box>
                <Divider sx={{ my: 1.5 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Bill Grand Total:</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#e5a93c' }}>
                    ₹{grandTotal.toLocaleString('en-IN')}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
    </FormLayout>
  );
}
