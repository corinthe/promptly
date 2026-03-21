"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { type Role } from "@/lib/roles";

interface RoleContextType {
  role: Role;
  setRole: (role: Role) => void;
  userId: string;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

const STORAGE_KEY = "promptly-role";
const DEFAULT_ROLE: Role = "READER";

// Fixed user IDs for each role in MVP (maps to seeded users)
const ROLE_USER_IDS: Record<Role, string> = {
  ADMIN: "user-admin",
  EDITOR: "user-editor",
  READER: "user-reader",
};

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(DEFAULT_ROLE);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Role | null;
    if (stored && ["ADMIN", "EDITOR", "READER"].includes(stored)) {
      setRoleState(stored);
    }
    setMounted(true);
  }, []);

  const setRole = (newRole: Role) => {
    setRoleState(newRole);
    localStorage.setItem(STORAGE_KEY, newRole);
  };

  if (!mounted) {
    return null;
  }

  return (
    <RoleContext.Provider value={{ role, setRole, userId: ROLE_USER_IDS[role] }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
}
