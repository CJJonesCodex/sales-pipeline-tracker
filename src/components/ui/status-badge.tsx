import { WebsiteStatus } from "@/lib/types";

const styles: Record<WebsiteStatus, string> = {
  verified: "bg-emerald-100 text-emerald-700",
  likely: "bg-blue-100 text-blue-700",
  mismatch: "bg-amber-100 text-amber-800",
  missing: "bg-slate-100 text-slate-600",
};

export function StatusBadge({ status }: { status: WebsiteStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}
