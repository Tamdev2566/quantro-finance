import { createSlice } from '@reduxjs/toolkit';
import { loginSuccess, logout } from './authSlice';

let initialUser = null;
try {
  const saved = localStorage.getItem('apex_user');
  if (saved) {
    initialUser = JSON.parse(saved);
  }
} catch (e) {
  initialUser = null;
}

const financeSlice = createSlice({
  name: 'finance',
  initialState: {
    dashboardFilter: 'This Financial Year',
    refreshKey: 0,
    company: null,
    user: initialUser,
    isAuthenticated: Boolean(initialUser),
    notification: null,
    currentScreen: 'dashboard',
    activeTab: 0,
    themeMode: 'light'
  },
  reducers: {
    setDashboardFilter: (state, action) => {
      state.dashboardFilter = action.payload;
    },
    triggerRefresh: (state) => {
      state.refreshKey += 1;
    },
    setCompany: (state, action) => {
      state.company = action.payload;
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
    setScreen: (state, action) => {
      state.currentScreen = action.payload;
    },
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    toggleThemeMode: (state) => {
      state.themeMode = state.themeMode === 'light' ? 'dark' : 'light';
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginSuccess, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(logout, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      });
  }
});

export const {
  setDashboardFilter,
  triggerRefresh,
  setCompany,
  showNotification,
  clearNotification,
  setScreen,
  setActiveTab,
  toggleThemeMode
} = financeSlice.actions;

export default financeSlice.reducer;
