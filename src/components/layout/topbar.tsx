"use client";

import { RoleSwitcher } from "./role-switcher";
import { useRole } from "@/components/role-provider";

export function Topbar() {
  const { role } = useRole();

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-sm text-muted-foreground">
          Mode démo — sélectionnez un rôle pour tester
        </h2>
      </div>
      <div className="flex items-center gap-4">
        <RoleSwitcher />
        <div className="flex items-center gap-2 text-sm">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center font-medium">
            {role[0]}
          </div>
        </div>
      </div>
    </header>
  );
}
