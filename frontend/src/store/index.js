import { createSlice, configureStore } from '@reduxjs/toolkit';

// Retrieve initial user from session if available
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
    user: initialUser,
    isAuthenticated: Boolean(initialUser),
    currentScreen: 'dashboard',
    activeTab: 0,
    notification: null, // { message, severity: 'success' | 'error' | 'info' | 'warning' }
    dashboardFilter: 'This Financial Year',
    refreshKey: 0,
    company: null,
    themeMode: 'light'
  },
  reducers: {
    loginSuccess: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      try {
        localStorage.setItem('apex_user', JSON.stringify(action.payload));
      } catch (e) {}
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      try {
        localStorage.removeItem('apex_user');
      } catch (e) {}
    },
    setScreen: (state, action) => {
      state.currentScreen = action.payload;
    },
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    setDashboardFilter: (state, action) => {
      state.dashboardFilter = action.payload;
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
    triggerRefresh: (state) => {
      state.refreshKey += 1;
    },
    setCompany: (state, action) => {
      state.company = action.payload;
    },
    toggleThemeMode: (state) => {
      state.themeMode = state.themeMode === 'light' ? 'dark' : 'light';
    }
  }
});

export const {
  loginSuccess,
  logout,
  setScreen,
  setActiveTab,
  setDashboardFilter,
  showNotification,
  clearNotification,
  triggerRefresh,
  setCompany,
  toggleThemeMode
} = financeSlice.actions;

export const store = configureStore({
  reducer: {
    finance: financeSlice.reducer
  }
});

export default store;
