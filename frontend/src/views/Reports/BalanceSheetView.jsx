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
  Button,
  Chip,
  CircularProgress
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import BalancedIcon from '@mui/icons-material/CheckCircle';

export default function BalanceSheetView() {
  const dispatch = useDispatch();
  const refreshKey = useSelector((state) => state.finance.refreshKey);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchBalanceSheet = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getBalanceSheet();
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

  return (
    <Box sx={{ p: 3, maxWidth: 1100, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Balance Sheet (Financial Position)
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Audited financial status: Total Assets strictly equal Total Liabilities + Equity
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {data?.isBalanced && (
            <Chip
              icon={<BalancedIcon />}
              label="Equation Balanced: Assets = Liabilities + Equity"
              color="success"
              sx={{ fontWeight: 600 }}
            />
          )}
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()}>
            Print
          </Button>
        </Box>
      </Box>

      <Card sx={{ p: 3 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            APEX GLOBAL ENTERPRISES PVT LTD
          </Typography>
          <Typography variant="subtitle2" sx={{ color: '#64748b' }}>
            Balance Sheet as on {data?.asOfDate}
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* --- ASSETS COLUMN --- */}
          <Grid item xs={12} md={6}>
            <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#2563eb', mb: 1 }}>
                ASSETS
              </Typography>
              <Table size="small">
                <TableBody>
                  <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                    <TableCell colSpan={2} sx={{ fontWeight: 700 }}>Current Assets</TableCell>
                  </TableRow>
                  {[...(assets.cashAndBank || []), ...(assets.receivables || []), ...(assets.otherCurrentAssets || [])].map((item) => (
                    <TableRow key={item.code}>
                      <TableCell sx={{ pl: 3 }}>{item.name} ({item.code})</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>₹{item.balance?.toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                  ))}

                  <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                    <TableCell colSpan={2} sx={{ fontWeight: 700 }}>Fixed & Non-Current Assets</TableCell>
                  </TableRow>
                  {(assets.fixedAssets || []).map((item) => (
                    <TableRow key={item.code}>
                      <TableCell sx={{ pl: 3 }}>{item.name} ({item.code})</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>₹{item.balance?.toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                  ))}

                  <TableRow sx={{ borderTop: '2px solid #0f172a', borderBottom: '2px double #0f172a', backgroundColor: '#eff6ff' }}>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.95rem' }}>TOTAL ASSETS</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, fontSize: '1rem', color: '#2563eb' }}>
                      ₹{data?.totalAssets?.toLocaleString('en-IN')}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          </Grid>

          {/* --- LIABILITIES & EQUITY COLUMN --- */}
          <Grid item xs={12} md={6}>
            <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#dc2626', mb: 1 }}>
                LIABILITIES & EQUITY
              </Typography>
              <Table size="small">
                <TableBody>
                  <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                    <TableCell colSpan={2} sx={{ fontWeight: 700 }}>Current Liabilities</TableCell>
                  </TableRow>
                  {[...(liabilities.payables || []), ...(liabilities.taxLiabilities || []), ...(liabilities.otherLiabilities || [])].map((item) => (
                    <TableRow key={item.code}>
                      <TableCell sx={{ pl: 3 }}>{item.name} ({item.code})</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>₹{item.balance?.toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ borderTop: '1px solid #e2e8f0' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Total Liabilities</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>₹{data?.totalLiabilities?.toLocaleString('en-IN')}</TableCell>
                  </TableRow>

                  {/* EQUITY */}
                  <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                    <TableCell colSpan={2} sx={{ fontWeight: 700 }}>Owner Equity</TableCell>
                  </TableRow>
                  {(equity.items || []).map((item) => (
                    <TableRow key={item.code}>
                      <TableCell sx={{ pl: 3 }}>{item.name} ({item.code})</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>₹{item.balance?.toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell sx={{ pl: 3, fontStyle: 'italic', color: '#059669', fontWeight: 600 }}>
                      Current Period Net Profit / Loss
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: equity.currentPeriodProfit >= 0 ? '#059669' : '#dc2626' }}>
                      ₹{equity.currentPeriodProfit?.toLocaleString('en-IN')}
                    </TableCell>
                  </TableRow>
                  <TableRow sx={{ borderTop: '1px solid #e2e8f0' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Total Equity</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>₹{data?.totalEquity?.toLocaleString('en-IN')}</TableCell>
                  </TableRow>

                  <TableRow sx={{ borderTop: '2px solid #0f172a', borderBottom: '2px double #0f172a', backgroundColor: '#eff6ff' }}>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.95rem' }}>TOTAL LIABILITIES & EQUITY</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, fontSize: '1rem', color: '#2563eb' }}>
                      ₹{data?.totalLiabilitiesAndEquity?.toLocaleString('en-IN')}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          </Grid>
        </Grid>
      </Card>
    </Box>
  );
}
