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
      try {
        const [analyticsRes, ordersRes] = await Promise.all([
          fetch("/api/analytics"),
          fetch("/api/orders?page=1&limit=5"),
        ]);
        const analyticsData = await analyticsRes.json();
        const ordersData = await ordersRes.json();
        setSummary(analyticsData.summary);
        setRecentOrders(ordersData.orders ?? []);
      } catch {
        // silently handle fetch errors — UI shows empty state
      } finally {
        setLoading(false);
      }
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
