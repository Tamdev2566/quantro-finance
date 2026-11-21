import { combineReducers, configureStore } from '@reduxjs/toolkit';
import authReducer, { loginSuccess, logout } from './slices/authSlice';
import uiReducer, {
  setScreen,
  setActiveTab,
  showNotification,
  clearNotification,
  toggleThemeMode
} from './slices/uiSlice';
import financeReducer, {
  setDashboardFilter,
  triggerRefresh,
  setCompany
} from './slices/financeSlice';
import { clearPersistedRoute } from '@history';

const appReducer = combineReducers({
  auth: authReducer,
  ui: uiReducer,
  finance: financeReducer
});

export const rootReducer = (state, action) => {
  if (
    action.type === 'auth/logout' ||
    action.type === 'finance/logout' ||
    action.type === 'USER_LOGOUT' ||
    action.type === 'RESET_STORE'
  ) {
    try {
      localStorage.removeItem('apex_user');
      clearPersistedRoute();
    } catch (e) {}
    state = undefined;
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer
});

export const resetStore = () => ({ type: 'RESET_STORE' });

export {
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
};

export default store;
