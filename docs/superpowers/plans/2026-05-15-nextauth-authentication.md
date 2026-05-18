# NextAuth Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add NextAuth v4 credentials-based authentication to protect the Verde Garden admin panel and mutation API routes.

**Architecture:** JWT session strategy with a single hardcoded admin user verified via bcryptjs. A root-level middleware.ts guards all /admin routes server-side. API mutation routes (POST/PUT/DELETE) check getServerSession() and return 401 if unauthenticated. The login page is a minimal light card on the existing cream background.

**Tech Stack:** next-auth@4.x, bcryptjs, @types/bcryptjs, Next.js 15 App Router, TypeScript

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/lib/auth.ts` | NextAuth config object (shared between route + middleware) |
| Create | `src/app/api/auth/[...nextauth]/route.ts` | NextAuth App Router handler |
| Create | `src/app/(auth)/login/page.tsx` | Login form page |
| Create | `middleware.ts` | Route protection for /admin |
| Create | `scripts/hash-password.js` | One-time password hash generator |
| Modify | `src/app/api/plants/route.ts` | Guard POST with session check |
| Modify | `src/app/api/plants/[id]/route.ts` | Guard PUT/DELETE with session check |
| Modify | `src/app/admin/page.tsx` | Add logout button to topbar |
| Modify | `.env.example` | Add NextAuth env vars |
| Modify | `next.config.ts` | No change needed |

---

## Task 1: Install Dependencies

**Files:** none (package.json updated by npm)

- [ ] **Step 1: Install next-auth and bcryptjs**

```bash
npm install next-auth@4 bcryptjs
npm install --save-dev @types/bcryptjs
```

Expected output: packages added, no peer dependency errors.

- [ ] **Step 2: Verify installation**

```bash
node -e "require('next-auth'); require('bcryptjs'); console.log('OK')"
```

Expected: `OK`

---

## Task 2: Create Password Hash Utility Script

**Files:**
- Create: `scripts/hash-password.js`

This is a one-time Node.js script the user runs to generate their bcrypt hash.

- [ ] **Step 1: Create `scripts/hash-password.js`**

```js
const bcrypt = require('bcryptjs');

const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/hash-password.js <your-password>');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);
console.log('\nYour bcrypt hash (paste into .env as NEXT_AUTH_ADMIN_PASSWORD):');
console.log(hash);
```

- [ ] **Step 2: Run it to generate a hash for testing**

```bash
node scripts/hash-password.js adminpass123
```

Expected: prints a `$2a$12$...` hash string. Copy it — you'll need it for `.env`.

- [ ] **Step 3: Update `.env` with NextAuth variables**

Open `.env` (or create it from `.env.example`) and add:

```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=verde-garden-super-secret-change-in-production-32chars
NEXT_AUTH_ADMIN_USERNAME=admin
NEXT_AUTH_ADMIN_PASSWORD=<paste the hash from step 2>
```

- [ ] **Step 4: Update `.env.example`**

Open `d:\verde-garden\.env.example` and append:

```
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-32-char-secret-here
NEXT_AUTH_ADMIN_USERNAME=admin
NEXT_AUTH_ADMIN_PASSWORD=your-bcrypt-hashed-password-here
```

---

## Task 3: Create NextAuth Config

**Files:**
- Create: `src/lib/auth.ts`

This file exports the `authOptions` object used by both the route handler and `getServerSession()`.

- [ ] **Step 1: Create `src/lib/auth.ts`**

```ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const adminUsername = process.env.NEXT_AUTH_ADMIN_USERNAME ?? "admin";
        const adminPasswordHash = process.env.NEXT_AUTH_ADMIN_PASSWORD ?? "";

        if (credentials.username !== adminUsername) return null;

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          adminPasswordHash
        );
        if (!passwordMatch) return null;

        return { id: "1", name: adminUsername, email: `${adminUsername}@verde-garden.local` };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 86400,
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = "admin";
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
};
```

---

## Task 4: Create NextAuth Route Handler

**Files:**
- Create: `src/app/api/auth/[...nextauth]/route.ts`

- [ ] **Step 1: Create directory and route file**

```bash
mkdir -p "src/app/api/auth/[...nextauth]"
```

- [ ] **Step 2: Create `src/app/api/auth/[...nextauth]/route.ts`**

```ts
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

---

## Task 5: Create Middleware

**Files:**
- Create: `middleware.ts` (at project root, next to `package.json`)

- [ ] **Step 1: Create `middleware.ts`**

```ts
export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
```

This uses NextAuth's built-in middleware which reads the JWT cookie and redirects unauthenticated requests to the `signIn` page configured in `authOptions` (`/login`).

---

## Task 6: Create Login Page

**Files:**
- Create: `src/app/(auth)/login/page.tsx`

The page uses inline styles matching the existing Verde Garden design system (CSS variables from `globals.css`). It is a client component because it calls `signIn()`.

- [ ] **Step 1: Create `src/app/(auth)/login/` directory**

```bash
mkdir -p "src/app/(auth)/login"
```

- [ ] **Step 2: Create `src/app/(auth)/login/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
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
      setError("Invalid username or password.");
    } else {
      router.push("/admin");
    }
  };

  return (
    <>
      <style>{`
        .login-root {
          min-height: 100vh;
          background: var(--cream);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          font-family: var(--font-body);
        }
        .login-card {
          background: var(--white);
          border-radius: var(--radius-lg);
          padding: 2.5rem 2rem;
          width: 100%;
          max-width: 400px;
          box-shadow: var(--shadow-md);
          border: 1px solid var(--parchment);
        }
        .login-logo {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          margin-bottom: 0.5rem;
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
            <div className="login-logo-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="login-logo-text">Verde Garden</span>
          </div>
          <span className="login-badge">Admin Access</span>

          <h1 className="login-title">Sign in</h1>
          <p className="login-sub">Enter your credentials to access the admin panel.</p>

          <form onSubmit={handleSubmit} noValidate>
            {error && <div className="login-error">{error}</div>}

            <div className="login-field">
              <label className="login-label" htmlFor="username">Username</label>
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
              <label className="login-label" htmlFor="password">Password</label>
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
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
```

---

## Task 7: Add SessionProvider to Root Layout

**Files:**
- Modify: `src/app/layout.tsx`

NextAuth's `useSession()` hook (used by the admin page for logout) requires a `SessionProvider` wrapping the app. Because `SessionProvider` is a client component, we extract it into a thin wrapper.

- [ ] **Step 1: Create `src/app/providers.tsx`**

```tsx
"use client";

import { SessionProvider } from "next-auth/react";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

- [ ] **Step 2: Update `src/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Verde Garden | Premium Plant Marketplace",
  description:
    "Discover curated botanical treasures — premium plants for your home and garden, thoughtfully grown and ready to find their home with you.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

---

## Task 8: Add Logout to Admin Panel Topbar

**Files:**
- Modify: `src/app/admin/page.tsx`

Add `signOut` import and a logout button in the topbar. The topbar currently has a right-side slot with the "Add Plant" button — we add the logout button alongside it.

- [ ] **Step 1: Add signOut import at the top of `src/app/admin/page.tsx`**

Find the existing imports block (line 1-6) and add:

```tsx
import { signOut } from "next-auth/react";
```

So the top of the file becomes:

```tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
```

- [ ] **Step 2: Add logout button CSS to the `<style>` block**

Inside the existing `<style>{`...`}</style>` block, append before the closing backtick:

```css
        /* ── AUTH ── */
        .adm-logout-btn {
          display: flex; align-items: center; gap: 0.45rem;
          background: rgba(196,113,75,0.08); color: var(--terra);
          font-size: 0.78rem; font-weight: 500;
          padding: 0.5rem 1rem; border-radius: 100px;
          border: 1px solid rgba(196,113,75,0.2);
          cursor: pointer; transition: all var(--transition);
          font-family: var(--font-body);
        }
        .adm-logout-btn:hover {
          background: rgba(196,113,75,0.16);
          border-color: rgba(196,113,75,0.35);
        }
        .adm-topbar-actions {
          display: flex; align-items: center; gap: 0.75rem;
        }
```

- [ ] **Step 3: Update the topbar right-side slot in the JSX**

Find this block in the JSX (around line 788):

```tsx
            {tab !== "add" && (
              <button
                className="adm-add-btn"
                onClick={() => { resetForm(); setTab("add"); }}
              >
                <PlusIcon />
                Add Plant
              </button>
            )}
```

Replace it with:

```tsx
            <div className="adm-topbar-actions">
              {tab !== "add" && (
                <button
                  className="adm-add-btn"
                  onClick={() => { resetForm(); setTab("add"); }}
                >
                  <PlusIcon />
                  Add Plant
                </button>
              )}
              <button
                className="adm-logout-btn"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                Sign out
              </button>
            </div>
```

---

## Task 9: Protect API Mutation Routes

**Files:**
- Modify: `src/app/api/plants/route.ts`
- Modify: `src/app/api/plants/[id]/route.ts`

- [ ] **Step 1: Update `src/app/api/plants/route.ts`**

Replace the entire file content with:

```ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Plant from "@/models/Plant";

export async function GET() {
  try {
    await connectToDatabase();
    const plants = await Plant.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json(plants);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch plants" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const body = await request.json();

    const plant = new Plant({
      name: body.name,
      description: body.description,
      price: Number(body.price),
      imageUrl: body.imageUrl ?? "",
      category: body.category ?? "General",
      careInstructions: {
        wateringFrequency: body.careInstructions?.wateringFrequency ?? "",
        lightRequirements: body.careInstructions?.lightRequirements ?? "",
        difficulty: body.careInstructions?.difficulty ?? "Easy",
      },
      stock: Number(body.stock) ?? 0,
    });

    await plant.save();
    return NextResponse.json(plant, { status: 201 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to create plant";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
```

- [ ] **Step 2: Update `src/app/api/plants/[id]/route.ts`**

Replace the entire file content with:

```ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Plant from "@/models/Plant";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await connectToDatabase();
    const body = await request.json();

    const plant = await Plant.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!plant) {
      return NextResponse.json({ error: "Plant not found" }, { status: 404 });
    }

    return NextResponse.json(plant);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to update plant";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await connectToDatabase();

    const plant = await Plant.findByIdAndDelete(id);

    if (!plant) {
      return NextResponse.json({ error: "Plant not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Plant deleted successfully" });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete plant" },
      { status: 500 }
    );
  }
}
```

---

## Task 10: Smoke Test

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verify public homepage works**

Open `http://localhost:3000` — should load the plant marketplace without auth.

- [ ] **Step 3: Verify /admin redirects to /login**

Open `http://localhost:3000/admin` — should redirect to `http://localhost:3000/login`.

- [ ] **Step 4: Verify login with wrong credentials shows error**

On the login page, enter wrong username/password → should show "Invalid username or password."

- [ ] **Step 5: Verify login with correct credentials works**

Enter `admin` and the plain-text password you hashed in Task 2 → should redirect to `/admin` and show the dashboard.

- [ ] **Step 6: Verify logout works**

Click "Sign out" in the admin topbar → should redirect to `/login`.

- [ ] **Step 7: Verify GET /api/plants is public**

```bash
curl http://localhost:3000/api/plants
```

Expected: JSON array of plants (or empty array), no auth error.

- [ ] **Step 8: Verify POST /api/plants is protected**

```bash
curl -X POST http://localhost:3000/api/plants -H "Content-Type: application/json" -d "{}"
```

Expected: `{"error":"Unauthorized"}` with status 401.
