"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { useCart } from "@/context/CartContext";
import StoreNav from "@/components/StoreNav";

interface Plant {
  _id: string;
  name: { fr: string; en: string };
  description: { fr: string; en: string };
  price: number;
  imageUrl: string;
  category: string;
  stock: number;
  careInstructions: {
    wateringFrequency: string;
    lightRequirements: string;
    difficulty: "Easy" | "Medium" | "Hard";
  };
}

const difficultyConfig: Record<string, { color: string; bg: string }> = {
  Easy:   { color: "#166534", bg: "#dcfce7" },
  Medium: { color: "#92400e", bg: "#fef3c7" },
  Hard:   { color: "#991b1b", bg: "#fee2e2" },
};

const LeafSVG = ({ size = 48 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const WaterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const SparkleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M19 3v4M21 5h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M5 17v3M6.5 18.5h-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export default function PlantDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const locale = useLocale();
  const t = useTranslations();
  const router = useRouter();
  const { addItem } = useCart();

  const [plant, setPlant] = useState<Plant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAddToCart = useCallback(() => {
    if (!plant || plant.stock <= 0) return;
    addItem({
      plantId: plant._id,
      name: plant.name,
      imageUrl: plant.imageUrl,
      price: plant.price,
      quantity: qty,
      stock: plant.stock,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }, [plant, qty, addItem]);

  const handleBuyNow = useCallback(() => {
    if (!plant || plant.stock <= 0) return;
    const item = {
      plantId: plant._id,
      name: plant.name,
      imageUrl: plant.imageUrl,
      price: plant.price,
      quantity: qty,
      stock: plant.stock,
    };
    try {
      sessionStorage.setItem("vg_buynow", JSON.stringify(item));
    } catch { /* ignore */ }
    router.push(`/${locale}/checkout?buynow=1`);
  }, [plant, qty, locale, router]);

  useEffect(() => {
    fetch(`/api/plants/${id}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => { setPlant(data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [id]);

  const stockInfo = () => {
    if (!plant) return { text: "", variant: "ok" };
    if (plant.stock <= 0) return { text: t("plant.unavailable"), variant: "out" };
    if (plant.stock <= 5) return { text: t("plant.lowStock", { count: plant.stock }), variant: "low" };
    return { text: t("plant.inStock", { count: plant.stock }), variant: "ok" };
  };

  const diff = plant?.careInstructions?.difficulty;
  const diffCfg = diff ? difficultyConfig[diff] : null;
  const stock = stockInfo();

  return (
    <>
      <style>{`
        /* ─── PAGE ─────────────────────────────────────── */
        .pd-page {
          min-height: 100vh;
          background: var(--cream);
          padding-top: 68px;
        }

        .pd-container {
          max-width: 1100px; margin: 0 auto;
          padding: 3rem 2rem 5rem;
        }
        .pd-grid {
          display: grid;
          grid-template-columns: 5fr 6fr;
          gap: 4rem;
          align-items: start;
        }

        /* ─── IMAGE ────────────────────────────────────── */
        .pd-img-col { position: sticky; top: 100px; }
        .pd-img-wrap {
          position: relative;
          aspect-ratio: 3/4;
          border-radius: 20px;
          overflow: hidden;
          background: var(--parchment);
          border: 1px solid rgba(0,0,0,0.07);
          box-shadow: 0 4px 24px rgba(28,58,30,0.1);
        }
        .pd-img-placeholder {
          width: 100%; height: 100%;
          display: grid; place-items: center;
          color: var(--sand);
          background: linear-gradient(145deg, #f0ebe0, #e4dcc9);
        }
        .pd-diff-badge {
          position: absolute; top: 0.85rem; left: 0.85rem;
          font-size: 0.65rem; font-weight: 600;
          padding: 0.3rem 0.72rem; border-radius: 7px;
          letter-spacing: 0.06em; text-transform: uppercase;
          backdrop-filter: blur(4px);
        }
        .pd-oos-overlay {
          position: absolute; inset: 0;
          background: rgba(10,18,11,0.55);
          display: grid; place-items: center;
          backdrop-filter: blur(2px);
        }
        .pd-oos-label {
          font-size: 0.82rem; font-weight: 700;
          color: #fff; letter-spacing: 0.1em;
          text-transform: uppercase;
          border: 1px solid rgba(255,255,255,0.4);
          padding: 0.55rem 1.25rem;
          border-radius: 9px;
          backdrop-filter: blur(4px);
        }

        /* ─── INFO ─────────────────────────────────────── */
        .pd-info { display: flex; flex-direction: column; gap: 1.5rem; }

        .pd-cat {
          display: inline-flex; align-items: center; gap: 0.35rem;
          font-size: 0.65rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.14em;
          color: var(--sage);
          background: rgba(74,103,65,0.08);
          border: 1px solid rgba(74,103,65,0.15);
          padding: 0.28rem 0.75rem;
          border-radius: 7px;
          align-self: flex-start;
        }

        .pd-name {
          font-family: var(--font-display);
          font-size: clamp(2rem, 4vw, 3.2rem);
          font-weight: 400;
          color: var(--forest-dark);
          line-height: 1.1;
          letter-spacing: -0.01em;
          margin: 0;
        }

        .pd-desc {
          font-size: 1rem;
          color: var(--text-muted);
          line-height: 1.8;
          margin: 0;
        }

        /* Price + stock */
        .pd-price-row {
          display: flex; align-items: baseline; gap: 1rem;
          flex-wrap: wrap;
        }
        .pd-price {
          font-family: var(--font-display);
          font-size: 2.25rem; font-weight: 600;
          color: var(--forest);
          line-height: 1;
        }
        .pd-price-currency {
          font-size: 1rem; font-weight: 400;
          color: var(--text-muted); margin-left: 0.2rem;
        }
        .pd-stock-chip {
          font-size: 0.72rem; font-weight: 500;
          padding: 0.3rem 0.7rem; border-radius: 7px;
        }
        .pd-stock-chip.ok  { color: #166534; background: #dcfce7; }
        .pd-stock-chip.low { color: #92400e; background: #fef3c7; }
        .pd-stock-chip.out { color: #991b1b; background: #fee2e2; }

        /* Divider */
        .pd-divider { height: 1px; background: rgba(0,0,0,0.07); }

        /* Care section */
        .pd-care-header {
          display: flex; align-items: center; gap: 0.5rem;
          font-size: 0.68rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.14em;
          color: var(--text-muted);
          margin: 0 0 0.85rem;
        }
        .pd-care-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 0.75rem;
        }
        .pd-care-card {
          background: var(--white);
          border-radius: 12px;
          padding: 0.9rem 1rem;
          border: 1px solid rgba(0,0,0,0.06);
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          display: flex; flex-direction: column; gap: 0.5rem;
        }
        .pd-care-icon {
          width: 32px; height: 32px; border-radius: 8px;
          background: rgba(127,168,107,0.1);
          border: 1px solid rgba(127,168,107,0.15);
          display: grid; place-items: center;
          color: var(--fern);
        }
        .pd-care-label {
          font-size: 0.62rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.1em;
          color: var(--text-light);
        }
        .pd-care-value {
          font-size: 0.875rem; font-weight: 500;
          color: var(--forest-dark);
          line-height: 1.3;
        }

        /* ─── ACTIONS ──────────────────────────────────── */
        .pd-qty-row {
          display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;
        }
        .pd-qty-label {
          font-size: 0.78rem; font-weight: 500; color: var(--text-muted);
          white-space: nowrap;
        }
        .pd-qty-ctrl {
          display: flex; align-items: center; gap: 0; border-radius: 10px;
          border: 1.5px solid var(--parchment); overflow: hidden;
          background: var(--white);
        }
        .pd-qty-btn {
          width: 36px; height: 36px;
          border: none; background: none; color: var(--text);
          font-size: 1.1rem; font-weight: 500; cursor: pointer;
          transition: background 0.15s;
          display: grid; place-items: center;
        }
        .pd-qty-btn:hover:not(:disabled) { background: rgba(127,168,107,0.1); }
        .pd-qty-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .pd-qty-val {
          min-width: 38px; text-align: center;
          font-size: 0.95rem; font-weight: 600; color: var(--text);
          border-left: 1px solid var(--parchment);
          border-right: 1px solid var(--parchment);
          line-height: 36px;
        }
        .pd-actions {
          display: flex; gap: 0.75rem; flex-wrap: wrap;
        }
        .pd-btn-cart {
          flex: 1; min-width: 140px;
          display: flex; align-items: center; justify-content: center; gap: 0.45rem;
          padding: 0.85rem 1.25rem;
          background: var(--forest); color: var(--cream);
          border: none; border-radius: 12px;
          font-size: 0.9rem; font-weight: 600;
          cursor: pointer; transition: background 0.18s, transform 0.15s;
          box-shadow: 0 2px 8px rgba(28,58,30,0.18);
        }
        .pd-btn-cart:hover:not(:disabled) { background: var(--forest-light); transform: translateY(-1px); }
        .pd-btn-cart:disabled { opacity: 0.45; cursor: not-allowed; }
        .pd-btn-cart.added { background: #16a34a; }
        .pd-btn-buynow {
          flex: 1; min-width: 140px;
          display: flex; align-items: center; justify-content: center; gap: 0.45rem;
          padding: 0.85rem 1.25rem;
          background: none; color: var(--forest);
          border: 2px solid var(--forest); border-radius: 12px;
          font-size: 0.9rem; font-weight: 600;
          cursor: pointer; transition: background 0.18s, transform 0.15s;
        }
        .pd-btn-buynow:hover:not(:disabled) { background: rgba(28,58,30,0.06); transform: translateY(-1px); }
        .pd-btn-buynow:disabled { opacity: 0.45; cursor: not-allowed; }

        /* ─── STATES ───────────────────────────────────── */
        .pd-loading {
          display: flex; align-items: center; justify-content: center;
          min-height: 60vh; flex-direction: column; gap: 1rem;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .pd-spinner {
          width: 32px; height: 32px; border-radius: 50%;
          border: 2px solid var(--parchment);
          border-top-color: var(--sage);
          animation: spin 0.75s linear infinite;
        }
        .pd-loading-text { font-size: 0.875rem; color: var(--text-muted); }
        .pd-error {
          display: flex; align-items: center; justify-content: center;
          min-height: 60vh; flex-direction: column; gap: 1.25rem;
          color: var(--text-muted); font-size: 0.9rem;
        }

        /* ─── RESPONSIVE ───────────────────────────────── */
        @media (max-width: 900px) {
          .pd-grid { grid-template-columns: 1fr; gap: 2rem; }
          .pd-img-col { position: static; }
          .pd-img-wrap { aspect-ratio: 4/3; max-height: 440px; }
          .pd-container { padding: 2rem 1.5rem; }
        }
        @media (max-width: 600px) {
          .pd-container { padding: 1.5rem 1.25rem 3rem; }
          .pd-img-wrap { aspect-ratio: 16/10; max-height: 300px; }
          .pd-name { font-size: clamp(1.8rem, 6vw, 2.25rem); }
          .pd-price { font-size: 1.85rem; }
          .pd-info { gap: 1.15rem; }
          .pd-care-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <StoreNav showCart showBack />

      <main className="pd-page">

        <div className="pd-container">
          {loading && (
            <div className="pd-loading">
              <div className="pd-spinner" />
              <span className="pd-loading-text">{t("common.loading")}</span>
            </div>
          )}

          {error && (
            <div className="pd-error">
              <p>{t("errors.loadFailed")}</p>
              <Link href={`/${locale}`} style={{ color: "var(--forest)", fontSize: "0.875rem" }}>
                {t("common.back")}
              </Link>
            </div>
          )}

          {plant && (
            <div className="pd-grid">
              {/* Image column */}
              <div className="pd-img-col">
                <div className="pd-img-wrap">
                  {plant.imageUrl ? (
                    <Image
                      src={plant.imageUrl}
                      alt={plant.name?.[locale as "fr" | "en"] ?? ""}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <div className="pd-img-placeholder">
                      <LeafSVG size={56} />
                    </div>
                  )}
                  {diffCfg && diff && (
                    <span
                      className="pd-diff-badge"
                      style={{ color: diffCfg.color, background: diffCfg.bg }}
                    >
                      {t(`plant.difficulty${diff}`)}
                    </span>
                  )}
                  {plant.stock <= 0 && (
                    <div className="pd-oos-overlay">
                      <span className="pd-oos-label">{t("plant.outOfStock")}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Info column */}
              <div className="pd-info">
                {plant.category && (
                  <span className="pd-cat">
                    <LeafSVG size={11} />
                    {plant.category}
                  </span>
                )}

                <h1 className="pd-name">
                  {plant.name?.[locale as "fr" | "en"] ?? plant.name?.fr ?? ""}
                </h1>

                <p className="pd-desc">
                  {plant.description?.[locale as "fr" | "en"] ?? plant.description?.fr ?? ""}
                </p>

                <div className="pd-price-row">
                  <div className="pd-price">
                    {plant.price.toFixed(2)}
                    <span className="pd-price-currency">TND</span>
                  </div>
                  <span className={`pd-stock-chip ${stock.variant}`}>{stock.text}</span>
                </div>

                {plant.stock > 0 && (
                  <>
                    <div className="pd-qty-row">
                      <span className="pd-qty-label">Qty</span>
                      <div className="pd-qty-ctrl">
                        <button className="pd-qty-btn" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Decrease quantity">−</button>
                        <span className="pd-qty-val">{qty}</span>
                        <button className="pd-qty-btn" onClick={() => setQty((q) => Math.min(plant.stock, q + 1))} disabled={qty >= plant.stock} aria-label="Increase quantity">+</button>
                      </div>
                    </div>
                    <div className="pd-actions">
                      <button
                        className={`pd-btn-cart${added ? " added" : ""}`}
                        onClick={handleAddToCart}
                      >
                        {added ? (
                          <>✓ {t("cart.added")}</>
                        ) : (
                          <>{t("cart.addToCart")}</>
                        )}
                      </button>
                      <button className="pd-btn-buynow" onClick={handleBuyNow}>
                        {t("cart.buyNow")}
                      </button>
                    </div>
                  </>
                )}

                {(plant.careInstructions?.wateringFrequency ||
                  plant.careInstructions?.lightRequirements ||
                  plant.careInstructions?.difficulty) && (
                  <>
                    <div className="pd-divider" />
                    <div>
                      <p className="pd-care-header">
                        <SparkleIcon />
                        {t("plant.care")}
                      </p>
                      <div className="pd-care-grid">
                        {plant.careInstructions.wateringFrequency && (
                          <div className="pd-care-card">
                            <div className="pd-care-icon"><WaterIcon /></div>
                            <div>
                              <div className="pd-care-label">{t("plant.wateringFrequency")}</div>
                              <div className="pd-care-value">{plant.careInstructions.wateringFrequency}</div>
                            </div>
                          </div>
                        )}
                        {plant.careInstructions.lightRequirements && (
                          <div className="pd-care-card">
                            <div className="pd-care-icon"><SunIcon /></div>
                            <div>
                              <div className="pd-care-label">{t("plant.lightRequirements")}</div>
                              <div className="pd-care-value">{plant.careInstructions.lightRequirements}</div>
                            </div>
                          </div>
                        )}
                        {plant.careInstructions.difficulty && diffCfg && (
                          <div className="pd-care-card">
                            <div className="pd-care-icon" style={{ background: `${diffCfg.bg}88`, borderColor: `${diffCfg.color}22`, color: diffCfg.color }}>
                              <SparkleIcon />
                            </div>
                            <div>
                              <div className="pd-care-label">{t("plant.difficulty")}</div>
                              <div className="pd-care-value" style={{ color: diffCfg.color }}>
                                {t(`plant.difficulty${plant.careInstructions.difficulty}`)}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
