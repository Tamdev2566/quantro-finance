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

export default function CreditNotesView() {
  const dispatch = useDispatch();
  const refreshKey = useSelector((state) => state.finance.refreshKey);
  const [creditNotes, setCreditNotes] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);

  // Form state
  const [invoiceId, setInvoiceId] = useState('');
  const [noteDate, setNoteDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState('Sales Return');
  const [itemDesc, setItemDesc] = useState('Return / Rate Adjustment');
  const [amount, setAmount] = useState('');
  const [taxRate, setTaxRate] = useState(18);

  const fetchCreditNotes = async () => {
    try {
      setLoading(true);
      const [cnRes, invRes] = await Promise.all([
        apiClient.getCreditNotes(),
        apiClient.getInvoices()
      ]);
      setCreditNotes(cnRes.data || []);
      const eligible = (invRes.data || []).filter(
        (i) => i.status === 'Posted' || i.status === 'Partially Paid' || i.status === 'Paid'
      );
      setInvoices(eligible);
      if (eligible.length > 0 && !invoiceId) {
        setInvoiceId(eligible[0].id);
      }
    } catch (err) {
      dispatch(showNotification({ message: err.message, severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreditNotes();
  }, [refreshKey]);

  const handleCreate = async () => {
    if (!invoiceId || !amount || parseFloat(amount) <= 0) {
      alert('Please select an invoice and enter a valid taxable amount');
      return;
    }
    try {
      await apiClient.createCreditNote({
        invoiceId,
        date: noteDate,
        reason,
        items: [
          {
            description: itemDesc,
            quantity: 1,
            unitPrice: parseFloat(amount),
            taxRate: Number(taxRate)
          }
        ]
      });
      dispatch(showNotification({ message: 'Credit Note issued & double-entry revenue reversed!', severity: 'success' }));
      setOpenModal(false);
      setAmount('');
      fetchCreditNotes();
    } catch (err) {
      dispatch(showNotification({ message: err.message, severity: 'error' }));
    }
  };

  const columns = [
    {
      header: 'Credit Note #',
      field: 'creditNoteNumber',
      width: 140,
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#ef4444' }}>
          {row.creditNoteNumber}
        </Typography>
      )
    },
    { header: 'Invoice #', field: 'invoiceNumber', width: 140 },
    { header: 'Customer', field: 'customerName', minWidth: 170 },
    { header: 'Date', field: 'date', width: 110 },
    { header: 'Reason', field: 'reason', width: 150 },
    {
      header: 'Taxable (₹)',
      align: 'right',
      render: (row) => `₹${(row.taxableTotal || 0).toLocaleString('en-IN')}`
    },
    {
      header: 'GST Total (₹)',
      align: 'right',
      render: (row) => `₹${(row.totalTax || 0).toLocaleString('en-IN')}`
    },
    {
      header: 'Grand Total (₹)',
      align: 'right',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 800, color: '#ef4444' }}>
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
          color="secondary"
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
            Credit Notes (Receivable Reductions)
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
            Sales returns, dispute resolutions, and automated reversal of revenues and tax liabilities
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
          Issue Credit Note
        </Button>
      </Box>

      <DataTable
        columns={columns}
        rows={creditNotes}
        loading={loading}
        emptyMessage="No credit notes issued."
      />

      {/* Credit Note Dialog */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Issue Sales Credit Note</DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField
                select
                fullWidth
                label="Select Eligible Invoice"
                size="small"
                value={invoiceId}
                onChange={(e) => setInvoiceId(e.target.value)}
              >
                {invoices.map((inv) => (
                  <MenuItem key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} - {inv.customerName} (₹{inv.grandTotal?.toLocaleString('en-IN')})
                  </MenuItem>
                ))}
              </TextField>
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
                <MenuItem value="Sales Return">Sales Return</MenuItem>
                <MenuItem value="Post-sale Discount">Post-sale Discount</MenuItem>
                <MenuItem value="Invoice Error Correction">Invoice Error Correction</MenuItem>
                <MenuItem value="Service Cancellation">Service Cancellation</MenuItem>
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
                <MenuItem value={18}>18%</MenuItem>
                <MenuItem value={28}>28%</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Item / Service Description"
                size="small"
                value={itemDesc}
                onChange={(e) => setItemDesc(e.target.value)}
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
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenModal(false)} color="inherit">
            Cancel
          </Button>
          <Button variant="contained" onClick={handleCreate} sx={{ bgcolor: '#e5a93c', borderRadius: '12px' }}>
            Post Credit Note
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
