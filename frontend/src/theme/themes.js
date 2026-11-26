/**
 * 60-30-10 Color Theme Definitions for Quantro Finance
 *
 * 60% -> Primary Shell, Sidebar, Header, Dark Table Headers
 * 30% -> Secondary Workspace Canvas, Cards, Subtle Surfaces
 * 10% -> Accent Buttons, Active Highlights, Badges, Focus Rings
 */
export const COLOR_THEMES = {
  default: {
    id: 'default',
    name: 'Obsidian & Gold',
    description: 'Default Quantro executive theme',
    swatches: ['#0c0d14', '#ffffff', '#e5a93c'],
    // 60% Primary Shell
    shellBg: '#0c0d14',
    sidebarBg: '#12131c',
    headerControlBg: '#161722',
    headerControlHover: '#1e202f',
    headerBorder: '#232537',
    tableHeaderBg: '#12131c',
    darkCardBg: '#151621',
    sidebarText: '#ffffff',
    sidebarMuted: '#94a3b8',
    // 30% Secondary Canvas
    canvasBg: '#ffffff',
    cardBg: '#ffffff',
    surfaceTint: '#f8fafc',
    surfaceBorder: '#e2e8f0',
    textPrimary: '#0f172a',
    textSecondary: '#64748b',
    // 10% Accent
    accent: '#e5a93c',
    accentLight: '#f3c64f',
    accentDark: '#b88019',
    accentContrast: '#0f172a',
    accentSoft: 'rgba(229, 169, 60, 0.15)',
    accentBorder: 'rgba(229, 169, 60, 0.4)'
  },
  royal_blue: {
    id: 'royal_blue',
    name: 'Royal Blue & Sunshine',
    description: 'Royal Blue 60% • Pure White 30% • Sunshine Yellow 10%',
    swatches: ['#02167F', '#FFFFFF', '#FFD014'],
    // 60% Primary Royal Blue
    shellBg: '#02167F',
    sidebarBg: '#02167F',
    headerControlBg: '#041E9E',
    headerControlHover: '#0626BD',
    headerBorder: '#1A34B8',
    tableHeaderBg: '#02167F',
    darkCardBg: '#031A8C',
    sidebarText: '#ffffff',
    sidebarMuted: '#B8C6FF',
    // 30% Secondary Pure White
    canvasBg: '#FFFFFF',
    cardBg: '#FFFFFF',
    surfaceTint: '#F4F7FF',
    surfaceBorder: '#DCE3F9',
    textPrimary: '#021059',
    textSecondary: '#475569',
    // 10% Accent Sunshine Yellow
    accent: '#FFD014',
    accentLight: '#FFE052',
    accentDark: '#E5B800',
    accentContrast: '#02167F',
    accentSoft: 'rgba(255, 208, 20, 0.18)',
    accentBorder: 'rgba(255, 208, 20, 0.55)'
  },
  deep_purple: {
    id: 'deep_purple',
    name: 'Deep Purple & Cream',
    description: 'Deep Purple 60% • Warm Cream 30% • Soft Lavender 10%',
    swatches: ['#210D35', '#FFF7F3', '#D0ADFF'],
    // 60% Primary Deep Purple
    shellBg: '#210D35',
    sidebarBg: '#210D35',
    headerControlBg: '#2E144A',
    headerControlHover: '#3B1A5E',
    headerBorder: '#432069',
    tableHeaderBg: '#210D35',
    darkCardBg: '#291042',
    sidebarText: '#FFF7F3',
    sidebarMuted: '#C9B3E0',
    // 30% Secondary Warm Cream
    canvasBg: '#FFF7F3',
    cardBg: '#FFF7F3',
    surfaceTint: '#FCEEE7',
    surfaceBorder: '#E8D5CD',
    textPrimary: '#210D35',
    textSecondary: '#6B527A',
    // 10% Accent Soft Lavender
    accent: '#D0ADFF',
    accentLight: '#E3CCFF',
    accentDark: '#B382F5',
    accentContrast: '#210D35',
    accentSoft: 'rgba(208, 173, 255, 0.2)',
    accentBorder: 'rgba(208, 173, 255, 0.55)'
  },
  midnight_navy: {
    id: 'midnight_navy',
    name: 'Midnight Navy & Sunflower',
    description: 'Midnight Navy 60% • Powder Blue 30% • Sunflower Yellow 10%',
    swatches: ['#131D38', '#ADC7E9', '#FFC20D'],
    // 60% Primary Midnight Navy
    shellBg: '#131D38',
    sidebarBg: '#131D38',
    headerControlBg: '#1C294D',
    headerControlHover: '#243563',
    headerBorder: '#2D4073',
    tableHeaderBg: '#131D38',
    darkCardBg: '#182445',
    sidebarText: '#ffffff',
    sidebarMuted: '#ADC7E9',
    // 30% Secondary Powder Blue
    canvasBg: '#EBF2FB',
    cardBg: '#FFFFFF',
    surfaceTint: '#DCE8F8',
    surfaceBorder: '#ADC7E9',
    textPrimary: '#131D38',
    textSecondary: '#3E5173',
    // 10% Accent Sunflower Yellow
    accent: '#FFC20D',
    accentLight: '#FFD24D',
    accentDark: '#E0A800',
    accentContrast: '#131D38',
    accentSoft: 'rgba(255, 194, 13, 0.18)',
    accentBorder: 'rgba(255, 194, 13, 0.55)'
  }
};

export const THEME_LIST = Object.values(COLOR_THEMES);

export const getThemeConfig = (themeId) => {
  return COLOR_THEMES[themeId] || COLOR_THEMES.default;
};

export const applyThemeCssVars = (themeId) => {
  if (typeof document === 'undefined') return;
  const t = getThemeConfig(themeId);
  const root = document.documentElement;
  root.style.setProperty('--theme-60', t.shellBg);
  root.style.setProperty('--theme-60-sidebar', t.sidebarBg);
  root.style.setProperty('--theme-30', t.canvasBg);
  root.style.setProperty('--theme-30-card', t.cardBg);
  root.style.setProperty('--theme-30-tint', t.surfaceTint);
  root.style.setProperty('--theme-30-border', t.surfaceBorder);
  root.style.setProperty('--theme-10', t.accent);
  root.style.setProperty('--theme-10-light', t.accentLight);
  root.style.setProperty('--theme-10-dark', t.accentDark);
  root.style.setProperty('--theme-10-contrast', t.accentContrast);
};
