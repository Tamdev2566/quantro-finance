import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { apiClient } from '../../api/client';
import { showNotification } from '../../store';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  MenuItem,
  Checkbox,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Divider
} from '@mui/material';
import ReconcileIcon from '@mui/icons-material/CheckCircle';

export default function ReconciliationView() {
  const dispatch = useDispatch();
  const refreshKey = useSelector((state) => state.finance.refreshKey);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [periodStart, setPeriodStart] = useState('2026-04-01');
  const [periodEnd, setPeriodEnd] = useState('2026-04-30');
  const [stmtOpening, setStmtOpening] = useState('0');
  const [stmtClosing, setStmtClosing] = useState('0');
  const [transactions, setTransactions] = useState([]);
  const [selectedTxnIds, setSelectedTxnIds] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiClient.getBankAccounts().then((res) => {
      setBankAccounts(res.data || []);
      if (res.data?.length > 0 && !selectedAccountId) {
        setSelectedAccountId(res.data[0].id);
      }
    });
  }, [refreshKey]);

  useEffect(() => {
    if (selectedAccountId) {
      apiClient.getBankTransactions({ bankAccountId: selectedAccountId }).then((res) => {
        setTransactions(res.data || []);
        const alreadyMatched = (res.data || []).filter((t) => t.reconciled).map((t) => t.id);
        setSelectedTxnIds(alreadyMatched);
      });
    }
  }, [selectedAccountId, refreshKey]);

  const toggleSelect = (id) => {
    setSelectedTxnIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedTxnIds(transactions.map((t) => t.id));
  };

  const openingNum = parseFloat(stmtOpening || 0);
  const closingNum = parseFloat(stmtClosing || 0);

  let matchedCredits = 0;
  let matchedDebits = 0;
  transactions.forEach((t) => {
    if (selectedTxnIds.includes(t.id)) {
      if (t.type === 'CREDIT') matchedCredits += t.amount;
      if (t.type === 'DEBIT') matchedDebits += t.amount;
    }
  });

  const calculatedBookClosing = openingNum + (matchedCredits - matchedDebits);
  const difference = closingNum - calculatedBookClosing;
  const isBalanced = Math.abs(difference) < 0.01;

  const handleCompleteReconciliation = async () => {
    try {
      setLoading(true);
      await apiClient.reconcileBank({
        bankAccountId: selectedAccountId,
        periodStart,
        periodEnd,
        statementOpeningBalance: openingNum,
        statementClosingBalance: closingNum,
        matchedTransactionIds: selectedTxnIds
      });
      dispatch(showNotification({ message: 'Bank Reconciliation finalized & logged!', severity: 'success' }));
    } catch (err) {
      dispatch(showNotification({ message: err.message, severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto', height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Box sx={{ flexShrink: 0, mb: 1.5 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, fontSize: { xs: '1.25rem', sm: '1.45rem' } }}>
          Bank Statement Reconciliation
        </Typography>
      </Box>

      <Card sx={{ flexShrink: 0, p: 1.8, mb: 1.5 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Bank Account"
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
            >
              {bankAccounts.map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  {b.accountName}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={2.5}>
            <DatePicker
              label="Statement Start"
              value={periodStart ? dayjs(periodStart) : null}
              onChange={(val) => setPeriodStart(val && val.isValid() ? val.format('YYYY-MM-DD') : '')}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: 'small'
                }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={2.5}>
            <DatePicker
              label="Statement End"
              value={periodEnd ? dayjs(periodEnd) : null}
              onChange={(val) => setPeriodEnd(val && val.isValid() ? val.format('YYYY-MM-DD') : '')}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: 'small'
                }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Statement Opening (₹)"
              value={stmtOpening}
              onChange={(e) => setStmtOpening(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Statement Closing (₹)"
              value={stmtClosing}
              onChange={(e) => setStmtClosing(e.target.value)}
            />
          </Grid>
        </Grid>
      </Card>

      <Card sx={{ flexShrink: 0, p: { xs: 1.2, sm: 1.5 }, mb: 1.5, backgroundColor: isBalanced ? '#ecfdf5' : '#fef2f2', border: `1px solid ${isBalanced ? '#a7f3d0' : '#fecaca'}` }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' }, gap: 1.5 }}>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isBalanced ? '#065f46' : '#991b1b' }}>
              {isBalanced ? '✓ Reconciled: Zero Difference between Statement and Cleared Book' : `Difference: ₹${difference.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
            </Typography>
            <Typography variant="caption" sx={{ color: isBalanced ? '#047857' : '#b91c1c' }}>
              Matched {selectedTxnIds.length} of {transactions.length} transactions
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: { xs: 2, sm: 3, md: 4 }, alignItems: 'center', flexWrap: 'wrap', justifyContent: { xs: 'space-between', md: 'flex-end' } }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b' }}>Cleared Deposits</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#059669' }}>+₹{matchedCredits.toLocaleString('en-IN')}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b' }}>Cleared Withdrawals</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#dc2626' }}>-₹{matchedDebits.toLocaleString('en-IN')}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b' }}>Calculated Balance</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>₹{calculatedBookClosing.toLocaleString('en-IN')}</Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<ReconcileIcon />}
              onClick={handleCompleteReconciliation}
              disabled={loading}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Complete Reconciliation
            </Button>
          </Box>
        </Box>
      </Card>

      <Card sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', p: { xs: 1.2, sm: 1.8 }, overflow: 'hidden' }}>
        <Box sx={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Unreconciled & Cleared Transactions
          </Typography>
          <Button size="small" onClick={selectAll}>Select All</Button>
        </Box>

        <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
          <Table size="small" stickyHeader sx={{ minWidth: 650, border: '1px solid #e2e8f0' }}>
            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedTxnIds.length > 0 && selectedTxnIds.length < transactions.length}
                    checked={transactions.length > 0 && selectedTxnIds.length === transactions.length}
                    onChange={selectAll}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Reference</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Narration</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Amount (₹)</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((t) => {
                const isSelected = selectedTxnIds.includes(t.id);
                return (
                  <TableRow key={t.id} hover onClick={() => toggleSelect(t.id)} sx={{ cursor: 'pointer' }}>
                    <TableCell padding="checkbox">
                      <Checkbox checked={isSelected} />
                    </TableCell>
                    <TableCell>{t.date}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{t.reference}</TableCell>
                    <TableCell>{t.description}</TableCell>
                    <TableCell>
                      <Chip size="small" label={t.type} color={t.type === 'CREDIT' ? 'success' : 'error'} />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: t.type === 'CREDIT' ? '#059669' : '#dc2626' }}>
                      {t.type === 'CREDIT' ? '+' : '-'}₹{t.amount?.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell align="center">
                      <Chip size="small" label={isSelected ? 'Matched' : 'Unmatched'} color={isSelected ? 'primary' : 'default'} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      </Card>
    </Box>
  );
}
