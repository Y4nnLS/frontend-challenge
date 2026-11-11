# Jungle Gaming / KURIO — Especificação visual fundamentada nos exports do Figma

**Data:** 11/11/2026  
**Referências:** `Frontend Challenge (Copy) (1).zip` (15 PNGs, 9 desktop e 6 mobile); `frontend-challenge-source.zip` (snapshot do código versionado).  
**Estado:** análise de referências e inspeção estática do código concluídas; comparação pixel a pixel com screenshots da aplicação em execução **não realizada**. Propriedades numéricas do Figma (Auto Layout, tokens, medidas exatas) não disponíveis pela API por limite MCP. Dimensões dos exports 2×: desktop 2880px de largura (frame presumido 1440 CSS px se export em 2×); mobile 828px de largura (frame presumido 414 CSS px). **Não confundir** com o viewport de validação pedido de 390px. 

## 1. Evidências visuais dos frames

| Frame | Exports | Estrutura comprovada |
|---|---|---|
| Início | desktop / mobile | Desktop: header horizontal `KURIO / Início / Mercado / Criadores / Aprenda / busca / carrinho com badge / Entrar`, hero editorial com arte à direita, sidebar de coleções/preço/rede e grid de NFTs; mobile: barra de busca superior + botão de filtros, hero em card compacto, abas horizontais e grade de 2 colunas, barra inferior com botão central elevado e recorte. |
| Detalhes do NFT | desktop / mobile | Desktop: breadcrumbs, coluna de miniaturas, imagem principal grande, ficha à direita, preço/avaliações/edições/quantidade/comprar/favoritar, coleção relacionada, descrição e footer. Mobile: botão voltar + coração, imagem protagonista, ficha abaixo, chips de edições, quantidade e ações inferiores. |
| Carrinho | desktop / mobile | Desktop: tabela de itens com linhas/quantidade e resumo lateral com cupom e CTA; seção de NFTs sugeridos e footer. Mobile: lista vertical de cards compactos e resumo com cupom, valores e CTA inferior. |
| Pagamento | desktop / mobile | Desktop: breadcrumb, formulário em 2 colunas à esquerda, itens/resumo financeiro e escolha de carteira à direita. Mobile: tela centrada na seleção da carteira conectada, carteira/rede e botão confirmar no rodapé. São composições distintas, não simples redimensionamento. |
| Confirmação | desktop apenas | **Modal centralizado** sobre fundo escuro, comprovante com dados, linhas de NFTs, totais e CTA “Ver no Etherscan” como referência visual. Não implica integração blockchain real. |
| Login e cadastro | desktop / mobile | Desktop: **modal sobre a página inicial** com backdrop; mobile: **telas completas dedicadas** sem header de marketplace, com logo KURIO, campos, botão, alternativas sociais e link de alternância. |
| Perfil | desktop apenas | Layout com navegação lateral “Meu perfil”, seção de dados, avatar e alteração de senha; não há frame mobile explícito. |
| Carteiras | desktop apenas | Mesmo shell de conta com navegação lateral, formulário de carteira principal e seção de carteira secundária; sem frame mobile explícito. |

### Paleta e linguagem
- Fundo de toda a interface: marrom/preto muito escuro; superfícies com graduações de marrom escuro.
- Acentos laranja/cobre para abas ativas, ações e preço; tipografia clara com presença marcante de estilo monoespaçado.
- Fotografia/arte dos NFTs como foco; radius perceptível especialmente em imagens e containers.
- Borda fina marrom/laranja, sem aparência de interface branca genérica.
- **Não são tokens exatos**: extrair valores de pixels ou inspecionar o Figma quando o limite de MCP permitir.

## 2. Achados por componente e implementação

### P0 — Header universal
- Referência desktop mostra quatro itens de navegação; `MarketplaceHeader` atual contém somente três links (`Início`, `Mercado`, `Aprenda`), sem `Criadores`.
- O texto literal `Carrinho` deve tornar-se botão/link com ícone vetorial de carrinho e badge circular de quantidade **reativo ao estado real do carrinho** (guest e logado); navegação ativa deriva da URL, não de estado local persistente.
- Botão Entrar com ícone de acesso (observável no frame). Modal no desktop; em mobile segue a composição full-screen do Figma.
- Há duas implementações de header (`store-header.tsx` e `marketplace-header.tsx`): consolidar sem quebrar importação de `SearchIcon`.
- O ponto `Mercado` poderá navegar para o catálogo da Home (âncora) se for essa a rota projetada; o destaque ativo deve refletir contexto real, não cor fixa.

### P0 — Filtros reais e URL
- `src/routes/index.tsx` lista `Fotografia`, `Música`, `Generativa`, `Jogos`, `Assinaturas`, `Utilidade` sem `id` e as renderiza como `filter-option-static`. Da mesma forma, `Ethereum`, `Polygon`, `Solana` são estáticos.
- `!search.category && category.id === 'nature'` aplica estilo selecionado a `Arte digital` mesmo com todos filtros removidos. Corrigir para sem categoria = “todas” sem seleção enganosa.
- Para filtros de categoria/rede que não existem no contrato `NftListParams`/MSW, **não converter em botões falsos**. Estender contrato + validação + banco mock + URL + teste coerentemente, **somente para opções visíveis no Figma**. Se dados de mock não cobrirem uma categoria, decidir e documentar estado vazio genuíno; não inventar contagens.
- Preço: aproximar visualmente o controle do sidebar do frame desktop; o intervalo exibido, o thumb, a trilha e o CTA devem refletir o valor real; sincronizar retorno à URL. Evitar sobrescrever outros parâmetros.
- Confirmar pela referência a presença/ausência de “Somente disponíveis”, “Limpar todos” e “Todas as coleções”; remover elementos não projetados **apenas da interface**, se não forem requisitos funcionais obrigatórios; reter capacidade de reset e teclado de modo alcançável.
- Categorias na imagem do Figma são texto + contagem; os totais no código (`33,12,...`) estão hardcoded. **Não alegar que contagem é verdadeira** sem derivar do mock ou declarar demonstração.

### P0 — Barra mobile
- Referência: 5 posições; Home, favoritos, CTA central elevado com recorte semicircular, carrinho, conta. Ícones vetoriais consistentes, somente um item selecionado.
- Evitar emojis e CSS com recorte frágil; SVG path responsivo, fundo escuro e botão central cobre. Garantir safe-area, hit targets ≥44px, estados ativo/hover/focus e padding-bottom do conteúdo.
- Verificar a ação real do CTA central conforme o design; não criar ação falsa. Favoritos requer sessão? Abrir login/respeitar funcionalidade.
- Mobile Home: busca e filtros no topo, hero card pequeno, tabs scrolláveis, catálogo em 2 colunas e badge/coração sobre imagem.

### P0 — Autenticação responsiva
- Desktop de **Login** e **Cadastro** mostra modais sobre o catálogo/hero, não páginas isoladas.
- Mobile de Login/Cadastro: frames full-screen com logo centralizado no topo, formulário, alternativa visual de provedores e link de alternância — NÃO forçar um modal compacto desktop em mobile.
- Atual `AuthPage` renderiza `account-page` em qualquer viewport. Extrair `AuthForm` reutilizável e hospedar em dialog acessível desktop, shell mobile dedicado. Manter rotas `/login` e `/register` para deep link ou fallback, controlar fechamento via Escape, backdrop, foco, retorno ao gatilho, `aria-modal`, rolagem e URL de retorno.
- Social login aparece como referência visual; **NÃO fingir que Google/Facebook funcionam**. Se backend não oferece OAuth, marcar opções indisponíveis com explicação acessível ou não exibir até orientação do desafio; não adotar login simulado enganoso.
- Para compra sem sessão, retomar o checkout/carrinho após autenticação, preservando a intenção.

### P0 — Detalhes do NFT
- Atual rota `/nft/$slug` utiliza `NftActions`; redesenhar shell desktop com miniaturas verticais, protagonista, informações (título, preço, avaliação quando disponível, coleção, metadados, edição, quantidade, CTA e favorito). Bloco “Mais desta coleção” em grid e texto de descrição abaixo.
- Mobile: hero imagem grande, ações superiores voltar/favorito, info diretamente abaixo, seleção de edição em chips, controle de quantidade e CTAs; rolagem segura.
- **Não inventar** avaliações, imagens secundárias únicas, atributos ou metadados do modelo; usar dados existentes, expandir fixtures de mock documentadas apenas se exigido pelo desafio; miniaturas repetidas devem ser reconhecidas como assets demonstrativos.

### P0 — Carrinho
- Desktop: tabela organizada com imagem, nome, preço unitário, edição, quantidade e total por item; resumo lateral com cupom, subtotal, taxa, desconto e total (cotação oficial do mock). Recomendações abaixo.
- Mobile: empilhar cards compactos e resumo, preservando controle quantitativo acessível, remover e cupom; CTA inferior.
- Não mudar domínio financeiro; manter ETH decimal exato, persistência guest, merge no login, quote autoritativo.

### P0 — Pagamento
- Desktop frame contém vários campos de “Perfil do colecionador” e formulário de carteira (nome, rede, endereço, tipo, e-mail, ENS etc.) e resumo à direita. O **README é fonte funcional de verdade**: não impor envio de campos que o backend não suporta nem obrigar a conexão com carteira real.
- Mobile mostra seletor de carteiras e serviços de conexão; redesenhar responsivo com os dados que o sistema possui; se sistemas de wallet externos não estão implementados, manter a simulação explicitamente identificada.
- Preservar revalidação antes de confirmar, fluxo idempotente, status pending/declined/confirmed e recuperação de pedido.

### P0 — Confirmação
- Desktop: modal central com tabela de NFTs, taxas, valores e CTA tipo explorador blockchain.
- A implementação atual (`Receipt` em `private-pages.tsx`) é página simples. Usar componente de recibo compatível com modal/overlay e deep link `/orders/$orderId`, sem perder acessibilidade ou estados de pedido. `Ver no Etherscan` só se existir URL real e confiável; caso contrário, não inventar transação blockchain.

### P1 — Perfil e carteiras
- Ambos os frames desktop têm sidebar “Meu perfil” com links/itens; formulário principal ocupa outra coluna. Perfil tem avatar, campos de dados e senha separados. Carteiras tem formulário em colunas e seção de principal/secundária.
- Mobile não foi exportado: seguir design system e adaptar logicamente sem alegar equivalência a um frame inexistente.
- APIs existentes só modelam `label`, `address`, `network`, `isPrimary` para carteira e `displayName`, `bio`, `avatarUrl` para perfil; campos do Figma não presentes nos contratos exigem decisão explícita: somente visualização desabilitada/placeholder ou extensão integral da API simulada se requisito justificar.

### P1 — Cards, footer e conteúdo editorial
- Cards NFT: garantir radius visível no frame, `overflow:hidden` em imagem; estado favorito/raridade conforme screenshot e dados do mock; alinhamento consistente e loading skeleton.
- Blocos entre catálogo e “Diário da Cunhagem”: estudar composição como um todo (imagem/CTA/texto), não só margin/padding.
- Footer desktop: barra editorial/benefícios, campo newsletter, social ícones dentro de retângulos de cantos arredondados, carteiras compatíveis como badges; respiro na versão mobile. Não transformar ações estáticas sem backend em sucesso falso.
- Remover “Diagnóstico técnico” de navegação pública, mantendo `/validation` para testes e dev; sem quebrar Playwright.

## 3. Arquivos priorizados

| Responsabilidade | Arquivos existentes |
|---|---|
| Home/filtros/footer/mobile nav | `src/routes/index.tsx`, `src/app/styles.css` |
| Header | `src/shared/components/marketplace-header.tsx`, `src/catalog/components/store-header.tsx` |
| NFT cards | `src/catalog/components/nft-card.tsx`, `src/marketplace/nft-actions.tsx`, `src/routes/nft.$slug.tsx` |
| Auth | `src/auth/auth-page.tsx`, `src/auth/session-context.tsx`, `src/routes/login.tsx`, `src/routes/register.tsx` |
| Cart/checkout/order/profile/wallet | `src/marketplace/private-pages.tsx`, `src/routes/{cart,checkout,profile,wallets}.tsx`, `src/routes/orders.$orderId.tsx` |
| Filtros e mocks, somente se necessário | `src/api/contracts/marketplace.ts`, `src/api/marketplace-api.ts`, `src/mocks/database.ts`, `src/mocks/handlers.ts` |
| QA | `tests/e2e/{foundation,catalog,account,purchase}.spec.ts`, `tests/unit/*` |

## 4. Plano operacional para Codex com consumo controlado de tokens

**Lote 1 (compartilhados):** consolidar header, active nav por rota, carrinho+badge, ícones, cards/radius, base responsiva, footer, mobile notch. Commit(s), testes relevantes.

**Lote 2 (Home e filtros):** filtros interativos reais, correção “Todas”, URL, preço, tabs, hero, editorial e paginação; adaptar contratos/MSW apenas quando requerido. Testes dos filtros e regressão.

**Lote 3 (auth + detalhes):** login/cadastro responsivo (modal desktop/fullscreen mobile); fluxo de retorno; detalhes de NFT desktop/mobile, edições/favorito/quantidade/CTA.

**Lote 4 (compra):** cart + checkout + receipt, desktop/mobile, sem mudar invariantes de domínio.

**Lote 5 (conta):** perfil e carteiras + sidebar, acessibilidade e responsividade sem frame mobile.

**Lote 6 (QA):** screenshots em 1440, 768, 414 e 390; comparar com PNGs de referência na escala correta; ajustar; `typecheck`, `lint`, `test`, `build`, Playwright; Lighthouse após estabilizar. Não atualizar snapshots para esconder erros. Conventional Commits por entrega. Não dar push/deploy sem permissão.

## 5. Critérios de aceitação obrigatórios

1. Sem links visíveis “falsamente clicáveis”/sem ações; os botões existentes operam via REST/MSW/Socket.IO quando exigidos.
2. Filtros exibidos como ativos somente quando filtro correspondente estiver realmente ativo; serialização consistente e back/forward/refresh.
3. Carrinho exibe contagem correta para guest/logado, atualizada após operações; estados vazios coerentes.
4. Login/cadastro alternam e retornam ao contexto anterior, com foco/teclado/escape conforme viewport.
5. Conteúdo principal sem overflow em 390, 414, 768, 1440px; barra fixa não cobre controles.
6. Todas páginas compatíveis com screenshots nos frames exportados. Onde não há frame, registrar inferência.
7. Não alterar lógica financeira, regras de sessão/privacidade nem substituí-las por dados estáticos de Figma.
8. Testes existentes passam; adicionar cobertura quando mudanças exigirem; relatórios de QA incluem o que foi realmente executado.

## 6. Limitações e perguntas técnicas a resolver pelo código

- O arquivo PNG não disponibiliza hierarquia Auto Layout nem medidas CSS verificadas; valores derivados de export 2× são **aproximativos**.
- Falta screenshot atual da aplicação no mesmo viewport e dados; por isso não há diff pixel a pixel real nem SSIM.
- Não existem frames mobile exportados de Perfil, Carteiras ou Confirmação. Inferir adaptação responsiva sem declarar “igual ao Figma”.
- As artes visíveis nos frames podem não corresponder 1:1 aos 4 assets de Figma incluídos no source ZIP; não gerar obras novas sem autorização nem usar imagens remotas aleatórias.
- Alguns elementos de Figma (OAuth, serviços de carteira, Etherscan, notas de avaliações) podem ser apenas UI de referência. Priorizar o README e não inventar integrações.
