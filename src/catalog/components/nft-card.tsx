import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import type { Nft } from '@/api/contracts/marketplace'
import { formatEth } from '@/catalog/lib/format-eth'

const figmaArtwork: Record<string, string> = {
  'nft-jaguar': '/assets/figma/artwork-02.png',
  'nft-toucan': '/assets/figma/artwork-01.png',
  'nft-orchid': '/assets/figma/hero-art.png',
  'nft-river': '/assets/figma/artwork-01.png',
  'nft-panther': '/assets/figma/artwork-01.png',
  'nft-vine': '/assets/figma/hero-art.png',
  'nft-golden-beat': '/assets/figma/artwork-03.png',
  'nft-golden-signal': '/assets/figma/artwork-03.png',
  'nft-golden-echo': '/assets/figma/artwork-03.png',
}

export function NftArtwork({ nft, className = '' }: { nft: Nft, className?: string }) {
  const [failed, setFailed] = useState(false)
  const source = failed ? figmaArtwork[nft.id] : nft.imageUrl
  return source ? <img src={source} alt={`Arte de ${nft.name}`} loading="lazy" className={className} onError={() => setFailed(true)} /> : <div className={`artwork-unavailable ${className}`} role="img" aria-label={`Imagem indisponível de ${nft.name}`}>Imagem indisponível</div>
}

export function NftCard({ nft }: { nft: Nft }) {
  const edition = nft.editions[0]
  return <article className="nft-card">
    <Link className="nft-art-link" to="/nft/$slug" params={{ slug: nft.slug }} aria-label={`Ver ${nft.name}`}>
      <div className="nft-art"><NftArtwork nft={nft} className="nft-image" /></div>
    </Link>
    <div className="nft-card-meta">
      <Link className="nft-card-title" to="/nft/$slug" params={{ slug: nft.slug }}>{nft.name}</Link>
      <div className="nft-price-row"><strong className="nft-price">{edition ? `${formatEth(edition.priceEth)} ETH` : 'Sem edição'}</strong>{nft.id === 'nft-orchid' && <del className="nft-original-price">2.29 ETH</del>}</div>
    </div>
    {edition?.available === 0 && <span className="sold-out-tag">Esgotado</span>}
  </article>
}

export function NftCardSkeleton() {
  return <div className="nft-card" aria-hidden="true"><div className="nft-art skeleton"/><div className="skeleton skeleton-title"/><div className="skeleton skeleton-caption"/></div>
}
