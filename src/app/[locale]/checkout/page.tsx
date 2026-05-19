"use client";

import { useState, useEffect, Suspense } from "react";
import { useCart, CartItem } from "@/context/CartContext";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import StoreNav from "@/components/StoreNav";

const SHIPPING_THRESHOLD = 150;
const SHIPPING_COST = 7;

interface ShippingForm {
  fullName: string;
  phone: string;
  email: string;
  country: string;
  city: string;
  streetAddress: string;
  zipCode: string;
  notes: string;
}

const EMPTY_FORM: ShippingForm = {
  fullName: "", phone: "", email: "",
  country: "", city: "", streetAddress: "",
  zipCode: "", notes: "",
};

function CheckoutContent() {
  const { items: cartItems, subtotal: cartSubtotal, clearCart } = useCart();
  const locale = useLocale();
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isBuyNow = searchParams.get("buynow") === "1";
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const [form, setForm] = useState<ShippingForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<ShippingForm>>({});
  const [paymentMethod, setPaymentMethod] = useState<"cash_on_delivery" | "online">("cash_on_delivery");
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<"shipping" | "payment">("shipping");

  useEffect(() => {
    if (isBuyNow) {
      try {
        const raw = sessionStorage.getItem("vg_buynow");
        if (raw) {
          const item = JSON.parse(raw) as CartItem;
          setCheckoutItems([item]);
          return;
        }
      } catch { /* fall through */ }
    }
    setCheckoutItems(cartItems);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBuyNow]);

  // Sync cart items when not buy-now
  useEffect(() => {
    if (!isBuyNow) setCheckoutItems(cartItems);
  }, [cartItems, isBuyNow]);

  const subtotal = checkoutItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const shippingCost = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = subtotal + shippingCost;

  const validate = (): boolean => {
    const e: Partial<ShippingForm> = {};
    if (!form.fullName.trim()) e.fullName = t("checkout.required");
    if (!form.phone.trim()) e.phone = t("checkout.required");
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t("checkout.invalidEmail");
    if (!form.country.trim()) e.country = t("checkout.required");
    if (!form.city.trim()) e.city = t("checkout.required");
    if (!form.streetAddress.trim()) e.streetAddress = t("checkout.required");
    if (!form.zipCode.trim()) e.zipCode = t("checkout.required");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (field: keyof ShippingForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleShippingNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) setStep("payment");
  };

  const handlePlaceOrder = async () => {
    if (!validate()) { setStep("shipping"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: checkoutItems.map((i) => ({ plantId: i.plantId, quantity: i.quantity })),
          shipping: form,
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Order failed");

      if (!isBuyNow) clearCart();
      else sessionStorage.removeItem("vg_buynow");

      router.push(`/${locale}/order-confirmation/${data.order.orderNumber}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : t("checkout.orderError"));
    } finally {
      setSubmitting(false);
    }
  };

  if (checkoutItems.length === 0) {
    return (
      <div className="co-page">
        <div className="co-empty">
          <h2>{t("cart.empty")}</h2>
          <Link href={`/${locale}`} className="co-empty-link">{t("cart.browsePlants")}</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        /* ─── PAGE ──────────────────────────────────────────────────── */
        .co-page {
          min-height: 100vh; background: var(--cream);
        }
        .co-header {
          background: var(--forest);
          padding: 5.5rem 2rem 3.5rem;
          position: relative; overflow: hidden;
        }
        .co-header::after {
          content: '';
          position: absolute; bottom: -1px; left: 0; right: 0; height: 48px;
          background: var(--cream);
          clip-path: ellipse(55% 100% at 50% 100%);
          z-index: 2;
        }
        .co-header::before {
          content: '';
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 70% 60% at 20% 30%, rgba(127,168,107,0.14) 0%, transparent 60%),
            radial-gradient(ellipse 50% 70% at 80% 70%, rgba(74,103,65,0.18) 0%, transparent 55%);
          pointer-events: none;
        }
        .co-header-inner {
          max-width: 1100px; margin: 0 auto;
          position: relative; z-index: 1;
        }
.co-title {
          font-family: var(--font-display);
          font-size: clamp(2rem, 5vw, 3.2rem);
          font-weight: 300; color: var(--cream);
          line-height: 1.1; letter-spacing: -0.01em;
        }

        /* Steps */
        .co-steps {
          display: flex; gap: 0; max-width: 1100px;
          margin: 0 auto; padding: 1.25rem 0 0;
          position: relative; z-index: 1;
        }
        .co-step {
          display: flex; align-items: center; gap: 0.5rem;
          font-size: 0.8rem; font-weight: 500; color: rgba(255,255,255,0.55);
        }
        .co-step.active { color: white; }
        .co-step.done { color: rgba(255,255,255,0.75); }
        .co-step-num {
          width: 26px; height: 26px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.3);
          display: grid; place-items: center;
          font-size: 0.72rem; font-weight: 700; color: rgba(255,255,255,0.55);
        }
        .co-step.active .co-step-num {
          background: white; border-color: white; color: var(--forest);
        }
        .co-step.done .co-step-num {
          background: rgba(255,255,255,0.2); border-color: rgba(255,255,255,0.5); color: white;
        }
        .co-step-line {
          flex: 1; height: 2px;
          background: rgba(255,255,255,0.2);
          margin: 0 0.75rem;
        }

        /* Body */
        .co-body {
          max-width: 1100px; margin: 0 auto;
          padding: 1.5rem 2rem 3rem;
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 1.5rem; align-items: start;
        }
        @media (max-width: 900px) {
          .co-body { grid-template-columns: 1fr; }
        }

        /* Form card */
        .co-card {
          background: var(--white);
          border-radius: var(--radius-lg);
          border: 1px solid rgba(0,0,0,0.06);
          box-shadow: var(--shadow-sm);
          overflow: hidden;
        }
        .co-card-header {
          padding: 1.2rem 1.75rem;
          border-bottom: 1px solid var(--parchment);
          display: flex; align-items: center; gap: 0.6rem;
        }
        .co-card-header-icon {
          width: 32px; height: 32px; border-radius: 8px;
          background: rgba(28,58,30,0.08);
          display: grid; place-items: center;
          color: var(--forest);
        }
        .co-card-title {
          font-family: var(--font-display);
          font-size: 1.2rem; font-weight: 500; color: var(--forest);
        }
        .co-form { padding: 1.75rem; }
        .co-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        @media (max-width: 600px) {
          .co-grid-2 { grid-template-columns: 1fr; }
          .co-body { padding: 1rem; }
          .co-header { padding: 5rem 1.25rem 3rem; }
        }
        .co-field { margin-bottom: 1rem; }
        .co-label {
          display: block; font-size: 0.78rem; font-weight: 500;
          color: var(--text-muted); margin-bottom: 0.4rem;
          letter-spacing: 0.02em;
        }
        .co-label .req { color: var(--terra); margin-left: 2px; }
        .co-input, .co-select, .co-textarea {
          width: 100%; padding: 0.7rem 0.9rem;
          background: var(--cream);
          border: 1.5px solid var(--parchment);
          border-radius: 9px;
          font-size: 0.875rem; color: var(--text);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .co-input:focus, .co-select:focus, .co-textarea:focus {
          border-color: var(--fern);
          background: white;
          box-shadow: 0 0 0 3px rgba(127,168,107,0.15);
        }
        .co-input.error, .co-select.error, .co-textarea.error {
          border-color: #f87171;
          box-shadow: 0 0 0 3px rgba(248,113,113,0.1);
        }
        .co-error-msg {
          font-size: 0.73rem; color: #dc2626; margin-top: 0.3rem;
          display: flex; align-items: center; gap: 0.3rem;
        }
        .co-textarea { resize: vertical; min-height: 80px; }

        /* Payment methods */
        .co-pay-methods { display: flex; flex-direction: column; gap: 0.75rem; padding: 1.75rem; }
        .co-pay-option {
          border: 2px solid var(--parchment);
          border-radius: 12px; padding: 1.1rem 1.25rem;
          cursor: pointer; transition: all 0.18s;
          display: flex; align-items: flex-start; gap: 1rem;
        }
        .co-pay-option:hover { border-color: var(--fern); background: rgba(127,168,107,0.04); }
        .co-pay-option.selected { border-color: var(--forest); background: rgba(28,58,30,0.04); }
        .co-pay-radio {
          width: 20px; height: 20px; border-radius: 50%;
          border: 2px solid var(--sand); flex-shrink: 0; margin-top: 1px;
          transition: all 0.18s; position: relative;
        }
        .co-pay-option.selected .co-pay-radio {
          border-color: var(--forest);
          background: var(--forest);
          box-shadow: inset 0 0 0 4px white;
        }
        .co-pay-info { flex: 1; }
        .co-pay-label {
          font-size: 0.9rem; font-weight: 600; color: var(--text);
          margin-bottom: 0.2rem;
        }
        .co-pay-desc { font-size: 0.78rem; color: var(--text-muted); line-height: 1.5; }

        /* Online payment card mockup */
        .co-pay-card-mockup {
          background: linear-gradient(135deg, var(--forest) 0%, var(--sage) 100%);
          border-radius: 14px; padding: 1.25rem 1.5rem;
          margin-top: 1rem; color: white; position: relative; overflow: hidden;
        }
        .co-pay-card-mockup::before {
          content: ''; position: absolute;
          top: -30px; right: -30px; width: 120px; height: 120px;
          background: rgba(255,255,255,0.07); border-radius: 50%;
        }
        .co-pay-card-mockup::after {
          content: ''; position: absolute;
          bottom: -40px; right: 30px; width: 90px; height: 90px;
          background: rgba(255,255,255,0.05); border-radius: 50%;
        }
        .co-pay-chip { width: 34px; height: 26px; border-radius: 5px; background: rgba(255,255,255,0.25); margin-bottom: 1.5rem; }
        .co-pay-card-num {
          font-size: 0.95rem; letter-spacing: 0.2em;
          font-family: monospace; opacity: 0.85; margin-bottom: 0.75rem;
        }
        .co-pay-card-bottom { display: flex; justify-content: space-between; align-items: flex-end; }
        .co-pay-card-label { font-size: 0.58rem; opacity: 0.6; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.15rem; }
        .co-pay-card-val { font-size: 0.8rem; opacity: 0.9; }
        .co-pay-notice {
          margin-top: 0.75rem; font-size: 0.75rem;
          color: var(--text-muted); padding: 0.6rem 0.8rem;
          background: rgba(127,168,107,0.08);
          border: 1px solid rgba(127,168,107,0.2);
          border-radius: 8px; line-height: 1.5;
        }

        /* Action buttons */
        .co-actions { display: flex; gap: 0.75rem; margin-top: 1.5rem; flex-wrap: wrap; }
        .co-btn-primary {
          flex: 1; min-width: 160px;
          background: var(--forest); color: var(--cream);
          border: none; border-radius: 11px;
          padding: 0.85rem 1.5rem;
          font-size: 0.9rem; font-weight: 600;
          cursor: pointer; transition: background 0.2s, transform 0.15s;
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
        }
        .co-btn-primary:hover:not(:disabled) { background: var(--forest-light); transform: translateY(-1px); }
        .co-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .co-btn-secondary {
          padding: 0.85rem 1.25rem;
          background: none; border: 1.5px solid var(--parchment);
          border-radius: 11px; color: var(--text-muted);
          font-size: 0.85rem; font-weight: 500;
          cursor: pointer; transition: all 0.18s;
          display: flex; align-items: center; gap: 0.4rem;
        }
        .co-btn-secondary:hover { border-color: var(--sand); color: var(--text); }

        /* Summary sidebar */
        .co-summary {
          background: var(--white);
          border-radius: var(--radius-lg);
          border: 1px solid rgba(0,0,0,0.06);
          box-shadow: var(--shadow-sm);
          padding: 1.5rem;
          position: sticky; top: 86px;
        }
        .co-summary-title {
          font-family: var(--font-display);
          font-size: 1.2rem; font-weight: 500;
          color: var(--forest); margin-bottom: 1.1rem;
        }
        .co-summary-item {
          display: flex; gap: 0.75rem; align-items: center;
          padding: 0.6rem 0; border-bottom: 1px solid rgba(0,0,0,0.04);
        }
        .co-summary-item:last-of-type { border-bottom: none; }
        .co-summary-img {
          width: 46px; height: 46px; flex-shrink: 0;
          border-radius: 8px; overflow: hidden;
          background: var(--parchment); position: relative;
          border: 1px solid rgba(0,0,0,0.06);
        }
        .co-summary-item-info { flex: 1; min-width: 0; }
        .co-summary-item-name {
          font-size: 0.82rem; font-weight: 500;
          color: var(--forest); white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis;
        }
        .co-summary-item-qty { font-size: 0.74rem; color: var(--text-muted); }
        .co-summary-item-price {
          font-size: 0.88rem; font-weight: 600;
          color: var(--forest); white-space: nowrap;
        }
        .co-summary-divider { height: 1px; background: var(--parchment); margin: 0.75rem 0; }
        .co-summary-row {
          display: flex; justify-content: space-between;
          font-size: 0.84rem; color: var(--text-muted);
          padding: 0.35rem 0;
        }
        .co-summary-total {
          display: flex; justify-content: space-between;
          font-size: 1rem; font-weight: 600; color: var(--forest);
          padding: 0.75rem 0 0;
          border-top: 2px solid var(--parchment);
          margin-top: 0.25rem;
        }
        .co-summary-total-val {
          font-family: var(--font-display);
          font-size: 1.4rem; font-weight: 600;
        }
        .shipping-free { color: #166534; font-weight: 500; }
        .co-empty { text-align: center; padding: 6rem 2rem; }
        .co-empty h2 { font-family: var(--font-display); font-size: 1.8rem; color: var(--forest); margin-bottom: 1rem; }
        .co-empty-link {
          display: inline-block; background: var(--forest); color: var(--cream);
          padding: 0.7rem 1.5rem; border-radius: 10px; font-size: 0.85rem;
        }
        .spin {
          display: inline-block; width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white; border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <StoreNav showCart />

      <div className="co-page">
        {/* Header */}
        <div className="co-header">
          <div className="co-header-inner">
            <h1 className="co-title">{t("checkout.title")}</h1>
            <div className="co-steps">
              <div className={`co-step ${step === "shipping" ? "active" : "done"}`}>
                <div className="co-step-num">{step === "shipping" ? "1" : "✓"}</div>
                {t("checkout.stepShipping")}
              </div>
              <div className="co-step-line" />
              <div className={`co-step ${step === "payment" ? "active" : ""}`}>
                <div className="co-step-num">2</div>
                {t("checkout.stepPayment")}
              </div>
            </div>
          </div>
        </div>

        <div className="co-body">
          <div>
            {/* Shipping form */}
            {step === "shipping" && (
              <form onSubmit={handleShippingNext} noValidate>
                <div className="co-card">
                  <div className="co-card-header">
                    <div className="co-card-header-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                    </div>
                    <h2 className="co-card-title">{t("checkout.shippingInfo")}</h2>
                  </div>
                  <div className="co-form">
                    <div className="co-field">
                      <label className="co-label">{t("checkout.fullName")} <span className="req">*</span></label>
                      <input className={`co-input${errors.fullName ? " error" : ""}`} value={form.fullName} onChange={handleChange("fullName")} placeholder={t("checkout.fullNamePlaceholder")} />
                      {errors.fullName && <div className="co-error-msg">⚠ {errors.fullName}</div>}
                    </div>
                    <div className="co-grid-2">
                      <div className="co-field">
                        <label className="co-label">{t("checkout.phone")} <span className="req">*</span></label>
                        <input className={`co-input${errors.phone ? " error" : ""}`} type="tel" value={form.phone} onChange={handleChange("phone")} placeholder="+216 XX XXX XXX" />
                        {errors.phone && <div className="co-error-msg">⚠ {errors.phone}</div>}
                      </div>
                      <div className="co-field">
                        <label className="co-label">{t("checkout.email")} <span className="req">*</span></label>
                        <input className={`co-input${errors.email ? " error" : ""}`} type="email" value={form.email} onChange={handleChange("email")} placeholder="you@example.com" />
                        {errors.email && <div className="co-error-msg">⚠ {errors.email}</div>}
                      </div>
                    </div>
                    <div className="co-grid-2">
                      <div className="co-field">
                        <label className="co-label">{t("checkout.country")} <span className="req">*</span></label>
                        <input className={`co-input${errors.country ? " error" : ""}`} value={form.country} onChange={handleChange("country")} placeholder={t("checkout.countryPlaceholder")} />
                        {errors.country && <div className="co-error-msg">⚠ {errors.country}</div>}
                      </div>
                      <div className="co-field">
                        <label className="co-label">{t("checkout.city")} <span className="req">*</span></label>
                        <input className={`co-input${errors.city ? " error" : ""}`} value={form.city} onChange={handleChange("city")} placeholder={t("checkout.cityPlaceholder")} />
                        {errors.city && <div className="co-error-msg">⚠ {errors.city}</div>}
                      </div>
                    </div>
                    <div className="co-field">
                      <label className="co-label">{t("checkout.streetAddress")} <span className="req">*</span></label>
                      <input className={`co-input${errors.streetAddress ? " error" : ""}`} value={form.streetAddress} onChange={handleChange("streetAddress")} placeholder={t("checkout.streetAddressPlaceholder")} />
                      {errors.streetAddress && <div className="co-error-msg">⚠ {errors.streetAddress}</div>}
                    </div>
                    <div className="co-field" style={{ maxWidth: "200px" }}>
                      <label className="co-label">{t("checkout.zipCode")} <span className="req">*</span></label>
                      <input className={`co-input${errors.zipCode ? " error" : ""}`} value={form.zipCode} onChange={handleChange("zipCode")} placeholder="1234" />
                      {errors.zipCode && <div className="co-error-msg">⚠ {errors.zipCode}</div>}
                    </div>
                    <div className="co-field">
                      <label className="co-label">{t("checkout.notes")}</label>
                      <textarea className="co-textarea" value={form.notes} onChange={handleChange("notes")} placeholder={t("checkout.notesPlaceholder")} />
                    </div>
                    <div className="co-actions">
                      <button type="submit" className="co-btn-primary">
                        {t("checkout.continueToPayment")}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* Payment step */}
            {step === "payment" && (
              <div className="co-card">
                <div className="co-card-header">
                  <div className="co-card-header-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                    </svg>
                  </div>
                  <h2 className="co-card-title">{t("checkout.paymentMethod")}</h2>
                </div>
                <div className="co-pay-methods">
                  {/* Cash on Delivery */}
                  <div
                    className={`co-pay-option${paymentMethod === "cash_on_delivery" ? " selected" : ""}`}
                    onClick={() => setPaymentMethod("cash_on_delivery")}
                  >
                    <div className="co-pay-radio" />
                    <div className="co-pay-info">
                      <div className="co-pay-label">💵 {t("checkout.cashOnDelivery")}</div>
                      <div className="co-pay-desc">{t("checkout.cashOnDeliveryDesc")}</div>
                    </div>
                  </div>

                  {/* Online Payment */}
                  <div
                    className={`co-pay-option${paymentMethod === "online" ? " selected" : ""}`}
                    onClick={() => setPaymentMethod("online")}
                  >
                    <div className="co-pay-radio" />
                    <div className="co-pay-info">
                      <div className="co-pay-label">💳 {t("checkout.onlinePayment")}</div>
                      <div className="co-pay-desc">{t("checkout.onlinePaymentDesc")}</div>
                      {paymentMethod === "online" && (
                        <>
                          <div className="co-pay-card-mockup">
                            <div className="co-pay-chip" />
                            <div className="co-pay-card-num">•••• •••• •••• ••••</div>
                            <div className="co-pay-card-bottom">
                              <div>
                                <div className="co-pay-card-label">{t("checkout.cardHolder")}</div>
                                <div className="co-pay-card-val">{form.fullName || "YOUR NAME"}</div>
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <div className="co-pay-card-label">{t("checkout.expires")}</div>
                                <div className="co-pay-card-val">MM / YY</div>
                              </div>
                            </div>
                          </div>
                          <div className="co-pay-notice">
                            🔒 {t("checkout.onlinePaymentNotice")}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="co-actions">
                    <button className="co-btn-secondary" onClick={() => setStep("shipping")}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 5l-7 7 7 7"/>
                      </svg>
                      {t("checkout.backToShipping")}
                    </button>
                    <button
                      className="co-btn-primary"
                      onClick={handlePlaceOrder}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <><span className="spin" /> {t("checkout.placingOrder")}</>
                      ) : (
                        <>{t("checkout.placeOrder")} · {total.toFixed(2)} TND</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="co-summary">
            <h2 className="co-summary-title">{t("cart.orderSummary")}</h2>
            {checkoutItems.map((item) => (
              <div key={item.plantId} className="co-summary-item">
                <div className="co-summary-img">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.name[locale as "fr" | "en"] ?? item.name.en} fill style={{ objectFit: "contain", padding: "3px" }} sizes="46px" />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "var(--sand)" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/></svg>
                    </div>
                  )}
                </div>
                <div className="co-summary-item-info">
                  <div className="co-summary-item-name">{item.name[locale as "fr" | "en"] ?? item.name.en}</div>
                  <div className="co-summary-item-qty">x{item.quantity}</div>
                </div>
                <div className="co-summary-item-price">{(item.price * item.quantity).toFixed(2)} TND</div>
              </div>
            ))}
            <div className="co-summary-divider" />
            <div className="co-summary-row">
              <span>{t("cart.subtotal")}</span>
              <span>{subtotal.toFixed(2)} TND</span>
            </div>
            <div className="co-summary-row">
              <span>{t("cart.shipping")}</span>
              <span>
                {shippingCost === 0
                  ? <span className="shipping-free">{t("cart.free")}</span>
                  : `${shippingCost.toFixed(2)} TND`}
              </span>
            </div>
            <div className="co-summary-total">
              <span>{t("cart.total")}</span>
              <span className="co-summary-total-val">{total.toFixed(2)} TND</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutContent />
    </Suspense>
  );
}
