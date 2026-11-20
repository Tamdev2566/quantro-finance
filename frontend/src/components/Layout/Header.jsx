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
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';

export default function Header({ onDrawerToggle }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth?.user ?? state.finance?.user);

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        py: { xs: 1.5, sm: 2 },
        px: { xs: 0.5, sm: 1 },
        flexWrap: 'wrap',
        gap: { xs: 1.5, sm: 2 }
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          flexGrow: { xs: 1, sm: 0 },
          width: { xs: '100%', sm: 'auto' },
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <IconButton
            onClick={onDrawerToggle}
            size="small"
            sx={{
              display: { xs: 'inline-flex', md: 'none' },
              color: '#ffffff',
              backgroundColor: '#161722',
              border: '1px solid #232537',
              borderRadius: '4px',
              p: 0.8,
              '&:hover': { backgroundColor: '#1e202f', color: '#e5a93c' }
            }}
          >
            <MenuIcon sx={{ fontSize: 20 }} />
          </IconButton>

          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: '4px',
                background: 'linear-gradient(135deg, #f3c64f 0%, #d49b28 50%, #b88019 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M4 6C4 4.89543 4.89543 4 6 4H8C9.10457 4 10 4.89543 10 6V18C10 19.1046 9.10457 20 8 20H6C4.89543 20 4 19.1046 4 18V6Z" fill="#12131c" />
                <path d="M11 9C11 7.89543 11.8954 7 13 7H15C16.1046 7 17 7.89543 17 9V18C17 19.1046 16.1046 20 15 20H13C11.8954 20 11 19.1046 11 18V9Z" fill="#12131c" fillOpacity="0.8" />
                <path d="M18 12C18 10.8954 18.8954 10 20 10H22V18C22 19.1046 21.1046 20 20 20H18V12Z" fill="#12131c" fillOpacity="0.6" />
              </svg>
            </Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#ffffff', fontSize: '1.05rem' }}>
              Quantro
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: { xs: 'flex', sm: 'none' }, alignItems: 'center', gap: 1 }}>
          <IconButton
            size="small"
            onClick={() => {
              dispatch(triggerRefresh());
              dispatch(showNotification({ message: 'Ledger data refreshed', severity: 'info' }));
            }}
            sx={{
              width: 34,
              height: 34,
              backgroundColor: '#161722',
              border: '1px solid #232537',
              borderRadius: '4px',
              color: '#94a3b8'
            }}
          >
            <RefreshIcon sx={{ fontSize: 16 }} />
          </IconButton>
          <Avatar
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces"
            sx={{
              width: 32,
              height: 32,
              backgroundColor: '#e5a93c',
              fontSize: '0.75rem',
              fontWeight: 700
            }}
          >
            {user?.avatar || 'AC'}
          </Avatar>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#161722',
          borderRadius: '4px',
          border: '1px solid #232537',
          px: 2,
          py: 0.8,
          width: { xs: '100%', sm: 300, md: 400 },
          order: { xs: 2, sm: 1 }
        }}
      >
        <SearchIcon sx={{ color: '#64748b', fontSize: 18, mr: 1 }} />
        <input
          placeholder="Search products, orders, customers..."
          style={{
            border: 'none',
            outline: 'none',
            width: '100%',
            fontSize: '0.84rem',
            color: '#f8fafc',
            backgroundColor: 'transparent'
          }}
        />
        <IconButton size="small" sx={{ color: '#64748b', p: 0.3, '&:hover': { color: '#e5a93c' } }}>
          <TuneIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1.5, order: 2 }}>

        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            gap: 1.2,
            backgroundColor: '#161722',
            borderRadius: '4px',
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
            borderRadius: '4px',
            color: '#94a3b8',
            '&:hover': { backgroundColor: '#1e202f', color: '#e5a93c' }
          }}
        >
          <RefreshIcon sx={{ fontSize: 18 }} />
        </IconButton>

        <IconButton
          sx={{
            width: 40,
            height: 40,
            backgroundColor: '#161722',
            border: '1px solid #232537',
            borderRadius: '4px',
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

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.2,
            backgroundColor: '#161722',
            borderRadius: '4px',
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
          <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
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
