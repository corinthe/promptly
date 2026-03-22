"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createCollection(formData: FormData) {
  const creatorId = formData.get("creatorId") as string;
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;

  if (!creatorId || !name) {
    throw new Error("Champs obligatoires manquants");
  }

  await prisma.collection.create({
    data: { name, description, creatorId },
  });

  revalidatePath("/collections");
}

export async function deleteCollection(formData: FormData) {
  const collectionId = formData.get("collectionId") as string;

  if (!collectionId) {
    throw new Error("Collection ID manquant");
  }

  await prisma.collection.delete({ where: { id: collectionId } });

  revalidatePath("/collections");
}

export async function addToCollection(formData: FormData) {
  const collectionId = formData.get("collectionId") as string;
  const promptId = formData.get("promptId") as string;

  if (!collectionId || !promptId) {
    throw new Error("Paramètres manquants");
  }

  const existing = await prisma.collectionPrompt.findUnique({
    where: { collectionId_promptId: { collectionId, promptId } },
  });

  if (!existing) {
    const maxOrder = await prisma.collectionPrompt.findFirst({
      where: { collectionId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    await prisma.collectionPrompt.create({
      data: {
        collectionId,
        promptId,
        sortOrder: (maxOrder?.sortOrder ?? 0) + 1,
      },
    });
  }

  revalidatePath("/collections");
}

export async function removeFromCollection(formData: FormData) {
  const collectionId = formData.get("collectionId") as string;
  const promptId = formData.get("promptId") as string;

  if (!collectionId || !promptId) {
    throw new Error("Paramètres manquants");
  }

  await prisma.collectionPrompt.delete({
    where: { collectionId_promptId: { collectionId, promptId } },
  });

  revalidatePath("/collections");
}
