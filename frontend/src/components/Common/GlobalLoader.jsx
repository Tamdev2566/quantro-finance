import React, { useState, useEffect } from 'react';
import { Backdrop, Box, CircularProgress, Typography, Fade, LinearProgress } from '@mui/material';
import { subscribeToLoading } from '../../api/client';

/**
 * GlobalLoader
 * 
 * Automatically connected to the Axios interceptor in apiClient.
 * Displays right in the CENTER OF THE SCREEN with a sleek dark glassmorphic card
 * so the user clearly knows data is loading / processing.
 * Automatically skips autocomplete search requests.
 */
export default function GlobalLoader() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToLoading((isLoading) => {
      setLoading(isLoading);
    });
    return unsubscribe;
  }, []);

  return (
    <>
      {/* 1. Top Screen Glowing Progress Line */}
      {loading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000000,
            height: 3,
            pointerEvents: 'none'
          }}
        >
          <LinearProgress
            sx={{
              height: 3,
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: 'var(--theme-10, #e5a93c)',
                boxShadow: '0 0 12px var(--theme-10, #e5a93c)'
              }
            }}
          />
        </Box>
      )}

      {/* 2. Center-Screen Glassmorphic Modal Loader */}
      <Backdrop
        open={loading}
        transitionDuration={{ enter: 150, exit: 200 }}
        sx={{
          zIndex: 999999,
          backgroundColor: 'rgba(12, 13, 20, 0.55)',
          backdropFilter: 'blur(3px)'
        }}
      >
        <Fade in={loading}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--theme-60-sidebar, #141521)',
              border: '1px solid var(--theme-10, #e5a93c)',
              borderRadius: '16px',
              px: 4.5,
              py: 3.5,
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7)',
              minWidth: 220,
              textAlign: 'center'
            }}
          >
            {/* Spinning Accent Loader Ring */}
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              <CircularProgress
                size={44}
                thickness={4}
                sx={{
                  color: 'var(--theme-10, #e5a93c)',
                  filter: 'drop-shadow(0 0 8px rgba(0, 0, 0, 0.45))'
                }}
              />
            </Box>

            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 800,
                color: '#ffffff',
                fontSize: '0.98rem',
                letterSpacing: '-0.01em',
                mb: 0.5
              }}
            >
              Loading...
            </Typography>

            <Typography
              variant="caption"
              sx={{
                color: '#94a3b8',
                fontSize: '0.76rem',
                fontWeight: 500
              }}
            >
              Please wait a moment
            </Typography>
          </Box>
        </Fade>
      </Backdrop>
    </>
  );
}
