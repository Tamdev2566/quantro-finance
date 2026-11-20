import { createSlice } from '@reduxjs/toolkit';

let initialUser = null;
try {
  const saved = localStorage.getItem('apex_user');
  if (saved) {
    initialUser = JSON.parse(saved);
  }
} catch (e) {
  initialUser = null;
}

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: initialUser,
    isAuthenticated: Boolean(initialUser),
    token: null
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
      state.token = null;
      try {
        localStorage.removeItem('apex_user');
      } catch (e) {}
    }
  }
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
