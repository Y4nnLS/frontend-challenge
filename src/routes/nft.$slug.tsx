import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { marketplaceApi } from "@/api/marketplace-api";
import { NftArtwork } from "@/catalog/components/nft-card";
import { NftCard } from "@/catalog/components/nft-card";
import { formatEth } from "@/catalog/lib/format-eth";
import { useCatalog } from "@/catalog/queries/use-catalog";
import { NftActions } from "@/marketplace/nft-actions";
import { useSession } from "@/auth/session-context";
import { MarketplaceFooter } from "@/shared/components/marketplace-footer";
import {
  MarketplaceHeader,
  MobileAccountNavigation,
} from "@/shared/components/marketplace-header";
import { HeartIcon, SearchIcon } from "@/shared/components/icons";

export const Route = createFileRoute("/nft/$slug")({
  component: NftDetailPage,
});

function NftDetailPage() {
  const { slug } = Route.useParams();
  const { session } = useSession();
  const nftQuery = useQuery({
    queryKey: ["nft", slug],
    queryFn: ({ signal }) => marketplaceApi.getNft(slug, signal),
    retry: false,
  });
  const collectionQuery = useCatalog({ page: 1, pageSize: 6, sort: "recent" });
  const [activeTab, setActiveTab] = useState<"details" | "reviews">("details");
  const tokenNumber = nftQuery.data?.name.match(/#(\d+)/)?.[1];
  return (
    <div className="kurio-app">
      <div className="site-container">
        <div className="desktop-header">
          <MarketplaceHeader />
        </div>
        <MobileAccountNavigation />
        <main className="detail-page">
          <Link to="/" className="detail-breadcrumb">
            Início / Mercado
          </Link>
          {nftQuery.isPending ? (
            <div className="detail-layout" aria-label="Carregando NFT">
              <div className="detail-art skeleton" />
              <div className="skeleton">Carregando NFT…</div>
            </div>
          ) : nftQuery.isError || !nftQuery.data ? (
            <div className="catalog-message" role="alert">
              <h1>NFT não encontrado</h1>
              <Link to="/">Voltar ao catálogo</Link>
            </div>
          ) : (
            <>
              <div className="detail-mobile-actions">
                <Link to="/" aria-label="Voltar">
                  ‹
                </Link>
                {session ? (
                  <a
                    href="#purchase-actions"
                    aria-label="Ir para ações de compra"
                  >
                    <HeartIcon />
                  </a>
                ) : (
                  <Link
                    to="/login"
                    search={{ returnTo: location.pathname }}
                    aria-label="Entrar"
                  >
                    <HeartIcon />
                  </Link>
                )}
              </div>
              <div className="detail-layout">
                <div className="detail-gallery">
                  <div className="detail-thumbnails">
                    {Array.from({ length: 4 }, (_, index) => (
                      <button
                        type="button"
                        aria-label={`Visualização ${index + 1}`}
                        className={index === 0 ? "active" : ""}
                        key={index}
                      >
                        <NftArtwork nft={nftQuery.data} />
                      </button>
                    ))}
                  </div>
                  <div className="detail-art">
                    <NftArtwork nft={nftQuery.data} className="nft-image" />
                    <SearchIcon className="detail-zoom" />
                  </div>
                </div>
                <div className="detail-information">
                  <div className="detail-heading">
                    <h1>{nftQuery.data.name}</h1>
                    <div className="detail-price-line">
                      <p className="detail-price">
                        {nftQuery.data.editions[0]
                          ? formatEth(nftQuery.data.editions[0].priceEth)
                          : "—"}{" "}
                        ETH
                      </p>
                      <span>
                        ★★★★<i>★</i> 19 avaliações de colecionadores
                      </span>
                    </div>
                  </div>
                  <div className="detail-rule" />
                  <h2>Sobre este NFT:</h2>
                  <p>{nftQuery.data.description}</p>
                  <dl className="detail-metadata">
                    <div>
                      <dt>ID do token:</dt>
                      <dd>
                        #{tokenNumber?.padStart(4, "0") ?? nftQuery.data.id}
                      </dd>
                    </div>
                    <div>
                      <dt>Coleção:</dt>
                      <dd>Kurio Apes</dd>
                    </div>
                    <div>
                      <dt>Atributos:</dt>
                      <dd>Óculos, Esmeralda, Raro</dd>
                    </div>
                  </dl>
                  <div id="purchase-actions">
                    <NftActions nft={nftQuery.data} />
                  </div>
                  <p className="detail-share">
                    Compartilhar este NFT: <span>in</span> <span>✉</span>{" "}
                    <span>♥</span>
                  </p>
                </div>
              </div>
              <section
                className="related-nfts"
                aria-labelledby="more-from-collection"
              >
                <div>
                  <h2 id="more-from-collection">Mais desta coleção</h2>
                </div>
                <div className="related-nft-grid">
                  {collectionQuery.data?.items
                    .filter((item) => item.id !== nftQuery.data?.id)
                    .slice(0, 5)
                    .map((item) => (
                      <NftCard nft={item} key={item.id} />
                    ))}
                </div>
                <p className="collection-pager" aria-hidden="true">
                  ○ <b>●</b> ○
                </p>
              </section>
              <section className="detail-tabs">
                <div role="tablist" aria-label="Detalhes do NFT">
                  <button
                    role="tab"
                    aria-selected={activeTab === "details"}
                    onClick={() => setActiveTab("details")}
                  >
                    Detalhes do NFT
                  </button>
                  <button
                    role="tab"
                    aria-selected={activeTab === "reviews"}
                    onClick={() => setActiveTab("reviews")}
                  >
                    Avaliações de colecionadores (19)
                  </button>
                </div>
                {activeTab === "details" ? (
                  <div className="detail-tab-copy">
                    <p>
                      Cada atributo fica armazenado nos metadados do token e
                      verificado na Ethereum, junto à procedência da obra.
                    </p>
                    <p>
                      A propriedade inclui a arte em alta resolução, lançamentos
                      exclusivos para colecionadores e um registro permanente de
                      procedência registrado na rede.
                    </p>
                    <h3>Rede:</h3>
                    <p>
                      Cunhado na Ethereum com procedência imutável e metadados
                      armazenados no IPFS.
                    </p>
                    <h3>Contrato:</h3>
                    <p>
                      Direitos autorais do criador: 5% nas vendas secundárias,
                      pagos automaticamente pelos mercados compatíveis.
                    </p>
                  </div>
                ) : (
                  <div className="detail-tab-copy">
                    <p>
                      As avaliações verificadas desta coleção são calculadas
                      após cada compra confirmada.
                    </p>
                  </div>
                )}
              </section>
            </>
          )}
        </main>
        <MarketplaceFooter />
      </div>
    </div>
  );
}
