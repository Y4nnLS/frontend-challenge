import { FacebookIcon, InstagramIcon, LinkedInIcon, XIcon, YoutubeIcon } from '@/shared/components/icons'

const networks = [
  ['Facebook', FacebookIcon],
  ['Instagram', InstagramIcon],
  ['X', XIcon],
  ['LinkedIn', LinkedInIcon],
  ['YouTube', YoutubeIcon],
] as const

/** Shared public footer. Links without a documented destination remain informative rather than fabricated. */
export function MarketplaceFooter() {
  return <footer className="store-footer">
    <div className="footer-benefits">
      <div><span className="benefit-icon">W</span><h3>Segurança da carteira</h3><p>Proteja sua carteira e colecione arte digital verificada com confiança.</p></div>
      <div><span className="benefit-icon">C</span><h3>Criadores em destaque</h3><p>Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.</p></div>
      <div><span className="benefit-icon">D</span><h3>Alertas de lançamentos</h3><p>Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.</p></div>
      <div className="newsletter"><h3>Antecipe-se ao próximo lançamento</h3><form onSubmit={event => event.preventDefault()}><input type="email" placeholder="Digite seu e-mail..." aria-label="Cadastro para novidades"/><button type="submit" disabled aria-label="Enviar — cadastro para novidades indisponível">Enviar</button></form><p>Receba lançamentos selecionados, histórias de criadores e novidades do mercado.</p></div>
    </div>
    <div className="footer-contact"><strong>KURIO</strong><span>Feito para colecionadores,<br/>criadores e cultura</span><span>contato@email.com</span><span>+55 11 4002 8922</span></div>
    <div className="footer-columns">
      <div><h3>Meu perfil</h3><p>Meu perfil</p><p>Minha coleção</p><p>Atividade</p><p>Estúdio do criador</p><p>Lista de interesses</p></div>
      <div><h3>Central de ajuda</h3><p>Central de ajuda</p><p>Como comprar NFTs</p><p>Carteiras e segurança</p><p>Política do mercado</p><p>Denunciar item</p></div>
      <div><h3>Coleções</h3><p>Arte digital</p><p>Fotografia</p><p>Música</p><p>Arte 3D</p><p>Utilidade</p></div>
      <div className="footer-community"><h3>Redes sociais</h3><div className="social-icons" aria-label="Redes sociais indisponíveis nesta demonstração">{networks.map(([name, Icon]) => <span key={name} title={`${name} indisponível`} aria-label={`${name} indisponível`}><Icon size={17}/></span>)}</div><h3>Carteiras compatíveis</h3><div className="wallet-labels"><span>METAMASK</span><span>WALLETCONNECT</span><span>COINBASE</span></div></div>
    </div>
    <div className="copyright">© 2026 Kurio. Propriedade digital para todos.</div>
  </footer>
}
