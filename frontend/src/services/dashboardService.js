import httpClient from '../api/client';

export const dashboardService = {
  getDashboard: (params) => httpClient.get('/dashboard', { params })
};

export default dashboardService;
