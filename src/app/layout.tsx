import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sales Pipeline Tracker",
  description: "Beginner-friendly CRM pipeline shell with mock data",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
