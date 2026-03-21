import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Eye, Heart, User, Calendar, GitFork } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function PromptDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const prompt = await prisma.prompt.findUnique({
    where: { slug },
    include: {
      author: true,
      category: true,
      tags: { include: { tag: true } },
      versions: {
        orderBy: { versionNumber: "desc" },
        take: 1,
        include: { author: true },
      },
      forkedFrom: { select: { title: true, slug: true } },
      _count: { select: { forks: true } },
    },
  });

  if (!prompt) {
    notFound();
  }

  const currentVersion = prompt.versions[0];

  // Increment view count
  await prisma.prompt.update({
    where: { id: prompt.id },
    data: { viewCount: { increment: 1 } },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/prompts"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Retour au catalogue
      </Link>

      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">{prompt.title}</h1>
            <p className="text-muted-foreground">{prompt.description}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Heart className="h-4 w-4 mr-1" />
              {prompt.favoriteCount}
            </Button>
            <Button variant="outline" size="sm">
              <GitFork className="h-4 w-4 mr-1" />
              Fork
            </Button>
          </div>
        </div>

        {prompt.forkedFrom && (
          <p className="text-sm text-muted-foreground">
            Forké depuis{" "}
            <Link href={`/prompts/${prompt.forkedFrom.slug}`} className="underline">
              {prompt.forkedFrom.title}
            </Link>
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="h-4 w-4" /> {prompt.author.name}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {prompt.publishedAt
              ? new Date(prompt.publishedAt).toLocaleDateString("fr-FR")
              : new Date(prompt.createdAt).toLocaleDateString("fr-FR")}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-4 w-4" /> {prompt.viewCount} vues
          </span>
          <span className="flex items-center gap-1">
            <Copy className="h-4 w-4" /> {prompt.copyCount} copies
          </span>
          {prompt._count.forks > 0 && (
            <span className="flex items-center gap-1">
              <GitFork className="h-4 w-4" /> {prompt._count.forks} forks
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {prompt.category && (
            <Badge variant="outline">{prompt.category.name}</Badge>
          )}
          {prompt.tags.map(({ tag }) => (
            <Badge key={tag.id} variant="secondary">
              {tag.name}
            </Badge>
          ))}
        </div>
      </div>

      {currentVersion && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Contenu du prompt</CardTitle>
                <Button size="sm" variant="default">
                  <Copy className="h-4 w-4 mr-1" />
                  Copier
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm font-mono">
                {currentVersion.content}
              </pre>
            </CardContent>
          </Card>

          {currentVersion.useCases && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cas d&apos;usage</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{currentVersion.useCases}</p>
              </CardContent>
            </Card>
          )}

          {currentVersion.inputExamples && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Exemples d&apos;input</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm font-mono">
                  {currentVersion.inputExamples}
                </pre>
              </CardContent>
            </Card>
          )}

          {currentVersion.outputExamples && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Exemples d&apos;output</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm font-mono">
                  {currentVersion.outputExamples}
                </pre>
              </CardContent>
            </Card>
          )}

          {currentVersion.instructions && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Instructions d&apos;utilisation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{currentVersion.instructions}</p>
              </CardContent>
            </Card>
          )}

          <div className="text-xs text-muted-foreground">
            Version {currentVersion.versionNumber} • Mis à jour le{" "}
            {new Date(currentVersion.createdAt).toLocaleDateString("fr-FR")}
          </div>
        </div>
      )}
    </div>
  );
}
