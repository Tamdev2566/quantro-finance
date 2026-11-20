import BigNumber from 'bignumber.js';

BigNumber.config({
  DECIMAL_PLACES: 4,
  ROUNDING_MODE: BigNumber.ROUND_HALF_UP,
  EXPONENTIAL_AT: [-10, 20]
});

export const toDecimal = (val) => new BigNumber(val || 0);

export const roundCurrency = (val, decimals = 2) => {
  return new BigNumber(val || 0).toFixed(decimals);
};

export const roundNumber = (val, decimals = 2) => {
  return parseFloat(new BigNumber(val || 0).toFixed(decimals));
};

export const add = (...values) => {
  return values.reduce((sum, v) => sum.plus(new BigNumber(v || 0)), new BigNumber(0));
};

export const subtract = (a, b) => {
  return new BigNumber(a || 0).minus(new BigNumber(b || 0));
};

export const multiply = (a, b) => {
  return new BigNumber(a || 0).multipliedBy(new BigNumber(b || 0));
};

export const divide = (a, b) => {
  const divisor = new BigNumber(b || 0);
  if (divisor.isZero()) return new BigNumber(0);
  return new BigNumber(a || 0).dividedBy(divisor);
};

export const isZero = (val) => new BigNumber(val || 0).isZero();
export const isGreaterThan = (a, b) => new BigNumber(a || 0).isGreaterThan(new BigNumber(b || 0));
export const isGreaterThanOrEqualTo = (a, b) => new BigNumber(a || 0).isGreaterThanOrEqualTo(new BigNumber(b || 0));
export const isLessThan = (a, b) => new BigNumber(a || 0).isLessThan(new BigNumber(b || 0));
export const isEqualTo = (a, b) => new BigNumber(a || 0).isEqualTo(new BigNumber(b || 0));

export default {
  toDecimal,
  roundCurrency,
  roundNumber,
  add,
  subtract,
  multiply,
  divide,
  isZero,
  isGreaterThan,
  isGreaterThanOrEqualTo,
  isLessThan,
  isEqualTo
};
