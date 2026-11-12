# Arquitetura

## Visão geral

KURIO é uma SPA React/TypeScript construída com Vite. O TanStack Router define as rotas e mantém busca, filtros, ordenação e paginação do catálogo na URL. O TanStack Query é a fonte de estado para dados remotos; Axios é o único cliente REST de funcionalidades. MSW fornece a API simulada no navegador e em testes.

As rotas privadas (checkout, pedidos, perfil, favoritos e carteiras) dependem da sessão e preservam a rota de retorno. A aplicação publicada usa o fallback SPA configurado na Vercel, portanto URLs internas são resolvidas pelo cliente após um refresh.

## REST e contratos

Os tipos de transporte ficam em `src/api/contracts/marketplace.ts` e são consumidos pelo cliente Axios, handlers MSW e interface. A API simulada expõe:

| Recurso | Endpoints |
| --- | --- |
| Sessão | `POST /api/auth/{login,register,logout}`, `GET /api/auth/session` |
| NFTs | `GET /api/nfts`, `GET /api/nfts/:id` |
| Favoritos | `GET /api/favorites`, `PUT`/`DELETE /api/favorites/:nftId` |
| Carrinho | `GET /api/cart`, `PUT`/`PATCH`/`DELETE /api/cart/items`, `PUT /api/cart/coupon`, `POST /api/cart/merge-guest` |
| Cotação e pedido | `POST /api/coupons/validate`, `POST /api/quotes`, `POST /api/orders`, `GET /api/orders` e `GET /api/orders/:orderId` |
| Perfil e carteiras | `GET`/`PATCH /api/profile`, `POST /api/profile/password`, `GET`/`POST /api/wallets`, `PATCH /api/wallets/:walletId` |

Os handlers retornam erros estruturados com `code`, `message` e, quando aplicável, `fields`; os casos incluem 401, 404, 409, 422, erro de rede e 500 simulados. Os controles `POST /api/__mock/reset`, `PATCH /api/__mock/scenario` e endpoints relacionados existem exclusivamente para desenvolvimento/E2E e não são chamados pelas funcionalidades da interface.

## Sessão, isolamento e carrinho

O token de sessão simulado é mantido em `localStorage` e enviado em `x-session-token`; a sessão dura uma hora na base mock. O cliente consulta `/api/auth/session` ao restaurar a página. Sessão inválida/expirada remove o token e todas as queries privadas. Login, cadastro e logout também invalidam ou removem o cache privado. As chaves privadas incluem o id do usuário, impedindo que favoritos, pedidos, perfil, carteiras e carrinho de uma conta sejam lidos por outra. Senhas não são persistidas em claro: a fixture guarda apenas um valor derivado, adequado apenas à demonstração.

Todo request carrega também um `x-guest-id`. Antes da autenticação, o carrinho é associado a `guest:<id>` e persiste no armazenamento da simulação. Após login ou cadastro, `POST /api/cart/merge-guest` soma itens da mesma edição, preserva itens distintos e limita cada quantidade ao estoque atual; a resposta informa eventuais ajustes `STOCK_LIMIT`. O cupom do usuário autenticado prevalece; se não houver um, o cupom do visitante é usado. O carrinho visitante é esvaziado depois do merge.

## Cache e invalidação

A política padrão do Query é: `staleTime` de 30 segundos, uma tentativa após falha e sem refetch ao focar a janela. Chaves de catálogo incluem todos os parâmetros da URL; chaves privadas incluem usuário e recurso. Mutations gravam o retorno no cache quando ele é definitivo (por exemplo, carrinho e perfil) ou invalidam a chave afetada (por exemplo, carteiras, pedidos e login). Não há otimismo de preço/estoque: a resposta REST ou a cotação autoritativa atualiza a tela. Ao sair ou expirar a sessão, as queries privadas são removidas.

## Valores, cotações e pedidos

ETH atravessa a API como string decimal de 18 casas. `decimal.js` calcula soma, subtração, multiplicação e comparação com precisão 40 e arredondamento `ROUND_HALF_UP`; números de ponto flutuante do JavaScript não participam dos totais. A cotação calcula linhas, desconto, taxa e total usando o catálogo atual, inclui um fingerprint e é válida por cinco minutos. Checkout só cria um pedido com cotação ainda válida e cujo fingerprint/total ainda corresponde ao catálogo.

`POST /api/orders` exige `Idempotency-Key`, escopado ao usuário. A mesma chave com o mesmo payload retorna o pedido original; com payload diferente retorna 409. No cenário de timeout, a criação é persistida antes de a resposta de rede ser perdida, permitindo recuperação idempotente. Pedidos podem ser `pending`, `confirmed` ou `declined`; os dois últimos são terminais. A confirmação reduz estoque e remove apenas as quantidades compradas do carrinho; a recusa preserva o carrinho. O recibo é um snapshot imutável, com valores e referência de transação simulada.

## Tempo real e reconciliação

O cliente usa `socket.io-client` em WebSocket-only. O MSW intercepta o transporte com `@mswjs/socket.io-binding`. A base de dados emite envelopes versionados para `nft.updated` e `order.updated`, com id de evento, recurso, versão, data e payload. O pedido é entregue somente à sessão do respectivo usuário.

`RealtimeEventGate` descarta ids duplicados e versões menores ou iguais à já vista. Eventos de NFT atualizam o detalhe e invalidam catálogo/dados privados; eventos de pedido atualizam o pedido e invalidam a lista de pedidos. A cada reconexão, o cliente invalida as queries ativas para buscar a fonte REST. Os listeners são removidos e o socket desconectado quando a sessão muda ou o provider é desmontado.

## Limites conhecidos

- MSW, a base mock, carteiras e pagamentos executam inteiramente no navegador: não há backend, blockchain, extensão de carteira, cobrança ou transação real.
- O binding Socket.IO usado pelo MSW cobre a conexão WebSocket, eventos e a assinatura simulada desta aplicação; não oferece paridade completa de servidor Socket.IO (como rooms, namespaces e broadcast de produção).
- WalletConnect, MetaMask e Coinbase Wallet são opções de interface/simulação; não conectam provedores externos. Links de explorador e identificadores de transação no recibo também são simulados.
- Login social é exibido como indisponível, sem alegar integração OAuth.

## UX e Figma

A implementação aplica layouts responsivos e possui testes de contenção em 390, 414, 768, 1024, 1155, 1280 e 1440 px. Login/cadastro usam modal com backdrop no desktop e shell dedicado no mobile, com Escape, fechamento pelo backdrop, foco inicial e retorno à rota anterior. As capturas visuais de home, detalhe, carrinho e checkout fazem parte da suíte E2E. Elas sustentam a revisão funcional e de responsividade, mas não constituem alegação de equivalência pixel-perfect absoluta ao Figma.

## Verificação e deploy

O log `test-results/full-e2e.stdout.log` registra 48 testes Playwright aprovados (desktop e mobile). A suíte Vitest executada nesta revisão registrou 20 testes aprovados. As métricas Lighthouse locais estão preservadas em `docs/LIGHTHOUSE-2026-11-11.md`; não são uma medição da Vercel. A URL pública de entrega é https://kurio-nft-marketplace-wbeat.vercel.app.
