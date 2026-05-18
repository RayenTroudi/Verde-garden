"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const switchLocale = (newLocale: string) => {
    if (newLocale === locale) return;

    // Replace current locale prefix in the pathname
    const segments = pathname.split("/");
    segments[1] = newLocale;
    const newPath = segments.join("/") || "/";

    // Persist preference
    if (typeof window !== "undefined") {
      localStorage.setItem("verde-locale", newLocale);
    }

    startTransition(() => {
      router.push(newPath);
    });
  };

  return (
    <>
      <style>{`
        .lang-switcher {
          display: flex;
          align-items: center;
          gap: 0.15rem;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 100px;
          padding: 0.2rem 0.25rem;
        }
        .lang-btn {
          font-size: 0.68rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          padding: 0.3rem 0.65rem;
          border-radius: 100px;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          text-transform: uppercase;
          line-height: 1;
          background: transparent;
          color: rgba(247,243,236,0.5);
        }
        .lang-btn:hover:not(.active):not(:disabled) {
          color: rgba(247,243,236,0.85);
          background: rgba(255,255,255,0.06);
        }
        .lang-btn.active {
          background: rgba(184,212,176,0.18);
          color: rgba(247,243,236,0.95);
        }
        .lang-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
      <div className="lang-switcher" aria-label="Language switcher">
        <button
          className={`lang-btn${locale === "fr" ? " active" : ""}`}
          onClick={() => switchLocale("fr")}
          disabled={isPending}
          aria-pressed={locale === "fr"}
        >
          FR
        </button>
        <button
          className={`lang-btn${locale === "en" ? " active" : ""}`}
          onClick={() => switchLocale("en")}
          disabled={isPending}
          aria-pressed={locale === "en"}
        >
          EN
        </button>
      </div>
    </>
  );
}
