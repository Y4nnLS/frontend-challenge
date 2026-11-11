import { Link } from '@tanstack/react-router'

interface StoreHeaderProps { onSearch?: () => void }

export function SearchIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round"><circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5"/></svg>
}

export function StoreHeader({ onSearch }: StoreHeaderProps) {
  return <header className="store-header" aria-label="Cabeçalho Kurio">
    <Link to="/" className="store-wordmark" aria-label="Kurio, início">KURIO</Link>
    <nav className="store-nav" aria-label="Navegação principal">
      <Link to="/" activeProps={{ className: 'active' }}>Início</Link>
      <a href="/#catalogo">Mercado</a>
      <a href="/#catalogo">Criadores</a>
      <a href="/#diario">Aprenda</a>
    </nav>
    <div className="store-actions">
      {onSearch && <button type="button" className="icon-button" aria-label="Buscar NFTs" onClick={onSearch}><SearchIcon/></button>}
      <span className="store-cart-symbol" aria-hidden="true">▾</span>
      <span className="store-cart-symbol" aria-hidden="true">🛒</span>
      <span className="store-login" aria-label="Entrar, fluxo ainda não disponível">▣ Entrar</span>
    </div>
  </header>
}
