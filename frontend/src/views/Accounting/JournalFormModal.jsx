import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { apiClient } from '../../api/client';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import {
  Box,
  Card,
  Button,
  Grid,
  TextField,
  MenuItem,
  Typography,
  IconButton,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

export default function JournalFormModal({ onClose, onSuccess }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      transactionDate: new Date().toISOString().slice(0, 10),
      postingDate: new Date().toISOString().slice(0, 10),
      referenceNumber: '',
      description: '',
      lines: [
        { accountCode: '', debit: '', credit: '', description: '' },
        { accountCode: '', debit: '', credit: '', description: '' }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lines'
  });

  const watchedLines = watch('lines') || [];

  useEffect(() => {
    apiClient.getAccounts().then((res) => {
      setAccounts(res.data?.filter((a) => a.isActive) || []);
    }).catch(console.error);
  }, []);

  let totalDebit = 0;
  let totalCredit = 0;
  watchedLines.forEach((l) => {
    totalDebit += parseFloat(l.debit || 0);
    totalCredit += parseFloat(l.credit || 0);
  });
  const diff = Math.abs(totalDebit - totalCredit);
  const isBalanced = diff < 0.01 && totalDebit > 0;

  const onSubmit = async (formData) => {
    if (!isBalanced) {
      alert(`Journal is unbalanced! Debits (₹${totalDebit}) must equal Credits (₹${totalCredit})`);
      return;
    }

    try {
      setLoading(true);
      const parsedLines = formData.lines.map((l) => ({
        accountCode: l.accountCode,
        debit: parseFloat(l.debit || 0),
        credit: parseFloat(l.credit || 0),
        description: l.description || formData.description
      }));

      await apiClient.createJournal({
        ...formData,
        lines: parsedLines,
        transactionType: 'MANUAL',
        sourceModule: 'General Ledger'
      });

      onSuccess('Journal entry posted successfully to General Ledger!');
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
          Back to Journal Entries
        </Button>
      </Box>

      <Card sx={{ p: { xs: 2.5, sm: 4 }, border: '1px solid #e2e8f0', borderRadius: '4px', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)' }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
            Create Double-Entry Journal Entry
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Post a balanced manual journal voucher directly to the General Ledger. Total Debits must equal Total Credits.
          </Typography>
        </Box>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={3}>
              <Controller
                name="transactionDate"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <DatePicker
                    label="Transaction Date"
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(val) => field.onChange(val && val.isValid() ? val.format('YYYY-MM-DD') : '')}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                        required: true,
                        error: !!errors.transactionDate
                      }
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Controller
                name="postingDate"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <DatePicker
                    label="Posting Date"
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(val) => field.onChange(val && val.isValid() ? val.format('YYYY-MM-DD') : '')}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                        required: true,
                        error: !!errors.postingDate
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
                label="Reference #"
                placeholder="e.g. JV-ADJ-001"
                {...register('referenceNumber')}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size="small"
                label="Entry Description"
                placeholder="e.g. Monthly rent adjustment"
                {...register('description', { required: true })}
              />
            </Grid>
          </Grid>

          {/* Journal Lines Table */}
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            Journal Debits & Credits (Double-Entry Engine)
          </Typography>
          <Box sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', mb: 2 }}>
            <Table size="small" sx={{ minWidth: 620, border: '1px solid #e2e8f0' }}>
              <TableHead sx={{ backgroundColor: '#151621' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, width: 280, color: '#ffffff' }}>Ledger Account</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#ffffff' }}>Line Description / Narration</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, width: 140, color: '#ffffff' }}>Debit (₹)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, width: 140, color: '#ffffff' }}>Credit (₹)</TableCell>
                  <TableCell sx={{ width: 50 }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fields.map((field, index) => (
                  <TableRow key={field.id}>
                    <TableCell>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        {...register(`lines.${index}.accountCode`, { required: true })}
                      >
                        {accounts.map((acc) => (
                          <MenuItem key={acc.code} value={acc.code}>
                            {acc.code} – {acc.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Line narration..."
                        {...register(`lines.${index}.description`)}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        inputProps={{ min: 0, step: 0.01 }}
                        {...register(`lines.${index}.debit`, { valueAsNumber: true })}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        inputProps={{ min: 0, step: 0.01 }}
                        {...register(`lines.${index}.credit`, { valueAsNumber: true })}
                      />
                    </TableCell>
                    <TableCell>
                      {fields.length > 2 && (
                        <IconButton size="small" color="error" onClick={() => remove(index)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>

          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() => append({ accountCode: '', debit: 0, credit: 0, description: '' })}
            sx={{ mb: 2, borderRadius: '4px' }}
          >
            Add Journal Line
          </Button>

          {/* Balance Verification Box */}
          <Box sx={{ p: 2, backgroundColor: isBalanced ? '#ecfdf5' : '#fef2f2', borderRadius: '4px', border: `1px solid ${isBalanced ? '#a7f3d0' : '#fecaca'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700, color: isBalanced ? '#065f46' : '#991b1b' }}>
                {isBalanced ? '✓ Balanced: Total Debits equal Total Credits' : `⚠ Unbalanced by ₹${diff.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 4 }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b' }}>Total Debits</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>₹{totalDebit.toLocaleString('en-IN')}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b' }}>Total Credits</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>₹{totalCredit.toLocaleString('en-IN')}</Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button onClick={onClose} color="inherit" sx={{ borderRadius: '4px' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={!isBalanced || loading}
              sx={{
                bgcolor: '#e5a93c',
                color: '#000000',
                fontWeight: 700,
                borderRadius: '4px',
                '&:hover': { bgcolor: '#d49b28' }
              }}
            >
              {loading ? 'Posting...' : 'Post Journal Entry'}
            </Button>
          </Box>
        </form>
      </Card>
    </Box>
  );
}
