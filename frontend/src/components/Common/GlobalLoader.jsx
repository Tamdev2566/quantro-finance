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
              backgroundColor: 'rgba(229, 169, 60, 0.2)',
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(90deg, #f3c64f, #e5a93c, #b88019)',
                boxShadow: '0 0 12px #e5a93c'
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
              background: 'linear-gradient(145deg, #1a1b2a 0%, #12131c 100%)',
              border: '1px solid rgba(229, 169, 60, 0.38)',
              borderRadius: '16px',
              px: 4.5,
              py: 3.5,
              boxShadow: '0 28px 64px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
              minWidth: 220,
              textAlign: 'center'
            }}
          >
            {/* Spinning Gold Loader Ring */}
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              <CircularProgress
                size={44}
                thickness={4}
                sx={{
                  color: '#e5a93c',
                  filter: 'drop-shadow(0 0 8px rgba(229, 169, 60, 0.45))'
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
