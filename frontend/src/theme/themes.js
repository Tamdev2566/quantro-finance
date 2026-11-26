/**
 * Luxury Color Themes with Marble Shadow Effects
 *
 * 1. Obsidian & Gold (Default)
 * 2. Burgundy & Cream (#6A0D2A & #FFF4E6)
 * 3. Ice Blue & Navy Blue (#0B2343 & #E6F4FF)
 */
export const COLOR_THEMES = {
  default: {
    id: 'default',
    name: 'Obsidian & Gold',
    description: 'Default Quantro executive theme',
    swatches: ['#0c0d14', '#ffffff', '#e5a93c'],
    shellBg: '#0c0d14',
    sidebarBg: 'linear-gradient(180deg, #10111b 0%, #0c0d14 100%)',
    sidebarSolid: '#12131c',
    headerControlBg: 'linear-gradient(145deg, #1a1c29 0%, #141520 100%)',
    headerControlHover: '#1e202f',
    headerBorder: '#232537',
    tableHeaderBg: '#12131c',
    darkCardBg: '#151621',
    sidebarText: '#ffffff',
    sidebarMuted: '#94a3b8',
    canvasGradient: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
    cardGradient: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
    surfaceTint: '#f8fafc',
    surfaceBorder: 'rgba(226, 232, 240, 0.9)',
    textPrimary: '#0f172a',
    textSecondary: '#64748b',
    accent: '#e5a93c',
    accentLight: '#f3c64f',
    accentDark: '#b88019',
    accentContrast: '#0f172a',
    accentSoft: 'rgba(229, 169, 60, 0.15)',
    accentBorder: 'rgba(229, 169, 60, 0.4)'
  },
  burgundy_cream: {
    id: 'burgundy_cream',
    name: 'Burgundy & Cream',
    description: 'Burgundy #6A0D2A • Cream #FFF4E6 • Luxury Gold',
    swatches: ['#6A0D2A', '#FFF4E6', '#D4AF37'],
    shellBg: '#4A071C',
    sidebarBg: 'linear-gradient(180deg, #6A0D2A 0%, #4A071C 100%)',
    sidebarSolid: '#6A0D2A',
    headerControlBg: 'linear-gradient(145deg, #7A1233 0%, #580922 100%)',
    headerControlHover: '#8A173B',
    headerBorder: '#8E1D40',
    tableHeaderBg: '#6A0D2A',
    darkCardBg: '#5A0A23',
    sidebarText: '#FFF4E6',
    sidebarMuted: '#E6C2CE',
    canvasGradient: 'linear-gradient(145deg, #FFFDF9 0%, #FFF4E6 100%)',
    cardGradient: 'linear-gradient(145deg, #FFFFFF 0%, #FFF4E6 100%)',
    surfaceTint: '#FDF0DF',
    surfaceBorder: 'rgba(226, 200, 175, 0.75)',
    textPrimary: '#3D0617',
    textSecondary: '#7A4958',
    accent: '#D4AF37',
    accentLight: '#E8CA64',
    accentDark: '#B38E1E',
    accentContrast: '#2B0410',
    accentSoft: 'rgba(212, 175, 55, 0.18)',
    accentBorder: 'rgba(212, 175, 55, 0.5)'
  },
  ice_navy: {
    id: 'ice_navy',
    name: 'Ice Blue & Navy',
    description: 'Navy Blue #0B2343 • Ice Blue #E6F4FF • Azure',
    swatches: ['#0B2343', '#E6F4FF', '#3898EC'],
    shellBg: '#07172E',
    sidebarBg: 'linear-gradient(180deg, #0B2343 0%, #07172E 100%)',
    sidebarSolid: '#0B2343',
    headerControlBg: 'linear-gradient(145deg, #11315C 0%, #091D38 100%)',
    headerControlHover: '#163D73',
    headerBorder: '#1E467A',
    tableHeaderBg: '#0B2343',
    darkCardBg: '#0E294D',
    sidebarText: '#FFFFFF',
    sidebarMuted: '#A8CBEB',
    canvasGradient: 'linear-gradient(145deg, #F5FAFF 0%, #E6F4FF 100%)',
    cardGradient: 'linear-gradient(145deg, #FFFFFF 0%, #EDF6FF 100%)',
    surfaceTint: '#DCEEFF',
    surfaceBorder: 'rgba(173, 208, 240, 0.85)',
    textPrimary: '#0B2343',
    textSecondary: '#3E5B80',
    accent: '#3898EC',
    accentLight: '#64B2F5',
    accentDark: '#1E78C8',
    accentContrast: '#FFFFFF',
    accentSoft: 'rgba(56, 152, 236, 0.18)',
    accentBorder: 'rgba(56, 152, 236, 0.5)'
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
  root.style.setProperty('--theme-60-sidebar', t.sidebarSolid);
  root.style.setProperty('--theme-30-card', t.cardGradient);
  root.style.setProperty('--theme-30-border', t.surfaceBorder);
  root.style.setProperty('--theme-10', t.accent);
  root.style.setProperty('--theme-10-light', t.accentLight);
  root.style.setProperty('--theme-10-dark', t.accentDark);
  root.style.setProperty('--theme-10-contrast', t.accentContrast);
};
