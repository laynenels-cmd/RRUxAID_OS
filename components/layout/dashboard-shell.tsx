"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bot,
  BriefcaseBusiness,
  ClipboardList,
  Command,
  FileText,
  Gauge,
  GitBranch,
  LayoutDashboard,
  LogOut,
  Menu,
  Network,
  Search,
  Settings,
  ShieldCheck,
  Users,
  Workflow,
  X,
  type LucideIcon,
} from "lucide-react";
import { clsx } from "clsx";
import type { Profile } from "@/types/domain";
import { canAccessScope, type AccessScope } from "@/lib/auth/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Connections = {
  app_mode: string;
  active_data_mode: "demo" | "live";
  demo_mode: boolean;
  supabase_connected: boolean;
  llm_key_configured: boolean;
  storage_configured: boolean;
};

const navItems: Array<{ href: string; label: string; icon: LucideIcon; scope: AccessScope }> = [
  { href: "/dashboard", label: "Command Center", icon: LayoutDashboard, scope: "internal" },
  { href: "/athletes", label: "Athlete Intelligence", icon: Users, scope: "partner-read" },
  { href: "/diagnostics", label: "AI Revenue Audit", icon: Gauge, scope: "internal" },
  { href: "/workflows", label: "Workflow Queue", icon: Workflow, scope: "internal" },
  { href: "/offers", label: "Offer Architect", icon: BriefcaseBusiness, scope: "internal" },
  { href: "/ownership", label: "Ownership Map", icon: Network, scope: "internal" },
  { href: "/buildouts", label: "Campaign Tasks", icon: ClipboardList, scope: "internal" },
  { href: "/pipeline", label: "Pipeline", icon: GitBranch, scope: "internal" },
  { href: "/reports", label: "Reports", icon: FileText, scope: "partner-read" },
  { href: "/agent", label: "OS Agent", icon: Bot, scope: "internal" },
  { href: "/settings", label: "Settings / Data Room", icon: Settings, scope: "partner-read" },
];

export function DashboardShell({
  profile,
  connections,
  children,
}: {
  profile: Profile;
  connections: Connections;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
      }
      if (event.key === "Escape") setPaletteOpen(false);
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const visibleNav = useMemo(
    () => navItems.filter((item) => canAccessScope(profile.role, item.scope)),
    [profile.role],
  );

  const filteredNav = useMemo(() => {
    const term = query.toLowerCase();
    return visibleNav.filter((item) => item.label.toLowerCase().includes(term));
  }, [query, visibleNav]);

  const current = visibleNav.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

  function goTo(href: string) {
    setPaletteOpen(false);
    setMobileOpen(false);
    router.push(href);
  }

  return (
    <div className="os-grid min-h-screen lg:grid lg:grid-cols-[236px_1fr] lg:grid-rows-[48px_1fr_26px]">
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 w-[260px] border-r border-line bg-bg transition lg:static lg:block lg:w-auto lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-12 items-center justify-between border-b border-line px-4">
          <Link href="/dashboard" className="display-title text-sm font-medium tracking-normal text-text">
            RRU x AID OS
          </Link>
          <button className="text-text-low lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="border-b border-line p-4">
          <div className="mono-label mb-2">Access Role</div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-accent" strokeWidth={1.6} />
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-text">{profile.role}</div>
              <div className="font-mono text-[10px] text-text-min">{profile.email}</div>
            </div>
          </div>
        </div>
        <nav className="grid gap-1 p-2">
          {visibleNav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={clsx(
                  "flex h-10 items-center gap-3 border px-3 font-mono text-[11px] uppercase tracking-[0.08em] transition",
                  active
                    ? "border-[rgba(0,255,102,0.34)] bg-[rgba(0,255,102,0.08)] text-accent"
                    : "border-transparent text-text-low hover:border-line hover:text-text",
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={1.6} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <header className="sticky top-0 z-30 flex h-12 items-center gap-3 border-b border-line bg-[rgba(8,8,10,0.92)] px-3 backdrop-blur lg:col-start-2">
        <button className="text-text-low lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="mono-label truncate">{current?.label || "Revenue Infrastructure OS"}</div>
        </div>
        <button
          className="hidden h-8 min-w-[220px] items-center gap-2 border border-line bg-bg-2 px-3 text-left font-mono text-[10px] uppercase tracking-[0.1em] text-text-min hover:text-text md:flex"
          onClick={() => setPaletteOpen(true)}
        >
          <Search className="h-3.5 w-3.5" />
          Command / Search
          <span className="ml-auto text-text-min">CMD K</span>
        </button>
        <Badge tone={connections.active_data_mode === "live" ? "green" : "amber"}>
          {connections.active_data_mode === "live" ? "Live Data" : "Demo Data"}
        </Badge>
        <Badge tone={connections.llm_key_configured ? "green" : "amber"}>
          {connections.llm_key_configured ? "Connected Agent" : "Prototype Agent"}
        </Badge>
        <form method="post" action="/api/auth/logout">
          <Button type="submit" variant="ghost" size="sm" icon={<LogOut className="h-3.5 w-3.5" />}>
            Logout
          </Button>
        </form>
      </header>

      <main className="min-w-0 px-3 py-3 lg:col-start-2 lg:row-start-2 lg:overflow-auto lg:px-4">{children}</main>

      <footer className="hidden border-t border-line px-4 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-text-min lg:col-start-2 lg:row-start-3 lg:block">
        {connections.active_data_mode === "live" ? "Live Supabase data" : "Local demo store"} / {connections.llm_key_configured ? "LLM key configured" : "Agent fallback enabled"} / No fake uptime or sync claims
      </footer>

      {paletteOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-start bg-black/70 p-4 pt-[12vh]" onClick={() => setPaletteOpen(false)}>
          <div className="mx-auto w-full max-w-xl border border-line-hi bg-bg-2" onClick={(event) => event.stopPropagation()}>
            <div className="flex h-12 items-center gap-3 border-b border-line px-4">
              <Command className="h-4 w-4 text-accent" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-full flex-1 bg-transparent font-mono text-[12px] text-text outline-none placeholder:text-text-min"
                placeholder="Search screens"
              />
            </div>
            <div className="grid max-h-[360px] gap-1 overflow-auto p-2">
              {filteredNav.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.href}
                    className="flex h-11 items-center gap-3 border border-transparent px-3 text-left font-mono text-[11px] uppercase tracking-[0.08em] text-text-low hover:border-line hover:text-text"
                    onClick={() => goTo(item.href)}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.6} />
                    {item.label}
                  </button>
                );
              })}
              {!filteredNav.length ? <div className="p-6 text-center font-mono text-[11px] text-text-min">No matching screen.</div> : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
