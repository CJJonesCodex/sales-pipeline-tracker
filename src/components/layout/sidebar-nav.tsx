import Link from "next/link";
import { signOutAction } from "@/lib/auth/actions";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/companies", label: "Company Search & Import" },
  { href: "/contacts", label: "Contacts" },
  { href: "/pipeline", label: "Pipeline Board" },
];

export function SidebarNav() {
  return (
    <aside className="border-r border-slate-200 bg-white p-4">
      <h2 className="text-lg font-semibold">Sales Pipeline Tracker</h2>
      <p className="mt-1 text-xs text-slate-500">V1 + Milestone 2 app shell</p>

      <nav className="mt-6 space-y-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <form action={signOutAction} className="mt-8">
        <button
          className="inline-block rounded-md border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
          type="submit"
        >
          Sign out
        </button>
      </form>
    </aside>
  );
}
