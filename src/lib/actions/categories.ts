"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function createCategory(formData: FormData) {
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;

  if (!name) {
    throw new Error("Nom obligatoire");
  }

  const baseSlug = slugify(name);
  const existing = await prisma.category.findUnique({ where: { slug: baseSlug } });
  const slug = existing ? `${baseSlug}-${Date.now()}` : baseSlug;

  const maxOrder = await prisma.category.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  await prisma.category.create({
    data: {
      name,
      slug,
      description,
      sortOrder: (maxOrder?.sortOrder ?? 0) + 1,
    },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/prompts");
}

export async function updateCategory(formData: FormData) {
  const categoryId = formData.get("categoryId") as string;
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;

  if (!categoryId || !name) {
    throw new Error("Paramètres manquants");
  }

  await prisma.category.update({
    where: { id: categoryId },
    data: { name, description },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/prompts");
}

export async function deleteCategory(formData: FormData) {
  const categoryId = formData.get("categoryId") as string;

  if (!categoryId) {
    throw new Error("Category ID manquant");
  }

  await prisma.category.delete({ where: { id: categoryId } });

  revalidatePath("/admin/categories");
  revalidatePath("/prompts");
}
