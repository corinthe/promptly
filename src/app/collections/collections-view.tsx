"use client";

import { useState } from "react";
import { useRole } from "@/components/role-provider";
import { can } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PromptCard } from "@/components/prompts/prompt-card";
import {
  createCollection,
  deleteCollection,
  addToCollection,
  removeFromCollection,
} from "@/lib/actions/collections";
import { Plus, Trash2, X, FolderOpen } from "lucide-react";
import type {
  Collection,
  CollectionPrompt,
  Prompt,
  User,
  Category,
  PromptTag,
  Tag,
} from "@/generated/prisma/client";

type PromptWithRelations = Prompt & {
  author: User;
  category: Category | null;
  tags: (PromptTag & { tag: Tag })[];
};

type CollectionWithItems = Collection & {
  creator: User;
  items: (CollectionPrompt & { prompt: PromptWithRelations })[];
  _count: { items: number };
};

type SimplePrompt = { id: string; title: string };

export function CollectionsView({
  collections,
  publishedPrompts,
}: {
  collections: CollectionWithItems[];
  publishedPrompts: SimplePrompt[];
}) {
  const { role, userId } = useRole();
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addingTo, setAddingTo] = useState<string | null>(null);

  const canCreate = can(role, "create_collection");

  return (
    <div className="space-y-4">
      {canCreate && (
        <>
          {showCreate ? (
            <Card>
              <CardContent className="pt-6">
                <form action={createCollection} className="space-y-3">
                  <input type="hidden" name="creatorId" value={userId} />
                  <Input name="name" placeholder="Nom de la collection" required />
                  <textarea
                    name="description"
                    placeholder="Description (optionnel)"
                    rows={2}
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm">
                      Créer
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCreate(false)}
                    >
                      Annuler
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Nouvelle collection
            </Button>
          )}
        </>
      )}

      {collections.length > 0 ? (
        <div className="space-y-4">
          {collections.map((col) => {
            const isExpanded = expandedId === col.id;
            const isAdding = addingTo === col.id;
            const promptIdsInCollection = col.items.map((i) => i.promptId);
            const availablePrompts = publishedPrompts.filter(
              (p) => !promptIdsInCollection.includes(p.id)
            );

            return (
              <Card key={col.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : col.id)}
                      className="text-left"
                    >
                      <CardTitle className="text-base">{col.name}</CardTitle>
                      {col.description && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {col.description}
                        </p>
                      )}
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Par {col.creator.name}</span>
                        <Badge variant="secondary" className="text-[10px]">
                          {col._count.items} prompt{col._count.items !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                    </button>
                    <div className="flex gap-1">
                      {canCreate && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAddingTo(isAdding ? null : col.id)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <form action={deleteCollection}>
                            <input type="hidden" name="collectionId" value={col.id} />
                            <Button variant="ghost" size="sm" type="submit">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </form>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>

                {isAdding && availablePrompts.length > 0 && (
                  <CardContent className="border-t pt-4">
                    <p className="mb-2 text-sm font-medium">Ajouter un prompt :</p>
                    <div className="flex flex-wrap gap-2">
                      {availablePrompts.map((p) => (
                        <form key={p.id} action={addToCollection}>
                          <input type="hidden" name="collectionId" value={col.id} />
                          <input type="hidden" name="promptId" value={p.id} />
                          <Button variant="outline" size="sm" type="submit">
                            <Plus className="h-3 w-3 mr-1" />
                            {p.title}
                          </Button>
                        </form>
                      ))}
                    </div>
                  </CardContent>
                )}

                {isExpanded && col.items.length > 0 && (
                  <CardContent className="border-t pt-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {col.items.map((item) => (
                        <div key={item.promptId} className="relative">
                          <PromptCard prompt={item.prompt} />
                          {canCreate && (
                            <form
                              action={removeFromCollection}
                              className="absolute top-2 right-2"
                            >
                              <input type="hidden" name="collectionId" value={col.id} />
                              <input type="hidden" name="promptId" value={item.promptId} />
                              <Button
                                variant="destructive"
                                size="sm"
                                type="submit"
                                className="h-6 w-6 p-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </form>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}

                {isExpanded && col.items.length === 0 && (
                  <CardContent className="border-t pt-4">
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Cette collection est vide.
                    </p>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <FolderOpen className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">
            Aucune collection créée pour le moment.
          </p>
        </div>
      )}
    </div>
  );
}
