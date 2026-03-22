"use client";

import { useRole } from "@/components/role-provider";
import { PromptCard } from "@/components/prompts/prompt-card";
import { Badge } from "@/components/ui/badge";
import { GitFork } from "lucide-react";
import type { Prompt, User, Category, PromptTag, Tag } from "@/generated/prisma/client";
import { useState } from "react";

type PromptWithRelations = Prompt & {
  author: User;
  category: Category | null;
  tags: (PromptTag & { tag: Tag })[];
  forkedFrom: { title: string; slug: string } | null;
};

type FilterType = "all" | "forked" | "original";

export function MyPromptsList({
  promptsByUser,
}: {
  promptsByUser: Record<string, PromptWithRelations[]>;
}) {
  const { userId } = useRole();
  const myPrompts = promptsByUser[userId] ?? [];
  const [filter, setFilter] = useState<FilterType>("all");

  const filtered = myPrompts.filter((p) => {
    if (filter === "forked") return p.forkedFromId !== null;
    if (filter === "original") return p.forkedFromId === null;
    return true;
  });

  const forkedCount = myPrompts.filter((p) => p.forkedFromId !== null).length;

  if (myPrompts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">
          Vous n&apos;avez pas encore de prompts.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Créez un nouveau prompt ou forkez-en un depuis le catalogue.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilter("all")}>
          <Badge variant={filter === "all" ? "default" : "outline"}>
            Tous ({myPrompts.length})
          </Badge>
        </button>
        <button onClick={() => setFilter("forked")}>
          <Badge variant={filter === "forked" ? "default" : "outline"}>
            <GitFork className="mr-1 h-3 w-3" />
            Forkés ({forkedCount})
          </Badge>
        </button>
        <button onClick={() => setFilter("original")}>
          <Badge variant={filter === "original" ? "default" : "outline"}>
            Originaux ({myPrompts.length - forkedCount})
          </Badge>
        </button>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((prompt) => (
            <PromptCard key={prompt.id} prompt={prompt} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            Aucun prompt dans cette catégorie.
          </p>
        </div>
      )}
    </div>
  );
}
