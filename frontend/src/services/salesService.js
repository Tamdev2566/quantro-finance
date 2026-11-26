import httpClient from '../api/client';

export const salesService = {
  getInvoices: () => httpClient.get('/invoices'),
  getInvoice: (id) => httpClient.get(`/invoices/${id}`),
  createInvoice: (data) => httpClient.post('/invoices', data),
  updateInvoice: (id, data) => httpClient.put(`/invoices/${id}`, data),
  deleteInvoice: (id) => httpClient.delete(`/invoices/${id}`),
  approveInvoice: (id) => httpClient.post(`/invoices/${id}/approve`),
  postInvoice: (id) => httpClient.post(`/invoices/${id}/post`),

  getPayments: () => httpClient.get('/payments'),
  createPayment: (data) => httpClient.post('/payments', data),
  reversePayment: (id, data) => httpClient.post(`/payments/${id}/reverse`, data),

  getCreditNotes: () => httpClient.get('/credit-notes'),
  createCreditNote: (data) => httpClient.post('/credit-notes', data),

  getCustomers: () => httpClient.get('/customers'),
  createCustomer: (data) => httpClient.post('/customers', data),
  updateCustomer: (id, data) => httpClient.put(`/customers/${id}`, data)
};

export default salesService;
