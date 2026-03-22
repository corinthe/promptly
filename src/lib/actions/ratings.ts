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

export async function ratePrompt(formData: FormData) {
  const userId = formData.get("userId") as string;
  const promptId = formData.get("promptId") as string;
  const score = parseInt(formData.get("score") as string, 10);

  if (!userId || !promptId || isNaN(score) || score < 1 || score > 5) {
    throw new Error("Paramètres invalides");
  }

  await ensureUser(userId);

  // Upsert the rating
  await prisma.rating.upsert({
    where: { userId_promptId: { userId, promptId } },
    create: { userId, promptId, score },
    update: { score },
  });

  // Recalculate average
  const aggregate = await prisma.rating.aggregate({
    where: { promptId },
    _avg: { score: true },
    _count: { score: true },
  });

  await prisma.prompt.update({
    where: { id: promptId },
    data: {
      ratingAvg: aggregate._avg.score ?? 0,
      ratingCount: aggregate._count.score,
    },
  });

  revalidatePath("/prompts");
}
