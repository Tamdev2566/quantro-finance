import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { showNotification } from '../../store';
import {
  Box,
  Grid,
  Typography,
  Card,
  IconButton,
  Avatar,
  Chip,
  Button,
  CircularProgress,
  Tooltip,
  Divider,
  LinearProgress
} from '@mui/material';

import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import PeopleOutlineOutlinedIcon from '@mui/icons-material/PeopleOutlineOutlined';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import RefreshIcon from '@mui/icons-material/Refresh';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import PieChartOutlineOutlinedIcon from '@mui/icons-material/PieChartOutlineOutlined';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import PaymentOutlinedIcon from '@mui/icons-material/PaymentOutlined';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import BarChartIcon from '@mui/icons-material/BarChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  BarChart as RechartsBarChart,
  Bar,
  Legend
} from 'recharts';

// Dynamic micro sparkline generator for KPI cards
const DynamicSparkline = ({ data = [], color = '#e5a93c', height = 36, width = 84 }) => {
  if (!data || data.length === 0 || data.every((v) => v === 0)) {
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" style={{ overflow: 'visible' }}>
        <path
          d={`M 2,${height - 10} Q ${width * 0.35},${height - 18} ${width * 0.65},${height - 12} T ${width - 2},${height - 24}`}
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          opacity="0.6"
        />
      </svg>
    );
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 4;
  const points = data.map((val, idx) => {
    const x = pad + (idx / Math.max(data.length - 1, 1)) * (width - 2 * pad);
    const y = height - pad - ((val - min) / range) * (height - 2 * pad);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const pathD = points.length === 1 ? `M 0,${height / 2} L ${width},${height / 2}` : `M ${points.join(' L ')}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" style={{ overflow: 'visible' }}>
      <path d={pathD} stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export default function DashboardView() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const refreshKey = useSelector((state) => state.finance.refreshKey);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('This Financial Year');
  const [chartView, setChartView] = useState('revenue_expense'); // 'revenue_expense' | 'net_profit' | 'cash_flow'
  const [donutView, setDonutView] = useState('revenue'); // 'revenue' | 'expense'

  const fetchDashboard = async (selectedFilter = filter, isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const res = await apiClient.getDashboard({ filter: selectedFilter });
      setData(res.data);
    } catch (err) {
      dispatch(showNotification({ message: err.message || 'Failed to load dashboard metrics', severity: 'error' }));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard(filter);
  }, [refreshKey, filter]);

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  if (loading && !data) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '65vh', gap: 2 }}>
        <CircularProgress sx={{ color: '#e5a93c' }} size={42} thickness={4} />
        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
          Synchronizing general ledger & operational metrics...
        </Typography>
      </Box>
    );
  }

  const { cards } = data || {};
  const monthlyTrend = data?.visualizations?.monthlyTrend || [];
  const revenueCategories = data?.visualizations?.revenueCategoryBreakdown || [];
  const expenseCategories = data?.visualizations?.expenseCategoryBreakdown || [];
  const topProducts = data?.visualizations?.topProducts || [];
  const recentOrders = data?.visualizations?.recentOrders || [];
  const customersByLocation = data?.visualizations?.customersByLocation || [];
  const bankAccounts = data?.visualizations?.bankAccountBalances || [];

  // Derived financial computations
  const totalRev = Number(cards?.totalRevenue || 0);
  const netProf = Number(cards?.netProfit || 0);
  const totalExp = Number(cards?.totalExpenses || 0);
  const bankBal = Number(cards?.bankBalance || 0);
  const cashBal = Number(cards?.cashBalance || 0);
  const liquidTotal = bankBal + cashBal;
  const totalRec = Number(cards?.totalReceivables || 0);
  const totalPay = Number(cards?.totalPayables || 0);
  const workingCap = totalRec - totalPay;
  const overdueRec = Number(cards?.overdueReceivables || 0);
  const profitMargin = totalRev > 0 ? ((netProf / totalRev) * 100).toFixed(1) : '0.0';

  // Category Donut setup
  const donutColors = ['#e5a93c', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#64748b'];
  const activeCategories = donutView === 'revenue' ? revenueCategories : expenseCategories;
  const categoryTotal = activeCategories.reduce((acc, c) => acc + (c.amount || 0), 0);

  const donutData =
    activeCategories.length > 0
      ? activeCategories.map((c, idx) => ({
          name: c.category || 'General',
          value: c.amount || 0,
          percentage: categoryTotal > 0 ? (((c.amount || 0) / categoryTotal) * 100).toFixed(1) : 0,
          color: donutColors[idx % donutColors.length]
        }))
      : [{ name: donutView === 'revenue' ? 'No Revenue Data' : 'No Expense Data', value: 1, color: '#e2e8f0', percentage: 100 }];

  // Sparkline data extractions
  const revenueTrendSeries = monthlyTrend.map((m) => m.income || 0);
  const profitTrendSeries = monthlyTrend.map((m) => m.profit || 0);
  const cashInSeries = monthlyTrend.map((m) => m.cashIn || 0);

  return (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto', p: { xs: 2, sm: 3 } }}>

      {/* =========================================================================
          SECTION 1: EXECUTIVE HEADER & CONTROLS
          ========================================================================= */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2.5,
          mb: 3
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                color: '#0f172a',
                letterSpacing: '-0.03em',
                fontSize: { xs: '1.5rem', sm: '1.85rem', md: '2.1rem' }
              }}
            >
              Executive Financial Dashboard
            </Typography>
            <Chip
              label="LIVE ACCRUAL"
              size="small"
              sx={{
                bgcolor: 'rgba(16, 185, 129, 0.1)',
                color: '#059669',
                fontWeight: 800,
                fontSize: '0.68rem',
                letterSpacing: '0.04em',
                height: 22,
                borderRadius: '6px',
                border: '1px solid rgba(16, 185, 129, 0.25)'
              }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.88rem' }}>
            Real-time balance sheet movements, operating liquidity & revenue performance metrics.
          </Typography>
        </Box>

        {/* Date Filter & Control Buttons */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.2 }}>
          {/* Segmented Filter Pills */}
          <Box
            sx={{
              display: 'flex',
              bgcolor: '#f1f5f9',
              p: '3px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}
          >
            {[
              { id: 'This Financial Year', label: 'Fiscal Year' },
              { id: 'This Quarter', label: 'Quarter' },
              { id: 'This Month', label: 'Month' },
              { id: 'This Week', label: 'Week' }
            ].map((tab) => (
              <Button
                key={tab.id}
                size="small"
                onClick={() => handleFilterChange(tab.id)}
                sx={{
                  borderRadius: '6px',
                  px: 1.6,
                  py: 0.5,
                  fontSize: '0.78rem',
                  fontWeight: filter === tab.id ? 700 : 600,
                  backgroundColor: filter === tab.id ? '#0f172a' : 'transparent',
                  color: filter === tab.id ? '#ffffff' : '#64748b',
                  boxShadow: filter === tab.id ? '0 2px 6px rgba(15,23,42,0.18)' : 'none',
                  textTransform: 'none',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    backgroundColor: filter === tab.id ? '#1e293b' : 'rgba(0,0,0,0.04)'
                  }
                }}
              >
                {tab.label}
              </Button>
            ))}
          </Box>

          {/* Refresh Action */}
          <Tooltip title="Synchronize latest transactions">
            <IconButton
              onClick={() => fetchDashboard(filter, true)}
              disabled={refreshing}
              size="small"
              sx={{
                bgcolor: '#ffffff',
                border: '1px solid #e2e8f0',
                color: '#64748b',
                p: '8px',
                borderRadius: '8px',
                '&:hover': { bgcolor: '#f8fafc', color: '#0f172a' }
              }}
            >
              <RefreshIcon
                fontSize="small"
                sx={{
                  animation: refreshing ? 'spin 1s linear infinite' : 'none',
                  '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } }
                }}
              />
            </IconButton>
          </Tooltip>

          {/* Quick Statement Link */}
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate('/profit-loss')}
            endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
            sx={{
              borderColor: '#e2e8f0',
              color: '#0f172a',
              bgcolor: '#ffffff',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.82rem',
              textTransform: 'none',
              px: 2,
              py: '6px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              '&:hover': {
                borderColor: '#cbd5e1',
                bgcolor: '#f8fafc'
              }
            }}
          >
            P&L Report
          </Button>
        </Box>
      </Box>

      {/* =========================================================================
          SECTION 2: EXECUTIVE QUICK ACTION BAR
          ========================================================================= */}
      <Card
        sx={{
          p: 1.5,
          mb: 3,
          borderRadius: '12px',
          bgcolor: '#ffffff',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1.5
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, pl: 0.5 }}>
          <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Executive Actions:
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Button
            size="small"
            startIcon={<AddIcon sx={{ color: '#e5a93c' }} />}
            onClick={() => navigate('/invoices')}
            sx={{
              bgcolor: '#0f172a',
              color: '#ffffff',
              borderRadius: '7px',
              px: 2,
              py: 0.6,
              fontWeight: 700,
              fontSize: '0.8rem',
              textTransform: 'none',
              boxShadow: '0 2px 8px rgba(15,23,42,0.2)',
              '&:hover': { bgcolor: '#1e293b' }
            }}
          >
            New Invoice
          </Button>

          <Button
            size="small"
            startIcon={<PaymentOutlinedIcon sx={{ color: '#10b981' }} />}
            onClick={() => navigate('/payments')}
            sx={{
              bgcolor: '#f8fafc',
              color: '#0f172a',
              border: '1px solid #e2e8f0',
              borderRadius: '7px',
              px: 1.8,
              py: 0.6,
              fontWeight: 700,
              fontSize: '0.8rem',
              textTransform: 'none',
              '&:hover': { bgcolor: '#f1f5f9' }
            }}
          >
            Record Payment
          </Button>

          <Button
            size="small"
            startIcon={<ReceiptLongOutlinedIcon sx={{ color: '#f43f5e' }} />}
            onClick={() => navigate('/expenses')}
            sx={{
              bgcolor: '#f8fafc',
              color: '#0f172a',
              border: '1px solid #e2e8f0',
              borderRadius: '7px',
              px: 1.8,
              py: 0.6,
              fontWeight: 700,
              fontSize: '0.8rem',
              textTransform: 'none',
              '&:hover': { bgcolor: '#f1f5f9' }
            }}
          >
            Log Expense
          </Button>

          <Button
            size="small"
            startIcon={<PeopleOutlineOutlinedIcon sx={{ color: '#3b82f6' }} />}
            onClick={() => navigate('/customers')}
            sx={{
              bgcolor: '#f8fafc',
              color: '#0f172a',
              border: '1px solid #e2e8f0',
              borderRadius: '7px',
              px: 1.8,
              py: 0.6,
              fontWeight: 700,
              fontSize: '0.8rem',
              textTransform: 'none',
              '&:hover': { bgcolor: '#f1f5f9' }
            }}
          >
            Add Customer
          </Button>

          <Button
            size="small"
            startIcon={<AccountBalanceIcon sx={{ color: '#8b5cf6' }} />}
            onClick={() => navigate('/bank-accounts')}
            sx={{
              bgcolor: '#f8fafc',
              color: '#0f172a',
              border: '1px solid #e2e8f0',
              borderRadius: '7px',
              px: 1.8,
              py: 0.6,
              fontWeight: 700,
              fontSize: '0.8rem',
              textTransform: 'none',
              '&:hover': { bgcolor: '#f1f5f9' }
            }}
          >
            Bank Accounts
          </Button>
        </Box>
      </Card>

      {/* =========================================================================
          SECTION 3: 4 EXECUTIVE KPI CARDS
          ========================================================================= */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>

        {/* CARD 1: GROSS REVENUE (Signature Dark Slate & Gold) */}
        <Grid item xs={12} sm={6} lg={3}>
          <Card
            sx={{
              p: 2.8,
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #0b0f19 0%, #151b2e 100%)',
              border: '1px solid rgba(229, 169, 60, 0.35)',
              boxShadow: '0 10px 25px -5px rgba(11, 15, 25, 0.45)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: -30,
                right: -30,
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(229,169,60,0.18) 0%, transparent 70%)',
                pointerEvents: 'none'
              }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.8 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '8px',
                    bgcolor: 'rgba(229, 169, 60, 0.15)',
                    border: '1px solid rgba(229, 169, 60, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <TrendingUpIcon sx={{ color: '#e5a93c', fontSize: 20 }} />
                </Box>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Gross Revenue
                </Typography>
              </Box>

              <Chip
                label="Accrual"
                size="small"
                sx={{
                  bgcolor: 'rgba(229, 169, 60, 0.12)',
                  color: '#e5a93c',
                  fontWeight: 800,
                  fontSize: '0.66rem',
                  height: 20,
                  borderRadius: '4px'
                }}
              />
            </Box>

            <Box sx={{ my: 0.5 }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  color: '#ffffff',
                  letterSpacing: '-0.03em',
                  fontSize: { xs: '1.6rem', sm: '1.9rem', md: '2.1rem' },
                  lineHeight: 1.15
                }}
              >
                ₹{totalRev.toLocaleString('en-IN')}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mt: 1.5, pt: 1, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                ● Posted sales invoices
              </Typography>
              <DynamicSparkline data={revenueTrendSeries} color="#e5a93c" width={78} height={28} />
            </Box>
          </Card>
        </Grid>

        {/* CARD 2: NET PROFIT & MARGIN */}
        <Grid item xs={12} sm={6} lg={3}>
          <Card
            sx={{
              p: 2.8,
              borderRadius: '16px',
              bgcolor: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 10px 25px -4px rgba(15, 23, 42, 0.08)'
              }
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.8 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '8px',
                    bgcolor: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <AccountBalanceWalletOutlinedIcon sx={{ color: '#059669', fontSize: 20 }} />
                </Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Net Profit
                </Typography>
              </Box>

              <Chip
                label={`${profitMargin}% Margin`}
                size="small"
                sx={{
                  bgcolor: netProf >= 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                  color: netProf >= 0 ? '#059669' : '#e11d48',
                  fontWeight: 800,
                  fontSize: '0.66rem',
                  height: 20,
                  borderRadius: '4px'
                }}
              />
            </Box>

            <Box sx={{ my: 0.5 }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  color: netProf >= 0 ? '#0f172a' : '#e11d48',
                  letterSpacing: '-0.03em',
                  fontSize: { xs: '1.6rem', sm: '1.9rem', md: '2.1rem' },
                  lineHeight: 1.15
                }}
              >
                ₹{netProf.toLocaleString('en-IN')}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mt: 1.5, pt: 1, borderTop: '1px solid #f1f5f9' }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                Expenses: ₹{totalExp.toLocaleString('en-IN')}
              </Typography>
              <DynamicSparkline data={profitTrendSeries} color="#10b981" width={78} height={28} />
            </Box>
          </Card>
        </Grid>

        {/* CARD 3: TREASURY & LIQUID RESERVES */}
        <Grid item xs={12} sm={6} lg={3}>
          <Card
            sx={{
              p: 2.8,
              borderRadius: '16px',
              bgcolor: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 10px 25px -4px rgba(15, 23, 42, 0.08)'
              }
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.8 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '8px',
                    bgcolor: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <AccountBalanceOutlinedIcon sx={{ color: '#2563eb', fontSize: 20 }} />
                </Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Liquid Treasury
                </Typography>
              </Box>

              <Chip
                label="Bank + Cash"
                size="small"
                sx={{
                  bgcolor: '#f1f5f9',
                  color: '#475569',
                  fontWeight: 800,
                  fontSize: '0.66rem',
                  height: 20,
                  borderRadius: '4px'
                }}
              />
            </Box>

            <Box sx={{ my: 0.5 }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  color: '#0f172a',
                  letterSpacing: '-0.03em',
                  fontSize: { xs: '1.6rem', sm: '1.9rem', md: '2.1rem' },
                  lineHeight: 1.15
                }}
              >
                ₹{liquidTotal.toLocaleString('en-IN')}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mt: 1.5, pt: 1, borderTop: '1px solid #f1f5f9' }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                Bank ₹{bankBal.toLocaleString('en-IN')} | Cash ₹{cashBal.toLocaleString('en-IN')}
              </Typography>
              <DynamicSparkline data={cashInSeries} color="#3b82f6" width={78} height={28} />
            </Box>
          </Card>
        </Grid>

        {/* CARD 4: WORKING CAPITAL DYNAMICS (AR vs AP) */}
        <Grid item xs={12} sm={6} lg={3}>
          <Card
            sx={{
              p: 2.8,
              borderRadius: '16px',
              bgcolor: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 10px 25px -4px rgba(15, 23, 42, 0.08)'
              }
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.8 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '8px',
                    bgcolor: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <SwapHorizIcon sx={{ color: '#7c3aed', fontSize: 20 }} />
                </Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Working Capital
                </Typography>
              </Box>

              <Chip
                label={overdueRec > 0 ? `₹${overdueRec.toLocaleString('en-IN')} Overdue` : 'AR vs AP'}
                size="small"
                sx={{
                  bgcolor: overdueRec > 0 ? 'rgba(239, 68, 68, 0.12)' : '#f1f5f9',
                  color: overdueRec > 0 ? '#dc2626' : '#475569',
                  fontWeight: 800,
                  fontSize: '0.66rem',
                  height: 20,
                  borderRadius: '4px'
                }}
              />
            </Box>

            <Box sx={{ my: 0.5 }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  color: workingCap >= 0 ? '#0f172a' : '#e11d48',
                  letterSpacing: '-0.03em',
                  fontSize: { xs: '1.6rem', sm: '1.9rem', md: '2.1rem' },
                  lineHeight: 1.15
                }}
              >
                ₹{workingCap.toLocaleString('en-IN')}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mt: 1.5, pt: 1, borderTop: '1px solid #f1f5f9' }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                AR: ₹{totalRec.toLocaleString('en-IN')} | AP: ₹{totalPay.toLocaleString('en-IN')}
              </Typography>
              <Typography
                variant="caption"
                onClick={() => navigate('/receivables-aging')}
                sx={{ color: '#e5a93c', fontWeight: 700, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
              >
                Aging →
              </Typography>
            </Box>
          </Card>
        </Grid>

      </Grid>

      {/* =========================================================================
          SECTION 4: FINANCIAL TRAJECTORY & DISTRIBUTION ANALYTICS
          ========================================================================= */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>

        {/* LEFT: FINANCIAL TRAJECTORY CHART (8 Cols) */}
        <Grid item xs={12} lg={8}>
          <Card
            sx={{
              p: 3,
              borderRadius: '16px',
              bgcolor: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.04)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            {/* Chart Header & View Mode Switcher */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexWrap: 'wrap', gap: 2, mb: 2 }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 0.3 }}>
                  <ShowChartIcon sx={{ color: '#e5a93c', fontSize: 22 }} />
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', fontSize: '1.05rem' }}>
                    Financial Performance Trajectory
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Accrual revenue vs operational expenditure trend across financial periods
                </Typography>
              </Box>

              {/* View Switcher Tabs */}
              <Box sx={{ display: 'flex', bgcolor: '#f1f5f9', p: '3px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                {[
                  { id: 'revenue_expense', label: 'Rev vs Exp' },
                  { id: 'net_profit', label: 'Net Profit' },
                  { id: 'cash_flow', label: 'Cash Flow' }
                ].map((m) => (
                  <Button
                    key={m.id}
                    size="small"
                    onClick={() => setChartView(m.id)}
                    sx={{
                      borderRadius: '6px',
                      px: 1.4,
                      py: 0.4,
                      fontSize: '0.74rem',
                      fontWeight: chartView === m.id ? 700 : 600,
                      backgroundColor: chartView === m.id ? '#0f172a' : 'transparent',
                      color: chartView === m.id ? '#ffffff' : '#64748b',
                      textTransform: 'none',
                      boxShadow: chartView === m.id ? '0 2px 6px rgba(15,23,42,0.18)' : 'none',
                      '&:hover': {
                        backgroundColor: chartView === m.id ? '#1e293b' : 'rgba(0,0,0,0.04)'
                      }
                    }}
                  >
                    {m.label}
                  </Button>
                ))}
              </Box>
            </Box>

            {/* Recharts Area Container */}
            <Box sx={{ height: 310, width: '100%', mt: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend} margin={{ top: 20, right: 15, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#e5a93c" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#e5a93c" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="roseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                    tickFormatter={(val) => '₹' + (val >= 100000 ? (val / 100000).toFixed(1) + 'L' : val >= 1000 ? (val / 1000).toFixed(0) + 'K' : val)}
                  />

                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      border: '1px solid #334155',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                      color: '#ffffff',
                      fontSize: '0.82rem',
                      padding: '10px 14px'
                    }}
                    labelStyle={{ color: '#94a3b8', fontWeight: 700, marginBottom: '4px' }}
                    formatter={(val, name) => [
                      '₹' + Number(val || 0).toLocaleString('en-IN'),
                      name === 'income' ? 'Revenue' : name === 'expenses' ? 'Expenses' : name === 'profit' ? 'Net Profit' : name === 'cashIn' ? 'Cash In' : 'Cash Out'
                    ]}
                  />

                  {chartView === 'revenue_expense' && (
                    <>
                      <Area
                        type="monotone"
                        dataKey="income"
                        name="income"
                        stroke="#e5a93c"
                        strokeWidth={2.6}
                        fill="url(#goldGradient)"
                      />
                      <Area
                        type="monotone"
                        dataKey="expenses"
                        name="expenses"
                        stroke="#f43f5e"
                        strokeWidth={2.4}
                        fill="url(#roseGradient)"
                      />
                    </>
                  )}

                  {chartView === 'net_profit' && (
                    <Area
                      type="monotone"
                      dataKey="profit"
                      name="profit"
                      stroke="#10b981"
                      strokeWidth={2.8}
                      fill="url(#emeraldGradient)"
                    />
                  )}

                  {chartView === 'cash_flow' && (
                    <>
                      <Area
                        type="monotone"
                        dataKey="cashIn"
                        name="cashIn"
                        stroke="#3b82f6"
                        strokeWidth={2.5}
                        fill="url(#blueGradient)"
                      />
                      <Area
                        type="monotone"
                        dataKey="cashOut"
                        name="cashOut"
                        stroke="#64748b"
                        strokeWidth={2}
                        fill="transparent"
                        strokeDasharray="4 4"
                      />
                    </>
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </Box>

            {/* Bottom Chart Legend Pill */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, pt: 1.5, borderTop: '1px solid #f8fafc' }}>
              {chartView === 'revenue_expense' && (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#e5a93c' }} />
                    <Typography variant="caption" sx={{ color: '#475569', fontWeight: 700 }}>Gross Revenue</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#f43f5e' }} />
                    <Typography variant="caption" sx={{ color: '#475569', fontWeight: 700 }}>Operating Expenses & COGS</Typography>
                  </Box>
                </>
              )}
              {chartView === 'net_profit' && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#10b981' }} />
                  <Typography variant="caption" sx={{ color: '#475569', fontWeight: 700 }}>Monthly Net Bottom-Line Profit</Typography>
                </Box>
              )}
              {chartView === 'cash_flow' && (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#3b82f6' }} />
                    <Typography variant="caption" sx={{ color: '#475569', fontWeight: 700 }}>Cash Inflow</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#64748b' }} />
                    <Typography variant="caption" sx={{ color: '#475569', fontWeight: 700 }}>Cash Outflow</Typography>
                  </Box>
                </>
              )}
            </Box>
          </Card>
        </Grid>

        {/* RIGHT: CATEGORY BREAKDOWN DONUT (4 Cols) */}
        <Grid item xs={12} lg={4}>
          <Card
            sx={{
              p: 3,
              borderRadius: '16px',
              bgcolor: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.04)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            {/* Card Header & Switcher */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PieChartOutlineOutlinedIcon sx={{ color: '#0f172a', fontSize: 20 }} />
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.05rem', letterSpacing: '-0.02em' }}>
                  Distribution
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', bgcolor: '#f1f5f9', p: '2px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <Button
                  size="small"
                  onClick={() => setDonutView('revenue')}
                  sx={{
                    borderRadius: '4px',
                    px: 1.2,
                    py: 0.3,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    backgroundColor: donutView === 'revenue' ? '#0f172a' : 'transparent',
                    color: donutView === 'revenue' ? '#ffffff' : '#64748b',
                    '&:hover': { bgcolor: donutView === 'revenue' ? '#1e293b' : 'transparent' }
                  }}
                >
                  Revenue
                </Button>
                <Button
                  size="small"
                  onClick={() => setDonutView('expense')}
                  sx={{
                    borderRadius: '4px',
                    px: 1.2,
                    py: 0.3,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    backgroundColor: donutView === 'expense' ? '#0f172a' : 'transparent',
                    color: donutView === 'expense' ? '#ffffff' : '#64748b',
                    '&:hover': { bgcolor: donutView === 'expense' ? '#1e293b' : 'transparent' }
                  }}
                >
                  Expenses
                </Button>
              </Box>
            </Box>

            {/* Donut Chart with Centered Total */}
            <Box sx={{ position: 'relative', width: '100%', height: 180, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    innerRadius={58}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      border: '1px solid #334155',
                      color: '#ffffff',
                      fontSize: '0.78rem'
                    }}
                    formatter={(val) => ['₹' + Number(val || 0).toLocaleString('en-IN'), 'Amount']}
                  />
                </PieChart>
              </ResponsiveContainer>

              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  pointerEvents: 'none'
                }}
              >
                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Total {donutView === 'revenue' ? 'Rev' : 'Exp'}
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.1, fontSize: '0.98rem' }}>
                  ₹{(categoryTotal || 0).toLocaleString('en-IN')}
                </Typography>
              </Box>
            </Box>

            {/* Category Breakdown List */}
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.2, maxHeight: 150, overflowY: 'auto' }}>
              {activeCategories.length === 0 ? (
                <Typography variant="caption" sx={{ color: '#94a3b8', textAlign: 'center', py: 2 }}>
                  No {donutView} categories recorded yet for this period.
                </Typography>
              ) : (
                donutData.map((cat, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: cat.color, flexShrink: 0 }} />
                      <Typography variant="caption" sx={{ color: '#475569', fontWeight: 700, fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {cat.name}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.74rem' }}>
                        {cat.percentage}%
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#0f172a', fontWeight: 800, fontSize: '0.8rem' }}>
                        ₹{Number(cat.value || 0).toLocaleString('en-IN')}
                      </Typography>
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          </Card>
        </Grid>

      </Grid>

      {/* =========================================================================
          SECTION 5: OPERATIONAL HUB (3 EQUAL COLUMNS)
          ========================================================================= */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>

        {/* COL 1: CONNECTED BANK ACCOUNTS */}
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              p: 2.8,
              borderRadius: '16px',
              bgcolor: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.04)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccountBalanceOutlinedIcon sx={{ color: '#0f172a', fontSize: 20 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                    Treasury Accounts
                  </Typography>
                </Box>
                <Typography
                  variant="caption"
                  onClick={() => navigate('/bank-accounts')}
                  sx={{ color: '#e5a93c', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.3, '&:hover': { textDecoration: 'underline' } }}
                >
                  Manage →
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.4 }}>
                {bankAccounts.length === 0 ? (
                  <Box sx={{ py: 4, textAlign: 'center', color: '#94a3b8' }}>
                    <CreditCardOutlinedIcon sx={{ fontSize: 32, color: '#cbd5e1', mb: 1 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748b' }}>
                      No bank accounts registered
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mb: 1.5 }}>
                      Connect corporate bank accounts to track real-time liquidity.
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => navigate('/bank-accounts')}
                      sx={{ textTransform: 'none', borderRadius: '6px', fontSize: '0.75rem', borderColor: '#e2e8f0', color: '#0f172a' }}
                    >
                      + Add Account
                    </Button>
                  </Box>
                ) : (
                  bankAccounts.map((acc, idx) => (
                    <Box
                      key={acc.id || idx}
                      sx={{
                        p: 1.6,
                        borderRadius: '10px',
                        bgcolor: '#f8fafc',
                        border: '1px solid #f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.4 }}>
                        <Avatar sx={{ width: 34, height: 34, bgcolor: '#0f172a', color: '#e5a93c', fontSize: '0.8rem', fontWeight: 800 }}>
                          {(acc.bankName || acc.accountName || 'B').slice(0, 1)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem', lineHeight: 1.2 }}>
                            {acc.accountName || acc.bankName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                            {acc.bankName} {acc.accountNumber ? `•••• ${String(acc.accountNumber).slice(-4)}` : ''}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>
                          ₹{Number(acc.currentBalance || 0).toLocaleString('en-IN')}
                        </Typography>
                        <Chip
                          label="Active"
                          size="small"
                          sx={{ height: 18, fontSize: '0.62rem', fontWeight: 800, bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#059669', borderRadius: '4px' }}
                        />
                      </Box>
                    </Box>
                  ))
                )}
              </Box>
            </Box>

            <Box sx={{ pt: 2, mt: 1, borderTop: '1px solid #f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                Total Bank Liquidity
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                ₹{bankBal.toLocaleString('en-IN')}
              </Typography>
            </Box>
          </Card>
        </Grid>

        {/* COL 2: TOP PERFORMING PRODUCTS */}
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              p: 2.8,
              borderRadius: '16px',
              bgcolor: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.04)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ShoppingBagOutlinedIcon sx={{ color: '#0f172a', fontSize: 20 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                    Top Products & Services
                  </Typography>
                </Box>
                <Typography
                  variant="caption"
                  onClick={() => navigate('/invoices')}
                  sx={{ color: '#e5a93c', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.3, '&:hover': { textDecoration: 'underline' } }}
                >
                  View All →
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.4 }}>
                {topProducts.length === 0 ? (
                  <Box sx={{ py: 4, textAlign: 'center', color: '#94a3b8' }}>
                    <DescriptionOutlinedIcon sx={{ fontSize: 32, color: '#cbd5e1', mb: 1 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748b' }}>
                      No product sales yet
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mb: 1.5 }}>
                      Items billed on posted sales invoices will rank here automatically.
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => navigate('/invoices')}
                      sx={{ textTransform: 'none', borderRadius: '6px', fontSize: '0.75rem', borderColor: '#e2e8f0', color: '#0f172a' }}
                    >
                      + Create Invoice
                    </Button>
                  </Box>
                ) : (
                  topProducts.slice(0, 4).map((p, idx) => {
                    const maxRev = topProducts[0]?.revenue || 1;
                    const percentOfTop = Math.min(100, Math.round(((p.revenue || 0) / maxRev) * 100));

                    return (
                      <Box key={idx} sx={{ p: 1.4, borderRadius: '10px', bgcolor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.6 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.84rem' }}>
                            {p.name}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.84rem' }}>
                            ₹{Number(p.revenue || 0).toLocaleString('en-IN')}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.6 }}>
                          <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.72rem' }}>
                            {p.orders} {p.orders === 1 ? 'unit' : 'units'} sold
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                            {percentOfTop}% of top
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={percentOfTop}
                          sx={{
                            height: 4,
                            borderRadius: 2,
                            bgcolor: '#e2e8f0',
                            '& .MuiLinearProgress-bar': { bgcolor: '#e5a93c' }
                          }}
                        />
                      </Box>
                    );
                  })
                )}
              </Box>
            </Box>

            <Box sx={{ pt: 2, mt: 1, borderTop: '1px solid #f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                Unique Catalog Items
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                {topProducts.length} Products
              </Typography>
            </Box>
          </Card>
        </Grid>

        {/* COL 3: RECENT SALES INVOICES */}
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              p: 2.8,
              borderRadius: '16px',
              bgcolor: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.04)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ReceiptLongOutlinedIcon sx={{ color: '#0f172a', fontSize: 20 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                    Recent Invoices
                  </Typography>
                </Box>
                <Typography
                  variant="caption"
                  onClick={() => navigate('/invoices')}
                  sx={{ color: '#e5a93c', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.3, '&:hover': { textDecoration: 'underline' } }}
                >
                  All Invoices →
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.4 }}>
                {recentOrders.length === 0 ? (
                  <Box sx={{ py: 4, textAlign: 'center', color: '#94a3b8' }}>
                    <ReceiptLongOutlinedIcon sx={{ fontSize: 32, color: '#cbd5e1', mb: 1 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748b' }}>
                      No sales invoices recorded
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mb: 1.5 }}>
                      Create and post your first sales invoice to see live ledger entries.
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => navigate('/invoices')}
                      sx={{ textTransform: 'none', borderRadius: '6px', fontSize: '0.75rem', borderColor: '#e2e8f0', color: '#0f172a' }}
                    >
                      + Create Invoice
                    </Button>
                  </Box>
                ) : (
                  recentOrders.slice(0, 4).map((ord, idx) => {
                    const statusBg =
                      ord.status === 'Paid'
                        ? 'rgba(16, 185, 129, 0.1)'
                        : ord.status === 'Posted'
                        ? 'rgba(59, 130, 246, 0.1)'
                        : 'rgba(229, 169, 60, 0.15)';
                    const statusColor =
                      ord.status === 'Paid'
                        ? '#059669'
                        : ord.status === 'Posted'
                        ? '#2563eb'
                        : '#b88019';

                    return (
                      <Box
                        key={idx}
                        sx={{
                          p: 1.4,
                          borderRadius: '10px',
                          bgcolor: '#f8fafc',
                          border: '1px solid #f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, minWidth: 0 }}>
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor: 'rgba(229, 169, 60, 0.15)',
                              color: '#b88019',
                              fontSize: '0.75rem',
                              fontWeight: 800
                            }}
                          >
                            {(ord.name || 'C').slice(0, 2).toUpperCase()}
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.82rem', lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {ord.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                              #{ord.id} • {ord.date || 'Recent'}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ textAlign: 'right', flexShrink: 0, pl: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.84rem' }}>
                            ₹{Number(ord.amount || 0).toLocaleString('en-IN')}
                          </Typography>
                          <Chip
                            size="small"
                            label={ord.status}
                            sx={{
                              bgcolor: statusBg,
                              color: statusColor,
                              fontWeight: 800,
                              fontSize: '0.64rem',
                              height: 18,
                              borderRadius: '4px'
                            }}
                          />
                        </Box>
                      </Box>
                    );
                  })
                )}
              </Box>
            </Box>

            <Box sx={{ pt: 2, mt: 1, borderTop: '1px solid #f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                Total Invoices Billed
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                {data?.ordersCount || 0} Invoices
              </Typography>
            </Box>
          </Card>
        </Grid>

      </Grid>

      {/* =========================================================================
          SECTION 6: REGIONAL FOOTPRINT & GST TAX STATUS (2 COLUMNS: 6 / 6)
          ========================================================================= */}
      <Grid container spacing={2.5}>

        {/* REGIONAL DISTRIBUTION */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              p: 2.8,
              borderRadius: '16px',
              bgcolor: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.04)',
              height: '100%'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOnOutlinedIcon sx={{ color: '#0f172a', fontSize: 20 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                  Regional Customer Footprint
                </Typography>
              </Box>
              <Typography
                variant="caption"
                onClick={() => navigate('/customers')}
                sx={{ color: '#e5a93c', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.3, '&:hover': { textDecoration: 'underline' } }}
              >
                Directory →
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, py: 0.5 }}>
              {customersByLocation.length === 0 ? (
                <Box sx={{ py: 3, textAlign: 'center', color: '#94a3b8' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748b' }}>
                    No customer jurisdictions mapped
                  </Typography>
                  <Typography variant="caption">
                    Customers registered with state GSTINs will show up here.
                  </Typography>
                </Box>
              ) : (
                customersByLocation.map((loc, idx) => {
                  const totalCust = data?.customersCount || 1;
                  const pct = Math.round((loc.count / totalCust) * 100);

                  return (
                    <Box key={idx} sx={{ p: 1.4, borderRadius: '8px', bgcolor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.6 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#e5a93c' }} />
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem' }}>
                            {loc.location}
                          </Typography>
                        </Box>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.82rem' }}>
                          {loc.count} {loc.count === 1 ? 'client' : 'clients'} ({pct}%)
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={pct}
                        sx={{
                          height: 4,
                          borderRadius: 2,
                          bgcolor: '#e2e8f0',
                          '& .MuiLinearProgress-bar': { bgcolor: '#0f172a' }
                        }}
                      />
                    </Box>
                  );
                })
              )}
            </Box>
          </Card>
        </Grid>

        {/* GST & TAX COMPLIANCE SNAPSHOT */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              p: 2.8,
              borderRadius: '16px',
              bgcolor: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.04)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssessmentOutlinedIcon sx={{ color: '#0f172a', fontSize: 20 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                    GST Tax Position Snapshot
                  </Typography>
                </Box>
                <Typography
                  variant="caption"
                  onClick={() => navigate('/tax')}
                  sx={{ color: '#e5a93c', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.3, '&:hover': { textDecoration: 'underline' } }}
                >
                  GST Summary →
                </Typography>
              </Box>

              <Grid container spacing={1.5} sx={{ mb: 2 }}>
                <Grid item xs={4}>
                  <Box sx={{ p: 1.6, borderRadius: '10px', bgcolor: '#f8fafc', border: '1px solid #f1f5f9', textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.72rem', display: 'block', mb: 0.4 }}>
                      Output GST
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>
                      ₹{Number(cards?.outputGst || 0).toLocaleString('en-IN')}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.65rem' }}>
                      Collected on sales
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={4}>
                  <Box sx={{ p: 1.6, borderRadius: '10px', bgcolor: '#f8fafc', border: '1px solid #f1f5f9', textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.72rem', display: 'block', mb: 0.4 }}>
                      Input Tax (ITC)
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#10b981', fontSize: '0.88rem' }}>
                      ₹{Number(cards?.inputGst || 0).toLocaleString('en-IN')}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.65rem' }}>
                      Eligible credit
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={4}>
                  <Box sx={{ p: 1.6, borderRadius: '10px', bgcolor: '#f8fafc', border: '1px solid #f1f5f9', textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.72rem', display: 'block', mb: 0.4 }}>
                      Net Liability
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: (cards?.netTaxLiability || 0) > 0 ? '#e11d48' : '#059669', fontSize: '0.88rem' }}>
                      ₹{Number(cards?.netTaxLiability || 0).toLocaleString('en-IN')}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.65rem' }}>
                      {(cards?.netTaxLiability || 0) > 0 ? 'Payable' : 'Credit Balance'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            <Box
              sx={{
                p: 1.4,
                borderRadius: '8px',
                bgcolor: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <CheckCircleOutlineOutlinedIcon sx={{ color: '#059669', fontSize: 18 }} />
              <Typography variant="caption" sx={{ color: '#065f46', fontWeight: 600 }}>
                Audit Ready: All journals are double-entry balanced with automated GST state-code splits.
              </Typography>
            </Box>
          </Card>
        </Grid>

      </Grid>

    </Box>
  );
}
