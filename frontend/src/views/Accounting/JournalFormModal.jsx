import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
  IconButton,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Divider,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

export default function JournalFormModal({ open, onClose, onSuccess }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      transactionDate: new Date().toISOString().slice(0, 10),
      postingDate: new Date().toISOString().slice(0, 10),
      referenceNumber: '',
      description: 'Manual Journal Entry',
      lines: [
        { accountCode: '1010', debit: 1000, credit: 0, description: '' },
        { accountCode: '4010', debit: 0, credit: 1000, description: '' }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lines'
  });

  const watchedLines = watch('lines') || [];

  useEffect(() => {
    if (open) {
      apiClient.getAccounts().then((res) => {
        setAccounts(res.data?.filter((a) => a.isActive) || []);
      });
    }
  }, [open]);

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
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>Create Double-Entry Journal Entry</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers sx={{ p: 3 }}>
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Transaction Date"
                InputLabelProps={{ shrink: true }}
                {...register('transactionDate', { required: true })}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Posting Date"
                InputLabelProps={{ shrink: true }}
                {...register('postingDate', { required: true })}
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
                {...register('description', { required: true })}
              />
            </Grid>
          </Grid>

          {/* Journal Lines Table */}
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            Journal Debits & Credits (Double-Entry Engine)
          </Typography>
          <Table size="small" sx={{ mb: 2, border: '1px solid #e2e8f0' }}>
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

          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() => append({ accountCode: '1010', debit: 0, credit: 0, description: '' })}
            sx={{ mb: 2 }}
          >
            Add Journal Line
          </Button>

          {/* Balance Verification Box */}
          <Box sx={{ p: 2, backgroundColor: isBalanced ? '#ecfdf5' : '#fef2f2', borderRadius: 2, border: `1px solid ${isBalanced ? '#a7f3d0' : '#fecaca'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={!isBalanced || loading}>
            {loading ? 'Posting...' : 'Post Journal Entry'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
