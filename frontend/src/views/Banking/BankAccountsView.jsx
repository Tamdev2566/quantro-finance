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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Divider,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  CircularProgress
} from '@mui/material';
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

  // Transfer Modal
  const [openTransferModal, setOpenTransferModal] = useState(false);
  const [fromCode, setFromCode] = useState('1020');
  const [toCode, setToCode] = useState('1010');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferRef, setTransferRef] = useState('');
  const [transferDesc, setTransferDesc] = useState('');

  // New Bank Account Modal
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
      setBankAccounts(accRes.data || []);
      setTransactions(txnRes.data || []);
      if (accRes.data?.length > 0 && !selectedAccountId) {
        setSelectedAccountId(accRes.data[0].id);
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
      fetchData();
    } catch (err) {
      dispatch(showNotification({ message: err.message, severity: 'error' }));
    }
  };

  const selectedAccount = bankAccounts.find((b) => b.id === selectedAccountId);
  const accountTransactions = transactions.filter((t) => t.bankAccountId === selectedAccountId);

  return (
    <Box sx={{ p: { xs: 0.5, sm: 1.5, md: 2 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            Bank & Cash Management
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
            Multi-currency accounts, cash withdrawals, deposits, and internal ledger transfers
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' } }}>
          <Button
            variant="outlined"
            startIcon={<TransferIcon />}
            onClick={() => setOpenTransferModal(true)}
            sx={{ flex: { xs: 1, sm: 'none' } }}
          >
            Fund Transfer
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenNewAccountModal(true)}
            sx={{ flex: { xs: 1, sm: 'none' } }}
          >
            Add Bank Account
          </Button>
        </Box>
      </Box>

      {/* Account Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {bankAccounts.map((acc) => {
          const isSelected = acc.id === selectedAccountId;
          return (
            <Grid item xs={12} sm={6} md={4} key={acc.id}>
              <Card
                onClick={() => setSelectedAccountId(acc.id)}
                sx={{
                  cursor: 'pointer',
                  border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                  boxShadow: isSelected ? '0 4px 12px rgba(37,99,235,0.1)' : 'none',
                  transition: 'all 0.2s ease',
                  '&:hover': { borderColor: '#2563eb' }
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BankIcon color="primary" fontSize="small" />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {acc.bankName}
                      </Typography>
                    </Box>
                    <Chip label="Active" size="small" color="success" sx={{ fontSize: '0.7rem', height: 20 }} />
                  </Box>
                  <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1.5 }}>
                    {acc.accountName} • A/c: {acc.accountNumber}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#2563eb' }}>
                    ₹{acc.currentBalance?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Selected Account Transaction Statement */}
      <Card sx={{ p: 2.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
          Account Statement: {selectedAccount?.accountName || 'Bank Transactions'}
        </Typography>
        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 2 }}>
          IFSC: {selectedAccount?.ifsc || 'N/A'} | Ledger Code: {selectedAccount?.ledgerAccountCode}
        </Typography>

        <Box sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <Table size="small" sx={{ minWidth: 650, border: '1px solid #e2e8f0' }}>
            <TableHead sx={{ backgroundColor: '#151621' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#ffffff' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#ffffff' }}>Reference</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#ffffff' }}>Narration / Description</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#ffffff' }}>Type</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#ffffff' }}>Amount (₹)</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#ffffff' }}>Running Balance (₹)</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#ffffff' }}>Reconciled</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {accountTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3, color: '#64748b' }}>
                    No transactions recorded yet for this account.
                  </TableCell>
                </TableRow>
              ) : (
                accountTransactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{t.date}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{t.reference}</TableCell>
                    <TableCell>{t.description}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={t.type}
                        color={t.type === 'CREDIT' ? 'success' : 'error'}
                        sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: t.type === 'CREDIT' ? '#059669' : '#dc2626' }}>
                      {t.type === 'CREDIT' ? '+' : '-'}₹{t.amount?.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      ₹{t.runningBalance?.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        size="small"
                        label={t.reconciled ? 'Matched' : 'Unreconciled'}
                        variant={t.reconciled ? 'filled' : 'outlined'}
                        color={t.reconciled ? 'success' : 'default'}
                        sx={{ fontSize: '0.7rem' }}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>
      </Card>

      {/* Fund Transfer Modal */}
      <Dialog
        open={openTransferModal}
        onClose={() => setOpenTransferModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: { xs: '16px', sm: '20px' }, m: { xs: 1.5, sm: 2 } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: { xs: '1.15rem', sm: '1.3rem' } }}>Internal Fund Transfer</DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <Grid container spacing={2}>
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
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenTransferModal(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleTransfer} variant="contained">
            Execute Transfer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Bank Account Modal */}
      <Dialog
        open={openNewAccountModal}
        onClose={() => setOpenNewAccountModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: { xs: '16px', sm: '20px' }, m: { xs: 1.5, sm: 2 } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: { xs: '1.15rem', sm: '1.3rem' } }}>Add Bank Account</DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Account Title (e.g. Operating Current A/c)"
                value={newAccData.accountName}
                onChange={(e) => setNewAccData({ ...newAccData, accountName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Bank Name (e.g. Axis Bank)"
                value={newAccData.bankName}
                onChange={(e) => setNewAccData({ ...newAccData, bankName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Account Number"
                value={newAccData.accountNumber}
                onChange={(e) => setNewAccData({ ...newAccData, accountNumber: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="IFSC Code"
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
                value={newAccData.openingBalance}
                onChange={(e) => setNewAccData({ ...newAccData, openingBalance: parseFloat(e.target.value || 0) })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenNewAccountModal(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleCreateAccount} variant="contained">
            Save Bank Account
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
