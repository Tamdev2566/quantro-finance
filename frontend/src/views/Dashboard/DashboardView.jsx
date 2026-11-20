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

  // Smooth Area Chart Data for Revenue Overview
  const revenueChartData = [
    { date: 'Dec 01', revenue: 6200, orders: 180 },
    { date: 'Dec 05', revenue: 7800, orders: 220 },
    { date: 'Dec 10', revenue: 4900, orders: 150 },
    { date: 'Dec 15', revenue: 8400, orders: 260 },
    { date: 'Dec 20', revenue: 14220, orders: 410 },
    { date: 'Dec 25', revenue: 9800, orders: 290 },
    { date: 'Dec 31', revenue: 13500, orders: 380 }
  ];

  // Donut slices for Sales by Category with Premium Metallic Gold palette
  const categoryDonut = [
    { name: 'Electronics', value: 38, color: '#e5a93c' }, // Premium Metallic Gold
    { name: 'Fashion', value: 24, color: '#b88019' },     // Deep Burnished Gold
    { name: 'Home & Living', value: 18, color: '#1e2029' }, // Dark Slate
    { name: 'Beauty', value: 12, color: '#94a3b8' },      // Silver Grey
    { name: 'Others', value: 8, color: '#e2e8f0' }        // Soft Platinum
  ];

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
            borderRadius: '50px',
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
              borderRadius: '24px',
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
                  borderRadius: '12px',
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
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#ffffff', mb: 1.5, letterSpacing: '-0.02em' }}>
                ${(cards.totalRevenue || 84320).toLocaleString('en-US')}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.3 }}>
                ↑ 12.5% <span style={{ color: '#64748b', fontWeight: 400 }}>from last month</span>
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
              borderRadius: '24px',
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
                  borderRadius: '12px',
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
                Total Orders
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5, letterSpacing: '-0.02em' }}>
                2,568
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.3 }}>
                ↑ 8.4% <span style={{ color: '#94a3b8', fontWeight: 400 }}>from last month</span>
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
              borderRadius: '24px',
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
                  borderRadius: '12px',
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
                New Customers
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5, letterSpacing: '-0.02em' }}>
                1,245
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.3 }}>
                ↑ 16.2% <span style={{ color: '#94a3b8', fontWeight: 400 }}>from last month</span>
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
              borderRadius: '24px',
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
                  borderRadius: '12px',
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
                Conversion Rate
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5, letterSpacing: '-0.02em' }}>
                3.6%
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.3 }}>
                ↑ 0.8% <span style={{ color: '#94a3b8', fontWeight: 400 }}>from last month</span>
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
                    Revenue Overview
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    Total revenue and orders from 01 Dec - 31 Dec 2023
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {/* Toggle Pill Buttons */}
                <Box sx={{ display: 'flex', bgcolor: '#f8fafc', p: 0.4, borderRadius: '50px', border: '1px solid #e2e8f0' }}>
                  <Button
                    size="small"
                    onClick={() => setViewType('revenue')}
                    sx={{
                      borderRadius: '50px',
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
                    onClick={() => setViewType('orders')}
                    sx={{
                      borderRadius: '50px',
                      px: 2,
                      py: 0.4,
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      backgroundColor: viewType === 'orders' ? '#12131c' : 'transparent',
                      color: viewType === 'orders' ? '#ffffff' : '#64748b',
                      '&:hover': {
                        backgroundColor: viewType === 'orders' ? '#12131c' : '#f1f5f9'
                      }
                    }}
                  >
                    Orders
                  </Button>
                </Box>

                {/* Dropdown Pill */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.8,
                    bgcolor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '50px',
                    px: 1.8,
                    py: 0.6,
                    cursor: 'pointer'
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569' }}>
                    This month
                  </Typography>
                  <KeyboardArrowDownIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                </Box>
              </Box>
            </Box>

            {/* Glowing Metallic Gold Area Chart */}
            <Box sx={{ height: 280, width: '100%', position: 'relative' }}>
              
              {/* Tooltip Pill Marker at Dec 20 */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '18%',
                  left: '60%',
                  transform: 'translate(-50%, -100%)',
                  bgcolor: '#12131c',
                  color: '#ffffff',
                  px: 1.8,
                  py: 0.6,
                  borderRadius: '50px',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                  display: { xs: 'none', sm: 'flex' },
                  alignItems: 'center',
                  gap: 0.8,
                  zIndex: 2,
                  border: '1px solid rgba(229, 169, 60, 0.4)'
                }}
              >
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#e5a93c' }} />
                <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.8rem', color: '#ffffff' }}>
                  $14,220
                </Typography>
              </Box>

              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData} margin={{ top: 30, right: 20, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="quantroGoldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#e5a93c" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#e5a93c" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickFormatter={(val) => `$${val / 1000}K`}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#12131c',
                      borderRadius: '12px',
                      border: '1px solid #232537',
                      color: '#ffffff',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.25)'
                    }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Area
                    type="monotone"
                    dataKey={viewType === 'revenue' ? 'revenue' : 'orders'}
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
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.6,
                  bgcolor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '50px',
                  px: 1.5,
                  py: 0.5,
                  cursor: 'pointer'
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569', fontSize: '0.75rem' }}>
                  This month
                </Typography>
                <KeyboardArrowDownIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
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
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.1, fontSize: '1.05rem' }}>
                    $84.3K
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.68rem', fontWeight: 600 }}>
                    Total Sales
                  </Typography>
                </Box>
              </Box>

              {/* Legend List */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, pl: { xs: 0, sm: 2 }, width: { xs: '100%', sm: 'auto' }, flexGrow: 1 }}>
                {categoryDonut.map((cat, i) => (
                  <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: cat.color }} />
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.78rem' }}>
                        {cat.name}
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: '#0f172a', fontWeight: 700, fontSize: '0.78rem' }}>
                      {cat.value}%
                    </Typography>
                  </Box>
                ))}
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.72rem', fontWeight: 600, mb: 1.5, px: 0.5 }}>
                  <span>Product</span>
                  <Box sx={{ display: 'flex', gap: 3 }}>
                    <span>Orders</span>
                    <span>Revenue</span>
                    <span>Growth</span>
                  </Box>
                </Box>

                {/* Product items */}
                {[
                  { name: 'Wireless Headphones', icon: HeadphonesIcon, orders: '1,245', revenue: '$24,900', growth: '↑ 12%' },
                  { name: 'Smart Watch', icon: WatchIcon, orders: '980', revenue: '$19,600', growth: '↑ 8%' },
                  { name: 'Running Shoes', icon: DirectionsRunIcon, orders: '764', revenue: '$15,280', growth: '↑ 5%' },
                  { name: 'Sunglasses', icon: WbSunnyIcon, orders: '620', revenue: '$12,400', growth: '↑ 3%' }
                ].map((p, idx) => {
                  const IconComp = p.icon;
                  return (
                    <Box
                      key={idx}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        py: 1.2,
                        borderBottom: idx < 3 ? '1px solid #f8fafc' : 'none'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                        <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <IconComp sx={{ fontSize: 16, color: '#334155' }} />
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.82rem' }}>
                          {p.name}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.8rem', width: 40, textAlign: 'right' }}>
                          {p.orders}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.82rem', width: 55, textAlign: 'right' }}>
                          {p.revenue}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 700, width: 45, textAlign: 'right' }}>
                          {p.growth}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
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
                {[
                  { id: '12345', name: 'John Doe', amount: '$120.00', status: 'Completed', color: '#10b981', bg: '#dcfce7', avatarBg: '#ede9fe', avatarColor: '#7c3aed', initials: 'JD' },
                  { id: '12344', name: 'Sarah Miller', amount: '$89.00', status: 'Processing', color: '#0284c7', bg: '#e0f2fe', avatarBg: '#fce7f3', avatarColor: '#db2777', initials: 'SM' },
                  { id: '12343', name: 'Robert Lee', amount: '$250.00', status: 'Completed', color: '#10b981', bg: '#dcfce7', avatarBg: '#ffedd5', avatarColor: '#ea580c', initials: 'RL' },
                  { id: '12342', name: 'Emma Parker', amount: '$65.00', status: 'Pending', color: '#b88019', bg: 'rgba(229, 169, 60, 0.15)', avatarBg: 'rgba(229, 169, 60, 0.1)', avatarColor: '#e5a93c', initials: 'EP' }
                ].map((ord, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      py: 1.1,
                      borderBottom: idx < 3 ? '1px solid #f8fafc' : 'none'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: ord.avatarBg, color: ord.avatarColor, fontSize: '0.75rem', fontWeight: 700 }}>
                        {ord.initials}
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
                        {ord.amount}
                      </Typography>
                      <Chip
                        size="small"
                        label={ord.status}
                        sx={{
                          bgcolor: ord.bg,
                          color: ord.color,
                          fontWeight: 700,
                          fontSize: '0.7rem',
                          height: 22,
                          borderRadius: '50px'
                        }}
                      />
                    </Box>
                  </Box>
                ))}
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
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.6,
                  bgcolor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '50px',
                  px: 1.4,
                  py: 0.4,
                  cursor: 'pointer'
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569', fontSize: '0.72rem' }}>
                  This month
                </Typography>
                <KeyboardArrowDownIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
              </Box>
            </Box>

            {/* Stylized Vector World Map Container */}
            <Box
              sx={{
                position: 'relative',
                height: 180,
                bgcolor: '#f8fafc',
                borderRadius: '18px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 1
              }}
            >
              {/* World Map SVG */}
              <svg width="100%" height="100%" viewBox="0 0 400 200" fill="none" style={{ opacity: 0.4 }}>
                <path
                  d="M50,40 Q90,30 110,60 T140,90 T90,140 T50,80 Z"
                  fill="#cbd5e1"
                />
                <path
                  d="M180,30 Q240,20 280,50 T320,110 T250,130 T190,80 Z"
                  fill="#cbd5e1"
                />
                <path
                  d="M290,120 Q340,110 360,140 T320,170 T280,140 Z"
                  fill="#cbd5e1"
                />
                <path
                  d="M80,110 Q120,100 130,130 T110,180 T70,140 Z"
                  fill="#cbd5e1"
                />
              </svg>

              {/* Hotspot Marker Pill over United States */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '32%',
                  left: '42%',
                  bgcolor: '#12131c',
                  color: '#ffffff',
                  px: 1.8,
                  py: 0.8,
                  borderRadius: '12px',
                  boxShadow: '0 8px 18px rgba(0,0,0,0.3)',
                  border: '1px solid rgba(229, 169, 60, 0.4)',
                  zIndex: 2
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#ffffff', lineHeight: 1.1 }}>
                  United States
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.68rem' }}>
                  1,245 customers
                </Typography>
              </Box>

              {/* Glowing Metallic Gold Hotspot Dots */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '38%',
                  left: '28%',
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  bgcolor: 'rgba(229, 169, 60, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#e5a93c' }} />
              </Box>

              <Box
                sx={{
                  position: 'absolute',
                  top: '68%',
                  left: '80%',
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: 'rgba(229, 169, 60, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#e5a93c' }} />
              </Box>
            </Box>
          </Card>
        </Grid>

      </Grid>

    </Box>
  );
}
