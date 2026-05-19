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
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (shippingFilter !== "all") params.set("status", shippingFilter);
      if (paymentFilter !== "all") params.set("paymentStatus", paymentFilter);
      if (methodFilter !== "all") params.set("paymentMethod", methodFilter);
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/orders?${params}`);
      const data = await res.json();
      setOrders(data.orders ?? []);
      setTotal(data.total ?? 0);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
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
        <Select value={shippingFilter} onValueChange={(v: string | null) => { if (v !== null) { setShippingFilter(v); setPage(1); } }}>
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
        <Select value={paymentFilter} onValueChange={(v: string | null) => { if (v !== null) { setPaymentFilter(v); setPage(1); } }}>
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
        <Select value={methodFilter} onValueChange={(v: string | null) => { if (v !== null) { setMethodFilter(v); setPage(1); } }}>
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
