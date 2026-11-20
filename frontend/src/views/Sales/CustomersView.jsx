import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { apiClient } from '../../api/client';
import { showNotification } from '../../store';
import DataTable from '../../components/Common/DataTable';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

export default function CustomersView() {
  const dispatch = useDispatch();
  const refreshKey = useSelector((state) => state.finance.refreshKey);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    gstin: '',
    state: 'Maharashtra',
    stateCode: '27',
    address: ''
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getCustomers();
      setCustomers(res.data || []);
    } catch (err) {
      dispatch(showNotification({ message: err.message, severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [refreshKey]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.createCustomer(formData);
      dispatch(showNotification({ message: 'Customer registered successfully', severity: 'success' }));
      setOpenModal(false);
      setFormData({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        gstin: '',
        state: 'Maharashtra',
        stateCode: '27',
        address: ''
      });
      fetchCustomers();
    } catch (err) {
      dispatch(showNotification({ message: err.message, severity: 'error' }));
    }
  };

  const columns = [
    {
      header: 'Customer ID',
      field: 'id',
      width: 130,
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748b' }}>
          {row.id}
        </Typography>
      )
    },
    {
      header: 'Customer Name',
      field: 'name',
      minWidth: 200,
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#e5a93c' }}>
          {row.name}
        </Typography>
      )
    },
    { header: 'Contact Person', field: 'contactPerson', width: 160 },
    { header: 'GSTIN', field: 'gstin', width: 170 },
    { header: 'State', field: 'state', width: 140 },
    {
      header: 'Ledger Balance (₹)',
      align: 'right',
      render: (row) => (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 800,
            color: row.balance > 0 ? '#ef4444' : row.balance < 0 ? '#16a34a' : '#64748b'
          }}
        >
          ₹{(row.balance !== undefined ? row.balance : 0).toLocaleString('en-IN')}
        </Typography>
      )
    },
    {
      header: 'Status',
      align: 'center',
      render: (row) => (
        <Chip
          label={row.isActive ? 'Active' : 'Inactive'}
          size="small"
          color={row.isActive ? 'success' : 'default'}
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
            Customer Master Directory
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
            GSTIN identification, state tax jurisdiction mapping, and live outstanding balances
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
          New Customer
        </Button>
      </Box>

      <DataTable
        columns={columns}
        rows={customers}
        loading={loading}
        emptyMessage="No customers registered."
      />

      {/* Customer Modal */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Add New Customer</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Company / Customer Legal Name"
                  size="small"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contact Person"
                  size="small"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email Address"
                  size="small"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  size="small"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="GSTIN (15-digit Tax ID)"
                  size="small"
                  value={formData.gstin}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                  placeholder="27AABCA1234F1Z5"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="State Name"
                  size="small"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="State Code"
                  size="small"
                  value={formData.stateCode}
                  onChange={(e) => setFormData({ ...formData, stateCode: e.target.value })}
                  placeholder="e.g. 27"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Billing Address"
                  size="small"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setOpenModal(false)} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" sx={{ bgcolor: '#e5a93c', borderRadius: '12px' }}>
              Save Customer
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
