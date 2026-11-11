import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'

import { useSession } from '@/auth/session-context'
import { apiErrorMessage } from '@/shared/lib/api-error'
import { MarketplaceHeader, MobileAccountNavigation } from '@/shared/components/marketplace-header'

type AuthMode = 'login' | 'register'

export function AuthPage({ mode, returnTo }: { mode: AuthMode, returnTo?: string }) {
  const { login, register } = useSession()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const target = returnTo?.startsWith('/') ? returnTo : '/'
  useEffect(() => {
    dialogRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') void navigate({ to: target }) }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [navigate, target])
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(''); setPending(true)
    const values = new FormData(event.currentTarget)
    const credentials = { email: String(values.get('email') ?? ''), password: String(values.get('password') ?? '') }
    try {
      if (mode === 'login') await login(credentials)
      else await register({ ...credentials, displayName: String(values.get('displayName') ?? displayName) })
      await navigate({ to: target })
    } catch (reason) { setError(apiErrorMessage(reason)) } finally { setPending(false) }
  }
  const alternate = mode === 'login' ? <Link to="/register" search={{ returnTo: target }}>Criar uma conta</Link> : <Link to="/login" search={{ returnTo: target }}>Entrar</Link>
  return <div className="kurio-app auth-shell"><div className="site-container auth-underlay"><div className="desktop-header"><MarketplaceHeader /></div><MobileAccountNavigation /><section className="auth-poster" aria-hidden="true"><p>Bem-vindo à Kurio</p><h1>SEJA DONO DO FUTURO<br/>DA ARTE DIGITAL</h1><img src="/assets/figma/artwork-02.png" alt=""/></section></div><div className="auth-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) void navigate({ to: target }) }}><main className="auth-dialog" ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="auth-title">
    <Link className="auth-close" to={target} aria-label="Fechar">×</Link><strong className="auth-mobile-wordmark">KURIO</strong><div className="auth-title"><h1 id="auth-title">{mode === 'login' ? 'Entrar' : 'Criar conta'}</h1><span className="auth-desktop-switch">{mode === 'login' ? ' | Criar conta' : ' | Entrar'}</span></div><p className="auth-intro">{mode === 'login' ? 'Entre para gerenciar sua carteira, coleção e perfil de criador.' : 'Crie seu perfil para colecionar e acompanhar seus NFTs.'}</p><form className="account-form auth-form" onSubmit={submit} noValidate>
      {mode === 'register' && <label><span>Nome de colecionador</span><input name="displayName" required minLength={2} value={displayName} onInput={(event) => setDisplayName(event.currentTarget.value)} /></label>}
      <label><span>E-mail</span><input name="email" required type="email" autoComplete="email" placeholder="contato@email.com" /></label>
      <label><span>Senha</span><input name="password" required minLength={8} type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>
      {mode === 'login' && <span className="forgot-password">Esqueceu a senha?</span>}{error && <p className="form-error" role="alert">{error}</p>}
      <button className="primary-button" disabled={pending}>{pending ? 'Enviando…' : mode === 'login' ? 'Entrar' : 'Criar conta'}</button>
    </form><div className="auth-divider"><span>Ou continue com</span></div><button className="auth-provider" type="button" disabled title="Login social não está disponível nesta demonstração">Continuar com Google</button><button className="auth-provider" type="button" disabled title="Login social não está disponível nesta demonstração">Continuar com Facebook</button><p className="auth-alternate">{mode === 'login' ? 'Novo na Kurio? ' : 'Já tem uma conta? '}{alternate}</p></main></div></div>
}
