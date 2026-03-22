import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Copy, Heart, User, Star } from "lucide-react";
import type { Prompt, User as UserType, Category, PromptTag, Tag } from "@/generated/prisma/client";

type PromptWithRelations = Prompt & {
  author: UserType;
  category: Category | null;
  tags: (PromptTag & { tag: Tag })[];
};

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  DRAFT: { label: "Brouillon", variant: "secondary" },
  SUBMITTED: { label: "En attente", variant: "outline" },
  APPROVED: { label: "Approuvé", variant: "default" },
  REJECTED: { label: "Rejeté", variant: "destructive" },
  PUBLISHED: { label: "Publié", variant: "default" },
  ARCHIVED: { label: "Archivé", variant: "secondary" },
};

export function PromptCard({ prompt }: { prompt: PromptWithRelations }) {
  const status = STATUS_LABELS[prompt.status] ?? { label: prompt.status, variant: "secondary" as const };

  return (
    <Link href={`/prompts/${prompt.slug}`}>
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base line-clamp-1">{prompt.title}</CardTitle>
            {prompt.status !== "PUBLISHED" && (
              <Badge variant={status.variant} className="shrink-0 text-[10px]">
                {status.label}
              </Badge>
            )}
          </div>
          <CardDescription className="line-clamp-2 text-xs">
            {prompt.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="flex flex-wrap gap-1">
            {prompt.category && (
              <Badge variant="outline" className="text-[10px]">
                {prompt.category.name}
              </Badge>
            )}
            {prompt.tags.slice(0, 3).map(({ tag }) => (
              <Badge key={tag.id} variant="secondary" className="text-[10px]">
                {tag.name}
              </Badge>
            ))}
            {prompt.tags.length > 3 && (
              <Badge variant="secondary" className="text-[10px]">
                +{prompt.tags.length - 3}
              </Badge>
            )}
          </div>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {prompt.author.name}
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" /> {prompt.viewCount}
              </span>
              <span className="flex items-center gap-1">
                <Copy className="h-3 w-3" /> {prompt.copyCount}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3" /> {prompt.favoriteCount}
              </span>
              {prompt.ratingCount > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" /> {prompt.ratingAvg.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
