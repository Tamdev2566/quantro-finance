import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { triggerRefresh, showNotification, logout } from '../../store';
import { authService } from '../../services/authService';
import {
  Box,
  Typography,
  IconButton,
  Avatar,
  Badge,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  InputAdornment,
  Alert,
  CircularProgress
} from '@mui/material';

import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';

export default function Header({ onDrawerToggle }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth?.user ?? state.finance?.user);

  // Profile menu anchor state
  const [anchorEl, setAnchorEl] = useState(null);
  const isMenuOpen = Boolean(anchorEl);

  // Modal dialog states
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  // Change password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState(null);

  const handleOpenMenu = (e) => {
    setAnchorEl(e.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleCloseMenu();
    authService.logout().catch(() => {});
    dispatch(logout());
    dispatch(showNotification({ message: 'Signed out successfully', severity: 'info' }));
    navigate('/login');
  };

  const handleChangePasswordSubmit = async (e) => {
    if (e) e.preventDefault();
    setPwError(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwError('Please fill in all password fields.');
      return;
    }

    if (newPassword.length < 4) {
      setPwError('New password must be at least 4 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwError('New password and confirmation do not match.');
      return;
    }

    setPwLoading(true);
    try {
      await authService.changePassword({
        email: user?.email || 'admin@apex.corp',
        currentPassword,
        newPassword
      });

      dispatch(showNotification({
        message: 'Password changed successfully! Use your new password on your next login.',
        severity: 'success'
      }));

      // Reset and close
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordModalOpen(false);
    } catch (err) {
      setPwError(err.message || 'Failed to change password. Please check your current password.');
    } finally {
      setPwLoading(false);
    }
  };

  // Derive display initials and color
  const userInitials =
    user?.avatar ||
    (user?.name
      ? user.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
      : 'AD');
  const userColor = user?.color || '#e5a93c';
  const userRole = user?.role || user?.title || 'Finance Administrator';
  const userName = user?.name || 'Administrator';
  const userEmail = user?.email || 'admin@apex.corp';

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
      {/* Left side: Mobile burger & Logo */}
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

        {/* Mobile quick actions & Profile Avatar */}
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

          {/* Mobile Profile Trigger */}
          <IconButton onClick={handleOpenMenu} sx={{ p: 0 }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                backgroundColor: userColor,
                color: '#ffffff',
                fontSize: '0.75rem',
                fontWeight: 800,
                border: '1px solid #232537'
              }}
            >
              {userInitials}
            </Avatar>
          </IconButton>
        </Box>
      </Box>

      {/* Global Search Bar */}
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

      {/* Right Desktop Nav Area */}
      <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1.5, order: 2 }}>
        {/* Fiscal Date Indicator */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            gap: 1.2,
            background: 'linear-gradient(145deg, #1a1c29 0%, #141520 100%)',
            borderRadius: '6px',
            border: '1px solid #232537',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
            px: 2,
            py: 0.8,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            '&:hover': { borderColor: '#e5a93c' }
          }}
        >
          <CalendarTodayOutlinedIcon sx={{ color: '#94a3b8', fontSize: 16 }} />
          <Typography variant="body2" sx={{ color: '#cbd5e1', fontSize: '0.82rem', fontWeight: 500 }}>
            FY 2026-2027 (Active)
          </Typography>
          <KeyboardArrowDownIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
        </Box>

        {/* Refresh Button */}
        <IconButton
          onClick={() => {
            dispatch(triggerRefresh());
            dispatch(showNotification({ message: 'Ledger data refreshed', severity: 'info' }));
          }}
          sx={{
            width: 40,
            height: 40,
            background: 'linear-gradient(145deg, #1a1c29 0%, #141520 100%)',
            border: '1px solid #232537',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
            borderRadius: '6px',
            color: '#94a3b8',
            '&:hover': { background: '#1e202f', color: '#e5a93c' }
          }}
        >
          <RefreshIcon sx={{ fontSize: 18 }} />
        </IconButton>

        {/* Notification Bell */}
        <IconButton
          sx={{
            width: 40,
            height: 40,
            background: 'linear-gradient(145deg, #1a1c29 0%, #141520 100%)',
            border: '1px solid #232537',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
            borderRadius: '6px',
            color: '#94a3b8',
            '&:hover': { background: '#1e202f', color: '#e5a93c' }
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

        {/* Interactive Profile Area */}
        <Box
          onClick={handleOpenMenu}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.2,
            background: isMenuOpen ? '#1e202f' : 'linear-gradient(145deg, #1a1c29 0%, #141520 100%)',
            borderRadius: '6px',
            border: `1px solid ${isMenuOpen ? '#e5a93c' : '#232537'}`,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
            p: 0.6,
            px: 1.2,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            '&:hover': {
              borderColor: '#e5a93c',
              background: '#1e202f'
            }
          }}
        >
          <Avatar
            sx={{
              width: 32,
              height: 32,
              backgroundColor: userColor,
              color: '#ffffff',
              fontSize: '0.8rem',
              fontWeight: 800,
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
            }}
          >
            {userInitials}
          </Avatar>
          <Box sx={{ display: { xs: 'none', lg: 'block' }, textAlign: 'left', minWidth: 90 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#ffffff', lineHeight: 1.15, fontSize: '0.82rem' }}>
              {userName}
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block' }}>
              {userRole}
            </Typography>
          </Box>
          <KeyboardArrowDownIcon
            sx={{
              color: '#94a3b8',
              fontSize: 16,
              transform: isMenuOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s ease'
            }}
          />
        </Box>
      </Box>

      {/* =========================================================================
          PROFILE DROPDOWN MENU
          ========================================================================= */}
      <Menu
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={handleCloseMenu}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            width: 300,
            mt: 1.2,
            bgcolor: '#141521',
            color: '#ffffff',
            border: '1px solid #282a3d',
            borderRadius: '10px',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.55)',
            p: 0.8,
            '& .MuiListItemText-primary': {
              color: '#ffffff'
            }
          }
        }}
      >
        {/* User Card Header */}
        <Box sx={{ p: 1.6, pb: 1.2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.4, mb: 1.2 }}>
            <Avatar
              sx={{
                width: 42,
                height: 42,
                bgcolor: userColor,
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '1rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}
            >
              {userInitials}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#ffffff', fontSize: '0.92rem', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userName}
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.76rem', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userEmail}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap' }}>
            <Chip
              size="small"
              label={userRole}
              sx={{
                bgcolor: 'rgba(229, 169, 60, 0.15)',
                color: '#e5a93c',
                fontWeight: 700,
                fontSize: '0.68rem',
                height: 20,
                borderRadius: '4px'
              }}
            />
            <Chip
              size="small"
              label="Apex Global"
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.06)',
                color: '#cbd5e1',
                fontWeight: 600,
                fontSize: '0.68rem',
                height: 20,
                borderRadius: '4px'
              }}
            />
          </Box>
        </Box>

        <Divider sx={{ borderColor: '#232537', my: 0.8 }} />

        {/* Menu Action 1: My Profile & Permissions */}
        <MenuItem
          onClick={() => {
            handleCloseMenu();
            setProfileModalOpen(true);
          }}
          sx={{
            py: 1.1,
            px: 1.6,
            borderRadius: '6px',
            color: '#ffffff',
            '&:hover': {
              bgcolor: '#1c1e2e',
              '& .MuiListItemIcon-root': { color: '#e5a93c' },
              '& .MuiListItemText-primary': { color: '#e5a93c' }
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 32, color: '#cbd5e1' }}>
            <PersonOutlineIcon sx={{ fontSize: 19 }} />
          </ListItemIcon>
          <ListItemText
            primary="Profile & Permissions"
            primaryTypographyProps={{ fontSize: '0.86rem', fontWeight: 600, color: '#ffffff' }}
          />
        </MenuItem>

        {/* Menu Action 2: Change Password */}
        <MenuItem
          onClick={() => {
            handleCloseMenu();
            setPwError(null);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setPasswordModalOpen(true);
          }}
          sx={{
            py: 1.1,
            px: 1.6,
            borderRadius: '6px',
            color: '#ffffff',
            '&:hover': {
              bgcolor: '#1c1e2e',
              '& .MuiListItemIcon-root': { color: '#e5a93c' },
              '& .MuiListItemText-primary': { color: '#e5a93c' }
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 32, color: '#cbd5e1' }}>
            <VpnKeyOutlinedIcon sx={{ fontSize: 19 }} />
          </ListItemIcon>
          <ListItemText
            primary="Change Password"
            primaryTypographyProps={{ fontSize: '0.86rem', fontWeight: 600, color: '#ffffff' }}
          />
        </MenuItem>

        {/* Menu Action 3: Company Settings */}
        <MenuItem
          onClick={() => {
            handleCloseMenu();
            navigate('/company-settings');
          }}
          sx={{
            py: 1.1,
            px: 1.6,
            borderRadius: '6px',
            color: '#ffffff',
            '&:hover': {
              bgcolor: '#1c1e2e',
              '& .MuiListItemIcon-root': { color: '#e5a93c' },
              '& .MuiListItemText-primary': { color: '#e5a93c' }
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 32, color: '#cbd5e1' }}>
            <BusinessOutlinedIcon sx={{ fontSize: 19 }} />
          </ListItemIcon>
          <ListItemText
            primary="Company Settings"
            primaryTypographyProps={{ fontSize: '0.86rem', fontWeight: 600, color: '#ffffff' }}
          />
        </MenuItem>

        <Divider sx={{ borderColor: '#232537', my: 0.8 }} />

        {/* Menu Action 4: Log out */}
        <MenuItem
          onClick={handleLogout}
          sx={{
            py: 1.1,
            px: 1.6,
            borderRadius: '6px',
            color: '#ef4444',
            '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.12)' }
          }}
        >
          <ListItemIcon sx={{ minWidth: 32, color: '#ef4444' }}>
            <LogoutIcon sx={{ fontSize: 19 }} />
          </ListItemIcon>
          <ListItemText
            primary="Log out"
            primaryTypographyProps={{ fontSize: '0.86rem', fontWeight: 700, color: '#ef4444' }}
          />
        </MenuItem>
      </Menu>

      {/* =========================================================================
          DIALOG 1: PROFILE & CREDENTIALS DETAILS
          ========================================================================= */}
      <Dialog
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#141521',
            color: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #282a3d',
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <BadgeOutlinedIcon sx={{ color: '#e5a93c', fontSize: 22 }} />
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#ffffff', fontSize: '1.1rem' }}>
              User Profile & Permissions
            </Typography>
          </Box>
          <IconButton onClick={() => setProfileModalOpen(false)} size="small" sx={{ color: '#94a3b8' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ borderColor: '#232537' }}>
          {/* User Hero Banner */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 2,
              borderRadius: '8px',
              bgcolor: '#191b2b',
              border: '1px solid #282a3d',
              mb: 2.5
            }}
          >
            <Avatar sx={{ width: 52, height: 52, bgcolor: userColor, color: '#ffffff', fontWeight: 800, fontSize: '1.25rem' }}>
              {userInitials}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#ffffff', fontSize: '1rem', lineHeight: 1.2 }}>
                {userName}
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.84rem' }}>
                {userEmail}
              </Typography>
              <Typography variant="caption" sx={{ color: '#e5a93c', fontWeight: 700, display: 'block', mt: 0.3 }}>
                {userRole}
              </Typography>
            </Box>
          </Box>

          {/* Detailed Info Grid */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.8, borderBottom: '1px solid #1e202f' }}>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                User Identifier (ID)
              </Typography>
              <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 700, fontFamily: 'monospace' }}>
                {user?.id || 'USR-001'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.8, borderBottom: '1px solid #1e202f' }}>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                Company Organization
              </Typography>
              <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 700 }}>
                Apex Global Enterprises Private Limited
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.8, borderBottom: '1px solid #1e202f' }}>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                Jurisdiction & State Code
              </Typography>
              <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 700 }}>
                Maharashtra (State 27)
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.8, borderBottom: '1px solid #1e202f' }}>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                Session Authentication
              </Typography>
              <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CheckCircleOutlineIcon sx={{ fontSize: 14 }} /> Active &amp; Encrypted
              </Typography>
            </Box>

            {/* Permissions Badges */}
            <Box sx={{ pt: 1 }}>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, display: 'block', mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Assigned Accounting Permissions
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                {(user?.permissions || ['ADMIN', 'APPROVE', 'POST', 'REPORTS', 'SETTINGS']).map((perm) => (
                  <Chip
                    key={perm}
                    label={perm}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(229, 169, 60, 0.12)',
                      color: '#e5a93c',
                      fontWeight: 700,
                      fontSize: '0.68rem',
                      height: 22,
                      borderRadius: '4px',
                      border: '1px solid rgba(229, 169, 60, 0.25)'
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setProfileModalOpen(false)}
            variant="contained"
            sx={{
              bgcolor: '#0f172a',
              color: '#ffffff',
              border: '1px solid #282a3d',
              borderRadius: '6px',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.84rem',
              '&:hover': { bgcolor: '#1e293b' }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* =========================================================================
          DIALOG 2: CHANGE PASSWORD
          ========================================================================= */}
      <Dialog
        open={passwordModalOpen}
        onClose={() => !pwLoading && setPasswordModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#141521',
            color: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #282a3d',
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <VpnKeyOutlinedIcon sx={{ color: '#e5a93c', fontSize: 22 }} />
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#ffffff', fontSize: '1.1rem' }}>
              Change Password
            </Typography>
          </Box>
          <IconButton onClick={() => !pwLoading && setPasswordModalOpen(false)} size="small" sx={{ color: '#94a3b8' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleChangePasswordSubmit}>
          <DialogContent dividers sx={{ borderColor: '#232537' }}>
            <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.82rem', mb: 2 }}>
              Update your corporate credentials for <strong>{userEmail}</strong>.
            </Typography>

            {pwError && (
              <Alert severity="error" sx={{ mb: 2, bgcolor: '#fee2e2', color: '#991b1b', borderRadius: '6px', fontSize: '0.82rem' }}>
                {pwError}
              </Alert>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Current Password */}
              <Box>
                <Typography variant="caption" sx={{ color: '#cbd5e1', fontWeight: 600, display: 'block', mb: 0.6 }}>
                  Current Password
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type={showCurrentPw ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  autoComplete="current-password"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#1b1d2d',
                      borderRadius: '6px',
                      color: '#ffffff',
                      '& fieldset': { borderColor: '#282a3d' },
                      '&:hover fieldset': { borderColor: '#475569' },
                      '&.Mui-focused fieldset': { borderColor: '#e5a93c' }
                    }
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setShowCurrentPw(!showCurrentPw)} sx={{ color: '#64748b' }}>
                          {showCurrentPw ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Box>

              {/* New Password */}
              <Box>
                <Typography variant="caption" sx={{ color: '#cbd5e1', fontWeight: 600, display: 'block', mb: 0.6 }}>
                  New Password
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type={showNewPw ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 4 characters"
                  autoComplete="new-password"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#1b1d2d',
                      borderRadius: '6px',
                      color: '#ffffff',
                      '& fieldset': { borderColor: '#282a3d' },
                      '&:hover fieldset': { borderColor: '#475569' },
                      '&.Mui-focused fieldset': { borderColor: '#e5a93c' }
                    }
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setShowNewPw(!showNewPw)} sx={{ color: '#64748b' }}>
                          {showNewPw ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Box>

              {/* Confirm Password */}
              <Box>
                <Typography variant="caption" sx={{ color: '#cbd5e1', fontWeight: 600, display: 'block', mb: 0.6 }}>
                  Confirm New Password
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type={showConfirmPw ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  autoComplete="new-password"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#1b1d2d',
                      borderRadius: '6px',
                      color: '#ffffff',
                      '& fieldset': { borderColor: '#282a3d' },
                      '&:hover fieldset': { borderColor: '#475569' },
                      '&.Mui-focused fieldset': { borderColor: '#e5a93c' }
                    }
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setShowConfirmPw(!showConfirmPw)} sx={{ color: '#64748b' }}>
                          {showConfirmPw ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Box>
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() => setPasswordModalOpen(false)}
              disabled={pwLoading}
              sx={{ color: '#94a3b8', textTransform: 'none', fontWeight: 600 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={pwLoading}
              sx={{
                bgcolor: '#e5a93c',
                color: '#000000',
                borderRadius: '6px',
                textTransform: 'none',
                fontWeight: 800,
                fontSize: '0.86rem',
                px: 2.5,
                '&:hover': { bgcolor: '#d49b28' }
              }}
            >
              {pwLoading ? <CircularProgress size={18} color="inherit" /> : 'Update Password'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
