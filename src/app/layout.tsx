import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BOND — Stärk er relation",
  description: "Dagliga övningar för att stärka er relation och bygga en djupare koppling.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sv">
      <body className={`${inter.className} bg-bond-bg text-bond-text`}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
