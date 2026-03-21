import { prisma } from "@/lib/db";
import { PromptGrid } from "@/components/prompts/prompt-grid";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import Link from "next/link";

export default async function PromptsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; tag?: string }>;
}) {
  const params = await searchParams;
  const query = params.q || "";
  const categoryFilter = params.category || "";
  const tagFilter = params.tag || "";

  const [prompts, categories, tags] = await Promise.all([
    prisma.prompt.findMany({
      where: {
        status: "PUBLISHED",
        ...(query && {
          OR: [
            { title: { contains: query } },
            { description: { contains: query } },
          ],
        }),
        ...(categoryFilter && { category: { slug: categoryFilter } }),
        ...(tagFilter && { tags: { some: { tag: { slug: tagFilter } } } }),
      },
      include: {
        author: true,
        category: true,
        tags: { include: { tag: true } },
      },
      orderBy: { publishedAt: "desc" },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Catalogue</h1>
        <p className="text-sm text-muted-foreground">
          Parcourez tous les prompts publiés
        </p>
      </div>

      <form className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            placeholder="Rechercher des prompts..."
            defaultValue={query}
            className="pl-9"
          />
        </div>
      </form>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Link href="/prompts">
            <Badge variant={!categoryFilter ? "default" : "outline"}>
              Toutes
            </Badge>
          </Link>
          {categories.map((cat) => (
            <Link key={cat.id} href={`/prompts?category=${cat.slug}`}>
              <Badge variant={categoryFilter === cat.slug ? "default" : "outline"}>
                {cat.name}
              </Badge>
            </Link>
          ))}
        </div>
      )}

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <Link key={tag.id} href={`/prompts?tag=${tag.slug}`}>
              <Badge
                variant={tagFilter === tag.slug ? "default" : "secondary"}
                className="text-[10px]"
              >
                {tag.name}
              </Badge>
            </Link>
          ))}
        </div>
      )}

      {prompts.length > 0 ? (
        <PromptGrid prompts={prompts} />
      ) : (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            {query
              ? `Aucun résultat pour "${query}"`
              : "Aucun prompt publié pour le moment."}
          </p>
        </div>
      )}
    </div>
  );
}
