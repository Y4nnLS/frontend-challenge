import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import type { Nft } from '@/api/contracts/marketplace'
import { marketplaceApi } from '@/api/marketplace-api'
import { privateKey, useSession } from '@/auth/session-context'
import { apiErrorMessage } from '@/shared/lib/api-error'

export function NftActions({ nft }: { nft: Nft }) {
  const { session } = useSession(); const navigate = useNavigate(); const queryClient = useQueryClient()
  const [editionId, setEditionId] = useState(nft.editions[0]?.id ?? '')
  const [quantity, setQuantity] = useState(1); const [notice, setNotice] = useState('')
  const edition = nft.editions.find((item) => item.id === editionId)
  const favorites = useQuery({ queryKey: session ? privateKey(session.user.id, 'favorites') : ['favorites', 'anonymous'], queryFn: marketplaceApi.favorites, enabled: Boolean(session), retry: false })
  const favorite = favorites.data?.some((item) => item.nftId === nft.id) ?? false
  const favoriteMutation = useMutation({
    mutationFn: () => favorite ? marketplaceApi.removeFavorite(nft.id) : marketplaceApi.addFavorite(nft.id),
    onSuccess: (data) => { if (session) queryClient.setQueryData(privateKey(session.user.id, 'favorites'), data) },
    onError: (error) => setNotice(apiErrorMessage(error)),
  })
  const cartMutation = useMutation({
    mutationFn: () => marketplaceApi.setCartItem({ nftId: nft.id, editionId, quantity }),
    onSuccess: async (cart) => { if (session) queryClient.setQueryData(privateKey(session.user.id, 'cart'), cart); setNotice('NFT adicionado ao carrinho.') },
    onError: (error) => setNotice(apiErrorMessage(error)),
  })
  const toggleFavorite = () => { if (!session) { void navigate({ to: '/login', search: { returnTo: location.pathname } }); return }; favoriteMutation.mutate() }
  return <section className="nft-actions" aria-label="Comprar NFT">
    <label>Edição<select value={editionId} onChange={(event) => { setEditionId(event.target.value); setQuantity(1) }}>{nft.editions.map((item) => <option key={item.id} value={item.id}>{item.name} — {item.available} disponíveis</option>)}</select></label>
    <label>Quantidade<input aria-label="Quantidade" type="number" min={1} max={edition?.available ?? 1} value={quantity} onChange={(event) => setQuantity(Math.max(1, Math.min(edition?.available ?? 1, Number(event.target.value) || 1)))} /></label>
    <div><button type="button" className="primary-button" disabled={!edition || edition.available < 1 || cartMutation.isPending} onClick={() => cartMutation.mutate()}>{cartMutation.isPending ? 'Adicionando…' : 'Adicionar ao carrinho'}</button><button type="button" className="secondary-button" aria-pressed={favorite} onClick={toggleFavorite}>{favorite ? 'Remover favorito' : 'Favoritar'}</button></div>
    {notice && <p role="status" className="mutation-notice">{notice}</p>}
  </section>
}
