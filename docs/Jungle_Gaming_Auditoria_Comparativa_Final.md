# Jungle Gaming — Auditoria comparativa visual (Figma × capturas finais do Codex)

**Fontes examinadas:** `Frontend Challenge (Copy) (1).zip` (15 exports: 9 desktop e 6 mobile); `jungle-qa-final.zip` (19 capturas finais: 11 desktop e 8 mobile); capturas adicionais enviadas no chat. **Data:** 11/11/2026. Esta é uma auditoria visual das imagens enviadas; não significa que o código atualizado foi executado ou que o site publicado foi testado.

## Conclusão

**NÃO APROVADO em fidelidade visual.** As divergências não se limitam a bordas, margens e ícones: existem composições diferentes em Detalhes, Carrinho, Checkout, Login/Cadastro e Perfil/Carteiras; no mobile, os maiores problemas são Detalhes, Carrinho, Pagamento e Autenticação. Testes automatizados verdes comprovam comportamentos cobertos, não igualdade com o Figma.

### Método e limites
- Desktop: imagens originais **2880 px** (exportação 2× de frames de 1440px); screenshots atuais **1440px**, comparadas em escala equivalente. Algumas capturas atuais foram feitas a 1000px de altura, enquanto os frames originais são mais altos.
- Mobile: Figma **828×1792** (414×896 CSS), screenshots atuais **390px** de largura e altura de página inteira. Algumas divergências decorrem da diferença de largura, mas não explicam diferenças estruturais profundas. Recomendo recapturar também em **414×896** para validação inequívoca.
- Os estados são diferentes: o Figma usa usuário visitante e carrinho com múltiplos NFTs, enquanto as capturas do Codex mostram usuário autenticado, carrinho com um único NFT e checkout vazio. Comparar **o mesmo estado com os mesmos NFTs** antes de concluir se algum campo dinâmico está incorreto.
- Há referência desktop para **Confirmação de Pedido**, mas **não há captura atual dela** no ZIP. Há screenshots atuais mobile de Perfil/Carteiras, porém **não existem frames mobile específicos** correspondentes no ZIP do Figma.
- O documento aponta diferenças diretamente visíveis e requisitos que exigem validação adicional; não assume que elementos fora do recorte estão ausentes do código.

## P0 — Bloqueadores à entrega visual

### D01 — Detalhes do NFT desktop — reconstrução estrutural
**Referência:** `Desktop/Detalhes do NFT.png`; **atual:** `desktop/nft-detail.png`.
- **Figma:** breadcrumbs; galeria de quatro miniaturas e imagem; ficha compacta à direita com `Emerald Ape #042`, preço e avaliações na mesma linha; divisor; texto sobre o NFT; quatro chips de edição `1/1`, `1/10`, `1/50`, `ABERTA`; quantidade e botões na mesma área, metadados (token, coleção, atributos), compartilhar; **Mais desta coleção** (5 cards na linha, indicadores), **abas** de Detalhes e Avaliações com textos completos, footer.
- **Atual:** criador e título destacados em hierarquia diferente; descrição genérica curta; caixa grande separada de seleção/quantidade/comprar; apenas chip `Standard Edition`; preço com precisão exagerada de `1.190000000000000000 ETH`; token/estoque isolados; recomendações em outro padrão com apenas 3 cards; avaliações em card informativo separado em vez de abas; footer está presente.
- **Ação:** refazer a *estrutura do JSX* e CSS da coluna direita; chips de edição, metadados, compartilhamento, recomendações 5-colunas, tabs e conteúdo; formatar ETH sem zeros excessivos **sem alterar cálculos exatos**; manter dados por API, construir mocks compatíveis com demo. **Não** resolver só com overrides de CSS.

### M01 — Detalhes do NFT mobile — reconstrução total
**Referência:** `Mobile/Detalhes do NFT.png`; **atual:** `mobile/nft-detail.png`.
- **Figma:** somente ações redondas voltar/favoritar no topo, imagem principal larga contida no viewport, ficha sobre fundo marrom começando **logo abaixo da imagem**, nome, rating, descrição, edições e metadados; painel de compra compacto na parte inferior, quantidade, preço e CTA.
- **Atual:** header horizontal com KURIO/Carrinho/Perfil/Sair que não pertence ao frame; imagem **ampliada/cortada**, rosto sai do enquadramento; ficha com título/descrição embaixo, distante e com cartão arredondado sobreposto; controles e ações extrapolam a primeira dobra.
- **Ação:** layout mobile próprio para detalhes; imagem com `object-fit: contain` ou `cover` conforme enquadramento de referência, mantendo rosto inteiro; esconder header desktop se não previsto; recompor ficha e CTA dentro da janela de 414×896 respeitando safe area.

### D02 / M02 — Carrinho
**Referência:** `Desktop/Carrinho de NFTs.png`, `Mobile/Carrinho de NFTs.png`; **atual:** `desktop/cart.png`, `mobile/cart.png`.
- **Desktop Figma:** tabela compacta de itens com quatro colunas `NFTs / Preço / Edições / Total`, miniaturas, controles e exclusão na mesma linha; resumo de carteira à direita com cupom, subtotal, desconto, taxa e total, botão e continuar comprando; recomendações cinco em linha e footer.
- **Desktop atual:** título grande `Seu carrinho`, item isolado em card, cupom fora do resumo, painel compacto com valores em outra composição; recomendações em 3 cards grandes; margens/seções deslocadas. O número de NFTs difere por **estado da sessão**, não necessariamente bug de dados.
- **Mobile Figma:** cabeçalho discreto com seta e título `Carrinho de NFTs`, linhas pequenas de NFTs (imagem esquerda, texto e preço no meio, +/- à direita), bloco de cupom e resumo no **mesmo painel contínuo**, CTA grande ao final.
- **Mobile atual:** header horizontal de desktop, item vertical alto ocupando muito espaço, cupom isolado em outro painel, resumo isolado; no primeiro viewport aparece só um item.
- **Ação:** layouts desktop (tabela) e mobile (linhas compactas) separados; resumo/cupom/total e CTA nos lugares do Figma; preservar atualização do badge, estoque, preço, desconto e merge do carrinho visitante.

### D03 / M03 — Checkout/pagamento
**Referência:** `Desktop/Pagamento.png`, `Mobile/Pagamento.png`; **atual:** `desktop/checkout.png`, `mobile/checkout.png`.
- **Captura atual:** mostra `Seu carrinho está vazio` e footer; **não representa o estado de checkout preenchido** do Figma. É a maior lacuna de evidência: a composição de pagamento não foi capturada no cenário de compra, apesar de haver testes funcionais.
- **Desktop Figma:** formulário de dados do colecionador em duas colunas à esquerda (nome de exibição, usuário, rede, perfil, carteira, tipo, código, email, ENS, observações) e painel à direita com NFTs, desconto, taxas, seleção da carteira/rede e CTA.
- **Mobile Figma:** `Pagamento com carteira` e voltar, cartões de carteiras conectadas, opções WalletConnect/MetaMask/Coinbase, total e botão Confirmar compra. **Não há footer aparente no viewport.**
- **Ação:** antes de afirmar se falta formulário, preparar dados de 3 NFTs, abrir checkout real desktop/mobile e gerar novas capturas; implementar composição exigida se divergir. Não considerar screenshot de carrinho vazio validação visual do pagamento.

### D04 — Confirmação de pedido
**Referência:** `Desktop/Confirmação de Pedido.png`; **atual:** nenhuma captura no ZIP.
- **Figma:** comprovante modal central em fundo escuro: mensagem de sucesso, identificador/data/total/carteira, tabela NFT/Edições/Subtotal, taxa/total, texto e CTA Etherscan, borda laranja inferior.
- **Ação:** executar compra confirmada em MSW e capturar modal; preservar rota de recibo e snapshot/estados pendente/recusado. Não afirmar conformidade sem imagem.

### D05 / M04 — Login e Cadastro
**Referências:** `Desktop/Login.png`, `Desktop/Cadastro.png`, `Mobile/Login.png`, `Mobile/Cadastro.png`; **atuais:** `desktop/login.png`, `desktop/register.png`, `mobile/login.png`, `mobile/register.png`.
- **Desktop Figma:** modal deslocado à esquerda do centro, sobre **home/catálogo completo visível ao fundo**; cabeçalho com `Entrar | Criar conta`, inputs bem delimitados, ação grande, divisória e botões sociais; cadastro contém nome, e-mail, senha **e confirmar senha**.
- **Desktop atual:** modal central menor, com backdrop muito escuro, tamanho e posicionamento distintos; fundo aparece apenas parcialmente porque captura tem 1000px de altura; formulário menos fiel (cadastro mostra **3 campos, sem confirmação de senha** na captura).
- **Mobile Figma:** **tela cheia e sem um card/formulário flutuante**, logo em posição superior, campos ocupam quase toda largura, botão largo, divisor social, ações Google/Facebook e link de alternância **todos dentro do viewport 414×896**.
- **Mobile atual:** logo e título muito grandes e afastados; campos e botão dentro de **card central com borda** que não existe no Figma; formulário é empurrado para baixo, links sociais ficam fora da primeira dobra; cadastro com apenas 3 inputs, sem confirmação de senha, e botão com outra composição.
- **Ação:** adaptar modal desktop ao frame; autenticação mobile full-screen **sem card**, comprimindo espaços conforme referência e garantindo os quatro campos do cadastro. Não implementar login social fictício se backend não comportar; preservar identidade visual e mostrar indisponibilidade acessível.

### D06 — Perfil desktop
**Referência:** `Desktop/Perfil do Colecionador.png`; **atual:** `desktop/profile.png`.
- **Figma:** sidebar com ícones/estados, formulário amplo **duas colunas** com Nome exibição, Nome usuário, E-mail, Nome ENS com seletor `.eth`, Apelido carteira e upload/avatar; abaixo seção alterar senha em **três campos** (atual, nova, confirmar) empilhados, botão Salvar pequeno.
- **Atual:** sidebar em texto, formulário vertical com apenas nome, Bio, URL avatar, botão largo; alterar senha só com 2 campos lado a lado; footer inteiro ocupa a segunda metade, enquanto frame de perfil termina antes dele.
- **Ação:** reconstruir UI/formulários e adaptar contratos/mocks **somente se necessário** para campos requeridos, com validação; não fingir gravação de campos inexistentes. Alinhar sidebar e altura. Verificar se footer deve estar ausente desse frame ou apenas abaixo da dobra antes de remover qualquer coisa.

### D07 — Carteiras desktop
**Referência:** `Desktop/Carteiras.png`; **atual:** `desktop/wallets.png`.
- **Figma:** título e texto de `Carteira principal` com ação Adicionar; campos de exibição, apelido, rede, perfil, endereço, carteira, código, email, ENS em grid **duas colunas**; botão Salvar carteira; seção Carteira secundária com opção igual à principal/adicionar.
- **Atual:** card da carteira `Ana Main` no topo e formulário mínimo Nome/Endereço/Rede/Principal checkbox; falta a composição/maioria dos campos do Figma; sidebar sem iconografia; footer aparecendo na mesma captura.
- **Ação:** reconstruir campos e divisão principal/secundária, vincular o que for funcional aos contratos disponíveis; o que exigir backend inexistente deve ser implementado de forma coerente no mock ou explicitamente identificado, nunca controles decorativos mentirosos.

## P1 — Divergências fortes

### D08 — Home e Mercado desktop
**Referência:** `Desktop/Início.png`; **atual:** `desktop/home.png` (capturas alternativas `home-current`, `home-final`, `home-catalog-current` precisam ser consideradas evidência histórica; a captura final é `home.png`).
- Mesma arquitetura geral (hero, filtro, catálogo, promo cards, Diário, footer) e parte dos assets corresponde.
- Mas **escala/hierarquia e espaçamento** ainda não coincidem: no atual, hero tem espaçamento diferente, sidebar e grid possuem proporções distintas; cards têm outros offsets e tamanhos; título/listagem preço não refletem sempre o conteúdo do Figma.
- Cards editoriais: alinhamento da coluna direita **não é uniforme**, especialmente `Lançamentos gênesis`; há diferenças de altura/padding/botão; imagens necessitam manter enquadramento e cantos corretos.
- Footer: ícones agora parecem individuais na captura da página de detalhes e da Home, mas comparar tipografia, posicionamento e backgrounds/tags; confirmar que newsletter não encobre componentes.
- Filtros: categoria, redes, slider de preço, paginação e ativos merecem testes manuais; screenshot não comprova interatividade.
- **Ação:** alinhar geometria da Home com Figma (por regiões), corrigir promo 1 via mesma regra de alinhamento do promo 2; não gastar tempo em P3 enquanto páginas estruturais divergem.

### M05 — Home mobile
**Referência:** `Mobile/Início.png`; **atual:** `mobile/home.png`.
- Estrutura geral do topo reconhecível: busca, hero, tabs, grid de NFTs e bottom nav.
- Diferenças visíveis: hero tem desenho de fundo, escala do macaco e imagem menor de apoio em posição/tamanho diferentes; tipografia e espaçamento das tabs; cards e thumbnails mais quadrados/menores no atual, em vez de mais largos/altos no Figma; badge `RARO` e coração não aparecem da mesma forma nos primeiros itens; ícones da bottom nav com desenho diferente (outline vs preenchidos) e recorte central diferente.
- Screenshot atual é **full page 390px**, Figma apenas **primeiro viewport 414px**; recapturar em 414 para alinhar coordenadas, depois fixar nav no final do viewport sem cobrir o catálogo.

## Estado de cobertura e prioridades

| Frame | Captura atual | Situação | Prioridade |
|---|---|---|---|
| Desktop — Início | Sim | Parecido na macroestrutura, divergências em geometria/cards/footer | P1 |
| Desktop — Detalhes | Sim | Composição substancialmente errada | P0 |
| Desktop — Carrinho | Sim | Estrutura de linhas/resumo não corresponde | P0 |
| Desktop — Pagamento | Apenas vazio | **Não validável no cenário exigido**; refazer captura com itens | P0 |
| Desktop — Confirmação | **Não** | Evidência inexistente; modal necessário | P0 |
| Desktop — Login | Sim | Modal deslocamento, dimensão, backdrop | P1 |
| Desktop — Cadastro | Sim | Modal e campo confirmar senha divergentes | P0 |
| Desktop — Perfil | Sim | Campos/colunas/layout diferentes | P0 |
| Desktop — Carteiras | Sim | Campos/organização completamente diferentes | P0 |
| Mobile — Início | Sim | Hierarquia/ícones/cards/nav divergentes | P1 |
| Mobile — Detalhes | Sim | Imagem cortada + estrutura errada | P0 |
| Mobile — Carrinho | Sim | Layout não corresponde | P0 |
| Mobile — Pagamento | Apenas vazio | **Não validável no estado Figma** | P0 |
| Mobile — Login | Sim | Tela/composição erradas | P0 |
| Mobile — Cadastro | Sim | Tela/composição erradas, falta confirmação de senha | P0 |

**Capturas extras atuais sem frame mobile de referência:** `mobile/profile.png`, `mobile/wallets.png`. Avaliar consistência visual/responsividade e funcionalidade; não afirmar pixel-perfect para um frame que não existe. **Frame desktop sem captura atual:** `Confirmação de Pedido`.

## Plano de correção concreto

1. **Preparar fixtures e screenshots equivalentes** (login da conta esperada, catálogo, mesmo NFT, 3 itens no carrinho, checkout preenchido e comprovante); exportar PNG do viewport correspondente (1440 desktop e 414 mobile), sem comparar estado vazio com estado preenchido.
2. **Refazer Detalhes**: JSX da coluna direita, chip 4 edições, compartilhamento, 5 recomendações e abas; mobile separado com imagem inteira e bottom CTA. Preservar preços e idempotência.
3. **Refazer Carrinho e Checkout**: tabela/resumo desktop, linhas/painel contínuo mobile; fluxo de compra testável e capturável; confirmar comprovante modal.
4. **Refazer autenticação**: desktop modal alinhado/escala; mobile formulário direto full-screen, sem card, confirmar senha, redes sociais e links no viewport.
5. **Refazer Perfil/Carteiras**: grid de campos, sidebar e hierarquia conforme Figma, integrar ao mock de modo honesto, revalidar persistência e isolamento entre usuários.
6. **Ajustar Home e mobile nav**: cards editoriais, escala de imagens, badges, fundo, ícones e recorte central. Preservar correções do header e footer.
7. **Comparar novamente todos os 15 frames** e registrar divergências remanescentes por tela; rodar typecheck, lint, Vitest, build, Playwright desktop/mobile; testar public URL após deploy.

### Condições mínimas antes de marcar como pronto
- As 15 referências têm capturas correspondentes com **mesmo viewport e estado** (inclusive checkout e confirmação); frames mobile específicos ausentes são tratados como adaptação fundamentada, não como equivalência inventada.
- Estrutura, hierarquia, componentes e seções do Figma reproduzidos; não apenas cores/bordas.
- Fluxo da compra e autenticação realmente funcionam; testes verdes depois das mudanças.
- Não há elementos inacessíveis ou overflows de largura; bottom nav e modais mobile usáveis.
- Não afirmar 'idêntico' enquanto houver divergências visuais graves verificáveis.

**Observação:** HTML/JS de `D:\frontend-challenge` não foi acessado na execução atual. A auditoria confrontou imagens e, portanto, localiza **regiões funcionais a alterar**, não linhas definitivas no código mais recente. Os arquivos prováveis são `src/routes/index.tsx`, `src/routes/nft.$slug.tsx`, `src/marketplace/private-pages.tsx`, `src/auth/auth-page.tsx`, `src/shared/components/marketplace-header.tsx`, `src/shared/components/marketplace-footer.tsx` e estilos em `src/app/styles.css`/`src/app/figma-stage1.css`; confirme caminhos em seu repositório antes de editar.
