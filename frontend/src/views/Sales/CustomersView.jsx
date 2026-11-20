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
  Chip,
  IconButton,
  Tooltip,
  FormControlLabel,
  Switch
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/EditOutlined';

export default function CustomersView() {
  const dispatch = useDispatch();
  const refreshKey = useSelector((state) => state.finance.refreshKey);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
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
    setOpenModal(true);
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
    setOpenModal(true);
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
      setOpenModal(false);
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
    },
    {
      header: 'Actions',
      align: 'center',
      width: 90,
      render: (row) => (
        <Tooltip title="Edit Customer">
          <IconButton
            size="small"
            onClick={() => handleOpenEdit(row)}
            sx={{
              color: '#e5a93c',
              border: '1px solid #fed7aa',
              borderRadius: '8px',
              p: '5px',
              '&:hover': { bgcolor: '#fffbeb', borderColor: '#e5a93c' }
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )
    }
  ];

  return (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            Customer Master Directory
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
            GSTIN identification, state tax jurisdiction mapping, and live outstanding balances
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{
            bgcolor: '#e5a93c',
            borderRadius: '14px',
            fontWeight: 700,
            width: { xs: '100%', sm: 'auto' },
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
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: { xs: '16px', sm: '20px' }, m: { xs: 1.5, sm: 2 } } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          {editingCustomer ? `Edit Customer (${editingCustomer.id})` : 'Add New Customer'}
        </DialogTitle>
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
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setOpenModal(false)} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" sx={{ bgcolor: '#e5a93c', borderRadius: '12px' }}>
              {editingCustomer ? 'Update Customer' : 'Save Customer'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
