"use client";

import { useCart } from "@/context/CartContext";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import StoreNav from "@/components/StoreNav";
import { ShoppingCart, Leaf, Trash2, ArrowRight } from "lucide-react";

const SHIPPING_THRESHOLD = 150;
const SHIPPING_COST = 7;

const Logo = ({ size }: { size?: number }) => (
  <img src="/icons/logo.svg" alt="Verde Garden" style={{ display: "block", height: size ? `${size}px` : "100%", width: "auto" }} />
);

export default function CartPage() {
  const { items, subtotal, removeItem, updateQuantity, itemCount } = useCart();
  const locale = useLocale();
  const t = useTranslations();
  const router = useRouter();
  const shippingCost = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = subtotal + shippingCost;

  return (
    <>
      <style>{`
        /* ─── PAGE ─────────────────────────────────────────────────── */
        .cart-page {
          min-height: 100vh;
          background: var(--cream);
          display: flex;
          flex-direction: column;
          padding-top: 68px;
        }

        /* ─── PAGE HEADER (dark band below nav) ────────────────────── */
        .cart-page-header {
          background: var(--forest);
          padding: 2.5rem 2rem 4.5rem;
          position: relative; overflow: hidden;
        }
        .cart-page-header::after {
          content: '';
          position: absolute; bottom: -1px; left: 0; right: 0; height: 48px;
          background: var(--cream);
          clip-path: ellipse(55% 100% at 50% 100%);
          z-index: 1;
        }
        .cart-page-header::before {
          content: '';
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 70% 60% at 20% 30%, rgba(127,168,107,0.14) 0%, transparent 60%),
            radial-gradient(ellipse 50% 70% at 80% 70%, rgba(74,103,65,0.18) 0%, transparent 55%);
          pointer-events: none;
        }
        .cart-page-header-inner {
          max-width: 1100px; margin: 0 auto;
          position: relative; z-index: 2;
          display: flex; align-items: flex-end; gap: 1.5rem;
          flex-wrap: wrap;
        }
        .cart-page-title {
          font-family: var(--font-display);
          font-size: clamp(2rem, 5vw, 3.2rem);
          font-weight: 300; color: var(--cream);
          line-height: 1.1; letter-spacing: -0.01em;
        }
        .cart-page-title em {
          font-style: italic; color: var(--mint);
        }
        .cart-item-pill {
          display: inline-flex; align-items: center; gap: 0.4rem;
          font-size: 0.72rem; font-weight: 500;
          color: var(--mint);
          background: rgba(184,212,176,0.1);
          border: 1px solid rgba(184,212,176,0.22);
          padding: 0.32rem 0.85rem; border-radius: 100px;
          margin-left: auto; align-self: center;
          white-space: nowrap;
        }
        .cart-item-pill-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: #4ade80;
          box-shadow: 0 0 6px rgba(74,222,128,0.6);
        }

        /* ─── BODY ──────────────────────────────────────────────────── */
        .cart-body {
          max-width: 1100px; margin: 0 auto;
          padding: 2rem 2rem 5rem;
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 1.5rem;
          align-items: start;
        }
        @media (max-width: 900px) {
          .cart-body { grid-template-columns: 1fr; }
          .cart-summary { position: static; }
        }
        @media (max-width: 600px) {
          .cart-body { padding: 1rem 0.75rem 3rem; gap: 1rem; }
          .cart-page-header { padding: 1.75rem 1rem 4rem; }
          .cart-page-title { font-size: 1.75rem; }
          .cart-item-pill { font-size: 0.68rem; padding: 0.28rem 0.7rem; }
        }

        /* ─── ITEMS CARD ─────────────────────────────────────────────── */
        .cart-items-card {
          background: var(--white);
          border-radius: var(--radius-lg);
          border: 1px solid rgba(0,0,0,0.06);
          box-shadow: var(--shadow-sm);
          overflow: hidden;
        }
        .cart-items-header {
          padding: 1.1rem 1.5rem;
          border-bottom: 1px solid var(--parchment);
          font-size: 0.72rem; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.12em;
          color: var(--text-muted);
          display: flex; align-items: center; gap: 0.5rem;
        }
        .cart-item {
          display: flex; align-items: center; gap: 1.25rem;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid rgba(0,0,0,0.04);
          transition: background 0.15s;
        }
        .cart-item:last-child { border-bottom: none; }
        .cart-item:hover { background: rgba(246,242,235,0.5); }
        .cart-item-img {
          width: 84px; height: 84px; flex-shrink: 0;
          border-radius: 12px; overflow: hidden;
          background: var(--parchment);
          border: 1px solid rgba(0,0,0,0.06);
          position: relative;
        }
        .cart-item-info { flex: 1; min-width: 0; }
        .cart-item-name {
          font-family: var(--font-display);
          font-size: 1.15rem; font-weight: 500;
          color: var(--forest);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          margin-bottom: 0.25rem;
        }
        .cart-item-unit-price {
          font-size: 0.8rem; color: var(--text-muted);
        }
        .cart-item-mobile-total {
          display: none;
          font-size: 0.88rem; font-weight: 600;
          color: var(--forest); margin-top: 0.2rem;
        }
        @media (max-width: 600px) {
          .cart-item-mobile-total { display: block; }
        }
        .cart-item-qty {
          display: flex; align-items: center; gap: 0.5rem;
        }
        .qty-btn {
          width: 32px; height: 32px;
          border: 1.5px solid var(--parchment);
          border-radius: 8px;
          background: var(--white);
          color: var(--text);
          font-size: 1rem; font-weight: 500;
          display: grid; place-items: center;
          cursor: pointer;
          transition: all 0.15s;
        }
        .qty-btn:hover:not(:disabled) { border-color: var(--fern); color: var(--forest); background: rgba(127,168,107,0.07); }
        .qty-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .qty-value {
          min-width: 30px; text-align: center;
          font-size: 0.9rem; font-weight: 600;
          color: var(--text);
        }
        .cart-item-total {
          font-family: var(--font-display);
          font-size: 1.25rem; font-weight: 600;
          color: var(--forest);
          min-width: 90px; text-align: right;
          white-space: nowrap;
        }
        .cart-item-total span {
          font-size: 0.72rem; font-weight: 400;
          color: var(--text-muted); margin-left: 2px;
        }
        .cart-item-remove {
          width: 32px; height: 32px;
          border-radius: 8px; border: none;
          background: none; color: var(--text-light);
          cursor: pointer; display: grid; place-items: center;
          transition: all 0.15s; flex-shrink: 0;
        }
        .cart-item-remove:hover { background: #fee2e2; color: #dc2626; }

        /* ─── EMPTY ──────────────────────────────────────────────────── */
        .cart-empty {
          background: var(--white);
          border-radius: var(--radius-lg);
          border: 1px solid rgba(0,0,0,0.06);
          box-shadow: var(--shadow-sm);
          padding: 4rem 2rem;
          text-align: center;
        }
        .cart-empty-icon {
          width: 72px; height: 72px; margin: 0 auto 1.5rem;
          background: var(--parchment); border-radius: 18px;
          display: grid; place-items: center; color: var(--sand);
          border: 1px solid rgba(0,0,0,0.05);
        }
        .cart-empty h3 {
          font-family: var(--font-display);
          font-size: 1.8rem; font-weight: 400;
          color: var(--forest); margin-bottom: 0.5rem;
        }
        .cart-empty p { font-size: 0.88rem; color: var(--text-muted); margin-bottom: 1.75rem; }
        .cart-empty-cta {
          display: inline-flex; align-items: center; gap: 0.5rem;
          background: var(--forest); color: var(--cream);
          font-size: 0.82rem; font-weight: 500;
          padding: 0.75rem 1.75rem; border-radius: 10px;
          transition: background 0.2s, transform 0.15s;
          box-shadow: 0 2px 8px rgba(28,58,30,0.2);
        }
        .cart-empty-cta:hover { background: var(--forest-light); transform: translateY(-1px); }

        /* ─── SUMMARY ────────────────────────────────────────────────── */
        .cart-summary {
          background: var(--white);
          border-radius: var(--radius-lg);
          border: 1px solid rgba(0,0,0,0.06);
          box-shadow: var(--shadow-sm);
          padding: 1.5rem;
          position: sticky; top: 1.5rem;
        }
        .summary-title {
          font-family: var(--font-display);
          font-size: 1.3rem; font-weight: 500;
          color: var(--forest); margin-bottom: 1.25rem;
        }
        .summary-row {
          display: flex; justify-content: space-between; align-items: center;
          font-size: 0.85rem; color: var(--text-muted);
          padding: 0.5rem 0;
          border-bottom: 1px solid rgba(0,0,0,0.04);
        }
        .summary-row:last-of-type { border-bottom: none; }
        .summary-row-total {
          display: flex; justify-content: space-between; align-items: center;
          padding: 1rem 0 0.25rem;
          border-top: 2px solid var(--parchment);
          margin-top: 0.5rem;
        }
        .summary-row-total-label {
          font-size: 0.9rem; font-weight: 600; color: var(--forest);
        }
        .summary-row-total-val {
          font-family: var(--font-display);
          font-size: 1.6rem; font-weight: 600; color: var(--forest);
        }
        .shipping-free { color: #166534; font-weight: 500; }
        .shipping-note {
          font-size: 0.74rem; color: var(--sage);
          background: rgba(127,168,107,0.08);
          border: 1px solid rgba(127,168,107,0.2);
          border-radius: 8px; padding: 0.65rem 0.9rem;
          margin: 0.85rem 0;
          line-height: 1.55;
        }
        .checkout-btn {
          width: 100%;
          background: var(--forest); color: var(--cream);
          border: none; border-radius: 11px;
          padding: 0.95rem; font-size: 0.9rem; font-weight: 600;
          cursor: pointer; transition: background 0.2s, transform 0.15s;
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          margin-top: 1rem;
          box-shadow: 0 2px 8px rgba(28,58,30,0.18);
        }
        .checkout-btn:hover { background: var(--forest-light); transform: translateY(-1px); }
        .continue-link {
          display: block; text-align: center; margin-top: 0.9rem;
          font-size: 0.78rem; color: var(--text-muted);
          transition: color 0.18s;
        }
        .continue-link:hover { color: var(--forest); }

        /* ─── FOOTER ─────────────────────────────────────────────────── */
        .cart-footer {
          background: var(--forest-dark);
          padding: 2rem;
          margin-top: auto;
        }
        .cart-footer-inner {
          max-width: 1400px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 1rem;
        }
        .cart-footer-brand {
          display: flex; align-items: center; gap: 0.5rem;
          font-family: var(--font-display);
          font-size: 1.05rem; color: rgba(247,243,236,0.6);
        }
        .cart-footer-copy {
          font-size: 0.68rem; color: rgba(247,243,236,0.2);
        }

        @media (max-width: 600px) {
          .cart-item {
            flex-wrap: wrap; gap: 0.75rem; padding: 1rem;
            display: grid;
            grid-template-columns: 72px 1fr;
            grid-template-rows: auto auto;
          }
          .cart-item-img { width: 72px; height: 72px; grid-row: 1 / 3; }
          .cart-item-info { grid-column: 2; grid-row: 1; min-width: 0; }
          .cart-item-qty { grid-column: 2; grid-row: 2; }
          .cart-item-total { display: none; }
          .cart-item-remove {
            position: absolute; top: 0.75rem; right: 0.75rem;
          }
          .cart-item { position: relative; }
          .cart-items-card { overflow: visible; }
          .cart-footer-inner { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
          .cart-summary { padding: 1.25rem; }
        }
      `}</style>

      <StoreNav showCart showBack backHref={`/${locale}`} />

      <div className="cart-page">
        {/* ── PAGE HEADER ── */}
        <div className="cart-page-header">
          <div className="cart-page-header-inner">
            <div style={{ flex: 1 }}>
              <h1 className="cart-page-title">
                {t("cart.title")}
              </h1>
            </div>
            {itemCount > 0 && (
              <div className="cart-item-pill">
                <span className="cart-item-pill-dot" />
                {itemCount} {t("cart.items")}
              </div>
            )}
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="cart-body">
          {/* Items */}
          <div>
            {items.length === 0 ? (
              <div className="cart-empty">
                <div className="cart-empty-icon">
                  <ShoppingCart size={32} aria-hidden="true" />
                </div>
                <h3>{t("cart.empty")}</h3>
                <p>{t("cart.emptyDesc")}</p>
                <Link href={`/${locale}`} className="cart-empty-cta">
                  <Leaf size={14} fill="currentColor" style={{ color: "#7fa86b" }} aria-hidden="true" />
                  {t("cart.browsePlants")}
                </Link>
              </div>
            ) : (
              <div className="cart-items-card">
                <div className="cart-items-header">
                  <ShoppingCart size={13} aria-hidden="true" />
                  {t("cart.yourItems")}
                </div>
                {items.map((item) => (
                  <div key={item.plantId} className="cart-item">
                    <div className="cart-item-img">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name[locale as "fr" | "en"] ?? item.name.en}
                          fill
                          style={{ objectFit: "contain", padding: "5px" }}
                          sizes="84px"
                        />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center" }}>
                          <Logo size={36} />
                        </div>
                      )}
                    </div>
                    <div className="cart-item-info">
                      <div className="cart-item-name">
                        {item.name[locale as "fr" | "en"] ?? item.name.en}
                      </div>
                      <div className="cart-item-unit-price">
                        {item.price.toFixed(2)} TND {t("cart.each")}
                      </div>
                      <div className="cart-item-mobile-total">
                        {(item.price * item.quantity).toFixed(2)} TND
                      </div>
                    </div>
                    <div className="cart-item-qty">
                      <button className="qty-btn" onClick={() => updateQuantity(item.plantId, item.quantity - 1)} aria-label="Decrease">−</button>
                      <span className="qty-value">{item.quantity}</span>
                      <button className="qty-btn" onClick={() => updateQuantity(item.plantId, item.quantity + 1)} disabled={item.quantity >= item.stock} aria-label="Increase">+</button>
                    </div>
                    <div className="cart-item-total">
                      {(item.price * item.quantity).toFixed(2)}<span>TND</span>
                    </div>
                    <button className="cart-item-remove" onClick={() => removeItem(item.plantId)} aria-label="Remove item">
                      <Trash2 size={15} fill="currentColor" style={{ color: "#c0543a" }} aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          {items.length > 0 && (
            <div className="cart-summary">
              <h2 className="summary-title">{t("cart.orderSummary")}</h2>
              <div className="summary-row">
                <span>{t("cart.subtotal")}</span>
                <span>{subtotal.toFixed(2)} TND</span>
              </div>
              <div className="summary-row">
                <span>{t("cart.shipping")}</span>
                <span>
                  {shippingCost === 0
                    ? <span className="shipping-free">{t("cart.free")}</span>
                    : `${shippingCost.toFixed(2)} TND`}
                </span>
              </div>
              {subtotal < SHIPPING_THRESHOLD && (
                <div className="shipping-note">
                  <Leaf size={12} fill="currentColor" style={{ display: "inline", verticalAlign: "middle", marginRight: "0.3rem", color: "#7fa86b" }} aria-hidden="true" />{t("cart.shippingNote", { amount: (SHIPPING_THRESHOLD - subtotal).toFixed(2) })}
                </div>
              )}
              <div className="summary-row-total">
                <span className="summary-row-total-label">{t("cart.total")}</span>
                <span className="summary-row-total-val">{total.toFixed(2)} <span style={{ fontSize: "0.85rem", fontWeight: 400 }}>TND</span></span>
              </div>
              <button className="checkout-btn" onClick={() => router.push(`/${locale}/checkout`)}>
                {t("cart.proceedToCheckout")}
                <ArrowRight size={15} fill="currentColor" style={{ color: "#ffffff" }} aria-hidden="true" />
              </button>
              <Link href={`/${locale}`} className="continue-link">
                ← {t("cart.continueShopping")}
              </Link>
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        <footer className="cart-footer">
          <div className="cart-footer-inner">
            <div className="cart-footer-brand">
              <Logo size={24} />
            </div>
            <span className="cart-footer-copy">
              © {new Date().getFullYear()} Verde Garden
            </span>
          </div>
        </footer>
      </div>
    </>
  );
}
