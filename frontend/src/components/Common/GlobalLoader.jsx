import React, { useState, useEffect } from 'react';
import { Box, LinearProgress, Fade } from '@mui/material';
import { subscribeToLoading } from '../../api/client';

/**
 * GlobalLoader
 * 
 * Automatically connected to the Axios interceptor in apiClient.
 * - Shows a glowing amber progress line at the very top of the window (z-index 999999).
 * - Shows a sleek floating indicator when an API request is in-flight.
 * - Automatically skips autocomplete queries.
 */
export default function GlobalLoader() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Subscribe to central API loader state in client.js
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
            zIndex: 999999,
            height: 3,
            pointerEvents: 'none'
          }}
        >
          <LinearProgress
            sx={{
              height: 3,
              backgroundColor: 'rgba(229, 169, 60, 0.15)',
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(90deg, #f3c64f, #e5a93c, #b88019)',
                boxShadow: '0 0 12px #e5a93c'
              }
            }}
          />
        </Box>
      )}

      {/* 2. Floating Glassmorphic Indicator */}
      <Fade in={loading} timeout={{ enter: 200, exit: 250 }} unmountOnExit>
        <Box
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 2,
            py: 1,
            backgroundColor: 'rgba(18, 19, 28, 0.92)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(229, 169, 60, 0.35)',
            borderRadius: '99px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
            pointerEvents: 'none'
          }}
        >
          <Box
            sx={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              border: '2px solid rgba(229, 169, 60, 0.3)',
              borderTopColor: '#e5a93c',
              animation: 'quantroSpin 0.8s linear infinite',
              '@keyframes quantroSpin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' }
              }
            }}
          />
          <Box sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '0.02em' }}>
            Syncing...
          </Box>
        </Box>
      </Fade>
    </>
  );
}
