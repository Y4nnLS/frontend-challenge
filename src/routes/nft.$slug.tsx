import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

import { marketplaceApi } from '@/api/marketplace-api'
import { NftArtwork } from '@/catalog/components/nft-card'
import { NftCard } from '@/catalog/components/nft-card'
import { formatEth } from '@/catalog/lib/format-eth'
import { useCatalog } from '@/catalog/queries/use-catalog'
import { NftActions } from '@/marketplace/nft-actions'
import { MarketplaceFooter } from '@/shared/components/marketplace-footer'
import { MarketplaceHeader, MobileAccountNavigation } from '@/shared/components/marketplace-header'
import { HeartIcon, SearchIcon } from '@/shared/components/icons'

export const Route = createFileRoute('/nft/$slug')({ component: NftDetailPage })

function NftDetailPage() {
  const { slug } = Route.useParams()
  const nftQuery = useQuery({ queryKey: ['nft', slug], queryFn: ({ signal }) => marketplaceApi.getNft(slug, signal), retry: false })
  const collectionQuery = useCatalog({ page: 1, pageSize: 4, sort: 'recent' })
  return <div className="kurio-app"><div className="site-container"><div className="desktop-header"><MarketplaceHeader /></div><MobileAccountNavigation /><main className="detail-page">
    <Link to="/" className="detail-breadcrumb">Início / Mercado</Link>
    {nftQuery.isPending ? <div className="detail-layout" aria-label="Carregando NFT"><div className="detail-art skeleton"/><div className="skeleton">Carregando NFT…</div></div> : nftQuery.isError || !nftQuery.data ? <div className="catalog-message" role="alert"><h1>NFT não encontrado</h1><Link to="/">Voltar ao catálogo</Link></div> : <><div className="detail-mobile-actions"><Link to="/" aria-label="Voltar">‹</Link><a href="#purchase-actions" aria-label="Ir para ações de favorito"><HeartIcon/></a></div><div className="detail-layout"><div className="detail-gallery"><div className="detail-thumbnails">{Array.from({ length: 4 }, (_, index) => <button type="button" aria-label={`Visualização ${index + 1}`} className={index === 0 ? 'active' : ''} key={index}><NftArtwork nft={nftQuery.data}/></button>)}</div><div className="detail-art"><NftArtwork nft={nftQuery.data} className="nft-image" /><SearchIcon className="detail-zoom"/></div></div><div className="detail-information"><span className="eyebrow">{nftQuery.data.collection}</span><h1>{nftQuery.data.name}</h1><div className="detail-price-line"><p className="detail-price">{nftQuery.data.editions[0] ? formatEth(nftQuery.data.editions[0].priceEth) : '—'} ETH</p><span>★ 4.8 (19)</span></div><h2>Sobre este NFT:</h2><p>{nftQuery.data.description}</p><div id="purchase-actions"><NftActions nft={nftQuery.data}/></div><p>Token: {nftQuery.data.id.replace('nft-', '#')}</p><p className="detail-availability">{nftQuery.data.editions[0]?.available ?? 0} unidades disponíveis</p></div></div><section className="detail-description"><h2>Detalhes do NFT</h2><p>{nftQuery.data.description}</p><p>Rede: Ethereum com procedência registrada nos metadados do token.</p></section></>}
    {nftQuery.data && <><section className="related-nfts" aria-labelledby="more-from-collection"><div><span className="eyebrow">Coleção selecionada</span><h2 id="more-from-collection">Mais desta coleção</h2></div><Link to="/" search={{ category: undefined }}>Ver todos</Link><div className="related-nft-grid">{collectionQuery.data?.items.filter(item => item.id !== nftQuery.data?.id).slice(0, 3).map(item => <NftCard nft={item} key={item.id}/>)}</div></section><section className="collector-reviews" aria-labelledby="collector-reviews"><span className="eyebrow">Comunidade</span><h2 id="collector-reviews">Avaliações de colecionadores</h2><p>As avaliações verificadas não estão disponíveis nos dados demonstrativos deste item.</p></section></>}
  </main><MarketplaceFooter /></div></div>
}
