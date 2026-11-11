import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'

import { useSession } from '@/auth/session-context'
import { apiErrorMessage } from '@/shared/lib/api-error'
import { MarketplaceHeader, MobileAccountNavigation } from '@/shared/components/marketplace-header'

type AuthMode = 'login' | 'register'

export function AuthPage({ mode, returnTo }: { mode: AuthMode, returnTo?: string }) {
  const { login, register } = useSession()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const title = mode === 'login' ? 'Entrar na sua conta' : 'Criar conta'
  const target = returnTo?.startsWith('/') ? returnTo : '/'
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(''); setPending(true)
    try {
      if (mode === 'login') await login({ email, password })
      else await register({ email, password, displayName })
      await navigate({ to: target })
    } catch (reason) { setError(apiErrorMessage(reason)) } finally { setPending(false) }
  }
  return <div className="kurio-app"><div className="site-container"><div className="desktop-header"><MarketplaceHeader /></div><MobileAccountNavigation /><main className="account-page"><h1>{title}</h1><p>Use as credenciais fictícias do projeto ou crie um novo perfil.</p><form className="account-form" onSubmit={submit} noValidate>
    {mode === 'register' && <label>Nome de colecionador<input required minLength={2} value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></label>}
    <label>E-mail<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
    <label>Senha<input required minLength={8} type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} /></label>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="primary-button" disabled={pending}>{pending ? 'Enviando…' : mode === 'login' ? 'Entrar' : 'Criar conta'}</button>
  </form><p>{mode === 'login' ? <>Ainda não tem conta? <Link to="/register" search={{ returnTo: target }}>Cadastre-se</Link></> : <>Já tem uma conta? <Link to="/login" search={{ returnTo: target }}>Entrar</Link></>}</p></main></div></div>
}
