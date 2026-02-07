import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { StoreProvider } from "@/context/store-context";

export const metadata: Metadata = {
  title: "Academic Hub - Research & Teaching Dashboard",
  description: "Track papers, teaching, grants, reviews, students, conferences, and service",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <StoreProvider>
          <Sidebar />
          <main className="ml-64 min-h-screen bg-slate-50">{children}</main>
        </StoreProvider>
      </body>
    </html>
  );
}
