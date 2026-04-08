import { SidebarNav } from "@/components/layout/sidebar-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 md:grid-cols-[230px_1fr]">
        <SidebarNav />
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
