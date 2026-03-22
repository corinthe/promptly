"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

const USER_NAMES: Record<string, { name: string; role: string }> = {
  "user-admin": { name: "Alice Martin", role: "ADMIN" },
  "user-editor": { name: "Bob Dupont", role: "EDITOR" },
  "user-reader": { name: "Claire Bernard", role: "READER" },
};

async function ensureUser(userId: string) {
  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (existing) return existing;
  const info = USER_NAMES[userId];
  if (!info) throw new Error("Utilisateur inconnu");
  return prisma.user.create({
    data: { id: userId, name: info.name, role: info.role },
  });
}

export async function toggleFavorite(formData: FormData) {
  const userId = formData.get("userId") as string;
  const promptId = formData.get("promptId") as string;

  if (!userId || !promptId) {
    throw new Error("Paramètres manquants");
  }

  await ensureUser(userId);

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
