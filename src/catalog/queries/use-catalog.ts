import { useQuery } from '@tanstack/react-query'
import type { NftListParams } from '@/api/contracts/marketplace'
import { marketplaceApi } from '@/api/marketplace-api'

export const catalogQueryKey = (params: NftListParams) => ['catalog', params] as const

export function useCatalog(params: NftListParams) {
  return useQuery({
    queryKey: catalogQueryKey(params),
    queryFn: ({ signal }) => marketplaceApi.listNfts(params, signal),
    retry: false,
  })
}
