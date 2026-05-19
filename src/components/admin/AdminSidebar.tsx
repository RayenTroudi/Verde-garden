"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useLocale } from "next-intl";
import {
  LayoutDashboard,
  ShoppingCart,
  Leaf,
  BarChart2,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart, exact: false },
  { href: "/admin/plants", label: "Plants", icon: Leaf, exact: false },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart2, exact: false },
];

interface AdminSidebarProps {
  onClose?: () => void;
}

export function AdminSidebar({ onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const locale = useLocale();

  const isActive = (href: string, exact: boolean) => {
    const full = `/${locale}${href}`;
    return exact ? pathname === full : pathname.startsWith(full);
  };

  return (
    <div className="flex h-full flex-col bg-[#1a2e1b] text-white">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.06]">
        <Link
          href={`/${locale}/admin`}
          className="flex items-center gap-2.5"
          onClick={onClose}
        >
          <img
            src="/icons/logo.svg"
            alt="Verde Garden"
            className="h-9 w-auto block"
          />
        </Link>
        <span className="ml-auto text-[10px] font-semibold uppercase tracking-widest text-[#b8d4b0]/60 border border-[#b8d4b0]/20 px-2 py-0.5 rounded">
          Admin
        </span>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={`/${locale}${href}`}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-normal transition-colors",
                isActive(href, exact)
                  ? "bg-[#b8d4b0]/[0.12] text-[#b8d4b0] font-medium"
                  : "text-white/50 hover:bg-white/[0.05] hover:text-white/80"
              )}
            >
              <Icon size={17} />
              {label}
            </Link>
          ))}
        </nav>
      </ScrollArea>

      <div className="px-4 py-4 border-t border-white/[0.06] space-y-2">
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors py-1"
        >
          <ExternalLink size={13} />
          View Storefront
        </Link>
        <Separator className="bg-white/[0.06]" />
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-xs text-red-400/70 hover:text-red-400 hover:bg-red-400/10 px-2"
          onClick={() => signOut({ callbackUrl: `/${locale}` })}
        >
          <LogOut size={14} />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
