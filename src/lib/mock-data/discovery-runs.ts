import { DiscoveryRun } from "@/lib/types";

export const discoveryRuns: DiscoveryRun[] = [
  {
    id: "dr1",
    company_id: "c1",
    started_at: "2026-01-03T09:00:00Z",
    finished_at: "2026-01-03T09:01:30Z",
    status: "completed",
    pages_scanned: 6,
    scanned_urls: ["https://www.blueriverdental.example", "https://www.blueriverdental.example/contact"],
    emails_found: 4,
    phones_found: 2,
    contacts_found: 2,
    error_log: "",
  },
  {
    id: "dr2",
    company_id: "c2",
    started_at: "2026-01-05T09:00:00Z",
    finished_at: "2026-01-05T09:02:10Z",
    status: "completed",
    pages_scanned: 4,
    scanned_urls: ["https://www.northwindhvac.example", "https://www.northwindhvac.example/contact"],
    emails_found: 2,
    phones_found: 3,
    contacts_found: 1,
    error_log: "",
  },
];
