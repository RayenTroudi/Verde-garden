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
import { ArrowLeft, Clock, MapPin, Package, CreditCard, TruckIcon, Download } from "lucide-react";
import { OrderProgressTracker } from "@/components/admin/OrderProgressTracker";
import { downloadOrderPDF } from "@/lib/order-pdf";
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
    state?: string;
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
  adminNotes: string;
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
  const [adminNotes, setAdminNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    fetch(`/api/orders/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        const o = d.order ?? d;
        setOrder(o);
        setNewShipping(o?.shippingStatus ?? "");
        setNewPayment(o?.paymentStatus ?? "");
        setAdminNotes(o?.adminNotes ?? "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  const handleUpdateStatus = async () => {
    if (!order) return;
    setUpdating(true);
    try {
      const body: Record<string, string | undefined> = {};
      if (newShipping !== order.shippingStatus) body.shippingStatus = newShipping;
      if (newPayment !== order.paymentStatus) body.paymentStatus = newPayment;

      const res = await fetch(`/api/orders/${order._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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

  const handleSaveNotes = async () => {
    if (!order) return;
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/orders/${order._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOrder(data.order);
      toast({ title: "Notes saved" });
    } catch (err) {
      toast({
        title: "Failed to save notes",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSavingNotes(false);
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
      title={`Order #${order.orderNumber}`}
      description={`Placed on ${new Date(order.createdAt).toLocaleDateString()}`}
    >
      <Toaster />

      <div className="flex items-center justify-between mb-4">
        <Link href={`/${locale}/admin/orders`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#4a6741] transition-colors">
          <ArrowLeft size={15} />
          Back to Orders
        </Link>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={() => downloadOrderPDF(order)}
        >
          <Download size={13} />
          Download PDF
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                <TruckIcon size={15} /> Delivery Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2 pb-4 px-6">
              <OrderProgressTracker currentStatus={order.shippingStatus} />
            </CardContent>
          </Card>

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
                  {order.shipping.streetAddress},{" "}
                  {order.shipping.city}
                  {order.shipping.state ? `, ${order.shipping.state}` : ""},{" "}
                  {order.shipping.zipCode}, {order.shipping.country}
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

        <div className="space-y-4">
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

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-600">
                Update Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 mb-1.5 font-medium">Delivery Status</p>
                <Select value={newShipping} onValueChange={(v) => { if (v !== null) setNewShipping(v); }}>
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
                <Select value={newPayment} onValueChange={(v) => { if (v !== null) setNewPayment(v); }}>
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

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-600">
                Internal Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add internal notes about this order…"
                rows={4}
                className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none resize-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 transition-colors"
              />
              <Button
                className="w-full bg-[#4a6741] hover:bg-[#3a5631] text-white h-9 text-sm"
                disabled={savingNotes || adminNotes === (order.adminNotes ?? "")}
                onClick={handleSaveNotes}
              >
                {savingNotes ? "Saving…" : "Save Notes"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
