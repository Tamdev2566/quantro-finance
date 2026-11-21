import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { apiClient } from '../../api/client';
import { showNotification } from '../../store';
import {
  Box,
  Typography,
  Card,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Button,
  CircularProgress
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';

export default function CashFlowView() {
  const dispatch = useDispatch();
  const refreshKey = useSelector((state) => state.finance.refreshKey);
  const company = useSelector((state) => state.finance.company);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCashFlow = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getCashFlow();
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

  return (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            Statement of Cash Flows
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
            Operating, investing, and financing liquid movements derived from actual bank and cash journals
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          Print
        </Button>
      </Box>

      <Card sx={{ p: { xs: 1.5, sm: 3 } }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {company?.legalName || company?.name || 'Quantro Finance'}
          </Typography>
          <Typography variant="subtitle2" sx={{ color: '#64748b' }}>
            Cash Flow Statement for Financial Year 2026-2027
          </Typography>
        </Box>

        <Box sx={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <Table size="small" sx={{ minWidth: 420 }}>
            <TableBody>
              <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                <TableCell colSpan={2} sx={{ fontWeight: 800 }}>
                  1. CASH FLOWS FROM OPERATING ACTIVITIES
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ pl: { xs: 2, sm: 4 } }}>Cash Inflow from Customer Receipts</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: '#059669' }}>
                  +₹{op.inflow?.toLocaleString('en-IN')}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ pl: { xs: 2, sm: 4 } }}>Cash Outflow to Vendors & Operational Expenses</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: '#dc2626' }}>
                  -₹{op.outflow?.toLocaleString('en-IN')}
                </TableCell>
              </TableRow>
              <TableRow sx={{ borderTop: '1px solid #cbd5e1' }}>
                <TableCell sx={{ fontWeight: 700, pl: { xs: 2, sm: 4 } }}>Net Cash from Operating Activities</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>
                  ₹{op.net?.toLocaleString('en-IN')}
                </TableCell>
              </TableRow>

              <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                <TableCell colSpan={2} sx={{ fontWeight: 800, pt: 2 }}>
                  2. CASH FLOWS FROM INVESTING ACTIVITIES
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ pl: { xs: 2, sm: 4 } }}>Acquisition of Fixed Assets & Equipment</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>-₹{inv.outflow?.toLocaleString('en-IN')}</TableCell>
              </TableRow>
              <TableRow sx={{ borderTop: '1px solid #cbd5e1' }}>
                <TableCell sx={{ fontWeight: 700, pl: { xs: 2, sm: 4 } }}>Net Cash from Investing Activities</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>₹{inv.net?.toLocaleString('en-IN')}</TableCell>
              </TableRow>

              <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                <TableCell colSpan={2} sx={{ fontWeight: 800, pt: 2 }}>
                  3. CASH FLOWS FROM FINANCING ACTIVITIES
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ pl: { xs: 2, sm: 4 } }}>Capital Contributions / Loan Inflows</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>+₹{fin.inflow?.toLocaleString('en-IN')}</TableCell>
              </TableRow>
              <TableRow sx={{ borderTop: '1px solid #cbd5e1' }}>
                <TableCell sx={{ fontWeight: 700, pl: { xs: 2, sm: 4 } }}>Net Cash from Financing Activities</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>₹{fin.net?.toLocaleString('en-IN')}</TableCell>
              </TableRow>

              <TableRow sx={{ backgroundColor: '#eff6ff', borderTop: '2px solid #0f172a' }}>
                <TableCell sx={{ fontWeight: 800, fontSize: { xs: '0.85rem', sm: '1rem' } }}>NET INCREASE / (DECREASE) IN CASH & EQUIVALENTS</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: data?.netCashFlow >= 0 ? '#059669' : '#dc2626' }}>
                  ₹{data?.netCashFlow?.toLocaleString('en-IN')}
                </TableCell>
              </TableRow>
              <TableRow sx={{ backgroundColor: '#f8fafc', borderBottom: '2px double #0f172a' }}>
                <TableCell sx={{ fontWeight: 800 }}>CLOSING CASH & BANK BALANCES</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: '#2563eb', fontSize: { xs: '0.95rem', sm: '1.05rem' } }}>
                  ₹{data?.closingCashBalance?.toLocaleString('en-IN')}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>
      </Card>
    </Box>
  );
}
