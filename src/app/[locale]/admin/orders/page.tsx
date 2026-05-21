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
import { Search, SlidersHorizontal, Loader2, ChevronRight, Package } from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

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

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  paid: "Paid",
  failed: "Failed",
  cash_on_delivery: "Cash on Delivery",
  online: "Online",
};

export default function AdminOrdersPage() {
  const locale = useLocale();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [shippingFilter, setShippingFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
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

  const handleInlineStatusUpdate = async (orderId: string, shippingStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shippingStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, shippingStatus } : o))
      );
      toast({ title: "Status updated", description: `Delivery set to "${STATUS_LABELS[shippingStatus] ?? shippingStatus.replace(/_/g, " ")}"` });
    } catch (err) {
      toast({
        title: "Update failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

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

  const activeFilterCount = [
    shippingFilter !== "all",
    paymentFilter !== "all",
    methodFilter !== "all",
  ].filter(Boolean).length;

  return (
    <AdminShell title="Orders" description={`${total} orders total`}>
      <Toaster />

      {/* Search + filter bar */}
      <div className="space-y-2 mb-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search orders…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 h-9 text-sm"
            />
          </div>
          {/* Mobile filter toggle */}
          <Button
            variant="outline"
            size="sm"
            className="sm:hidden h-9 px-3 gap-1.5 shrink-0"
            onClick={() => setFiltersOpen((v) => !v)}
          >
            <SlidersHorizontal size={14} />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-0.5 bg-[#4a6741] text-white text-[10px] font-semibold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                {activeFilterCount}
              </span>
            )}
          </Button>
          {/* Desktop filters always visible */}
          <div className="hidden sm:flex gap-2">
            <Select value={shippingFilter} onValueChange={(v) => { if (v) { setShippingFilter(v); setPage(1); } }}>
              <SelectTrigger className="w-36 h-9 text-sm">
                <SlidersHorizontal size={13} className="mr-1.5 text-slate-400 shrink-0" />
                <SelectValue placeholder="Delivery" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Delivery</SelectItem>
                {SHIPPING_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_LABELS[s] ?? s.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={(v) => { if (v) { setPaymentFilter(v); setPage(1); } }}>
              <SelectTrigger className="w-36 h-9 text-sm">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment</SelectItem>
                {PAYMENT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_LABELS[s] ?? s.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={methodFilter} onValueChange={(v) => { if (v) { setMethodFilter(v); setPage(1); } }}>
              <SelectTrigger className="w-36 h-9 text-sm">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>{STATUS_LABELS[m] ?? m.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Mobile collapsible filters */}
        {filtersOpen && (
          <div className="sm:hidden grid grid-cols-1 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <Select value={shippingFilter} onValueChange={(v) => { if (v) { setShippingFilter(v); setPage(1); } }}>
              <SelectTrigger className="h-9 text-sm w-full">
                <SlidersHorizontal size={13} className="mr-1.5 text-slate-400 shrink-0" />
                <SelectValue placeholder="Delivery status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Delivery</SelectItem>
                {SHIPPING_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_LABELS[s] ?? s.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={(v) => { if (v) { setPaymentFilter(v); setPage(1); } }}>
              <SelectTrigger className="h-9 text-sm w-full">
                <SelectValue placeholder="Payment status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment</SelectItem>
                {PAYMENT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_LABELS[s] ?? s.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={methodFilter} onValueChange={(v) => { if (v) { setMethodFilter(v); setPage(1); } }}>
              <SelectTrigger className="h-9 text-sm w-full">
                <SelectValue placeholder="Payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>{STATUS_LABELS[m] ?? m.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-slate-500 h-8"
                onClick={() => {
                  setShippingFilter("all");
                  setPaymentFilter("all");
                  setMethodFilter("all");
                  setPage(1);
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Mobile card list */}
      <div className="sm:hidden space-y-2">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-3 w-40" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </div>
            ))
          : filtered.length === 0
          ? (
            <div className="rounded-xl border border-slate-200 bg-white py-14 flex flex-col items-center gap-3 text-slate-400">
              <Package size={32} className="text-slate-300" />
              <p className="text-sm">No orders found</p>
            </div>
          )
          : filtered.map((order) => (
            <div key={order._id} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="flex items-start justify-between p-4 pb-3">
                <div className="min-w-0">
                  <span className="font-mono text-xs font-bold text-[#4a6741]">
                    {order.orderNumber}
                  </span>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5 truncate">
                    {order.shipping.fullName}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{order.shipping.email}</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm font-bold text-[#2d4a2d]">{order.total.toFixed(2)} TND</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="px-4 pb-3 flex flex-wrap gap-1.5 items-center">
                <Badge variant="secondary" className="text-xs h-5">
                  {order.items.reduce((s, i) => s + i.quantity, 0)} items
                </Badge>
                <OrderStatusBadge status={order.paymentStatus} type="payment" />
              </div>

              <div className="px-4 pb-3 flex items-center gap-2">
                <span className="text-xs text-slate-500 shrink-0">Delivery:</span>
                <div className="flex items-center gap-1">
                  {updatingId === order._id && (
                    <Loader2 size={12} className="animate-spin text-slate-400" />
                  )}
                  <Select
                    value={order.shippingStatus}
                    onValueChange={(v) => { if (v) handleInlineStatusUpdate(order._id, v); }}
                    disabled={updatingId === order._id}
                  >
                    <SelectTrigger className="h-7 w-auto text-xs border-0 p-0 shadow-none focus:ring-0 bg-transparent">
                      <SelectValue>
                        <OrderStatusBadge status={order.shippingStatus} type="shipping" />
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {SHIPPING_STATUSES.map((s) => (
                        <SelectItem key={s} value={s} className="text-xs">
                          <OrderStatusBadge status={s} type="shipping" />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Link href={`/${locale}/admin/orders/${order._id}`} className="ml-auto">
                  <Button variant="outline" size="sm" className="h-7 text-xs px-2.5 gap-1">
                    View <ChevronRight size={12} />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block rounded-xl border border-slate-200 bg-white shadow-sm overflow-x-auto">
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
                    <div className="flex items-center gap-1.5">
                      {updatingId === order._id ? (
                        <Loader2 size={14} className="animate-spin text-slate-400" />
                      ) : null}
                      <Select
                        value={order.shippingStatus}
                        onValueChange={(v) => { if (v) handleInlineStatusUpdate(order._id, v); }}
                        disabled={updatingId === order._id}
                      >
                        <SelectTrigger className="h-7 w-[140px] text-xs border-0 p-0 shadow-none focus:ring-0 bg-transparent">
                          <SelectValue>
                            <OrderStatusBadge status={order.shippingStatus} type="shipping" />
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {SHIPPING_STATUSES.map((s) => (
                            <SelectItem key={s} value={s} className="text-xs">
                              <OrderStatusBadge status={s} type="shipping" />
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
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
          <span className="text-xs sm:text-sm">
            {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
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
