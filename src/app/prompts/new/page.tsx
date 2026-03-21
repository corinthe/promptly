"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRole } from "@/components/role-provider";
import { can } from "@/lib/permissions";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewPromptPage() {
  const { role } = useRole();

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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/prompts"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Retour au catalogue
      </Link>

      <h1 className="text-2xl font-bold tracking-tight">Nouveau prompt</h1>

      <form className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium" htmlFor="title">
                Titre *
              </label>
              <Input id="title" placeholder="Ex: Résumé de document technique" />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="description">
                Description *
              </label>
              <textarea
                id="description"
                placeholder="Décrivez brièvement ce que fait ce prompt..."
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
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
                placeholder="Comment utiliser ce prompt efficacement..."
                rows={3}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline">
            Sauvegarder comme brouillon
          </Button>
          <Button type="submit">
            Soumettre pour approbation
          </Button>
        </div>
      </form>
    </div>
  );
}
