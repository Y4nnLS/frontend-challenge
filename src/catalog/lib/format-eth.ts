import Decimal from "decimal.js";

export function formatEth(value: string) {
  // Values cross the API boundary as strings.  Never coerce them through
  // JavaScript's binary Number type just to render a label: that was the
  // source of labels such as "1.189999999999999947 ETH" in checkout.
  const normalized = new Decimal(value).toFixed();
  return normalized.includes(".")
    ? normalized.replace(/0+$/, "").replace(/\.$/, "")
    : normalized;
}
