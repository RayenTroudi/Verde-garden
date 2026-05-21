import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase as dbConnect } from "@/lib/mongodb";
import Order from "@/models/Order";
import Plant from "@/models/Plant";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    const { items, shipping, paymentMethod } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items in order" }, { status: 400 });
    }
    if (!shipping || !shipping.fullName || !shipping.email || !shipping.phone) {
      return NextResponse.json({ error: "Missing shipping information" }, { status: 400 });
    }
    if (!paymentMethod || !["online", "cash_on_delivery"].includes(paymentMethod)) {
      return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
    }

    // Validate items and calculate totals from DB prices (prevent price tampering)
    const validatedItems = [];
    for (const item of items) {
      const plant = await Plant.findById(item.plantId);
      if (!plant) {
        return NextResponse.json({ error: `Plant not found: ${item.plantId}` }, { status: 400 });
      }
      if (plant.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${plant.name.en}` },
          { status: 400 }
        );
      }
      validatedItems.push({
        plantId: item.plantId,
        name: plant.name,
        imageUrl: plant.imageUrl,
        price: plant.price,
        quantity: item.quantity,
      });
    }

    const subtotal = validatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const shippingCost = subtotal >= 150 ? 0 : 7;
    const total = subtotal + shippingCost;

    const paymentStatus =
      paymentMethod === "cash_on_delivery" ? "cash_on_delivery" : "pending";

    const order = new Order({
      items: validatedItems,
      shipping,
      subtotal,
      shippingCost,
      total,
      paymentMethod,
      paymentStatus,
      shippingStatus: "pending",
    });

    await order.save();

    // Decrement stock
    for (const item of validatedItems) {
      await Plant.findByIdAndUpdate(item.plantId, { $inc: { stock: -item.quantity } });
    }

    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    console.error("Order creation error:", err);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

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

    const [total, orders] = await Promise.all([
      Order.countDocuments(filter),
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return NextResponse.json({ orders, total, page, limit });
  } catch (err) {
    console.error("Fetch orders error:", err);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
