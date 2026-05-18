"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import LanguageSwitcher from "@/components/LanguageSwitcher";

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

const difficultyColor: Record<string, string> = {
  Easy: "#5a9e6f",
  Medium: "#d4a028",
  Hard: "#c0543a",
};

const LeafIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function PlantDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const locale = useLocale();
  const t = useTranslations();

  const [plant, setPlant] = useState<Plant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/plants/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => { setPlant(data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [id]);

  const stockLabel = () => {
    if (!plant) return "";
    if (plant.stock <= 0) return t("plant.unavailable");
    if (plant.stock <= 5) return t("plant.lowStock", { count: plant.stock });
    return t("plant.inStock", { count: plant.stock });
  };

  return (
    <>
      <style>{`
        /* NAV */
        .pd-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          background: var(--forest);
          box-shadow: 0 2px 24px rgba(0,0,0,0.15);
        }
        .pd-nav-inner {
          max-width: 1400px; margin: 0 auto;
          padding: 0 2rem; height: 72px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .pd-logo {
          display: flex; align-items: center; gap: 0.6rem;
          text-decoration: none;
        }
        .pd-logo-icon {
          width: 36px; height: 36px;
          background: rgba(184,212,176,0.15);
          border: 1px solid rgba(184,212,176,0.25);
          border-radius: 8px;
          display: grid; place-items: center;
          color: var(--mint);
        }
        .pd-logo-text {
          font-family: var(--font-display);
          font-size: 1.45rem; font-weight: 500;
          color: var(--cream); letter-spacing: 0.02em;
        }
        .pd-back {
          font-size: 0.75rem; font-weight: 500;
          color: rgba(247,243,236,0.8);
          text-transform: uppercase; letter-spacing: 0.12em;
          border: 1px solid rgba(247,243,236,0.2);
          padding: 0.45rem 1.1rem; border-radius: 100px;
          transition: all 0.2s ease;
          text-decoration: none;
        }
        .pd-back:hover {
          background: rgba(247,243,236,0.1);
          color: var(--cream);
          border-color: rgba(247,243,236,0.4);
        }

        /* MAIN */
        .pd-main {
          min-height: 100vh;
          background: var(--cream);
          padding-top: 72px;
        }
        .pd-container {
          max-width: 1100px; margin: 0 auto;
          padding: 4rem 2rem;
        }
        .pd-grid {
          display: grid;
          grid-template-columns: 5fr 6fr;
          gap: 4rem;
          align-items: start;
        }

        /* IMAGE */
        .pd-img-wrap {
          position: relative;
          aspect-ratio: 3/4;
          border-radius: var(--radius-lg);
          overflow: hidden;
          background: var(--parchment);
        }
        .pd-img-placeholder {
          width: 100%; height: 100%;
          display: grid; place-items: center;
          color: var(--sage);
        }
        .pd-difficulty-badge {
          position: absolute; top: 1rem; left: 1rem;
          background: var(--badge-color, #5a9e6f);
          color: #fff;
          font-size: 0.7rem; font-weight: 600;
          padding: 0.3rem 0.75rem;
          border-radius: 100px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .pd-out-of-stock-overlay {
          position: absolute; inset: 0;
          background: rgba(15,32,16,0.55);
          display: grid; place-items: center;
        }
        .pd-out-of-stock-label {
          font-size: 0.85rem; font-weight: 600;
          color: #fff; letter-spacing: 0.1em;
          text-transform: uppercase;
          border: 1px solid rgba(255,255,255,0.5);
          padding: 0.5rem 1.25rem;
          border-radius: 100px;
        }

        /* INFO */
        .pd-info { display: flex; flex-direction: column; gap: 1.5rem; }
        .pd-cat {
          font-size: 0.7rem; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.12em;
          color: var(--sage);
        }
        .pd-name {
          font-family: var(--font-display);
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 500;
          color: var(--forest-dark);
          line-height: 1.15;
          margin: 0;
        }
        .pd-desc {
          font-size: 1rem;
          color: var(--text-muted);
          line-height: 1.75;
          margin: 0;
        }
        .pd-price {
          font-family: var(--font-display);
          font-size: 2rem;
          font-weight: 600;
          color: var(--forest);
        }
        .pd-stock {
          font-size: 0.82rem;
          color: var(--text-light);
        }
        .pd-stock.low { color: var(--terra); }
        .pd-divider {
          height: 1px;
          background: rgba(0,0,0,0.07);
        }
        .pd-care-title {
          font-size: 0.7rem; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.12em;
          color: var(--text-muted);
          margin: 0 0 0.75rem;
        }
        .pd-care-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 0.75rem;
        }
        .pd-care-card {
          background: rgba(127,168,107,0.08);
          border-radius: 12px;
          padding: 1rem 1.1rem;
          border: 1px solid rgba(127,168,107,0.12);
        }
        .pd-care-label {
          font-size: 0.68rem; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.1em;
          color: var(--text-muted);
          margin-bottom: 0.3rem;
        }
        .pd-care-value {
          font-size: 0.9rem;
          color: var(--forest-dark);
          font-weight: 500;
        }

        /* STATES */
        .pd-loading {
          display: flex; align-items: center; justify-content: center;
          min-height: 60vh;
          color: var(--text-muted);
          font-size: 0.9rem;
        }
        .pd-error {
          display: flex; align-items: center; justify-content: center;
          min-height: 60vh;
          color: var(--text-muted);
          font-size: 0.9rem;
          flex-direction: column; gap: 1rem;
        }

        /* RESPONSIVE — Tablet */
        @media (max-width: 900px) {
          .pd-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
          .pd-img-wrap {
            aspect-ratio: 4/3;
            max-height: 420px;
          }
          .pd-container { padding: 2.5rem 1.5rem; }
        }

        /* RESPONSIVE — Mobile */
        @media (max-width: 600px) {
          .pd-nav-inner { padding: 0 1.25rem; }
          .pd-logo-text { font-size: 1.2rem; }
          .pd-back { font-size: 0.7rem; padding: 0.4rem 0.85rem; letter-spacing: 0.08em; }
          .pd-container { padding: 1.75rem 1.25rem 3rem; }
          .pd-img-wrap { aspect-ratio: 16/10; max-height: 320px; }
          .pd-name { font-size: clamp(1.75rem, 6vw, 2.25rem); }
          .pd-desc { font-size: 0.9rem; }
          .pd-price { font-size: 1.75rem; }
          .pd-info { gap: 1.1rem; }
          .pd-care-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <nav className="pd-nav">
        <div className="pd-nav-inner">
          <Link href={`/${locale}`} className="pd-logo">
            <span className="pd-logo-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="pd-logo-text">Verde Garden</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <LanguageSwitcher />
            <Link href={`/${locale}`} className="pd-back">
              ← {t("common.back")}
            </Link>
          </div>
        </div>
      </nav>

      <main className="pd-main">
        <div className="pd-container">
          {loading && (
            <div className="pd-loading">{t("common.loading")}</div>
          )}
          {error && (
            <div className="pd-error">
              <p>{t("errors.loadFailed")}</p>
              <Link href={`/${locale}`} className="pd-back" style={{ color: "var(--forest)" }}>
                ← {t("common.back")}
              </Link>
            </div>
          )}
          {plant && (
            <div className="pd-grid">
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
                    <LeafIcon />
                  </div>
                )}
                {plant.careInstructions?.difficulty && (
                  <span
                    className="pd-difficulty-badge"
                    style={{ "--badge-color": difficultyColor[plant.careInstructions.difficulty] } as React.CSSProperties}
                  >
                    {t(`plant.difficulty${plant.careInstructions.difficulty}`)}
                  </span>
                )}
                {plant.stock <= 0 && (
                  <div className="pd-out-of-stock-overlay">
                    <span className="pd-out-of-stock-label">{t("plant.outOfStock")}</span>
                  </div>
                )}
              </div>

              <div className="pd-info">
                {plant.category && <span className="pd-cat">{plant.category}</span>}
                <h1 className="pd-name">
                  {plant.name?.[locale as "fr" | "en"] ?? plant.name?.fr ?? ""}
                </h1>
                <p className="pd-desc">
                  {plant.description?.[locale as "fr" | "en"] ?? plant.description?.fr ?? ""}
                </p>

                <div>
                  <div className="pd-price">{plant.price.toFixed(2)} TND</div>
                  <div className={`pd-stock${plant.stock > 0 && plant.stock <= 5 ? " low" : ""}`}>
                    {stockLabel()}
                  </div>
                </div>

                {(plant.careInstructions?.wateringFrequency ||
                  plant.careInstructions?.lightRequirements ||
                  plant.careInstructions?.difficulty) && (
                  <>
                    <div className="pd-divider" />
                    <div>
                      <p className="pd-care-title">{t("plant.care")}</p>
                      <div className="pd-care-grid">
                        {plant.careInstructions.wateringFrequency && (
                          <div className="pd-care-card">
                            <div className="pd-care-label">💧 {t("plant.wateringFrequency")}</div>
                            <div className="pd-care-value">{plant.careInstructions.wateringFrequency}</div>
                          </div>
                        )}
                        {plant.careInstructions.lightRequirements && (
                          <div className="pd-care-card">
                            <div className="pd-care-label">☀️ {t("plant.lightRequirements")}</div>
                            <div className="pd-care-value">{plant.careInstructions.lightRequirements}</div>
                          </div>
                        )}
                        {plant.careInstructions.difficulty && (
                          <div className="pd-care-card">
                            <div className="pd-care-label">{t("plant.difficulty")}</div>
                            <div className="pd-care-value">{t(`plant.difficulty${plant.careInstructions.difficulty}`)}</div>
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
