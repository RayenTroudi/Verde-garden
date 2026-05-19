"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { StatsCard } from "@/components/admin/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type { ValueType } from "recharts/types/component/DefaultTooltipContent";

interface AnalyticsData {
  summary: {
    totalOrders: number;
    totalRevenue: number;
    paidOrders: number;
    deliveredOrders: number;
  };
  monthlySales: { month: string; revenue: number; orders: number }[];
  topPlants: {
    _id: string;
    name: { fr: string; en: string };
    totalSold: number;
    revenue: number;
  }[];
  paymentBreakdown: { _id: string; count: number }[];
}

const CHART_COLORS = ["#4a6741", "#7fa86b", "#c4914b", "#0369a1", "#7c3aed"];

function fmtRevenue(v: ValueType | undefined): string {
  if (typeof v === "number") return `${v.toFixed(2)} TND`;
  return `${v ?? ""} TND`;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d: AnalyticsData) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <AdminShell
      title="Analytics"
      description="Revenue, sales trends, and top performers"
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))
          : [
              {
                label: "Total Orders",
                value: data!.summary.totalOrders,
                color: "#4a6741",
              },
              {
                label: "Total Revenue",
                value: `${data!.summary.totalRevenue.toFixed(2)} TND`,
                color: "#4a9967",
              },
              {
                label: "Paid Orders",
                value: data!.summary.paidOrders,
                color: "#0369a1",
              },
              {
                label: "Delivered",
                value: data!.summary.deliveredOrders,
                color: "#166534",
              },
            ].map((s) => (
              <StatsCard
                key={s.label}
                label={s.label}
                value={s.value}
                accentColor={s.color}
              />
            ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 mb-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">
              Monthly Revenue (TND)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={data!.monthlySales}
                  margin={{ top: 4, right: 8, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                    }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(v: any) => [fmtRevenue(v as ValueType | undefined), "Revenue"]}
                  />
                  <Bar dataKey="revenue" fill="#4a6741" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">
              Order Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart
                  data={data!.monthlySales}
                  margin={{ top: 4, right: 8, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                    }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(v: any) => [v, "Orders"]}
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">
              Best-Selling Plants
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : !data || data.topPlants.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">
                No sales data yet
              </p>
            ) : (
              <div className="space-y-2">
                {data.topPlants.map((p, i) => (
                  <div key={p._id} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 w-5 shrink-0">
                      #{i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">
                        {p.name?.en ?? p.name?.fr ?? "Unknown"}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <div
                          className="h-1.5 rounded-full bg-[#4a6741]"
                          style={{
                            width: `${Math.round(
                              (p.totalSold /
                                (data.topPlants[0]?.totalSold || 1)) *
                                100
                            )}%`,
                            maxWidth: "100%",
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold text-slate-600">
                        {p.totalSold} sold
                      </p>
                      <p className="text-xs text-slate-400">
                        {p.revenue.toFixed(0)} TND
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">
              Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : !data || data.paymentBreakdown.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">
                No data yet
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={data.paymentBreakdown.map((d) => ({
                      name: d._id.replace(/_/g, " "),
                      value: d.count,
                    }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    dataKey="value"
                    label={({
                      name,
                      percent,
                    }: {
                      name?: string;
                      percent?: number;
                    }) =>
                      `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {data.paymentBreakdown.map((_, index) => (
                      <Cell
                        key={index}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(v: any) => [v, "Orders"]}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => (
                      <span style={{ fontSize: 11, color: "#64748b" }}>
                        {value}
                      </span>
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
