"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRole } from "@/components/role-provider";
import { can } from "@/lib/permissions";
import { createPrompt } from "@/lib/actions/prompts";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type Category = { id: string; name: string; slug: string };
type Tag = { id: string; name: string; slug: string };

export default function NewPromptPage() {
  const { role, userId } = useRole();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/metadata")
      .then((r) => r.json())
      .then((data) => {
        setCategories(data.categories ?? []);
        setTags(data.tags ?? []);
      })
      .catch(() => {});
  }, []);

  if (!can(role, "create_prompt")) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">
          Vous n&apos;avez pas la permission de créer des prompts.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Passez en mode Éditeur ou Admin pour créer des prompts.
        </p>
      </div>
    );
  }

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/prompts"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Retour au catalogue
      </Link>

      <h1 className="text-2xl font-bold tracking-tight">Nouveau prompt</h1>

      <form action={createPrompt} className="space-y-6">
        <input type="hidden" name="userId" value={userId} />

        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium" htmlFor="title">
                Titre *
              </label>
              <Input id="title" name="title" required placeholder="Ex: Résumé de document technique" />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="description">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                required
                placeholder="Décrivez brièvement ce que fait ce prompt..."
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="categoryId">
                Catégorie
              </label>
              <select
                id="categoryId"
                name="categoryId"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">-- Aucune --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            {tags.length > 0 && (
              <div>
                <label className="text-sm font-medium">Tags</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                        selectedTags.includes(tag.id)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input hover:bg-muted"
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))}
                  {selectedTags.map((id) => (
                    <input key={id} type="hidden" name="tagIds" value={id} />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contenu du prompt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium" htmlFor="content">
                Template du prompt *
              </label>
              <textarea
                id="content"
                name="content"
                required
                placeholder="Écrivez votre prompt ici..."
                rows={8}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Métadonnées enrichies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium" htmlFor="useCases">
                Cas d&apos;usage
              </label>
              <textarea
                id="useCases"
                name="useCases"
                placeholder="Dans quels contextes utiliser ce prompt..."
                rows={3}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="inputExamples">
                Exemples d&apos;input
              </label>
              <textarea
                id="inputExamples"
                name="inputExamples"
                placeholder="Exemples de données d'entrée..."
                rows={3}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="outputExamples">
                Exemples d&apos;output
              </label>
              <textarea
                id="outputExamples"
                name="outputExamples"
                placeholder="Exemples de résultats attendus..."
                rows={3}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="instructions">
                Instructions d&apos;utilisation
              </label>
              <textarea
                id="instructions"
                name="instructions"
                placeholder="Comment utiliser ce prompt efficacement..."
                rows={3}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="submit" name="action" value="draft" variant="outline">
            Sauvegarder comme brouillon
          </Button>
          <Button type="submit" name="action" value="submit">
            Soumettre pour approbation
          </Button>
        </div>
      </form>
    </div>
  );
}
