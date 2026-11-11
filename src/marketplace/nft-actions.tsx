import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import type { Nft } from '@/api/contracts/marketplace'
import { marketplaceApi } from '@/api/marketplace-api'
import { privateKey, useSession } from '@/auth/session-context'
import { apiErrorMessage } from '@/shared/lib/api-error'
import { CartIcon, HeartIcon } from '@/shared/components/icons'

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
    <div className="edition-selector"><span>Edição:</span>{nft.editions.map((item) => <button key={item.id} type="button" className={item.id === editionId ? 'selected' : ''} onClick={() => { setEditionId(item.id); setQuantity(1) }} disabled={item.available < 1}>{item.name}</button>)}</div>
    <div className="quantity-row"><span>Qtd.</span><button type="button" aria-label="Diminuir quantidade" disabled={quantity <= 1} onClick={() => setQuantity(quantity - 1)}>−</button><span aria-label="Quantidade">{quantity}</span><button type="button" aria-label="Aumentar quantidade" disabled={!edition || quantity >= edition.available} onClick={() => setQuantity(quantity + 1)}>+</button><strong>{edition ? `${edition.priceEth} ETH` : '—'}</strong></div>
    <div><button type="button" className="primary-button" aria-label="Adicionar ao carrinho" disabled={!edition || edition.available < 1 || cartMutation.isPending} onClick={() => cartMutation.mutate()}>{cartMutation.isPending ? 'Adicionando…' : <><CartIcon/>Comprar NFT</>}</button><button type="button" className="secondary-button favorite-button" aria-pressed={favorite} onClick={toggleFavorite}><HeartIcon/>{favorite ? 'Remover favorito' : 'Favoritar'}</button></div>
    {notice && <p role="status" className="mutation-notice">{notice}</p>}
  </section>
}
