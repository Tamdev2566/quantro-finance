import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    currentScreen: 'dashboard',
    activeTab: 0,
    notification: null,
    themeMode: 'light'
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
    }
  }
});

export const {
  setScreen,
  setActiveTab,
  showNotification,
  clearNotification,
  toggleThemeMode
} = uiSlice.actions;

export default uiSlice.reducer;
