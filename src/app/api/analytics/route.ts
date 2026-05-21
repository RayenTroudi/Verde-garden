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

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [summaryAgg, monthlySales, topPlants, paymentBreakdown] =
    await Promise.all([
      // Single aggregation replaces 6x countDocuments + distinct + revenueAgg
      Order.aggregate([
        {
          $facet: {
            totalOrders: [{ $count: "count" }],
            pendingOrders: [{ $match: { shippingStatus: "pending" } }, { $count: "count" }],
            paidOrders: [{ $match: { paymentStatus: "paid" } }, { $count: "count" }],
            codOrders: [{ $match: { paymentMethod: "cash_on_delivery" } }, { $count: "count" }],
            shippedOrders: [{ $match: { shippingStatus: "shipped" } }, { $count: "count" }],
            deliveredOrders: [{ $match: { shippingStatus: "delivered" } }, { $count: "count" }],
            totalRevenue: [
              { $match: { paymentStatus: "paid" } },
              { $group: { _id: null, total: { $sum: "$total" } } },
            ],
            totalCustomers: [
              { $group: { _id: "$shipping.email" } },
              { $count: "count" },
            ],
          },
        },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
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
        { $group: { _id: "$paymentMethod", count: { $sum: 1 } } },
      ]),
    ]);

  const f = summaryAgg[0];
  const summary = {
    totalOrders: f.totalOrders[0]?.count ?? 0,
    pendingOrders: f.pendingOrders[0]?.count ?? 0,
    paidOrders: f.paidOrders[0]?.count ?? 0,
    codOrders: f.codOrders[0]?.count ?? 0,
    shippedOrders: f.shippedOrders[0]?.count ?? 0,
    deliveredOrders: f.deliveredOrders[0]?.count ?? 0,
    totalRevenue: Math.round((f.totalRevenue[0]?.total ?? 0) * 100) / 100,
    totalCustomers: f.totalCustomers[0]?.count ?? 0,
  };

  const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlySalesFormatted = monthlySales.map((m: { _id: { year: number; month: number }; revenue: number; orders: number }) => ({
    month: `${MONTH_NAMES[m._id.month - 1]} ${m._id.year}`,
    revenue: Math.round(m.revenue * 100) / 100,
    orders: m.orders,
  }));

  return NextResponse.json({ summary, monthlySales: monthlySalesFormatted, topPlants, paymentBreakdown });
}
