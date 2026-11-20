import jsonStore from '../storage/jsonStore.js';
import auditService from './auditService.js';
import { v4 as uuidv4 } from 'uuid';

class CustomerService {
  getAll() {
    return jsonStore.readSync('customers.json') || [];
  }

  getById(id) {
    const list = this.getAll();
    return list.find((c) => c.id === id);
  }

  async create(data, user = 'System User') {
    if (!data.name) throw new Error('Customer name is required.');

    return jsonStore.transaction(['customers.json'], async (tx) => {
      const customers = tx.get('customers.json');
      const newCustomer = {
        id: `CUST-${Date.now().toString().slice(-4)}`,
        name: data.name.trim(),
        contactPerson: data.contactPerson || '',
        email: data.email || '',
        phone: data.phone || '',
        gstin: data.gstin ? data.gstin.trim().toUpperCase() : '',
        state: data.state || 'Maharashtra',
        stateCode: data.stateCode || (data.gstin ? data.gstin.slice(0, 2) : '27'),
        address: data.address || '',
        balance: 0,
        isActive: data.isActive !== undefined ? data.isActive : true
      };

      customers.push(newCustomer);
      tx.set('customers.json', customers);

      await auditService.log({
        user,
        action: 'Create Customer',
        transactionType: 'CUSTOMER',
        transactionId: newCustomer.id,
        afterValues: newCustomer,
        sourceModule: 'Sales & Receivables'
      });

      return newCustomer;
    });
  }

  async update(id, data, user = 'System User') {
    return jsonStore.transaction(['customers.json'], async (tx) => {
      const customers = tx.get('customers.json');
      const idx = customers.findIndex((c) => c.id === id);
      if (idx === -1) throw new Error(`Customer ${id} not found.`);

      const before = { ...customers[idx] };
      const updated = {
        ...customers[idx],
        ...data,
        stateCode: data.stateCode || (data.gstin ? data.gstin.slice(0, 2) : customers[idx].stateCode)
      };

      customers[idx] = updated;
      tx.set('customers.json', customers);

      await auditService.log({
        user,
        action: 'Update Customer',
        transactionType: 'CUSTOMER',
        transactionId: id,
        beforeValues: before,
        afterValues: updated,
        sourceModule: 'Sales & Receivables'
      });

      return updated;
    });
  }
}

export const customerService = new CustomerService();
export default customerService;
