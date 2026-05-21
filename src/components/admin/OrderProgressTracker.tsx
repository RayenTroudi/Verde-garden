import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

const STEPS = [
  { key: "pending",          label: "Pending" },
  { key: "confirmed",        label: "Confirmed" },
  { key: "processing",       label: "Processing" },
  { key: "shipped",          label: "Shipped" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered",        label: "Delivered" },
];

interface Props {
  currentStatus: string;
}

export function OrderProgressTracker({ currentStatus }: Props) {
  const isCancelled = currentStatus === "cancelled";
  const currentIndex = STEPS.findIndex((s) => s.key === currentStatus);

  return (
    <div className="w-full">
      {isCancelled ? (
        <div className="flex items-center gap-2 py-3 px-4 rounded-lg bg-red-50 border border-red-200">
          <X size={16} className="text-red-500 shrink-0" />
          <span className="text-sm font-medium text-red-700">Order Cancelled</span>
        </div>
      ) : (
        <div className="relative flex items-start justify-between">
          {STEPS.map((step, i) => {
            const isDone = i < currentIndex;
            const isCurrent = i === currentIndex;
            const isFuture = i > currentIndex;

            return (
              <div key={step.key} className="flex flex-col items-center flex-1 relative">
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "absolute top-4 left-1/2 w-full h-0.5 -translate-y-1/2",
                      isDone ? "bg-[#4a6741]" : "bg-slate-200"
                    )}
                  />
                )}
                <div
                  className={cn(
                    "relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors",
                    isDone
                      ? "bg-[#4a6741] border-[#4a6741] text-white"
                      : isCurrent
                      ? "bg-white border-[#4a6741] text-[#4a6741]"
                      : "bg-white border-slate-200 text-slate-300"
                  )}
                >
                  {isDone ? (
                    <Check size={14} strokeWidth={2.5} />
                  ) : (
                    <span className="text-xs font-semibold">{i + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "mt-2 text-[10px] font-medium text-center leading-tight max-w-[60px]",
                    isCurrent ? "text-[#4a6741]" : isFuture ? "text-slate-300" : "text-slate-500"
                  )}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
