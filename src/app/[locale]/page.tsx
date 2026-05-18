"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
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

const LeafDecoration = () => (
  <div className="vg-hero-leaves" aria-hidden="true">
    {/* Large primary leaf — right side */}
    <svg className="vg-leaf vg-leaf--a" viewBox="0 0 300 500" fill="none">
      <path
        d="M150 480 C150 480 30 380 20 220 C10 60 130 10 150 10 C170 10 290 60 280 220 C270 380 150 480 150 480Z"
        stroke="rgba(184,212,176,0.22)"
        strokeWidth="1.5"
        fill="rgba(184,212,176,0.06)"
      />
      <path d="M150 480 L150 10" stroke="rgba(184,212,176,0.14)" strokeWidth="1" />
      <path d="M150 250 C150 250 90 210 70 140" stroke="rgba(184,212,176,0.12)" strokeWidth="1" />
      <path d="M150 270 C150 270 210 230 230 160" stroke="rgba(184,212,176,0.12)" strokeWidth="1" />
      <path d="M150 330 C150 330 100 305 80 255" stroke="rgba(184,212,176,0.09)" strokeWidth="1" />
      <path d="M150 350 C150 350 200 325 220 275" stroke="rgba(184,212,176,0.09)" strokeWidth="1" />
      <path d="M150 180 C150 180 110 155 95 105" stroke="rgba(184,212,176,0.08)" strokeWidth="1" />
      <path d="M150 200 C150 200 190 175 205 125" stroke="rgba(184,212,176,0.08)" strokeWidth="1" />
    </svg>

    {/* Medium leaf — upper right, tilted */}
    <svg className="vg-leaf vg-leaf--b" viewBox="0 0 220 360" fill="none">
      <path
        d="M110 350 C110 350 20 280 10 160 C0 40 90 8 110 8 C130 8 220 40 210 160 C200 280 110 350 110 350Z"
        stroke="rgba(127,168,107,0.18)"
        strokeWidth="1.5"
        fill="rgba(127,168,107,0.05)"
      />
      <path d="M110 350 L110 8" stroke="rgba(127,168,107,0.12)" strokeWidth="1" />
      <path d="M110 180 C110 180 65 150 50 95" stroke="rgba(127,168,107,0.1)" strokeWidth="0.8" />
      <path d="M110 200 C110 200 155 170 170 115" stroke="rgba(127,168,107,0.1)" strokeWidth="0.8" />
      <path d="M110 260 C110 260 75 240 60 195" stroke="rgba(127,168,107,0.08)" strokeWidth="0.8" />
      <path d="M110 278 C110 278 145 258 160 213" stroke="rgba(127,168,107,0.08)" strokeWidth="0.8" />
    </svg>

    {/* Small accent leaf — far right */}
    <svg className="vg-leaf vg-leaf--c" viewBox="0 0 160 260" fill="none">
      <path
        d="M80 252 C80 252 12 196 8 112 C4 28 60 6 80 6 C100 6 156 28 152 112 C148 196 80 252 80 252Z"
        stroke="rgba(184,212,176,0.28)"
        strokeWidth="1.2"
        fill="rgba(184,212,176,0.08)"
      />
      <path d="M80 252 L80 6" stroke="rgba(184,212,176,0.16)" strokeWidth="0.8" />
      <path d="M80 130 C80 130 50 112 40 74" stroke="rgba(184,212,176,0.12)" strokeWidth="0.7" />
      <path d="M80 145 C80 145 110 127 120 89" stroke="rgba(184,212,176,0.12)" strokeWidth="0.7" />
    </svg>

    {/* Tiny floating leaf — top area */}
    <svg className="vg-leaf vg-leaf--d" viewBox="0 0 120 200" fill="none">
      <path
        d="M60 194 C60 194 10 152 6 86 C2 20 46 4 60 4 C74 4 118 20 114 86 C110 152 60 194 60 194Z"
        stroke="rgba(74,103,65,0.3)"
        strokeWidth="1"
        fill="rgba(74,103,65,0.07)"
      />
      <path d="M60 194 L60 4" stroke="rgba(74,103,65,0.18)" strokeWidth="0.7" />
      <path d="M60 100 C60 100 38 86 30 56" stroke="rgba(74,103,65,0.14)" strokeWidth="0.6" />
      <path d="M60 114 C60 114 82 100 90 70" stroke="rgba(74,103,65,0.14)" strokeWidth="0.6" />
    </svg>

    {/* Wispy long leaf — left edge */}
    <svg className="vg-leaf vg-leaf--e" viewBox="0 0 140 460" fill="none">
      <path
        d="M70 450 C70 450 14 350 10 200 C6 50 48 8 70 8 C92 8 134 50 130 200 C126 350 70 450 70 450Z"
        stroke="rgba(184,212,176,0.13)"
        strokeWidth="1.2"
        fill="rgba(184,212,176,0.03)"
      />
      <path d="M70 450 L70 8" stroke="rgba(184,212,176,0.1)" strokeWidth="0.8" />
      <path d="M70 220 C70 220 42 200 32 155" stroke="rgba(184,212,176,0.08)" strokeWidth="0.7" />
      <path d="M70 245 C70 245 98 225 108 180" stroke="rgba(184,212,176,0.08)" strokeWidth="0.7" />
    </svg>

    {/* Wide rounded leaf — center-left, mid-height */}
    <svg className="vg-leaf vg-leaf--f" viewBox="0 0 260 200" fill="none">
      <path
        d="M10 100 C10 100 60 10 130 10 C200 10 250 60 250 100 C250 140 200 190 130 190 C60 190 10 100 10 100Z"
        stroke="rgba(127,168,107,0.2)"
        strokeWidth="1.2"
        fill="rgba(127,168,107,0.05)"
      />
      <path d="M10 100 L250 100" stroke="rgba(127,168,107,0.1)" strokeWidth="0.8" />
      <path d="M130 10 L130 190" stroke="rgba(127,168,107,0.08)" strokeWidth="0.7" />
      <path d="M130 100 C130 100 80 70 60 40" stroke="rgba(127,168,107,0.09)" strokeWidth="0.7" />
      <path d="M130 100 C130 100 180 70 200 40" stroke="rgba(127,168,107,0.09)" strokeWidth="0.7" />
    </svg>

    {/* Slim pointed leaf — lower center */}
    <svg className="vg-leaf vg-leaf--g" viewBox="0 0 100 380" fill="none">
      <path
        d="M50 370 C50 370 4 270 4 150 C4 30 34 6 50 6 C66 6 96 30 96 150 C96 270 50 370 50 370Z"
        stroke="rgba(74,103,65,0.22)"
        strokeWidth="1"
        fill="rgba(74,103,65,0.06)"
      />
      <path d="M50 370 L50 6" stroke="rgba(74,103,65,0.12)" strokeWidth="0.7" />
      <path d="M50 190 C50 190 28 168 20 128" stroke="rgba(74,103,65,0.1)" strokeWidth="0.6" />
      <path d="M50 210 C50 210 72 188 80 148" stroke="rgba(74,103,65,0.1)" strokeWidth="0.6" />
    </svg>

    {/* Small round leaf — upper center-right */}
    <svg className="vg-leaf vg-leaf--h" viewBox="0 0 180 180" fill="none">
      <path
        d="M90 170 C90 170 14 140 10 90 C6 40 50 10 90 10 C130 10 174 40 170 90 C166 140 90 170 90 170Z"
        stroke="rgba(184,212,176,0.25)"
        strokeWidth="1"
        fill="rgba(184,212,176,0.07)"
      />
      <path d="M90 170 L90 10" stroke="rgba(184,212,176,0.12)" strokeWidth="0.7" />
      <path d="M90 90 C90 90 55 72 44 42" stroke="rgba(184,212,176,0.1)" strokeWidth="0.6" />
      <path d="M90 90 C90 90 125 72 136 42" stroke="rgba(184,212,176,0.1)" strokeWidth="0.6" />
    </svg>

    {/* Drooping narrow leaf — left center */}
    <svg className="vg-leaf vg-leaf--i" viewBox="0 0 80 300" fill="none">
      <path
        d="M40 292 C40 292 4 220 4 130 C4 40 26 6 40 6 C54 6 76 40 76 130 C76 220 40 292 40 292Z"
        stroke="rgba(184,212,176,0.18)"
        strokeWidth="1"
        fill="rgba(184,212,176,0.05)"
      />
      <path d="M40 292 L40 6" stroke="rgba(184,212,176,0.1)" strokeWidth="0.6" />
      <path d="M40 150 C40 150 22 132 16 96" stroke="rgba(184,212,176,0.09)" strokeWidth="0.5" />
      <path d="M40 168 C40 168 58 150 64 114" stroke="rgba(184,212,176,0.09)" strokeWidth="0.5" />
    </svg>

    {/* Large flat leaf — bottom center */}
    <svg className="vg-leaf vg-leaf--j" viewBox="0 0 340 240" fill="none">
      <path
        d="M170 228 C170 228 20 180 8 120 C-4 60 60 12 170 12 C280 12 344 60 332 120 C320 180 170 228 170 228Z"
        stroke="rgba(127,168,107,0.15)"
        strokeWidth="1.5"
        fill="rgba(127,168,107,0.04)"
      />
      <path d="M170 228 L170 12" stroke="rgba(127,168,107,0.09)" strokeWidth="0.8" />
      <path d="M170 120 C170 120 100 94 70 55" stroke="rgba(127,168,107,0.08)" strokeWidth="0.7" />
      <path d="M170 120 C170 120 240 94 270 55" stroke="rgba(127,168,107,0.08)" strokeWidth="0.7" />
      <path d="M170 160 C170 160 115 142 90 110" stroke="rgba(127,168,107,0.06)" strokeWidth="0.6" />
      <path d="M170 160 C170 160 225 142 250 110" stroke="rgba(127,168,107,0.06)" strokeWidth="0.6" />
    </svg>
  </div>
);

const LeafIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" />
    <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const difficultyColor: Record<string, string> = {
  Easy: "#7fa86b",
  Medium: "#c4914b",
  Hard: "#c4714b",
};

export default function HomePage() {
  const { data: session } = useSession();
  const t = useTranslations();
  const locale = useLocale();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/plants")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data) => {
        setPlants(data);
        setLoading(false);
      })
      .catch(() => {
        setError(t("errors.loadFailed"));
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  const categories = useMemo(() => {
    const cats = new Set(plants.map((p) => p.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [plants]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return plants.filter((p) => {
      const matchSearch =
        !q ||
        (p.name?.fr ?? "").toLowerCase().includes(q) ||
        (p.name?.en ?? "").toLowerCase().includes(q) ||
        (p.description?.fr ?? "").toLowerCase().includes(q) ||
        (p.description?.en ?? "").toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q);
      const matchCategory = !activeCategory || p.category === activeCategory;
      return matchSearch && matchCategory;
    });
  }, [plants, search, activeCategory]);

  const stockLabel = (plant: Plant) => {
    if (plant.stock <= 0) return t("plant.unavailable");
    if (plant.stock <= 5) return t("plant.lowStock", { count: plant.stock });
    return t("plant.inStock", { count: plant.stock });
  };

  return (
    <>
      <style>{`
        /* NAV */
        .vg-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          background: var(--forest);
          transition: box-shadow 0.3s ease, background 0.3s ease;
        }
        .vg-nav.scrolled {
          background: rgba(15,32,16,0.97);
          backdrop-filter: blur(12px);
          box-shadow: 0 2px 24px rgba(0,0,0,0.2);
        }
        .vg-nav-inner {
          max-width: 1400px; margin: 0 auto;
          padding: 0 2rem; height: 72px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .vg-logo {
          display: flex; align-items: center; gap: 0.6rem;
          text-decoration: none; z-index: 1;
        }
        .vg-logo-icon {
          width: 36px; height: 36px;
          background: rgba(184,212,176,0.15);
          border: 1px solid rgba(184,212,176,0.25);
          border-radius: 8px;
          display: grid; place-items: center;
          color: var(--mint);
        }
        .vg-logo-text {
          font-family: var(--font-display);
          font-size: 1.45rem; font-weight: 500;
          color: var(--cream); letter-spacing: 0.02em;
        }
        .vg-nav-right { display: flex; align-items: center; gap: 1rem; }
        .vg-nav-count {
          font-size: 0.75rem; font-weight: 400;
          color: rgba(247,243,236,0.5);
          letter-spacing: 0.08em;
        }
        .vg-nav-admin {
          font-size: 0.75rem; font-weight: 500;
          color: rgba(247,243,236,0.8);
          text-transform: uppercase; letter-spacing: 0.12em;
          border: 1px solid rgba(247,243,236,0.2);
          padding: 0.45rem 1.1rem; border-radius: 100px;
          transition: all var(--transition);
        }
        .vg-nav-admin:hover {
          background: rgba(247,243,236,0.1);
          color: var(--cream);
          border-color: rgba(247,243,236,0.4);
        }
        /* Hamburger */
        .vg-hamburger {
          display: none;
          flex-direction: column; justify-content: center; gap: 5px;
          width: 40px; height: 40px; padding: 8px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 8px; cursor: pointer;
          transition: background 0.2s;
        }
        .vg-hamburger:hover { background: rgba(255,255,255,0.12); }
        .vg-hamburger span {
          display: block; width: 100%; height: 1.5px;
          background: var(--cream); border-radius: 2px;
          transition: transform 0.25s ease, opacity 0.25s ease;
          transform-origin: center;
        }
        .vg-hamburger.open span:nth-child(1) { transform: translateY(6.5px) rotate(45deg); }
        .vg-hamburger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
        .vg-hamburger.open span:nth-child(3) { transform: translateY(-6.5px) rotate(-45deg); }
        /* Mobile drawer */
        .vg-mobile-menu {
          display: none;
          position: fixed; top: 72px; left: 0; right: 0;
          background: rgba(15,32,16,0.98);
          backdrop-filter: blur(16px);
          z-index: 99; padding: 1.5rem 2rem 2rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          flex-direction: column; gap: 0.75rem;
          animation: slideDown 0.2s ease;
        }
        .vg-mobile-menu.open { display: flex; }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .vg-mobile-menu-item {
          font-size: 0.875rem; font-weight: 400;
          color: rgba(247,243,236,0.7);
          padding: 0.65rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .vg-mobile-menu-item:last-child { border-bottom: none; }
        .vg-mobile-admin-link {
          display: inline-flex; align-items: center;
          font-size: 0.8rem; font-weight: 500;
          color: var(--mint); text-transform: uppercase; letter-spacing: 0.1em;
          border: 1px solid rgba(184,212,176,0.3);
          padding: 0.6rem 1.25rem; border-radius: 100px;
          margin-top: 0.5rem; align-self: flex-start;
          transition: all 0.2s;
        }
        .vg-mobile-admin-link:hover { background: rgba(184,212,176,0.1); }

        /* HERO */
        .vg-hero {
          background: linear-gradient(150deg, var(--forest-dark) 0%, var(--forest) 45%, var(--forest-light) 100%);
          padding: 10rem 2rem 7rem;
          position: relative; overflow: hidden;
        }

        /* Leaf animation keyframes */
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

        /* Leaf container */
        .vg-hero-leaves {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 1;
        }

        /* Individual leaf positioning and animation */
        .vg-leaf {
          position: absolute;
          transform-origin: bottom center;
          will-change: transform;
        }

        /* Large leaf — top-left corner, drooping in */
        .vg-leaf--a {
          left: -4%;
          top: -8%;
          width: min(300px, 28vw);
          transform-origin: top right;
          animation: leafSway 9s ease-in-out infinite;
        }

        /* Medium leaf — far right, vertically centered */
        .vg-leaf--b {
          right: 2%;
          top: 50%;
          transform: translateY(-50%);
          width: min(210px, 20vw);
          transform-origin: bottom center;
          animation: leafDrift 11s ease-in-out infinite;
          animation-delay: -3.2s;
        }

        /* Small leaf — bottom-left corner */
        .vg-leaf--c {
          left: 3%;
          bottom: 14%;
          width: min(150px, 14vw);
          transform-origin: bottom right;
          animation: leafFloat 7.5s ease-in-out infinite;
          animation-delay: -1.8s;
        }

        /* Tiny leaf — top-right corner */
        .vg-leaf--d {
          right: 6%;
          top: 2%;
          width: min(110px, 10vw);
          transform-origin: top left;
          animation: leafBob 13s ease-in-out infinite;
          animation-delay: -5.5s;
        }

        /* Wispy tall leaf — bottom-right, partially cropped */
        .vg-leaf--e {
          right: 18%;
          bottom: -10%;
          width: min(120px, 11vw);
          transform-origin: bottom center;
          animation: leafSerpentine 15s ease-in-out infinite;
          animation-delay: -7s;
        }

        /* Wide rounded leaf — center-left, mid-height */
        .vg-leaf--f {
          left: 8%;
          top: 40%;
          width: min(200px, 18vw);
          transform-origin: left center;
          animation: leafFloat 10s ease-in-out infinite;
          animation-delay: -2.4s;
        }

        /* Slim pointed leaf — lower center */
        .vg-leaf--g {
          left: 38%;
          bottom: -5%;
          width: min(90px, 8vw);
          transform-origin: bottom center;
          animation: leafBob 8s ease-in-out infinite;
          animation-delay: -4.1s;
        }

        /* Small round leaf — upper center-right */
        .vg-leaf--h {
          right: 32%;
          top: 5%;
          width: min(130px, 12vw);
          transform-origin: top center;
          animation: leafSway 12s ease-in-out infinite;
          animation-delay: -6.3s;
        }

        /* Drooping narrow leaf — left center, above mid */
        .vg-leaf--i {
          left: 22%;
          top: 18%;
          width: min(70px, 6vw);
          transform-origin: top center;
          animation: leafDrift 17s ease-in-out infinite;
          animation-delay: -9s;
        }

        /* Large flat leaf — bottom center-left */
        .vg-leaf--j {
          left: 50%;
          bottom: 8%;
          width: min(260px, 22vw);
          transform: translateX(-50%);
          transform-origin: bottom center;
          animation: leafSerpentine 14s ease-in-out infinite;
          animation-delay: -11s;
        }

        .vg-hero-deco-circles {
          position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          overflow: hidden; pointer-events: none;
        }
        .vg-hero-deco-circles::before {
          content: '';
          position: absolute; width: 600px; height: 600px;
          border-radius: 50%;
          border: 1px solid rgba(184,212,176,0.07);
          top: -200px; right: -100px;
        }
        .vg-hero-deco-circles::after {
          content: '';
          position: absolute; width: 400px; height: 400px;
          border-radius: 50%;
          border: 1px solid rgba(184,212,176,0.05);
          bottom: -100px; left: 20%;
        }
        .vg-hero::after {
          content: '';
          position: absolute; bottom: -2px; left: 0; right: 0; height: 80px;
          background: var(--cream);
          clip-path: ellipse(58% 100% at 50% 100%);
          z-index: 3;
        }
        .vg-hero-content {
          max-width: 680px; margin: 0 auto;
          position: relative; z-index: 2;
          text-align: center;
        }
        .vg-hero-sub {
          margin: 0 auto;
        }
        .vg-hero-tag {
          display: inline-flex; align-items: center; gap: 0.5rem;
          font-size: 0.68rem; font-weight: 500;
          text-transform: uppercase; letter-spacing: 0.18em;
          color: var(--mint);
          border: 1px solid rgba(184,212,176,0.3);
          padding: 0.4rem 1rem; border-radius: 100px;
          margin-bottom: 1.75rem;
        }
        .vg-hero-tag-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: var(--fern); flex-shrink: 0;
        }
        .vg-hero-title {
          font-family: var(--font-display);
          font-size: clamp(2.8rem, 7vw, 6.5rem);
          font-weight: 300; line-height: 1.02;
          color: var(--cream); margin-bottom: 1.5rem;
        }
        .vg-hero-title em {
          font-style: italic; font-weight: 300;
          color: var(--mint);
        }
        .vg-hero-sub {
          font-size: 1rem; font-weight: 300;
          color: rgba(247,243,236,0.65);
          max-width: 400px; line-height: 1.8;
        }

        /* FILTERS */
        .vg-filters {
          background: var(--cream);
          padding: 1.5rem 2rem 1.25rem;
          position: sticky; top: 72px; z-index: 90;
          border-bottom: 1px solid var(--parchment);
          box-shadow: 0 4px 20px rgba(28,58,30,0.04);
        }
        .vg-filters-inner {
          max-width: 1400px; margin: 0 auto;
          display: flex; gap: 1.25rem; align-items: center;
          flex-wrap: wrap;
        }
        .vg-search-wrap {
          position: relative; flex: 1; min-width: 200px; max-width: 340px;
        }
        .vg-search-icon {
          position: absolute; left: 1rem; top: 50%;
          transform: translateY(-50%);
          color: var(--text-light); pointer-events: none;
        }
        .vg-search {
          width: 100%; padding: 0.7rem 1rem 0.7rem 2.75rem;
          background: var(--white); border: 1.5px solid var(--parchment);
          border-radius: 100px; font-size: 0.875rem; color: var(--text);
          outline: none; transition: border-color var(--transition), box-shadow var(--transition);
        }
        .vg-search:focus {
          border-color: var(--fern);
          box-shadow: 0 0 0 3px rgba(127,168,107,0.12);
        }
        .vg-search::placeholder { color: var(--text-light); }
        .vg-pills {
          display: flex; gap: 0.5rem;
          align-items: center; flex: 1;
          overflow-x: auto; overflow-y: hidden;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none; -ms-overflow-style: none;
          padding-bottom: 2px;
        }
        .vg-pills::-webkit-scrollbar { display: none; }
        .vg-pill {
          font-size: 0.78rem; font-weight: 400;
          padding: 0.45rem 1rem; border-radius: 100px;
          border: 1.5px solid var(--parchment);
          color: var(--text-muted); background: var(--white);
          transition: all var(--transition); white-space: nowrap;
          flex-shrink: 0;
        }
        .vg-pill:hover { border-color: var(--fern); color: var(--sage); }
        .vg-pill.active {
          background: var(--forest); border-color: var(--forest);
          color: var(--cream); font-weight: 500;
        }

        /* MAIN */
        .vg-main { padding: 2.5rem 2rem 4rem; min-height: 50vh; }
        .vg-main-inner { max-width: 1400px; margin: 0 auto; }
        .vg-results-bar {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 1.75rem;
        }
        .vg-results-count {
          font-size: 0.8rem; color: var(--text-muted); letter-spacing: 0.04em;
        }
        .vg-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        /* CARDS */
        .vg-card {
          background: var(--white); border-radius: var(--radius-lg);
          overflow: hidden; box-shadow: var(--shadow-sm);
          transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1),
                      box-shadow 0.35s ease;
          display: flex; flex-direction: column;
          cursor: pointer;
        }
        .vg-card:hover {
          transform: translateY(-6px);
          box-shadow: var(--shadow-xl);
        }
        .vg-card-img-wrap {
          position: relative; aspect-ratio: 4/3; overflow: hidden;
          background: var(--parchment);
        }
        .vg-card-img-wrap img {
          transition: transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94);
        }
        .vg-card:hover .vg-card-img-wrap img { transform: scale(1.07); }
        .vg-card-placeholder {
          width: 100%; height: 100%;
          display: grid; place-items: center;
          color: var(--sand);
          background: linear-gradient(135deg, var(--parchment) 0%, var(--sand) 100%);
        }
        .vg-card-placeholder svg { width: 48px; height: 48px; }
        .vg-difficulty-badge {
          position: absolute; top: 0.75rem; right: 0.75rem;
          font-size: 0.65rem; font-weight: 500;
          text-transform: uppercase; letter-spacing: 0.1em;
          padding: 0.3rem 0.7rem; border-radius: 100px;
          color: white; background: var(--badge-color, var(--fern));
        }
        .vg-out-of-stock-overlay {
          position: absolute; inset: 0;
          background: rgba(26,26,26,0.55);
          display: grid; place-items: center;
        }
        .vg-out-of-stock-label {
          font-size: 0.7rem; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.12em;
          color: white; background: rgba(26,26,26,0.7);
          padding: 0.4rem 0.9rem; border-radius: 4px;
          border: 1px solid rgba(255,255,255,0.2);
        }
        .vg-card-body {
          padding: 1.2rem 1.4rem 1.5rem;
          flex: 1; display: flex; flex-direction: column;
        }
        .vg-card-cat {
          font-size: 0.65rem; font-weight: 500;
          text-transform: uppercase; letter-spacing: 0.14em;
          color: var(--sage); margin-bottom: 0.3rem;
        }
        .vg-card-name {
          font-family: var(--font-display);
          font-size: 1.4rem; font-weight: 500; line-height: 1.2;
          color: var(--forest); margin-bottom: 0.5rem;
        }
        .vg-card-desc {
          font-size: 0.82rem; color: var(--text-muted); line-height: 1.65;
          display: -webkit-box; -webkit-line-clamp: 2;
          -webkit-box-orient: vertical; overflow: hidden;
          flex: 1; margin-bottom: 1.1rem;
        }
        .vg-card-care {
          display: flex; gap: 0.75rem; margin-bottom: 1.1rem; flex-wrap: wrap;
        }
        .vg-care-pill {
          font-size: 0.65rem; color: var(--text-muted);
          background: var(--parchment); border-radius: 4px;
          padding: 0.2rem 0.55rem; white-space: nowrap;
        }
        .vg-card-footer {
          display: flex; align-items: center; justify-content: space-between;
          padding-top: 1rem;
          border-top: 1px solid var(--parchment);
          margin-top: auto;
        }
        .vg-card-price {
          font-family: var(--font-display);
          font-size: 1.55rem; font-weight: 600; color: var(--forest);
        }
        .vg-card-stock { font-size: 0.72rem; color: var(--text-light); }
        .vg-card-stock.low { color: var(--terra); }

        /* SKELETON */
        @keyframes shimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .vg-skeleton {
          border-radius: var(--radius-lg);
          overflow: hidden;
          background: linear-gradient(90deg, var(--parchment) 25%, var(--sand) 50%, var(--parchment) 75%);
          background-size: 800px 100%;
          animation: shimmer 1.5s infinite linear;
          height: 380px;
        }

        /* EMPTY / ERROR */
        .vg-empty, .vg-error {
          text-align: center; padding: 5rem 2rem;
          color: var(--text-muted);
        }
        .vg-empty-icon {
          width: 64px; height: 64px; margin: 0 auto 1.5rem;
          background: var(--parchment); border-radius: 50%;
          display: grid; place-items: center;
          color: var(--sand);
        }
        .vg-empty-icon svg { width: 28px; height: 28px; }
        .vg-empty h3 {
          font-family: var(--font-display);
          font-size: 1.6rem; font-weight: 400;
          color: var(--forest); margin-bottom: 0.5rem;
        }
        .vg-empty p {
          font-size: 0.875rem; max-width: 320px;
          margin: 0 auto 1.75rem; line-height: 1.7;
        }
        .vg-empty-cta {
          display: inline-block;
          background: var(--forest); color: var(--cream);
          font-size: 0.8rem; font-weight: 500;
          text-transform: uppercase; letter-spacing: 0.1em;
          padding: 0.75rem 1.75rem; border-radius: 100px;
          transition: background var(--transition);
        }
        .vg-empty-cta:hover { background: var(--forest-light); }

        /* FOOTER */
        .vg-footer {
          background: var(--forest-dark);
          padding: 2rem;
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .vg-footer-inner {
          max-width: 1400px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 1rem;
        }
        .vg-footer-brand {
          display: flex; align-items: center; gap: 0.5rem;
          font-family: var(--font-display);
          font-size: 1.1rem; color: rgba(247,243,236,0.7);
        }
        .vg-footer-links { display: flex; gap: 1.5rem; }
        .vg-footer-link {
          font-size: 0.75rem; text-transform: uppercase;
          letter-spacing: 0.1em; color: rgba(247,243,236,0.4);
          transition: color var(--transition);
        }
        .vg-footer-link:hover { color: rgba(247,243,236,0.8); }
        .vg-footer-copy {
          font-size: 0.7rem; color: rgba(247,243,236,0.25);
        }

        /* RESPONSIVE — Tablet */
        @media (max-width: 1024px) {
          .vg-grid { grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
          .vg-leaf--a { width: 200px; }
          .vg-leaf--b { width: 160px; }
          .vg-leaf--c { width: 110px; }
          .vg-leaf--d { width: 85px; }
          .vg-leaf--e { width: 90px; }
          .vg-leaf--f { width: 150px; }
          .vg-leaf--g { width: 70px; }
          .vg-leaf--h { width: 100px; }
          .vg-leaf--i { width: 55px; }
          .vg-leaf--j { width: 180px; }
        }

        /* RESPONSIVE — Mobile */
        @media (max-width: 768px) {
          .vg-nav-count { display: none; }
          .vg-nav-admin { display: none; }
          .vg-hamburger { display: flex; }
          .vg-nav-right > .lang-switcher { display: none; }
          .vg-hero { padding: 7rem 1.25rem 5rem; }
          .vg-hero-sub { font-size: 0.9rem; }
          /* Keep corner leaves, hide the dense interior ones */
          .vg-leaf--f { display: none; }
          .vg-leaf--g { display: none; }
          .vg-leaf--i { display: none; }
          .vg-leaf--j { display: none; }
          /* Resize remaining leaves for mobile viewport */
          .vg-leaf--a { width: 130px; left: -6%; top: -4%; }
          .vg-leaf--b { width: 110px; right: 0%; }
          .vg-leaf--c { width: 80px; left: 2%; bottom: 18%; }
          .vg-leaf--d { width: 65px; right: 4%; top: 4%; }
          .vg-leaf--e { width: 70px; right: 20%; bottom: -6%; }
          .vg-leaf--h { width: 80px; right: 28%; top: 6%; }
          .vg-filters { padding: 1rem 1.25rem 0.875rem; top: 72px; }
          .vg-filters-inner { flex-direction: column; align-items: stretch; gap: 0.75rem; }
          .vg-search-wrap { max-width: 100%; }
          .vg-pills { flex-wrap: nowrap; }
          .vg-main { padding: 1.5rem 1.25rem 3rem; }
          .vg-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 0.875rem;
          }
          .vg-card-name { font-size: 1.15rem; }
          .vg-card-price { font-size: 1.3rem; }
          .vg-card-body { padding: 1rem 1rem 1.25rem; }
          .vg-skeleton { height: 280px; }
        }

        /* RESPONSIVE — Small mobile */
        @media (max-width: 480px) {
          .vg-nav-inner { padding: 0 1.25rem; }
          .vg-grid { grid-template-columns: 1fr; gap: 0.875rem; }
          .vg-footer-inner { flex-direction: column; align-items: flex-start; }
          .vg-empty, .vg-error { padding: 3rem 1.25rem; }
          /* On very small screens keep only 3 leaves at the edges */
          .vg-leaf--c { display: none; }
          .vg-leaf--e { display: none; }
          .vg-leaf--a { width: 100px; }
          .vg-leaf--b { width: 85px; }
          .vg-leaf--d { width: 55px; }
          .vg-leaf--h { display: none; }
        }
      `}</style>

      <div>
        {/* NAV */}
        <nav className={`vg-nav${scrolled ? " scrolled" : ""}`}>
          <div className="vg-nav-inner">
            <Link href={`/${locale}`} className="vg-logo" onClick={() => setMobileMenuOpen(false)}>
              <div className="vg-logo-icon">
                <LeafIcon />
              </div>
              <span className="vg-logo-text">Verde Garden</span>
            </Link>
            <div className="vg-nav-right">
              <span className="vg-nav-count">
                {loading ? "—" : `${plants.length} ${t("navigation.plants")}`}
              </span>
              <LanguageSwitcher />
              {session && (
                <Link href={`/${locale}/admin`} className="vg-nav-admin">
                  {t("navigation.admin")}
                </Link>
              )}
              <button
                className={`vg-hamburger${mobileMenuOpen ? " open" : ""}`}
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
                onClick={() => setMobileMenuOpen((v) => !v)}
              >
                <span />
                <span />
                <span />
              </button>
            </div>
          </div>

          {/* Mobile drawer */}
          <div className={`vg-mobile-menu${mobileMenuOpen ? " open" : ""}`}>
            <div className="vg-mobile-menu-item">
              <LanguageSwitcher />
            </div>
            <div className="vg-mobile-menu-item" style={{ color: "rgba(247,243,236,0.45)", fontSize: "0.8rem" }}>
              {loading ? "—" : `${plants.length} ${t("navigation.plants")}`}
            </div>
            {session && (
              <Link
                href={`/${locale}/admin`}
                className="vg-mobile-admin-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("navigation.admin")}
              </Link>
            )}
          </div>
        </nav>

        {/* HERO */}
        <header className="vg-hero">
          <div className="vg-hero-deco-circles" />
          <LeafDecoration />
          <div className="vg-hero-content">
            <div className="vg-hero-tag">
              <span className="vg-hero-tag-dot" />
              {t("home.tagline")}
            </div>
            <h1 className="vg-hero-title">
              {t("home.title")} <em>{t("home.titleEm")}</em>
              <br />
              {t("home.titleEnd")}
            </h1>
            <p className="vg-hero-sub">{t("home.subtitle")}</p>
          </div>
        </header>

        {/* FILTERS */}
        <section className="vg-filters">
          <div className="vg-filters-inner">
            <div className="vg-search-wrap">
              <span className="vg-search-icon">
                <SearchIcon />
              </span>
              <input
                type="text"
                className="vg-search"
                placeholder={t("home.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label={t("home.searchAriaLabel")}
              />
            </div>
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
        </section>

        {/* MAIN */}
        <main className="vg-main">
          <div className="vg-main-inner">
            {loading ? (
              <div className="vg-grid">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="vg-skeleton" />
                ))}
              </div>
            ) : error ? (
              <div className="vg-error">
                <p>{error}</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="vg-empty">
                <div className="vg-empty-icon">
                  <LeafIcon />
                </div>
                <h3>
                  {plants.length === 0 ? t("home.emptyGarden") : t("home.noResults")}
                </h3>
                <p>
                  {plants.length === 0 ? t("home.emptyGardenDesc") : t("home.noResultsDesc")}
                </p>
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
                    {activeCategory && ` ${t("home.resultsInCategory", { category: activeCategory })}`}
                    {search && ` ${t("home.resultsMatching", { search })}`}
                  </span>
                </div>
                <div className="vg-grid">
                  {filtered.map((plant) => (
                    <Link key={plant._id} href={`/${locale}/plants/${plant._id}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                    <article className="vg-card">
                      <div className="vg-card-img-wrap">
                        {plant.imageUrl ? (
                          <Image
                            src={plant.imageUrl}
                            alt={plant.name?.[locale as "fr" | "en"] ?? ""}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            style={{ objectFit: "cover" }}
                          />
                        ) : (
                          <div className="vg-card-placeholder">
                            <LeafIcon />
                          </div>
                        )}
                        {plant.careInstructions?.difficulty && (
                          <span
                            className="vg-difficulty-badge"
                            style={
                              {
                                "--badge-color":
                                  difficultyColor[plant.careInstructions.difficulty] ??
                                  difficultyColor.Easy,
                              } as React.CSSProperties
                            }
                          >
                            {t(`plant.difficulty${plant.careInstructions.difficulty}`)}
                          </span>
                        )}
                        {plant.stock <= 0 && (
                          <div className="vg-out-of-stock-overlay">
                            <span className="vg-out-of-stock-label">
                              {t("plant.outOfStock")}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="vg-card-body">
                        {plant.category && (
                          <span className="vg-card-cat">{plant.category}</span>
                        )}
                        <h3 className="vg-card-name">{plant.name?.[locale as "fr" | "en"] ?? plant.name?.fr ?? ""}</h3>
                        <p className="vg-card-desc">{plant.description?.[locale as "fr" | "en"] ?? plant.description?.fr ?? ""}</p>
                        {(plant.careInstructions?.wateringFrequency ||
                          plant.careInstructions?.lightRequirements) && (
                          <div className="vg-card-care">
                            {plant.careInstructions.wateringFrequency && (
                              <span className="vg-care-pill">
                                💧 {plant.careInstructions.wateringFrequency}
                              </span>
                            )}
                            {plant.careInstructions.lightRequirements && (
                              <span className="vg-care-pill">
                                ☀️ {plant.careInstructions.lightRequirements}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="vg-card-footer">
                          <span className="vg-card-price">
                            {plant.price.toFixed(2)} TND
                          </span>
                          <span
                            className={`vg-card-stock${plant.stock > 0 && plant.stock <= 5 ? " low" : ""}`}
                          >
                            {stockLabel(plant)}
                          </span>
                        </div>
                      </div>
                    </article>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </main>

        {/* FOOTER */}
        <footer className="vg-footer">
          <div className="vg-footer-inner">
            <div className="vg-footer-brand">
              <LeafIcon />
              Verde Garden
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
