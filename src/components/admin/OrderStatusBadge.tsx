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
