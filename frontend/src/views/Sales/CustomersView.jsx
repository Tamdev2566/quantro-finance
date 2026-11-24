import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { apiClient } from '../../api/client';
import { showNotification } from '../../store';
import DataTable from '../../components/Common/DataTable';
import {
  Box,
  Typography,
  Button,
  Card,
  Grid,
  TextField,
  Chip,
  IconButton,
  Tooltip,
  FormControlLabel,
  Switch
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/EditOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function CustomersView() {
  const dispatch = useDispatch();
  const refreshKey = useSelector((state) => state.finance.refreshKey);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    gstin: '',
    state: 'Maharashtra',
    stateCode: '27',
    address: '',
    isActive: true
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

  const handleOpenCreate = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      gstin: '',
      state: 'Maharashtra',
      stateCode: '27',
      address: '',
      isActive: true
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || '',
      contactPerson: customer.contactPerson || '',
      email: customer.email || '',
      phone: customer.phone || '',
      gstin: customer.gstin || '',
      state: customer.state || 'Maharashtra',
      stateCode: customer.stateCode || (customer.gstin ? customer.gstin.slice(0, 2) : '27'),
      address: customer.address || '',
      isActive: customer.isActive !== undefined ? customer.isActive : true
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await apiClient.updateCustomer(editingCustomer.id, formData);
        dispatch(showNotification({ message: 'Customer updated successfully', severity: 'success' }));
      } else {
        await apiClient.createCustomer(formData);
        dispatch(showNotification({ message: 'Customer registered successfully', severity: 'success' }));
      }
      setIsFormOpen(false);
      setEditingCustomer(null);
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
            fontWeight: 700,
            color: (row.currentBalance || 0) > 0 ? '#ef4444' : '#10b981'
          }}
        >
          ₹{(row.currentBalance || 0).toLocaleString('en-IN')}
        </Typography>
      )
    },
    {
      header: 'Status',
      width: 110,
      render: (row) => (
        <Chip
          size="small"
          label={row.isActive !== false ? 'Active' : 'Inactive'}
          color={row.isActive !== false ? 'success' : 'default'}
          sx={{ fontWeight: 700, fontSize: '0.72rem', borderRadius: '4px' }}
        />
      )
    },
    {
      header: 'Actions',
      width: 90,
      align: 'center',
      render: (row) => (
        <Tooltip title="Edit Customer">
          <IconButton size="small" onClick={() => handleOpenEdit(row)} sx={{ color: '#64748b', '&:hover': { color: '#e5a93c' } }}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )
    }
  ];

  if (isFormOpen) {
    return (
      <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto' }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => setIsFormOpen(false)}
            sx={{ color: '#64748b', fontWeight: 600, textTransform: 'none', borderRadius: '4px' }}
          >
            Back to Customer Master
          </Button>
        </Box>

        <Card sx={{ p: { xs: 2.5, sm: 4 }, border: '1px solid #e2e8f0', borderRadius: '6px', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)' }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 2 }}>
            {editingCustomer ? `Edit Customer (${editingCustomer.id})` : 'New Customer Master'}
          </Typography>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Company / Customer Legal Name"
                  size="small"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Reliance Retail Ltd"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contact Person"
                  size="small"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  placeholder="e.g. Rajesh Kumar"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email Address"
                  size="small"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. accounts@client.com"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  size="small"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. +91 98765 43210"
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
                  placeholder="e.g. Tamil Nadu"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="State Code"
                  size="small"
                  value={formData.stateCode}
                  onChange={(e) => setFormData({ ...formData, stateCode: e.target.value })}
                  placeholder="e.g. 33"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Billing Address"
                  size="small"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Complete registered business address..."
                />
              </Grid>
              {editingCustomer && (
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isActive !== false}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        color="success"
                      />
                    }
                    label={formData.isActive !== false ? 'Customer Status: Active' : 'Customer Status: Inactive'}
                  />
                </Grid>
              )}
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4, pt: 3, borderTop: '1px solid #f1f5f9' }}>
              <Button onClick={() => setIsFormOpen(false)} color="inherit" sx={{ borderRadius: '4px' }}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" sx={{ bgcolor: '#e5a93c', borderRadius: '4px', px: 4, fontWeight: 700 }}>
                {editingCustomer ? 'Update Customer' : 'Save Customer Master'}
              </Button>
            </Box>
          </form>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto', height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 1.5, flexWrap: 'wrap', gap: 1.5, flexShrink: 0 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', fontSize: { xs: '1.2rem', sm: '1.35rem' } }}>
            Customer Master
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{
            bgcolor: '#e5a93c',
            borderRadius: '4px',
            fontWeight: 700,
            fontSize: '0.82rem',
            width: { xs: '100%', sm: 'auto' },
            boxShadow: '0 4px 14px rgba(229, 169, 60, 0.3)',
            '&:hover': { bgcolor: '#b88019' }
          }}
        >
          New Customer
        </Button>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <DataTable
          columns={columns}
          rows={customers}
          loading={loading}
          emptyMessage="No customers registered."
        />
      </Box>
    </Box>
  );
}
