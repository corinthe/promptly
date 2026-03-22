"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/actions/categories";
import { Plus, Pencil, Trash2, Check, X, Tags } from "lucide-react";
import type { Category } from "@/generated/prisma/client";

type CategoryWithCount = Category & {
  _count: { prompts: number };
};

export function CategoriesView({
  categories,
}: {
  categories: CategoryWithCount[];
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {showCreate ? (
        <Card>
          <CardContent className="pt-6">
            <form action={createCategory} className="space-y-3">
              <Input name="name" placeholder="Nom de la catégorie" required />
              <Input name="description" placeholder="Description (optionnel)" />
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
          Nouvelle catégorie
        </Button>
      )}

      {categories.length > 0 ? (
        <div className="grid gap-3">
          {categories.map((cat) => {
            const isEditing = editingId === cat.id;

            if (isEditing) {
              return (
                <Card key={cat.id}>
                  <CardContent className="py-4">
                    <form action={updateCategory} className="space-y-3">
                      <input type="hidden" name="categoryId" value={cat.id} />
                      <Input
                        name="name"
                        defaultValue={cat.name}
                        required
                      />
                      <Input
                        name="description"
                        defaultValue={cat.description ?? ""}
                        placeholder="Description"
                      />
                      <div className="flex gap-2">
                        <Button type="submit" size="sm">
                          <Check className="h-4 w-4 mr-1" />
                          Enregistrer
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingId(null)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Annuler
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              );
            }

            return (
              <Card key={cat.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium">{cat.name}</p>
                    {cat.description && (
                      <p className="text-sm text-muted-foreground">
                        {cat.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {cat._count.prompts} prompt
                      {cat._count.prompts !== 1 ? "s" : ""}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingId(cat.id)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <form action={deleteCategory}>
                      <input type="hidden" name="categoryId" value={cat.id} />
                      <Button variant="ghost" size="sm" type="submit">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Tags className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">
            Aucune catégorie créée pour le moment.
          </p>
        </div>
      )}
    </div>
  );
}
