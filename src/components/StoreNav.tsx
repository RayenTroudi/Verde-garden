"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useCart } from "@/context/CartContext";

interface StoreNavProps {
  showCart?: boolean;
  showBack?: boolean;
  backHref?: string;
  showPlantCount?: boolean;
  plantCount?: number;
  showMobileMenu?: boolean;
  loadingPlants?: boolean;
}

const CartIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);

const BackIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 12H5M12 5l-7 7 7 7"/>
  </svg>
);

export default function StoreNav({
  showCart = true,
  showBack = false,
  backHref,
  showPlantCount = false,
  plantCount = 0,
  showMobileMenu = false,
  loadingPlants = false,
}: StoreNavProps) {
  const { data: session } = useSession();
  const t = useTranslations();
  const locale = useLocale();
  const { itemCount } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!showMobileMenu) return;
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen, showMobileMenu]);

  const resolvedBackHref = backHref ?? `/${locale}`;

  return (
    <>
      <style>{`
        .sn-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          background: var(--forest);
          transition: box-shadow 0.3s ease, background 0.3s ease;
        }
        .sn-nav.scrolled {
          background: rgba(15,32,16,0.96);
          backdrop-filter: blur(14px);
          box-shadow: 0 1px 0 rgba(255,255,255,0.06), 0 4px 32px rgba(0,0,0,0.25);
        }
        .sn-inner {
          max-width: 1400px; margin: 0 auto;
          padding: 0 2rem; height: 68px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .sn-logo {
          display: flex; align-items: center; gap: 0.55rem;
          text-decoration: none; flex-shrink: 0;
        }
        .sn-logo:hover { opacity: 0.88; }
        .sn-right { display: flex; align-items: center; gap: 0.875rem; }
        .sn-count {
          font-size: 0.72rem; font-weight: 400;
          color: rgba(247,243,236,0.4);
          letter-spacing: 0.08em;
          background: rgba(255,255,255,0.05);
          padding: 0.3rem 0.8rem; border-radius: 100px;
          border: 1px solid rgba(255,255,255,0.07);
          white-space: nowrap;
        }
        .sn-cart {
          position: relative;
          display: flex; align-items: center; justify-content: center;
          width: 38px; height: 38px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 9px; color: var(--cream);
          transition: background 0.2s; text-decoration: none; flex-shrink: 0;
        }
        .sn-cart:hover { background: rgba(255,255,255,0.12); }
        .sn-cart-badge {
          position: absolute; top: -5px; right: -5px;
          min-width: 18px; height: 18px;
          background: #e07a4f; color: white;
          font-size: 0.62rem; font-weight: 700;
          border-radius: 100px; padding: 0 4px;
          display: flex; align-items: center; justify-content: center;
          border: 1.5px solid var(--forest);
        }
        .sn-admin {
          font-size: 0.72rem; font-weight: 500;
          color: rgba(247,243,236,0.85);
          text-transform: uppercase; letter-spacing: 0.1em;
          border: 1px solid rgba(247,243,236,0.18);
          padding: 0.4rem 1rem; border-radius: 100px;
          transition: all 0.2s ease; text-decoration: none; white-space: nowrap;
        }
        .sn-admin:hover { background: rgba(247,243,236,0.09); border-color: rgba(247,243,236,0.35); color: var(--cream); }
        .sn-back {
          display: inline-flex; align-items: center; gap: 0.4rem;
          font-size: 0.75rem; font-weight: 500;
          color: rgba(247,243,236,0.8);
          text-transform: uppercase; letter-spacing: 0.1em;
          border: 1px solid rgba(247,243,236,0.18);
          padding: 0.4rem 1rem; border-radius: 8px;
          transition: all 0.2s ease; text-decoration: none; white-space: nowrap;
        }
        .sn-back:hover { background: rgba(247,243,236,0.08); border-color: rgba(247,243,236,0.32); color: var(--cream); }
        .sn-hamburger {
          display: none;
          flex-direction: column; justify-content: center; gap: 4.5px;
          width: 38px; height: 38px; padding: 8px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px; cursor: pointer;
          transition: background 0.2s; flex-shrink: 0;
        }
        .sn-hamburger:hover { background: rgba(255,255,255,0.1); }
        .sn-hamburger span {
          display: block; width: 100%; height: 1.5px;
          background: var(--cream); border-radius: 2px;
          transition: transform 0.25s ease, opacity 0.25s ease;
        }
        .sn-hamburger.open span:nth-child(1) { transform: translateY(6px) rotate(45deg); }
        .sn-hamburger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
        .sn-hamburger.open span:nth-child(3) { transform: translateY(-6px) rotate(-45deg); }
        .sn-mobile {
          display: none; position: fixed;
          top: 68px; left: 0; right: 0;
          background: rgba(12,26,13,0.98);
          backdrop-filter: blur(18px);
          z-index: 99; padding: 1.25rem 1.5rem 1.75rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          flex-direction: column; gap: 0.65rem;
          animation: sn-slideDown 0.2s ease;
        }
        .sn-mobile.open { display: flex; }
        @keyframes sn-slideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .sn-mobile-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 0.25rem 0; }
        .sn-mobile-admin {
          display: inline-flex; align-items: center; gap: 0.4rem;
          font-size: 0.78rem; font-weight: 500;
          color: var(--mint); text-transform: uppercase; letter-spacing: 0.1em;
          border: 1px solid rgba(184,212,176,0.25);
          padding: 0.55rem 1.1rem; border-radius: 100px;
          align-self: flex-start; transition: all 0.18s; text-decoration: none;
        }
        .sn-mobile-admin:hover { background: rgba(184,212,176,0.08); }
        .sn-mobile-count {
          font-size: 0.75rem; color: rgba(247,243,236,0.38); padding: 0.5rem 0;
        }
        @media (max-width: 768px) {
          .sn-count { display: none; }
          .sn-admin { display: none; }
          .sn-inner { padding: 0 1.25rem; }
          ${showMobileMenu ? `.sn-hamburger { display: flex; }
          .sn-right > .lang-switcher { display: none; }` : ""}
        }
        @media (max-width: 480px) {
          .sn-inner { padding: 0 1rem; }
        }
      `}</style>

      <nav className={`sn-nav${scrolled ? " scrolled" : ""}`}>
        <div className="sn-inner">
          <Link href={`/${locale}`} className="sn-logo" onClick={() => setMobileMenuOpen(false)}>
            <img src="/icons/logo.svg" alt="Verde Garden" style={{ height: "52px", width: "auto", display: "block" }} />
          </Link>

          <div className="sn-right">
            {showPlantCount && (
              <span className="sn-count">
                {loadingPlants ? "—" : `${plantCount} ${t("navigation.plants")}`}
              </span>
            )}

            <LanguageSwitcher />

            {showCart && (
              <Link href={`/${locale}/cart`} className="sn-cart" aria-label={t("cart.viewCart")}>
                <CartIcon />
                {itemCount > 0 && <span className="sn-cart-badge">{itemCount}</span>}
              </Link>
            )}

            {showBack && (
              <Link href={resolvedBackHref} className="sn-back">
                <BackIcon />
                {t("common.back")}
              </Link>
            )}

            {session && (
              <Link href={`/${locale}/admin`} className="sn-admin">
                {t("navigation.admin")}
              </Link>
            )}

            {showMobileMenu && (
              <button
                className={`sn-hamburger${mobileMenuOpen ? " open" : ""}`}
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
                onClick={() => setMobileMenuOpen((v) => !v)}
              >
                <span /><span /><span />
              </button>
            )}
          </div>
        </div>

        {showMobileMenu && (
          <div className={`sn-mobile${mobileMenuOpen ? " open" : ""}`}>
            <LanguageSwitcher />
            <div className="sn-mobile-divider" />
            {showPlantCount && (
              <span className="sn-mobile-count">
                {loadingPlants ? "—" : `${plantCount} ${t("navigation.plants")}`}
              </span>
            )}
            {showCart && (
              <Link href={`/${locale}/cart`} className="sn-back" style={{ alignSelf: "flex-start" }} onClick={() => setMobileMenuOpen(false)}>
                <CartIcon />
                {t("cart.viewCart")}
                {itemCount > 0 && <span style={{ marginLeft: "0.3rem", background: "#e07a4f", color: "white", borderRadius: "100px", padding: "0 6px", fontSize: "0.62rem", fontWeight: 700 }}>{itemCount}</span>}
              </Link>
            )}
            {session && (
              <Link href={`/${locale}/admin`} className="sn-mobile-admin" onClick={() => setMobileMenuOpen(false)}>
                {t("navigation.admin")}
              </Link>
            )}
          </div>
        )}
      </nav>
    </>
  );
}
