import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { apiClient } from '../../api/client';
import { showNotification } from '../../store';
import DataTable from '../../components/Common/DataTable';
import {
  Box,
  Typography,
  Card,
  Chip
} from '@mui/material';
import BalancedIcon from '@mui/icons-material/CheckCircle';

import ReportActionsToolbar from '../../components/Common/ReportActionsToolbar';
import { exportToExcel, exportToPdf } from '../../utils/reportExport';

export default function TrialBalanceView() {
  const dispatch = useDispatch();
  const refreshKey = useSelector((state) => state.finance.refreshKey);
  const company = useSelector((state) => state.finance.company);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTrialBalance = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getTrialBalance();
      setReport(res.data);
    } catch (err) {
      dispatch(showNotification({ message: err.message, severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrialBalance();
  }, [refreshKey]);

  const rows = report?.rows || [];
  const totals = report?.totals || {};

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = () => {
    const tableRows = rows.map((r) => [
      r.accountCode,
      r.accountName,
      r.accountType,
      r.periodDebit ? `INR ${r.periodDebit.toLocaleString('en-IN')}` : '—',
      r.periodCredit ? `INR ${r.periodCredit.toLocaleString('en-IN')}` : '—',
      r.closingDebit ? `INR ${r.closingDebit.toLocaleString('en-IN')}` : '—',
      r.closingCredit ? `INR ${r.closingCredit.toLocaleString('en-IN')}` : '—'
    ]);

    tableRows.push([
      'TOTAL',
      'Balanced Ledger Verification',
      totals.isBalanced ? 'BALANCED' : 'UNBALANCED',
      `INR ${(totals.periodDebit || 0).toLocaleString('en-IN')}`,
      `INR ${(totals.periodCredit || 0).toLocaleString('en-IN')}`,
      `INR ${(totals.closingDebit || 0).toLocaleString('en-IN')}`,
      `INR ${(totals.closingCredit || 0).toLocaleString('en-IN')}`
    ]);

    exportToPdf({
      title: 'Trial Balance Verification Report',
      subtitle: 'Audit of Arithmetic Debit & Credit Integrity across Chart of Accounts',
      company,
      headers: ['Code', 'Account Name', 'Type', 'Period Debit', 'Period Credit', 'Closing Debit', 'Closing Credit'],
      rows: tableRows,
      fileName: 'Trial_Balance',
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 150 },
        2: { cellWidth: 65 },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right', fontStyle: 'bold' },
        6: { halign: 'right', fontStyle: 'bold' }
      }
    });
  };

  const handleExportExcel = () => {
    const excelRows = [
      [company?.legalName || company?.name || 'Apex Global Enterprises Private Limited'],
      ['Trial Balance Report', 'FY 2026-2027'],
      ['Generated On', new Date().toLocaleString('en-IN')],
      [],
      ['Account Code', 'Account Name', 'Type', 'Period Debit (INR)', 'Period Credit (INR)', 'Closing Debit (INR)', 'Closing Credit (INR)']
    ];

    rows.forEach((r) => {
      excelRows.push([
        r.accountCode,
        r.accountName,
        r.accountType,
        r.periodDebit || 0,
        r.periodCredit || 0,
        r.closingDebit || 0,
        r.closingCredit || 0
      ]);
    });

    excelRows.push([]);
    excelRows.push([
      'TOTALS',
      'All Accounts',
      totals.isBalanced ? 'BALANCED' : 'UNBALANCED',
      totals.periodDebit || 0,
      totals.periodCredit || 0,
      totals.closingDebit || 0,
      totals.closingCredit || 0
    ]);

    exportToExcel('Trial_Balance', excelRows, 'Trial Balance');
  };

  const columns = [
    { header: 'Code', field: 'accountCode', width: 100, cellStyle: { fontWeight: 700, color: '#e5a93c' } },
    { header: 'Account Name', field: 'accountName', minWidth: 200, cellStyle: { fontWeight: 600 } },
    { header: 'Type', field: 'accountType', width: 130 },
    {
      header: 'Period Debit (₹)',
      field: 'periodDebit',
      align: 'right',
      width: 150,
      render: (r) => (r.periodDebit ? `₹${r.periodDebit.toLocaleString('en-IN')}` : '—')
    },
    {
      header: 'Period Credit (₹)',
      field: 'periodCredit',
      align: 'right',
      width: 150,
      render: (r) => (r.periodCredit ? `₹${r.periodCredit.toLocaleString('en-IN')}` : '—')
    },
    {
      header: 'Closing Debit (₹)',
      field: 'closingDebit',
      align: 'right',
      width: 150,
      cellStyle: { fontWeight: 700 },
      render: (r) => (r.closingDebit ? `₹${r.closingDebit.toLocaleString('en-IN')}` : '—')
    },
    {
      header: 'Closing Credit (₹)',
      field: 'closingCredit',
      align: 'right',
      width: 150,
      cellStyle: { fontWeight: 700 },
      render: (r) => (r.closingCredit ? `₹${r.closingCredit.toLocaleString('en-IN')}` : '—')
    }
  ];

  return (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            Trial Balance Report
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
            Verification of arithmetic accuracy across all debit and credit account balances
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          {totals.isBalanced && (
            <Chip
              icon={<BalancedIcon sx={{ color: '#10b981 !important' }} />}
              label="Debit & Credit Balanced"
              sx={{
                fontWeight: 600,
                backgroundColor: '#f0fdf4',
                color: '#16a34a',
                borderRadius: '4px',
                fontSize: '0.8rem'
              }}
            />
          )}
          <ReportActionsToolbar
            onPrint={handlePrint}
            onExportPdf={handleExportPdf}
            onExportExcel={handleExportExcel}
          />
        </Box>
      </Box>

      <Card
        sx={{
          p: { xs: 2, sm: 2.5 },
          mb: 3,
          backgroundColor: '#ffffff',
          borderRadius: '6px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.03)'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Period Total Debits</Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#e5a93c' }}>
              ₹{totals.periodDebit?.toLocaleString('en-IN') || '0.00'}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Period Total Credits</Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#e5a93c' }}>
              ₹{totals.periodCredit?.toLocaleString('en-IN') || '0.00'}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Closing Total Debits</Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#10b981' }}>
              ₹{totals.closingDebit?.toLocaleString('en-IN') || '0.00'}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Closing Total Credits</Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#10b981' }}>
              ₹{totals.closingCredit?.toLocaleString('en-IN') || '0.00'}
            </Typography>
          </Box>
        </Box>
      </Card>

      <Box className="printable-report">
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          defaultPageSize={25}
          emptyMessage="No trial balance figures generated yet."
        />
      </Box>
    </Box>
  );
}
