import { Link } from '@tanstack/react-router'
import { useRouterState } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, useSyncExternalStore } from 'react'

import type { Cart } from '@/api/contracts/marketplace'
import { privateKey, useSession } from '@/auth/session-context'
import { CartIcon, LoginIcon, SearchIcon, UserIcon } from '@/shared/components/icons'

export function MarketplaceHeader({ onSearch }: { onSearch?: () => void }) {
  const { session, logout } = useSession()
  const pathname = useRouterState({ select: state => state.location.pathname })
  const [activeHomeSection, setActiveHomeSection] = useState<'home' | 'market' | 'learn'>('home')
  const [headerVisible, setHeaderVisible] = useState(true)
  const queryClient = useQueryClient()
  const cartKey = session ? privateKey(session.user.id, 'cart') : ['guest-cart']
  const cartItems = useSyncExternalStore(
    (notify) => queryClient.getQueryCache().subscribe(notify),
    () => (queryClient.getQueryData<Cart>(cartKey)?.items ?? []).reduce((total, item) => total + item.quantity, 0),
    () => 0,
  )
  const returnTo = `${location.pathname}${location.search}`
  useEffect(() => {
    if (pathname !== '/') return
    const targets = [['top', 'home'], ['catalogo', 'market'], ['diario', 'learn']] as const
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (visible) setActiveHomeSection(targets.find(([id]) => id === visible.target.id)?.[1] ?? 'home')
    }, { rootMargin: '-82px 0px -55% 0px', threshold: [0.05, 0.4] })
    targets.forEach(([id]) => document.getElementById(id) && observer.observe(document.getElementById(id)!))
    return () => observer.disconnect()
  }, [pathname])
  useEffect(() => {
    let previousY = window.scrollY
    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        const nextY = window.scrollY
        const difference = nextY - previousY
        if (nextY < 24) setHeaderVisible(true)
        else if (Math.abs(difference) > 10) setHeaderVisible(difference < 0)
        previousY = nextY
        frame = 0
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); if (frame) cancelAnimationFrame(frame) }
  }, [])
  const active = pathname.startsWith('/nft/') || pathname === '/cart' || pathname === '/checkout' || pathname.startsWith('/orders/') ? 'market' : pathname === '/' ? activeHomeSection : null
  return <header className={`store-header ${headerVisible ? '' : 'store-header-hidden'}`} aria-label="Marketplace navigation">
    <Link to="/" className="store-wordmark" aria-label="Kurio home">KURIO</Link>
    <nav className="store-nav" aria-label="Primary navigation"><Link to="/" className={active === 'home' ? 'active' : undefined}>Início</Link><a className={active === 'market' ? 'active' : undefined} href="/#catalogo">Mercado</a><a href="/#catalogo">Criadores</a><a className={active === 'learn' ? 'active' : undefined} href="/#diario">Aprenda</a></nav>
    <div className="store-actions">
      {onSearch && <button type="button" className="icon-button" aria-label="Buscar NFTs" onClick={onSearch}><SearchIcon /></button>}
      <Link className="store-cart-symbol" to="/cart" aria-label={`Carrinho${cartItems ? `, ${cartItems} item${cartItems === 1 ? '' : 's'}` : ''}`}><CartIcon />{cartItems > 0 && <span className="cart-badge">{cartItems}</span>}</Link>
      {session ? <><Link className="store-login store-profile" to="/profile"><UserIcon size={15}/><span>{session.user.displayName}</span></Link><button className="header-logout" type="button" onClick={() => void logout()}>Sair</button></> : <Link className="store-login" to="/login" search={{ returnTo }}><LoginIcon size={16}/><span>Entrar</span></Link>}
    </div>
  </header>
}

/** Compact responsive navigation; desktop and mobile controls never render together. */
export function MobileAccountNavigation() {
  const { session, logout } = useSession()
  const returnTo = `${location.pathname}${location.search}`
  return <nav className={`mobile-account-navigation${session ? ' mobile-session-navigation' : ''}`} aria-label="Navegação da conta">
    <Link to="/" aria-label="Início">KURIO</Link>
    <Link to="/cart">Carrinho</Link>
    {session ? <><Link to="/profile">Perfil</Link><button type="button" onClick={() => void logout()}>Sair</button></> : <Link to="/login" search={{ returnTo }}>Entrar</Link>}
  </nav>
}
