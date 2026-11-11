export function formatEth(value: string) {
  return value.replace(/0+$/, '').replace(/\.$/, '')
}
