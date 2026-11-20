import jsonStore from '../storage/jsonStore.js';
import auditService from './auditService.js';

class VendorService {
  getAll() {
    return jsonStore.readSync('vendors.json') || [];
  }

  getById(id) {
    const list = this.getAll();
    return list.find((v) => v.id === id);
  }

  async create(data, user = 'System User') {
    if (!data.name) throw new Error('Vendor name is required.');

    return jsonStore.transaction(['vendors.json'], async (tx) => {
      const vendors = tx.get('vendors.json');
      const newVendor = {
        id: `VEND-${Date.now().toString().slice(-4)}`,
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

      vendors.push(newVendor);
      tx.set('vendors.json', vendors);

      await auditService.log({
        user,
        action: 'Create Vendor',
        transactionType: 'VENDOR',
        transactionId: newVendor.id,
        afterValues: newVendor,
        sourceModule: 'Purchases & Payables'
      });

      return newVendor;
    });
  }

  async update(id, data, user = 'System User') {
    return jsonStore.transaction(['vendors.json'], async (tx) => {
      const vendors = tx.get('vendors.json');
      const idx = vendors.findIndex((v) => v.id === id);
      if (idx === -1) throw new Error(`Vendor ${id} not found.`);

      const before = { ...vendors[idx] };
      const updated = {
        ...vendors[idx],
        ...data,
        stateCode: data.stateCode || (data.gstin ? data.gstin.slice(0, 2) : vendors[idx].stateCode)
      };

      vendors[idx] = updated;
      tx.set('vendors.json', vendors);

      await auditService.log({
        user,
        action: 'Update Vendor',
        transactionType: 'VENDOR',
        transactionId: id,
        beforeValues: before,
        afterValues: updated,
        sourceModule: 'Purchases & Payables'
      });

      return updated;
    });
  }
}

export const vendorService = new VendorService();
export default vendorService;
