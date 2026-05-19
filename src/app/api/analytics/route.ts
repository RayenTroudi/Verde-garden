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
