export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { PromptGrid } from "@/components/prompts/prompt-grid";
import { Search } from "lucide-react";
import Link from "next/link";

export default async function HomePage() {
  const [recentPrompts, stats] = await Promise.all([
    prisma.prompt.findMany({
      where: { status: "PUBLISHED" },
      include: {
        author: true,
        category: true,
        tags: { include: { tag: true } },
      },
      orderBy: { publishedAt: "desc" },
      take: 8,
    }),
    prisma.prompt.count({ where: { status: "PUBLISHED" } }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Bienvenue sur Promptly
        </h1>
        <p className="mt-2 text-muted-foreground">
          Découvrez et partagez des prompts IA au sein de votre organisation.
          {stats > 0 && ` ${stats} prompts disponibles.`}
        </p>
      </div>

      <Link
        href="/prompts"
        className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
      >
        <Search className="h-4 w-4" />
        Rechercher des prompts...
      </Link>

      {recentPrompts.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Prompts récents</h2>
            <Link
              href="/prompts"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Voir tout →
            </Link>
          </div>
          <PromptGrid prompts={recentPrompts} />
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            Aucun prompt publié pour le moment.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Changez votre rôle en Éditeur ou Admin pour créer des prompts.
          </p>
        </div>
      )}
    </div>
  );
}
