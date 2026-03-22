export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { CategoriesView } from "./categories-view";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { prompts: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Catégories</h1>
        <p className="text-sm text-muted-foreground">
          Gérez les catégories de prompts
        </p>
      </div>
      <CategoriesView categories={categories} />
    </div>
  );
}
