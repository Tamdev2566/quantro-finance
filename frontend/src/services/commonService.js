import httpClient from '../api/client';

export const commonService = {
  autocomplete: (params) => httpClient.get('/autocomplete', { params })
};

export default commonService;
