# Matriz de requisitos

Evidências de teste referem-se ao log E2E versionado em `test-results/full-e2e.stdout.log` e à execução Vitest desta revisão. O estado do deploy distingue build/publicação de validação funcional na URL pública.

| ID | Requisito | Evidência | Estado |
| --- | --- | --- | --- |
| EL-01 | Stack obrigatória em uso efetivo | Código/configuração: React, TypeScript, Router, Query, Axios, REST, Socket.IO, Tailwind, MSW, Playwright e Lighthouse | Implementado; revisão de código |
| EL-02 | Fluxos principais funcionais | Log Playwright: 48/48 aprovados, em Chromium desktop e mobile | Verificado localmente |
| EL-03 | Compra somente após confirmação simulada | E2E cobre recibo confirmado, recusa e timeout com recuperação idempotente | Verificado localmente |
| EL-04 | Isolamento de sessão/dados privados | E2E de conta cobre favoritos privados, logout e sobrevivência da sessão após refresh | Verificado localmente |
| EL-05 | Tempo real via Socket.IO | E2E cobre ligação MSW/Socket.IO, `nft.updated` e entrega de `order.updated` ao assinante correto | Verificado localmente |
| EL-06 | Suítes executáveis | Vitest: 20/20 nesta revisão; Playwright: 48/48 no log versionado | Verificado localmente |
| CAT-01 | Catálogo na URL | E2E cobre busca, filtros, ordenação, URL direta, refresh, paginação e histórico | Verificado localmente |
| CART-01 | Carrinho persistente e merge visitante | Unit cobre política de merge/limite; E2E cobre merge antes do checkout | Verificado localmente |
| PAY-01 | ETH exato e cotação autoritativa | Unit cobre decimal/cotação; E2E revalida antes da compra | Verificado localmente |
| ORD-01 | Idempotência e recibo imutável | Unit e E2E cobrem repetição, conflito e timeout após criação | Verificado localmente |
| RT-01 | Eventos versionados e reconciliação REST | Unit cobre gate de versões; E2E cobre o transporte e eventos | Verificado localmente |
| UX-01 | Responsividade/Figma | E2E verifica contenção em múltiplos viewports e gera capturas; não há comparação pixel-perfect final registrada | Parcialmente verificado |
| A11Y-01 | Teclado, foco, labels e feedback | Estados/labels e fluxos principais exercitados em E2E; não há auditoria manual independente registrada | Parcialmente verificado |
| PERF-01 | Lighthouse | Métricas locais e relatórios de 2026-11-11 preservados em `docs/LIGHTHOUSE-2026-11-11.md` | Verificado localmente; não representa a URL pública |
| DEP-01 | Deploy público reproduzível | Build/publicação informados; URL: https://kurio-nft-marketplace-wbeat.vercel.app | Publicado; validação funcional pública não registrada |
