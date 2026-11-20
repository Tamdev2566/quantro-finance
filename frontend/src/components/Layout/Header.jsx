import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { triggerRefresh, showNotification } from '../../store';
import {
  Box,
  Typography,
  IconButton,
  Avatar,
  Badge,
  Chip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';

export default function Header() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.finance.user);

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        py: 2,
        px: 1,
        flexWrap: 'wrap',
        gap: 2
      }}
    >
      {/* Search Bar matching Quantro design */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#161722',
          borderRadius: '50px',
          border: '1px solid #232537',
          px: 2,
          py: 0.8,
          width: { xs: '100%', sm: 380, md: 440 }
        }}
      >
        <SearchIcon sx={{ color: '#64748b', fontSize: 20, mr: 1.2 }} />
        <input
          placeholder="Search for products, orders, customers..."
          style={{
            border: 'none',
            outline: 'none',
            width: '100%',
            fontSize: '0.86rem',
            color: '#f8fafc',
            backgroundColor: 'transparent'
          }}
        />
        <IconButton size="small" sx={{ color: '#64748b', p: 0.3, '&:hover': { color: '#e5a93c' } }}>
          <TuneIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {/* Right Controls: Date Range, Notification, Profile */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        
        {/* Date Range Selector Pill */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            gap: 1.2,
            backgroundColor: '#161722',
            borderRadius: '50px',
            border: '1px solid #232537',
            px: 2,
            py: 0.8,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            '&:hover': { borderColor: '#e5a93c' }
          }}
        >
          <CalendarTodayOutlinedIcon sx={{ color: '#94a3b8', fontSize: 16 }} />
          <Typography variant="body2" sx={{ color: '#cbd5e1', fontSize: '0.82rem', fontWeight: 500 }}>
            01 Dec 2023 - 31 Dec 2023
          </Typography>
          <KeyboardArrowDownIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
        </Box>

        {/* Refresh Data Button */}
        <IconButton
          onClick={() => {
            dispatch(triggerRefresh());
            dispatch(showNotification({ message: 'Ledger data refreshed', severity: 'info' }));
          }}
          sx={{
            width: 40,
            height: 40,
            backgroundColor: '#161722',
            border: '1px solid #232537',
            borderRadius: '50%',
            color: '#94a3b8',
            '&:hover': { backgroundColor: '#1e202f', color: '#e5a93c' }
          }}
        >
          <RefreshIcon sx={{ fontSize: 18 }} />
        </IconButton>

        {/* Notification Bell with Amber dot */}
        <IconButton
          sx={{
            width: 40,
            height: 40,
            backgroundColor: '#161722',
            border: '1px solid #232537',
            borderRadius: '50%',
            color: '#94a3b8',
            '&:hover': { backgroundColor: '#1e202f', color: '#e5a93c' }
          }}
        >
          <Badge
            variant="dot"
            sx={{
              '& .MuiBadge-badge': {
                backgroundColor: '#e5a93c',
                boxShadow: '0 0 8px #e5a93c'
              }
            }}
          >
            <NotificationsOutlinedIcon sx={{ fontSize: 20 }} />
          </Badge>
        </IconButton>

        {/* User Profile Pill matching Quantro */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.2,
            backgroundColor: '#161722',
            borderRadius: '50px',
            border: '1px solid #232537',
            p: 0.6,
            pr: 2
          }}
        >
          <Avatar
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces"
            sx={{
              width: 32,
              height: 32,
              backgroundColor: '#e5a93c',
              fontSize: '0.8rem',
              fontWeight: 700
            }}
          >
            {user?.avatar || 'AC'}
          </Avatar>
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#ffffff', lineHeight: 1.1, fontSize: '0.82rem' }}>
              {user?.name || 'Alex Carter'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
              {user?.role || 'Admin'}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
