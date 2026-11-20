import jsonStore from '../storage/jsonStore.js';
import { v4 as uuidv4 } from 'uuid';

class AuditService {
  async log({
    user = 'System User',
    action,
    transactionType,
    transactionId,
    beforeValues = null,
    afterValues = null,
    reason = '',
    sourceModule = 'Finance'
  }) {
    const entry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      user,
      action,
      transactionType,
      transactionId,
      beforeValues: beforeValues ? JSON.parse(JSON.stringify(beforeValues)) : null,
      afterValues: afterValues ? JSON.parse(JSON.stringify(afterValues)) : null,
      reason,
      sourceModule
    };

    return jsonStore.runExclusive(async () => {
      const logs = jsonStore.readSync('audit_logs.json') || [];
      logs.unshift(entry); // Most recent first
      jsonStore.writeSync('audit_logs.json', logs);
      return entry;
    });
  }

  getLogs({ transactionId = null, transactionType = null, limit = 100 } = {}) {
    let logs = jsonStore.readSync('audit_logs.json') || [];
    if (transactionId) {
      logs = logs.filter((l) => l.transactionId === transactionId);
    }
    if (transactionType) {
      logs = logs.filter((l) => l.transactionType === transactionType);
    }
    return logs.slice(0, limit);
  }
}

export const auditService = new AuditService();
export default auditService;
