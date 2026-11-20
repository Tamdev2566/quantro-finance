import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { apiClient } from '../../api/client';
import { showNotification, setCompany } from '../../store';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Divider,
  Chip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  CircularProgress
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import UnlockIcon from '@mui/icons-material/LockOpen';
import CloseYearIcon from '@mui/icons-material/CheckCircle';

export default function CompanySettingsView() {
  const dispatch = useDispatch();
  const refreshKey = useSelector((state) => state.finance.refreshKey);
  const [companyData, setCompanyData] = useState(null);
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmClosePeriod, setConfirmClosePeriod] = useState(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const [cRes, pRes] = await Promise.all([
        apiClient.getCompany(),
        apiClient.getPeriods()
      ]);
      setCompanyData(cRes.data || {});
      setPeriods(pRes.data || []);
      dispatch(setCompany(cRes.data));
    } catch (err) {
      dispatch(showNotification({ message: err.message, severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [refreshKey]);

  const handleSaveCompany = async () => {
    try {
      await apiClient.updateCompany(companyData);
      dispatch(showNotification({ message: 'Company settings updated successfully', severity: 'success' }));
      fetchSettings();
    } catch (err) {
      dispatch(showNotification({ message: err.message, severity: 'error' }));
    }
  };

  const handleToggleMonthLock = async (periodId, month, isLocked) => {
    try {
      await apiClient.lockMonth(periodId, { month, lock: !isLocked });
      dispatch(showNotification({ message: `Month ${month} ${!isLocked ? 'locked' : 'unlocked'}`, severity: 'success' }));
      fetchSettings();
    } catch (err) {
      dispatch(showNotification({ message: err.message, severity: 'error' }));
    }
  };

  const handleCloseFiscalYear = async () => {
    if (!confirmClosePeriod) return;
    try {
      const res = await apiClient.closeFiscalYear(confirmClosePeriod.id);
      dispatch(showNotification({
        message: `Fiscal Year closed! Net profit of ₹${res.data?.netProfit?.toLocaleString('en-IN')} transferred to Retained Earnings (3020)`,
        severity: 'success'
      }));
      setConfirmClosePeriod(null);
      fetchSettings();
    } catch (err) {
      dispatch(showNotification({ message: err.message, severity: 'error' }));
    }
  };

  if (loading && !companyData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  const activePeriod = periods[0] || {};
  const sampleMonths = ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12', '2027-01', '2027-02', '2027-03'];

  return (
    <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          Company & Financial Period Management
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          Configure enterprise legal identity, state jurisdiction, monthly lock periods, and year-end closing
        </Typography>
      </Box>

      <Card sx={{ p: 3, mb: 4 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
          Legal Entity & GST Registration
        </Typography>
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Company Legal Name"
              value={companyData?.name || ''}
              onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="GSTIN"
              value={companyData?.gstin || ''}
              onChange={(e) => setCompanyData({ ...companyData, gstin: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              label="Home State"
              value={companyData?.state || ''}
              onChange={(e) => setCompanyData({ ...companyData, state: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              label="State Code"
              value={companyData?.stateCode || ''}
              onChange={(e) => setCompanyData({ ...companyData, stateCode: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              label="Base Currency"
              value={companyData?.baseCurrency || 'INR'}
              disabled
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              label="Registered Office Address"
              value={companyData?.address || ''}
              onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" onClick={handleSaveCompany} sx={{ width: { xs: '100%', sm: 'auto' } }}>
              Save Profile Changes
            </Button>
          </Grid>
        </Grid>
      </Card>

      <Card sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Financial Period Locking & Fiscal Year Status
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Locked months prohibit all journal modifications and posting requests
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="warning"
            startIcon={<CloseYearIcon />}
            disabled={activePeriod.isClosed}
            onClick={() => setConfirmClosePeriod(activePeriod)}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            {activePeriod.isClosed ? 'Year Closed' : 'Execute Year-End Close'}
          </Button>
        </Box>

        <Box sx={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <Table size="small" sx={{ minWidth: 480, border: '1px solid #e2e8f0' }}>
            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Month</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Period</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sampleMonths.map((m) => {
                const isLocked = activePeriod.lockedMonths?.includes(m);
                return (
                  <TableRow key={m}>
                    <TableCell sx={{ fontWeight: 600 }}>{m}</TableCell>
                    <TableCell>{activePeriod.name || 'FY 2026-2027'}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={isLocked ? 'Locked' : 'Open for Posting'}
                        color={isLocked ? 'error' : 'success'}
                        sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        color={isLocked ? 'success' : 'error'}
                        startIcon={isLocked ? <UnlockIcon /> : <LockIcon />}
                        onClick={() => handleToggleMonthLock(activePeriod.id, m, isLocked)}
                      >
                        {isLocked ? 'Unlock Month' : 'Lock Month'}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      </Card>

      <ConfirmDialog
        open={Boolean(confirmClosePeriod)}
        title="Execute Year-End Financial Close?"
        content={`Executing Year-End Close for '${confirmClosePeriod?.name}' will calculate the final Net Profit or Loss, transfer it to Retained Earnings (Account 3020), zero out nominal Revenue & Expense accounts, and mark the financial year as closed.`}
        confirmText="Execute Close"
        confirmColor="warning"
        onConfirm={handleCloseFiscalYear}
        onCancel={() => setConfirmClosePeriod(null)}
      />
    </Box>
  );
}
