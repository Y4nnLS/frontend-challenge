import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

import { marketplaceApi } from '@/api/marketplace-api'
import { NftArtwork } from '@/catalog/components/nft-card'
import { formatEth } from '@/catalog/lib/format-eth'
import { NftActions } from '@/marketplace/nft-actions'
import { MarketplaceHeader, MobileAccountNavigation } from '@/shared/components/marketplace-header'
import { HeartIcon, SearchIcon } from '@/shared/components/icons'

export const Route = createFileRoute('/nft/$slug')({ component: NftDetailPage })

function NftDetailPage() {
  const { slug } = Route.useParams()
  const nftQuery = useQuery({ queryKey: ['nft', slug], queryFn: ({ signal }) => marketplaceApi.getNft(slug, signal), retry: false })
  return <div className="kurio-app"><div className="site-container"><div className="desktop-header"><MarketplaceHeader /></div><MobileAccountNavigation /><main className="detail-page">
    <Link to="/" className="detail-breadcrumb">Início / Mercado</Link>
    {nftQuery.isPending ? <div className="detail-layout" aria-label="Carregando NFT"><div className="detail-art skeleton"/><div className="skeleton">Carregando NFT…</div></div> : nftQuery.isError || !nftQuery.data ? <div className="catalog-message" role="alert"><h1>NFT não encontrado</h1><Link to="/">Voltar ao catálogo</Link></div> : <><div className="detail-mobile-actions"><Link to="/" aria-label="Voltar">‹</Link><a href="#purchase-actions" aria-label="Ir para ações de favorito"><HeartIcon/></a></div><div className="detail-layout"><div className="detail-gallery"><div className="detail-thumbnails">{Array.from({ length: 4 }, (_, index) => <button type="button" aria-label={`Visualização ${index + 1}`} className={index === 0 ? 'active' : ''} key={index}><NftArtwork nft={nftQuery.data}/></button>)}</div><div className="detail-art"><NftArtwork nft={nftQuery.data} className="nft-image" /><SearchIcon className="detail-zoom"/></div></div><div className="detail-information"><span className="eyebrow">{nftQuery.data.collection}</span><h1>{nftQuery.data.name}</h1><div className="detail-price-line"><p className="detail-price">{nftQuery.data.editions[0] ? formatEth(nftQuery.data.editions[0].priceEth) : '—'} ETH</p><span>★ 4.8 (19)</span></div><h2>Sobre este NFT:</h2><p>{nftQuery.data.description}</p><div id="purchase-actions"><NftActions nft={nftQuery.data}/></div><p>Token: {nftQuery.data.id.replace('nft-', '#')}</p><p className="detail-availability">{nftQuery.data.editions[0]?.available ?? 0} unidades disponíveis</p></div></div><section className="detail-description"><h2>Detalhes do NFT</h2><p>{nftQuery.data.description}</p><p>Rede: Ethereum com procedência registrada nos metadados do token.</p></section></>}
  </main></div></div>
}
