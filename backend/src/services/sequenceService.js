import jsonStore from '../storage/jsonStore.js';

class SequenceService {
  async getNextNumber(prefix, year = null) {
    const currentYear = year || new Date().getFullYear().toString();
    const sequenceKey = `${prefix}_${currentYear}`;

    return jsonStore.runExclusive(async () => {
      const sequences = jsonStore.readSync('transaction_sequences.json');
      const currentVal = sequences[sequenceKey] || sequences[prefix] || 0;
      const nextVal = currentVal + 1;
      sequences[sequenceKey] = nextVal;
      sequences[prefix] = nextVal;
      jsonStore.writeSync('transaction_sequences.json', sequences);

      const padded = String(nextVal).padStart(6, '0');
      return `${prefix}-${currentYear}-${padded}`;
    });
  }
}

export const sequenceService = new SequenceService();
export default sequenceService;
