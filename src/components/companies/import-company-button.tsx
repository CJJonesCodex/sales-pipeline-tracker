"use client";

import { useFormStatus } from "react-dom";

export function ImportCompanyButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="rounded border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      type="submit"
      disabled={pending}
    >
      {pending ? "Importing..." : "Import"}
    </button>
  );
}
