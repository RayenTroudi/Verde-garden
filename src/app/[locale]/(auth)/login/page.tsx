"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn("credentials", { username, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      setError(t("login.invalidCredentials"));
    } else {
      router.push(`/${locale}/admin`);
    }
  };

  return (
    <>
      <style>{`
        .lg-root {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          font-family: var(--font-body);
        }

        /* ─── LEFT PANEL ──────────────────────────────── */
        .lg-panel {
          background: var(--forest);
          position: relative;
          display: flex; flex-direction: column;
          justify-content: space-between;
          padding: 3rem;
          overflow: hidden;
        }
        /* Mesh gradient */
        .lg-panel::before {
          content: '';
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 70% 50% at 20% 20%, rgba(127,168,107,0.2) 0%, transparent 55%),
            radial-gradient(ellipse 50% 60% at 80% 70%, rgba(74,103,65,0.25) 0%, transparent 50%);
          pointer-events: none;
        }
        /* Grid texture */
        .lg-panel-grid {
          position: absolute; inset: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(184,212,176,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(184,212,176,0.05) 1px, transparent 1px);
          background-size: 40px 40px;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 75%);
        }
        .lg-panel-content { position: relative; z-index: 1; }
        .lg-panel-logo {
          display: flex; align-items: center; gap: 0.6rem;
          text-decoration: none;
        }
        .lg-panel-logo-icon {
          width: 38px; height: 38px;
          background: rgba(184,212,176,0.15);
          border: 1px solid rgba(184,212,176,0.3);
          border-radius: 10px;
          display: grid; place-items: center;
          color: var(--mint);
        }
        .lg-panel-logo-text {
          font-family: var(--font-display);
          font-size: 1.45rem; font-weight: 500;
          color: var(--cream);
        }

        .lg-panel-center { position: relative; z-index: 1; }
        .lg-panel-quote {
          font-family: var(--font-display);
          font-size: clamp(1.75rem, 3vw, 2.75rem);
          font-weight: 300; line-height: 1.25;
          color: var(--cream);
          letter-spacing: -0.01em;
          margin-bottom: 1rem;
        }
        .lg-panel-quote em { font-style: italic; color: var(--mint); }
        .lg-panel-sub {
          font-size: 0.875rem; font-weight: 300;
          color: rgba(247,243,236,0.5);
          line-height: 1.7;
          max-width: 340px;
        }

        .lg-panel-footer { position: relative; z-index: 1; }
        .lg-panel-dots {
          display: flex; gap: 0.5rem;
        }
        .lg-panel-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: rgba(184,212,176,0.3);
        }
        .lg-panel-dot:first-child { background: var(--mint); width: 18px; border-radius: 3px; }

        /* ─── RIGHT PANEL ─────────────────────────────── */
        .lg-form-panel {
          background: var(--cream);
          display: flex; align-items: center; justify-content: center;
          padding: 3rem 2rem;
        }
        .lg-card {
          width: 100%;
          max-width: 420px;
        }
        .lg-card-header {
          margin-bottom: 2.5rem;
        }
        .lg-badge {
          display: inline-flex; align-items: center; gap: 0.4rem;
          font-size: 0.62rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.16em;
          color: var(--sage);
          background: rgba(74,103,65,0.08);
          border: 1px solid rgba(74,103,65,0.15);
          padding: 0.3rem 0.75rem; border-radius: 7px;
          margin-bottom: 1.25rem;
        }
        .lg-badge-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: var(--fern);
        }
        .lg-title {
          font-family: var(--font-display);
          font-size: 2rem; font-weight: 400;
          color: var(--forest); line-height: 1.1;
          letter-spacing: -0.01em;
          margin-bottom: 0.4rem;
        }
        .lg-subtitle {
          font-size: 0.875rem; color: var(--text-muted);
          line-height: 1.6;
        }

        /* Form fields */
        .lg-field {
          display: flex; flex-direction: column; gap: 0.45rem;
          margin-bottom: 1.1rem;
        }
        .lg-label {
          font-size: 0.78rem; font-weight: 600;
          color: var(--text); letter-spacing: 0.01em;
        }
        .lg-input-wrap { position: relative; }
        .lg-input {
          width: 100%;
          padding: 0.72rem 1rem;
          background: var(--white);
          border: 1.5px solid var(--parchment);
          border-radius: 10px;
          font-size: 0.875rem; color: var(--text);
          font-family: var(--font-body);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-shadow: 0 1px 2px rgba(0,0,0,0.04);
        }
        .lg-input:focus {
          border-color: var(--fern);
          box-shadow: 0 0 0 3px rgba(127,168,107,0.15), 0 1px 2px rgba(0,0,0,0.04);
        }
        .lg-input::placeholder { color: var(--text-light); }

        .lg-error {
          display: flex; align-items: flex-start; gap: 0.5rem;
          font-size: 0.8rem; color: #991b1b;
          background: #fee2e2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 0.65rem 0.9rem;
          margin-bottom: 1.1rem;
          line-height: 1.5;
        }
        .lg-error-icon {
          width: 16px; height: 16px; flex-shrink: 0;
          margin-top: 0.1rem;
        }

        .lg-submit {
          width: 100%;
          background: var(--forest);
          color: var(--cream);
          font-size: 0.9rem; font-weight: 500;
          padding: 0.85rem;
          border-radius: 10px;
          border: none; cursor: pointer;
          font-family: var(--font-body);
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          margin-top: 0.5rem;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 2px 8px rgba(28,58,30,0.2);
        }
        .lg-submit:hover:not(:disabled) {
          background: var(--forest-light);
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(28,58,30,0.25);
        }
        .lg-submit:active:not(:disabled) { transform: translateY(0); }
        .lg-submit:disabled { opacity: 0.6; cursor: not-allowed; }

        @keyframes spin { to { transform: rotate(360deg); } }
        .lg-spinner {
          width: 16px; height: 16px;
          border-radius: 50%;
          border: 2px solid rgba(247,243,236,0.3);
          border-top-color: var(--cream);
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }

        .lg-footer-link {
          display: block; text-align: center;
          margin-top: 1.5rem;
          font-size: 0.78rem; color: var(--text-muted);
          text-decoration: none; transition: color 0.18s;
        }
        .lg-footer-link a { color: var(--sage); text-decoration: underline; }
        .lg-footer-link:hover { color: var(--text); }

        /* ─── RESPONSIVE ───────────────────────────────── */
        @media (max-width: 768px) {
          .lg-root { grid-template-columns: 1fr; }
          .lg-panel { display: none; }
          .lg-form-panel {
            min-height: 100vh;
            padding: 2rem 1.25rem;
            align-items: flex-start;
            padding-top: clamp(3.5rem, 15vh, 6rem);
          }
        }
      `}</style>

      <div className="lg-root">
        {/* LEFT: Brand panel */}
        <div className="lg-panel">
          <div className="lg-panel-grid" />
          <div className="lg-panel-content">
            <a href={`/${locale}`} className="lg-panel-logo">
              <img src="/icons/logo.svg" alt="Verde Garden" style={{ height: "36px", width: "auto", display: "block" }} />
            </a>
          </div>

          <div className="lg-panel-center">
            <p className="lg-panel-quote">
              Cultivate your <em>garden</em>,<br />
              grow your <em>vision</em>.
            </p>
            <p className="lg-panel-sub">
              Manage your plant inventory, track stock levels, and share your collection with the world.
            </p>
          </div>

          <div className="lg-panel-footer">
            <div className="lg-panel-dots">
              <div className="lg-panel-dot" />
              <div className="lg-panel-dot" />
              <div className="lg-panel-dot" />
            </div>
          </div>
        </div>

        {/* RIGHT: Form panel */}
        <div className="lg-form-panel">
          <div className="lg-card">
            <div className="lg-card-header">
              <div className="lg-badge">
                <span className="lg-badge-dot" />
                {t("login.adminAccess")}
              </div>
              <h1 className="lg-title">{t("login.title")}</h1>
              <p className="lg-subtitle">{t("login.subtitle")}</p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {error && (
                <div className="lg-error">
                  <svg className="lg-error-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  {error}
                </div>
              )}

              <div className="lg-field">
                <label className="lg-label" htmlFor="username">
                  {t("login.username")}
                </label>
                <div className="lg-input-wrap">
                  <input
                    id="username"
                    className="lg-input"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="lg-field">
                <label className="lg-label" htmlFor="password">
                  {t("login.password")}
                </label>
                <div className="lg-input-wrap">
                  <input
                    id="password"
                    className="lg-input"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="lg-submit" disabled={loading}>
                {loading && <span className="lg-spinner" />}
                {loading ? t("login.signingIn") : t("login.signin")}
              </button>
            </form>

            <p className="lg-footer-link">
              <a href={`/${locale}`}>← Back to storefront</a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
