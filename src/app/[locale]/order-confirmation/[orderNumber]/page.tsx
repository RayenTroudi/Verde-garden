"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { use } from "react";
import StoreNav from "@/components/StoreNav";

interface OrderItem {
  plantId: string;
  name: { fr: string; en: string };
  imageUrl: string;
  price: number;
  quantity: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
  shipping: {
    fullName: string;
    email: string;
    phone: string;
    city: string;
    country: string;
    streetAddress: string;
    zipCode: string;
    notes?: string;
  };
  subtotal: number;
  shippingCost: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  shippingStatus: string;
  createdAt: string;
}

export default function OrderConfirmationPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = use(params);
  const locale = useLocale();
  const t = useTranslations();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/orders/${orderNumber}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.order) setOrder(d.order);
        else setError(t("checkout.orderNotFound"));
      })
      .catch(() => setError(t("checkout.orderNotFound")))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderNumber]);

  return (
    <>
      <style>{`
        .conf-page {
          min-height: 100vh; background: var(--cream);
          padding-top: 68px;
        }
        .conf-body {
          max-width: 720px; margin: 0 auto;
          padding: 3rem 2rem;
        }
        @media (max-width: 600px) { .conf-body { padding: 2rem 1rem; } }

        /* Success banner */
        .conf-success {
          text-align: center; margin-bottom: 2.5rem;
        }
        .conf-checkmark {
          width: 72px; height: 72px;
          background: #dcfce7; border-radius: 50%;
          margin: 0 auto 1.25rem;
          display: grid; place-items: center;
          color: #16a34a;
          animation: popIn 0.5s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes popIn {
          from { transform: scale(0.4); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
        .conf-success-title {
          font-family: var(--font-display);
          font-size: 2.2rem; font-weight: 400;
          color: var(--forest); margin-bottom: 0.5rem;
        }
        .conf-success-sub {
          font-size: 0.9rem; color: var(--text-muted); line-height: 1.6;
        }
        .conf-order-num {
          display: inline-block;
          background: rgba(28,58,30,0.07);
          border: 1px solid rgba(28,58,30,0.15);
          border-radius: 8px; padding: 0.3rem 0.85rem;
          font-size: 0.85rem; font-weight: 600; color: var(--forest);
          margin-top: 0.75rem; font-family: monospace; letter-spacing: 0.05em;
        }

        /* Cards */
        .conf-card {
          background: var(--white);
          border-radius: var(--radius-lg);
          border: 1px solid rgba(0,0,0,0.06);
          box-shadow: var(--shadow-sm);
          margin-bottom: 1.25rem; overflow: hidden;
        }
        .conf-card-header {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--parchment);
          font-size: 0.72rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.12em;
          color: var(--text-muted);
          display: flex; align-items: center; gap: 0.5rem;
        }
        .conf-card-body { padding: 1.25rem 1.5rem; }

        /* Items */
        .conf-item {
          display: flex; align-items: center; gap: 1rem;
          padding: 0.75rem 0;
          border-bottom: 1px solid rgba(0,0,0,0.04);
        }
        .conf-item:last-child { border-bottom: none; padding-bottom: 0; }
        .conf-item-img {
          width: 56px; height: 56px; flex-shrink: 0;
          border-radius: 9px; overflow: hidden;
          background: var(--parchment); position: relative;
          border: 1px solid rgba(0,0,0,0.06);
        }
        .conf-item-name {
          flex: 1; font-size: 0.88rem; font-weight: 500; color: var(--forest);
        }
        .conf-item-qty { font-size: 0.78rem; color: var(--text-muted); }
        .conf-item-price { font-size: 0.92rem; font-weight: 600; color: var(--forest); }

        /* Totals */
        .conf-totals { display: flex; flex-direction: column; gap: 0; }
        .conf-total-row {
          display: flex; justify-content: space-between;
          font-size: 0.85rem; color: var(--text-muted);
          padding: 0.45rem 0;
        }
        .conf-total-row.grand {
          border-top: 2px solid var(--parchment);
          margin-top: 0.5rem; padding-top: 0.85rem;
          font-size: 1rem; font-weight: 700; color: var(--forest);
        }
        .conf-total-row.grand .val {
          font-family: var(--font-display); font-size: 1.4rem;
        }

        /* Info grid */
        .conf-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        @media (max-width: 480px) { .conf-info-grid { grid-template-columns: 1fr; } }
        .conf-info-item {}
        .conf-info-label { font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); margin-bottom: 0.2rem; }
        .conf-info-val { font-size: 0.88rem; color: var(--text); font-weight: 500; }

        /* Status badges */
        .status-badge {
          display: inline-block; font-size: 0.72rem; font-weight: 600;
          padding: 0.2rem 0.6rem; border-radius: 6px;
          text-transform: capitalize;
        }
        .status-pending { background: #fef3c7; color: #92400e; }
        .status-paid { background: #dcfce7; color: #166534; }
        .status-cash_on_delivery { background: #e0f2fe; color: #0369a1; }

        /* CTA */
        .conf-cta { text-align: center; margin-top: 2rem; }
        .conf-cta-btn {
          display: inline-flex; align-items: center; gap: 0.5rem;
          background: var(--forest); color: var(--cream);
          padding: 0.8rem 2rem; border-radius: 11px;
          font-size: 0.88rem; font-weight: 600;
          transition: background 0.2s;
        }
        .conf-cta-btn:hover { background: var(--forest-light); }

        /* Loading/Error */
        .conf-loading, .conf-error {
          text-align: center; padding: 5rem 2rem;
          color: var(--text-muted); font-size: 0.9rem;
        }
        .conf-error { color: #dc2626; }
      `}</style>

      <StoreNav showCart={false} showBack />

      <div className="conf-page">
        <div className="conf-body">
          {loading ? (
            <div className="conf-loading">{t("common.loading")}</div>
          ) : error ? (
            <div className="conf-error">{error}</div>
          ) : order ? (
            <>
              {/* Success */}
              <div className="conf-success">
                <div className="conf-checkmark">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <h1 className="conf-success-title">{t("checkout.orderPlaced")}</h1>
                <p className="conf-success-sub">{t("checkout.orderPlacedDesc", { email: order.shipping.email })}</p>
                <div className="conf-order-num">{order.orderNumber}</div>
              </div>

              {/* Items */}
              <div className="conf-card">
                <div className="conf-card-header">
                  📦 {t("checkout.orderedItems")}
                </div>
                <div className="conf-card-body">
                  {order.items.map((item, i) => (
                    <div key={i} className="conf-item">
                      <div className="conf-item-img">
                        {item.imageUrl ? (
                          <Image src={item.imageUrl} alt={item.name[locale as "fr" | "en"] ?? item.name.en} fill style={{ objectFit: "contain", padding: "3px" }} sizes="56px" />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "var(--sand)" }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/></svg>
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="conf-item-name">{item.name[locale as "fr" | "en"] ?? item.name.en}</div>
                        <div className="conf-item-qty">x{item.quantity} · {item.price.toFixed(2)} TND {t("cart.each")}</div>
                      </div>
                      <div className="conf-item-price">{(item.price * item.quantity).toFixed(2)} TND</div>
                    </div>
                  ))}
                  <div style={{ marginTop: "1rem" }}>
                    <div className="conf-totals">
                      <div className="conf-total-row"><span>{t("cart.subtotal")}</span><span>{order.subtotal.toFixed(2)} TND</span></div>
                      <div className="conf-total-row">
                        <span>{t("cart.shipping")}</span>
                        <span>{order.shippingCost === 0 ? <span style={{ color: "#16a34a", fontWeight: 500 }}>{t("cart.free")}</span> : `${order.shippingCost.toFixed(2)} TND`}</span>
                      </div>
                      <div className="conf-total-row grand">
                        <span>{t("cart.total")}</span>
                        <span className="val">{order.total.toFixed(2)} TND</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order info */}
              <div className="conf-card">
                <div className="conf-card-header">📋 {t("checkout.orderDetails")}</div>
                <div className="conf-card-body">
                  <div className="conf-info-grid">
                    <div className="conf-info-item">
                      <div className="conf-info-label">{t("checkout.paymentMethod")}</div>
                      <div className="conf-info-val">
                        {order.paymentMethod === "cash_on_delivery" ? `💵 ${t("checkout.cashOnDelivery")}` : `💳 ${t("checkout.onlinePayment")}`}
                      </div>
                    </div>
                    <div className="conf-info-item">
                      <div className="conf-info-label">{t("checkout.paymentStatus")}</div>
                      <div className="conf-info-val">
                        <span className={`status-badge status-${order.paymentStatus}`}>
                          {t(`checkout.status_${order.paymentStatus}`)}
                        </span>
                      </div>
                    </div>
                    <div className="conf-info-item">
                      <div className="conf-info-label">{t("checkout.shippingStatus")}</div>
                      <div className="conf-info-val">
                        <span className={`status-badge status-${order.shippingStatus}`} style={order.shippingStatus === "pending" ? { background: "#fef3c7", color: "#92400e" } : {}}>
                          {t(`checkout.shipStatus_${order.shippingStatus}`)}
                        </span>
                      </div>
                    </div>
                    <div className="conf-info-item">
                      <div className="conf-info-label">{t("checkout.orderDate")}</div>
                      <div className="conf-info-val">{new Date(order.createdAt).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping */}
              <div className="conf-card">
                <div className="conf-card-header">🚚 {t("checkout.shippingInfo")}</div>
                <div className="conf-card-body">
                  <div className="conf-info-grid">
                    <div className="conf-info-item">
                      <div className="conf-info-label">{t("checkout.fullName")}</div>
                      <div className="conf-info-val">{order.shipping.fullName}</div>
                    </div>
                    <div className="conf-info-item">
                      <div className="conf-info-label">{t("checkout.phone")}</div>
                      <div className="conf-info-val">{order.shipping.phone}</div>
                    </div>
                    <div className="conf-info-item">
                      <div className="conf-info-label">{t("checkout.email")}</div>
                      <div className="conf-info-val">{order.shipping.email}</div>
                    </div>
                    <div className="conf-info-item">
                      <div className="conf-info-label">{t("checkout.city")}</div>
                      <div className="conf-info-val">{order.shipping.city}, {order.shipping.country}</div>
                    </div>
                    <div className="conf-info-item" style={{ gridColumn: "1 / -1" }}>
                      <div className="conf-info-label">{t("checkout.streetAddress")}</div>
                      <div className="conf-info-val">{order.shipping.streetAddress}, {order.shipping.zipCode}</div>
                    </div>
                    {order.shipping.notes && (
                      <div className="conf-info-item" style={{ gridColumn: "1 / -1" }}>
                        <div className="conf-info-label">{t("checkout.notes")}</div>
                        <div className="conf-info-val">{order.shipping.notes}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="conf-cta">
                <Link href={`/${locale}`} className="conf-cta-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
                    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
                  </svg>
                  {t("checkout.continueShopping")}
                </Link>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
