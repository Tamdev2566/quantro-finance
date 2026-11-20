import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#e5a93c', // Quantro Executive Metallic Gold
      light: '#f3c64f', // Shimmering Light Gold
      dark: '#b88019',  // Burnished Deep Gold
      contrastText: '#000000'
    },
    secondary: {
      main: '#12131c', // Deep Dark Charcoal Black
      light: '#1e202d',
      dark: '#0a0a0f',
      contrastText: '#ffffff'
    },
    background: {
      default: '#0c0d14', // Dark Shell Canvas
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
    borderRadius: 16
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          boxShadow: 'none',
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
          '&:hover': {
            background: 'linear-gradient(135deg, #e5a93c 0%, #b88019 100%)',
            color: '#ffffff'
          }
        },
        containedSecondary: {
          backgroundColor: '#12131c',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#1e202d'
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          backgroundColor: '#ffffff',
          border: '1px solid #f1f5f9',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.03)',
          transition: 'all 0.2s ease-in-out'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 20
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 600
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          backgroundColor: '#ffffff',
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
    }
  }
});

export default theme;
