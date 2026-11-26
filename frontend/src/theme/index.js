import { createTheme } from '@mui/material/styles';
import { getThemeConfig } from './themes';

export { COLOR_THEMES, THEME_LIST, getThemeConfig, applyThemeCssVars } from './themes';

export const createAppTheme = (themeId = 'default') => {
  const t = getThemeConfig(themeId);

  return createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: t.accent,
        light: t.accentLight,
        dark: t.accentDark,
        contrastText: t.accentContrast
      },
      secondary: {
        main: t.sidebarBg,
        light: t.headerControlBg,
        dark: t.shellBg,
        contrastText: '#ffffff'
      },
      background: {
        default: t.shellBg,
        paper: t.cardBg,
        darkCard: t.darkCardBg
      },
      text: {
        primary: t.textPrimary,
        secondary: t.textSecondary
      },
      divider: t.surfaceBorder,
      success: {
        main: '#10b981',
        light: '#dcfce7',
        dark: '#059669'
      },
      warning: {
        main: t.accent,
        light: t.accentSoft,
        dark: t.accentDark
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
        color: t.textPrimary
      },
      h5: {
        fontWeight: 700,
        letterSpacing: '-0.02em',
        color: t.textPrimary
      },
      h6: {
        fontWeight: 700,
        letterSpacing: '-0.01em',
        color: t.textPrimary
      },
      subtitle1: {
        fontWeight: 600,
        color: t.textPrimary
      },
      subtitle2: {
        fontWeight: 600,
        color: t.textSecondary
      },
      body1: {
        fontSize: '0.925rem',
        color: t.textPrimary
      },
      body2: {
        fontSize: '0.85rem',
        color: t.textSecondary
      },
      button: {
        textTransform: 'none',
        fontWeight: 700
      }
    },
    shape: {
      borderRadius: 4
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            boxShadow: 'none',
            fontWeight: 700,
            padding: '8px 18px',
            textTransform: 'none',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              boxShadow: `0 4px 12px -2px ${t.accentBorder}`,
              transform: 'translateY(-1px)'
            }
          },
          containedPrimary: {
            backgroundColor: t.accent,
            color: t.accentContrast,
            fontWeight: 800,
            '&:hover': {
              backgroundColor: t.accentDark,
              color: t.id === 'default' ? '#ffffff' : t.accentContrast
            }
          },
          containedSecondary: {
            backgroundColor: t.sidebarBg,
            color: '#ffffff',
            '&:hover': {
              backgroundColor: t.headerControlHover
            }
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            backgroundColor: t.cardBg,
            border: `1px solid ${t.surfaceBorder}`,
            boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.03)',
            transition: 'all 0.2s ease-in-out'
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 6
          }
        }
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            fontWeight: 600
          }
        }
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            backgroundColor: '#ffffff',
            '& fieldset': {
              borderColor: t.surfaceBorder
            },
            '&:hover fieldset': {
              borderColor: t.textSecondary
            },
            '&.Mui-focused fieldset': {
              borderColor: t.accent,
              borderWidth: '1.5px'
            }
          }
        }
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            borderRadius: 4
          }
        }
      },
      MuiFilledInput: {
        styleOverrides: {
          root: {
            borderRadius: 4
          }
        }
      }
    }
  });
};

export const theme = createAppTheme('default');
export default theme;
