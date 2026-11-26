import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { reportsService } from '../../services/reportsService';
import { accountingService } from '../../services/accountingService';
import { showNotification } from '../../store';
import DataTable from '../../components/Common/DataTable';
import {
  Box,
  Typography,
  Card,
  Grid,
  TextField,
  MenuItem
} from '@mui/material';

import ReportActionsToolbar from '../../components/Common/ReportActionsToolbar';
import { exportToExcel, exportToPdf } from '../../utils/reportExport';

export default function GeneralLedgerView() {
  const dispatch = useDispatch();
  const refreshKey = useSelector((state) => state.finance.refreshKey);
  const company = useSelector((state) => state.finance.company);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountCode, setSelectedAccountCode] = useState('1020');
  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    accountingService.getAccounts().then((res) => {
      const accs = res.data || [];
      setAccounts(accs);
      if (accs.length > 0 && !accs.find((a) => a.code === selectedAccountCode)) {
        setSelectedAccountCode(accs[0].code);
      }
    });
  }, [refreshKey]);

  const fetchLedger = async () => {
    if (!selectedAccountCode) return;
    try {
      setLoading(true);
      const res = await reportsService.getGeneralLedger({ accountCode: selectedAccountCode });
      setLedgerData(res.data);
    } catch (err) {
      dispatch(showNotification({ message: err.message, severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [selectedAccountCode, refreshKey]);

  const currentAccount = accounts.find((a) => a.code === selectedAccountCode);
  const entries = ledgerData?.entries || [];

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = () => {
    const tableRows = entries.map((e) => [
      e.postingDate || '',
      e.journalNumber || '',
      e.referenceNumber || '',
      e.description || '',
      e.debit ? `INR ${e.debit.toLocaleString('en-IN')}` : '—',
      e.credit ? `INR ${e.credit.toLocaleString('en-IN')}` : '—',
      `INR ${(e.runningBalance || 0).toLocaleString('en-IN')}`
    ]);

    tableRows.push([
      'TOTALS',
      '',
      '',
      `Closing Balance: INR ${(ledgerData?.closingBalance || 0).toLocaleString('en-IN')}`,
      `INR ${(ledgerData?.totalDebit || 0).toLocaleString('en-IN')}`,
      `INR ${(ledgerData?.totalCredit || 0).toLocaleString('en-IN')}`,
      `INR ${(ledgerData?.closingBalance || 0).toLocaleString('en-IN')}`
    ]);

    exportToPdf({
      title: `General Ledger: ${selectedAccountCode} - ${currentAccount?.name || ''}`,
      subtitle: `Account Type: ${currentAccount?.type || ''} | Category: ${currentAccount?.category || ''}`,
      company,
      headers: ['Date', 'Journal #', 'Ref #', 'Description', 'Debit', 'Credit', 'Balance'],
      rows: tableRows,
      fileName: `General_Ledger_${selectedAccountCode}`,
      columnStyles: {
        0: { cellWidth: 55 },
        1: { cellWidth: 70 },
        2: { cellWidth: 60 },
        3: { cellWidth: 150 },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right', fontStyle: 'bold' }
      }
    });
  };

  const handleExportExcel = () => {
    const excelRows = [
      [company?.legalName || company?.name || 'Apex Global Enterprises Private Limited'],
      [`General Ledger Statement: ${selectedAccountCode} - ${currentAccount?.name || ''}`],
      ['Opening Balance', ledgerData?.openingBalance || 0],
      ['Total Debits', ledgerData?.totalDebit || 0],
      ['Total Credits', ledgerData?.totalCredit || 0],
      ['Closing Balance', ledgerData?.closingBalance || 0],
      ['Generated On', new Date().toLocaleString('en-IN')],
      [],
      ['Date', 'Journal Number', 'Reference', 'Type', 'Description', 'Debit (INR)', 'Credit (INR)', 'Running Balance (INR)']
    ];

    entries.forEach((e) => {
      excelRows.push([
        e.postingDate,
        e.journalNumber,
        e.referenceNumber || '',
        e.transactionType || '',
        e.description,
        e.debit || 0,
        e.credit || 0,
        e.runningBalance || 0
      ]);
    });

    excelRows.push([]);
    excelRows.push([
      'TOTALS',
      '',
      '',
      '',
      'Net Account Movements',
      ledgerData?.totalDebit || 0,
      ledgerData?.totalCredit || 0,
      ledgerData?.closingBalance || 0
    ]);

    exportToExcel(`General_Ledger_${selectedAccountCode}`, excelRows, 'General Ledger');
  };

  const columns = [
    { header: 'Posting Date', field: 'postingDate', width: 120 },
    {
      header: 'Journal Entry',
      field: 'journalNumber',
      width: 150,
      cellStyle: { fontWeight: 700, color: '#e5a93c' }
    },
    { header: 'Reference', field: 'referenceNumber', width: 140 },
    { header: 'Type', field: 'transactionType', width: 130 },
    { header: 'Narration / Description', field: 'description', minWidth: 220 },
    {
      header: 'Debit (₹)',
      field: 'debit',
      align: 'right',
      width: 130,
      cellStyle: (r) => ({ fontWeight: r.debit > 0 ? 700 : 400 }),
      render: (r) => (r.debit ? `₹${r.debit.toLocaleString('en-IN')}` : '—')
    },
    {
      header: 'Credit (₹)',
      field: 'credit',
      align: 'right',
      width: 130,
      cellStyle: (r) => ({ fontWeight: r.credit > 0 ? 700 : 400 }),
      render: (r) => (r.credit ? `₹${r.credit.toLocaleString('en-IN')}` : '—')
    },
    {
      header: 'Running Balance (₹)',
      field: 'runningBalance',
      align: 'right',
      width: 160,
      cellStyle: { fontWeight: 800, color: '#0f172a' },
      render: (r) => (r.runningBalance !== undefined ? `₹${r.runningBalance.toLocaleString('en-IN')}` : '₹0')
    }
  ];

  return (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto', height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 1.5, mb: 1.5, flexShrink: 0 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', fontSize: { xs: '1.2rem', sm: '1.35rem' } }}>
            General Ledger & Account Statements
          </Typography>
        </Box>

        <ReportActionsToolbar
          onPrint={handlePrint}
          onExportPdf={handleExportPdf}
          onExportExcel={handleExportExcel}
        />
      </Box>

      <Card
        sx={{
          p: { xs: 1.2, sm: 1.5 },
          mb: 1.5,
          flexShrink: 0,
          borderRadius: '6px',
          boxShadow: '0 2px 10px -2px rgba(15, 23, 42, 0.03)',
          border: '1px solid #e2e8f0'
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              size="small"
              label="Select Ledger Account"
              value={selectedAccountCode}
              onChange={(e) => setSelectedAccountCode(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }}
            >
              {accounts.map((a) => (
                <MenuItem key={a.code} value={a.code}>
                  {a.code} – {a.name} ({a.type})
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={8}>
            <Box sx={{ display: 'flex', gap: { xs: 1.5, sm: 3 }, justifyContent: { xs: 'space-between', sm: 'flex-end' }, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.72rem' }}>Opening Balance</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>
                  ₹{ledgerData?.openingBalance?.toLocaleString('en-IN') || '0.00'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.72rem' }}>Total Debits</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#e5a93c', fontSize: '0.92rem' }}>
                  ₹{ledgerData?.totalDebit?.toLocaleString('en-IN') || '0.00'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.72rem' }}>Total Credits</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#e5a93c', fontSize: '0.92rem' }}>
                  ₹{ledgerData?.totalCredit?.toLocaleString('en-IN') || '0.00'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.72rem' }}>Closing Balance</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#10b981', fontSize: '0.92rem' }}>
                  ₹{ledgerData?.closingBalance?.toLocaleString('en-IN') || '0.00'}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Card>

      <Box className="printable-report" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <DataTable
          columns={columns}
          rows={entries}
          loading={loading}
          defaultPageSize={10}
          emptyMessage="No ledger entries recorded for this account."
        />
      </Box>
    </Box>
  );
}
