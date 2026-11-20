import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
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
  Switch
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

export default function VendorBillFormModal({ open, onClose, onSuccess }) {
  const [vendors, setVendors] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      vendorId: '',
      vendorBillNumber: '',
      billDate: new Date().toISOString().slice(0, 10),
      dueDate: '',
      paymentTerms: 'Net 30',
      description: 'Vendor Supply Bill',
      expenseAccountCode: '5010',
      isTaxInclusive: false,
      items: [
        { description: 'Procurement of Server Hardware / Software', quantity: 1, unitPrice: 20000, discountPercent: 0, taxRate: 18 }
      ],
      notes: ''
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const watchedItems = watch('items') || [];
  const watchedVendorId = watch('vendorId');
  const watchedTaxInclusive = watch('isTaxInclusive');

  useEffect(() => {
    if (open) {
      Promise.all([apiClient.getVendors(), apiClient.getAccounts()]).then(([vRes, aRes]) => {
        setVendors(vRes.data || []);
        // Filter expense accounts
        const expAccs = (aRes.data || []).filter((a) => a.type === 'Expenses');
        setAccounts(expAccs);
        if (vRes.data?.length > 0 && !watchedVendorId) {
          setValue('vendorId', vRes.data[0].id);
        }
      });
    }
  }, [open]);

  // Preview calculations
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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { borderRadius: { xs: '16px', sm: '20px' }, m: { xs: 1.5, sm: 2 } } }}
    >
      <DialogTitle sx={{ fontWeight: 800, fontSize: { xs: '1.15rem', sm: '1.3rem' } }}>
        Record Vendor / Supplier Bill
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers sx={{ p: 3 }}>
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                label="Vendor"
                size="small"
                {...register('vendorId', { required: 'Vendor is required' })}
              >
                {vendors.map((v) => (
                  <MenuItem key={v.id} value={v.id}>
                    {v.name} ({v.state})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Vendor Invoice # (External Ref)"
                size="small"
                placeholder="e.g. INV-998231"
                {...register('vendorBillNumber', { required: 'Vendor Bill # is required' })}
                error={!!errors.vendorBillNumber}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                label="Expense / COGS Ledger Account"
                size="small"
                {...register('expenseAccountCode')}
              >
                {accounts.map((a) => (
                  <MenuItem key={a.code} value={a.code}>
                    {a.code} - {a.name}
                  </MenuItem>
                ))}
              </TextField>
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
                        required: true,
                        error: !!errors.billDate
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
                        size: 'small',
                        error: !!errors.dueDate
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
                <MenuItem value="Immediate">Immediate</MenuItem>
                <MenuItem value="Net 15">Net 15 Days</MenuItem>
                <MenuItem value="Net 30">Net 30 Days</MenuItem>
                <MenuItem value="Net 60">Net 60 Days</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControlLabel
                control={<Switch {...register('isTaxInclusive')} />}
                label="Tax Inclusive Pricing"
              />
            </Grid>
          </Grid>

          {/* Line Items Table */}
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            Bill Line Items & Expenses
          </Typography>
          <Box sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', mb: 2 }}>
            <Table size="small" sx={{ minWidth: 650, border: '1px solid #e2e8f0' }}>
              <TableHead sx={{ backgroundColor: '#151621' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#ffffff' }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 90, color: '#ffffff' }}>Qty</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 130, color: '#ffffff' }}>Unit Cost (₹)</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 100, color: '#ffffff' }}>Disc %</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 110, color: '#ffffff' }}>Input GST Rate</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 120, color: '#ffffff' }}>Amount</TableCell>
                  <TableCell sx={{ width: 50 }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fields.map((field, index) => {
                  const itemQty = parseFloat(watchedItems[index]?.quantity || 0);
                  const itemPrice = parseFloat(watchedItems[index]?.unitPrice || 0);
                  const itemDisc = parseFloat(watchedItems[index]?.discountPercent || 0);
                  const lineAmt = itemQty * itemPrice * (1 - itemDisc / 100);

                  return (
                    <TableRow key={field.id}>
                      <TableCell>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Item or service name..."
                          {...register(`items.${index}.description`, { required: true })}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          inputProps={{ min: 1 }}
                          {...register(`items.${index}.quantity`, { required: true, valueAsNumber: true })}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          inputProps={{ min: 0, step: 0.01 }}
                          {...register(`items.${index}.unitPrice`, { required: true, valueAsNumber: true })}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          inputProps={{ min: 0, max: 100 }}
                          {...register(`items.${index}.discountPercent`, { valueAsNumber: true })}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          select
                          size="small"
                          fullWidth
                          {...register(`items.${index}.taxRate`, { valueAsNumber: true })}
                        >
                          <MenuItem value={0}>0% (Exempt)</MenuItem>
                          <MenuItem value={5}>5%</MenuItem>
                          <MenuItem value={12}>12%</MenuItem>
                          <MenuItem value={18}>18%</MenuItem>
                          <MenuItem value={28}>28%</MenuItem>
                        </TextField>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        ₹{lineAmt.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        {fields.length > 1 && (
                          <IconButton size="small" color="error" onClick={() => remove(index)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>

          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() => append({ description: '', quantity: 1, unitPrice: 0, discountPercent: 0, taxRate: 18 })}
            sx={{ mb: 2 }}
          >
            Add Line Item
          </Button>

          {/* Totals Summary */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Box sx={{ width: { xs: '100%', sm: 300 }, p: 2, backgroundColor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Subtotal:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{subtotal.toLocaleString('en-IN')}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Taxable Value:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{taxableTotal.toLocaleString('en-IN')}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Eligible Input GST (ITC):</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#059669' }}>
                  ₹{totalTax.toLocaleString('en-IN')}
                </Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Total Bill Amount:</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#2563eb' }}>
                  ₹{grandTotal.toLocaleString('en-IN')}
                </Typography>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Saving...' : 'Save Draft Bill'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
