"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole } from "@/components/role-provider";
import { can } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import {
  LayoutGrid,
  Search,
  Plus,
  FolderOpen,
  Heart,
  ShieldCheck,
  Tags,
  Users,
} from "lucide-react";

const navigation = [
  { name: "Catalogue", href: "/prompts", icon: LayoutGrid },
  { name: "Rechercher", href: "/prompts?focus=search", icon: Search },
  { name: "Collections", href: "/collections", icon: FolderOpen },
  { name: "Favoris", href: "/favorites", icon: Heart },
];

const adminNavigation = [
  { name: "Approbations", href: "/admin/approvals", icon: ShieldCheck },
  { name: "Catégories", href: "/admin/categories", icon: Tags },
  { name: "Équipes", href: "/admin/teams", icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();
  const { role } = useRole();

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-sidebar-background">
      <div className="flex h-14 items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            P
          </div>
          <span className="text-lg font-semibold">Promptly</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {can(role, "create_prompt") && (
          <Link
            href="/prompts/new"
            className="mb-4 flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nouveau prompt
          </Link>
        )}

        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href.split("?")[0] + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </div>

        {can(role, "view_admin") && (
          <>
            <div className="my-4 border-t" />
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Administration
            </p>
            <div className="space-y-1">
              {adminNavigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </nav>
    </aside>
  );
}
