import { Link } from '@tanstack/react-router'

import { useSession } from '@/auth/session-context'
import { CartIcon, HeartIcon, HomeIcon, ScanIcon, UserIcon } from '@/shared/components/icons'

export function MobileBottomNavigation({ onExplore }: { onExplore?: () => void }) {
  const { session } = useSession()
  const returnTo = `${location.pathname}${location.search}`
  return <nav className="mobile-bottom-nav" aria-label="Navegação móvel">
    <Link to="/" aria-label="Início" activeProps={{ className: 'active' }}><HomeIcon /></Link>
    <Link to={session ? '/profile' : '/login'} search={session ? undefined : { returnTo }} aria-label={session ? 'Favoritos e perfil' : 'Entrar para ver favoritos'}><HeartIcon /></Link>
    <button className="mobile-scan" type="button" aria-label="Explorar catálogo" onClick={onExplore}><ScanIcon size={30}/></button>
    <Link to="/cart" aria-label="Carrinho" activeProps={{ className: 'active' }}><CartIcon /></Link>
    <Link to={session ? '/profile' : '/login'} search={session ? undefined : { returnTo }} aria-label={session ? 'Perfil' : 'Entrar'} activeProps={{ className: 'active' }}><UserIcon /></Link>
  </nav>
}
