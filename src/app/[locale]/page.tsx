"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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

const LeafSVG = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SearchSVG = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" />
    <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);



const LeafDecoration = () => (
  <div className="vg-hero-leaves" aria-hidden="true">
    <svg className="vg-leaf vg-leaf--a" viewBox="0 0 300 500" fill="none">
      <path d="M150 480 C150 480 30 380 20 220 C10 60 130 10 150 10 C170 10 290 60 280 220 C270 380 150 480 150 480Z" stroke="rgba(184,212,176,0.22)" strokeWidth="1.5" fill="rgba(184,212,176,0.06)" />
      <path d="M150 480 L150 10" stroke="rgba(184,212,176,0.14)" strokeWidth="1" />
      <path d="M150 250 C150 250 90 210 70 140" stroke="rgba(184,212,176,0.12)" strokeWidth="1" />
      <path d="M150 270 C150 270 210 230 230 160" stroke="rgba(184,212,176,0.12)" strokeWidth="1" />
      <path d="M150 330 C150 330 100 305 80 255" stroke="rgba(184,212,176,0.09)" strokeWidth="1" />
      <path d="M150 350 C150 350 200 325 220 275" stroke="rgba(184,212,176,0.09)" strokeWidth="1" />
    </svg>

    <svg className="vg-leaf vg-leaf--b" viewBox="0 0 220 360" fill="none">
      <path d="M110 350 C110 350 20 280 10 160 C0 40 90 8 110 8 C130 8 220 40 210 160 C200 280 110 350 110 350Z" stroke="rgba(127,168,107,0.18)" strokeWidth="1.5" fill="rgba(127,168,107,0.05)" />
      <path d="M110 350 L110 8" stroke="rgba(127,168,107,0.12)" strokeWidth="1" />
      <path d="M110 180 C110 180 65 150 50 95" stroke="rgba(127,168,107,0.1)" strokeWidth="0.8" />
      <path d="M110 200 C110 200 155 170 170 115" stroke="rgba(127,168,107,0.1)" strokeWidth="0.8" />
      <path d="M110 260 C110 260 75 240 60 195" stroke="rgba(127,168,107,0.08)" strokeWidth="0.8" />
      <path d="M110 278 C110 278 145 258 160 213" stroke="rgba(127,168,107,0.08)" strokeWidth="0.8" />
    </svg>

    <svg className="vg-leaf vg-leaf--c" viewBox="0 0 160 260" fill="none">
      <path d="M80 252 C80 252 12 196 8 112 C4 28 60 6 80 6 C100 6 156 28 152 112 C148 196 80 252 80 252Z" stroke="rgba(184,212,176,0.28)" strokeWidth="1.2" fill="rgba(184,212,176,0.08)" />
      <path d="M80 252 L80 6" stroke="rgba(184,212,176,0.16)" strokeWidth="0.8" />
      <path d="M80 130 C80 130 50 112 40 74" stroke="rgba(184,212,176,0.12)" strokeWidth="0.7" />
      <path d="M80 145 C80 145 110 127 120 89" stroke="rgba(184,212,176,0.12)" strokeWidth="0.7" />
    </svg>

    <svg className="vg-leaf vg-leaf--d" viewBox="0 0 120 200" fill="none">
      <path d="M60 194 C60 194 10 152 6 86 C2 20 46 4 60 4 C74 4 118 20 114 86 C110 152 60 194 60 194Z" stroke="rgba(74,103,65,0.3)" strokeWidth="1" fill="rgba(74,103,65,0.07)" />
      <path d="M60 194 L60 4" stroke="rgba(74,103,65,0.18)" strokeWidth="0.7" />
      <path d="M60 100 C60 100 38 86 30 56" stroke="rgba(74,103,65,0.14)" strokeWidth="0.6" />
      <path d="M60 114 C60 114 82 100 90 70" stroke="rgba(74,103,65,0.14)" strokeWidth="0.6" />
    </svg>

    <svg className="vg-leaf vg-leaf--e" viewBox="0 0 140 460" fill="none">
      <path d="M70 450 C70 450 14 350 10 200 C6 50 48 8 70 8 C92 8 134 50 130 200 C126 350 70 450 70 450Z" stroke="rgba(184,212,176,0.13)" strokeWidth="1.2" fill="rgba(184,212,176,0.03)" />
      <path d="M70 450 L70 8" stroke="rgba(184,212,176,0.1)" strokeWidth="0.8" />
      <path d="M70 220 C70 220 42 200 32 155" stroke="rgba(184,212,176,0.08)" strokeWidth="0.7" />
      <path d="M70 245 C70 245 98 225 108 180" stroke="rgba(184,212,176,0.08)" strokeWidth="0.7" />
    </svg>

    <svg className="vg-leaf vg-leaf--f" viewBox="0 0 260 200" fill="none">
      <path d="M10 100 C10 100 60 10 130 10 C200 10 250 60 250 100 C250 140 200 190 130 190 C60 190 10 100 10 100Z" stroke="rgba(127,168,107,0.2)" strokeWidth="1.2" fill="rgba(127,168,107,0.05)" />
      <path d="M10 100 L250 100" stroke="rgba(127,168,107,0.1)" strokeWidth="0.8" />
      <path d="M130 10 L130 190" stroke="rgba(127,168,107,0.08)" strokeWidth="0.7" />
      <path d="M130 100 C130 100 80 70 60 40" stroke="rgba(127,168,107,0.09)" strokeWidth="0.7" />
      <path d="M130 100 C130 100 180 70 200 40" stroke="rgba(127,168,107,0.09)" strokeWidth="0.7" />
    </svg>

    <svg className="vg-leaf vg-leaf--g" viewBox="0 0 100 380" fill="none">
      <path d="M50 370 C50 370 4 270 4 150 C4 30 34 6 50 6 C66 6 96 30 96 150 C96 270 50 370 50 370Z" stroke="rgba(74,103,65,0.22)" strokeWidth="1" fill="rgba(74,103,65,0.06)" />
      <path d="M50 370 L50 6" stroke="rgba(74,103,65,0.12)" strokeWidth="0.7" />
      <path d="M50 190 C50 190 28 168 20 128" stroke="rgba(74,103,65,0.1)" strokeWidth="0.6" />
      <path d="M50 210 C50 210 72 188 80 148" stroke="rgba(74,103,65,0.1)" strokeWidth="0.6" />
    </svg>

    <svg className="vg-leaf vg-leaf--h" viewBox="0 0 180 180" fill="none">
      <path d="M90 170 C90 170 14 140 10 90 C6 40 50 10 90 10 C130 10 174 40 170 90 C166 140 90 170 90 170Z" stroke="rgba(184,212,176,0.25)" strokeWidth="1" fill="rgba(184,212,176,0.07)" />
      <path d="M90 170 L90 10" stroke="rgba(184,212,176,0.12)" strokeWidth="0.7" />
      <path d="M90 90 C90 90 55 72 44 42" stroke="rgba(184,212,176,0.1)" strokeWidth="0.6" />
      <path d="M90 90 C90 90 125 72 136 42" stroke="rgba(184,212,176,0.1)" strokeWidth="0.6" />
    </svg>

    <svg className="vg-leaf vg-leaf--i" viewBox="0 0 80 300" fill="none">
      <path d="M40 292 C40 292 4 220 4 130 C4 40 26 6 40 6 C54 6 76 40 76 130 C76 220 40 292 40 292Z" stroke="rgba(184,212,176,0.18)" strokeWidth="1" fill="rgba(184,212,176,0.05)" />
      <path d="M40 292 L40 6" stroke="rgba(184,212,176,0.1)" strokeWidth="0.6" />
      <path d="M40 150 C40 150 22 132 16 96" stroke="rgba(184,212,176,0.09)" strokeWidth="0.5" />
      <path d="M40 168 C40 168 58 150 64 114" stroke="rgba(184,212,176,0.09)" strokeWidth="0.5" />
    </svg>

    <svg className="vg-leaf vg-leaf--j" viewBox="0 0 340 240" fill="none">
      <path d="M170 228 C170 228 20 180 8 120 C-4 60 60 12 170 12 C280 12 344 60 332 120 C320 180 170 228 170 228Z" stroke="rgba(127,168,107,0.15)" strokeWidth="1.5" fill="rgba(127,168,107,0.04)" />
      <path d="M170 228 L170 12" stroke="rgba(127,168,107,0.09)" strokeWidth="0.8" />
      <path d="M170 120 C170 120 100 94 70 55" stroke="rgba(127,168,107,0.08)" strokeWidth="0.7" />
      <path d="M170 120 C170 120 240 94 270 55" stroke="rgba(127,168,107,0.08)" strokeWidth="0.7" />
      <path d="M170 160 C170 160 115 142 90 110" stroke="rgba(127,168,107,0.06)" strokeWidth="0.6" />
      <path d="M170 160 C170 160 225 142 250 110" stroke="rgba(127,168,107,0.06)" strokeWidth="0.6" />
    </svg>
  </div>
);

const difficultyConfig: Record<string, { color: string; bg: string; label: string }> = {
  Easy:   { color: "#166534", bg: "#dcfce7", label: "Easy" },
  Medium: { color: "#92400e", bg: "#fef3c7", label: "Medium" },
  Hard:   { color: "#991b1b", bg: "#fee2e2", label: "Hard" },
};

export default function HomePage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();
  const { addItem } = useCart();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const handleAddToCart = useCallback((e: React.MouseEvent, plant: Plant) => {
    e.preventDefault();
    e.stopPropagation();
    if (plant.stock <= 0) return;
    addItem({
      plantId: plant._id,
      name: plant.name,
      imageUrl: plant.imageUrl,
      price: plant.price,
      quantity: 1,
      stock: plant.stock,
    });
    setAddedIds((prev) => new Set(prev).add(plant._id));
    setTimeout(() => {
      setAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(plant._id);
        return next;
      });
    }, 1500);
  }, [addItem]);

  const handleBuyNow = useCallback((e: React.MouseEvent, plant: Plant) => {
    e.preventDefault();
    e.stopPropagation();
    if (plant.stock <= 0) return;
    const item = {
      plantId: plant._id,
      name: plant.name,
      imageUrl: plant.imageUrl,
      price: plant.price,
      quantity: 1,
      stock: plant.stock,
    };
    try {
      sessionStorage.setItem("vg_buynow", JSON.stringify(item));
    } catch { /* ignore */ }
    router.push(`/${locale}/checkout?buynow=1`);
  }, [locale, router]);

  useEffect(() => {
    fetch("/api/plants")
      .then((res) => { if (!res.ok) throw new Error("Failed"); return res.json(); })
      .then((data) => { setPlants(data); setLoading(false); })
      .catch(() => { setError(t("errors.loadFailed")); setLoading(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = useMemo(() => Array.from(new Set(plants.map((p) => p.category).filter(Boolean))).sort(), [plants]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return plants.filter((p) => {
      const matchSearch = !q ||
        (p.name?.fr ?? "").toLowerCase().includes(q) ||
        (p.name?.en ?? "").toLowerCase().includes(q) ||
        (p.description?.fr ?? "").toLowerCase().includes(q) ||
        (p.description?.en ?? "").toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q);
      return matchSearch && (!activeCategory || p.category === activeCategory);
    });
  }, [plants, search, activeCategory]);

  const stockLabel = (plant: Plant) => {
    if (plant.stock <= 0) return { text: t("plant.unavailable"), variant: "out" };
    if (plant.stock <= 5) return { text: t("plant.lowStock", { count: plant.stock }), variant: "low" };
    return { text: t("plant.inStock", { count: plant.stock }), variant: "ok" };
  };

  return (
    <>
      <style>{`
        /* ─── HERO ────────────────────────────────────────────────────────── */
        .vg-hero {
          background: var(--forest);
          padding: 9rem 2rem 6rem;
          position: relative; overflow: hidden;
        }
        /* Mesh gradient overlay */
        .vg-hero::before {
          content: '';
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 20% 10%, rgba(127,168,107,0.18) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 80% 80%, rgba(74,103,65,0.22) 0%, transparent 55%),
            radial-gradient(ellipse 40% 70% at 50% 40%, rgba(28,58,30,0.5) 0%, transparent 70%);
          pointer-events: none;
        }
        .vg-hero-grid { display: none; }
        /* Wave bottom */
        .vg-hero::after {
          content: '';
          position: absolute; bottom: -1px; left: 0; right: 0; height: 72px;
          background: var(--cream);
          clip-path: ellipse(55% 100% at 50% 100%);
          z-index: 2;
        }
        .vg-hero-content {
          max-width: 720px; margin: 0 auto;
          position: relative; z-index: 1;
          text-align: center;
        }
        .vg-hero-eyebrow {
          display: inline-flex; align-items: center; gap: 0.5rem;
          font-size: 0.68rem; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.2em;
          color: var(--mint);
          background: rgba(184,212,176,0.1);
          border: 1px solid rgba(184,212,176,0.22);
          padding: 0.38rem 1rem; border-radius: 100px;
          margin-bottom: 1.75rem;
        }
        .vg-hero-eyebrow-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: #4ade80; flex-shrink: 0;
          box-shadow: 0 0 6px rgba(74,222,128,0.6);
          animation: pulse-dot 2s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.6; transform: scale(0.8); }
        }
        .vg-hero-title {
          font-family: var(--font-display);
          font-size: clamp(3rem, 7.5vw, 6.5rem);
          font-weight: 300; line-height: 1.0;
          color: var(--cream);
          margin-bottom: 1.5rem;
          letter-spacing: -0.01em;
        }
        .vg-hero-title em {
          font-style: italic; color: var(--mint);
          font-weight: 300;
        }
        .vg-hero-subtitle {
          font-size: 1.05rem; font-weight: 300;
          color: rgba(247,243,236,0.6);
          max-width: 440px; margin: 0 auto;
          line-height: 1.8;
        }
        /* Leaf animations */
        @keyframes leafSway {
          0%   { transform: rotate(-4deg) translateY(0px); }
          33%  { transform: rotate(2deg) translateY(-8px); }
          66%  { transform: rotate(-1deg) translateY(4px); }
          100% { transform: rotate(-4deg) translateY(0px); }
        }
        @keyframes leafDrift {
          0%   { transform: rotate(8deg) translateY(0px) translateX(0px); }
          40%  { transform: rotate(3deg) translateY(-12px) translateX(4px); }
          70%  { transform: rotate(10deg) translateY(-5px) translateX(-2px); }
          100% { transform: rotate(8deg) translateY(0px) translateX(0px); }
        }
        @keyframes leafFloat {
          0%   { transform: rotate(-12deg) translateY(0px) scale(1); }
          50%  { transform: rotate(-6deg) translateY(-10px) scale(1.02); }
          100% { transform: rotate(-12deg) translateY(0px) scale(1); }
        }
        @keyframes leafBob {
          0%   { transform: rotate(15deg) translateY(0px); }
          45%  { transform: rotate(9deg) translateY(-14px); }
          100% { transform: rotate(15deg) translateY(0px); }
        }
        @keyframes leafSerpentine {
          0%   { transform: rotate(-20deg) translateY(0px) translateX(0px); }
          25%  { transform: rotate(-14deg) translateY(-9px) translateX(3px); }
          50%  { transform: rotate(-18deg) translateY(-18px) translateX(-1px); }
          75%  { transform: rotate(-24deg) translateY(-9px) translateX(2px); }
          100% { transform: rotate(-20deg) translateY(0px) translateX(0px); }
        }
        .vg-hero-leaves {
          position: absolute; inset: 0;
          pointer-events: none; z-index: 1;
        }
        .vg-leaf {
          position: absolute; transform-origin: bottom center; will-change: transform;
        }
        .vg-leaf--a {
          left: -4%; top: -8%; width: min(300px, 28vw);
          transform-origin: top right;
          animation: leafSway 9s ease-in-out infinite;
        }
        .vg-leaf--b {
          right: 2%; top: 50%; transform: translateY(-50%);
          width: min(210px, 20vw); transform-origin: bottom center;
          animation: leafDrift 11s ease-in-out infinite; animation-delay: -3.2s;
        }
        .vg-leaf--c {
          left: 3%; bottom: 14%; width: min(150px, 14vw);
          transform-origin: bottom right;
          animation: leafFloat 7.5s ease-in-out infinite; animation-delay: -1.8s;
        }
        .vg-leaf--d {
          right: 6%; top: 2%; width: min(110px, 10vw);
          transform-origin: top left;
          animation: leafBob 13s ease-in-out infinite; animation-delay: -5.5s;
        }
        .vg-leaf--e {
          right: 18%; bottom: -10%; width: min(120px, 11vw);
          transform-origin: bottom center;
          animation: leafSerpentine 15s ease-in-out infinite; animation-delay: -7s;
        }
        .vg-leaf--f {
          left: 8%; top: 40%; width: min(200px, 18vw);
          transform-origin: left center;
          animation: leafFloat 10s ease-in-out infinite; animation-delay: -2.4s;
        }
        .vg-leaf--g {
          left: 38%; bottom: -5%; width: min(90px, 8vw);
          transform-origin: bottom center;
          animation: leafBob 8s ease-in-out infinite; animation-delay: -4.1s;
        }
        .vg-leaf--h {
          right: 32%; top: 5%; width: min(130px, 12vw);
          transform-origin: top center;
          animation: leafSway 12s ease-in-out infinite; animation-delay: -6.3s;
        }
        .vg-leaf--i {
          left: 22%; top: 18%; width: min(70px, 6vw);
          transform-origin: top center;
          animation: leafDrift 17s ease-in-out infinite; animation-delay: -9s;
        }
        .vg-leaf--j {
          left: 50%; bottom: 8%; width: min(260px, 22vw);
          transform: translateX(-50%); transform-origin: bottom center;
          animation: leafSerpentine 14s ease-in-out infinite; animation-delay: -11s;
        }
        /* Responsive leaf sizing */
        @media (max-width: 1024px) {
          .vg-leaf--a { width: 200px; } .vg-leaf--b { width: 160px; }
          .vg-leaf--c { width: 110px; } .vg-leaf--d { width: 85px; }
          .vg-leaf--e { width: 90px; }  .vg-leaf--f { width: 150px; }
          .vg-leaf--g { width: 70px; }  .vg-leaf--h { width: 100px; }
          .vg-leaf--i { width: 55px; }  .vg-leaf--j { width: 180px; }
        }

        /* Floating orbs */
        .vg-hero-orb {
          position: absolute; border-radius: 50%; pointer-events: none;
          filter: blur(60px);
        }
        .vg-hero-orb-1 {
          width: 400px; height: 400px;
          background: rgba(127,168,107,0.12);
          top: -120px; right: -80px;
          animation: orbFloat 12s ease-in-out infinite;
        }
        .vg-hero-orb-2 {
          width: 280px; height: 280px;
          background: rgba(184,212,176,0.08);
          bottom: 60px; left: -60px;
          animation: orbFloat 15s ease-in-out infinite reverse;
        }
        @keyframes orbFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(20px, -30px) scale(1.05); }
          66%       { transform: translate(-15px, 20px) scale(0.97); }
        }


        /* ─── FILTERS ─────────────────────────────────────────────────────── */
        .vg-filters {
          background: var(--cream);
          padding: 1.25rem 2rem;
          position: sticky; top: 68px; z-index: 90;
          border-bottom: 1px solid var(--parchment);
          box-shadow: 0 2px 12px rgba(28,58,30,0.04);
        }
        .vg-filters-inner {
          max-width: 1400px; margin: 0 auto;
          display: flex; gap: 1rem; align-items: center;
          flex-wrap: wrap;
        }
        .vg-search-wrap {
          position: relative; flex: 1;
          min-width: 200px; max-width: 320px;
        }
        .vg-search-icon {
          position: absolute; left: 0.9rem; top: 50%;
          transform: translateY(-50%);
          color: var(--text-light); pointer-events: none;
        }
        .vg-search {
          width: 100%;
          padding: 0.65rem 1rem 0.65rem 2.6rem;
          background: var(--white);
          border: 1.5px solid var(--parchment);
          border-radius: 10px;
          font-size: 0.85rem; color: var(--text);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-shadow: 0 1px 2px rgba(0,0,0,0.04);
        }
        .vg-search:focus {
          border-color: var(--fern);
          box-shadow: 0 0 0 3px rgba(127,168,107,0.14), 0 1px 2px rgba(0,0,0,0.04);
        }
        .vg-search::placeholder { color: var(--text-light); }
        .vg-pills-wrap { display: flex; flex: 1; }
        .vg-pills {
          display: flex; gap: 0.4rem; align-items: center;
          overflow-x: auto; overflow-y: hidden;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none; -ms-overflow-style: none;
          padding-bottom: 2px;
        }
        .vg-pills::-webkit-scrollbar { display: none; }
        .vg-pill {
          font-size: 0.78rem; font-weight: 500;
          padding: 0.42rem 0.95rem; border-radius: 8px;
          border: 1.5px solid var(--parchment);
          color: var(--text-muted); background: var(--white);
          transition: all 0.18s ease; white-space: nowrap;
          flex-shrink: 0; cursor: pointer;
          box-shadow: 0 1px 2px rgba(0,0,0,0.04);
        }
        .vg-pill:hover {
          border-color: rgba(127,168,107,0.5);
          color: var(--sage);
          background: rgba(127,168,107,0.05);
        }
        .vg-pill.active {
          background: var(--forest);
          border-color: var(--forest);
          color: var(--cream);
          box-shadow: 0 2px 8px rgba(28,58,30,0.2);
        }

        /* ─── MAIN ────────────────────────────────────────────────────────── */
        .vg-main { padding: 2rem 2rem 5rem; min-height: 50vh; }
        .vg-main-inner { max-width: 1400px; margin: 0 auto; }
        .vg-results-bar {
          display: flex; align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }
        .vg-results-count {
          font-size: 0.78rem; color: var(--text-muted);
          letter-spacing: 0.03em;
        }
        .vg-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
          gap: 1.25rem;
        }

        /* ─── CARD ────────────────────────────────────────────────────────── */
        .vg-card {
          background: var(--white);
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(0,0,0,0.06);
          box-shadow: 0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(28,58,30,0.06);
          transition:
            transform 0.3s cubic-bezier(0.34,1.56,0.64,1),
            box-shadow 0.3s ease,
            border-color 0.3s ease;
          display: flex; flex-direction: column;
          cursor: pointer;
        }
        .vg-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.06), 0 12px 40px rgba(28,58,30,0.14);
          border-color: rgba(127,168,107,0.2);
        }
        .vg-card-img-wrap {
          position: relative; aspect-ratio: 4/3; overflow: hidden;
          background: var(--white);
        }
        .vg-card-img-wrap img {
          transition: transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94);
          padding: 6px;
        }
        .vg-card:hover .vg-card-img-wrap img { transform: scale(1.04); }
        .vg-card-placeholder {
          width: 100%; height: 100%;
          display: grid; place-items: center;
          color: var(--sand);
          background: linear-gradient(145deg, #f0ebe0 0%, #e8e0ce 100%);
        }
        .vg-card-placeholder svg { width: 40px; height: 40px; }
        .vg-badge-wrap {
          position: absolute; top: 0.65rem; right: 0.65rem;
          display: flex; flex-direction: column; gap: 0.3rem; align-items: flex-end;
        }
        .vg-diff-badge {
          font-size: 0.62rem; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.08em;
          padding: 0.28rem 0.65rem; border-radius: 6px;
        }
        .vg-oos-overlay {
          position: absolute; inset: 0;
          background: rgba(15,20,15,0.52);
          display: grid; place-items: center;
          backdrop-filter: blur(1px);
        }
        .vg-oos-label {
          font-size: 0.68rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.12em;
          color: white;
          background: rgba(0,0,0,0.45);
          border: 1px solid rgba(255,255,255,0.25);
          padding: 0.38rem 0.85rem; border-radius: 6px;
          backdrop-filter: blur(4px);
        }
        .vg-card-body {
          padding: 1rem 1.15rem 1.25rem;
          flex: 1; display: flex; flex-direction: column;
        }
        .vg-card-cat {
          font-size: 0.62rem; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.14em;
          color: var(--sage); margin-bottom: 0.25rem;
        }
        .vg-card-name {
          font-family: var(--font-display);
          font-size: 1.3rem; font-weight: 500; line-height: 1.2;
          color: var(--forest); margin-bottom: 0.4rem;
        }
        .vg-card-desc {
          font-size: 0.8rem; color: var(--text-muted); line-height: 1.65;
          display: -webkit-box; -webkit-line-clamp: 2;
          -webkit-box-orient: vertical; overflow: hidden;
          flex: 1; margin-bottom: 0.85rem;
        }
        .vg-card-care {
          display: flex; gap: 0.45rem; margin-bottom: 0.85rem; flex-wrap: wrap;
        }
        .vg-care-tag {
          display: inline-flex; align-items: center; gap: 0.3rem;
          font-size: 0.65rem; color: var(--text-muted);
          background: var(--parchment); border-radius: 6px;
          padding: 0.2rem 0.52rem; white-space: nowrap;
          border: 1px solid rgba(0,0,0,0.05);
        }
        .vg-card-footer {
          display: flex; align-items: center; justify-content: space-between;
          padding-top: 0.8rem;
          border-top: 1px solid rgba(0,0,0,0.06);
          margin-top: auto;
        }
        .vg-card-price {
          font-family: var(--font-display);
          font-size: 1.45rem; font-weight: 600; color: var(--forest);
        }
        .vg-card-price span {
          font-size: 0.85rem; font-weight: 400;
          color: var(--text-muted); margin-left: 0.12rem;
        }
        .vg-stock-badge {
          font-size: 0.65rem; font-weight: 500;
          padding: 0.22rem 0.55rem; border-radius: 6px;
        }
        .vg-stock-badge.ok   { color: #166534; background: #dcfce7; }
        .vg-stock-badge.low  { color: #92400e; background: #fef3c7; }
        .vg-stock-badge.out  { color: #991b1b; background: #fee2e2; }
        .vg-card-actions {
          display: flex; gap: 0.5rem; margin-top: 0.75rem;
        }
        .vg-add-to-cart {
          flex: 1;
          display: flex; align-items: center; justify-content: center; gap: 0.4rem;
          padding: 0.55rem 0.75rem;
          background: var(--forest); color: var(--cream);
          border: none; border-radius: 9px;
          font-size: 0.78rem; font-weight: 600;
          cursor: pointer;
          transition: background 0.18s, transform 0.15s;
          white-space: nowrap;
        }
        .vg-add-to-cart:hover:not(:disabled) { background: var(--forest-light); transform: translateY(-1px); }
        .vg-add-to-cart:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }
        .vg-add-to-cart.added { background: #16a34a; }
        .vg-buy-now {
          display: flex; align-items: center; justify-content: center;
          padding: 0.55rem 0.75rem;
          background: none; color: var(--forest);
          border: 1.5px solid var(--forest); border-radius: 9px;
          font-size: 0.78rem; font-weight: 600;
          cursor: pointer;
          transition: background 0.18s, transform 0.15s;
          white-space: nowrap;
        }
        .vg-buy-now:hover:not(:disabled) { background: rgba(28,58,30,0.07); transform: translateY(-1px); }
        .vg-buy-now:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }
        @media (max-width: 480px) {
          .vg-add-to-cart { font-size: 0.73rem; padding: 0.5rem 0.6rem; }
          .vg-buy-now { font-size: 0.73rem; padding: 0.5rem 0.6rem; }
        }

        /* ─── SKELETON ────────────────────────────────────────────────────── */
        @keyframes shimmer {
          0%   { background-position: -600px 0; }
          100% { background-position: 600px 0; }
        }
        .vg-skeleton {
          border-radius: 16px; height: 360px;
          background: linear-gradient(90deg, #f0ece2 25%, #e8e3d5 50%, #f0ece2 75%);
          background-size: 1200px 100%;
          animation: shimmer 1.6s infinite linear;
          border: 1px solid rgba(0,0,0,0.04);
        }

        /* ─── EMPTY / ERROR ───────────────────────────────────────────────── */
        .vg-empty, .vg-error {
          text-align: center; padding: 5rem 2rem;
          color: var(--text-muted);
        }
        .vg-empty-icon {
          width: 64px; height: 64px; margin: 0 auto 1.5rem;
          background: var(--parchment); border-radius: 16px;
          display: grid; place-items: center;
          color: var(--sand);
          border: 1px solid rgba(0,0,0,0.05);
        }
        .vg-empty-icon svg { width: 28px; height: 28px; }
        .vg-empty h3 {
          font-family: var(--font-display);
          font-size: 1.6rem; font-weight: 400;
          color: var(--forest); margin-bottom: 0.5rem;
        }
        .vg-empty p {
          font-size: 0.875rem; max-width: 300px;
          margin: 0 auto 1.75rem; line-height: 1.7;
        }
        .vg-empty-cta {
          display: inline-flex; align-items: center; gap: 0.4rem;
          background: var(--forest); color: var(--cream);
          font-size: 0.8rem; font-weight: 500;
          text-transform: uppercase; letter-spacing: 0.1em;
          padding: 0.7rem 1.6rem; border-radius: 10px;
          transition: background 0.2s, transform 0.2s;
          box-shadow: 0 2px 8px rgba(28,58,30,0.2);
        }
        .vg-empty-cta:hover { background: var(--forest-light); transform: translateY(-1px); }

        /* ─── FOOTER ──────────────────────────────────────────────────────── */
        .vg-footer {
          background: var(--forest-dark);
          padding: 2rem;
        }
        .vg-footer-inner {
          max-width: 1400px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 1rem;
        }
        .vg-footer-brand {
          display: flex; align-items: center; gap: 0.5rem;
          font-family: var(--font-display);
          font-size: 1.05rem; color: rgba(247,243,236,0.6);
        }
        .vg-footer-links { display: flex; gap: 1.5rem; }
        .vg-footer-link {
          font-size: 0.72rem; text-transform: uppercase;
          letter-spacing: 0.1em; color: rgba(247,243,236,0.3);
          transition: color 0.2s;
        }
        .vg-footer-link:hover { color: rgba(247,243,236,0.7); }
        .vg-footer-copy {
          font-size: 0.68rem; color: rgba(247,243,236,0.2);
        }

        /* ─── RESPONSIVE ──────────────────────────────────────────────────── */
        @media (max-width: 1024px) {
          .vg-grid { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
        }
        @media (max-width: 768px) {
          .vg-hero { padding: 7rem 1.25rem 5rem; }
          .vg-hero-subtitle { font-size: 0.9rem; }
          .vg-hero-orb-1 { width: 250px; height: 250px; }
          .vg-hero-orb-2 { display: none; }
          .vg-leaf--f { display: none; } .vg-leaf--g { display: none; }
          .vg-leaf--i { display: none; } .vg-leaf--j { display: none; }
          .vg-leaf--a { width: 130px; left: -6%; top: -4%; }
          .vg-leaf--b { width: 110px; right: 0%; }
          .vg-leaf--c { width: 80px; left: 2%; bottom: 18%; }
          .vg-leaf--d { width: 65px; right: 4%; top: 4%; }
          .vg-leaf--e { width: 70px; right: 20%; bottom: -6%; }
          .vg-leaf--h { width: 80px; right: 28%; top: 6%; }
          .vg-filters { padding: 1rem 1.25rem; top: 68px; }
          .vg-filters-inner { flex-direction: column; align-items: stretch; gap: 0.75rem; }
          .vg-search-wrap { max-width: 100%; }
          .vg-main { padding: 1.5rem 1.25rem 3rem; }
          .vg-grid { grid-template-columns: repeat(2, 1fr); gap: 0.875rem; }
          .vg-card-name { font-size: 1.15rem; }
          .vg-card-price { font-size: 1.25rem; }
          .vg-card-body { padding: 0.9rem 1rem 1.1rem; }
          .vg-skeleton { height: 280px; }
        }
        @media (max-width: 480px) {
          .vg-grid { grid-template-columns: 1fr; gap: 0.875rem; }
          .vg-footer-inner { flex-direction: column; align-items: flex-start; }
          .vg-leaf--c { display: none; } .vg-leaf--e { display: none; }
          .vg-leaf--h { display: none; }
          .vg-leaf--a { width: 100px; } .vg-leaf--b { width: 85px; }
          .vg-leaf--d { width: 55px; }
        }
      `}</style>

      <div>
        <StoreNav
          showCart
          showPlantCount
          plantCount={plants.length}
          loadingPlants={loading}
          showMobileMenu
        />

        {/* HERO */}
        <header className="vg-hero">
          <div className="vg-hero-grid" />
          <LeafDecoration />
          <div className="vg-hero-orb vg-hero-orb-1" />
          <div className="vg-hero-orb vg-hero-orb-2" />
          <div className="vg-hero-content">
            <div className="vg-hero-eyebrow">
              <span className="vg-hero-eyebrow-dot" />
              {t("home.tagline")}
            </div>
            <h1 className="vg-hero-title">
              {t("home.title")} <em>{t("home.titleEm")}</em><br />{t("home.titleEnd")}
            </h1>
            <p className="vg-hero-subtitle">{t("home.subtitle")}</p>
          </div>
        </header>


        {/* FILTERS */}
        <section className="vg-filters">
          <div className="vg-filters-inner">
            <div className="vg-search-wrap">
              <span className="vg-search-icon"><SearchSVG /></span>
              <input
                type="text"
                className="vg-search"
                placeholder={t("home.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label={t("home.searchAriaLabel")}
              />
            </div>
            <div className="vg-pills-wrap">
              <div className="vg-pills" role="group" aria-label={t("home.filterAriaLabel")}>
                <button
                  className={`vg-pill${activeCategory === null ? " active" : ""}`}
                  onClick={() => setActiveCategory(null)}
                  aria-pressed={activeCategory === null}
                >
                  {t("common.all")}
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    className={`vg-pill${activeCategory === cat ? " active" : ""}`}
                    onClick={() => setActiveCategory(cat)}
                    aria-pressed={activeCategory === cat}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* MAIN */}
        <main className="vg-main">
          <div className="vg-main-inner">
            {loading ? (
              <div className="vg-grid">
                {Array.from({ length: 6 }).map((_, i) => <div key={i} className="vg-skeleton" />)}
              </div>
            ) : error ? (
              <div className="vg-error"><p>{error}</p></div>
            ) : filtered.length === 0 ? (
              <div className="vg-empty">
                <div className="vg-empty-icon"><LeafSVG /></div>
                <h3>{plants.length === 0 ? t("home.emptyGarden") : t("home.noResults")}</h3>
                <p>{plants.length === 0 ? t("home.emptyGardenDesc") : t("home.noResultsDesc")}</p>
                {plants.length === 0 && session && (
                  <Link href={`/${locale}/admin`} className="vg-empty-cta">
                    {t("home.openAdmin")}
                  </Link>
                )}
              </div>
            ) : (
              <>
                <div className="vg-results-bar">
                  <span className="vg-results-count">
                    {filtered.length} {filtered.length === 1 ? t("navigation.plants").replace("s","") : t("navigation.plants")}
                    {activeCategory && ` · ${activeCategory}`}
                    {search && ` · "${search}"`}
                  </span>
                </div>
                <div className="vg-grid">
                  {filtered.map((plant) => {
                    const stock = stockLabel(plant);
                    const diff = plant.careInstructions?.difficulty;
                    const diffCfg = diff ? difficultyConfig[diff] : null;
                    return (
                      <Link
                        key={plant._id}
                        href={`/${locale}/plants/${plant._id}`}
                        style={{ textDecoration: "none", color: "inherit", display: "block" }}
                      >
                        <article className="vg-card">
                          <div className="vg-card-img-wrap">
                            {plant.imageUrl ? (
                              <Image
                                src={plant.imageUrl}
                                alt={plant.name?.[locale as "fr" | "en"] ?? ""}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                style={{ objectFit: "contain", objectPosition: "center top", padding: "8px" }}
                              />
                            ) : (
                              <div className="vg-card-placeholder"><LeafSVG /></div>
                            )}
                            {diffCfg && (
                              <div className="vg-badge-wrap">
                                <span
                                  className="vg-diff-badge"
                                  style={{ color: diffCfg.color, background: diffCfg.bg }}
                                >
                                  {t(`plant.difficulty${diff}`)}
                                </span>
                              </div>
                            )}
                            {plant.stock <= 0 && (
                              <div className="vg-oos-overlay">
                                <span className="vg-oos-label">{t("plant.outOfStock")}</span>
                              </div>
                            )}
                          </div>
                          <div className="vg-card-body">
                            {plant.category && <span className="vg-card-cat">{plant.category}</span>}
                            <h3 className="vg-card-name">
                              {plant.name?.[locale as "fr" | "en"] ?? plant.name?.fr ?? ""}
                            </h3>
                            <p className="vg-card-desc">
                              {plant.description?.[locale as "fr" | "en"] ?? plant.description?.fr ?? ""}
                            </p>
                            {(plant.careInstructions?.wateringFrequency || plant.careInstructions?.lightRequirements) && (
                              <div className="vg-card-care">
                                {plant.careInstructions.wateringFrequency && (
                                  <span className="vg-care-tag">
                                    💧 {plant.careInstructions.wateringFrequency}
                                  </span>
                                )}
                                {plant.careInstructions.lightRequirements && (
                                  <span className="vg-care-tag">
                                    ☀️ {plant.careInstructions.lightRequirements}
                                  </span>
                                )}
                              </div>
                            )}
                            <div className="vg-card-footer">
                              <span className="vg-card-price">
                                {plant.price.toFixed(2)}<span>TND</span>
                              </span>
                              <span className={`vg-stock-badge ${stock.variant}`}>
                                {stock.text}
                              </span>
                            </div>
                            <div className="vg-card-actions">
                              <button
                                className={`vg-add-to-cart${addedIds.has(plant._id) ? " added" : ""}`}
                                onClick={(e) => handleAddToCart(e, plant)}
                                disabled={plant.stock <= 0}
                                aria-label={t("cart.addToCart")}
                              >
                                {addedIds.has(plant._id) ? (
                                  <>✓ {t("cart.added")}</>
                                ) : (
                                  <>{t("cart.addToCart")}</>
                                )}
                              </button>
                              <button
                                className="vg-buy-now"
                                onClick={(e) => handleBuyNow(e, plant)}
                                disabled={plant.stock <= 0}
                                aria-label={t("cart.buyNow")}
                              >
                                {t("cart.buyNow")}
                              </button>
                            </div>
                          </div>
                        </article>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </main>

        {/* FOOTER */}
        <footer className="vg-footer">
          <div className="vg-footer-inner">
            <div className="vg-footer-brand">
              <img src="/icons/logo.svg" alt="Verde Garden" style={{ height: "28px", width: "auto", display: "block" }} />
            </div>
            {session && (
              <div className="vg-footer-links">
                <Link href={`/${locale}/admin`} className="vg-footer-link">
                  {t("footer.admin")}
                </Link>
              </div>
            )}
            <span className="vg-footer-copy">
              {t("footer.copyright", { year: new Date().getFullYear() })}
            </span>
          </div>
        </footer>
      </div>
    </>
  );
}
