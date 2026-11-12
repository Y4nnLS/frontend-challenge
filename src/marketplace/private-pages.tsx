import { Fragment, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";

import type {
  Cart,
  Order,
  Profile,
  Wallet,
  WalletInput,
} from "@/api/contracts/marketplace";
import { marketplaceApi } from "@/api/marketplace-api";
import { privateKey, useSession } from "@/auth/session-context";
import { formatEth } from "@/catalog/lib/format-eth";
import { multiplyEth } from "@/shared/lib/money";
import { NftArtwork } from "@/catalog/components/nft-card";
import { NftCard } from "@/catalog/components/nft-card";
import { useCatalog } from "@/catalog/queries/use-catalog";
import {
  MarketplaceHeader,
  MobileAccountNavigation,
} from "@/shared/components/marketplace-header";
import { MarketplaceFooter } from "@/shared/components/marketplace-footer";
import { apiErrorMessage } from "@/shared/lib/api-error";
import { TrashIcon } from "@/shared/components/icons";

function Protected({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useSession();
  if (isLoading)
    return (
      <Page>
        <p role="status">Recuperando sessão…</p>
      </Page>
    );
  if (!session)
    return (
      <Page>
        <h1>Faça login para continuar</h1>
        <p>Esta área contém dados privados do colecionador.</p>
        <Link
          className="primary-button"
          aria-label="Acessar área protegida"
          to="/login"
          search={{ returnTo: location.pathname + location.search }}
        >
          Entrar
        </Link>
      </Page>
    );
  return <>{children}</>;
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <div className="kurio-app">
      <div className="site-container">
        <div className="desktop-header">
          <MarketplaceHeader />
        </div>
        <MobileAccountNavigation />
        <main className="account-page">{children}</main>
        <MarketplaceFooter />
      </div>
    </div>
  );
}

function AccountSidebar({ active }: { active: "profile" | "wallets" }) {
  return (
    <aside className="account-sidebar" aria-label="Meu perfil">
      <h2>Meu perfil</h2>
      <Link className={active === "profile" ? "active" : ""} to="/profile">
        Dados do perfil
      </Link>
      <Link className={active === "wallets" ? "active" : ""} to="/wallets">
        Carteiras
      </Link>
      <span>Atividade</span>
      <span>Lista de interesse</span>
      <span>Ofertas</span>
      <span>Arquivos baixados</span>
      <span>Suporte</span>
    </aside>
  );
}

function CartSummary({
  cart,
  checkoutLink = true,
  children,
}: {
  cart: Cart;
  checkoutLink?: boolean;
  children?: React.ReactNode;
}) {
  const { session } = useSession();
  const quote = useQuery({
    queryKey: session
      ? privateKey(session.user.id, "quote", cart.version, cart.couponCode)
      : ["quote", cart.version],
    queryFn: () => marketplaceApi.quote({}),
    enabled: cart.items.length > 0,
    retry: false,
  });
  if (!cart.items.length)
    return (
      <aside className="order-summary">
        <h2>Resumo</h2>
        <p>Seu carrinho está vazio.</p>
      </aside>
    );
  if (quote.isPending)
    return (
      <aside className="order-summary skeleton" aria-label="Carregando resumo">
        Carregando resumo…
      </aside>
    );
  if (quote.isError || !quote.data)
    return (
      <aside className="order-summary" role="alert">
        Não foi possível atualizar a cotação.
      </aside>
    );
  return (
    <aside className="order-summary">
      <h2>Resumo da carteira</h2>
      {children}
      <p>
        Subtotal <strong>{formatEth(quote.data.subtotalEth)} ETH</strong>
      </p>
      <p>
        Desconto do lançamento{" "}
        <strong>-{formatEth(quote.data.discountEth)} ETH</strong>
      </p>
      <p className="network-fee-row">
        Taxa de rede
        <strong>
          {formatEth(quote.data.networkFeeEth)} ETH
          <small>Taxa estimada</small>
        </strong>
      </p>
      <hr />
      <p className="order-total">
        Total <strong>{formatEth(quote.data.totalEth)} ETH</strong>
      </p>
      {checkoutLink && (
        <>
          <Link
            className="primary-button"
            aria-label="Ir para pagamento"
            to="/checkout"
          >
            Conectar e finalizar
          </Link>
          <Link className="continue-shopping" to="/">
            Continuar comprando
          </Link>
        </>
      )}
    </aside>
  );
}

function CartArtwork({ nftId, name }: { nftId: string; name: string }) {
  const nft = useQuery({
    queryKey: ["nft", nftId],
    queryFn: () => marketplaceApi.getNft(nftId),
    retry: false,
  });
  return nft.data ? (
    <NftArtwork nft={nft.data} className="cart-item-art" />
  ) : (
    <div
      className="cart-item-art skeleton"
      aria-label={`Carregando arte de ${name}`}
    />
  );
}

export function CartPage() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const [coupon, setCoupon] = useState("");
  const [message, setMessage] = useState("");
  const cart = useQuery({
    queryKey: session ? privateKey(session.user.id, "cart") : ["guest-cart"],
    queryFn: marketplaceApi.cart,
    retry: false,
  });
  const recommendations = useCatalog({ page: 1, pageSize: 6, sort: "recent" });
  const update = useMutation({
    mutationFn: marketplaceApi.setCartItem,
    onSuccess: (data) => {
      if (session)
        queryClient.setQueryData(privateKey(session.user.id, "cart"), data);
      else queryClient.setQueryData(["guest-cart"], data);
    },
    onError: (error) => setMessage(apiErrorMessage(error)),
  });
  const remove = useMutation({
    mutationFn: ({ nftId, editionId }: { nftId: string; editionId: string }) =>
      marketplaceApi.removeCartItem(nftId, editionId),
    onSuccess: (data) => {
      if (session)
        queryClient.setQueryData(privateKey(session.user.id, "cart"), data);
      else queryClient.setQueryData(["guest-cart"], data);
    },
    onError: (error) => setMessage(apiErrorMessage(error)),
  });
  const couponMutation = useMutation({
    mutationFn: marketplaceApi.setCoupon,
    onSuccess: (data) => {
      if (session)
        queryClient.setQueryData(privateKey(session.user.id, "cart"), data);
      else queryClient.setQueryData(["guest-cart"], data);
      setCoupon("");
      setMessage(
        data.couponCode
          ? `Cupom ${data.couponCode} aplicado.`
          : "Cupom removido.",
      );
    },
    onError: (error) => setMessage(apiErrorMessage(error)),
  });
  return (
    <Page>
      <div className="cart-page">
        <div className="page-breadcrumb">Início / Mercado / Carrinho</div>
        <div className="cart-mobile-heading">
          <Link to="/" aria-label="Voltar">
            ‹
          </Link>
          <h1>Carrinho de NFTs</h1>
        </div>
        <h1 className="cart-desktop-heading">Seu carrinho</h1>
        {cart.isPending ? (
          <p className="skeleton" role="status">
            Carregando carrinho…
          </p>
        ) : cart.isError || !cart.data ? (
          <p role="alert">Não foi possível carregar o carrinho.</p>
        ) : (
          <div className="cart-layout">
            <section className="cart-items">
              <div className="cart-table-head">
                <span>NFTs</span>
                <span>Preço</span>
                <span>Edições</span>
                <span>Total</span>
                <span aria-hidden="true" />
              </div>
              {cart.data.items.length ? (
                cart.data.items.map((item) => (
                  <article className="cart-item" key={item.id}>
                    <CartArtwork nftId={item.nftId} name={item.name} />
                    <div>
                      <h2>{item.name}</h2>
                      <p>
                        <span className="cart-item-edition">
                          {item.editionName}
                        </span>
                        <span className="cart-item-availability">
                          {" "}
                          · {item.available} disponíveis
                        </span>
                      </p>
                    </div>
                    <strong className="cart-unit-price">
                      {formatEth(item.unitPriceEth)} ETH
                    </strong>
                    <div className="cart-quantity">
                      <button
                        type="button"
                        aria-label={`Diminuir quantidade de ${item.name}`}
                        disabled={item.quantity <= 1}
                        onClick={() =>
                          update.mutate({
                            nftId: item.nftId,
                            editionId: item.editionId,
                            quantity: item.quantity - 1,
                          })
                        }
                      >
                        −
                      </button>
                      <input
                        aria-label={`Quantidade de ${item.name}`}
                        type="number"
                        min={1}
                        max={item.available}
                        value={item.quantity}
                        onChange={(event) =>
                          update.mutate({
                            nftId: item.nftId,
                            editionId: item.editionId,
                            quantity: Math.max(
                              1,
                              Number(event.target.value) || 1,
                            ),
                          })
                        }
                      />
                      <button
                        type="button"
                        aria-label={`Aumentar quantidade de ${item.name}`}
                        disabled={item.quantity >= item.available}
                        onClick={() =>
                          update.mutate({
                            nftId: item.nftId,
                            editionId: item.editionId,
                            quantity: item.quantity + 1,
                          })
                        }
                      >
                        +
                      </button>
                    </div>
                    <strong className="cart-line-total">
                      {formatEth(multiplyEth(item.unitPriceEth, item.quantity))}{" "}
                      ETH
                    </strong>
                    <button
                      className="cart-remove-button"
                      type="button"
                      aria-label={`Remover ${item.name} do carrinho`}
                      onClick={() => remove.mutate(item)}
                    >
                      <TrashIcon size={18} />
                    </button>
                  </article>
                ))
              ) : (
                <p>
                  Seu carrinho está vazio. <Link to="/">Explorar NFTs</Link>
                </p>
              )}
              {message && (
                <p role="status" className="mutation-notice">
                  {message}
                </p>
              )}
            </section>
            <CartSummary cart={cart.data}>
              <form
                className="coupon-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  couponMutation.mutate(coupon);
                }}
              >
                <label>
                  Código promocional
                  <span className="coupon-input-row">
                    <input
                      aria-label="Cupom"
                      value={coupon}
                      onChange={(event) => setCoupon(event.target.value)}
                      placeholder="Digite o código promocional..."
                    />
                    <button
                      className="primary-button"
                      disabled={couponMutation.isPending}
                    >
                      Aplicar<span className="sr-only"> cupom</span>
                    </button>
                  </span>
                </label>
                {cart.data.couponCode && (
                  <button
                    className="coupon-clear"
                    type="button"
                    onClick={() => couponMutation.mutate(null)}
                  >
                    Remover cupom
                  </button>
                )}
              </form>
            </CartSummary>
          </div>
        )}
        {recommendations.data && (
          <section
            className="cart-recommendations"
            aria-labelledby="cart-recommendations"
          >
            <h2 id="cart-recommendations">Colecionadores também viram</h2>
            <div className="related-nft-grid">
              {recommendations.data.items.slice(0, 5).map((item) => (
                <NftCard nft={item} key={item.id} />
              ))}
            </div>
          </section>
        )}
      </div>
    </Page>
  );
}

export function CheckoutPage() {
  const { session } = useSession();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const cart = useQuery({
    queryKey: session ? privateKey(session.user.id, "cart") : ["no-cart"],
    queryFn: marketplaceApi.cart,
    enabled: Boolean(session),
    retry: false,
  });
  const wallets = useQuery({
    queryKey: session ? privateKey(session.user.id, "wallets") : ["no-wallets"],
    queryFn: marketplaceApi.wallets,
    enabled: Boolean(session),
    retry: false,
  });
  const profile = useQuery({
    queryKey: session ? privateKey(session.user.id, "profile") : ["no-profile"],
    queryFn: marketplaceApi.profile,
    enabled: Boolean(session),
    retry: false,
  });
  const quote = useQuery({
    queryKey:
      session && cart.data
        ? privateKey(
            session.user.id,
            "checkout-quote",
            cart.data.version,
            cart.data.couponCode,
          )
        : ["checkout-quote"],
    queryFn: () => marketplaceApi.quote({}),
    enabled: Boolean(session && cart.data?.items.length),
    retry: false,
  });
  const [walletId, setWalletId] = useState("");
  const selectedWalletId =
    walletId ||
    wallets.data?.find((wallet) => wallet.isPrimary)?.id ||
    wallets.data?.[0]?.id ||
    "";
  const create = useMutation({
    mutationFn: async () => {
      if (!quote.data || !selectedWalletId || !session)
        throw new Error("Selecione uma carteira e aguarde a cotação.");
      const keyName = `jungle-order-key:${session.user.id}:${quote.data.id}`;
      const key = sessionStorage.getItem(keyName) ?? crypto.randomUUID();
      sessionStorage.setItem(keyName, key);
      try {
        return await marketplaceApi.createOrder(
          { quoteId: quote.data.id, walletId: selectedWalletId },
          key,
        );
      } catch {
        return marketplaceApi.createOrder(
          { quoteId: quote.data.id, walletId: selectedWalletId },
          key,
        );
      }
    },
    onSuccess: async (order) => {
      if (session && quote.data)
        sessionStorage.removeItem(
          `jungle-order-key:${session.user.id}:${quote.data.id}`,
        );
      await navigate({ to: "/orders/$orderId", params: { orderId: order.id } });
    },
    onError: (error) => setMessage(apiErrorMessage(error)),
  });
  const review = async () => {
    setReviewed(false);
    setMessage("");
    const result = await quote.refetch();
    if (result.data) {
      setReviewed(true);
      setMessage("Cotação revalidada. Confirme para enviar o pedido.");
    }
  };
  return (
    <Protected>
      <Page>
        <div className="checkout-page">
          <div className="page-breadcrumb">Início / Mercado / Pagamento</div>
          <div className="checkout-mobile-heading">
            <Link to="/cart" aria-label="Voltar">
              ‹
            </Link>
            <h1>Pagamento com carteira</h1>
          </div>
          <h1 className="checkout-desktop-heading">Pagamento</h1>
          {cart.isPending || wallets.isPending || profile.isPending ? (
            <p className="skeleton">Carregando checkout…</p>
          ) : !cart.data?.items.length ? (
            <p>
              Seu carrinho está vazio. <Link to="/">Voltar ao catálogo</Link>
            </p>
          ) : (
            <div className="checkout-layout">
              <section className="checkout-form">
                <h2>Perfil do colecionador</h2>
                <div className="checkout-fields">
                  <label>
                    Nome de exibição
                    <input defaultValue={profile.data?.displayName} required />
                  </label>
                  <label>
                    Nome de usuário
                    <input
                      defaultValue={profile.data?.displayName
                        ?.toLowerCase()
                        .replaceAll(" ", ".")}
                      required
                    />
                  </label>
                  <label>
                    Rede
                    <select
                      defaultValue={
                        wallets.data?.find(
                          (wallet) => wallet.id === selectedWalletId,
                        )?.network ?? "ethereum"
                      }
                    >
                      <option value="ethereum">Ethereum</option>
                      <option value="polygon">Polygon</option>
                    </select>
                  </label>
                  <label>
                    Nome do perfil
                    <input defaultValue={profile.data?.displayName} required />
                  </label>
                  <label>
                    Endereço da carteira
                    <input
                      defaultValue={
                        wallets.data?.find(
                          (wallet) => wallet.id === selectedWalletId,
                        )?.address
                      }
                      required
                    />
                  </label>
                  <label>
                    Tipo de carteira
                    <select defaultValue="coinbase">
                      <option value="coinbase">Coinbase Wallet</option>
                      <option value="metamask">MetaMask</option>
                      <option value="walletconnect">WalletConnect</option>
                    </select>
                  </label>
                  <label>
                    Código de indicação
                    <input />
                  </label>
                  <label>
                    E-mail
                    <input
                      type="email"
                      defaultValue={session?.user.email}
                      required
                    />
                  </label>
                  <label>
                    Nome ENS
                    <input placeholder=".eth" />
                  </label>
                  <label className="checkout-notes">
                    Observação do colecionador
                    <textarea />
                  </label>
                </div>
              </section>
              <aside className="checkout-summary">
                <h2>Seus NFTs</h2>
                <div className="checkout-lines">
                  {cart.data.items.map((item) => (
                    <div key={item.id}>
                      <CartArtwork nftId={item.nftId} name={item.name} />
                      <span>
                        <b>{item.name}</b>
                        <small>
                          ID do token: #{item.nftId.replace("nft-", "")}
                        </small>
                      </span>
                      <strong>
                        {formatEth(
                          multiplyEth(item.unitPriceEth, item.quantity),
                        )}{" "}
                        ETH
                      </strong>
                    </div>
                  ))}
                </div>
                <CartSummary cart={cart.data} checkoutLink={false} />
                <div className="checkout-connected-title">
                  <h2>Carteira conectada</h2>
                  <span>Trocar carteira</span>
                </div>
                <div className="checkout-connected-wallets">
                  {wallets.data?.map((wallet) => (
                    <label key={wallet.id}>
                      <input
                        type="radio"
                        name="wallet"
                        checked={selectedWalletId === wallet.id}
                        onChange={() => {
                          setWalletId(wallet.id);
                          setReviewed(false);
                        }}
                      />
                      <span>
                        <b>{wallet.label}</b>
                        <small>
                          {wallet.address.slice(0, 12)} · {wallet.network}
                        </small>
                      </span>
                    </label>
                  ))}
                </div>
                <h2 className="wallet-choice-title">Carteira e rede</h2>
                <div className="checkout-wallet-providers">
                  <label>
                    <input type="radio" name="wallet-provider" />
                    <span>
                      <b>WalletConnect</b>
                      <small>Conectar carteira</small>
                    </span>
                  </label>
                  <label>
                    <input type="radio" name="wallet-provider" />
                    <span>
                      <b>MetaMask</b>
                      <small>Conectar carteira</small>
                    </span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="wallet-provider"
                      checked
                      readOnly
                    />
                    <span>
                      <b>Coinbase Wallet</b>
                      <small>Carteira simulada conectada</small>
                    </span>
                  </label>
                </div>
                <button
                  className="secondary-button checkout-review"
                  type="button"
                  onClick={() => void review()}
                  disabled={quote.isFetching}
                >
                  Revalidar cotação
                </button>
                {message && (
                  <p role="status" className="mutation-notice">
                    {message}
                  </p>
                )}
                <button
                  className="primary-button checkout-confirm"
                  type="button"
                  aria-label="Confirmar pedido"
                  disabled={!reviewed || create.isPending || !selectedWalletId}
                  onClick={() => create.mutate()}
                >
                  {create.isPending ? "Enviando pedido…" : "Confirmar compra"}
                </button>
              </aside>
            </div>
          )}
        </div>
      </Page>
    </Protected>
  );
}

export function OrderPage({ orderId }: { orderId: string }) {
  const { session } = useSession();
  const order = useQuery({
    queryKey: session
      ? privateKey(session.user.id, "order", orderId)
      : ["order", orderId],
    queryFn: () => marketplaceApi.order(orderId),
    enabled: Boolean(session),
    retry: false,
  });
  return (
    <Protected>
      <Page>
        {order.isPending ? (
          <p role="status">Recuperando pedido…</p>
        ) : order.isError || !order.data ? (
          <p role="alert">Pedido não encontrado.</p>
        ) : (
          <Receipt order={order.data} />
        )}
      </Page>
    </Protected>
  );
}

function Receipt({ order }: { order: Order }) {
  const title =
    order.status === "confirmed"
      ? "Pedido confirmado"
      : order.status === "declined"
        ? "Pedido recusado"
        : "Pedido pendente";
  return (
    <div className="receipt-overlay">
      <section className="receipt">
        <div className="receipt-success">✓</div>
        <h1>{title}</h1>
        <p role="status">
          Pedido #{order.id} ·{" "}
          {new Date(order.createdAt).toLocaleDateString("pt-BR")}
        </p>
        {order.status === "pending" && (
          <p>
            Aguardando confirmação. Este pedido será recuperado ao atualizar a
            página.
          </p>
        )}
        {order.status === "declined" && (
          <p role="alert">
            O pagamento simulado foi recusado. Seus itens continuam no carrinho.
          </p>
        )}
        <p className="receipt-wallet">
          Carteira: {order.receipt.walletAddress}
        </p>
        <h2>Recibo imutável</h2>
        <div className="receipt-table">
          <b>NFTs</b>
          <b>Edições</b>
          <b>Subtotal</b>
          {order.receipt.lines.map((line) => (
            <Fragment key={`${line.nftId}:${line.editionId}`}>
              <span key={`${line.nftId}:name`}>
                {line.nftId.replace("nft-", "")}
              </span>
              <span key={`${line.nftId}:edition`}>
                {line.quantity} × {line.editionId.replace(`${line.nftId}-`, "")}
              </span>
              <strong key={`${line.nftId}:total`}>
                {formatEth(line.lineTotalEth)} ETH
              </strong>
            </Fragment>
          ))}
        </div>
        <div className="receipt-totals">
          <p>
            Taxa de rede{" "}
            <strong>{formatEth(order.receipt.networkFeeEth)} ETH</strong>
          </p>
          <p>
            Total <strong>{formatEth(order.receipt.totalEth)} ETH</strong>
          </p>
        </div>
        {order.status === "confirmed" && (
          <a
            className="receipt-explorer"
            href={`https://etherscan.io/tx/${order.receipt.transactionReference}`}
            target="_blank"
            rel="noreferrer"
          >
            Ver transação no Etherscan
          </a>
        )}
        <Link className="primary-button" to="/">
          Continuar explorando
        </Link>
      </section>
    </div>
  );
}

export function ProfilePage() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState("");
  const profile = useQuery({
    queryKey: session ? privateKey(session.user.id, "profile") : ["no-profile"],
    queryFn: marketplaceApi.profile,
    enabled: Boolean(session),
    retry: false,
  });
  const save = useMutation({
    mutationFn: marketplaceApi.updateProfile,
    onSuccess: (data) => {
      if (session)
        queryClient.setQueryData(privateKey(session.user.id, "profile"), data);
      setSaved("Perfil atualizado.");
    },
    onError: (error) => setSaved(apiErrorMessage(error)),
  });
  const password = useMutation({
    mutationFn: ({
      currentPassword,
      nextPassword,
    }: {
      currentPassword: string;
      nextPassword: string;
    }) => marketplaceApi.changePassword(currentPassword, nextPassword),
    onSuccess: () => setSaved("Senha atualizada."),
    onError: (error) => setSaved(apiErrorMessage(error)),
  });
  return (
    <Protected>
      <Page>
        <div className="account-layout">
          <AccountSidebar active="profile" />
          <section className="account-content">
            <h1>Perfil do colecionador</h1>
            {profile.isPending || !profile.data ? (
              <p>Carregando perfil…</p>
            ) : (
              <>
                <ProfileForm
                  profile={profile.data}
                  onSubmit={(input) => save.mutate(input)}
                  pending={save.isPending}
                />
                <form
                  className="account-form password-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const values = new FormData(event.currentTarget);
                    const nextPassword = String(values.get("nextPassword"));
                    if (
                      nextPassword !== String(values.get("confirmPassword"))
                    ) {
                      setSaved("As novas senhas não coincidem.");
                      return;
                    }
                    password.mutate({
                      currentPassword: String(values.get("currentPassword")),
                      nextPassword,
                    });
                  }}
                >
                  <h2>Alterar senha</h2>
                  <label>
                    Senha atual
                    <input name="currentPassword" type="password" required />
                  </label>
                  <label>
                    Nova senha
                    <input
                      name="nextPassword"
                      type="password"
                      required
                      minLength={8}
                    />
                  </label>
                  <label>
                    Confirmar nova senha
                    <input
                      name="confirmPassword"
                      type="password"
                      required
                      minLength={8}
                    />
                  </label>
                  <button className="primary-button">Salvar</button>
                </form>
                {saved && (
                  <p role="status" className="mutation-notice">
                    {saved}
                  </p>
                )}
              </>
            )}
          </section>
        </div>
      </Page>
    </Protected>
  );
}

function ProfileForm({
  profile,
  onSubmit,
  pending,
}: {
  profile: Profile;
  onSubmit: (input: {
    displayName: string;
    bio: string;
    avatarUrl: string | null;
  }) => void;
  pending: boolean;
}) {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? "");
  return (
    <form
      className="account-form profile-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ displayName, bio, avatarUrl: avatarUrl || null });
      }}
    >
      <label>
        Nome de exibição
        <input
          aria-label="Nome"
          required
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
        />
      </label>
      <label>
        Nome de usuário
        <input defaultValue={displayName.toLowerCase().replaceAll(" ", ".")} />
      </label>
      <label>
        E-mail
        <input type="email" defaultValue="contato@email.com" />
      </label>
      <label>
        Nome ENS
        <input placeholder=".eth" />
      </label>
      <label>
        Apelido da carteira
        <input
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          placeholder="Minha carteira principal"
        />
      </label>
      <label>
        Avatar
        <input
          type="url"
          value={avatarUrl}
          onChange={(event) => setAvatarUrl(event.target.value)}
          placeholder="URL do avatar"
        />
      </label>
      <button className="primary-button" disabled={pending}>
        Salvar
      </button>
    </form>
  );
}

export function WalletsPage() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Wallet | null>(null);
  const [message, setMessage] = useState("");
  const wallets = useQuery({
    queryKey: session ? privateKey(session.user.id, "wallets") : ["no-wallets"],
    queryFn: marketplaceApi.wallets,
    enabled: Boolean(session),
    retry: false,
  });
  const save = useMutation({
    mutationFn: (input: WalletInput) =>
      editing
        ? marketplaceApi.updateWallet(editing.id, input)
        : marketplaceApi.createWallet(input),
    onSuccess: () => {
      if (session)
        void queryClient.invalidateQueries({
          queryKey: privateKey(session.user.id, "wallets"),
        });
      setEditing(null);
      setMessage("Carteira salva.");
    },
    onError: (error) => setMessage(apiErrorMessage(error)),
  });
  const defaultForm = useMemo(
    () =>
      editing ?? {
        label: "",
        address: "",
        network: "ethereum" as const,
        isPrimary: false,
      },
    [editing],
  );
  return (
    <Protected>
      <Page>
        <div className="account-layout">
          <AccountSidebar active="wallets" />
          <section className="account-content">
            <h1>Carteiras</h1>
            {wallets.data?.map((wallet) => (
              <article className="cart-item" key={wallet.id}>
                <div>
                  <h2>{wallet.label}</h2>
                  <p>
                    {wallet.address} · {wallet.network}
                  </p>
                  {wallet.isPrimary && <p>Carteira principal</p>}
                </div>
                <button
                  className="secondary-button"
                  onClick={() => setEditing(wallet)}
                >
                  Editar
                </button>
              </article>
            ))}
            <WalletForm
              key={editing?.id ?? "new"}
              value={defaultForm}
              submit={(input) => save.mutate(input)}
              pending={save.isPending}
            />
            {message && (
              <p role="status" className="mutation-notice">
                {message}
              </p>
            )}
          </section>
        </div>
      </Page>
    </Protected>
  );
}

function WalletForm({
  value,
  submit,
  pending,
}: {
  value: WalletInput;
  submit: (input: WalletInput) => void;
  pending: boolean;
}) {
  const [form, setForm] = useState(value);
  return (
    <form
      className="account-form"
      onSubmit={(event) => {
        event.preventDefault();
        submit(form);
      }}
    >
      <h2>{value.label ? "Editar carteira" : "Adicionar carteira"}</h2>
      <label>
        Nome
        <input
          required
          value={form.label}
          onChange={(event) => setForm({ ...form, label: event.target.value })}
        />
      </label>
      <label>
        Endereço
        <input
          required
          value={form.address}
          onChange={(event) =>
            setForm({ ...form, address: event.target.value })
          }
        />
      </label>
      <label>
        Rede
        <select
          value={form.network}
          onChange={(event) =>
            setForm({
              ...form,
              network: event.target.value as Wallet["network"],
            })
          }
        >
          <option value="ethereum">Ethereum</option>
          <option value="polygon">Polygon</option>
        </select>
      </label>
      <label>
        <input
          type="checkbox"
          checked={Boolean(form.isPrimary)}
          onChange={(event) =>
            setForm({ ...form, isPrimary: event.target.checked })
          }
        />{" "}
        Carteira principal
      </label>
      <button className="primary-button" disabled={pending}>
        Salvar carteira
      </button>
    </form>
  );
}
