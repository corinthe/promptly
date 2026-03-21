import { type Role } from "./roles";

type Action =
  | "create_prompt"
  | "edit_prompt"
  | "delete_prompt"
  | "submit_prompt"
  | "approve_prompt"
  | "reject_prompt"
  | "manage_categories"
  | "manage_teams"
  | "manage_users"
  | "create_collection"
  | "view_admin";

const PERMISSIONS: Record<Action, Role[]> = {
  create_prompt: ["ADMIN", "EDITOR"],
  edit_prompt: ["ADMIN", "EDITOR"],
  delete_prompt: ["ADMIN"],
  submit_prompt: ["ADMIN", "EDITOR"],
  approve_prompt: ["ADMIN"],
  reject_prompt: ["ADMIN"],
  manage_categories: ["ADMIN"],
  manage_teams: ["ADMIN"],
  manage_users: ["ADMIN"],
  create_collection: ["ADMIN", "EDITOR"],
  view_admin: ["ADMIN"],
};

export function can(role: Role, action: Action): boolean {
  return PERMISSIONS[action]?.includes(role) ?? false;
}
