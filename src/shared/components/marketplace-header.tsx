import { Link } from '@tanstack/react-router'

import { useSession } from '@/auth/session-context'
import { SearchIcon } from '@/catalog/components/store-header'

export function MarketplaceHeader({ onSearch }: { onSearch?: () => void }) {
  const { session, logout } = useSession()
  const returnTo = `${location.pathname}${location.search}`
  return <header className="store-header" aria-label="Marketplace navigation">
    <Link to="/" className="store-wordmark" aria-label="Kurio home">KURIO</Link>
    <nav className="store-nav" aria-label="Primary navigation"><Link to="/">Início</Link><a href="/#catalogo">Mercado</a><a href="/#diario">Aprenda</a></nav>
    <div className="store-actions">
      {onSearch && <button type="button" className="icon-button" aria-label="Buscar NFTs" onClick={onSearch}><SearchIcon /></button>}
      <Link className="store-cart-symbol" to="/cart" aria-label="Carrinho">Carrinho</Link>
      {session ? <><Link className="store-login" to="/profile">{session.user.displayName}</Link><button className="header-logout" type="button" onClick={() => void logout()}>Sair</button></> : <Link className="store-login" to="/login" search={{ returnTo }}>Entrar</Link>}
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
