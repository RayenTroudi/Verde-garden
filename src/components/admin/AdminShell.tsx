"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { AdminSidebar } from "./AdminSidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface AdminShellProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export function AdminShell({ children, title, description }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 z-50 border-r border-white/[0.04]">
        <AdminSidebar />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={(open) => setMobileOpen(open)}>
        <SheetContent side="left" className="p-0 w-64 bg-[#1a2e1b] border-none">
          <AdminSidebar onClose={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col lg:ml-64">
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-3 px-4 lg:px-6 h-16">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden shrink-0"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={20} />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-semibold text-[#2d4a2d] truncate">
                {title}
              </h1>
              {description && (
                <p className="text-xs text-slate-500 truncate hidden sm:block">
                  {description}
                </p>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
