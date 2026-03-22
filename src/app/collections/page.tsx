export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { CollectionsView } from "./collections-view";

export default async function CollectionsPage() {
  const collections = await prisma.collection.findMany({
    include: {
      creator: true,
      items: {
        include: {
          prompt: {
            include: {
              author: true,
              category: true,
              tags: { include: { tag: true } },
            },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const publishedPrompts = await prisma.prompt.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, title: true },
    orderBy: { title: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Collections</h1>
        <p className="text-sm text-muted-foreground">
          Parcourez et gérez les collections de prompts thématiques
        </p>
      </div>
      <CollectionsView
        collections={collections}
        publishedPrompts={publishedPrompts}
      />
    </div>
  );
}
