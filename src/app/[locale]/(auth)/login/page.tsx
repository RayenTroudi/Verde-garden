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

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

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
        .login-root {
          min-height: 100vh;
          background: linear-gradient(160deg, var(--forest-dark) 0%, var(--forest) 40%, var(--cream) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          font-family: var(--font-body);
        }
        .login-card {
          background: var(--white);
          border-radius: var(--radius-lg);
          padding: 2.5rem 2rem;
          width: 100%;
          max-width: 400px;
          box-shadow: var(--shadow-xl);
          border: 1px solid var(--parchment);
        }
        @media (max-width: 480px) {
          .login-root { padding: 1rem; align-items: flex-start; padding-top: clamp(3rem, 15vh, 6rem); }
          .login-card { padding: 2rem 1.5rem; border-radius: var(--radius); }
        }
        .login-logo {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          margin-bottom: 0.5rem;
          justify-content: space-between;
        }
        .login-logo-brand {
          display: flex;
          align-items: center;
          gap: 0.65rem;
        }
        .login-logo-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: var(--forest);
          display: grid;
          place-items: center;
          color: var(--mint);
          flex-shrink: 0;
        }
        .login-logo-text {
          font-family: var(--font-display);
          font-size: 1.4rem;
          font-weight: 500;
          color: var(--forest);
        }
        .login-badge {
          display: inline-block;
          font-size: 0.6rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: var(--sage);
          background: rgba(74,103,65,0.08);
          border: 1px solid rgba(74,103,65,0.18);
          padding: 0.2rem 0.6rem;
          border-radius: 4px;
          margin-bottom: 1.75rem;
        }
        .login-title {
          font-family: var(--font-display);
          font-size: 1.75rem;
          font-weight: 500;
          color: var(--forest);
          margin-bottom: 0.35rem;
        }
        .login-sub {
          font-size: 0.825rem;
          color: var(--text-muted);
          margin-bottom: 1.75rem;
        }
        .login-field {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          margin-bottom: 1rem;
        }
        .login-label {
          font-size: 0.78rem;
          font-weight: 500;
          color: var(--text);
        }
        .login-input {
          padding: 0.7rem 0.9rem;
          border-radius: var(--radius-sm);
          border: 1.5px solid var(--parchment);
          font-size: 0.875rem;
          color: var(--text);
          background: var(--cream);
          outline: none;
          transition: border-color var(--transition), box-shadow var(--transition);
          width: 100%;
          font-family: var(--font-body);
        }
        .login-input:focus {
          border-color: var(--fern);
          box-shadow: 0 0 0 3px rgba(127,168,107,0.12);
          background: var(--white);
        }
        .login-error {
          font-size: 0.8rem;
          color: var(--terra);
          background: rgba(196,113,75,0.08);
          border: 1px solid rgba(196,113,75,0.2);
          border-radius: var(--radius-sm);
          padding: 0.6rem 0.9rem;
          margin-bottom: 1rem;
        }
        .login-submit {
          width: 100%;
          background: var(--forest);
          color: var(--cream);
          font-size: 0.875rem;
          font-weight: 500;
          padding: 0.8rem;
          border-radius: 100px;
          border: none;
          cursor: pointer;
          transition: background var(--transition), opacity var(--transition);
          font-family: var(--font-body);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }
        .login-submit:hover:not(:disabled) { background: var(--forest-light); }
        .login-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .login-spinner {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid rgba(247,243,236,0.3);
          border-top-color: var(--cream);
          animation: spin 0.7s linear infinite;
        }
      `}</style>

      <div className="login-root">
        <div className="login-card">
<div className="login-logo">
            <div className="login-logo-brand">
              <div className="login-logo-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="login-logo-text">Verde Garden</span>
            </div>
          </div>
          <span className="login-badge">{t("login.adminAccess")}</span>

          <h1 className="login-title">{t("login.title")}</h1>
          <p className="login-sub">{t("login.subtitle")}</p>

          <form onSubmit={handleSubmit} noValidate>
            {error && <div className="login-error">{error}</div>}

            <div className="login-field">
              <label className="login-label" htmlFor="username">
                {t("login.username")}
              </label>
              <input
                id="username"
                className="login-input"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="login-field">
              <label className="login-label" htmlFor="password">
                {t("login.password")}
              </label>
              <input
                id="password"
                className="login-input"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="login-submit" disabled={loading}>
              {loading && <span className="login-spinner" />}
              {loading ? t("login.signingIn") : t("login.signin")}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
