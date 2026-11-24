import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { apiClient } from '../../api/client';
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
  TableHead,
  Divider,
  Chip,
  CircularProgress,
  LinearProgress
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import ReportActionsToolbar from '../../components/Common/ReportActionsToolbar';
import { exportToExcel, exportToPdf } from '../../utils/reportExport';

export default function ProfitLossView() {
  const dispatch = useDispatch();
  const refreshKey = useSelector((state) => state.finance.refreshKey);
  const company = useSelector((state) => state.finance.company);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPnl = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getProfitAndLoss();
      setData(res.data);
    } catch (err) {
      dispatch(showNotification({ message: err.message, severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPnl();
  }, [refreshKey]);

  if (loading && !data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  const revenue = data?.revenue || { items: [], total: 0 };
  const cogs = data?.costOfGoodsSold || { items: [], total: 0 };
  const opex = data?.operatingExpenses || { items: [], total: 0 };

  const revTotal = revenue.total || 0;
  const cogsTotal = cogs.total || 0;
  const opexTotal = opex.total || 0;
  const grossProfit = data?.grossProfit || 0;
  const netProfit = data?.netProfit || 0;

  const grossMarginPct = revTotal > 0 ? ((grossProfit / revTotal) * 100).toFixed(1) : '0.0';
  const netMarginPct = revTotal > 0 ? ((netProfit / revTotal) * 100).toFixed(1) : '0.0';
  const cogsPct = revTotal > 0 ? ((cogsTotal / revTotal) * 100).toFixed(1) : '0.0';
  const opexPct = revTotal > 0 ? ((opexTotal / revTotal) * 100).toFixed(1) : '0.0';

  const companyName = company?.legalName || company?.name || 'Apex Global Enterprises Private Limited';

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = () => {
    const rows = [];

    // Revenue section
    rows.push(['I. REVENUE FROM OPERATIONS', '', '', '']);
    revenue.items.forEach((item) => {
      const pct = revTotal > 0 ? ((item.amount / revTotal) * 100).toFixed(1) + '%' : '0%';
      rows.push([`  ${item.code} – ${item.name}`, item.category || 'Revenue', `INR ${item.amount.toLocaleString('en-IN')}`, pct]);
    });
    rows.push(['TOTAL REVENUE (A)', '', `INR ${revTotal.toLocaleString('en-IN')}`, '100.0%']);

    // COGS section
    rows.push(['', '', '', '']);
    rows.push(['II. COST OF GOODS SOLD (COGS)', '', '', '']);
    cogs.items.forEach((item) => {
      const pct = revTotal > 0 ? ((item.amount / revTotal) * 100).toFixed(1) + '%' : '0%';
      rows.push([`  ${item.code} – ${item.name}`, item.category || 'COGS', `INR ${item.amount.toLocaleString('en-IN')}`, pct]);
    });
    rows.push(['TOTAL COST OF GOODS SOLD (B)', '', `INR ${cogsTotal.toLocaleString('en-IN')}`, `${cogsPct}%`]);

    // Gross Profit
    rows.push(['', '', '', '']);
    rows.push(['GROSS PROFIT (A - B)', '', `INR ${grossProfit.toLocaleString('en-IN')}`, `${grossMarginPct}%`]);

    // Operating expenses
    rows.push(['', '', '', '']);
    rows.push(['III. OPERATING & ADMINISTRATIVE EXPENSES', '', '', '']);
    if (opex.items.length === 0) {
      rows.push(['  (No indirect operating expenses in period)', '', 'INR 0', '0.0%']);
    } else {
      opex.items.forEach((item) => {
        const pct = revTotal > 0 ? ((item.amount / revTotal) * 100).toFixed(1) + '%' : '0%';
        rows.push([`  ${item.code} – ${item.name}`, item.category || 'Expense', `INR ${item.amount.toLocaleString('en-IN')}`, pct]);
      });
    }
    rows.push(['TOTAL OPERATING EXPENSES (C)', '', `INR ${opexTotal.toLocaleString('en-IN')}`, `${opexPct}%`]);

    // Net Profit
    rows.push(['', '', '', '']);
    rows.push([
      netProfit >= 0 ? 'NET PROFIT FOR THE PERIOD' : 'NET LOSS FOR THE PERIOD',
      '',
      `INR ${netProfit.toLocaleString('en-IN')}`,
      `${netMarginPct}%`
    ]);

    exportToPdf({
      title: 'Statement of Profit & Loss',
      subtitle: 'Profit & Loss Statement for Financial Year 2026-2027',
      company,
      headers: ['Account Particulars', 'Category', 'Amount', '% of Revenue'],
      rows,
      fileName: 'Profit_and_Loss_Statement',
      columnStyles: {
        0: { cellWidth: 240 },
        1: { cellWidth: 110 },
        2: { halign: 'right', fontStyle: 'bold' },
        3: { halign: 'right' }
      }
    });
  };

  const handleExportExcel = () => {
    const rows = [
      ['Apex Global Enterprises Private Limited'],
      ['Statement of Profit & Loss - FY 2026-2027'],
      ['Generated On', new Date().toLocaleString('en-IN')],
      [],
      ['Account Code & Name', 'Category', 'Amount (INR)', '% of Revenue'],
      ['I. REVENUE FROM OPERATIONS', '', '', '']
    ];

    revenue.items.forEach((item) => {
      const pct = revTotal > 0 ? ((item.amount / revTotal) * 100).toFixed(1) + '%' : '0%';
      rows.push([`${item.code} - ${item.name}`, item.category || 'Sales Revenue', item.amount, pct]);
    });
    rows.push(['Total Revenue (A)', '', revTotal, '100.0%']);
    rows.push([]);

    rows.push(['II. COST OF GOODS SOLD (COGS)', '', '', '']);
    cogs.items.forEach((item) => {
      const pct = revTotal > 0 ? ((item.amount / revTotal) * 100).toFixed(1) + '%' : '0%';
      rows.push([`${item.code} - ${item.name}`, item.category || 'COGS', item.amount, pct]);
    });
    rows.push(['Total Cost of Goods Sold (B)', '', cogsTotal, `${cogsPct}%`]);
    rows.push([]);

    rows.push(['GROSS PROFIT (A - B)', '', grossProfit, `${grossMarginPct}%`]);
    rows.push([]);

    rows.push(['III. OPERATING EXPENSES', '', '', '']);
    opex.items.forEach((item) => {
      const pct = revTotal > 0 ? ((item.amount / revTotal) * 100).toFixed(1) + '%' : '0%';
      rows.push([`${item.code} - ${item.name}`, item.category || 'Expense', item.amount, pct]);
    });
    rows.push(['Total Operating Expenses (C)', '', opexTotal, `${opexPct}%`]);
    rows.push([]);

    rows.push([
      netProfit >= 0 ? 'NET PROFIT FOR THE PERIOD' : 'NET LOSS FOR THE PERIOD',
      '',
      netProfit,
      `${netMarginPct}%`
    ]);

    exportToExcel('Profit_Loss_Report', rows, 'P&L Statement');
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto', height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Top Header & Export Toolbar */}
      <Box sx={{ flexShrink: 0, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 1.5, mb: 1.5 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', fontSize: { xs: '1.25rem', sm: '1.45rem' } }}>
            Statement of Profit & Loss
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', fontSize: { xs: '0.8rem', sm: '0.85rem' } }}>
            Comprehensive income statement computed dynamically from posted double-entry journal movements
          </Typography>
        </Box>

        <ReportActionsToolbar
          onPrint={handlePrint}
          onExportPdf={handleExportPdf}
          onExportExcel={handleExportExcel}
        />
      </Box>

      {/* KPI Cards Grid */}
      <Grid container spacing={1.5} sx={{ flexShrink: 0, mb: 1.5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 1.8, borderRadius: '6px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Total Revenue
              </Typography>
              <Box sx={{ p: 0.6, borderRadius: '4px', bgcolor: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', display: 'flex' }}>
                <TrendingUpIcon fontSize="small" />
              </Box>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
              ₹{revTotal.toLocaleString('en-IN')}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', mt: 0.2, display: 'block' }}>
              100% Gross Operating Inflow
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 1.8, borderRadius: '6px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Cost of Goods Sold (COGS)
              </Typography>
              <Box sx={{ p: 0.6, borderRadius: '4px', bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#d97706', display: 'flex' }}>
                <TrendingDownIcon fontSize="small" />
              </Box>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
              ₹{cogsTotal.toLocaleString('en-IN')}
            </Typography>
            <Typography variant="caption" sx={{ color: '#d97706', mt: 0.2, display: 'block', fontWeight: 600 }}>
              {cogsPct}% of Sales Revenue
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 1.8, borderRadius: '6px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Gross Profit
              </Typography>
              <Box sx={{ p: 0.6, borderRadius: '4px', bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex' }}>
                <AccountBalanceIcon fontSize="small" />
              </Box>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: grossProfit >= 0 ? '#10b981' : '#ef4444' }}>
              ₹{grossProfit.toLocaleString('en-IN')}
            </Typography>
            <Typography variant="caption" sx={{ color: '#10b981', mt: 0.2, display: 'block', fontWeight: 600 }}>
              Gross Margin: {grossMarginPct}%
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 1.8, borderRadius: '6px', border: '1px solid #e2e8f0', bgcolor: netProfit >= 0 ? '#f0fdf4' : '#fef2f2', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: netProfit >= 0 ? '#166534' : '#991b1b', textTransform: 'uppercase' }}>
                Net Profit
              </Typography>
              <Chip
                size="small"
                icon={<CheckCircleIcon sx={{ fontSize: '13px !important' }} />}
                label={netProfit >= 0 ? 'Profitable' : 'Loss'}
                color={netProfit >= 0 ? 'success' : 'error'}
                sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }}
              />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: netProfit >= 0 ? '#15803d' : '#b91c1c' }}>
              ₹{netProfit.toLocaleString('en-IN')}
            </Typography>
            <Typography variant="caption" sx={{ color: netProfit >= 0 ? '#166534' : '#991b1b', mt: 0.2, display: 'block', fontWeight: 600 }}>
              Net Margin: {netMarginPct}%
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Main Income Statement Table Card (Styled for Screen & Print) */}
      <Card className="printable-report" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', p: { xs: 1.5, sm: 2.5 }, border: '1px solid #e2e8f0', borderRadius: '6px', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
        {/* Company Header */}
        <Box sx={{ flexShrink: 0, textAlign: 'center', mb: 1.5, pb: 1, borderBottom: '1px solid #e2e8f0' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
            {companyName}
          </Typography>
          <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, display: 'block', mt: 0.2 }}>
            Profit and Loss Statement for Financial Year 2026-2027
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, mt: 0.8, flexWrap: 'wrap' }}>
            <Chip size="small" label={`GSTIN: ${company?.gstin || '27AABCA1234F1Z5'}`} variant="outlined" sx={{ fontSize: '0.72rem', fontWeight: 600, height: 20 }} />
            <Chip size="small" label={`Currency: INR (₹)`} variant="outlined" sx={{ fontSize: '0.72rem', fontWeight: 600, height: 20 }} />
            <Chip size="small" label={`Accounting Basis: Accrual / Double-Entry`} color="primary" sx={{ fontSize: '0.72rem', fontWeight: 600, height: 20 }} />
          </Box>
        </Box>

        {/* Financial Table with Internal Scroll & Sticky Header */}
        <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'auto' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ bgcolor: '#0f172a', color: '#ffffff', fontWeight: 700, py: 1 }}>ACCOUNT PARTICULARS</TableCell>
                <TableCell sx={{ bgcolor: '#0f172a', color: '#ffffff', fontWeight: 700, py: 1 }}>CATEGORY</TableCell>
                <TableCell align="right" sx={{ bgcolor: '#0f172a', color: '#ffffff', fontWeight: 700, py: 1 }}>AMOUNT (₹)</TableCell>
                <TableCell align="right" sx={{ bgcolor: '#0f172a', color: '#ffffff', fontWeight: 700, py: 1 }}>% OF REVENUE</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* SECTION I: REVENUE */}
              <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                <TableCell colSpan={4} sx={{ fontWeight: 800, color: '#0f172a', py: 1.2 }}>
                  I. REVENUE FROM OPERATIONS
                </TableCell>
              </TableRow>
              {revenue.items.map((item) => {
                const pct = revTotal > 0 ? ((item.amount / revTotal) * 100).toFixed(1) : '0.0';
                return (
                  <TableRow key={item.code} hover>
                    <TableCell sx={{ pl: { xs: 2, sm: 4 }, fontWeight: 600, color: '#1e293b' }}>
                      <Box sx={{ display: 'inline-block', px: 0.8, py: 0.2, bgcolor: '#f1f5f9', borderRadius: '4px', mr: 1, fontSize: '0.78rem', color: '#475569' }}>
                        {item.code}
                      </Box>
                      {item.name}
                    </TableCell>
                    <TableCell sx={{ color: '#64748b', fontSize: '0.85rem' }}>{item.category || 'Sales Revenue'}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#0f172a' }}>₹{item.amount?.toLocaleString('en-IN')}</TableCell>
                    <TableCell align="right" sx={{ color: '#64748b', fontSize: '0.85rem' }}>{pct}%</TableCell>
                  </TableRow>
                );
              })}
              <TableRow sx={{ borderTop: '1px solid #cbd5e1', bgcolor: '#fbfcfe' }}>
                <TableCell colSpan={2} sx={{ fontWeight: 800, pl: { xs: 2, sm: 4 }, color: '#2563eb' }}>
                  Total Revenue (A)
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: '#2563eb', fontSize: '1rem' }}>
                  ₹{revTotal.toLocaleString('en-IN')}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#2563eb' }}>100.0%</TableCell>
              </TableRow>

              {/* SECTION II: COGS */}
              <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                <TableCell colSpan={4} sx={{ fontWeight: 800, color: '#0f172a', pt: 2.5, pb: 1.2 }}>
                  II. COST OF GOODS SOLD (COGS)
                </TableCell>
              </TableRow>
              {cogs.items.map((item) => {
                const pct = revTotal > 0 ? ((item.amount / revTotal) * 100).toFixed(1) : '0.0';
                return (
                  <TableRow key={item.code} hover>
                    <TableCell sx={{ pl: { xs: 2, sm: 4 }, fontWeight: 600, color: '#1e293b' }}>
                      <Box sx={{ display: 'inline-block', px: 0.8, py: 0.2, bgcolor: '#fef3c7', borderRadius: '4px', mr: 1, fontSize: '0.78rem', color: '#92400e' }}>
                        {item.code}
                      </Box>
                      {item.name}
                    </TableCell>
                    <TableCell sx={{ color: '#64748b', fontSize: '0.85rem' }}>{item.category || 'COGS'}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#0f172a' }}>₹{item.amount?.toLocaleString('en-IN')}</TableCell>
                    <TableCell align="right" sx={{ color: '#64748b', fontSize: '0.85rem' }}>{pct}%</TableCell>
                  </TableRow>
                );
              })}
              <TableRow sx={{ borderTop: '1px solid #cbd5e1', bgcolor: '#fbfcfe' }}>
                <TableCell colSpan={2} sx={{ fontWeight: 800, pl: { xs: 2, sm: 4 }, color: '#d97706' }}>
                  Total Cost of Goods Sold (B)
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: '#d97706', fontSize: '1rem' }}>
                  ₹{cogsTotal.toLocaleString('en-IN')}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#d97706' }}>{cogsPct}%</TableCell>
              </TableRow>

              {/* GROSS PROFIT HIGHLIGHT */}
              <TableRow sx={{ backgroundColor: '#f1f5f9', borderTop: '2px solid #cbd5e1', borderBottom: '2px solid #cbd5e1' }}>
                <TableCell colSpan={2} sx={{ fontWeight: 800, color: '#0f172a', py: 1.5 }}>
                  GROSS PROFIT (A - B)
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: grossProfit >= 0 ? '#059669' : '#dc2626', fontSize: '1.05rem', py: 1.5 }}>
                  ₹{grossProfit.toLocaleString('en-IN')}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: grossProfit >= 0 ? '#059669' : '#dc2626', py: 1.5 }}>
                  {grossMarginPct}%
                </TableCell>
              </TableRow>

              {/* SECTION III: OPERATING EXPENSES */}
              <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                <TableCell colSpan={4} sx={{ fontWeight: 800, color: '#0f172a', pt: 2.5, pb: 1.2 }}>
                  III. OPERATING & ADMINISTRATIVE EXPENSES
                </TableCell>
              </TableRow>
              {opex.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} sx={{ pl: { xs: 2, sm: 4 }, py: 1.5, color: '#94a3b8', fontStyle: 'italic' }}>
                    No indirect operating expenses recorded in this financial period.
                  </TableCell>
                </TableRow>
              ) : (
                opex.items.map((item) => {
                  const pct = revTotal > 0 ? ((item.amount / revTotal) * 100).toFixed(1) : '0.0';
                  return (
                    <TableRow key={item.code} hover>
                      <TableCell sx={{ pl: { xs: 2, sm: 4 }, fontWeight: 600, color: '#1e293b' }}>
                        <Box sx={{ display: 'inline-block', px: 0.8, py: 0.2, bgcolor: '#f1f5f9', borderRadius: '4px', mr: 1, fontSize: '0.78rem', color: '#475569' }}>
                          {item.code}
                        </Box>
                        {item.name}
                      </TableCell>
                      <TableCell sx={{ color: '#64748b', fontSize: '0.85rem' }}>{item.category || 'Expense'}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#0f172a' }}>₹{item.amount?.toLocaleString('en-IN')}</TableCell>
                      <TableCell align="right" sx={{ color: '#64748b', fontSize: '0.85rem' }}>{pct}%</TableCell>
                    </TableRow>
                  );
                })
              )}
              <TableRow sx={{ borderTop: '1px solid #cbd5e1', bgcolor: '#fbfcfe' }}>
                <TableCell colSpan={2} sx={{ fontWeight: 800, pl: { xs: 2, sm: 4 }, color: '#475569' }}>
                  Total Operating Expenses (C)
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: '#475569', fontSize: '1rem' }}>
                  ₹{opexTotal.toLocaleString('en-IN')}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>{opexPct}%</TableCell>
              </TableRow>

              {/* NET PROFIT FINAL ROW */}
              <TableRow
                sx={{
                  backgroundColor: netProfit >= 0 ? '#ecfdf5' : '#fef2f2',
                  borderTop: '2px solid #0f172a',
                  borderBottom: '3px double #0f172a'
                }}
              >
                <TableCell colSpan={2} sx={{ fontWeight: 800, fontSize: { xs: '0.95rem', sm: '1.1rem' }, color: netProfit >= 0 ? '#065f46' : '#991b1b', py: 2 }}>
                  {netProfit >= 0 ? 'NET PROFIT FOR THE PERIOD' : 'NET LOSS FOR THE PERIOD'}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, fontSize: { xs: '1.1rem', sm: '1.25rem' }, color: netProfit >= 0 ? '#059669' : '#dc2626', py: 2 }}>
                  ₹{netProfit.toLocaleString('en-IN')}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, fontSize: { xs: '1rem', sm: '1.1rem' }, color: netProfit >= 0 ? '#059669' : '#dc2626', py: 2 }}>
                  {netMarginPct}%
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>
      </Card>
    </Box>
  );
}
