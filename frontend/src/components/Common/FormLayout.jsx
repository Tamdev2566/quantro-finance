import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

/**
 * Reusable FormLayout component for all Create / Edit screens.
 *
 * Layout Structure:
 * - Header (pinned top, flexShrink: 0): Back navigation + Screen Title + optional headerRight
 * - Container (flex: 1, minHeight: 0, overflowY: 'auto'): White box container holding form fields.
 *   Scrolling is strictly confined inside this box container, with no visible scrollbar.
 * - Footer (pinned bottom, flexShrink: 0): Cancel + Save action buttons + optional footerLeft
 */
export default function FormLayout({
  title,
  backLabel = 'Back',
  onBack,
  headerRight,
  children,
  onSubmit, // Optional form onSubmit handler (e.g. handleSubmit(onSubmit))
  onCancel, // Optional cancel click handler (defaults to onBack)
  cancelLabel = 'Cancel',
  onSave, // Optional save click handler (if not using onSubmit)
  saveLabel = 'Save',
  savingLabel = 'Saving...',
  loading = false,
  saveDisabled = false,
  footerLeft,
  footerRight,
  maxWidth = 1400,
  noCardPadding = false,
  containerSx = {}
}) {
  const handleCancel = onCancel || onBack;

  const content = (
    <Box
      sx={{
        width: '100%',
        maxWidth,
        mx: 'auto',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        overflow: 'hidden'
      }}
    >
      {/* 1. HEADER: Screen Name + Back Navigation */}
      <Box
        sx={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1.5,
          gap: 1.5,
          flexWrap: 'wrap'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {onBack && (
            <Button
              startIcon={<ArrowBackIcon sx={{ fontSize: 18 }} />}
              onClick={onBack}
              size="small"
              sx={{
                color: '#475569',
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: '6px',
                px: 1.5,
                py: 0.6,
                bgcolor: '#f1f5f9',
                border: '1px solid #e2e8f0',
                fontSize: '0.82rem',
                '&:hover': { bgcolor: '#e2e8f0', color: '#0f172a' }
              }}
            >
              {backLabel}
            </Button>
          )}
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: '#0f172a',
              fontSize: { xs: '1.2rem', sm: '1.35rem' },
              letterSpacing: '-0.02em'
            }}
          >
            {title}
          </Typography>
        </Box>
        {headerRight && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>{headerRight}</Box>}
      </Box>

      {/* 2. CONTAINER: White Box holding form fields with internal scroll & hidden scrollbar */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
          border: '1px solid rgba(226, 232, 240, 0.9)',
          borderRadius: '10px',
          p: noCardPadding ? 0 : { xs: 2.5, sm: 3.5 },
          boxShadow: '0 12px 32px -8px rgba(15, 23, 42, 0.09), 0 4px 12px -2px rgba(15, 23, 42, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.95)',
          // Hidden scrollbar styling across all modern browsers
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none', // IE and Edge
          '&::-webkit-scrollbar': {
            display: 'none',
            width: 0,
            height: 0
          },
          ...containerSx
        }}
      >
        {children}
      </Box>

      {/* 3. FOOTER: Cancel and Save Action Buttons */}
      <Box
        sx={{
          flexShrink: 0,
          mt: 1.5,
          pt: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid #f1f5f9',
          gap: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {footerLeft}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {footerRight ? (
            footerRight
          ) : (
            <>
              {handleCancel && (
                <Button
                  onClick={handleCancel}
                  color="inherit"
                  disabled={loading}
                  sx={{
                    borderRadius: '6px',
                    px: 3,
                    fontWeight: 600,
                    color: '#64748b',
                    border: '1px solid #cbd5e1',
                    bgcolor: '#ffffff',
                    textTransform: 'none',
                    fontSize: '0.875rem',
                    '&:hover': { bgcolor: '#f8fafc', borderColor: '#94a3b8', color: '#0f172a' }
                  }}
                >
                  {cancelLabel}
                </Button>
              )}
              <Button
                type={onSubmit ? 'submit' : 'button'}
                onClick={onSave}
                variant="contained"
                disabled={loading || saveDisabled}
                sx={{
                  bgcolor: '#e5a93c',
                  color: '#0f172a',
                  fontWeight: 700,
                  borderRadius: '6px',
                  px: 3.5,
                  py: 0.8,
                  textTransform: 'none',
                  fontSize: '0.875rem',
                  boxShadow: '0 4px 12px -2px rgba(229, 169, 60, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.35)',
                  '&:hover': { bgcolor: '#d4982e', boxShadow: '0 6px 16px -2px rgba(229, 169, 60, 0.45)' }
                }}
              >
                {loading ? savingLabel : saveLabel}
              </Button>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );

  if (onSubmit) {
    return (
      <Box
        component="form"
        onSubmit={onSubmit}
        noValidate
        sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}
      >
        {content}
      </Box>
    );
  }

  return content;
}
