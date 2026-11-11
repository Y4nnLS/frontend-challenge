import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

import { marketplaceApi } from '@/api/marketplace-api'
import { NftArtwork } from '@/catalog/components/nft-card'
import { formatEth } from '@/catalog/lib/format-eth'
import { NftActions } from '@/marketplace/nft-actions'
import { MarketplaceHeader, MobileAccountNavigation } from '@/shared/components/marketplace-header'

export const Route = createFileRoute('/nft/$slug')({ component: NftDetailPage })

function NftDetailPage() {
  const { slug } = Route.useParams()
  const nftQuery = useQuery({ queryKey: ['nft', slug], queryFn: ({ signal }) => marketplaceApi.getNft(slug, signal), retry: false })
  return <div className="kurio-app"><div className="site-container"><div className="desktop-header"><MarketplaceHeader /></div><MobileAccountNavigation /><main className="detail-page">
    <Link to="/" className="detail-breadcrumb">Início / Mercado</Link>
    {nftQuery.isPending ? <div className="detail-layout" aria-label="Carregando NFT"><div className="detail-art skeleton"/><div className="skeleton">Carregando NFT…</div></div> : nftQuery.isError || !nftQuery.data ? <div className="catalog-message" role="alert"><h1>NFT não encontrado</h1><Link to="/">Voltar ao catálogo</Link></div> : <div className="detail-layout"><div className="detail-art"><NftArtwork nft={nftQuery.data} className="nft-image" /></div><div className="detail-information"><span className="eyebrow">{nftQuery.data.collection}</span><h1>{nftQuery.data.name}</h1><p className="detail-price">{nftQuery.data.editions[0] ? formatEth(nftQuery.data.editions[0].priceEth) : '—'} ETH</p><NftActions nft={nftQuery.data}/><hr/><h2>Sobre este NFT</h2><p>{nftQuery.data.description}</p><h2>Edições</h2><p>{nftQuery.data.editions.map((edition) => edition.name).join(', ')}</p><p className="detail-availability">{nftQuery.data.editions[0]?.available ?? 0} unidades disponíveis</p><Link to="/" className="secondary-button">Continuar explorando</Link></div></div>}
  </main></div></div>
}
