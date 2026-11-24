import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { apiClient } from '../../api/client';
import { showNotification } from '../../store';
import DataTable from '../../components/Common/DataTable';
import FormLayout from '../../components/Common/FormLayout';
import AsyncAutocomplete from '../../components/Common/AsyncAutocomplete';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import {
  Box,
  Typography,
  Button,
  Grid,
  TextField,
  MenuItem,
  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

export default function CreditNotesView() {
  const dispatch = useDispatch();
  const refreshKey = useSelector((state) => state.finance.refreshKey);
  const [creditNotes, setCreditNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);

  const [invoiceId, setInvoiceId] = useState('');
  const [noteDate, setNoteDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState('Sales Return');
  const [amount, setAmount] = useState('');
  const [taxRate, setTaxRate] = useState(18);
  const [itemDesc, setItemDesc] = useState('');

  const fetchCreditNotes = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getCreditNotes();
      setCreditNotes(res.data || []);
    } catch (err) {
      dispatch(showNotification({ message: err.message, severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreditNotes();
  }, [refreshKey]);

  const handleOpenCreate = () => {
    setInvoiceId('');
    setNoteDate(new Date().toISOString().slice(0, 10));
    setReason('Sales Return');
    setAmount('');
    setTaxRate(18);
    setItemDesc('');
    setOpenModal(true);
  };

  const handleCreate = async () => {
    if (!invoiceId || !amount || parseFloat(amount) <= 0) {
      alert('Please select an invoice and enter a valid credit amount');
      return;
    }

    try {
      await apiClient.createCreditNote({
        invoiceId,
        noteDate,
        reason,
        amount: parseFloat(amount),
        taxRate: parseFloat(taxRate),
        itemDescription: itemDesc
      });
      dispatch(showNotification({ message: 'Credit Note issued & double-entry ledger posted!', severity: 'success' }));
      setOpenModal(false);
      fetchCreditNotes();
    } catch (err) {
      alert(err.message);
    }
  };

  const columns = [
    {
      header: 'Credit Note #',
      field: 'noteNumber',
      width: 150,
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#e5a93c' }}>
          {row.noteNumber}
        </Typography>
      )
    },
    { header: 'Date', field: 'noteDate', width: 120 },
    { header: 'Original Invoice #', field: 'invoiceNumber', width: 160 },
    { header: 'Customer', field: 'customerName', minWidth: 200 },
    { header: 'Reason', field: 'reason', width: 170 },
    {
      header: 'Taxable (₹)',
      align: 'right',
      render: (row) => `₹${(row.subtotal || 0).toLocaleString('en-IN')}`
    },
    {
      header: 'Tax Reversal (₹)',
      align: 'right',
      render: (row) => `₹${(row.taxAmount || 0).toLocaleString('en-IN')}`
    },
    {
      header: 'Total Credit (₹)',
      align: 'right',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 800, color: '#ef4444' }}>
          -₹{(row.grandTotal || 0).toLocaleString('en-IN')}
        </Typography>
      )
    },
    {
      header: 'Status',
      width: 110,
      render: (row) => (
        <Chip
          size="small"
          label={row.status || 'Posted'}
          color={row.status === 'Draft' ? 'default' : 'success'}
          sx={{ fontWeight: 700, fontSize: '0.72rem', borderRadius: '4px' }}
        />
      )
    }
  ];

  if (openModal) {
    return (
      <FormLayout
        title="Issue Sales Credit Note"
        backLabel="Back to Credit Notes"
        onBack={() => setOpenModal(false)}
        onCancel={() => setOpenModal(false)}
        onSave={handleCreate}
        saveLabel="Post Credit Note"
        savingLabel="Posting..."
      >
        <Grid container spacing={2.5}>
            <Grid item xs={12} sm={8}>
              <AsyncAutocomplete
                type="invoices"
                label="Select Eligible Posted Invoice *"
                placeholder="Type to search invoice number or customer..."
                value={invoiceId}
                onChange={(val) => setInvoiceId(val)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <DatePicker
                label="Credit Note Date"
                value={noteDate ? dayjs(noteDate) : null}
                onChange={(val) => setNoteDate(val && val.isValid() ? val.format('YYYY-MM-DD') : '')}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Adjustment Reason"
                size="small"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                <MenuItem value="Sales Return">Sales Return / Goods Returned</MenuItem>
                <MenuItem value="Post-sale Discount">Post-sale Volume Rebate / Discount</MenuItem>
                <MenuItem value="Invoice Error Correction">Invoice Error Correction</MenuItem>
                <MenuItem value="Service Cancellation">Service Cancellation / Partial Delivery</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="GST Tax Rate (%)"
                size="small"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
              >
                <MenuItem value={0}>0% (Exempt)</MenuItem>
                <MenuItem value={5}>5%</MenuItem>
                <MenuItem value={12}>12%</MenuItem>
                <MenuItem value={18}>18% (Standard)</MenuItem>
                <MenuItem value={28}>28%</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Adjustment Narration / Description"
                size="small"
                value={itemDesc}
                onChange={(e) => setItemDesc(e.target.value)}
                placeholder="Reason details and credit note narration..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                type="number"
                label="Taxable Amount to Credit (₹)"
                size="small"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                inputProps={{ min: 0.01, step: 0.01 }}
              />
            </Grid>
          </Grid>
      </FormLayout>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto', height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Box sx={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 1.5, flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', fontSize: { xs: '1.25rem', sm: '1.45rem' } }}>
            Credit Notes (Receivable Reductions)
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{
            bgcolor: '#e5a93c',
            borderRadius: '4px',
            fontWeight: 700,
            width: { xs: '100%', sm: 'auto' },
            boxShadow: '0 4px 14px rgba(229, 169, 60, 0.3)',
            '&:hover': { bgcolor: '#b88019' }
          }}
        >
          Issue Credit Note
        </Button>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <DataTable
          columns={columns}
          rows={creditNotes}
          loading={loading}
          defaultPageSize={10}
          emptyMessage="No credit notes issued."
        />
      </Box>
    </Box>
  );
}
