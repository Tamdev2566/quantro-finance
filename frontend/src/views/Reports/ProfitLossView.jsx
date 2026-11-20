import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { apiClient } from '../../api/client';
import { showNotification } from '../../store';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Divider,
  Button,
  CircularProgress
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';

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

  return (
    <Box sx={{ width: '100%', maxWidth: 900, mx: 'auto' }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            Statement of Profit & Loss
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
            Comprehensive income statement computed dynamically from posted double-entry journal movements
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          Print Report
        </Button>
      </Box>

      <Card sx={{ p: { xs: 1.5, sm: 3 }, border: '1px solid #e2e8f0' }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {company?.legalName || company?.name || 'Quantro Finance'}
          </Typography>
          <Typography variant="subtitle2" sx={{ color: '#64748b' }}>
            Profit and Loss Statement for Financial Year 2026-2027
          </Typography>
        </Box>

        <Box sx={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <Table size="small" sx={{ minWidth: 420 }}>
            <TableBody>
              <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                <TableCell colSpan={2} sx={{ fontWeight: 800, color: '#0f172a' }}>
                  I. REVENUE FROM OPERATIONS
                </TableCell>
              </TableRow>
              {revenue.items.map((item) => (
                <TableRow key={item.code}>
                  <TableCell sx={{ pl: { xs: 2, sm: 4 } }}>{item.code} – {item.name}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>₹{item.amount?.toLocaleString('en-IN')}</TableCell>
                </TableRow>
              ))}
              <TableRow sx={{ borderTop: '1px solid #cbd5e1' }}>
                <TableCell sx={{ fontWeight: 700, pl: { xs: 2, sm: 4 } }}>Total Revenue (A)</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#2563eb' }}>
                  ₹{revenue.total?.toLocaleString('en-IN')}
                </TableCell>
              </TableRow>

              <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                <TableCell colSpan={2} sx={{ fontWeight: 800, color: '#0f172a', pt: 2 }}>
                  II. COST OF GOODS SOLD (COGS)
                </TableCell>
              </TableRow>
              {cogs.items.map((item) => (
                <TableRow key={item.code}>
                  <TableCell sx={{ pl: { xs: 2, sm: 4 } }}>{item.code} – {item.name}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>₹{item.amount?.toLocaleString('en-IN')}</TableCell>
                </TableRow>
              ))}
              <TableRow sx={{ borderTop: '1px solid #cbd5e1' }}>
                <TableCell sx={{ fontWeight: 700, pl: { xs: 2, sm: 4 } }}>Total Cost of Goods Sold (B)</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>₹{cogs.total?.toLocaleString('en-IN')}</TableCell>
              </TableRow>

              <TableRow sx={{ backgroundColor: '#f1f5f9' }}>
                <TableCell sx={{ fontWeight: 800 }}>GROSS PROFIT (A - B)</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: data?.grossProfit >= 0 ? '#059669' : '#dc2626' }}>
                  ₹{data?.grossProfit?.toLocaleString('en-IN')}
                </TableCell>
              </TableRow>

              <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                <TableCell colSpan={2} sx={{ fontWeight: 800, color: '#0f172a', pt: 2 }}>
                  III. OPERATING & ADMINISTRATIVE EXPENSES
                </TableCell>
              </TableRow>
              {opex.items.map((item) => (
                <TableRow key={item.code}>
                  <TableCell sx={{ pl: { xs: 2, sm: 4 } }}>{item.code} – {item.name}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>₹{item.amount?.toLocaleString('en-IN')}</TableCell>
                </TableRow>
              ))}
              <TableRow sx={{ borderTop: '1px solid #cbd5e1' }}>
                <TableCell sx={{ fontWeight: 700, pl: { xs: 2, sm: 4 } }}>Total Operating Expenses (C)</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>₹{opex.total?.toLocaleString('en-IN')}</TableCell>
              </TableRow>

              <TableRow sx={{ backgroundColor: data?.netProfit >= 0 ? '#ecfdf5' : '#fef2f2', borderTop: '2px solid #0f172a', borderBottom: '2px double #0f172a' }}>
                <TableCell sx={{ fontWeight: 800, fontSize: { xs: '0.85rem', sm: '1rem' } }}>
                  {data?.netProfit >= 0 ? 'NET PROFIT FOR THE PERIOD' : 'NET LOSS FOR THE PERIOD'}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, fontSize: { xs: '0.95rem', sm: '1.1rem' }, color: data?.netProfit >= 0 ? '#059669' : '#dc2626' }}>
                  ₹{data?.netProfit?.toLocaleString('en-IN')}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>
      </Card>
    </Box>
  );
}
