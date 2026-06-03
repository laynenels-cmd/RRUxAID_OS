import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast-provider";

export const metadata: Metadata = {
  title: "RRU x AID Revenue Infrastructure OS",
  description: "Internal operating system for athlete revenue infrastructure operations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
