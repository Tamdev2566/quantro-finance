import { createSlice } from '@reduxjs/toolkit';

const getInitialColorTheme = () => {
  try {
    return localStorage.getItem('quantro_color_theme') || 'default';
  } catch (e) {
    return 'default';
  }
};

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    currentScreen: 'dashboard',
    activeTab: 0,
    notification: null,
    themeMode: 'light',
    colorTheme: getInitialColorTheme()
  },
  reducers: {
    setScreen: (state, action) => {
      state.currentScreen = action.payload;
    },
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    showNotification: (state, action) => {
      state.notification = {
        message: action.payload.message,
        severity: action.payload.severity || 'info',
        key: Date.now()
      };
    },
    clearNotification: (state) => {
      state.notification = null;
    },
    toggleThemeMode: (state) => {
      state.themeMode = state.themeMode === 'light' ? 'dark' : 'light';
    },
    setColorTheme: (state, action) => {
      state.colorTheme = action.payload;
      try {
        localStorage.setItem('quantro_color_theme', action.payload);
      } catch (e) {}
    }
  }
});

export const {
  setScreen,
  setActiveTab,
  showNotification,
  clearNotification,
  toggleThemeMode,
  setColorTheme
} = uiSlice.actions;

export default uiSlice.reducer;
