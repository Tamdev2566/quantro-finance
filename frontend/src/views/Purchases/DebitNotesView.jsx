import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { apiClient } from '../../api/client';
import { showNotification } from '../../store';
import DataTable from '../../components/Common/DataTable';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import {
  Box,
  Typography,
  Button,
  Card,
  Grid,
  TextField,
  MenuItem,
  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function DebitNotesView() {
  const dispatch = useDispatch();
  const refreshKey = useSelector((state) => state.finance.refreshKey);
  const [debitNotes, setDebitNotes] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);

  const [billId, setBillId] = useState('');
  const [noteDate, setNoteDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState('Purchase Return');
  const [amount, setAmount] = useState('');
  const [taxRate, setTaxRate] = useState(18);
  const [desc, setDesc] = useState('');

  const fetchDebitNotes = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getDebitNotes();
      setDebitNotes(res.data || []);
    } catch (err) {
      dispatch(showNotification({ message: err.message, severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  const fetchBills = async () => {
    try {
      const res = await apiClient.getVendorBills();
      setBills((res.data || []).filter((b) => b.status === 'Posted' || b.status === 'Partially Paid' || b.status === 'Paid'));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDebitNotes();
    fetchBills();
  }, [refreshKey]);

  const handleOpenCreate = () => {
    setBillId('');
    setNoteDate(new Date().toISOString().slice(0, 10));
    setReason('Purchase Return');
    setAmount('');
    setTaxRate(18);
    setDesc('');
    setOpenModal(true);
  };

  const handleCreate = async () => {
    if (!billId || !amount || parseFloat(amount) <= 0) {
      alert('Please select a vendor bill and enter a valid debit amount');
      return;
    }

    try {
      await apiClient.createDebitNote({
        billId,
        noteDate,
        reason,
        amount: parseFloat(amount),
        taxRate: parseFloat(taxRate),
        itemDescription: desc
      });
      dispatch(showNotification({ message: 'Debit Note issued & vendor liability reduced!', severity: 'success' }));
      setOpenModal(false);
      fetchDebitNotes();
    } catch (err) {
      alert(err.message);
    }
  };

  const columns = [
    {
      header: 'Debit Note #',
      field: 'noteNumber',
      width: 150,
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#e5a93c' }}>
          {row.noteNumber}
        </Typography>
      )
    },
    { header: 'Date', field: 'noteDate', width: 120 },
    { header: 'Original Bill #', field: 'vendorBillNumber', width: 160 },
    { header: 'Vendor / Supplier', field: 'vendorName', minWidth: 200 },
    { header: 'Reason', field: 'reason', width: 170 },
    {
      header: 'Taxable (₹)',
      align: 'right',
      render: (row) => `₹${(row.subtotal || 0).toLocaleString('en-IN')}`
    },
    {
      header: 'ITC Reversal (₹)',
      align: 'right',
      render: (row) => `₹${(row.taxAmount || 0).toLocaleString('en-IN')}`
    },
    {
      header: 'Total Debit (₹)',
      align: 'right',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 800, color: '#10b981' }}>
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
      <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto' }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => setOpenModal(false)}
            sx={{ color: '#64748b', fontWeight: 600, textTransform: 'none', borderRadius: '4px' }}
          >
            Back to Debit Notes
          </Button>
        </Box>

        <Card sx={{ p: { xs: 2.5, sm: 4 }, border: '1px solid #e2e8f0', borderRadius: '6px', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)' }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5 }}>
            Issue Vendor Debit Note
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 3.5 }}>
            Reduce supplier liabilities, account for purchase returns, and automatically reverse Input Tax Credit
          </Typography>

          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={8}>
              <TextField
                select
                fullWidth
                label="Select Eligible Vendor Bill"
                size="small"
                value={billId}
                onChange={(e) => setBillId(e.target.value)}
              >
                {bills.length === 0 ? (
                  <MenuItem value="" disabled>No posted vendor bills found</MenuItem>
                ) : (
                  bills.map((b) => (
                    <MenuItem key={b.id} value={b.id}>
                      {b.billNumber} - {b.vendorName} (₹{b.grandTotal.toLocaleString('en-IN')})
                    </MenuItem>
                  ))
                )}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <DatePicker
                label="Debit Note Date"
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
                <MenuItem value="Purchase Return">Purchase Return / Goods Sent Back</MenuItem>
                <MenuItem value="Rate Difference / Discount">Rate Difference / Supplier Discount</MenuItem>
                <MenuItem value="Defective Materials">Defective / Damaged Materials</MenuItem>
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
                label="Item / Material Description"
                size="small"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Details of materials returned or discount granted..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                type="number"
                label="Taxable Amount to Debit (₹)"
                size="small"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                inputProps={{ min: 0.01, step: 0.01 }}
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4, pt: 3, borderTop: '1px solid #f1f5f9' }}>
            <Button onClick={() => setOpenModal(false)} color="inherit" sx={{ borderRadius: '4px' }}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleCreate} sx={{ bgcolor: '#e5a93c', borderRadius: '4px', px: 4, fontWeight: 700 }}>
              Post Debit Note
            </Button>
          </Box>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            Debit Notes (Vendor Liability Reductions)
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
            Record purchase returns, vendor credit adjustments, and Input Tax Credit reversals
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
          Issue Debit Note
        </Button>
      </Box>

      <DataTable
        columns={columns}
        rows={debitNotes}
        loading={loading}
        emptyMessage="No debit notes issued."
      />
    </Box>
  );
}
