import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { reportsService } from '../../services/reportsService';
import { showNotification } from '../../store';
import {
  Box,
  Typography,
  Card,
  Grid,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  CircularProgress
} from '@mui/material';
import BalancedIcon from '@mui/icons-material/CheckCircle';

import ReportActionsToolbar from '../../components/Common/ReportActionsToolbar';
import { exportToExcel, exportToPdf } from '../../utils/reportExport';

export default function BalanceSheetView() {
  const dispatch = useDispatch();
  const refreshKey = useSelector((state) => state.finance.refreshKey);
  const company = useSelector((state) => state.finance.company);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchBalanceSheet = async () => {
    try {
      setLoading(true);
      const res = await reportsService.getBalanceSheet();
      setData(res.data);
    } catch (err) {
      dispatch(showNotification({ message: err.message, severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalanceSheet();
  }, [refreshKey]);

  if (loading && !data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  const assets = data?.assets || {};
  const liabilities = data?.liabilities || {};
  const equity = data?.equity || {};

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = () => {
    const rows = [];
    rows.push(['ASSETS', '', '']);
    rows.push(['Current Assets', '', '']);
    [...(assets.cashAndBank || []), ...(assets.receivables || []), ...(assets.otherCurrentAssets || [])].forEach((item) => {
      rows.push([`  ${item.name} (${item.code})`, 'Asset', `INR ${(item.balance || 0).toLocaleString('en-IN')}`]);
    });
    rows.push(['Fixed & Non-Current Assets', '', '']);
    (assets.fixedAssets || []).forEach((item) => {
      rows.push([`  ${item.name} (${item.code})`, 'Fixed Asset', `INR ${(item.balance || 0).toLocaleString('en-IN')}`]);
    });
    rows.push(['TOTAL ASSETS', '', `INR ${(data?.totalAssets || 0).toLocaleString('en-IN')}`]);

    rows.push(['', '', '']);
    rows.push(['LIABILITIES & OWNER EQUITY', '', '']);
    rows.push(['Current Liabilities', '', '']);
    [...(liabilities.payables || []), ...(liabilities.taxLiabilities || []), ...(liabilities.otherLiabilities || [])].forEach((item) => {
      rows.push([`  ${item.name} (${item.code})`, 'Liability', `INR ${(item.balance || 0).toLocaleString('en-IN')}`]);
    });
    rows.push(['Total Liabilities', '', `INR ${(data?.totalLiabilities || 0).toLocaleString('en-IN')}`]);

    rows.push(['Owner Equity', '', '']);
    (equity.items || []).forEach((item) => {
      rows.push([`  ${item.name} (${item.code})`, 'Equity', `INR ${(item.balance || 0).toLocaleString('en-IN')}`]);
    });
    rows.push(['  Current Period Net Profit / Loss', 'Equity', `INR ${(equity.currentPeriodProfit || 0).toLocaleString('en-IN')}`]);
    rows.push(['Total Equity', '', `INR ${(data?.totalEquity || 0).toLocaleString('en-IN')}`]);
    rows.push(['TOTAL LIABILITIES & EQUITY', '', `INR ${(data?.totalLiabilitiesAndEquity || 0).toLocaleString('en-IN')}`]);

    exportToPdf({
      title: 'Balance Sheet (Statement of Financial Position)',
      subtitle: `Audited Financial Status as on ${data?.asOfDate || new Date().toISOString().slice(0, 10)}`,
      company,
      headers: ['Account Particulars', 'Classification', 'Amount'],
      rows,
      fileName: 'Balance_Sheet',
      columnStyles: {
        0: { cellWidth: 280 },
        1: { cellWidth: 120 },
        2: { halign: 'right', fontStyle: 'bold' }
      }
    });
  };

  const handleExportExcel = () => {
    const rows = [
      [company?.legalName || company?.name || 'Apex Global Enterprises Private Limited'],
      ['Balance Sheet Statement', `As on ${data?.asOfDate || new Date().toISOString().slice(0, 10)}`],
      ['Generated On', new Date().toLocaleString('en-IN')],
      [],
      ['Account Name', 'Code', 'Category', 'Balance (INR)'],
      ['ASSETS', '', '', '']
    ];

    [...(assets.cashAndBank || []), ...(assets.receivables || []), ...(assets.otherCurrentAssets || []), ...(assets.fixedAssets || [])].forEach((item) => {
      rows.push([item.name, item.code, item.type || 'Asset', item.balance || 0]);
    });
    rows.push(['TOTAL ASSETS', '', '', data?.totalAssets || 0]);
    rows.push([]);

    rows.push(['LIABILITIES', '', '', '']);
    [...(liabilities.payables || []), ...(liabilities.taxLiabilities || []), ...(liabilities.otherLiabilities || [])].forEach((item) => {
      rows.push([item.name, item.code, 'Liability', item.balance || 0]);
    });
    rows.push(['TOTAL LIABILITIES', '', '', data?.totalLiabilities || 0]);
    rows.push([]);

    rows.push(['OWNER EQUITY', '', '', '']);
    (equity.items || []).forEach((item) => {
      rows.push([item.name, item.code, 'Equity', item.balance || 0]);
    });
    rows.push(['Current Period Net Profit', '', 'Equity', equity.currentPeriodProfit || 0]);
    rows.push(['TOTAL EQUITY', '', '', data?.totalEquity || 0]);
    rows.push([]);
    rows.push(['TOTAL LIABILITIES & EQUITY', '', '', data?.totalLiabilitiesAndEquity || 0]);

    exportToExcel('Balance_Sheet', rows, 'Balance Sheet');
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto', height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Box sx={{ flexShrink: 0, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 1.5, mb: 1.5 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, fontSize: { xs: '1.25rem', sm: '1.45rem' } }}>
            Balance Sheet (Financial Position)
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          {data?.isBalanced && (
            <Chip
              icon={<BalancedIcon />}
              label="Balanced: Assets = Liabilities + Equity"
              color="success"
              sx={{ fontWeight: 600, fontSize: '0.78rem', height: 26 }}
            />
          )}
          <ReportActionsToolbar
            onPrint={handlePrint}
            onExportPdf={handleExportPdf}
            onExportExcel={handleExportExcel}
          />
        </Box>
      </Box>

      <Card className="printable-report" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', p: { xs: 1.5, sm: 2.5 }, border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
        <Box sx={{ flexShrink: 0, textAlign: 'center', mb: 1.5, pb: 1, borderBottom: '1px solid #e2e8f0' }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {company?.legalName || company?.name || 'Quantro Finance'}
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', mt: 0.2 }}>
            Balance Sheet as on {data?.asOfDate || new Date().toISOString().slice(0, 10)}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, mt: 0.8, flexWrap: 'wrap' }}>
            <Chip size="small" label={`GSTIN: ${company?.gstin || '27AABCA1234F1Z5'}`} variant="outlined" sx={{ fontSize: '0.72rem', fontWeight: 600, height: 20 }} />
            <Chip size="small" label={`Currency: INR (₹)`} variant="outlined" sx={{ fontSize: '0.72rem', fontWeight: 600, height: 20 }} />
          </Box>
        </Box>

        <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', pr: 0.5 }}>
          <Grid container spacing={2.5}>
          <Grid item xs={12} md={6}>
            <Box sx={{ border: '1px solid #e2e8f0', borderRadius: '6px', p: { xs: 1.5, sm: 2.5 }, overflowX: 'auto' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#2563eb', mb: 1 }}>
                ASSETS
              </Typography>
              <Table size="small">
                <TableBody>
                  <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                    <TableCell colSpan={2} sx={{ fontWeight: 700 }}>Current Assets</TableCell>
                  </TableRow>
                  {[...(assets.cashAndBank || []), ...(assets.receivables || []), ...(assets.otherCurrentAssets || [])].map((item) => (
                    <TableRow key={item.code} hover>
                      <TableCell sx={{ pl: 3 }}>{item.name} ({item.code})</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>₹{(item.balance || 0).toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                  ))}

                  <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                    <TableCell colSpan={2} sx={{ fontWeight: 700 }}>Fixed & Non-Current Assets</TableCell>
                  </TableRow>
                  {(assets.fixedAssets || []).map((item) => (
                    <TableRow key={item.code} hover>
                      <TableCell sx={{ pl: 3 }}>{item.name} ({item.code})</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>₹{(item.balance || 0).toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                  ))}

                  <TableRow sx={{ borderTop: '2px solid #0f172a', borderBottom: '2px double #0f172a', backgroundColor: '#eff6ff' }}>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.95rem' }}>TOTAL ASSETS</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, fontSize: '1rem', color: '#2563eb' }}>
                      ₹{(data?.totalAssets || 0).toLocaleString('en-IN')}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ border: '1px solid #e2e8f0', borderRadius: '6px', p: { xs: 1.5, sm: 2.5 }, overflowX: 'auto' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#dc2626', mb: 1 }}>
                LIABILITIES & EQUITY
              </Typography>
              <Table size="small">
                <TableBody>
                  <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                    <TableCell colSpan={2} sx={{ fontWeight: 700 }}>Current Liabilities</TableCell>
                  </TableRow>
                  {[...(liabilities.payables || []), ...(liabilities.taxLiabilities || []), ...(liabilities.otherLiabilities || [])].map((item) => (
                    <TableRow key={item.code} hover>
                      <TableCell sx={{ pl: 3 }}>{item.name} ({item.code})</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>₹{(item.balance || 0).toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ borderTop: '1px solid #e2e8f0' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Total Liabilities</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>₹{(data?.totalLiabilities || 0).toLocaleString('en-IN')}</TableCell>
                  </TableRow>

                  <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                    <TableCell colSpan={2} sx={{ fontWeight: 700 }}>Owner Equity</TableCell>
                  </TableRow>
                  {(equity.items || []).map((item) => (
                    <TableRow key={item.code} hover>
                      <TableCell sx={{ pl: 3 }}>{item.name} ({item.code})</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>₹{(item.balance || 0).toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow hover>
                    <TableCell sx={{ pl: 3, fontStyle: 'italic', color: '#059669', fontWeight: 600 }}>
                      Current Period Net Profit / Loss
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: (equity.currentPeriodProfit || 0) >= 0 ? '#059669' : '#dc2626' }}>
                      ₹{(equity.currentPeriodProfit || 0).toLocaleString('en-IN')}
                    </TableCell>
                  </TableRow>
                  <TableRow sx={{ borderTop: '1px solid #e2e8f0' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Total Equity</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>₹{(data?.totalEquity || 0).toLocaleString('en-IN')}</TableCell>
                  </TableRow>

                  <TableRow sx={{ borderTop: '2px solid #0f172a', borderBottom: '2px double #0f172a', backgroundColor: '#eff6ff' }}>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.95rem' }}>TOTAL LIABILITIES & EQUITY</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, fontSize: '1rem', color: '#2563eb' }}>
                      ₹{(data?.totalLiabilitiesAndEquity || 0).toLocaleString('en-IN')}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Card>
  </Box>
);
}
