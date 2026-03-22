"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function toggleFavorite(formData: FormData) {
  const userId = formData.get("userId") as string;
  const promptId = formData.get("promptId") as string;

  if (!userId || !promptId) {
    throw new Error("Paramètres manquants");
  }

  const existing = await prisma.favorite.findUnique({
    where: { userId_promptId: { userId, promptId } },
  });

  if (existing) {
    await prisma.favorite.delete({
      where: { userId_promptId: { userId, promptId } },
    });
    await prisma.prompt.update({
      where: { id: promptId },
      data: { favoriteCount: { decrement: 1 } },
    });
  } else {
    await prisma.favorite.create({
      data: { userId, promptId },
    });
    await prisma.prompt.update({
      where: { id: promptId },
      data: { favoriteCount: { increment: 1 } },
    });
  }

  revalidatePath("/favorites");
  revalidatePath("/prompts");
  revalidatePath("/");
}
