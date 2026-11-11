import { useRef, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { NftListParams, NftSort } from '@/api/contracts/marketplace'
import { SearchIcon } from '@/catalog/components/store-header'
import { MarketplaceHeader } from '@/shared/components/marketplace-header'
import { NftCard, NftCardSkeleton } from '@/catalog/components/nft-card'
import { useCatalog } from '@/catalog/queries/use-catalog'

const categories = [
  { id: 'nature', label: 'Arte digital', count: 33 },
  { label: 'Fotografia', count: 12 },
  { label: 'Música', count: 65 },
  { id: 'warriors', label: 'Arte 3D', count: 39 },
  { id: 'animals', label: 'Colecionáveis', count: 23 },
  { label: 'Generativa', count: 17 },
  { label: 'Jogos', count: 19 },
  { label: 'Assinaturas', count: 13 },
  { label: 'Utilidade', count: 18 },
] as const
const sorts: { id: NftSort, label: string }[] = [
  { id: 'recent', label: 'Listados recentemente' },
  { id: 'price-asc', label: 'Menor preço' },
  { id: 'price-desc', label: 'Maior preço' },
  { id: 'name-asc', label: 'Nome: A–Z' },
]

type CatalogSearch = { query?: string; category?: 'animals' | 'nature' | 'warriors'; available?: boolean; sort?: NftSort; page?: number; maxPriceEth?: string }
function validateSearch(search: Record<string, unknown>): CatalogSearch {
  const query = typeof search.query === 'string' ? search.query.trim().slice(0, 100) : undefined
  const category = categories.find(item => 'id' in item && item.id === search.category)
  const sort = sorts.find(item => item.id === search.sort)?.id
  const maxPriceEth = typeof search.maxPriceEth === 'string' && /^(?:0|[1-9]\d*)(?:\.\d{1,18})?$/.test(search.maxPriceEth) ? search.maxPriceEth : undefined
  const parsed = Number(search.page)
  const page = Number.isInteger(parsed) && parsed > 1 && parsed <= 1000 ? parsed : undefined
  return {
    ...(query ? { query } : {}),
    ...(category && 'id' in category ? { category: category.id } : {}),
    ...(search.available === true || search.available === 'true' ? { available: true } : {}),
    ...(sort && sort !== 'recent' ? { sort } : {}),
    ...(page ? { page } : {}),
    ...(maxPriceEth ? { maxPriceEth } : {}),
  }
}
export const Route = createFileRoute('/')({ validateSearch, component: HomePage })

const articles = [
  { image: 'hero-art.png', date: '12 de setembro | Leitura de 6 min', title: 'Como funciona a propriedade de NFTs', description: 'Aprenda a colecionar, negociar e verificar ativos digitais.' },
  { image: 'artwork-02.png', date: '13 de setembro | Leitura de 2 min', title: '10 artistas digitais para acompanhar', description: 'Conheça criadores que moldam a cultura digital.' },
  { image: 'artwork-01.png', date: '15 de setembro | Leitura de 3 min', title: 'Raridade, atributos e procedência', description: 'Entenda raridade, procedência, direitos autorais e utilidade.' },
  { image: 'artwork-03.png', date: '15 de setembro | Leitura de 2 min', title: 'Como proteger sua carteira', description: 'Proteja sua carteira, seus ativos e sua identidade.' },
]

function PriceFilter({ defaultValue, onApply }: { defaultValue: number; onApply: (value: number) => void }) {
  const [priceMax, setPriceMax] = useState(defaultValue)

  return <div className="filter-fieldset price-filter"><h3>Faixa de preço</h3><input className="price-range-input" type="range" min="0.02" max="12.30" step="0.01" value={priceMax} onChange={e => setPriceMax(Number(e.target.value))} aria-label="Preço máximo em ETH"/><p>Preço: 0,02 - {priceMax.toFixed(2).replace('.', ',')} ETH</p><button type="button" className="filter-apply" onClick={() => onApply(priceMax)}>Aplicar</button></div>
}

function HomePage() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: '/' })
  const catalogRef = useRef<HTMLElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [mobileFilters, setMobileFilters] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'trending'>('all')
  const params: NftListParams = { ...search, sort: search.sort ?? 'recent', page: search.page ?? 1, pageSize: 9 }
  const catalog = useCatalog(params)

  const changeSearch = (patch: Partial<CatalogSearch>) => void navigate({ search: old => ({ ...old, ...patch, page: undefined }) })
  const changeQuery = (query: string) => changeSearch({ query: query.trim() || undefined })
  const resetFilters = () => { setActiveTab('all'); void navigate({ search: {} }) }
  const selectTab = (tab: 'all' | 'new' | 'trending') => {
    setActiveTab(tab)
    changeSearch({ sort: tab === 'trending' ? 'price-desc' : undefined })
  }
  const goToCatalog = () => catalogRef.current?.scrollIntoView({ behavior: 'smooth' })

  return <main className="kurio-app" id="top">
    <div className="site-container">
      <div className="desktop-header"><MarketplaceHeader onSearch={() => searchInputRef.current?.focus()} /></div>
      <div className="mobile-search-bar">
        <label className="mobile-search-field"><SearchIcon/><span className="sr-only">Buscar NFTs</span><input aria-label="Buscar NFTs" value={search.query ?? ''} onChange={e => changeQuery(e.target.value)} placeholder="Explorar coleções" /></label>
        <button className="mobile-filter-button" type="button" aria-label="Alternar filtros" aria-expanded={mobileFilters} onClick={() => setMobileFilters(!mobileFilters)}>
          <svg viewBox="0 0 24 24" width="23" height="23" stroke="currentColor" strokeWidth="1.8" fill="none" aria-hidden="true"><path d="M4 6h16M4 18h16"/><circle cx="9" cy="6" r="2.4" fill="#d28a4c"/><circle cx="16" cy="18" r="2.4" fill="#d28a4c"/></svg>
        </button>
      </div>
      <section className="hero" aria-label="Apresentação da Kurio">
        <div className="hero-copy">
          <p className="hero-eyebrow">Bem-vindo à Kurio</p>
          <h1><span className="hero-desktop-title">SEJA DONO DO FUTURO<br/>DA ARTE DIGITAL</span><span className="hero-mobile-title">SEJA DONO DA<br/>CULTURA DIGITAL</span></h1>
          <p className="hero-description"><span className="desktop-description">Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie artistas e tenha uma parte da cultura da internet.</span><span className="mobile-description">Descubra NFTs selecionados de criadores do mundo todo.</span></p>
          <button className="hero-cta" type="button" onClick={goToCatalog}>EXPLORAR <span className="hero-cta-arrow" aria-hidden="true">→</span></button>
        </div>
        <div className="hero-visual"><img src="/assets/figma/artwork-02.png" alt="Emerald Ape com óculos verdes" /><img className="hero-small-art" src="/assets/figma/artwork-01.png" alt="" /></div>
        <span className="hero-dots" aria-hidden="true">● ● ●</span>
      </section>
      <section className="marketplace" id="catalogo" ref={catalogRef} aria-label="Catálogo de NFTs">
        <aside className={`catalog-sidebar ${mobileFilters ? 'catalog-sidebar-mobile-open' : ''}`} id="colecoes" aria-label="Filtros do catálogo">
          <div className="filters-card">
            <fieldset className="filter-fieldset">
              <legend>Coleções</legend>
              {categories.map(category => {
                const supported = 'id' in category
                const selected = supported && search.category === category.id
                return supported ? <label className={`filter-option ${selected || (!search.category && category.id === 'nature') ? 'selected' : ''}`} key={category.label}>
                  <input type="radio" name="category" checked={Boolean(selected)} onChange={() => changeSearch({ category: selected ? undefined : category.id })} />
                  <span>{category.label}</span><span>({category.count})</span>
                </label> : <div className="filter-option filter-option-static" key={category.label}><span>{category.label}</span><span>({category.count})</span></div>
              })}
              {search.category && <button type="button" className="clear-category" onClick={() => changeSearch({ category: undefined })}>Todas as coleções</button>}
            </fieldset>
            <PriceFilter key={search.maxPriceEth ?? '12.30'} defaultValue={Number(search.maxPriceEth ?? '12.30')} onApply={priceMax => changeSearch({ maxPriceEth: priceMax >= 12.3 ? undefined : priceMax.toFixed(2) })}/>
            <div className="filter-fieldset network-filter"><h3>Rede</h3>{[['Ethereum', 119], ['Polygon', 78], ['Solana', 86]].map(([name,count]) => <div key={name} className="filter-option filter-option-static"><span>{name}</span><span>({count})</span></div>)}</div>
            <div className="mobile-sort-filter"><label htmlFor="mobile-sort">Ordenar catálogo no celular</label><select id="mobile-sort" aria-label="Ordenar catálogo no celular" value={search.sort ?? 'recent'} onChange={e => changeSearch({ sort: e.target.value === 'recent' ? undefined : e.target.value as NftSort })}>{sorts.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></div>
            <label className="availability-option"><input type="checkbox" checked={Boolean(search.available)} onChange={e => changeSearch({ available: e.target.checked || undefined })}/>Somente disponíveis</label>
            <button className="reset-button" type="button" onClick={resetFilters}>Limpar todos os filtros</button>
          </div>
          <div className="featured-card"><h3>NFT EM DESTAQUE</h3><p>OFERTA LIMITADA</p><img src="/assets/figma/artwork-01.png" alt="Sage Nomad, NFT em destaque" loading="lazy"/></div>
        </aside>
        <div className="catalog-main">
          <div className="catalog-toolbar">
            <div className="catalog-tabs" role="group" aria-label="Seleção de catálogo">
              <button type="button" className={activeTab==='all'?'active':''} onClick={() => selectTab('all')}>Todos os NFTs</button>
              <button type="button" className={activeTab==='new'?'active':''} onClick={() => selectTab('new')}>Novos lançamentos</button>
              <button type="button" className={activeTab==='trending'?'active':''} onClick={() => selectTab('trending')}>Em alta</button>
            </div>
            <label className="sort-control">Ordenar por:
              <select aria-label="Ordenar catálogo" value={search.sort ?? 'recent'} onChange={e => changeSearch({ sort: e.target.value==='recent'?undefined:e.target.value as NftSort })}>{sorts.map(item=><option value={item.id} key={item.id}>{item.label}</option>)}</select>
            </label>
          </div>
          <label className="desktop-catalog-search"><SearchIcon/><span className="sr-only">Buscar no catálogo</span><input ref={searchInputRef} value={search.query ?? ''} onChange={e => changeQuery(e.target.value)} placeholder="Buscar NFTs, coleções ou criadores..."/></label>
          {catalog.isPending ? <div className="nft-grid" aria-label="Carregando NFTs">{Array.from({length:9},(_,i)=><NftCardSkeleton key={i}/>)}</div> : catalog.isError ? <div className="catalog-message" role="alert"><h3>Não foi possível carregar os NFTs.</h3><p>Verifique a conexão e tente novamente.</p><button className="primary-button" onClick={() => void catalog.refetch()}>Tentar novamente</button></div> : catalog.data.items.length===0 ? <div className="catalog-message"><h3>Nenhum NFT encontrado.</h3><p>Tente ajustar a busca ou limpar os filtros.</p><button className="primary-button" onClick={resetFilters}>Limpar busca e filtros</button></div> : <>
            <div className="catalog-result-count" role="status">{catalog.isFetching ? 'Atualizando catálogo…' : ''}</div>
            <div className="nft-grid">{catalog.data.items.map(nft=><NftCard nft={nft} key={nft.id}/>)}</div>
            <nav className="catalog-pagination" aria-label="Páginas do catálogo">
              {Array.from({length:Math.max(4,catalog.data.totalPages)},(_,i)=>i+1).map(page=><button key={page} type="button" disabled={page>catalog.data.totalPages} className={page===params.page?'pagination-active':''} aria-current={page===params.page?'page':undefined} onClick={() => void navigate({ search: old=>({...old,page:page===1?undefined:page}) })}>{page}</button>)}
              <button type="button" aria-label="Próxima página" disabled={(params.page ?? 1)>=catalog.data.totalPages} onClick={() => void navigate({ search: old=>({...old,page:(params.page ?? 1)+1}) })}>›</button>
            </nav>
          </>}
        </div>
      </section>
      <section className="promo-grid" aria-label="Descubra novas coleções">
        <div className="promo-card"><img src="/assets/figma/artwork-02.png" alt="Emerald Ape" loading="lazy"/><div><h2>Lançamentos gênesis<br/>de edição limitada</h2><p>Colecione edições escassas diretamente dos criadores antes da revelação pública.</p><a href="#catalogo">Explorar →</a></div></div>
        <div className="promo-card"><img src="/assets/figma/hero-art.png" alt="Neon Vessel" loading="lazy"/><div><h2>Arte digital selecionada<br/>e muito mais</h2><p>Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.</p><a href="#catalogo">Explorar →</a></div></div>
      </section>
      <section className="journal" id="diario" aria-label="Diário da Cunhagem"><h2>Diário da Cunhagem</h2><p>Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.</p><div className="journal-grid">{articles.map(article=><article className="journal-card" key={article.title}><img src={`/assets/figma/${article.image}`} alt="Arte digital" loading="lazy"/><div><span>{article.date}</span><h3>{article.title}</h3><p>{article.description}</p><span className="journal-read">Ler mais →</span></div></article>)}</div></section>
      <footer className="store-footer">
        <div className="footer-benefits"><div><span className="benefit-icon">W</span><h3>Segurança da carteira</h3><p>Proteja sua carteira e colecione arte digital verificada com confiança.</p></div><div><span className="benefit-icon">C</span><h3>Criadores em destaque</h3><p>Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.</p></div><div><span className="benefit-icon">D</span><h3>Alertas de lançamentos</h3><p>Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.</p></div><div className="newsletter"><h3>Antecipe-se ao próximo lançamento</h3><form onSubmit={e=>e.preventDefault()}><input type="email" placeholder="Digite seu e-mail..." aria-label="E-mail para novidades"/><button type="submit" disabled aria-label="Enviar — cadastro para novidades indisponível">Enviar</button></form><p>Receba lançamentos selecionados, histórias de criadores e novidades do mercado.</p></div></div>
        <div className="footer-contact"><strong>KURIO</strong><span>Feito para colecionadores,<br/>criadores e cultura</span><span>contato@email.com</span><span>+55 11 4002 8922</span></div>
        <div className="footer-columns"><div><h3>Meu perfil</h3><p>Meu perfil</p><p>Minha coleção</p><p>Atividade</p><p>Estúdio do criador</p><p>Lista de interesses</p></div><div><h3>Central de ajuda</h3><p>Central de ajuda</p><p>Como comprar NFTs</p><p>Carteiras e segurança</p><p>Política do mercado</p><p>Denunciar item</p></div><div><h3>Coleções</h3><p>Arte digital</p><p>Fotografia</p><p>Música</p><p>Arte 3D</p><p>Utilidade</p></div><div><h3>Redes sociais</h3><p className="social-icons">f ◎ 𝕏 in ◎</p><h3>Carteiras compatíveis</h3><p className="wallet-labels">METAMASK · WALLETCONNECT · COINBASE</p></div></div>
        <div className="copyright">© 2026 Kurio. Propriedade digital para todos. <a href="/validation">Diagnóstico técnico</a></div>
      </footer>
    </div>
    <nav className="mobile-bottom-nav" aria-label="Navegação móvel"><a href="#top" aria-label="Início"><svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24" aria-hidden="true"><path d="m3 11 9-8 9 8v9h-7v-6h-4v6H3z"/></svg></a><a href="#catalogo" aria-label="Favoritos"><span aria-hidden="true">♥</span></a><button className="mobile-scan" type="button" aria-label="Ver filtros" onClick={() => { setMobileFilters(true);goToCatalog() }}>▢</button><a href="#catalogo" aria-label="Mercado"><span aria-hidden="true">🛒</span></a><a href="#top" aria-label="Perfil"><span aria-hidden="true">♟</span></a></nav>
  </main>
}
