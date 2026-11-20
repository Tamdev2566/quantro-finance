import { toDecimal, multiply, divide, subtract, add, roundCurrency, roundNumber } from './currency.js';
import jsonStore from '../storage/jsonStore.js';

class TaxEngine {
  /**
   * Determine tax type: Intra-state (CGST+SGST) or Inter-state (IGST)
   */
  determineTaxType(partyStateCode, companyStateCode = null) {
    if (!companyStateCode) {
      const company = jsonStore.readSync('company.json');
      companyStateCode = company.stateCode || '27';
    }

    if (!partyStateCode) {
      // Default to intra-state if not specified
      return 'INTRA';
    }

    const normParty = String(partyStateCode).trim();
    const normCompany = String(companyStateCode).trim();

    return normParty === normCompany ? 'INTRA' : 'INTER';
  }

  /**
   * Calculate line item tax with decimal-safe precision
   * supports taxInclusive vs taxExclusive
   */
  calculateLineTax({
    quantity,
    unitPrice,
    discountPercent = 0,
    discountAmount = 0,
    taxRate = 18,
    isTaxInclusive = false,
    taxExempt = false,
    isInterState = false
  }) {
    const qty = toDecimal(quantity);
    const price = toDecimal(unitPrice);
    const lineTotal = multiply(qty, price);

    let disc = toDecimal(0);
    if (discountPercent > 0) {
      disc = divide(multiply(lineTotal, discountPercent), 100);
    } else if (discountAmount > 0) {
      disc = toDecimal(discountAmount);
    }
    if (disc.isGreaterThan(lineTotal)) {
      disc = lineTotal;
    }

    const netBeforeTax = subtract(lineTotal, disc);

    if (taxExempt || taxRate === 0) {
      return {
        lineTotal: roundNumber(lineTotal),
        discountAmount: roundNumber(disc),
        taxableAmount: roundNumber(netBeforeTax),
        taxRate: 0,
        cgstRate: 0,
        sgstRate: 0,
        igstRate: 0,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
        totalTax: 0,
        totalAmount: roundNumber(netBeforeTax)
      };
    }

    const rate = toDecimal(taxRate);
    let taxableAmount;
    let totalTax;

    if (isTaxInclusive) {
      // Taxable = Net / (1 + Rate / 100)
      const factor = add(1, divide(rate, 100));
      taxableAmount = divide(netBeforeTax, factor);
      totalTax = subtract(netBeforeTax, taxableAmount);
    } else {
      taxableAmount = netBeforeTax;
      totalTax = divide(multiply(taxableAmount, rate), 100);
    }

    let cgstRate = 0;
    let sgstRate = 0;
    let igstRate = 0;
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (isInterState) {
      igstRate = taxRate;
      igstAmount = roundNumber(totalTax);
    } else {
      cgstRate = roundNumber(divide(rate, 2), 2);
      sgstRate = cgstRate;
      const halfTax = divide(totalTax, 2);
      cgstAmount = roundNumber(halfTax);
      sgstAmount = roundNumber(halfTax);
      totalTax = add(cgstAmount, sgstAmount);
    }

    const finalTax = isInterState ? igstAmount : add(cgstAmount, sgstAmount).toNumber();
    const grandTotal = isTaxInclusive
      ? roundNumber(netBeforeTax)
      : roundNumber(add(taxableAmount, finalTax));

    return {
      lineTotal: roundNumber(lineTotal),
      discountAmount: roundNumber(disc),
      taxableAmount: roundNumber(taxableAmount),
      taxRate: Number(taxRate),
      cgstRate,
      sgstRate,
      igstRate,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalTax: roundNumber(finalTax),
      totalAmount: grandTotal
    };
  }

  /**
   * Calculate full document (Invoice/Bill) taxes across all items
   */
  calculateDocumentTotals({
    items = [],
    partyStateCode,
    companyStateCode,
    isTaxInclusive = false,
    otherCharges = 0
  }) {
    const taxType = this.determineTaxType(partyStateCode, companyStateCode);
    const isInterState = taxType === 'INTER';

    let subtotal = toDecimal(0);
    let totalDiscount = toDecimal(0);
    let taxableTotal = toDecimal(0);
    let cgstTotal = toDecimal(0);
    let sgstTotal = toDecimal(0);
    let igstTotal = toDecimal(0);
    let totalTax = toDecimal(0);
    let grandTotal = toDecimal(0);

    const calculatedItems = items.map((item) => {
      const line = this.calculateLineTax({
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent || 0,
        discountAmount: item.discountAmount || 0,
        taxRate: item.taxRate !== undefined ? item.taxRate : 18,
        isTaxInclusive,
        taxExempt: Boolean(item.taxExempt),
        isInterState
      });

      subtotal = add(subtotal, line.lineTotal);
      totalDiscount = add(totalDiscount, line.discountAmount);
      taxableTotal = add(taxableTotal, line.taxableAmount);
      cgstTotal = add(cgstTotal, line.cgstAmount);
      sgstTotal = add(sgstTotal, line.sgstAmount);
      igstTotal = add(igstTotal, line.igstAmount);
      totalTax = add(totalTax, line.totalTax);
      grandTotal = add(grandTotal, line.totalAmount);

      return {
        ...item,
        ...line
      };
    });

    const other = toDecimal(otherCharges || 0);
    grandTotal = add(grandTotal, other);

    return {
      taxType,
      isInterState,
      items: calculatedItems,
      subtotal: roundNumber(subtotal),
      totalDiscount: roundNumber(totalDiscount),
      taxableTotal: roundNumber(taxableTotal),
      cgstTotal: roundNumber(cgstTotal),
      sgstTotal: roundNumber(sgstTotal),
      igstTotal: roundNumber(igstTotal),
      totalTax: roundNumber(totalTax),
      otherCharges: roundNumber(other),
      grandTotal: roundNumber(grandTotal)
    };
  }
}

export const taxEngine = new TaxEngine();
export default taxEngine;
