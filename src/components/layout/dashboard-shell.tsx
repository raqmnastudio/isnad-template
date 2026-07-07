"use client";

import { useState } from "react";
import { X } from "lucide-react";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { LanguageProvider } from "@/lib/i18n/language-context";

interface DashboardShellProps {
  fullName: string;
  roleLabel: string;
  schoolName?: string | null;
  children: React.ReactNode;
}

export function DashboardShell({
  fullName,
  roleLabel,
  schoolName,
  children,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <LanguageProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        {/* قائمة جانبية ثابتة على الشاشات الكبيرة */}
        <aside className="hidden w-72 shrink-0 lg:block">
          <Sidebar />
        </aside>

        {/* قائمة جانبية منسدلة على الجوال والتابلت */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div className="w-72 max-w-[80%]">
              <div className="relative h-full">
                <button
                  onClick={() => setMobileOpen(false)}
                  className="absolute -start-11 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-navy shadow"
                  aria-label="إغلاق القائمة"
                >
                  <X className="h-5 w-5" />
                </button>
                <Sidebar onNavigate={() => setMobileOpen(false)} />
              </div>
            </div>
            <div
              className="flex-1 bg-black/40"
              onClick={() => setMobileOpen(false)}
            />
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar
            fullName={fullName}
            roleLabel={roleLabel}
            schoolName={schoolName}
            onMenuClick={() => setMobileOpen(true)}
          />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </LanguageProvider>
  );
}
