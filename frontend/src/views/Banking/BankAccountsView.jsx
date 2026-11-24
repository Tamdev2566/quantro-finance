import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { apiClient } from '../../api/client';
import { showNotification } from '../../store';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  MenuItem,
  Chip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import TransferIcon from '@mui/icons-material/CompareArrows';
import BankIcon from '@mui/icons-material/AccountBalance';

export default function BankAccountsView() {
  const dispatch = useDispatch();
  const refreshKey = useSelector((state) => state.finance.refreshKey);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [loading, setLoading] = useState(true);

  const [openTransferModal, setOpenTransferModal] = useState(false);
  const [fromCode, setFromCode] = useState('');
  const [toCode, setToCode] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferRef, setTransferRef] = useState('');
  const [transferDesc, setTransferDesc] = useState('');

  const [openNewAccountModal, setOpenNewAccountModal] = useState(false);
  const [newAccData, setNewAccData] = useState({
    accountName: '',
    accountNumber: '',
    bankName: '',
    ifsc: '',
    branch: '',
    openingBalance: 0
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [accRes, txnRes] = await Promise.all([
        apiClient.getBankAccounts(),
        apiClient.getBankTransactions()
      ]);
      const accounts = accRes.data || [];
      setBankAccounts(accounts);
      setTransactions(txnRes.data || []);
      if (accounts.length > 0) {
        if (!selectedAccountId) setSelectedAccountId(accounts[0].id);
        if (!fromCode) setFromCode(accounts[0].ledgerAccountCode || '1020');
        if (!toCode) setToCode('1010');
      }
    } catch (err) {
      dispatch(showNotification({ message: err.message, severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  const handleTransfer = async () => {
    const amt = parseFloat(transferAmount);
    if (!amt || amt <= 0) {
      alert('Enter a valid transfer amount');
      return;
    }
    try {
      await apiClient.transferFunds({
        fromAccountCode: fromCode,
        toAccountCode: toCode,
        amount: amt,
        reference: transferRef,
        description: transferDesc
      });
      dispatch(showNotification({ message: 'Fund transfer posted with balanced journal entry!', severity: 'success' }));
      setOpenTransferModal(false);
      setTransferAmount('');
      setTransferRef('');
      setTransferDesc('');
      fetchData();
    } catch (err) {
      dispatch(showNotification({ message: err.message, severity: 'error' }));
    }
  };

  const handleCreateAccount = async () => {
    try {
      await apiClient.createBankAccount(newAccData);
      dispatch(showNotification({ message: 'Bank account added successfully', severity: 'success' }));
      setOpenNewAccountModal(false);
      setNewAccData({
        accountName: '',
        accountNumber: '',
        bankName: '',
        ifsc: '',
        branch: '',
        openingBalance: 0
      });
      fetchData();
    } catch (err) {
      dispatch(showNotification({ message: err.message, severity: 'error' }));
    }
  };

  const selectedAccount = bankAccounts.find((b) => b.id === selectedAccountId);
  const accountTransactions = transactions.filter((t) => t.bankAccountId === selectedAccountId);

  if (openTransferModal) {
    return (
      <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto', height: '100%', overflowY: 'auto', pr: { xs: 0.5, md: 1 }, pb: 4 }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => setOpenTransferModal(false)}
            sx={{ color: '#64748b', fontWeight: 600, textTransform: 'none', borderRadius: '4px' }}
          >
            Back to Bank Accounts
          </Button>
        </Box>

        <Card sx={{ p: { xs: 2.5, sm: 4 }, border: '1px solid #e2e8f0', borderRadius: '4px', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)' }}>
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
              Internal Fund Transfer
            </Typography>
          </Box>

          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Transfer From Account"
                value={fromCode}
                onChange={(e) => setFromCode(e.target.value)}
              >
                <MenuItem value="1010">1010 - Petty Cash</MenuItem>
                {bankAccounts.map((b) => (
                  <MenuItem key={b.id} value={b.ledgerAccountCode}>
                    {b.ledgerAccountCode} - {b.accountName}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Transfer To Account"
                value={toCode}
                onChange={(e) => setToCode(e.target.value)}
              >
                <MenuItem value="1010">1010 - Petty Cash</MenuItem>
                {bankAccounts.map((b) => (
                  <MenuItem key={b.id} value={b.ledgerAccountCode}>
                    {b.ledgerAccountCode} - {b.accountName}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Amount (₹)"
                placeholder="0.00"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                inputProps={{ min: 0.01, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Reference / Check #"
                placeholder="e.g. FT-2026-001"
                value={transferRef}
                onChange={(e) => setTransferRef(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Description"
                placeholder="e.g. Cash replenishment for office"
                value={transferDesc}
                onChange={(e) => setTransferDesc(e.target.value)}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3.5, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button onClick={() => setOpenTransferModal(false)} color="inherit" sx={{ borderRadius: '4px' }}>
              Cancel
            </Button>
            <Button
              onClick={handleTransfer}
              variant="contained"
              disabled={!transferAmount || parseFloat(transferAmount) <= 0 || fromCode === toCode}
              sx={{ bgcolor: '#e5a93c', color: '#000000', fontWeight: 700, borderRadius: '4px', '&:hover': { bgcolor: '#d49b28' } }}
            >
              Execute Transfer
            </Button>
          </Box>
        </Card>
      </Box>
    );
  }

  if (openNewAccountModal) {
    return (
      <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto', height: '100%', overflowY: 'auto', pr: { xs: 0.5, md: 1 }, pb: 4 }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => setOpenNewAccountModal(false)}
            sx={{ color: '#64748b', fontWeight: 600, textTransform: 'none', borderRadius: '4px' }}
          >
            Back to Bank Accounts
          </Button>
        </Box>

        <Card sx={{ p: { xs: 2.5, sm: 4 }, border: '1px solid #e2e8f0', borderRadius: '4px', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)' }}>
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
              Add Bank Account
            </Typography>
          </Box>

          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Account Title (e.g. Operating Current A/c)"
                placeholder="e.g. HDFC Operating Current Account"
                value={newAccData.accountName}
                onChange={(e) => setNewAccData({ ...newAccData, accountName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Bank Name (e.g. Axis Bank)"
                placeholder="e.g. HDFC Bank"
                value={newAccData.bankName}
                onChange={(e) => setNewAccData({ ...newAccData, bankName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Account Number"
                placeholder="e.g. 50200012345678"
                value={newAccData.accountNumber}
                onChange={(e) => setNewAccData({ ...newAccData, accountNumber: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="IFSC Code"
                placeholder="e.g. HDFC0001234"
                value={newAccData.ifsc}
                onChange={(e) => setNewAccData({ ...newAccData, ifsc: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Opening Balance (₹)"
                placeholder="0.00"
                value={newAccData.openingBalance}
                onChange={(e) => setNewAccData({ ...newAccData, openingBalance: parseFloat(e.target.value || 0) })}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3.5, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button onClick={() => setOpenNewAccountModal(false)} color="inherit" sx={{ borderRadius: '4px' }}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateAccount}
              variant="contained"
              disabled={!newAccData.accountName || !newAccData.bankName || !newAccData.accountNumber}
              sx={{ bgcolor: '#e5a93c', color: '#000000', fontWeight: 700, borderRadius: '4px', '&:hover': { bgcolor: '#d49b28' } }}
            >
              Save Bank Account
            </Button>
          </Box>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto', height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Box sx={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 1.5, flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, fontSize: { xs: '1.25rem', sm: '1.45rem' } }}>
            Bank & Cash Management
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.2, flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' } }}>
          <Button
            variant="outlined"
            startIcon={<TransferIcon />}
            onClick={() => setOpenTransferModal(true)}
            sx={{ flex: { xs: 1, sm: 'none' }, borderRadius: '4px', textTransform: 'none' }}
          >
            Fund Transfer
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenNewAccountModal(true)}
            sx={{ flex: { xs: 1, sm: 'none' }, borderRadius: '4px', textTransform: 'none', bgcolor: '#e5a93c', color: '#000', fontWeight: 700, '&:hover': { bgcolor: '#d49b28' } }}
          >
            Add Bank Account
          </Button>
        </Box>
      </Box>

      <Grid container spacing={1.5} sx={{ flexShrink: 0, mb: 1.5 }}>
        {bankAccounts.map((b) => (
          <Grid item xs={12} sm={6} md={4} key={b.id}>
            <Card
              onClick={() => setSelectedAccountId(b.id)}
              sx={{
                cursor: 'pointer',
                p: 1.8,
                borderRadius: '4px',
                border: selectedAccountId === b.id ? '2px solid #e5a93c' : '1px solid #e2e8f0',
                boxShadow: selectedAccountId === b.id ? '0 4px 16px rgba(229, 169, 60, 0.2)' : '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all 0.15s ease'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <BankIcon sx={{ color: '#e5a93c', fontSize: 24 }} />
                <Chip label={b.currency} size="small" sx={{ fontWeight: 700, borderRadius: '4px', height: 20, fontSize: '0.7rem' }} />
              </Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                {b.accountName}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 0.8 }}>
                {b.bankName} • {b.accountNumber}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                ₹{(b.currentBalance || 0).toLocaleString('en-IN')}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', border: '1px solid #e2e8f0', borderRadius: '4px', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
        <Box sx={{ flexShrink: 0, p: 1.5, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            Transaction Feed – {selectedAccount?.accountName || 'All'}
          </Typography>
          <Chip label={`${accountTransactions.length} items`} size="small" sx={{ borderRadius: '4px', height: 20, fontSize: '0.72rem' }} />
        </Box>
        <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ bgcolor: '#151621', color: '#ffffff', fontWeight: 700, py: 1 }}>Date</TableCell>
                <TableCell sx={{ bgcolor: '#151621', color: '#ffffff', fontWeight: 700, py: 1 }}>Reference</TableCell>
                <TableCell sx={{ bgcolor: '#151621', color: '#ffffff', fontWeight: 700, py: 1 }}>Description</TableCell>
                <TableCell align="right" sx={{ bgcolor: '#151621', color: '#ffffff', fontWeight: 700, py: 1 }}>Deposit (₹)</TableCell>
                <TableCell align="right" sx={{ bgcolor: '#151621', color: '#ffffff', fontWeight: 700, py: 1 }}>Withdrawal (₹)</TableCell>
                <TableCell align="right" sx={{ bgcolor: '#151621', color: '#ffffff', fontWeight: 700, py: 1 }}>Balance (₹)</TableCell>
                <TableCell align="center" sx={{ bgcolor: '#151621', color: '#ffffff', fontWeight: 700, py: 1 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={24} sx={{ color: '#e5a93c' }} />
                  </TableCell>
                </TableRow>
              ) : accountTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: '#94a3b8' }}>
                    No bank transactions recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                accountTransactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell sx={{ fontWeight: 600 }}>{t.date}</TableCell>
                    <TableCell>{t.reference || '—'}</TableCell>
                    <TableCell>{t.description}</TableCell>
                    <TableCell align="right" sx={{ color: '#16a34a', fontWeight: 700 }}>
                      {t.type === 'DEPOSIT' ? `+₹${t.amount.toLocaleString('en-IN')}` : '—'}
                    </TableCell>
                    <TableCell align="right" sx={{ color: '#dc2626', fontWeight: 700 }}>
                      {t.type === 'WITHDRAWAL' ? `-₹${t.amount.toLocaleString('en-IN')}` : '—'}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      ₹{(t.runningBalance || 0).toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        size="small"
                        label={t.reconciled ? 'Matched' : 'Unreconciled'}
                        variant={t.reconciled ? 'filled' : 'outlined'}
                        color={t.reconciled ? 'success' : 'default'}
                        sx={{ fontSize: '0.7rem', borderRadius: '4px' }}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>
      </Card>
    </Box>
  );
}
