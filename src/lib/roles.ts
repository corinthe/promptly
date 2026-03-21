export type Role = "ADMIN" | "EDITOR" | "READER";

export const ROLES: { value: Role; label: string; description: string }[] = [
  { value: "ADMIN", label: "Admin", description: "Gère les catégories, approuve les prompts, gère les utilisateurs" },
  { value: "EDITOR", label: "Éditeur", description: "Crée et modifie des prompts, soumet pour approbation" },
  { value: "READER", label: "Lecteur", description: "Consulte et copie les prompts publiés" },
];

export const ROLE_COLORS: Record<Role, string> = {
  ADMIN: "bg-red-100 text-red-800",
  EDITOR: "bg-blue-100 text-blue-800",
  READER: "bg-green-100 text-green-800",
};
