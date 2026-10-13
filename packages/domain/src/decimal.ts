import Big from 'big.js';
// A cópia do construtor isola a precisão dos consumidores da biblioteca.
export const Decimal = Big();
Decimal.strict = true;
Decimal.DP = 40;
Decimal.RM = Big.roundHalfUp;
