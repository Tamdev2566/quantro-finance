import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet } from 'react-router-dom';
import { clearNotification, setCompany } from '../store';
import { apiClient } from '../api/client';
import { Box, Snackbar, Alert } from '@mui/material';
import Sidebar from '../components/Layout/Sidebar';
import Header from '../components/Layout/Header';

export default function MainLayout() {
  const dispatch = useDispatch();
  const notification = useSelector((state) => state.finance.notification);
  const user = useSelector((state) => state.finance.user);

  useEffect(() => {
    if (user) {
      apiClient.setAuthUser(user);
    }
    apiClient.getCompany().then((res) => {
      if (res.data) dispatch(setCompany(res.data));
    }).catch(console.error);
  }, [user]);

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#0c0d14', // Quantro Charcoal Canvas
        overflow: 'hidden'
      }}
    >
      {/* Dark Sidebar */}
      <Sidebar />

      {/* Main Workspace Column */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          height: '100vh',
          overflowY: 'auto',
          pr: { xs: 1, md: 2.5 }
        }}
      >
        {/* Dark Top Header */}
        <Header />

        {/* Large Rounded White Canvas Workspace (Quantro) */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            mb: 2.5,
            backgroundColor: '#ffffff',
            borderRadius: '28px',
            p: { xs: 2, sm: 3, md: 3.5 },
            boxShadow: '0 20px 45px -15px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            overflowY: 'auto'
          }}
        >
          <Outlet />
        </Box>
      </Box>

      {/* Global Notification Toast */}
      <Snackbar
        open={Boolean(notification)}
        autoHideDuration={4000}
        onClose={() => dispatch(clearNotification())}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => dispatch(clearNotification())}
          severity={notification?.severity || 'info'}
          sx={{
            width: '100%',
            borderRadius: '14px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            fontWeight: 600,
            backgroundColor: notification?.severity === 'success' ? '#10b981' : undefined,
            color: notification?.severity === 'success' ? '#ffffff' : undefined
          }}
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
