import React, { useEffect, useState } from 'react';
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
  CircularProgress
} from '@mui/material';

// Icons
import AddIcon from '@mui/icons-material/Add';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import BarChartIcon from '@mui/icons-material/BarChart';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import PeopleOutlineOutlinedIcon from '@mui/icons-material/PeopleOutlineOutlined';
import NearMeOutlinedIcon from '@mui/icons-material/NearMeOutlined';
import PieChartOutlineOutlinedIcon from '@mui/icons-material/PieChartOutlineOutlined';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import HeadphonesIcon from '@mui/icons-material/Headphones';
import WatchIcon from '@mui/icons-material/Watch';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import WbSunnyIcon from '@mui/icons-material/WbSunny';

// Charts
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function DashboardView() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const refreshKey = useSelector((state) => state.finance.refreshKey);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState('revenue');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await apiClient.getDashboard();
        setData(res.data);
      } catch (err) {
        dispatch(showNotification({ message: err.message, severity: 'error' }));
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [refreshKey]);

  if (loading || !data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress sx={{ color: '#e5a93c' }} />
      </Box>
    );
  }

  const { cards } = data;
  const monthlyTrend = data?.visualizations?.monthlyTrend || [];
  const revenueCategories = data?.visualizations?.revenueCategoryBreakdown || [];
  const topProducts = data?.visualizations?.topProducts || [];
  const recentOrders = data?.visualizations?.recentOrders || [];
  const customersByLocation = data?.visualizations?.customersByLocation || [];

  const donutColors = ['#e5a93c', '#b88019', '#1e2029', '#94a3b8', '#059669', '#3b82f6'];
  const categoryDonut = revenueCategories.length > 0
    ? revenueCategories.map((c, idx) => ({
        name: c.category,
        value: c.amount,
        color: donutColors[idx % donutColors.length]
      }))
    : [{ name: 'No Categories Yet', value: 1, color: '#e2e8f0' }];

  // Mini Sparkline Wave Component in Metallic Gold
  const Sparkline = ({ color = '#e5a93c' }) => (
    <svg width="90" height="38" viewBox="0 0 90 38" fill="none" style={{ overflow: 'visible' }}>
      <path
        d="M 2,30 Q 18,34 30,20 T 58,18 T 88,4"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );

  return (
    <Box sx={{ width: '100%', mx: 'auto' }}>
      
      {/* ================= HEADER SECTION ================= */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3.5, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.02em',
              mb: 0.5,
              fontSize: { xs: '1.45rem', sm: '1.8rem', md: '2.1rem' }
            }}
          >
            Sales Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', fontSize: { xs: '0.82rem', sm: '0.9rem' } }}>
            Track your business performance and growth in real time.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon sx={{ color: '#e5a93c' }} />}
          onClick={() => navigate('/invoices')}
          sx={{
            backgroundColor: '#12131c',
            color: '#ffffff',
            borderRadius: '4px',
            px: 2.8,
            py: 1.1,
            fontWeight: 700,
            fontSize: '0.88rem',
            width: { xs: '100%', sm: 'auto' },
            boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
            '&:hover': {
              backgroundColor: '#1e202d',
              boxShadow: '0 6px 18px rgba(0,0,0,0.35)'
            }
          }}
        >
          Create Report
        </Button>
      </Box>

      {/* ================= ROW 1: 4 STAT CARDS ================= */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        
        {/* 1. Total Revenue (Dark Hero Card) */}
        <Grid item xs={12} sm={6} lg={3}>
          <Card
            sx={{
              p: 2.8,
              borderRadius: '6px',
              backgroundColor: '#151621',
              border: '1px solid #232537',
              boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: '4px',
                  bgcolor: 'rgba(229, 169, 60, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <BarChartIcon sx={{ color: '#e5a93c', fontSize: 20 }} />
              </Box>
              <IconButton size="small" sx={{ color: '#64748b' }}>
                <MoreHorizIcon fontSize="small" />
              </IconButton>
            </Box>

            <Box>
              <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 500, mb: 0.5 }}>
                Total Revenue
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#ffffff', mb: 1.5, letterSpacing: '-0.02em', fontSize: { xs: '1.4rem', sm: '1.75rem', md: '2rem' } }}>
                ₹{(cards?.totalRevenue || 0).toLocaleString('en-IN')}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.3 }}>
                From posted sales
              </Typography>
              <Sparkline color="#e5a93c" />
            </Box>
          </Card>
        </Grid>

        {/* 2. Total Orders (White Card) */}
        <Grid item xs={12} sm={6} lg={3}>
          <Card
            sx={{
              p: 2.8,
              borderRadius: '6px',
              backgroundColor: '#ffffff',
              border: '1px solid #f1f5f9',
              boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: '4px',
                  bgcolor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ShoppingCartOutlinedIcon sx={{ color: '#64748b', fontSize: 19 }} />
              </Box>
              <IconButton size="small" sx={{ color: '#94a3b8' }}>
                <MoreHorizIcon fontSize="small" />
              </IconButton>
            </Box>

            <Box>
              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500, mb: 0.5 }}>
                Total Invoices
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5, letterSpacing: '-0.02em', fontSize: { xs: '1.4rem', sm: '1.75rem', md: '2rem' } }}>
                {(data?.ordersCount || 0).toLocaleString('en-IN')}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.3 }}>
                Sales invoices generated
              </Typography>
              <Sparkline color="#e5a93c" />
            </Box>
          </Card>
        </Grid>

        {/* 3. New Customers (White Card) */}
        <Grid item xs={12} sm={6} lg={3}>
          <Card
            sx={{
              p: 2.8,
              borderRadius: '6px',
              backgroundColor: '#ffffff',
              border: '1px solid #f1f5f9',
              boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: '4px',
                  bgcolor: 'rgba(229, 169, 60, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <PeopleOutlineOutlinedIcon sx={{ color: '#b88019', fontSize: 20 }} />
              </Box>
              <IconButton size="small" sx={{ color: '#94a3b8' }}>
                <MoreHorizIcon fontSize="small" />
              </IconButton>
            </Box>

            <Box>
              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500, mb: 0.5 }}>
                Active Customers
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5, letterSpacing: '-0.02em', fontSize: { xs: '1.4rem', sm: '1.75rem', md: '2rem' } }}>
                {(data?.customersCount || 0).toLocaleString('en-IN')}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.3 }}>
                Registered client accounts
              </Typography>
              <Sparkline color="#e5a93c" />
            </Box>
          </Card>
        </Grid>

        {/* 4. Conversion Rate (White Card) */}
        <Grid item xs={12} sm={6} lg={3}>
          <Card
            sx={{
              p: 2.8,
              borderRadius: '6px',
              backgroundColor: '#ffffff',
              border: '1px solid #f1f5f9',
              boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: '4px',
                  bgcolor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <NearMeOutlinedIcon sx={{ color: '#64748b', fontSize: 19 }} />
              </Box>
              <IconButton size="small" sx={{ color: '#94a3b8' }}>
                <MoreHorizIcon fontSize="small" />
              </IconButton>
            </Box>

            <Box>
              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500, mb: 0.5 }}>
                Liquid Reserves
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5, letterSpacing: '-0.02em', fontSize: { xs: '1.4rem', sm: '1.75rem', md: '2rem' } }}>
                ₹{((cards?.bankBalance || 0) + (cards?.cashBalance || 0)).toLocaleString('en-IN')}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.3 }}>
                Bank & cash balance
              </Typography>
              <Sparkline color="#e5a93c" />
            </Box>
          </Card>
        </Grid>

      </Grid>

      {/* ================= ROW 2: CHARTS ================= */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        
        {/* Left: Revenue Overview (Area Chart) */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ p: 3, borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 34, height: 34, borderRadius: '10px', bgcolor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BarChartIcon sx={{ color: '#0f172a', fontSize: 18 }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                    Financial Overview Trend
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    Monthly revenue vs expenditure trend for FY 2026-2027
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {/* Toggle Buttons */}
                <Box sx={{ display: 'flex', bgcolor: '#f8fafc', p: 0.4, borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                  <Button
                    size="small"
                    onClick={() => setViewType('revenue')}
                    sx={{
                      borderRadius: '4px',
                      px: 2,
                      py: 0.4,
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      backgroundColor: viewType === 'revenue' ? '#12131c' : 'transparent',
                      color: viewType === 'revenue' ? '#ffffff' : '#64748b',
                      '&:hover': {
                        backgroundColor: viewType === 'revenue' ? '#12131c' : '#f1f5f9'
                      }
                    }}
                  >
                    Revenue
                  </Button>
                  <Button
                    size="small"
                    onClick={() => setViewType('expenses')}
                    sx={{
                      borderRadius: '4px',
                      px: 2,
                      py: 0.4,
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      backgroundColor: viewType === 'expenses' ? '#12131c' : 'transparent',
                      color: viewType === 'expenses' ? '#ffffff' : '#64748b',
                      '&:hover': {
                        backgroundColor: viewType === 'expenses' ? '#12131c' : '#f1f5f9'
                      }
                    }}
                  >
                    Expenses
                  </Button>
                </Box>
              </Box>
            </Box>

            {/* Glowing Metallic Gold Area Chart */}
            <Box sx={{ height: 280, width: '100%', position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend} margin={{ top: 30, right: 20, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="quantroGoldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#e5a93c" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#e5a93c" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickFormatter={(val) => '₹' + (val >= 1000 ? (val / 1000).toFixed(0) + 'K' : val)}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#12131c',
                      borderRadius: '4px',
                      border: '1px solid #232537',
                      color: '#ffffff',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.25)'
                    }}
                    labelStyle={{ color: '#94a3b8' }}
                    formatter={(val) => ['₹' + Number(val || 0).toLocaleString('en-IN'), viewType === 'revenue' ? 'Revenue' : 'Expenses']}
                  />
                  <Area
                    type="monotone"
                    dataKey={viewType === 'revenue' ? 'income' : 'expenses'}
                    stroke="#e5a93c"
                    strokeWidth={3}
                    fill="url(#quantroGoldGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>

        {/* Right: Sales by Category (Donut Chart) */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ p: 3, borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                <PieChartOutlineOutlinedIcon sx={{ color: '#0f172a', fontSize: 20 }} />
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  Sales by Category
                </Typography>
              </Box>
            </Box>

            {/* Donut and Legend Layout */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', justifyContent: 'center', my: 2, gap: 2.5 }}>
              
              {/* Donut with Center Text */}
              <Box sx={{ position: 'relative', width: 170, height: 170, flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryDonut}
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryDonut.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center'
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.1, fontSize: '1rem' }}>
                    ₹{(cards?.totalRevenue || 0).toLocaleString('en-IN')}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.68rem', fontWeight: 600 }}>
                    Total Sales
                  </Typography>
                </Box>
              </Box>

              {/* Legend List */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, pl: { xs: 0, sm: 2 }, width: { xs: '100%', sm: 'auto' }, flexGrow: 1 }}>
                {revenueCategories.length === 0 ? (
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                    No sales categories recorded yet
                  </Typography>
                ) : (
                  categoryDonut.map((cat, i) => (
                    <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: cat.color }} />
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.78rem' }}>
                          {cat.name}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: '#0f172a', fontWeight: 700, fontSize: '0.78rem' }}>
                        ₹{Number(cat.value || 0).toLocaleString('en-IN')}
                      </Typography>
                    </Box>
                  ))
                )}
              </Box>
            </Box>
          </Card>
        </Grid>

      </Grid>

      {/* ================= ROW 3: BOTTOM 3 WIDGETS ================= */}
      <Grid container spacing={2.5}>
        
        {/* 1. Top Selling Products */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ p: 2.8, borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)', height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                <ShoppingBagOutlinedIcon sx={{ color: '#0f172a', fontSize: 19 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  Top Selling Products
                </Typography>
              </Box>
              <Typography
                variant="caption"
                onClick={() => navigate('/invoices')}
                sx={{ color: '#0f172a', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.3 }}
              >
                View All →
              </Typography>
            </Box>

            <Box sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <Box sx={{ minWidth: 340 }}>
                {topProducts.length === 0 ? (
                  <Box sx={{ py: 5, textAlign: 'center', color: '#94a3b8' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748b', mb: 0.5 }}>
                      No product sales yet
                    </Typography>
                    <Typography variant="caption">
                      Items from posted sales invoices will appear here automatically.
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.72rem', fontWeight: 600, mb: 1.5, px: 0.5 }}>
                      <span>Product</span>
                      <Box sx={{ display: 'flex', gap: 3 }}>
                        <span>Units</span>
                        <span>Revenue</span>
                      </Box>
                    </Box>
                    {topProducts.map((p, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          py: 1.2,
                          borderBottom: idx < topProducts.length - 1 ? '1px solid #f8fafc' : 'none'
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.82rem' }}>
                          {p.name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.8rem', width: 40, textAlign: 'right' }}>
                            {p.orders}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.82rem', width: 80, textAlign: 'right' }}>
                            ₹{Number(p.revenue || 0).toLocaleString('en-IN')}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </>
                )}
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* 2. Recent Orders */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ p: 2.8, borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)', height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                <ReceiptLongOutlinedIcon sx={{ color: '#0f172a', fontSize: 19 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  Recent Orders
                </Typography>
              </Box>
              <Typography
                variant="caption"
                onClick={() => navigate('/invoices')}
                sx={{ color: '#0f172a', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.3 }}
              >
                View All →
              </Typography>
            </Box>

            {/* Orders list */}
            <Box sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <Box sx={{ minWidth: 310 }}>
                {recentOrders.length === 0 ? (
                  <Box sx={{ py: 5, textAlign: 'center', color: '#94a3b8' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748b', mb: 0.5 }}>
                      No sales invoices yet
                    </Typography>
                    <Typography variant="caption">
                      Newly created sales invoices will show up here.
                    </Typography>
                  </Box>
                ) : (
                  recentOrders.map((ord, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        py: 1.1,
                        borderBottom: idx < recentOrders.length - 1 ? '1px solid #f8fafc' : 'none'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(229, 169, 60, 0.15)', color: '#b88019', fontSize: '0.75rem', fontWeight: 700 }}>
                          {(ord.name || 'C').slice(0, 2).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.82rem', lineHeight: 1.1 }}>
                            {ord.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                            #{ord.id}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.82rem' }}>
                          ₹{Number(ord.amount || 0).toLocaleString('en-IN')}
                        </Typography>
                        <Chip
                          size="small"
                          label={ord.status}
                          sx={{
                            bgcolor: ord.status === 'Paid' ? '#dcfce7' : ord.status === 'Posted' ? '#eff6ff' : 'rgba(229, 169, 60, 0.15)',
                            color: ord.status === 'Paid' ? '#10b981' : ord.status === 'Posted' ? '#2563eb' : '#b88019',
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            height: 22,
                            borderRadius: '4px'
                          }}
                        />
                      </Box>
                    </Box>
                  ))
                )}
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* 3. Customers by Location */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ p: 2.8, borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)', height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                <LocationOnOutlinedIcon sx={{ color: '#0f172a', fontSize: 19 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  Customers by Location
                </Typography>
              </Box>
              <Typography
                variant="caption"
                onClick={() => navigate('/customers')}
                sx={{ color: '#0f172a', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.3 }}
              >
                View All →
              </Typography>
            </Box>

            <Box sx={{ py: 1 }}>
              {customersByLocation.length === 0 ? (
                <Box sx={{ py: 5, textAlign: 'center', color: '#94a3b8' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748b', mb: 0.5 }}>
                    No customer locations yet
                  </Typography>
                  <Typography variant="caption">
                    Add customers under Sales &gt; Customers to see regional distributions.
                  </Typography>
                </Box>
              ) : (
                customersByLocation.map((loc, idx) => (
                  <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.2, borderBottom: idx < customersByLocation.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#e5a93c' }} />
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem' }}>
                        {loc.location}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.82rem' }}>
                      {loc.count} {loc.count === 1 ? 'customer' : 'customers'}
                    </Typography>
                  </Box>
                ))
              )}
            </Box>
          </Card>
        </Grid>

      </Grid>

    </Box>
  );
}
