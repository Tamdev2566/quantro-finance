import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#e5a93c',
      light: '#f3c64f',
      dark: '#b88019',
      contrastText: '#000000'
    },
    secondary: {
      main: '#12131c',
      light: '#1e202d',
      dark: '#0a0a0f',
      contrastText: '#ffffff'
    },
    background: {
      default: '#0c0d14',
      paper: '#ffffff',
      darkCard: '#151621'
    },
    text: {
      primary: '#0f172a',
      secondary: '#64748b'
    },
    divider: '#f1f5f9',
    success: {
      main: '#10b981',
      light: '#dcfce7',
      dark: '#059669'
    },
    warning: {
      main: '#e5a93c',
      light: '#fdf6e7',
      dark: '#b88019'
    },
    error: {
      main: '#ef4444',
      light: '#fee2e2',
      dark: '#dc2626'
    },
    info: {
      main: '#3b82f6',
      light: '#e0f2fe',
      dark: '#1d4ed8'
    }
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h4: {
      fontWeight: 800,
      letterSpacing: '-0.02em',
      color: '#0f172a'
    },
    h5: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
      color: '#0f172a'
    },
    h6: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
      color: '#0f172a'
    },
    subtitle1: {
      fontWeight: 600,
      color: '#0f172a'
    },
    subtitle2: {
      fontWeight: 600,
      color: '#64748b'
    },
    body1: {
      fontSize: '0.925rem',
      color: '#0f172a'
    },
    body2: {
      fontSize: '0.85rem',
      color: '#64748b'
    },
    button: {
      textTransform: 'none',
      fontWeight: 700
    }
  },
  shape: {
    borderRadius: 6
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          boxShadow: '0 2px 6px rgba(15, 23, 42, 0.06)',
          fontWeight: 700,
          padding: '8px 18px',
          textTransform: 'none',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 6px 16px -2px rgba(229, 169, 60, 0.35)',
            transform: 'translateY(-1px)'
          }
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #f3c64f 0%, #e5a93c 100%)',
          color: '#000000',
          fontWeight: 800,
          boxShadow: '0 4px 12px -2px rgba(229, 169, 60, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
          '&:hover': {
            background: 'linear-gradient(135deg, #e5a93c 0%, #b88019 100%)',
            color: '#ffffff'
          }
        },
        containedSecondary: {
          background: 'linear-gradient(145deg, #1a1c29 0%, #12131c 100%)',
          color: '#ffffff',
          boxShadow: '0 6px 16px -4px rgba(12, 13, 20, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
          '&:hover': {
            background: 'linear-gradient(145deg, #222536 0%, #181a26 100%)'
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
          border: '1px solid rgba(226, 232, 240, 0.9)',
          boxShadow: '0 10px 30px -6px rgba(15, 23, 42, 0.08), 0 4px 12px -2px rgba(15, 23, 42, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.95)',
          transition: 'all 0.22s ease-in-out'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          boxShadow: '0 8px 24px -6px rgba(15, 23, 42, 0.07), 0 2px 8px -2px rgba(15, 23, 42, 0.04)'
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          boxShadow: '0 24px 60px -12px rgba(15, 23, 42, 0.25), 0 10px 24px -6px rgba(15, 23, 42, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.9)'
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 600
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03), inset 0 1px 2px rgba(15, 23, 42, 0.02)',
          '& fieldset': {
            borderColor: '#e2e8f0'
          },
          '&:hover fieldset': {
            borderColor: '#cbd5e1'
          },
          '&.Mui-focused fieldset': {
            borderColor: '#e5a93c',
            borderWidth: '1.5px'
          }
        }
      }
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          borderRadius: 6
        }
      }
    },
    MuiFilledInput: {
      styleOverrides: {
        root: {
          borderRadius: 6
        }
      }
    }
  }
});

export default theme;
