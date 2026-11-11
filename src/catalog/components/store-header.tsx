import { MarketplaceHeader } from '@/shared/components/marketplace-header'

export { SearchIcon } from '@/shared/components/icons'

/** @deprecated Use MarketplaceHeader. Retained for existing consumers. */
export function StoreHeader({ onSearch }: { onSearch?: () => void }) {
  return <MarketplaceHeader onSearch={onSearch}/>
}
