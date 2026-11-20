import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout, showNotification } from '../../store';
import { apiClient } from '../../api/client';
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Chip,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

// Icons
import HomeIcon from '@mui/icons-material/Home';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CategoryIcon from '@mui/icons-material/Category';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import LogoutIcon from '@mui/icons-material/Logout';

const DRAWER_WIDTH = 260;

export default function Sidebar({ onItemClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Collapsible section states (all open by default so user retains full visibility)
  const [openSections, setOpenSections] = useState({
    sales: true,
    purchases: true,
    expenses: false,
    accounting: true,
    banking: false,
    reports: false,
    settings: false
  });

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLogout = () => {
    if (onItemClick) onItemClick();
    apiClient.logout().catch(() => {});
    dispatch(logout());
    dispatch(showNotification({ message: 'Signed out successfully', severity: 'info' }));
    navigate('/login');
  };

  const isCurrent = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname === path;
  };

  const nav = (path) => {
    navigate(path);
    if (onItemClick) onItemClick();
  };

  const renderSubItem = (label, path, badge = null) => {
    const active = isCurrent(path);
    return (
      <ListItemButton
        key={path}
        onClick={() => nav(path)}
        sx={{
          py: 0.7,
          px: 2,
          pl: 3.5,
          mb: 0.3,
          borderRadius: '4px',
          backgroundColor: active ? 'rgba(229, 169, 60, 0.15) !important' : 'transparent',
          color: active ? '#e5a93c' : '#94a3b8',
          border: active ? '1px solid rgba(229, 169, 60, 0.35)' : '1px solid transparent',
          transition: 'all 0.15s ease-in-out',
          '&:hover': {
            backgroundColor: active ? 'rgba(229, 169, 60, 0.22)' : 'rgba(255, 255, 255, 0.04)',
            color: active ? '#e5a93c' : '#ffffff'
          }
        }}
      >
        <ListItemText
          primary={label}
          primaryTypographyProps={{
            fontSize: '0.84rem',
            fontWeight: active ? 700 : 500,
            color: active ? '#e5a93c' : 'inherit'
          }}
        />
        {badge && (
          <Chip
            size="small"
            label={badge}
            sx={{
              height: 18,
              fontSize: '0.65rem',
              fontWeight: 800,
              bgcolor: active ? '#e5a93c' : 'rgba(255,255,255,0.1)',
              color: active ? '#000000' : '#cbd5e1',
              borderRadius: '4px'
            }}
          />
        )}
      </ListItemButton>
    );
  };

  const renderGroupHeader = (key, title, icon, countBadge = null) => {
    const isOpen = openSections[key];
    return (
      <ListItemButton
        onClick={() => toggleSection(key)}
        sx={{
          py: 0.8,
          px: 1.8,
          mb: 0.3,
          borderRadius: '4px',
          color: '#cbd5e1',
          '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#ffffff' }
        }}
      >
        <ListItemIcon sx={{ minWidth: 32, color: '#94a3b8', '& svg': { fontSize: 18 } }}>
          {icon}
        </ListItemIcon>
        <ListItemText
          primary={title}
          primaryTypographyProps={{ fontSize: '0.86rem', fontWeight: 600, color: 'inherit' }}
        />
        {countBadge && (
          <Chip
            size="small"
            label={countBadge}
            sx={{
              height: 18,
              fontSize: '0.65rem',
              fontWeight: 700,
              bgcolor: 'rgba(255, 255, 255, 0.08)',
              color: '#94a3b8',
              mr: 0.5,
              borderRadius: '4px'
            }}
          />
        )}
        {isOpen ? (
          <ExpandLess sx={{ fontSize: 18, color: '#64748b' }} />
        ) : (
          <ExpandMore sx={{ fontSize: 18, color: '#64748b' }} />
        )}
      </ListItemButton>
    );
  };

  return (
    <Box
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        height: '100%',
        maxHeight: '100vh',
        backgroundColor: '#0c0d14', // Quantro Deep Dark Canvas
        p: 2,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRight: '1px solid rgba(255, 255, 255, 0.06)',
        overflow: 'hidden'
      }}
    >
      {/* Quantro Brand Logo with Premium Metallic Gold (Fixed at top) */}
      <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, px: 1, pt: 0.5 }}>
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }}
          onClick={() => nav('/dashboard')}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #f3c64f 0%, #d49b28 50%, #b88019 100%)', // Shimmering Gold
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(229, 169, 60, 0.4)'
            }}
          >
            {/* Geometric Quantro 3-bar icon */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M4 6C4 4.89543 4.89543 4 6 4H8C9.10457 4 10 4.89543 10 6V18C10 19.1046 9.10457 20 8 20H6C4.89543 20 4 19.1046 4 18V6Z" fill="#12131c" />
              <path d="M11 9C11 7.89543 11.8954 7 13 7H15C16.1046 7 17 7.89543 17 9V18C17 19.1046 16.1046 20 15 20H13C11.8954 20 11 19.1046 11 18V9Z" fill="#12131c" fillOpacity="0.8" />
              <path d="M18 12C18 10.8954 18.8954 10 20 10H22V18C22 19.1046 21.1046 20 20 20H18V12Z" fill="#12131c" fillOpacity="0.6" />
            </svg>
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              fontSize: '1.25rem'
            }}
          >
            Quantro
          </Typography>
        </Box>

        {onItemClick && (
          <IconButton
            onClick={onItemClick}
            size="small"
            sx={{
              color: '#94a3b8',
              display: { xs: 'flex', md: 'none' },
              bgcolor: 'rgba(255,255,255,0.05)',
              borderRadius: '4px',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', color: '#ffffff' }
            }}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        )}
      </Box>

      {/* Scrollable Navigation Area (Takes remaining space and scrolls smoothly) */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          pr: 0.5,
          '&::-webkit-scrollbar': {
            width: '6px'
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '4px'
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#334155',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: '#e5a93c'
            }
          }
        }}
      >
        {/* Dashboard Item (Active Gold Icon & Text) */}
        <ListItemButton
          onClick={() => nav('/dashboard')}
          sx={{
            py: 1,
            px: 2,
            mb: 1.5,
            borderRadius: '4px',
            backgroundColor: isCurrent('/dashboard') ? '#191b26 !important' : 'transparent',
            border: isCurrent('/dashboard') ? '1px solid rgba(229, 169, 60, 0.4)' : '1px solid transparent',
            color: isCurrent('/dashboard') ? '#e5a93c' : '#94a3b8',
            '&:hover': {
              backgroundColor: '#191b26',
              color: '#ffffff'
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 32, color: isCurrent('/dashboard') ? '#e5a93c' : '#94a3b8', '& svg': { fontSize: 19 } }}>
            <HomeIcon />
          </ListItemIcon>
          <ListItemText
            primary="Dashboard"
            primaryTypographyProps={{
              fontSize: '0.9rem',
              fontWeight: isCurrent('/dashboard') ? 700 : 500,
              color: isCurrent('/dashboard') ? '#e5a93c' : 'inherit'
            }}
          />
        </ListItemButton>

        {/* Section: Main Menu Modules */}
        <Typography variant="caption" sx={{ color: '#475569', fontWeight: 700, display: 'block', mb: 0.8, pl: 1, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.68rem' }}>
          Operations & Sales
        </Typography>

        {/* Sales & Receivables (AR) */}
        {renderGroupHeader('sales', 'Sales (AR)', <PointOfSaleIcon />, '5')}
        <Collapse in={openSections.sales} timeout="auto" unmountOnExit>
          <List disablePadding>
            {renderSubItem('Sales Invoices', '/invoices')}
            {renderSubItem('Customer Receipts', '/payments')}
            {renderSubItem('Credit Notes', '/credit-notes')}
            {renderSubItem('Customer Master', '/customers')}
            {renderSubItem('Receivables Aging', '/receivables-aging')}
          </List>
        </Collapse>

        {/* Purchases & Payables (AP) */}
        {renderGroupHeader('purchases', 'Purchases (AP)', <ShoppingCartIcon />, '5')}
        <Collapse in={openSections.purchases} timeout="auto" unmountOnExit>
          <List disablePadding>
            {renderSubItem('Vendor Bills', '/vendor-bills')}
            {renderSubItem('Vendor Payments', '/vendor-payments')}
            {renderSubItem('Debit Notes', '/debit-notes')}
            {renderSubItem('Vendors Master', '/vendors')}
            {renderSubItem('Payables Aging', '/payables-aging')}
          </List>
        </Collapse>

        {/* Section: Financial Core */}
        <Typography variant="caption" sx={{ color: '#475569', fontWeight: 700, display: 'block', mt: 2, mb: 0.8, pl: 1, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.68rem' }}>
          Finance & Accounting
        </Typography>

        {/* Accounting & General Ledger */}
        {renderGroupHeader('accounting', 'Accounting', <AccountBalanceIcon />, '5')}
        <Collapse in={openSections.accounting} timeout="auto" unmountOnExit>
          <List disablePadding>
            {renderSubItem('Chart of Accounts', '/accounts')}
            {renderSubItem('Journal Entries', '/journals')}
            {renderSubItem('General Ledger', '/general-ledger')}
            {renderSubItem('Trial Balance', '/trial-balance')}
            {renderSubItem('Tax Summary (GST)', '/tax')}
          </List>
        </Collapse>

        {/* Banking & Cash */}
        {renderGroupHeader('banking', 'Banking & Cash', <AccountBalanceWalletIcon />, '2')}
        <Collapse in={openSections.banking} timeout="auto" unmountOnExit>
          <List disablePadding>
            {renderSubItem('Bank Accounts', '/bank-accounts')}
            {renderSubItem('Bank Reconciliation', '/reconciliation')}
          </List>
        </Collapse>

        {/* Direct Expenses */}
        {renderGroupHeader('expenses', 'Expenses', <CategoryIcon />, '2')}
        <Collapse in={openSections.expenses} timeout="auto" unmountOnExit>
          <List disablePadding>
            {renderSubItem('Operating Expenses', '/expenses')}
            {renderSubItem('Expense Categories', '/expense-categories')}
          </List>
        </Collapse>

        {/* Section: Intelligence & Reports */}
        <Typography variant="caption" sx={{ color: '#475569', fontWeight: 700, display: 'block', mt: 2, mb: 0.8, pl: 1, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.68rem' }}>
          Reports & Analysis
        </Typography>

        {/* Financial Statements & Budgets */}
        {renderGroupHeader('reports', 'Financial Reports', <AssessmentIcon />, '4')}
        <Collapse in={openSections.reports} timeout="auto" unmountOnExit>
          <List disablePadding>
            {renderSubItem('Profit & Loss (P&L)', '/profit-loss')}
            {renderSubItem('Balance Sheet', '/balance-sheet')}
            {renderSubItem('Cash Flow Statement', '/cash-flow')}
            {renderSubItem('Department Budgets', '/budgets')}
          </List>
        </Collapse>

        {/* Section: General */}
        <Typography variant="caption" sx={{ color: '#475569', fontWeight: 700, display: 'block', mt: 2, mb: 0.8, pl: 1, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.68rem' }}>
          System & Config
        </Typography>

        {renderGroupHeader('settings', 'Settings', <SettingsOutlinedIcon />, '3')}
        <Collapse in={openSections.settings} timeout="auto" unmountOnExit>
          <List disablePadding>
            {renderSubItem('Company & Fiscal Year', '/company-settings')}
            {renderSubItem('Backup & Restore', '/backup-restore')}
            {renderSubItem('Audit Logs', '/audit-logs')}
          </List>
        </Collapse>
      </Box>

      {/* Bottom Section: Logout only (Fixed at bottom) */}
      <Box sx={{ flexShrink: 0, pt: 1.5, borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            py: 0.8,
            px: 1.8,
            borderRadius: '4px',
            color: '#ef4444',
            '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.12)' }
          }}
        >
          <ListItemIcon sx={{ minWidth: 30, color: '#ef4444' }}>
            <LogoutIcon sx={{ fontSize: 18 }} />
          </ListItemIcon>
          <ListItemText
            primary="Log out"
            primaryTypographyProps={{ fontSize: '0.86rem', fontWeight: 600, color: '#ef4444' }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );
}
