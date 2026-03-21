"use client";

import { useRole } from "@/components/role-provider";
import { ROLES, ROLE_COLORS } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { Shield, Pen, Eye } from "lucide-react";
import type { Role } from "@/lib/roles";

const ROLE_ICONS: Record<Role, React.ReactNode> = {
  ADMIN: <Shield className="h-3.5 w-3.5" />,
  EDITOR: <Pen className="h-3.5 w-3.5" />,
  READER: <Eye className="h-3.5 w-3.5" />,
};

export function RoleSwitcher() {
  const { role, setRole } = useRole();

  return (
    <div className="flex items-center gap-1 rounded-lg border bg-muted/50 p-1">
      {ROLES.map((r) => (
        <button
          key={r.value}
          onClick={() => setRole(r.value)}
          title={r.description}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            role === r.value
              ? cn(ROLE_COLORS[r.value], "shadow-sm")
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {ROLE_ICONS[r.value]}
          {r.label}
        </button>
      ))}
    </div>
  );
}
