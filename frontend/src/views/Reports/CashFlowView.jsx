import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { reportsService } from '../../services/reportsService';
import { showNotification } from '../../store';
import {
  Box,
  Typography,
  Card,
  Table,
  TableBody,
  TableRow,
  TableCell,
  CircularProgress,
  Chip
} from '@mui/material';

import ReportActionsToolbar from '../../components/Common/ReportActionsToolbar';
import { exportToExcel, exportToPdf } from '../../utils/reportExport';

export default function CashFlowView() {
  const dispatch = useDispatch();
  const refreshKey = useSelector((state) => state.finance.refreshKey);
  const company = useSelector((state) => state.finance.company);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCashFlow = async () => {
    try {
      setLoading(true);
      const res = await reportsService.getCashFlow();
      setData(res.data);
    } catch (err) {
      dispatch(showNotification({ message: err.message, severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCashFlow();
  }, [refreshKey]);

  if (loading && !data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  const op = data?.operatingActivities || {};
  const inv = data?.investingActivities || {};
  const fin = data?.financingActivities || {};

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = () => {
    const rows = [
      ['1. CASH FLOWS FROM OPERATING ACTIVITIES', '', ''],
      ['  Cash Inflow from Customer Receipts', 'Inflow', `+INR ${(op.inflow || 0).toLocaleString('en-IN')}`],
      ['  Cash Outflow to Vendors & Operating Expenses', 'Outflow', `-INR ${(op.outflow || 0).toLocaleString('en-IN')}`],
      ['Net Cash from Operating Activities', '', `INR ${(op.net || 0).toLocaleString('en-IN')}`],
      ['', '', ''],
      ['2. CASH FLOWS FROM INVESTING ACTIVITIES', '', ''],
      ['  Acquisition of Fixed Assets & Equipment', 'Outflow', `-INR ${(inv.outflow || 0).toLocaleString('en-IN')}`],
      ['Net Cash from Investing Activities', '', `INR ${(inv.net || 0).toLocaleString('en-IN')}`],
      ['', '', ''],
      ['3. CASH FLOWS FROM FINANCING ACTIVITIES', '', ''],
      ['  Capital Contributions / Loan Inflows', 'Inflow', `+INR ${(fin.inflow || 0).toLocaleString('en-IN')}`],
      ['Net Cash from Financing Activities', '', `INR ${(fin.net || 0).toLocaleString('en-IN')}`],
      ['', '', ''],
      ['NET INCREASE / (DECREASE) IN CASH & EQUIVALENTS', '', `INR ${(data?.netCashFlow || 0).toLocaleString('en-IN')}`],
      ['CLOSING CASH & BANK BALANCES', '', `INR ${(data?.closingCashBalance || 0).toLocaleString('en-IN')}`]
    ];

    exportToPdf({
      title: 'Statement of Cash Flows',
      subtitle: 'Liquid Capital Movements Across Operating, Investing & Financing Portfolios',
      company,
      headers: ['Cash Flow Particulars', 'Activity Type', 'Net Movement'],
      rows,
      fileName: 'Cash_Flow_Statement',
      columnStyles: {
        0: { cellWidth: 280 },
        1: { cellWidth: 100 },
        2: { halign: 'right', fontStyle: 'bold' }
      }
    });
  };

  const handleExportExcel = () => {
    const excelRows = [
      [company?.legalName || company?.name || 'Apex Global Enterprises Private Limited'],
      ['Statement of Cash Flows', 'FY 2026-2027'],
      ['Generated On', new Date().toLocaleString('en-IN')],
      [],
      ['Particulars', 'Classification', 'Amount (INR)'],
      ['1. OPERATING ACTIVITIES', '', ''],
      ['Cash Inflow from Customer Receipts', 'Inflow', op.inflow || 0],
      ['Cash Outflow to Vendors & Expenses', 'Outflow', -(op.outflow || 0)],
      ['Net Cash from Operating Activities', 'Net', op.net || 0],
      [],
      ['2. INVESTING ACTIVITIES', '', ''],
      ['Acquisition of Fixed Assets', 'Outflow', -(inv.outflow || 0)],
      ['Net Cash from Investing Activities', 'Net', inv.net || 0],
      [],
      ['3. FINANCING ACTIVITIES', '', ''],
      ['Capital Contributions / Loans', 'Inflow', fin.inflow || 0],
      ['Net Cash from Financing Activities', 'Net', fin.net || 0],
      [],
      ['NET CHANGE IN CASH & EQUIVALENTS', '', data?.netCashFlow || 0],
      ['CLOSING CASH & BANK BALANCES', '', data?.closingCashBalance || 0]
    ];

    exportToExcel('Cash_Flow_Statement', excelRows, 'Cash Flow');
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto', height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Box sx={{ flexShrink: 0, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 1.5, mb: 1.5 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, fontSize: { xs: '1.25rem', sm: '1.45rem' } }}>
            Statement of Cash Flows
          </Typography>
        </Box>

        <ReportActionsToolbar
          onPrint={handlePrint}
          onExportPdf={handleExportPdf}
          onExportExcel={handleExportExcel}
        />
      </Box>

      <Card className="printable-report" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', p: { xs: 1.5, sm: 2.5 }, border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
        <Box sx={{ flexShrink: 0, textAlign: 'center', mb: 1.5, pb: 1, borderBottom: '1px solid #e2e8f0' }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {company?.legalName || company?.name || 'Quantro Finance'}
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', mt: 0.2 }}>
            Cash Flow Statement for Financial Year 2026-2027
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, mt: 0.8, flexWrap: 'wrap' }}>
            <Chip size="small" label={`Currency: INR (₹)`} variant="outlined" sx={{ fontSize: '0.72rem', fontWeight: 600, height: 20 }} />
            <Chip size="small" label={`Direct Cash Method`} color="primary" sx={{ fontSize: '0.72rem', fontWeight: 600, height: 20 }} />
          </Box>
        </Box>

        <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'auto' }}>
          <Table size="small">
            <TableBody>
              <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                <TableCell colSpan={2} sx={{ fontWeight: 800, color: '#0f172a', py: 1.2 }}>
                  1. CASH FLOWS FROM OPERATING ACTIVITIES
                </TableCell>
              </TableRow>
              <TableRow hover>
                <TableCell sx={{ pl: { xs: 2, sm: 4 } }}>Cash Inflow from Customer Receipts</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: '#059669' }}>
                  +₹{(op.inflow || 0).toLocaleString('en-IN')}
                </TableCell>
              </TableRow>
              <TableRow hover>
                <TableCell sx={{ pl: { xs: 2, sm: 4 } }}>Cash Outflow to Vendors & Operational Expenses</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: '#dc2626' }}>
                  -₹{(op.outflow || 0).toLocaleString('en-IN')}
                </TableCell>
              </TableRow>
              <TableRow sx={{ borderTop: '1px solid #cbd5e1', bgcolor: '#fbfcfe' }}>
                <TableCell sx={{ fontWeight: 700, pl: { xs: 2, sm: 4 } }}>Net Cash from Operating Activities</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: (op.net || 0) >= 0 ? '#059669' : '#dc2626' }}>
                  ₹{(op.net || 0).toLocaleString('en-IN')}
                </TableCell>
              </TableRow>

              <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                <TableCell colSpan={2} sx={{ fontWeight: 800, pt: 2.5, pb: 1.2, color: '#0f172a' }}>
                  2. CASH FLOWS FROM INVESTING ACTIVITIES
                </TableCell>
              </TableRow>
              <TableRow hover>
                <TableCell sx={{ pl: { xs: 2, sm: 4 } }}>Acquisition of Fixed Assets & Equipment</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>-₹{(inv.outflow || 0).toLocaleString('en-IN')}</TableCell>
              </TableRow>
              <TableRow sx={{ borderTop: '1px solid #cbd5e1', bgcolor: '#fbfcfe' }}>
                <TableCell sx={{ fontWeight: 700, pl: { xs: 2, sm: 4 } }}>Net Cash from Investing Activities</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>₹{(inv.net || 0).toLocaleString('en-IN')}</TableCell>
              </TableRow>

              <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                <TableCell colSpan={2} sx={{ fontWeight: 800, pt: 2.5, pb: 1.2, color: '#0f172a' }}>
                  3. CASH FLOWS FROM FINANCING ACTIVITIES
                </TableCell>
              </TableRow>
              <TableRow hover>
                <TableCell sx={{ pl: { xs: 2, sm: 4 } }}>Capital Contributions / Loan Inflows</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>+₹{(fin.inflow || 0).toLocaleString('en-IN')}</TableCell>
              </TableRow>
              <TableRow sx={{ borderTop: '1px solid #cbd5e1', bgcolor: '#fbfcfe' }}>
                <TableCell sx={{ fontWeight: 700, pl: { xs: 2, sm: 4 } }}>Net Cash from Financing Activities</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>₹{(fin.net || 0).toLocaleString('en-IN')}</TableCell>
              </TableRow>

              <TableRow sx={{ backgroundColor: '#eff6ff', borderTop: '2px solid #0f172a' }}>
                <TableCell sx={{ fontWeight: 800, fontSize: { xs: '0.85rem', sm: '1rem' } }}>NET INCREASE / (DECREASE) IN CASH & EQUIVALENTS</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: (data?.netCashFlow || 0) >= 0 ? '#059669' : '#dc2626', fontSize: '1.05rem' }}>
                  ₹{(data?.netCashFlow || 0).toLocaleString('en-IN')}
                </TableCell>
              </TableRow>
              <TableRow sx={{ backgroundColor: '#f8fafc', borderBottom: '2px double #0f172a' }}>
                <TableCell sx={{ fontWeight: 800 }}>CLOSING CASH & BANK BALANCES</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: '#2563eb', fontSize: { xs: '0.95rem', sm: '1.05rem' } }}>
                  ₹{(data?.closingCashBalance || 0).toLocaleString('en-IN')}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>
      </Card>
    </Box>
  );
}
