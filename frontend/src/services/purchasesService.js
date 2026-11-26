import httpClient from '../api/client';

export const purchasesService = {
  getVendorBills: () => httpClient.get('/vendor-bills'),
  getVendorBill: (id) => httpClient.get(`/vendor-bills/${id}`),
  createVendorBill: (data) => httpClient.post('/vendor-bills', data),
  approveVendorBill: (id) => httpClient.post(`/vendor-bills/${id}/approve`),
  postVendorBill: (id) => httpClient.post(`/vendor-bills/${id}/post`),

  getVendorPayments: () => httpClient.get('/vendor-payments'),
  createVendorPayment: (data) => httpClient.post('/vendor-payments', data),
  reverseVendorPayment: (id, data) => httpClient.post(`/vendor-payments/${id}/reverse`, data),

  getDebitNotes: () => httpClient.get('/debit-notes'),
  createDebitNote: (data) => httpClient.post('/debit-notes', data),

  getVendors: () => httpClient.get('/vendors'),
  createVendor: (data) => httpClient.post('/vendors', data),
  updateVendor: (id, data) => httpClient.put(`/vendors/${id}`, data)
};

export default purchasesService;
