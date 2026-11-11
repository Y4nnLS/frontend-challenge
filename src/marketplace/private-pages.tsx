import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'

import type { Cart, Order, Profile, Wallet, WalletInput } from '@/api/contracts/marketplace'
import { marketplaceApi } from '@/api/marketplace-api'
import { privateKey, useSession } from '@/auth/session-context'
import { formatEth } from '@/catalog/lib/format-eth'
import { NftArtwork } from '@/catalog/components/nft-card'
import { NftCard } from '@/catalog/components/nft-card'
import { useCatalog } from '@/catalog/queries/use-catalog'
import { MarketplaceHeader, MobileAccountNavigation } from '@/shared/components/marketplace-header'
import { MarketplaceFooter } from '@/shared/components/marketplace-footer'
import { apiErrorMessage } from '@/shared/lib/api-error'

function Protected({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useSession()
  if (isLoading) return <Page><p role="status">Recuperando sessão…</p></Page>
  if (!session) return <Page><h1>Faça login para continuar</h1><p>Esta área contém dados privados do colecionador.</p><Link className="primary-button" to="/login" search={{ returnTo: location.pathname + location.search }}>Entrar</Link></Page>
  return <>{children}</>
}

function Page({ children }: { children: React.ReactNode }) { return <div className="kurio-app"><div className="site-container"><div className="desktop-header"><MarketplaceHeader /></div><MobileAccountNavigation /><main className="account-page">{children}</main><MarketplaceFooter /></div></div> }

function AccountSidebar({ active }: { active: 'profile' | 'wallets' }) {
  return <aside className="account-sidebar" aria-label="Meu perfil"><h2>Meu perfil</h2><Link className={active === 'profile' ? 'active' : ''} to="/profile">Dados do perfil</Link><Link className={active === 'wallets' ? 'active' : ''} to="/wallets">Carteiras</Link><span>Atividade</span><span>Lista de interesse</span><span>Ofertas</span><span>Arquivos baixados</span><span>Suporte</span></aside>
}

function CartSummary({ cart, checkoutLink = true }: { cart: Cart, checkoutLink?: boolean }) {
  const { session } = useSession()
  const quote = useQuery({ queryKey: session ? privateKey(session.user.id, 'quote', cart.version, cart.couponCode) : ['quote', cart.version], queryFn: () => marketplaceApi.quote({}), enabled: cart.items.length > 0, retry: false })
  if (!cart.items.length) return <aside className="order-summary"><h2>Resumo</h2><p>Seu carrinho está vazio.</p></aside>
  if (quote.isPending) return <aside className="order-summary skeleton" aria-label="Carregando resumo">Carregando resumo…</aside>
  if (quote.isError || !quote.data) return <aside className="order-summary" role="alert">Não foi possível atualizar a cotação.</aside>
  return <aside className="order-summary"><h2>Resumo da compra</h2><p>Subtotal <strong>{formatEth(quote.data.subtotalEth)} ETH</strong></p><p>Desconto <strong>-{formatEth(quote.data.discountEth)} ETH</strong></p><p>Taxa de rede <strong>{formatEth(quote.data.networkFeeEth)} ETH</strong></p><hr/><p className="order-total">Total <strong>{formatEth(quote.data.totalEth)} ETH</strong></p>{checkoutLink && <Link className="primary-button" to="/checkout">Ir para pagamento</Link>}</aside>
}

function CartArtwork({ nftId, name }: { nftId: string, name: string }) {
  const nft = useQuery({ queryKey: ['nft', nftId], queryFn: () => marketplaceApi.getNft(nftId), retry: false })
  return nft.data ? <NftArtwork nft={nft.data} className="cart-item-art"/> : <div className="cart-item-art skeleton" aria-label={`Carregando arte de ${name}`}/>
}

export function CartPage() {
  const { session } = useSession(); const queryClient = useQueryClient(); const [coupon, setCoupon] = useState(''); const [message, setMessage] = useState('')
  const cart = useQuery({ queryKey: session ? privateKey(session.user.id, 'cart') : ['guest-cart'], queryFn: marketplaceApi.cart, retry: false })
  const recommendations = useCatalog({ page: 1, pageSize: 4, sort: 'recent' })
  const update = useMutation({ mutationFn: marketplaceApi.setCartItem, onSuccess: (data) => { if (session) queryClient.setQueryData(privateKey(session.user.id, 'cart'), data); else queryClient.setQueryData(['guest-cart'], data) }, onError: (error) => setMessage(apiErrorMessage(error)) })
  const remove = useMutation({ mutationFn: ({ nftId, editionId }: { nftId: string, editionId: string }) => marketplaceApi.removeCartItem(nftId, editionId), onSuccess: (data) => { if (session) queryClient.setQueryData(privateKey(session.user.id, 'cart'), data); else queryClient.setQueryData(['guest-cart'], data) }, onError: (error) => setMessage(apiErrorMessage(error)) })
  const couponMutation = useMutation({ mutationFn: marketplaceApi.setCoupon, onSuccess: (data) => { if (session) queryClient.setQueryData(privateKey(session.user.id, 'cart'), data); else queryClient.setQueryData(['guest-cart'], data); setCoupon(''); setMessage(data.couponCode ? `Cupom ${data.couponCode} aplicado.` : 'Cupom removido.') }, onError: (error) => setMessage(apiErrorMessage(error)) })
  return <Page><div className="page-breadcrumb">Início / Mercado / Carrinho</div><h1>Seu carrinho</h1>{cart.isPending ? <p className="skeleton" role="status">Carregando carrinho…</p> : cart.isError || !cart.data ? <p role="alert">Não foi possível carregar o carrinho.</p> : <div className="cart-layout"><section className="cart-items"><div className="cart-table-head"><span>NFTs</span><span>Preço</span><span>Edições</span><span>Total</span></div>{cart.data.items.length ? cart.data.items.map((item) => <article className="cart-item" key={item.id}><CartArtwork nftId={item.nftId} name={item.name}/><div><h2>{item.name}</h2><p>{item.editionName} · {item.available} disponíveis</p></div><strong>{formatEth(item.unitPriceEth)} ETH</strong><label>Edições<div className="cart-quantity"><button type="button" aria-label={`Diminuir quantidade de ${item.name}`} disabled={item.quantity <= 1} onClick={() => update.mutate({ nftId: item.nftId, editionId: item.editionId, quantity: item.quantity - 1 })}>−</button><input aria-label={`Quantidade de ${item.name}`} type="number" min={1} max={item.available} value={item.quantity} onChange={(event) => update.mutate({ nftId: item.nftId, editionId: item.editionId, quantity: Math.max(1, Number(event.target.value) || 1) })}/><button type="button" aria-label={`Aumentar quantidade de ${item.name}`} disabled={item.quantity >= item.available} onClick={() => update.mutate({ nftId: item.nftId, editionId: item.editionId, quantity: item.quantity + 1 })}>+</button></div></label><button className="secondary-button" type="button" onClick={() => remove.mutate(item)}>Remover</button></article>) : <p>Seu carrinho está vazio. <Link to="/">Explorar NFTs</Link></p>}
    <form className="coupon-form" onSubmit={(event) => { event.preventDefault(); couponMutation.mutate(coupon) }}><label>Cupom<input value={coupon} onChange={(event) => setCoupon(event.target.value)} placeholder="JUNGLE10" /></label><button className="secondary-button" disabled={couponMutation.isPending}>Aplicar cupom</button>{cart.data.couponCode && <button className="secondary-button" type="button" onClick={() => couponMutation.mutate(null)}>Remover cupom</button>}</form>{message && <p role="status" className="mutation-notice">{message}</p>}</section><CartSummary cart={cart.data}/></div>}{recommendations.data && <section className="cart-recommendations" aria-labelledby="cart-recommendations"><h2 id="cart-recommendations">Colecionadores também viram</h2><div className="related-nft-grid">{recommendations.data.items.slice(0, 3).map(item => <NftCard nft={item} key={item.id}/>)}</div></section>}</Page>
}

export function CheckoutPage() {
  const { session } = useSession(); const navigate = useNavigate(); const [message, setMessage] = useState(''); const [reviewed, setReviewed] = useState(false)
  const cart = useQuery({ queryKey: session ? privateKey(session.user.id, 'cart') : ['no-cart'], queryFn: marketplaceApi.cart, enabled: Boolean(session), retry: false })
  const wallets = useQuery({ queryKey: session ? privateKey(session.user.id, 'wallets') : ['no-wallets'], queryFn: marketplaceApi.wallets, enabled: Boolean(session), retry: false })
  const profile = useQuery({ queryKey: session ? privateKey(session.user.id, 'profile') : ['no-profile'], queryFn: marketplaceApi.profile, enabled: Boolean(session), retry: false })
  const quote = useQuery({ queryKey: session && cart.data ? privateKey(session.user.id, 'checkout-quote', cart.data.version, cart.data.couponCode) : ['checkout-quote'], queryFn: () => marketplaceApi.quote({}), enabled: Boolean(session && cart.data?.items.length), retry: false })
  const [walletId, setWalletId] = useState('')
  const selectedWalletId = walletId || wallets.data?.find((wallet) => wallet.isPrimary)?.id || wallets.data?.[0]?.id || ''
  const create = useMutation({ mutationFn: async () => {
    if (!quote.data || !selectedWalletId || !session) throw new Error('Selecione uma carteira e aguarde a cotação.')
    const keyName = `jungle-order-key:${session.user.id}:${quote.data.id}`; const key = sessionStorage.getItem(keyName) ?? crypto.randomUUID(); sessionStorage.setItem(keyName, key)
    try { return await marketplaceApi.createOrder({ quoteId: quote.data.id, walletId: selectedWalletId }, key) } catch { return marketplaceApi.createOrder({ quoteId: quote.data.id, walletId: selectedWalletId }, key) }
  }, onSuccess: async (order) => { if (session && quote.data) sessionStorage.removeItem(`jungle-order-key:${session.user.id}:${quote.data.id}`); await navigate({ to: '/orders/$orderId', params: { orderId: order.id } }) }, onError: (error) => setMessage(apiErrorMessage(error)) })
  const review = async () => { setReviewed(false); setMessage(''); const result = await quote.refetch(); if (result.data) { setReviewed(true); setMessage('Cotação revalidada. Confirme para enviar o pedido.') } }
  return <Protected><Page><h1>Pagamento</h1>{cart.isPending || wallets.isPending || profile.isPending ? <p className="skeleton">Carregando checkout…</p> : !cart.data?.items.length ? <p>Seu carrinho está vazio. <Link to="/">Voltar ao catálogo</Link></p> : <div className="cart-layout"><section className="checkout-form"><h2>Dados do colecionador</h2><p>{profile.data?.displayName} · {session?.user.email}</p><h2>Carteira e rede</h2><label>Carteira<select aria-label="Carteira" value={selectedWalletId} onChange={(event) => { setWalletId(event.target.value); setReviewed(false) }}>{wallets.data?.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.label} · {wallet.network}</option>)}</select></label><p>Conexão simulada: carteira disponível.</p><button className="secondary-button" type="button" onClick={() => void review()} disabled={quote.isFetching}>Revalidar cotação</button>{message && <p role="status" className="mutation-notice">{message}</p>}<button className="primary-button" type="button" disabled={!reviewed || create.isPending || !selectedWalletId} onClick={() => create.mutate()}>{create.isPending ? 'Enviando pedido…' : 'Confirmar pedido'}</button></section><CartSummary cart={cart.data} checkoutLink={false}/></div>}</Page></Protected>
}

export function OrderPage({ orderId }: { orderId: string }) {
  const { session } = useSession(); const order = useQuery({ queryKey: session ? privateKey(session.user.id, 'order', orderId) : ['order', orderId], queryFn: () => marketplaceApi.order(orderId), enabled: Boolean(session), retry: false })
  return <Protected><Page>{order.isPending ? <p role="status">Recuperando pedido…</p> : order.isError || !order.data ? <p role="alert">Pedido não encontrado.</p> : <Receipt order={order.data}/>}</Page></Protected>
}

function Receipt({ order }: { order: Order }) { const title = order.status === 'confirmed' ? 'Pedido confirmado' : order.status === 'declined' ? 'Pedido recusado' : 'Pedido pendente'; return <div className="receipt-overlay"><section className="receipt"><h1>{title}</h1><p role="status">Pedido {order.id} · transação {order.receipt.transactionReference}</p>{order.status === 'pending' && <p>Aguardando confirmação. Este pedido será recuperado ao atualizar a página.</p>}{order.status === 'declined' && <p role="alert">O pagamento simulado foi recusado. Seus itens continuam no carrinho.</p>}<h2>Recibo imutável</h2>{order.receipt.lines.map((line) => <p key={`${line.nftId}:${line.editionId}`}>{line.quantity} × {line.nftId}: {formatEth(line.lineTotalEth)} ETH</p>)}<p>Taxa: {formatEth(order.receipt.networkFeeEth)} ETH</p><h2>Total: {formatEth(order.receipt.totalEth)} ETH</h2><Link className="primary-button" to="/">Continuar explorando</Link></section></div> }

export function ProfilePage() {
  const { session } = useSession(); const queryClient = useQueryClient(); const [saved, setSaved] = useState('')
  const profile = useQuery({ queryKey: session ? privateKey(session.user.id, 'profile') : ['no-profile'], queryFn: marketplaceApi.profile, enabled: Boolean(session), retry: false })
  const save = useMutation({ mutationFn: marketplaceApi.updateProfile, onSuccess: (data) => { if (session) queryClient.setQueryData(privateKey(session.user.id, 'profile'), data); setSaved('Perfil atualizado.') }, onError: (error) => setSaved(apiErrorMessage(error)) })
  const password = useMutation({ mutationFn: ({ currentPassword, nextPassword }: { currentPassword: string, nextPassword: string }) => marketplaceApi.changePassword(currentPassword, nextPassword), onSuccess: () => setSaved('Senha atualizada.'), onError: (error) => setSaved(apiErrorMessage(error)) })
  return <Protected><Page><div className="account-layout"><AccountSidebar active="profile"/><section className="account-content"><h1>Perfil do colecionador</h1>{profile.isPending || !profile.data ? <p>Carregando perfil…</p> : <><ProfileForm profile={profile.data} onSubmit={(input) => save.mutate(input)} pending={save.isPending}/><form className="account-form" onSubmit={(event) => { event.preventDefault(); const values = new FormData(event.currentTarget); password.mutate({ currentPassword: String(values.get('currentPassword')), nextPassword: String(values.get('nextPassword')) }) }}><h2>Alterar senha</h2><label>Senha atual<input name="currentPassword" type="password" required /></label><label>Nova senha<input name="nextPassword" type="password" required minLength={8}/></label><button className="secondary-button">Alterar senha</button></form>{saved && <p role="status" className="mutation-notice">{saved}</p>}</>}</section></div></Page></Protected>
}

function ProfileForm({ profile, onSubmit, pending }: { profile: Profile, onSubmit: (input: { displayName: string, bio: string, avatarUrl: string | null }) => void, pending: boolean }) { const [displayName, setDisplayName] = useState(profile.displayName); const [bio, setBio] = useState(profile.bio); const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? ''); return <form className="account-form" onSubmit={(event) => { event.preventDefault(); onSubmit({ displayName, bio, avatarUrl: avatarUrl || null }) }}><label>Nome<input required value={displayName} onChange={(event) => setDisplayName(event.target.value)}/></label><label>Bio<textarea value={bio} onChange={(event) => setBio(event.target.value)}/></label><label>URL do avatar<input type="url" value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)}/></label><button className="primary-button" disabled={pending}>Salvar perfil</button></form> }

export function WalletsPage() {
  const { session } = useSession(); const queryClient = useQueryClient(); const [editing, setEditing] = useState<Wallet | null>(null); const [message, setMessage] = useState('')
  const wallets = useQuery({ queryKey: session ? privateKey(session.user.id, 'wallets') : ['no-wallets'], queryFn: marketplaceApi.wallets, enabled: Boolean(session), retry: false })
  const save = useMutation({ mutationFn: (input: WalletInput) => editing ? marketplaceApi.updateWallet(editing.id, input) : marketplaceApi.createWallet(input), onSuccess: () => { if (session) void queryClient.invalidateQueries({ queryKey: privateKey(session.user.id, 'wallets') }); setEditing(null); setMessage('Carteira salva.') }, onError: (error) => setMessage(apiErrorMessage(error)) })
  const defaultForm = useMemo(() => editing ?? { label: '', address: '', network: 'ethereum' as const, isPrimary: false }, [editing])
  return <Protected><Page><div className="account-layout"><AccountSidebar active="wallets"/><section className="account-content"><h1>Carteiras</h1>{wallets.data?.map((wallet) => <article className="cart-item" key={wallet.id}><div><h2>{wallet.label}</h2><p>{wallet.address} · {wallet.network}</p>{wallet.isPrimary && <p>Carteira principal</p>}</div><button className="secondary-button" onClick={() => setEditing(wallet)}>Editar</button></article>)}<WalletForm key={editing?.id ?? 'new'} value={defaultForm} submit={(input) => save.mutate(input)} pending={save.isPending}/>{message && <p role="status" className="mutation-notice">{message}</p>}</section></div></Page></Protected>
}

function WalletForm({ value, submit, pending }: { value: WalletInput, submit: (input: WalletInput) => void, pending: boolean }) { const [form, setForm] = useState(value); return <form className="account-form" onSubmit={(event) => { event.preventDefault(); submit(form) }}><h2>{value.label ? 'Editar carteira' : 'Adicionar carteira'}</h2><label>Nome<input required value={form.label} onChange={(event) => setForm({ ...form, label: event.target.value })}/></label><label>Endereço<input required value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })}/></label><label>Rede<select value={form.network} onChange={(event) => setForm({ ...form, network: event.target.value as Wallet['network'] })}><option value="ethereum">Ethereum</option><option value="polygon">Polygon</option></select></label><label><input type="checkbox" checked={Boolean(form.isPrimary)} onChange={(event) => setForm({ ...form, isPrimary: event.target.checked })}/> Carteira principal</label><button className="primary-button" disabled={pending}>Salvar carteira</button></form> }
