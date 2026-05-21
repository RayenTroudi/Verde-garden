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

  // Auto-mark cash-on-delivery orders as paid when delivered
  if (shippingStatus === "delivered") {
    const existing = await Order.findById(id).select("paymentMethod paymentStatus").lean();
    if (existing && existing.paymentMethod === "cash_on_delivery" && existing.paymentStatus !== "paid") {
      update.paymentStatus = "paid";
    }
  }

  const historyEntry = {
    status: shippingStatus ?? paymentStatus,
    timestamp: new Date(),
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
