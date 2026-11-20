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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  MenuItem
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

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
  const [desc, setDesc] = useState('Goods Return / Rate Correction');
  const [amount, setAmount] = useState('');
  const [taxRate, setTaxRate] = useState(18);

  const fetchDebitNotes = async () => {
    try {
      setLoading(true);
      const [dnRes, bRes] = await Promise.all([
        apiClient.getDebitNotes(),
        apiClient.getVendorBills()
      ]);
      setDebitNotes(dnRes.data || []);
      const eligible = (bRes.data || []).filter(
        (b) => b.status === 'Posted' || b.status === 'Partially Paid' || b.status === 'Paid'
      );
      setBills(eligible);
      if (eligible.length > 0 && !billId) {
        setBillId(eligible[0].id);
      }
    } catch (err) {
      dispatch(showNotification({ message: err.message, severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebitNotes();
  }, [refreshKey]);

  const handleCreate = async () => {
    if (!billId || !amount || parseFloat(amount) <= 0) {
      alert('Please select a bill and enter a valid taxable amount');
      return;
    }
    try {
      await apiClient.createDebitNote({
        billId,
        date: noteDate,
        reason,
        items: [
          {
            description: desc,
            quantity: 1,
            unitPrice: parseFloat(amount),
            taxRate: Number(taxRate)
          }
        ]
      });
      dispatch(showNotification({ message: 'Debit Note issued & vendor liability reduced!', severity: 'success' }));
      setOpenModal(false);
      setAmount('');
      fetchDebitNotes();
    } catch (err) {
      dispatch(showNotification({ message: err.message, severity: 'error' }));
    }
  };

  const columns = [
    {
      header: 'Debit Note #',
      field: 'debitNoteNumber',
      width: 140,
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#16a34a' }}>
          {row.debitNoteNumber}
        </Typography>
      )
    },
    { header: 'Bill #', field: 'billNumber', width: 140 },
    { header: 'Vendor', field: 'vendorName', minWidth: 170 },
    { header: 'Date', field: 'date', width: 110 },
    { header: 'Reason', field: 'reason', width: 150 },
    {
      header: 'Taxable (₹)',
      align: 'right',
      render: (row) => `₹${(row.taxableTotal || 0).toLocaleString('en-IN')}`
    },
    {
      header: 'ITC Reversal (₹)',
      align: 'right',
      render: (row) => `₹${(row.totalTax || 0).toLocaleString('en-IN')}`
    },
    {
      header: 'Grand Total (₹)',
      align: 'right',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 800, color: '#16a34a' }}>
          ₹{(row.grandTotal || 0).toLocaleString('en-IN')}
        </Typography>
      )
    },
    {
      header: 'Status',
      align: 'center',
      render: (row) => (
        <Chip
          label={row.status}
          size="small"
          color="success"
          sx={{ fontWeight: 700, fontSize: '0.72rem', borderRadius: '8px' }}
        />
      )
    }
  ];

  return (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
            Debit Notes (Vendor Liability Reductions)
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
            Record purchase returns, vendor credit adjustments, and Input Tax Credit reversals
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenModal(true)}
          sx={{
            bgcolor: '#e5a93c',
            borderRadius: '14px',
            fontWeight: 700,
            boxShadow: '0 4px 14px rgba(91, 91, 214, 0.3)',
            '&:hover': { bgcolor: '#4b4bc0' }
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

      {/* Debit Note Modal */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Issue Vendor Debit Note</DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField
                select
                fullWidth
                label="Select Eligible Vendor Bill"
                size="small"
                value={billId}
                onChange={(e) => setBillId(e.target.value)}
              >
                {bills.map((b) => (
                  <MenuItem key={b.id} value={b.id}>
                    {b.billNumber} - {b.vendorName} (₹{b.grandTotal.toLocaleString('en-IN')})
                  </MenuItem>
                ))}
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
                label="Reason"
                size="small"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                <MenuItem value="Purchase Return">Purchase Return</MenuItem>
                <MenuItem value="Rate Difference / Discount">Rate Difference / Discount</MenuItem>
                <MenuItem value="Defective Materials">Defective Materials</MenuItem>
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
                <MenuItem value={0}>0%</MenuItem>
                <MenuItem value={5}>5%</MenuItem>
                <MenuItem value={12}>12%</MenuItem>
                <MenuItem value={18}>18%</MenuItem>
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
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenModal(false)} color="inherit">
            Cancel
          </Button>
          <Button variant="contained" onClick={handleCreate} sx={{ bgcolor: '#e5a93c', borderRadius: '12px' }}>
            Post Debit Note
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
