import jsonStore from '../storage/jsonStore.js';
import auditService from './auditService.js';
import { roundNumber } from '../accounting/currency.js';

class AccountService {
  getAll() {
    return jsonStore.readSync('accounts.json') || [];
  }

  getByCode(code) {
    const accounts = this.getAll();
    return accounts.find((a) => a.code === code);
  }

  async create(accountData, user = 'System User') {
    if (!accountData.code || !accountData.name || !accountData.type || !accountData.category) {
      throw new Error('Account code, name, type, and category are required.');
    }

    return jsonStore.transaction(['accounts.json'], async (tx) => {
      const accounts = tx.get('accounts.json');
      if (accounts.some((a) => a.code === accountData.code)) {
        throw new Error(`Account code '${accountData.code}' already exists.`);
      }

      const newAccount = {
        code: accountData.code.trim(),
        name: accountData.name.trim(),
        type: accountData.type,
        category: accountData.category,
        description: accountData.description || '',
        parentAccountCode: accountData.parentAccountCode || null,
        isActive: accountData.isActive !== undefined ? accountData.isActive : true,
        isSystem: false,
        openingBalance: roundNumber(accountData.openingBalance || 0),
        currentBalance: roundNumber(accountData.openingBalance || 0)
      };

      accounts.push(newAccount);
      tx.set('accounts.json', accounts);

      await auditService.log({
        user,
        action: 'Create Account',
        transactionType: 'CHART_OF_ACCOUNTS',
        transactionId: newAccount.code,
        afterValues: newAccount,
        sourceModule: 'Accounting'
      });

      return newAccount;
    });
  }

  async update(code, updateData, user = 'System User') {
    return jsonStore.transaction(['accounts.json'], async (tx) => {
      const accounts = tx.get('accounts.json');
      const idx = accounts.findIndex((a) => a.code === code);
      if (idx === -1) {
        throw new Error(`Account with code '${code}' not found.`);
      }

      const existing = accounts[idx];
      const before = { ...existing };

      // Update allowed fields
      if (updateData.name) existing.name = updateData.name.trim();
      if (updateData.description !== undefined) existing.description = updateData.description;
      if (updateData.parentAccountCode !== undefined) existing.parentAccountCode = updateData.parentAccountCode;
      if (updateData.isActive !== undefined) existing.isActive = Boolean(updateData.isActive);

      // Only allow type/category edit if not a system account
      if (!existing.isSystem) {
        if (updateData.type) existing.type = updateData.type;
        if (updateData.category) existing.category = updateData.category;
      }

      accounts[idx] = existing;
      tx.set('accounts.json', accounts);

      await auditService.log({
        user,
        action: 'Update Account',
        transactionType: 'CHART_OF_ACCOUNTS',
        transactionId: existing.code,
        beforeValues: before,
        afterValues: existing,
        sourceModule: 'Accounting'
      });

      return existing;
    });
  }

  async toggleActive(code, isActive, user = 'System User') {
    return this.update(code, { isActive }, user);
  }

  async deleteAccount(code, user = 'System User') {
    return jsonStore.transaction(['accounts.json', 'journal_entries.json'], async (tx) => {
      const accounts = tx.get('accounts.json');
      const idx = accounts.findIndex((a) => a.code === code);
      if (idx === -1) {
        throw new Error(`Account '${code}' not found.`);
      }

      const acc = accounts[idx];
      if (acc.isSystem) {
        throw new Error(`System account '${acc.name}' cannot be deleted.`);
      }

      // Check if account has ever been used in journal entries
      const journals = tx.get('journal_entries.json');
      const isUsed = journals.some((j) =>
        (j.lines || []).some((l) => l.accountCode === code)
      );

      if (isUsed) {
        throw new Error(`Cannot delete account '${acc.name}' because it has existing financial transactions. You can deactivate it instead.`);
      }

      accounts.splice(idx, 1);
      tx.set('accounts.json', accounts);

      await auditService.log({
        user,
        action: 'Delete Account',
        transactionType: 'CHART_OF_ACCOUNTS',
        transactionId: code,
        beforeValues: acc,
        sourceModule: 'Accounting'
      });

      return { success: true, message: `Account ${code} deleted successfully.` };
    });
  }
}

export const accountService = new AccountService();
export default accountService;
