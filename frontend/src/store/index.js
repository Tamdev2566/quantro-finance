import { combineReducers, configureStore } from '@reduxjs/toolkit';
import authReducer, { loginSuccess as authLogin, logout as authLogout } from './slices/authSlice';
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
  setCompany,
  loginSuccess,
  logout
} from './slices/financeSlice';
import { clearPersistedRoute } from '@history';

// Combine child domain slices under parent app reducer
const appReducer = combineReducers({
  auth: authReducer,
  ui: uiReducer,
  finance: financeReducer
});

/**
 * Root Reducer Pattern:
 * On logout, state is reset to `undefined` which forces all combined child slices
 * to return their default pristine initial states in a single atomic action.
 */
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
