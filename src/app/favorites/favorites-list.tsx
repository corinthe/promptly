"use client";

import { useRole } from "@/components/role-provider";
import { PromptCard } from "@/components/prompts/prompt-card";
import type { Prompt, User, Category, PromptTag, Tag, Favorite } from "@/generated/prisma/client";

type FavoriteWithPrompt = Favorite & {
  prompt: Prompt & {
    author: User;
    category: Category | null;
    tags: (PromptTag & { tag: Tag })[];
  };
};

export function FavoritesList({
  favoritesByUser,
}: {
  favoritesByUser: Record<string, FavoriteWithPrompt[]>;
}) {
  const { userId } = useRole();
  const myFavorites = favoritesByUser[userId] ?? [];

  if (myFavorites.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">
          Vous n&apos;avez pas encore de favoris.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Cliquez sur le coeur sur un prompt pour l&apos;ajouter à vos favoris.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {myFavorites.map((fav) => (
        <PromptCard key={fav.promptId} prompt={fav.prompt} />
      ))}
    </div>
  );
}
