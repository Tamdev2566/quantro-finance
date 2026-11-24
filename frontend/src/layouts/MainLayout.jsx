import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet } from 'react-router-dom';
import { clearNotification, setCompany } from '../store';
import { apiClient } from '../api/client';
import { Box, Snackbar, Alert, Drawer, Slide } from '@mui/material';
import Sidebar from '../components/Layout/Sidebar';
import Header from '../components/Layout/Header';

function SlideTransitionDown(props) {
  return <Slide {...props} direction="down" />;
}

export default function MainLayout() {
  const dispatch = useDispatch();
  const notification = useSelector((state) => state.ui?.notification ?? state.finance?.notification);
  const user = useSelector((state) => state.auth?.user ?? state.finance?.user);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev);
  };

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
        height: '100vh',
        maxHeight: '100vh',
        backgroundColor: '#0c0d14',
        overflow: 'hidden'
      }}
    >
      <Box
        sx={{
          display: { xs: 'none', md: 'block' },
          flexShrink: 0,
          width: 260,
          height: '100vh',
          overflow: 'hidden'
        }}
      >
        <Sidebar />
      </Box>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: 260,
            height: '100vh',
            boxSizing: 'border-box',
            backgroundColor: '#0c0d14',
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
            overflow: 'hidden'
          }
        }}
      >
        <Sidebar onItemClick={() => setMobileOpen(false)} />
      </Drawer>

      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          height: '100vh',
          maxHeight: '100vh',
          overflow: 'hidden',
          px: { xs: 1, sm: 1.5, md: 2 }
        }}
      >
        <Box sx={{ flexShrink: 0 }}>
          <Header onDrawerToggle={handleDrawerToggle} />
        </Box>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            mb: { xs: 1, md: 1.5 },
            backgroundColor: '#ffffff',
            borderRadius: { xs: '8px', sm: '12px' },
            p: { xs: 1.5, sm: 2, md: 2.2 },
            boxShadow: '0 20px 45px -15px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            overflow: 'hidden'
          }}
        >
          <Outlet />
        </Box>
      </Box>

      <Snackbar
        open={Boolean(notification)}
        autoHideDuration={4000}
        onClose={() => dispatch(clearNotification())}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        TransitionComponent={SlideTransitionDown}
        sx={{
          top: { xs: 16, sm: 24 },
          zIndex: 9999999
        }}
      >
        <Alert
          onClose={() => dispatch(clearNotification())}
          severity={notification?.severity || 'success'}
          variant="filled"
          sx={{
            minWidth: { xs: 280, sm: 360 },
            maxWidth: 600,
            borderRadius: '10px',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.45)',
            fontWeight: 700,
            fontSize: '0.88rem',
            alignItems: 'center',
            backgroundColor: notification?.severity === 'error' ? '#ef4444' : (notification?.severity === 'warning' ? '#f59e0b' : '#10b981'),
            color: '#ffffff',
            '& .MuiAlert-icon': {
              color: '#ffffff',
              fontSize: 22
            }
          }}
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
