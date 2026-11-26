import httpClient from '../api/client';

export const authService = {
  login: (data) => httpClient.post('/auth/login', data),
  changePassword: (data) => httpClient.post('/auth/change-password', data),
  getAuthUsers: () => httpClient.get('/auth/users'),
  logout: () => httpClient.post('/auth/logout'),
  setAuthUser: (user) => httpClient.setAuthUser(user)
};

export default authService;
