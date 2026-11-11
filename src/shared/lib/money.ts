import Decimal from 'decimal.js'

import type { EthAmount } from '@/api/contracts/marketplace'

Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP })

export function eth(value: Decimal.Value): EthAmount {
  return new Decimal(value).toDecimalPlaces(18).toFixed(18)
}

export function addEth(...values: EthAmount[]): EthAmount {
  return eth(values.reduce((total, value) => total.plus(value), new Decimal(0)))
}

export function multiplyEth(value: EthAmount, multiplier: Decimal.Value): EthAmount {
  return eth(new Decimal(value).times(multiplier))
}

export function subtractEth(left: EthAmount, right: EthAmount): EthAmount {
  return eth(new Decimal(left).minus(right))
}

export function compareEth(left: EthAmount, right: EthAmount): number {
  return new Decimal(left).cmp(new Decimal(right))
}
