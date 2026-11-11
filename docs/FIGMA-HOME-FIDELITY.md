# Home — fidelidade ao Figma

> Estado atual: a Home é uma fundação funcional e visual provisória. A fidelidade
> final ao Figma, incluindo comparação visual, ainda será implementada em uma
> etapa posterior; nenhuma afirmação neste documento representa aprovação
> pixel-perfect.

Referência visual somente leitura: `jH7WpcwMcBY8cJnQfVk1gE`, Desktop / Início (`2:2`, 1440 × 3668) e Mobile / Início (`14:5226`, 414 × 896).

## Adequações incluídas

- Home completa com header, hero, filtros, cards, promoções, Diário da Cunhagem, benefícios, contatos e rodapé.
- Hierarquia e textos do design para as principais seções, paleta `#140D0A`, `#241612`, `#D28A4C`, `#E89B55`, `#CFB28C` e família **Roboto Mono**.
- Layout desktop de 1200 px centralizado, hero 450 px, sidebar 310 px, galeria de três colunas, cartões de 258 × 356 px e espaçamento de 72 px entre linhas.
- Mobile com largura de conteúdo `viewport - 48px`, hero 188 px, catálogo em duas colunas assimétricas e navegação inferior fixa.
- Nomes/preços dos nove NFTs alinhados à referência, mantendo os IDs técnicos do mock para preservar os contratos de carrinho, API e cenários. A chave de persistência local do mock passou de `jungle-mock-db-v1` para `jungle-mock-db-v2` para que fixtures antigas não reapareçam após atualizar a interface; os dados de desenvolvimento da chave anterior não são migrados.
- Busca, filtros suportados pela API, ordenação, preço máximo e paginação ligados à URL e ao MSW. A ordenação no mobile fica disponível dentro dos filtros.

## Limitações verificáveis

A inspeção do Figma alcançou o limite MCP do plano durante a consulta do contexto de design mobile. As capturas renderizadas e o contexto da Home desktop foram consultados, mas **não houve inspeção detalhada de cada layer mobile nem validação por comparação pixel a pixel**.

O projeto recebido continha apenas **quatro imagens originais exportadas do Figma**. Elas foram reutilizadas nos diferentes slots conforme o design, mas imagens e ícones exclusivos não foram todos exportados. Alguns símbolos de navegação são aproximações SVG/texto e não os SVGs exatos do arquivo.

A fonte é carregada por Google Fonts (`Roboto Mono`); não acompanha uma cópia local, e pode usar fallback se a fonte externa estiver indisponível.

A aba de rede contém contagens decorativas do design; o contrato `Nft` atual não disponibiliza uma rede para filtrar. Não foi implementado comportamento falso para essa seleção. O blog e as áreas de conta permanecem estáticos, conforme o escopo original do desafio.

A instalação npm foi bloqueada por indisponibilidade de dependências no cache/rede do ambiente de edição. **Typecheck, lint, build, Playwright e comparação de screenshots devem ser executados no Windows antes de declarar fidelidade final.**

## Verificação final recomendada

1. `npm.cmd ci`, `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run test`, `npm.cmd run build`, `npm.cmd run test:e2e`.
2. Capturas nos viewports 1440 × 3668 e 414 × 896, comparadas aos frames citados.
3. Inspeção manual de layout, texto, cores, tamanhos, fontes, assets e interações, principalmente nos componentes que ainda utilizam símbolos aproximados.
