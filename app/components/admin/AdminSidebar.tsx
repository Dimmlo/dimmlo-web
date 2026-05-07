"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  Mail,
  Users,
  Globe,
  Phone,
  Layout,
  Brain,
  LogOut,
} from "lucide-react";

const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/brain", label: "Brain", icon: Brain },
  { href: "/admin/prospects", label: "Prospects", icon: Search },
  { href: "/admin/campaigns", label: "Campaigns", icon: Mail },
  { href: "/admin/contacts", label: "Contacts", icon: Users },
  { href: "/admin/domains", label: "Domains", icon: Globe },
  { href: "/admin/calls", label: "Calls", icon: Phone },
  { href: "/admin/landing-pages", label: "Landing Pages", icon: Layout },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    window.location.href = "/admin/login";
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col bg-ink p-4 text-white sm:flex">
        <div className="px-2 py-3">
          <span className="text-lg font-semibold">Dimmlo</span>
          <span className="ml-2 text-xs text-white/60">admin</span>
        </div>
        <nav className="mt-4 flex-1 space-y-1">
          {items.map((it) => {
            const active =
              pathname === it.href ||
              (it.href !== "/admin" && pathname.startsWith(it.href));
            const Icon = it.icon;
            return (
              <Link
                key={it.href}
                href={it.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-teal text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={16} />
                {it.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={logout}
          className="mt-4 flex items-center gap-3 rounded-md px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white"
        >
          <LogOut size={16} /> Sign out
        </button>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-gray-200 bg-white py-2 sm:hidden">
        {items.map((it) => {
          const active =
            pathname === it.href ||
            (it.href !== "/admin" && pathname.startsWith(it.href));
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex flex-col items-center px-2 py-1 text-[10px] ${
                active ? "text-teal" : "text-gray-500"
              }`}
            >
              <Icon size={18} />
              <span className="mt-0.5">{it.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
