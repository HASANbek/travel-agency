"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import NotificationBell from "@/components/admin/NotificationBell";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="h-screen flex overflow-hidden bg-[#0A2121] dark:bg-[#0A2121]">
      <Sidebar />
      <main className="flex-1 min-w-0 h-screen overflow-y-auto p-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex justify-end mb-2">
            <NotificationBell />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
