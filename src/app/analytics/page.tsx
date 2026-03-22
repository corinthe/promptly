export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Copy, Heart, Star, FileText, Users, TrendingUp } from "lucide-react";
import Link from "next/link";

export default async function AnalyticsPage() {
  const [
    totalPrompts,
    totalPublished,
    totalUsers,
    totalCopies,
    totalViews,
    mostViewed,
    mostCopied,
    mostFavorited,
    topRated,
    recentlyPublished,
  ] = await Promise.all([
    prisma.prompt.count(),
    prisma.prompt.count({ where: { status: "PUBLISHED" } }),
    prisma.user.count(),
    prisma.prompt.aggregate({ _sum: { copyCount: true } }),
    prisma.prompt.aggregate({ _sum: { viewCount: true } }),
    prisma.prompt.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { viewCount: "desc" },
      take: 5,
      include: { author: true, category: true },
    }),
    prisma.prompt.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { copyCount: "desc" },
      take: 5,
      include: { author: true, category: true },
    }),
    prisma.prompt.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { favoriteCount: "desc" },
      take: 5,
      include: { author: true, category: true },
    }),
    prisma.prompt.findMany({
      where: { status: "PUBLISHED", ratingCount: { gt: 0 } },
      orderBy: { ratingAvg: "desc" },
      take: 5,
      include: { author: true, category: true },
    }),
    prisma.prompt.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 5,
      include: { author: true, category: true },
    }),
  ]);

  const statCards = [
    { label: "Prompts totaux", value: totalPrompts, icon: FileText },
    { label: "Publiés", value: totalPublished, icon: TrendingUp },
    { label: "Utilisateurs", value: totalUsers, icon: Users },
    { label: "Copies totales", value: totalCopies._sum.copyCount ?? 0, icon: Copy },
    { label: "Vues totales", value: totalViews._sum.viewCount ?? 0, icon: Eye },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Vue d&apos;ensemble de l&apos;utilisation de la plateforme
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex flex-col items-center justify-center py-6">
              <stat.icon className="h-6 w-6 text-muted-foreground mb-2" />
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RankingCard
          title="Les plus consultés"
          icon={<Eye className="h-5 w-5" />}
          prompts={mostViewed}
          metric={(p) => `${p.viewCount} vues`}
        />
        <RankingCard
          title="Les plus copiés"
          icon={<Copy className="h-5 w-5" />}
          prompts={mostCopied}
          metric={(p) => `${p.copyCount} copies`}
        />
        <RankingCard
          title="Les plus favoris"
          icon={<Heart className="h-5 w-5" />}
          prompts={mostFavorited}
          metric={(p) => `${p.favoriteCount} favoris`}
        />
        <RankingCard
          title="Les mieux notés"
          icon={<Star className="h-5 w-5" />}
          prompts={topRated}
          metric={(p) => `${p.ratingAvg.toFixed(1)} / 5 (${p.ratingCount})`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Dernières publications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentlyPublished.map((prompt) => (
              <Link
                key={prompt.id}
                href={`/prompts/${prompt.slug}`}
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="font-medium text-sm">{prompt.title}</p>
                  <p className="text-xs text-muted-foreground">
                    par {prompt.author.name} • {prompt.publishedAt ? new Date(prompt.publishedAt).toLocaleDateString("fr-FR") : ""}
                  </p>
                </div>
                {prompt.category && (
                  <Badge variant="outline" className="text-[10px]">
                    {prompt.category.name}
                  </Badge>
                )}
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

type PromptWithMeta = {
  id: string;
  title: string;
  slug: string;
  viewCount: number;
  copyCount: number;
  favoriteCount: number;
  ratingAvg: number;
  ratingCount: number;
  author: { name: string };
  category: { name: string } | null;
};

function RankingCard({
  title,
  icon,
  prompts,
  metric,
}: {
  title: string;
  icon: React.ReactNode;
  prompts: PromptWithMeta[];
  metric: (p: PromptWithMeta) => string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {prompts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune donnée</p>
        ) : (
          <div className="space-y-2">
            {prompts.map((prompt, i) => (
              <Link
                key={prompt.id}
                href={`/prompts/${prompt.slug}`}
                className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/50 transition-colors"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{prompt.title}</p>
                  <p className="text-xs text-muted-foreground">{prompt.author.name}</p>
                </div>
                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                  {metric(prompt)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
