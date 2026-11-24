import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { apiClient } from '../../api/client';
import { showNotification } from '../../store';
import DataTable from '../../components/Common/DataTable';
import FormLayout from '../../components/Common/FormLayout';
import {
  Box,
  Typography,
  Button,
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

export default function VendorsView() {
  const dispatch = useDispatch();
  const refreshKey = useSelector((state) => state.finance.refreshKey);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);

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

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getVendors();
      setVendors(res.data || []);
    } catch (err) {
      dispatch(showNotification({ message: err.message, severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [refreshKey]);

  const handleOpenCreate = () => {
    setEditingVendor(null);
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

  const handleOpenEdit = (vendor) => {
    setEditingVendor(vendor);
    setFormData({
      name: vendor.name || '',
      contactPerson: vendor.contactPerson || '',
      email: vendor.email || '',
      phone: vendor.phone || '',
      gstin: vendor.gstin || '',
      state: vendor.state || 'Maharashtra',
      stateCode: vendor.stateCode || (vendor.gstin ? vendor.gstin.slice(0, 2) : '27'),
      address: vendor.address || '',
      isActive: vendor.isActive !== undefined ? vendor.isActive : true
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingVendor) {
        await apiClient.updateVendor(editingVendor.id, formData);
        dispatch(showNotification({ message: 'Vendor updated successfully', severity: 'success' }));
      } else {
        await apiClient.createVendor(formData);
        dispatch(showNotification({ message: 'Vendor registered successfully', severity: 'success' }));
      }
      setIsFormOpen(false);
      setEditingVendor(null);
      fetchVendors();
    } catch (err) {
      dispatch(showNotification({ message: err.message, severity: 'error' }));
    }
  };

  const columns = [
    {
      header: 'Vendor ID',
      field: 'id',
      width: 130,
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748b' }}>
          {row.id}
        </Typography>
      )
    },
    {
      header: 'Vendor / Supplier Name',
      field: 'name',
      minWidth: 200,
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
          {row.name}
        </Typography>
      )
    },
    { header: 'Contact Person', field: 'contactPerson', width: 160 },
    { header: 'GSTIN', field: 'gstin', width: 170 },
    { header: 'State', field: 'state', width: 140 },
    {
      header: 'Payables Due (₹)',
      align: 'right',
      render: (row) => (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 700,
            color: (row.currentBalance || 0) > 0 ? '#ef4444' : '#64748b'
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
        <Tooltip title="Edit Vendor">
          <IconButton size="small" onClick={() => handleOpenEdit(row)} sx={{ color: '#64748b', '&:hover': { color: '#e5a93c' } }}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )
    }
  ];

  if (isFormOpen) {
    return (
      <FormLayout
        title={editingVendor ? `Edit Vendor (${editingVendor.id})` : 'New Vendor / Supplier Master'}
        backLabel="Back to Vendors Master"
        onBack={() => setIsFormOpen(false)}
        onCancel={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
        saveLabel={editingVendor ? 'Update Vendor' : 'Save Vendor Master'}
        savingLabel="Saving..."
      >
        <Grid container spacing={2.5}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              label="Vendor / Company Legal Name"
              size="small"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Tata Steel Ltd"
            />
          </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contact Person"
                  size="small"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  placeholder="e.g. Sanjay Sharma"
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
                  placeholder="e.g. billing@supplier.com"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  size="small"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. +91 98765 12345"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="GSTIN (15-digit Tax ID)"
                  size="small"
                  value={formData.gstin}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                  placeholder="27AABCT1234F1Z6"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="State Name"
                  size="small"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="e.g. Maharashtra"
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
                  rows={3}
                  label="Vendor Business Address"
                  size="small"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Complete registered supplier address..."
                />
              </Grid>
              {editingVendor && (
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isActive !== false}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        color="success"
                      />
                    }
                    label={formData.isActive !== false ? 'Vendor Status: Active' : 'Vendor Status: Inactive'}
                  />
                </Grid>
              )}
            </Grid>
      </FormLayout>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto', height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 1.5, flexWrap: 'wrap', gap: 1.5, flexShrink: 0 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', fontSize: { xs: '1.2rem', sm: '1.35rem' } }}>
            Vendors Master
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
          New Vendor
        </Button>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <DataTable
          columns={columns}
          rows={vendors}
          loading={loading}
          emptyMessage="No vendors registered."
        />
      </Box>
    </Box>
  );
}
