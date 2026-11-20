import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { apiClient } from '../../api/client';
import { showNotification } from '../../store';
import DataTable from '../../components/Common/DataTable';
import JournalFormModal from './JournalFormModal';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import {
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ViewIcon from '@mui/icons-material/VisibilityOutlined';
import UndoIcon from '@mui/icons-material/Undo';

export default function JournalEntriesView() {
  const dispatch = useDispatch();
  const refreshKey = useSelector((state) => state.finance.refreshKey);
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [confirmReverse, setConfirmReverse] = useState(null);

  const fetchJournals = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getJournals();
      setJournals(res.data || []);
    } catch (err) {
      dispatch(showNotification({ message: err.message, severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJournals();
  }, [refreshKey]);

  const handleReverse = async () => {
    if (!confirmReverse) return;
    try {
      await apiClient.reverseJournal(confirmReverse.id, { reason: 'Controller Correction' });
      dispatch(showNotification({ message: `Journal ${confirmReverse.journalNumber} reversed`, severity: 'success' }));
      setConfirmReverse(null);
      fetchJournals();
    } catch (err) {
      dispatch(showNotification({ message: err.message, severity: 'error' }));
    }
  };

  const filtered = journals.filter((j) => {
    if (!searchText) return true;
    const q = searchText.toLowerCase();
    return j.journalNumber?.toLowerCase().includes(q) ||
           j.description?.toLowerCase().includes(q) ||
           j.transactionType?.toLowerCase().includes(q) ||
           j.referenceNumber?.toLowerCase().includes(q);
  });

  const columns = [
    {
      header: 'Journal #',
      field: 'journalNumber',
      width: 150,
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 800, color: '#e5a93c' }}>
          {row.journalNumber}
        </Typography>
      )
    },
    { header: 'Posting Date', field: 'postingDate', width: 120 },
    { header: 'Type', field: 'transactionType', width: 140 },
    { header: 'Source Module', field: 'sourceModule', width: 160 },
    { header: 'Description / Narration', field: 'description', minWidth: 220 },
    {
      header: 'Total Debit (₹)',
      align: 'right',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
          ₹{(row.totalDebit || 0).toLocaleString('en-IN')}
        </Typography>
      )
    },
    {
      header: 'Total Credit (₹)',
      align: 'right',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
          ₹{(row.totalCredit || 0).toLocaleString('en-IN')}
        </Typography>
      )
    },
    {
      header: 'Status',
      align: 'center',
      render: (row) => {
        const val = row.status;
        const color = val === 'Posted' ? 'success' : val === 'Reversed' ? 'error' : 'default';
        return <Chip label={val} size="small" color={color} sx={{ fontWeight: 700, fontSize: '0.72rem', borderRadius: '8px' }} />;
      }
    },
    {
      header: 'Actions',
      align: 'center',
      render: (row) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
          <Tooltip title="View Journal Lines">
            <IconButton size="small" onClick={() => setSelectedJournal(row)}>
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {row.status === 'Posted' && (
            <Tooltip title="Reverse Journal Entry">
              <IconButton size="small" color="error" onClick={() => setConfirmReverse(row)}>
                <UndoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )
    }
  ];

  return (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
            General Journal Entries (Double-Entry Engine)
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
            Multi-line balanced accounting vouchers: strict verification of Total Debits = Total Credits
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreateModal(true)}
          sx={{
            bgcolor: '#e5a93c',
            borderRadius: '14px',
            fontWeight: 700,
            boxShadow: '0 4px 14px rgba(91, 91, 214, 0.3)',
            '&:hover': { bgcolor: '#4b4bc0' }
          }}
        >
          New Manual Journal
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
        <TextField
          size="small"
          placeholder="Search by journal #, description, type..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{ width: { xs: '100%', sm: 340 } }}
        />
      </Box>

      <DataTable
        columns={columns}
        rows={filtered}
        loading={loading}
        emptyMessage="No journal entries found."
      />

      <JournalFormModal
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        onSuccess={(msg) => {
          dispatch(showNotification({ message: msg, severity: 'success' }));
          fetchJournals();
        }}
      />

      {/* Journal Lines Inspection Dialog */}
      <Dialog open={Boolean(selectedJournal)} onClose={() => setSelectedJournal(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          Journal Voucher #{selectedJournal?.journalNumber} ({selectedJournal?.status})
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <Box sx={{ mb: 2.5, p: 2, bgcolor: '#f8fafc', borderRadius: '14px', border: '1px solid #f1f5f9' }}>
            <Typography variant="body2"><strong>Description:</strong> {selectedJournal?.description}</Typography>
            <Typography variant="body2"><strong>Posting Date:</strong> {selectedJournal?.postingDate}</Typography>
            <Typography variant="body2"><strong>Module Source:</strong> {selectedJournal?.sourceModule}</Typography>
            <Typography variant="body2"><strong>Created By:</strong> {selectedJournal?.createdBy}</Typography>
          </Box>

          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
            Double-Entry Ledger Lines:
          </Typography>
          <Table size="small" sx={{ border: '1px solid #f1f5f9', borderRadius: '12px' }}>
            <TableHead sx={{ bgcolor: '#151621' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#ffffff' }}>Account Code</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#ffffff' }}>Account Name</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#ffffff' }}>Line Narration</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#ffffff' }}>Debit (₹)</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#ffffff' }}>Credit (₹)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {selectedJournal?.lines?.map((line, idx) => (
                <TableRow key={idx}>
                  <TableCell sx={{ fontWeight: 700, color: '#e5a93c' }}>{line.accountCode}</TableCell>
                  <TableCell>{line.accountName}</TableCell>
                  <TableCell sx={{ color: '#64748b' }}>{line.description || '—'}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: line.debit > 0 ? '#0f172a' : '#94a3b8' }}>
                    {line.debit > 0 ? `₹${line.debit.toLocaleString('en-IN')}` : '—'}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: line.credit > 0 ? '#0f172a' : '#94a3b8' }}>
                    {line.credit > 0 ? `₹${line.credit.toLocaleString('en-IN')}` : '—'}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow sx={{ bgcolor: '#f8fafc', fontWeight: 800 }}>
                <TableCell colSpan={3} sx={{ textAlign: 'right', fontWeight: 800 }}>
                  TOTALS (BALANCED):
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  ₹{selectedJournal?.totalDebit?.toLocaleString('en-IN')}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  ₹{selectedJournal?.totalCredit?.toLocaleString('en-IN')}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setSelectedJournal(null)} color="inherit">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(confirmReverse)}
        title="Reverse General Journal Entry?"
        content={`Reversing journal ${confirmReverse?.journalNumber} will post an opposite entry swapping all Debits and Credits and restore prior account balances. This action is permanently audited.`}
        confirmText="Reverse Entry"
        confirmColor="error"
        onConfirm={handleReverse}
        onCancel={() => setConfirmReverse(null)}
      />
    </Box>
  );
}
