import { Link } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'

import type { Cart } from '@/api/contracts/marketplace'
import { privateKey, useSession } from '@/auth/session-context'
import { CartIcon, SearchIcon, UserIcon } from '@/shared/components/icons'

export function MarketplaceHeader({ onSearch }: { onSearch?: () => void }) {
  const { session, logout } = useSession()
  const queryClient = useQueryClient()
  const cartKey = session ? privateKey(session.user.id, 'cart') : ['guest-cart']
  const cartItems = useSyncExternalStore(
    (notify) => queryClient.getQueryCache().subscribe(notify),
    () => (queryClient.getQueryData<Cart>(cartKey)?.items ?? []).reduce((total, item) => total + item.quantity, 0),
    () => 0,
  )
  const returnTo = `${location.pathname}${location.search}`
  return <header className="store-header" aria-label="Marketplace navigation">
    <Link to="/" className="store-wordmark" aria-label="Kurio home">KURIO</Link>
    <nav className="store-nav" aria-label="Primary navigation"><Link to="/" activeProps={{ className: 'active' }}>Início</Link><a href="/#catalogo">Mercado</a><a href="/#catalogo">Criadores</a><a href="/#diario">Aprenda</a></nav>
    <div className="store-actions">
      {onSearch && <button type="button" className="icon-button" aria-label="Buscar NFTs" onClick={onSearch}><SearchIcon /></button>}
      <Link className="store-cart-symbol" to="/cart" aria-label={`Carrinho${cartItems ? `, ${cartItems} item${cartItems === 1 ? '' : 's'}` : ''}`}><CartIcon />{cartItems > 0 && <span className="cart-badge">{cartItems}</span>}</Link>
      {session ? <><Link className="store-login store-profile" to="/profile"><UserIcon size={15}/><span>{session.user.displayName}</span></Link><button className="header-logout" type="button" onClick={() => void logout()}>Sair</button></> : <Link className="store-login" to="/login" search={{ returnTo }}><UserIcon size={15}/><span>Entrar</span></Link>}
    </div>
  </header>
}

/** Compact responsive navigation; desktop and mobile controls never render together. */
export function MobileAccountNavigation() {
  const { session, logout } = useSession()
  const returnTo = `${location.pathname}${location.search}`
  return <nav className="mobile-account-navigation" aria-label="Navegação da conta">
    <Link to="/" aria-label="Início">KURIO</Link>
    <Link to="/cart">Carrinho</Link>
    {session ? <><Link to="/profile">Perfil</Link><button type="button" onClick={() => void logout()}>Sair</button></> : <Link to="/login" search={{ returnTo }}>Entrar</Link>}
  </nav>
}
