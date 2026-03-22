"use client";

import { Button } from "@/components/ui/button";
import { useRole } from "@/components/role-provider";
import { can } from "@/lib/permissions";
import { copyPrompt, forkPrompt } from "@/lib/actions/prompts";
import { toggleFavorite } from "@/lib/actions/favorites";
import { Copy, GitFork, Heart } from "lucide-react";
import { useState } from "react";

export function PromptDetailActions({
  promptId,
  favoriteCount,
  content,
  favoritedByUserIds,
}: {
  promptId: string;
  favoriteCount: number;
  content: string;
  favoritedByUserIds: string[];
}) {
  const { role, userId } = useRole();
  const [copied, setCopied] = useState(false);
  const [favCount, setFavCount] = useState(favoriteCount);
  const [fav, setFav] = useState(favoritedByUserIds.includes(userId));

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    const fd = new FormData();
    fd.set("promptId", promptId);
    await copyPrompt(fd);
  };

  const handleToggleFavorite = async () => {
    setFav(!fav);
    setFavCount((c) => (fav ? c - 1 : c + 1));

    const fd = new FormData();
    fd.set("userId", userId);
    fd.set("promptId", promptId);
    await toggleFavorite(fd);
  };

  return (
    <div className="flex gap-2">
      <Button
        variant={fav ? "default" : "outline"}
        size="sm"
        onClick={handleToggleFavorite}
      >
        <Heart className={`h-4 w-4 mr-1 ${fav ? "fill-current" : ""}`} />
        {favCount}
      </Button>
      {can(role, "create_prompt") && (
        <form action={forkPrompt}>
          <input type="hidden" name="promptId" value={promptId} />
          <input type="hidden" name="userId" value={userId} />
          <Button variant="outline" size="sm" type="submit">
            <GitFork className="h-4 w-4 mr-1" />
            Fork
          </Button>
        </form>
      )}
      <Button variant="default" size="sm" onClick={handleCopy}>
        <Copy className="h-4 w-4 mr-1" />
        {copied ? "Copié !" : "Copier"}
      </Button>
    </div>
  );
}
