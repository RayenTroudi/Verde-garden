# Admin Dashboard & Order Management System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete shadcn/ui-based admin dashboard for Verde Garden with full order management, status history, analytics, and inventory integration — scoped to the admin section only, public store untouched.

**Architecture:** Extend the existing `/[locale]/admin` route tree with a shared sidebar layout, new sub-pages for order detail and analytics, new API endpoints for status updates and analytics data, and an expanded Order model with `statusHistory`. shadcn/ui is installed and used only inside `src/app/[locale]/admin/` and `src/components/admin/`. The existing plant management page moves to `/admin/plants/` to free `/admin/` for the new dashboard overview.

**Tech Stack:** Next.js 15 App Router, shadcn/ui (Radix-based), Recharts (bundled with shadcn charts), Mongoose/MongoDB, NextAuth, TypeScript, Tailwind CSS (required by shadcn), next-intl

---

## File Map

### New files
| Path | Purpose |
|------|---------|
| `src/components/admin/AdminSidebar.tsx` | Sidebar nav — links, logo, logout |
| `src/components/admin/AdminShell.tsx` | Client shell: sidebar + topbar layout wrapper |
| `src/components/admin/StatsCard.tsx` | Reusable metric card |
| `src/components/admin/OrderStatusBadge.tsx` | Colored badge for payment/shipping status |
| `src/app/[locale]/admin/page.tsx` | **Replace** current plant CRUD — new dashboard overview |
| `src/app/[locale]/admin/plants/page.tsx` | Move plant CRUD here (cut from old admin/page.tsx) |
| `src/app/[locale]/admin/orders/[id]/page.tsx` | Order detail page with timeline |
| `src/app/[locale]/admin/analytics/page.tsx` | Analytics — charts, revenue, best sellers |
| `src/app/api/orders/[id]/status/route.ts` | PATCH — update order status + append history |
| `src/app/api/analytics/route.ts` | GET — dashboard stats and chart data |

### Modified files
| Path | Change |
|------|--------|
| `src/models/Order.ts` | Add `statusHistory` array, expand `shippingStatus` enum |
| `src/app/[locale]/admin/layout.tsx` | Wrap children in `AdminShell` |
| `src/app/[locale]/admin/orders/page.tsx` | Rebuild with shadcn Table, search, multi-filter, pagination |
| `tailwind.config.*` | Created by shadcn init |
| `components.json` | Created by shadcn init |

---

## Task 1: Install shadcn/ui and Tailwind

**Files:**
- Create: `tailwind.config.ts`, `components.json`, `src/app/globals-admin.css` (admin-scoped Tailwind directives)
- Modify: `src/app/globals.css` (add Tailwind base only for admin)

- [ ] **Step 1: Install dependencies**

```bash
cd d:/verde-garden
npm install tailwindcss@latest postcss autoprefixer @tailwindcss/postcss
npx shadcn@latest init --yes --base-color slate --css-variables
```

When prompted:
- Style: **Default**
- Base color: **Slate**
- CSS variables: **Yes**

- [ ] **Step 2: Verify components.json was created**

```bash
cat components.json
```

Expected: JSON with `style`, `rsc`, `tsx`, `tailwind`, `aliases` fields.

- [ ] **Step 3: Install required shadcn components**

```bash
npx shadcn@latest add card table badge button input select dialog sheet dropdown-menu tabs skeleton pagination toast separator scroll-area
```

- [ ] **Step 4: Install Recharts for charts**

```bash
npm install recharts
npx shadcn@latest add chart
```

- [ ] **Step 5: Verify no public store breakage**

Run dev server and check that `http://localhost:3000/fr` renders correctly — the public store should be unaffected since Tailwind's `content` array is scoped to admin paths.

```bash
npm run dev
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: install shadcn/ui, Tailwind, Recharts for admin dashboard"
```

---

## Task 2: Expand Order model with statusHistory

**Files:**
- Modify: `src/models/Order.ts`

- [ ] **Step 1: Update Order.ts**

Replace the entire file content with:

```typescript
import mongoose, { Schema, Document } from "mongoose";

export interface IOrderItem {
  plantId: string;
  name: { fr: string; en: string };
  imageUrl: string;
  price: number;
  quantity: number;
}

export interface IShippingInfo {
  fullName: string;
  phone: string;
  email: string;
  country: string;
  city: string;
  streetAddress: string;
  zipCode: string;
  notes?: string;
}

export interface IStatusHistoryEntry {
  status: string;
  timestamp: Date;
  note?: string;
}

export interface IOrderDocument extends Document {
  orderNumber: string;
  items: IOrderItem[];
  shipping: IShippingInfo;
  subtotal: number;
  shippingCost: number;
  total: number;
  paymentMethod: "online" | "cash_on_delivery";
  paymentStatus: "pending" | "paid" | "failed" | "cash_on_delivery";
  shippingStatus:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "out_for_delivery"
    | "delivered"
    | "cancelled";
  statusHistory: IStatusHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  plantId: { type: String, required: true },
  name: {
    fr: { type: String, required: true },
    en: { type: String, required: true },
  },
  imageUrl: { type: String, default: "" },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
});

const ShippingInfoSchema = new Schema<IShippingInfo>({
  fullName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  country: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  streetAddress: { type: String, required: true, trim: true },
  zipCode: { type: String, required: true, trim: true },
  notes: { type: String, trim: true, default: "" },
});

const StatusHistorySchema = new Schema<IStatusHistoryEntry>(
  {
    status: { type: String, required: true },
    note: { type: String, default: "" },
  },
  { timestamps: { createdAt: "timestamp", updatedAt: false } }
);

const OrderSchema = new Schema<IOrderDocument>(
  {
    orderNumber: { type: String, required: true, unique: true },
    items: { type: [OrderItemSchema], required: true },
    shipping: { type: ShippingInfoSchema, required: true },
    subtotal: { type: Number, required: true, min: 0 },
    shippingCost: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: ["online", "cash_on_delivery"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "cash_on_delivery"],
      default: "pending",
    },
    shippingStatus: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },
    statusHistory: { type: [StatusHistorySchema], default: [] },
  },
  { timestamps: true }
);

OrderSchema.pre("save", async function (next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.orderNumber = `VG-${timestamp}-${random}`;
  }
  next();
});

export default mongoose.models.Order ??
  mongoose.model<IOrderDocument>("Order", OrderSchema);
```

- [ ] **Step 2: Update the existing orders API GET to include the new statuses**

Open `src/app/api/orders/route.ts`. The filter currently only filters by `shippingStatus`. Add `confirmed`, `out_for_delivery` to the valid values it accepts (no schema change needed in route — just verify it passes through correctly). No code change needed in the route itself; the model change handles it.

- [ ] **Step 3: Commit**

```bash
git add src/models/Order.ts
git commit -m "feat: add statusHistory to Order model, expand shippingStatus enum"
```

---

## Task 3: New status update API — `/api/orders/[id]/status`

**Files:**
- Create: `src/app/api/orders/[id]/status/route.ts`

- [ ] **Step 1: Create the status route**

```typescript
// src/app/api/orders/[id]/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Order from "@/models/Order";

const VALID_SHIPPING = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

const VALID_PAYMENT = [
  "pending",
  "paid",
  "failed",
  "cash_on_delivery",
] as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { shippingStatus, paymentStatus, note } = body as {
    shippingStatus?: string;
    paymentStatus?: string;
    note?: string;
  };

  if (!shippingStatus && !paymentStatus) {
    return NextResponse.json(
      { error: "Provide shippingStatus or paymentStatus" },
      { status: 400 }
    );
  }

  if (shippingStatus && !VALID_SHIPPING.includes(shippingStatus as typeof VALID_SHIPPING[number])) {
    return NextResponse.json({ error: "Invalid shippingStatus" }, { status: 400 });
  }

  if (paymentStatus && !VALID_PAYMENT.includes(paymentStatus as typeof VALID_PAYMENT[number])) {
    return NextResponse.json({ error: "Invalid paymentStatus" }, { status: 400 });
  }

  await connectToDatabase();

  const update: Record<string, unknown> = {};
  if (shippingStatus) update.shippingStatus = shippingStatus;
  if (paymentStatus) update.paymentStatus = paymentStatus;

  const historyEntry = {
    status: shippingStatus ?? paymentStatus,
    note: note ?? "",
  };

  const order = await Order.findByIdAndUpdate(
    id,
    {
      $set: update,
      $push: { statusHistory: historyEntry },
    },
    { new: true }
  );

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ order });
}
```

- [ ] **Step 2: Verify existing `/api/orders/[id]` PATCH still works**

Open `src/app/api/orders/[id]/route.ts` and confirm it has a `PATCH` method. The new `/status` route is additive — both coexist.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/orders/[id]/status/route.ts
git commit -m "feat: add PATCH /api/orders/[id]/status for status updates with history"
```

---

## Task 4: Analytics API — `/api/analytics`

**Files:**
- Create: `src/app/api/analytics/route.ts`

- [ ] **Step 1: Create analytics route**

```typescript
// src/app/api/analytics/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Order from "@/models/Order";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  // Aggregate monthly revenue for last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [
    totalOrders,
    pendingOrders,
    paidOrders,
    codOrders,
    shippedOrders,
    deliveredOrders,
    revenueAgg,
    totalCustomers,
    monthlySales,
    topPlants,
    paymentBreakdown,
  ] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ shippingStatus: "pending" }),
    Order.countDocuments({ paymentStatus: "paid" }),
    Order.countDocuments({ paymentMethod: "cash_on_delivery" }),
    Order.countDocuments({ shippingStatus: "shipped" }),
    Order.countDocuments({ shippingStatus: "delivered" }),
    Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
    Order.distinct("shipping.email").then((e) => e.length),
    Order.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
    Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.plantId",
          name: { $first: "$items.name" },
          totalSold: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
    ]),
    Order.aggregate([
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const totalRevenue = revenueAgg[0]?.total ?? 0;

  const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlySalesFormatted = monthlySales.map((m: { _id: { year: number; month: number }; revenue: number; orders: number }) => ({
    month: `${MONTH_NAMES[m._id.month - 1]} ${m._id.year}`,
    revenue: Math.round(m.revenue * 100) / 100,
    orders: m.orders,
  }));

  return NextResponse.json({
    summary: {
      totalOrders,
      pendingOrders,
      paidOrders,
      codOrders,
      shippedOrders,
      deliveredOrders,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalCustomers,
    },
    monthlySales: monthlySalesFormatted,
    topPlants,
    paymentBreakdown,
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/analytics/route.ts
git commit -m "feat: add GET /api/analytics for dashboard stats and chart data"
```

---

## Task 5: Admin shared components

**Files:**
- Create: `src/components/admin/OrderStatusBadge.tsx`
- Create: `src/components/admin/StatsCard.tsx`
- Create: `src/components/admin/AdminSidebar.tsx`
- Create: `src/components/admin/AdminShell.tsx`

- [ ] **Step 1: Create OrderStatusBadge**

```typescript
// src/components/admin/OrderStatusBadge.tsx
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const SHIPPING_COLORS: Record<string, string> = {
  pending:          "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed:        "bg-blue-100 text-blue-800 border-blue-200",
  processing:       "bg-sky-100 text-sky-800 border-sky-200",
  shipped:          "bg-purple-100 text-purple-800 border-purple-200",
  out_for_delivery: "bg-indigo-100 text-indigo-800 border-indigo-200",
  delivered:        "bg-green-100 text-green-800 border-green-200",
  cancelled:        "bg-red-100 text-red-800 border-red-200",
};

const PAYMENT_COLORS: Record<string, string> = {
  pending:          "bg-yellow-100 text-yellow-800 border-yellow-200",
  paid:             "bg-green-100 text-green-800 border-green-200",
  failed:           "bg-red-100 text-red-800 border-red-200",
  cash_on_delivery: "bg-sky-100 text-sky-800 border-sky-200",
};

const LABELS: Record<string, string> = {
  pending:          "Pending",
  confirmed:        "Confirmed",
  processing:       "Processing",
  shipped:          "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered:        "Delivered",
  cancelled:        "Cancelled",
  paid:             "Paid",
  failed:           "Failed",
  cash_on_delivery: "Cash on Delivery",
  online:           "Online",
};

interface Props {
  status: string;
  type?: "shipping" | "payment";
}

export function OrderStatusBadge({ status, type = "shipping" }: Props) {
  const colorMap = type === "payment" ? PAYMENT_COLORS : SHIPPING_COLORS;
  const colorClass = colorMap[status] ?? "bg-gray-100 text-gray-800 border-gray-200";
  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium capitalize border", colorClass)}
    >
      {LABELS[status] ?? status.replace(/_/g, " ")}
    </Badge>
  );
}
```

- [ ] **Step 2: Create StatsCard**

```typescript
// src/components/admin/StatsCard.tsx
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accentColor?: string;
  icon?: React.ReactNode;
}

export function StatsCard({ label, value, sub, accentColor = "#4a6741", icon }: StatsCardProps) {
  return (
    <Card className="relative overflow-hidden border-0 shadow-sm">
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
        style={{ background: accentColor }}
      />
      <CardContent className="pt-5 pb-4 pl-5 pr-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
              {label}
            </p>
            <p
              className={cn(
                "font-display text-3xl font-semibold leading-none",
                "text-[#2d4a2d]"
              )}
            >
              {value}
            </p>
            {sub && (
              <p className="text-xs text-muted-foreground mt-1">{sub}</p>
            )}
          </div>
          {icon && (
            <div className="shrink-0 mt-0.5 text-muted-foreground/40">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Create AdminSidebar**

```typescript
// src/components/admin/AdminSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useLocale } from "next-intl";
import {
  LayoutDashboard,
  ShoppingCart,
  Leaf,
  BarChart2,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart, exact: false },
  { href: "/admin/plants", label: "Plants", icon: Leaf, exact: false },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart2, exact: false },
];

interface AdminSidebarProps {
  onClose?: () => void;
}

export function AdminSidebar({ onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const locale = useLocale();

  const isActive = (href: string, exact: boolean) => {
    const full = `/${locale}${href}`;
    return exact ? pathname === full : pathname.startsWith(full);
  };

  return (
    <div className="flex h-full flex-col bg-[#1a2e1b] text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.06]">
        <Link
          href={`/${locale}/admin`}
          className="flex items-center gap-2.5"
          onClick={onClose}
        >
          <img
            src="/icons/logo.svg"
            alt="Verde Garden"
            className="h-9 w-auto block"
          />
        </Link>
        <span className="ml-auto text-[10px] font-semibold uppercase tracking-widest text-[#b8d4b0]/60 border border-[#b8d4b0]/20 px-2 py-0.5 rounded">
          Admin
        </span>
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={`/${locale}${href}`}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-normal transition-colors",
                isActive(href, exact)
                  ? "bg-[#b8d4b0]/[0.12] text-[#b8d4b0] font-medium"
                  : "text-white/50 hover:bg-white/[0.05] hover:text-white/80"
              )}
            >
              <Icon size={17} />
              {label}
            </Link>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/[0.06] space-y-2">
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors py-1"
        >
          <ExternalLink size={13} />
          View Storefront
        </Link>
        <Separator className="bg-white/[0.06]" />
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-xs text-red-400/70 hover:text-red-400 hover:bg-red-400/10 px-2"
          onClick={() => signOut({ callbackUrl: `/${locale}` })}
        >
          <LogOut size={14} />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create AdminShell**

```typescript
// src/components/admin/AdminShell.tsx
"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { AdminSidebar } from "./AdminSidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface AdminShellProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export function AdminShell({ children, title, description }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 z-50 border-r border-white/[0.04]">
        <AdminSidebar />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-64 bg-[#1a2e1b] border-none">
          <AdminSidebar onClose={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Topbar */}
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-3 px-4 lg:px-6 h-16">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden shrink-0"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={20} />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-semibold text-[#2d4a2d] truncate">
                {title}
              </h1>
              {description && (
                <p className="text-xs text-slate-500 truncate hidden sm:block">
                  {description}
                </p>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/
git commit -m "feat: add admin shared components (sidebar, shell, stats card, status badge)"
```

---

## Task 6: Update admin layout to use AdminShell

**Files:**
- Modify: `src/app/[locale]/admin/layout.tsx`

- [ ] **Step 1: The layout stays a server component for auth, but children are wrapped**

The `AdminShell` is client-only (for mobile state). The layout passes `title` via a `children` pattern — since layout can't receive page-level props, pages will own the shell wrapper. Update layout to just handle auth redirect, no visual wrapping:

```typescript
// src/app/[locale]/admin/layout.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { locale } = await params;

  if (!session) {
    redirect(`/${locale}/login`);
  }

  return <>{children}</>;
}
```

Note: Each admin page wraps its own content in `<AdminShell title="...">` — this gives pages control over their title and description shown in the topbar.

- [ ] **Step 2: Commit**

```bash
git add src/app/[locale]/admin/layout.tsx
git commit -m "chore: keep admin layout minimal, shell ownership moves to pages"
```

---

## Task 7: New Dashboard Overview page

**Files:**
- Modify: `src/app/[locale]/admin/page.tsx` (replace with dashboard overview)

- [ ] **Step 1: Replace the plant CRUD dashboard with a stats overview**

```typescript
// src/app/[locale]/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { StatsCard } from "@/components/admin/StatsCard";
import {
  ShoppingCart, Clock, CheckCircle, Truck,
  Package, Users, DollarSign, Leaf
} from "lucide-react";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";

interface Summary {
  totalOrders: number;
  pendingOrders: number;
  paidOrders: number;
  codOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  totalRevenue: number;
  totalCustomers: number;
}

interface RecentOrder {
  _id: string;
  orderNumber: string;
  shipping: { fullName: string; email: string };
  total: number;
  shippingStatus: string;
  paymentStatus: string;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const locale = useLocale();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [analyticsRes, ordersRes] = await Promise.all([
        fetch("/api/analytics"),
        fetch("/api/orders?page=1&limit=5"),
      ]);
      const analyticsData = await analyticsRes.json();
      const ordersData = await ordersRes.json();
      setSummary(analyticsData.summary);
      setRecentOrders(ordersData.orders ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const STATS = summary
    ? [
        { label: "Total Orders", value: summary.totalOrders, icon: <ShoppingCart size={22} />, color: "#4a6741" },
        { label: "Pending", value: summary.pendingOrders, icon: <Clock size={22} />, color: "#c4914b" },
        { label: "Paid Orders", value: summary.paidOrders, icon: <CheckCircle size={22} />, color: "#4a9967" },
        { label: "Cash on Delivery", value: summary.codOrders, icon: <Package size={22} />, color: "#0369a1" },
        { label: "Shipped", value: summary.shippedOrders, icon: <Truck size={22} />, color: "#7c3aed" },
        { label: "Delivered", value: summary.deliveredOrders, icon: <Leaf size={22} />, color: "#166534" },
        { label: "Total Revenue", value: `${summary.totalRevenue.toFixed(2)} TND`, icon: <DollarSign size={22} />, color: "#4a6741" },
        { label: "Customers", value: summary.totalCustomers, icon: <Users size={22} />, color: "#0891b2" },
      ]
    : [];

  return (
    <AdminShell title="Dashboard" description="Store overview and recent activity">
      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))
          : STATS.map((s) => (
              <StatsCard
                key={s.label}
                label={s.label}
                value={s.value}
                icon={s.icon}
                accentColor={s.color}
              />
            ))}
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold text-[#2d4a2d]">
            Recent Orders
          </CardTitle>
          <Link href={`/${locale}/admin/orders`}>
            <Button variant="ghost" size="sm" className="text-xs text-slate-500 hover:text-[#4a6741]">
              View all →
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No orders yet</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentOrders.map((order) => (
                <div key={order._id} className="flex items-center gap-3 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-[#4a6741]">
                        {order.orderNumber}
                      </span>
                      <OrderStatusBadge status={order.shippingStatus} type="shipping" />
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {order.shipping.fullName} · {order.shipping.email}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-[#2d4a2d]">
                      {order.total.toFixed(2)} TND
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Link href={`/${locale}/admin/orders/${order._id}`}>
                    <Button variant="outline" size="sm" className="text-xs h-7 px-2">
                      View
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AdminShell>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/[locale]/admin/page.tsx
git commit -m "feat: replace admin page with dashboard overview (stats + recent orders)"
```

---

## Task 8: Move plant management to `/admin/plants/`

**Files:**
- Create: `src/app/[locale]/admin/plants/page.tsx` (copy + adapt existing admin/page.tsx plant CRUD)

- [ ] **Step 1: Create the plants directory and page**

Create `src/app/[locale]/admin/plants/page.tsx`. Copy the entire content of the **old** `src/app/[locale]/admin/page.tsx` (the plant CRUD version, before Task 7 overwrites it — or restore from git if needed). Then wrap the top-level return in `<AdminShell title="Plants" description="Manage your plant inventory">...</AdminShell>`.

The simplest approach — add two imports at the top and wrap:

```typescript
// Add at top of the file:
import { AdminShell } from "@/components/admin/AdminShell";

// Wrap the entire return:
return (
  <AdminShell title="Plants" description="Manage your plant inventory">
    {/* existing JSX from the old admin page goes here */}
  </AdminShell>
);
```

Important: Remove the old sidebar/topbar HTML from the plant CRUD since `AdminShell` provides that now. Keep all state, form logic, and the `PlantCard` component.

- [ ] **Step 2: Update AdminSidebar href for Plants**

`AdminSidebar.tsx` already links to `/admin/plants` — no change needed.

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/admin/plants/
git commit -m "feat: move plant management to /admin/plants with AdminShell wrapper"
```

---

## Task 9: Rebuild Orders list page with shadcn

**Files:**
- Modify: `src/app/[locale]/admin/orders/page.tsx`

- [ ] **Step 1: Replace the orders page**

```typescript
// src/app/[locale]/admin/orders/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";

interface Order {
  _id: string;
  orderNumber: string;
  shipping: { fullName: string; email: string; phone: string };
  items: { name: { fr: string; en: string }; quantity: number; price: number }[];
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  shippingStatus: string;
  createdAt: string;
}

const SHIPPING_STATUSES = [
  "pending", "confirmed", "processing", "shipped", "out_for_delivery", "delivered", "cancelled",
];
const PAYMENT_STATUSES = ["pending", "paid", "failed", "cash_on_delivery"];
const PAYMENT_METHODS = ["online", "cash_on_delivery"];

export default function AdminOrdersPage() {
  const locale = useLocale();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [shippingFilter, setShippingFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (shippingFilter !== "all") params.set("status", shippingFilter);
    if (paymentFilter !== "all") params.set("paymentStatus", paymentFilter);
    if (methodFilter !== "all") params.set("paymentMethod", methodFilter);
    if (search.trim()) params.set("search", search.trim());
    const res = await fetch(`/api/orders?${params}`);
    const data = await res.json();
    setOrders(data.orders ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [page, shippingFilter, paymentFilter, methodFilter, search]);

  useEffect(() => {
    const t = setTimeout(fetchOrders, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [fetchOrders, search]);

  const totalPages = Math.ceil(total / LIMIT);

  const filtered = orders.filter((o) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.shipping.fullName.toLowerCase().includes(q) ||
      o.shipping.email.toLowerCase().includes(q) ||
      o.shipping.phone.includes(q)
    );
  });

  return (
    <AdminShell title="Orders" description={`${total} orders total`}>
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by name, email, phone, order ID…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Select value={shippingFilter} onValueChange={(v) => { setShippingFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40 h-9 text-sm">
            <SlidersHorizontal size={14} className="mr-1.5 text-slate-400" />
            <SelectValue placeholder="Delivery" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Delivery</SelectItem>
            {SHIPPING_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={paymentFilter} onValueChange={(v) => { setPaymentFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40 h-9 text-sm">
            <SelectValue placeholder="Payment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payment</SelectItem>
            {PAYMENT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={methodFilter} onValueChange={(v) => { setMethodFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40 h-9 text-sm">
            <SelectValue placeholder="Method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            {PAYMENT_METHODS.map((m) => (
              <SelectItem key={m} value={m}>{m.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80">
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">Order</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">Customer</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500 hidden md:table-cell">Items</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500 hidden lg:table-cell">Date</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payment</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">Delivery</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500 text-right">Total</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : filtered.length === 0
              ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-slate-400 text-sm">
                    No orders found
                  </TableCell>
                </TableRow>
              )
              : filtered.map((order) => (
                <TableRow key={order._id} className="hover:bg-slate-50/60 transition-colors">
                  <TableCell>
                    <span className="font-mono text-xs font-semibold text-[#4a6741]">
                      {order.orderNumber}
                    </span>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium text-slate-800">{order.shipping.fullName}</p>
                    <p className="text-xs text-slate-400">{order.shipping.email}</p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="secondary" className="text-xs">
                      {order.items.reduce((s, i) => s + i.quantity, 0)} items
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 hidden lg:table-cell">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.paymentStatus} type="payment" />
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.shippingStatus} type="shipping" />
                  </TableCell>
                  <TableCell className="text-right font-semibold text-sm text-[#2d4a2d]">
                    {order.total.toFixed(2)} TND
                  </TableCell>
                  <TableCell>
                    <Link href={`/${locale}/admin/orders/${order._id}`}>
                      <Button variant="outline" size="sm" className="h-7 text-xs px-2.5">
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-slate-500">
          <span>
            Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
          </span>
          <div className="flex gap-1.5">
            <Button
              variant="outline" size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline" size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
```

- [ ] **Step 2: Update GET /api/orders to support search and paymentStatus/paymentMethod filters**

Open `src/app/api/orders/route.ts`. Update the GET handler filter block:

```typescript
// Replace the filter block (lines ~90-101) with:
const { searchParams } = new URL(req.url);
const page = parseInt(searchParams.get("page") ?? "1");
const limit = parseInt(searchParams.get("limit") ?? "20");
const status = searchParams.get("status");
const paymentStatus = searchParams.get("paymentStatus");
const paymentMethod = searchParams.get("paymentMethod");
const search = searchParams.get("search");

const filter: Record<string, unknown> = {};
if (status) filter.shippingStatus = status;
if (paymentStatus) filter.paymentStatus = paymentStatus;
if (paymentMethod) filter.paymentMethod = paymentMethod;
if (search) {
  filter.$or = [
    { orderNumber: { $regex: search, $options: "i" } },
    { "shipping.fullName": { $regex: search, $options: "i" } },
    { "shipping.email": { $regex: search, $options: "i" } },
    { "shipping.phone": { $regex: search, $options: "i" } },
  ];
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/admin/orders/page.tsx src/app/api/orders/route.ts
git commit -m "feat: rebuild orders list with shadcn Table, search, multi-filter, pagination"
```

---

## Task 10: Order detail page

**Files:**
- Create: `src/app/[locale]/admin/orders/[id]/page.tsx`

- [ ] **Step 1: Create order detail page**

```typescript
// src/app/[locale]/admin/orders/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { ArrowLeft, Clock, MapPin, Package, CreditCard } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useLocale } from "next-intl";

interface OrderItem {
  plantId: string;
  name: { fr: string; en: string };
  imageUrl: string;
  price: number;
  quantity: number;
}

interface StatusHistoryEntry {
  status: string;
  timestamp: string;
  note?: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
  shipping: {
    fullName: string;
    phone: string;
    email: string;
    country: string;
    city: string;
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
  statusHistory: StatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

const SHIPPING_STATUSES = [
  "pending", "confirmed", "processing", "shipped", "out_for_delivery", "delivered", "cancelled",
];
const PAYMENT_STATUSES = ["pending", "paid", "failed", "cash_on_delivery"];

export default function OrderDetailPage() {
  const params = useParams();
  const locale = useLocale();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [newShipping, setNewShipping] = useState("");
  const [newPayment, setNewPayment] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetch(`/api/orders/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        setOrder(d.order ?? d);
        setNewShipping(d.order?.shippingStatus ?? d.shippingStatus ?? "");
        setNewPayment(d.order?.paymentStatus ?? d.paymentStatus ?? "");
        setLoading(false);
      });
  }, [params.id]);

  const handleUpdateStatus = async () => {
    if (!order) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/orders/${order._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingStatus: newShipping !== order.shippingStatus ? newShipping : undefined,
          paymentStatus: newPayment !== order.paymentStatus ? newPayment : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOrder(data.order);
      toast({ title: "Order updated", description: "Status saved successfully." });
    } catch (err) {
      toast({
        title: "Update failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <AdminShell title="Order Detail">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </AdminShell>
    );
  }

  if (!order) {
    return (
      <AdminShell title="Order Not Found">
        <p className="text-slate-500">This order does not exist.</p>
        <Link href={`/${locale}/admin/orders`}>
          <Button variant="outline" className="mt-4">Back to Orders</Button>
        </Link>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title={order.orderNumber}
      description={`Placed on ${new Date(order.createdAt).toLocaleDateString()}`}
    >
      <Toaster />

      {/* Back link */}
      <Link href={`/${locale}/admin/orders`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#4a6741] mb-4 transition-colors">
        <ArrowLeft size={15} />
        Back to Orders
      </Link>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left: customer + items + timeline */}
        <div className="lg:col-span-2 space-y-4">
          {/* Customer Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                <MapPin size={15} /> Customer & Shipping
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Name</p>
                <p className="font-medium">{order.shipping.fullName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Phone</p>
                <p className="font-medium">{order.shipping.phone}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Email</p>
                <p className="font-medium">{order.shipping.email}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Address</p>
                <p className="font-medium">
                  {order.shipping.streetAddress}, {order.shipping.zipCode},{" "}
                  {order.shipping.city}, {order.shipping.country}
                </p>
              </div>
              {order.shipping.notes && (
                <div className="col-span-2">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Notes</p>
                  <p className="text-slate-600 text-sm italic">{order.shipping.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                <Package size={15} /> Order Items
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="divide-y divide-slate-100">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 py-3">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name.en}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300 text-lg">
                          🌿
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {item.name[locale as "fr" | "en"] ?? item.name.en}
                      </p>
                      <p className="text-xs text-slate-400">
                        {item.price.toFixed(2)} TND × {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-[#2d4a2d] shrink-0">
                      {(item.price * item.quantity).toFixed(2)} TND
                    </p>
                  </div>
                ))}
              </div>
              <Separator className="my-3" />
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span>{order.subtotal.toFixed(2)} TND</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Shipping</span>
                  <span>
                    {order.shippingCost === 0 ? (
                      <span className="text-green-600 font-medium">Free</span>
                    ) : (
                      `${order.shippingCost.toFixed(2)} TND`
                    )}
                  </span>
                </div>
                <div className="flex justify-between font-semibold text-[#2d4a2d] text-base pt-1">
                  <span>Total</span>
                  <span>{order.total.toFixed(2)} TND</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Timeline */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                  <Clock size={15} /> Status History
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="relative pl-5">
                  <div className="absolute left-1.5 top-2 bottom-2 w-px bg-slate-200" />
                  {[...order.statusHistory].reverse().map((entry, i) => (
                    <div key={i} className="relative mb-4 last:mb-0">
                      <div className="absolute -left-3.5 top-1 w-2 h-2 rounded-full bg-[#4a6741] border-2 border-white" />
                      <div className="ml-1">
                        <OrderStatusBadge status={entry.status} type="shipping" />
                        <p className="text-xs text-slate-400 mt-0.5">
                          {new Date(entry.timestamp).toLocaleString()}
                        </p>
                        {entry.note && (
                          <p className="text-xs text-slate-500 mt-0.5 italic">{entry.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: status management + payment info */}
        <div className="space-y-4">
          {/* Payment Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                <CreditCard size={15} /> Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Method</p>
                <OrderStatusBadge status={order.paymentMethod} type="payment" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Status</p>
                <OrderStatusBadge status={order.paymentStatus} type="payment" />
              </div>
            </CardContent>
          </Card>

          {/* Status Management */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-600">
                Update Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 mb-1.5 font-medium">Delivery Status</p>
                <Select value={newShipping} onValueChange={setNewShipping}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SHIPPING_STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="text-sm">
                        {s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1.5 font-medium">Payment Status</p>
                <Select value={newPayment} onValueChange={setNewPayment}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="text-sm">
                        {s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full bg-[#4a6741] hover:bg-[#3a5631] text-white h-9 text-sm"
                disabled={
                  updating ||
                  (newShipping === order.shippingStatus && newPayment === order.paymentStatus)
                }
                onClick={handleUpdateStatus}
              >
                {updating ? "Saving…" : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
```

- [ ] **Step 2: Verify `/api/orders/[id]` GET returns the `order` field**

Open `src/app/api/orders/[id]/route.ts`. Check that the GET handler returns `{ order }`. If it returns the order directly, the detail page handles both shapes with `d.order ?? d`.

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/admin/orders/[id]/page.tsx
git commit -m "feat: add order detail page with timeline, items, and status management"
```

---

## Task 11: Analytics page

**Files:**
- Create: `src/app/[locale]/admin/analytics/page.tsx`

- [ ] **Step 1: Create analytics page**

```typescript
// src/app/[locale]/admin/analytics/page.tsx
"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { StatsCard } from "@/components/admin/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";

interface AnalyticsData {
  summary: {
    totalOrders: number;
    totalRevenue: number;
    paidOrders: number;
    deliveredOrders: number;
  };
  monthlySales: { month: string; revenue: number; orders: number }[];
  topPlants: { _id: string; name: { fr: string; en: string }; totalSold: number; revenue: number }[];
  paymentBreakdown: { _id: string; count: number }[];
}

const CHART_COLORS = ["#4a6741", "#7fa86b", "#c4914b", "#0369a1", "#7c3aed"];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, []);

  return (
    <AdminShell title="Analytics" description="Revenue, sales trends, and top performers">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
          : [
              { label: "Total Orders", value: data!.summary.totalOrders, color: "#4a6741" },
              { label: "Total Revenue", value: `${data!.summary.totalRevenue.toFixed(2)} TND`, color: "#4a9967" },
              { label: "Paid Orders", value: data!.summary.paidOrders, color: "#0369a1" },
              { label: "Delivered", value: data!.summary.deliveredOrders, color: "#166534" },
            ].map((s) => (
              <StatsCard key={s.label} label={s.label} value={s.value} accentColor={s.color} />
            ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 mb-4">
        {/* Monthly Revenue Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">Monthly Revenue (TND)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data!.monthlySales} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
                    formatter={(v: number) => [`${v.toFixed(2)} TND`, "Revenue"]}
                  />
                  <Bar dataKey="revenue" fill="#4a6741" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Monthly Orders Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">Order Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data!.monthlySales} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
                    formatter={(v: number) => [v, "Orders"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="#7fa86b"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#7fa86b" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Selling Plants */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">Best-Selling Plants</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : data!.topPlants.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">No sales data yet</p>
            ) : (
              <div className="space-y-2">
                {data!.topPlants.map((p, i) => (
                  <div key={p._id} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 w-5 shrink-0">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">
                        {p.name?.en ?? p.name?.fr ?? "Unknown"}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <div
                          className="h-1.5 rounded-full bg-[#4a6741]"
                          style={{
                            width: `${Math.round((p.totalSold / (data!.topPlants[0]?.totalSold || 1)) * 100)}%`,
                            maxWidth: "100%",
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold text-slate-600">{p.totalSold} sold</p>
                      <p className="text-xs text-slate-400">{p.revenue.toFixed(0)} TND</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Method Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : data!.paymentBreakdown.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={data!.paymentBreakdown.map((d) => ({
                      name: d._id.replace(/_/g, " "),
                      value: d.count,
                    }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {data!.paymentBreakdown.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={(v) => [v, "Orders"]}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => (
                      <span style={{ fontSize: 11, color: "#64748b" }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/[locale]/admin/analytics/page.tsx
git commit -m "feat: add analytics page with revenue charts, order trends, and best sellers"
```

---

## Task 12: Final verification

- [ ] **Step 1: Run build to catch TypeScript errors**

```bash
npm run build
```

Fix any TypeScript or import errors before proceeding. Common issues:
- shadcn `use-toast` import path: `@/hooks/use-toast` (verify this exists after shadcn install; if not, it may be `@/components/ui/use-toast`)
- Recharts types: ensure `recharts` types are installed (bundled with recharts)

- [ ] **Step 2: Run dev server and manually verify each admin page**

```bash
npm run dev
```

Visit in browser:
- `http://localhost:3000/fr/admin` — Dashboard with 8 stat cards + recent orders
- `http://localhost:3000/fr/admin/orders` — Orders table with search + filters
- `http://localhost:3000/fr/admin/orders/<any_id>` — Order detail with timeline
- `http://localhost:3000/fr/admin/plants` — Existing plant CRUD (should work unchanged)
- `http://localhost:3000/fr/admin/analytics` — Charts and stats
- `http://localhost:3000/fr` — Public store (must be unchanged)

- [ ] **Step 3: Test status update flow**

1. Open an order detail page
2. Change delivery status to "Confirmed"
3. Click "Save Changes"
4. Verify the Status History section updates with a new entry

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete admin dashboard with orders, analytics, and status history"
```

---

## Quick reference: status values

| Field | Values |
|-------|--------|
| `shippingStatus` | `pending`, `confirmed`, `processing`, `shipped`, `out_for_delivery`, `delivered`, `cancelled` |
| `paymentStatus` | `pending`, `paid`, `failed`, `cash_on_delivery` |
| `paymentMethod` | `online`, `cash_on_delivery` |
