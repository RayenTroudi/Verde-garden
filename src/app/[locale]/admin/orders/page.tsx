"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { X } from "lucide-react";

interface OrderItem {
  plantId: string;
  name: { fr: string; en: string };
  price: number;
  quantity: number;
  imageUrl: string;
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

const SHIPPING_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];
const PAYMENT_STATUSES = ["pending", "paid", "failed", "cash_on_delivery"];

const statusColors: Record<string, { bg: string; color: string }> = {
  pending:          { bg: "#fef3c7", color: "#92400e" },
  processing:       { bg: "#e0f2fe", color: "#0369a1" },
  shipped:          { bg: "#f3e8ff", color: "#7c3aed" },
  delivered:        { bg: "#dcfce7", color: "#166534" },
  cancelled:        { bg: "#fee2e2", color: "#dc2626" },
  paid:             { bg: "#dcfce7", color: "#166534" },
  failed:           { bg: "#fee2e2", color: "#dc2626" },
  cash_on_delivery: { bg: "#e0f2fe", color: "#0369a1" },
};

export default function AdminOrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();

  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace(`/${locale}/login`);
  }, [status, router, locale]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const qs = filterStatus ? `?status=${filterStatus}` : "";
      const res = await fetch(`/api/orders${qs}`);
      const data = await res.json();
      setOrders(data.orders ?? []);
      setTotal(data.total ?? 0);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    if (status === "authenticated") fetchOrders();
  }, [status, fetchOrders]);

  const updateOrder = async (id: string, field: string, value: string) => {
    setUpdating(id + field);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, ...data.order } : o)));
      if (selectedOrder?._id === id) setSelectedOrder((prev) => prev ? { ...prev, ...data.order } : prev);
      showToast(t("admin.orderUpdated"));
    } catch {
      showToast(t("admin.generalError"));
    } finally {
      setUpdating(null);
    }
  };

  if (status === "loading" || status === "unauthenticated") return null;

  const revenue = orders.reduce((sum, o) => o.paymentStatus === "paid" ? sum + o.total : sum, 0);

  return (
    <>
      <style>{`
        .ao-page { min-height: 100vh; background: var(--cream); }
        .ao-nav {
          position: sticky; top: 0; z-index: 100;
          background: var(--forest);
          padding: 0 2rem; height: 64px;
          display: flex; align-items: center; gap: 1rem;
        }
        .ao-nav-logo {
          font-family: var(--font-display); font-size: 1.25rem;
          color: var(--cream); display: flex; align-items: center; gap: 0.5rem;
          text-decoration: none;
        }
        .ao-nav-sep { color: rgba(247,243,236,0.2); }
        .ao-nav-title {
          font-size: 0.78rem; font-weight: 500;
          color: rgba(247,243,236,0.65);
          text-transform: uppercase; letter-spacing: 0.1em;
        }
        .ao-nav-back {
          margin-left: auto;
          font-size: 0.78rem; color: rgba(247,243,236,0.6);
          border: 1px solid rgba(247,243,236,0.18);
          padding: 0.4rem 1rem; border-radius: 100px;
          transition: all 0.18s;
          text-decoration: none;
        }
        .ao-nav-back:hover { background: rgba(247,243,236,0.09); color: var(--cream); }

        .ao-body { max-width: 1300px; margin: 0 auto; padding: 2rem; }
        @media (max-width: 700px) { .ao-body { padding: 1rem; } }

        /* Stats */
        .ao-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.75rem; }
        @media (max-width: 900px) { .ao-stats { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 480px) { .ao-stats { grid-template-columns: 1fr 1fr; } }
        .ao-stat {
          background: var(--white); border-radius: var(--radius-lg);
          border: 1px solid rgba(0,0,0,0.06); box-shadow: var(--shadow-sm);
          padding: 1.25rem 1.5rem;
        }
        .ao-stat-label { font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); margin-bottom: 0.4rem; }
        .ao-stat-val { font-family: var(--font-display); font-size: 2rem; font-weight: 500; color: var(--forest); }
        .ao-stat-sub { font-size: 0.72rem; color: var(--text-muted); margin-top: 0.2rem; }

        /* Filters */
        .ao-toolbar {
          display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem; flex-wrap: wrap;
        }
        .ao-filter-pill {
          font-size: 0.76rem; font-weight: 500;
          padding: 0.38rem 0.9rem; border-radius: 8px;
          border: 1.5px solid var(--parchment);
          color: var(--text-muted); background: var(--white);
          cursor: pointer; transition: all 0.18s; white-space: nowrap;
        }
        .ao-filter-pill:hover { border-color: rgba(127,168,107,0.5); color: var(--sage); }
        .ao-filter-pill.active { background: var(--forest); border-color: var(--forest); color: var(--cream); }
        .ao-total-count { margin-left: auto; font-size: 0.75rem; color: var(--text-muted); }

        /* Table */
        .ao-table-wrap {
          background: var(--white); border-radius: var(--radius-lg);
          border: 1px solid rgba(0,0,0,0.06); box-shadow: var(--shadow-sm);
          overflow: hidden;
        }
        .ao-table { width: 100%; border-collapse: collapse; }
        .ao-table th {
          text-align: left; padding: 0.9rem 1.25rem;
          font-size: 0.68rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.1em;
          color: var(--text-muted); background: var(--cream);
          border-bottom: 1px solid var(--parchment);
          white-space: nowrap;
        }
        .ao-table td {
          padding: 1rem 1.25rem;
          border-bottom: 1px solid rgba(0,0,0,0.04);
          vertical-align: middle; font-size: 0.84rem;
        }
        .ao-table tr:last-child td { border-bottom: none; }
        .ao-table tr:hover td { background: rgba(246,242,235,0.5); }
        .ao-order-num {
          font-family: monospace; font-size: 0.78rem; font-weight: 600;
          color: var(--forest); letter-spacing: 0.04em;
        }
        .ao-customer { font-weight: 500; color: var(--text); }
        .ao-customer-email { font-size: 0.74rem; color: var(--text-muted); }
        .ao-status-badge {
          display: inline-block; font-size: 0.68rem; font-weight: 600;
          padding: 0.2rem 0.6rem; border-radius: 6px;
          text-transform: capitalize; white-space: nowrap;
        }
        .ao-total { font-family: var(--font-display); font-size: 1rem; font-weight: 600; color: var(--forest); }
        .ao-select {
          font-size: 0.75rem; padding: 0.3rem 0.6rem;
          border: 1.5px solid var(--parchment); border-radius: 7px;
          background: var(--cream); color: var(--text);
          cursor: pointer; outline: none;
          transition: border-color 0.18s;
        }
        .ao-select:focus { border-color: var(--fern); }
        .ao-detail-btn {
          font-size: 0.73rem; color: var(--sage);
          border: 1px solid rgba(127,168,107,0.3);
          border-radius: 6px; padding: 0.25rem 0.65rem;
          cursor: pointer; background: none;
          transition: all 0.15s;
        }
        .ao-detail-btn:hover { background: rgba(127,168,107,0.08); color: var(--forest); }
        .ao-method-badge {
          font-size: 0.71rem; color: var(--text-muted);
          background: var(--parchment); padding: 0.18rem 0.55rem;
          border-radius: 5px;
        }
        @media (max-width: 900px) {
          .ao-table th:nth-child(4), .ao-table td:nth-child(4) { display: none; }
          .ao-table th:nth-child(5), .ao-table td:nth-child(5) { display: none; }
        }
        @media (max-width: 600px) {
          .ao-table th:nth-child(3), .ao-table td:nth-child(3) { display: none; }
        }

        /* Loading */
        .ao-loading { text-align: center; padding: 3rem; color: var(--text-muted); font-size: 0.9rem; }
        .ao-empty { text-align: center; padding: 3rem; color: var(--text-muted); }

        /* Modal */
        .ao-modal-overlay {
          position: fixed; inset: 0; z-index: 200;
          background: rgba(0,0,0,0.45); backdrop-filter: blur(4px);
          display: flex; align-items: flex-start; justify-content: flex-end;
          padding: 0;
        }
        .ao-modal {
          width: 480px; max-width: 100vw;
          height: 100vh; overflow-y: auto;
          background: var(--white);
          box-shadow: -4px 0 40px rgba(0,0,0,0.2);
          animation: slideInRight 0.25s ease;
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
        .ao-modal-header {
          padding: 1.5rem; border-bottom: 1px solid var(--parchment);
          display: flex; align-items: center; gap: 0.75rem;
          position: sticky; top: 0; background: var(--white); z-index: 10;
        }
        .ao-modal-title { font-family: var(--font-display); font-size: 1.3rem; font-weight: 500; color: var(--forest); flex: 1; }
        .ao-modal-close {
          width: 32px; height: 32px; border-radius: 8px; border: none;
          background: var(--parchment); color: var(--text-muted);
          cursor: pointer; display: grid; place-items: center;
          transition: background 0.15s;
        }
        .ao-modal-close:hover { background: var(--sand); }
        .ao-modal-body { padding: 1.5rem; }
        .ao-modal-section { margin-bottom: 1.5rem; }
        .ao-modal-section-title {
          font-size: 0.68rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.12em;
          color: var(--text-muted); margin-bottom: 0.75rem;
        }
        .ao-modal-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .ao-modal-info-item {}
        .ao-modal-info-label { font-size: 0.68rem; color: var(--text-muted); margin-bottom: 0.15rem; text-transform: uppercase; letter-spacing: 0.08em; }
        .ao-modal-info-val { font-size: 0.85rem; font-weight: 500; color: var(--text); }
        .ao-modal-item {
          display: flex; gap: 0.75rem; align-items: center;
          padding: 0.6rem 0; border-bottom: 1px solid rgba(0,0,0,0.05);
        }
        .ao-modal-item:last-child { border-bottom: none; }
        .ao-modal-item-info { flex: 1; }
        .ao-modal-item-name { font-size: 0.85rem; font-weight: 500; color: var(--forest); }
        .ao-modal-item-qty { font-size: 0.74rem; color: var(--text-muted); }
        .ao-modal-item-price { font-size: 0.9rem; font-weight: 600; color: var(--forest); }
        .ao-modal-total-row { display: flex; justify-content: space-between; padding: 0.4rem 0; font-size: 0.84rem; color: var(--text-muted); }
        .ao-modal-total-grand { display: flex; justify-content: space-between; padding: 0.7rem 0 0; margin-top: 0.3rem; border-top: 2px solid var(--parchment); font-weight: 700; color: var(--forest); }
        .ao-modal-total-grand .v { font-family: var(--font-display); font-size: 1.3rem; }
        .ao-modal-action-row { display: flex; flex-direction: column; gap: 0.6rem; }
        .ao-modal-select {
          width: 100%; padding: 0.65rem 0.9rem;
          border: 1.5px solid var(--parchment); border-radius: 9px;
          background: var(--cream); color: var(--text); font-size: 0.85rem;
          outline: none; cursor: pointer;
          transition: border-color 0.18s;
        }
        .ao-modal-select:focus { border-color: var(--fern); }
        .ao-modal-update-btn {
          padding: 0.65rem 1.25rem;
          background: var(--forest); color: var(--cream);
          border: none; border-radius: 9px;
          font-size: 0.85rem; font-weight: 600;
          cursor: pointer; transition: background 0.18s;
        }
        .ao-modal-update-btn:hover:not(:disabled) { background: var(--forest-light); }
        .ao-modal-update-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Toast */
        .ao-toast {
          position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%);
          background: var(--forest); color: var(--cream);
          padding: 0.75rem 1.5rem; border-radius: 100px;
          font-size: 0.85rem; font-weight: 500;
          box-shadow: 0 4px 24px rgba(0,0,0,0.2);
          z-index: 300; animation: fadeUp 0.25s ease;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      <div className="ao-page">
        {/* Nav */}
        <nav className="ao-nav">
          <Link href={`/${locale}`} className="ao-nav-logo">
            <img src="/icons/logo.svg" width="26" height="26" alt="Verde Garden" style={{ display: "block", borderRadius: 4 }} />
          </Link>
          <span className="ao-nav-sep">/</span>
          <span className="ao-nav-title">{t("admin.orders")}</span>
          <Link href={`/${locale}/admin`} className="ao-nav-back">{t("admin.title")}</Link>
        </nav>

        <div className="ao-body">
          {/* Stats */}
          <div className="ao-stats">
            <div className="ao-stat">
              <div className="ao-stat-label">{t("admin.totalOrders")}</div>
              <div className="ao-stat-val">{total}</div>
            </div>
            <div className="ao-stat">
              <div className="ao-stat-label">{t("admin.pendingOrders")}</div>
              <div className="ao-stat-val">{orders.filter((o) => o.shippingStatus === "pending").length}</div>
              <div className="ao-stat-sub">{t("admin.awaitingProcessing")}</div>
            </div>
            <div className="ao-stat">
              <div className="ao-stat-label">{t("admin.delivered")}</div>
              <div className="ao-stat-val">{orders.filter((o) => o.shippingStatus === "delivered").length}</div>
            </div>
            <div className="ao-stat">
              <div className="ao-stat-label">{t("admin.revenue")}</div>
              <div className="ao-stat-val">{revenue.toFixed(0)}</div>
              <div className="ao-stat-sub">TND {t("admin.paidOrders")}</div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="ao-toolbar">
            <button className={`ao-filter-pill${filterStatus === "" ? " active" : ""}`} onClick={() => setFilterStatus("")}>{t("common.all")}</button>
            {SHIPPING_STATUSES.map((s) => (
              <button key={s} className={`ao-filter-pill${filterStatus === s ? " active" : ""}`} onClick={() => setFilterStatus(s)}>
                {t(`checkout.shipStatus_${s}`)}
              </button>
            ))}
            <span className="ao-total-count">{total} {t("admin.ordersTotal")}</span>
          </div>

          {/* Table */}
          <div className="ao-table-wrap">
            {loading ? (
              <div className="ao-loading">{t("common.loading")}</div>
            ) : orders.length === 0 ? (
              <div className="ao-empty">{t("admin.noOrders")}</div>
            ) : (
              <table className="ao-table">
                <thead>
                  <tr>
                    <th>{t("admin.orderNumber")}</th>
                    <th>{t("admin.customer")}</th>
                    <th>{t("admin.orderDate")}</th>
                    <th>{t("admin.paymentStatus")}</th>
                    <th>{t("admin.shippingStatus")}</th>
                    <th>{t("admin.orderTotal")}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const shipColor = statusColors[order.shippingStatus] ?? statusColors.pending;
                    const payColor = statusColors[order.paymentStatus] ?? statusColors.pending;
                    return (
                      <tr key={order._id}>
                        <td><span className="ao-order-num">{order.orderNumber}</span></td>
                        <td>
                          <div className="ao-customer">{order.shipping.fullName}</div>
                          <div className="ao-customer-email">{order.shipping.email}</div>
                        </td>
                        <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td>
                          <span className="ao-status-badge" style={{ background: payColor.bg, color: payColor.color }}>
                            {t(`checkout.status_${order.paymentStatus}`)}
                          </span>
                        </td>
                        <td>
                          <select
                            className="ao-select"
                            value={order.shippingStatus}
                            disabled={updating === order._id + "shippingStatus"}
                            onChange={(e) => updateOrder(order._id, "shippingStatus", e.target.value)}
                          >
                            {SHIPPING_STATUSES.map((s) => (
                              <option key={s} value={s}>{t(`checkout.shipStatus_${s}`)}</option>
                            ))}
                          </select>
                        </td>
                        <td><span className="ao-total">{order.total.toFixed(2)} TND</span></td>
                        <td>
                          <button className="ao-detail-btn" onClick={() => setSelectedOrder(order)}>
                            {t("common.view")}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedOrder && (
        <div className="ao-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="ao-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ao-modal-header">
              <h2 className="ao-modal-title">{selectedOrder.orderNumber}</h2>
              <button className="ao-modal-close" onClick={() => setSelectedOrder(null)}>
                <X size={14} fill="currentColor" style={{ color: "#c0543a" }} aria-hidden="true" />
              </button>
            </div>
            <div className="ao-modal-body">
              {/* Customer */}
              <div className="ao-modal-section">
                <div className="ao-modal-section-title">{t("admin.customer")}</div>
                <div className="ao-modal-info-grid">
                  <div className="ao-modal-info-item">
                    <div className="ao-modal-info-label">{t("checkout.fullName")}</div>
                    <div className="ao-modal-info-val">{selectedOrder.shipping.fullName}</div>
                  </div>
                  <div className="ao-modal-info-item">
                    <div className="ao-modal-info-label">{t("checkout.phone")}</div>
                    <div className="ao-modal-info-val">{selectedOrder.shipping.phone}</div>
                  </div>
                  <div className="ao-modal-info-item" style={{ gridColumn: "1 / -1" }}>
                    <div className="ao-modal-info-label">{t("checkout.email")}</div>
                    <div className="ao-modal-info-val">{selectedOrder.shipping.email}</div>
                  </div>
                  <div className="ao-modal-info-item" style={{ gridColumn: "1 / -1" }}>
                    <div className="ao-modal-info-label">{t("checkout.streetAddress")}</div>
                    <div className="ao-modal-info-val">{selectedOrder.shipping.streetAddress}, {selectedOrder.shipping.zipCode}, {selectedOrder.shipping.city}, {selectedOrder.shipping.country}</div>
                  </div>
                  {selectedOrder.shipping.notes && (
                    <div className="ao-modal-info-item" style={{ gridColumn: "1 / -1" }}>
                      <div className="ao-modal-info-label">{t("checkout.notes")}</div>
                      <div className="ao-modal-info-val">{selectedOrder.shipping.notes}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Items */}
              <div className="ao-modal-section">
                <div className="ao-modal-section-title">{t("checkout.orderedItems")}</div>
                {selectedOrder.items.map((item, i) => (
                  <div key={i} className="ao-modal-item">
                    <div className="ao-modal-item-info">
                      <div className="ao-modal-item-name">{item.name[locale as "fr" | "en"] ?? item.name.en}</div>
                      <div className="ao-modal-item-qty">x{item.quantity} · {item.price.toFixed(2)} TND {t("cart.each")}</div>
                    </div>
                    <div className="ao-modal-item-price">{(item.price * item.quantity).toFixed(2)} TND</div>
                  </div>
                ))}
                <div style={{ marginTop: "0.75rem" }}>
                  <div className="ao-modal-total-row"><span>{t("cart.subtotal")}</span><span>{selectedOrder.subtotal.toFixed(2)} TND</span></div>
                  <div className="ao-modal-total-row"><span>{t("cart.shipping")}</span><span>{selectedOrder.shippingCost === 0 ? <span style={{ color: "#16a34a" }}>{t("cart.free")}</span> : `${selectedOrder.shippingCost.toFixed(2)} TND`}</span></div>
                  <div className="ao-modal-total-grand"><span>{t("cart.total")}</span><span className="v">{selectedOrder.total.toFixed(2)} TND</span></div>
                </div>
              </div>

              {/* Status management */}
              <div className="ao-modal-section">
                <div className="ao-modal-section-title">{t("admin.manageOrder")}</div>
                <div className="ao-modal-action-row">
                  <div>
                    <div className="ao-modal-info-label" style={{ marginBottom: "0.4rem" }}>{t("admin.shippingStatus")}</div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <select
                        className="ao-modal-select"
                        value={selectedOrder.shippingStatus}
                        onChange={(e) => setSelectedOrder((prev) => prev ? { ...prev, shippingStatus: e.target.value } : prev)}
                      >
                        {SHIPPING_STATUSES.map((s) => (
                          <option key={s} value={s}>{t(`checkout.shipStatus_${s}`)}</option>
                        ))}
                      </select>
                      <button
                        className="ao-modal-update-btn"
                        disabled={updating === selectedOrder._id + "shippingStatus"}
                        onClick={() => updateOrder(selectedOrder._id, "shippingStatus", selectedOrder.shippingStatus)}
                      >
                        {t("common.save")}
                      </button>
                    </div>
                  </div>
                  <div>
                    <div className="ao-modal-info-label" style={{ marginBottom: "0.4rem" }}>{t("admin.paymentStatus")}</div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <select
                        className="ao-modal-select"
                        value={selectedOrder.paymentStatus}
                        onChange={(e) => setSelectedOrder((prev) => prev ? { ...prev, paymentStatus: e.target.value } : prev)}
                      >
                        {PAYMENT_STATUSES.map((s) => (
                          <option key={s} value={s}>{t(`checkout.status_${s}`)}</option>
                        ))}
                      </select>
                      <button
                        className="ao-modal-update-btn"
                        disabled={updating === selectedOrder._id + "paymentStatus"}
                        onClick={() => updateOrder(selectedOrder._id, "paymentStatus", selectedOrder.paymentStatus)}
                      >
                        {t("common.save")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="ao-toast">{toast}</div>}
    </>
  );
}
