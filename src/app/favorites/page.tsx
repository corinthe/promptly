export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { FavoritesList } from "./favorites-list";

export default async function FavoritesPage() {
  // Fetch all favorites for all role-users (client will filter by current role)
  const allFavorites = await prisma.favorite.findMany({
    include: {
      prompt: {
        include: {
          author: true,
          category: true,
          tags: { include: { tag: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Group by userId
  const favoritesByUser: Record<string, typeof allFavorites> = {};
  for (const fav of allFavorites) {
    if (!favoritesByUser[fav.userId]) {
      favoritesByUser[fav.userId] = [];
    }
    favoritesByUser[fav.userId].push(fav);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mes favoris</h1>
        <p className="text-sm text-muted-foreground">
          Retrouvez vos prompts favoris
        </p>
      </div>
      <FavoritesList favoritesByUser={favoritesByUser} />
    </div>
  );
}
