"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Flame, Heart, BookOpen, Settings } from "lucide-react";

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { href: "/home", icon: House, label: "Home" },
    { href: "/streak", icon: Flame, label: "Streak" },
    { href: "/pulse", icon: Heart, label: "Pulse" },
    { href: "/history", icon: BookOpen, label: "Historik" },
    { href: "/settings", icon: Settings, label: "Inställningar" },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Content */}
      <main className="flex-1 pb-24">
        <div className="max-w-lg mx-auto p-4">
          {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 rounded-t-2xl">
        <div className="max-w-lg mx-auto flex justify-around items-center h-20">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center justify-center w-16 h-16 transition-colors ${
                  isActive
                    ? "text-bond-primary"
                    : "text-bond-text-light hover:text-bond-text"
                }`}
                title={label}
              >
                <Icon className="w-6 h-6" />
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
