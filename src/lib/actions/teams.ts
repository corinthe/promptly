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

export async function createTeam(formData: FormData) {
  const name = formData.get("name") as string;

  if (!name) {
    throw new Error("Nom obligatoire");
  }

  const baseSlug = slugify(name);
  const existing = await prisma.team.findUnique({ where: { slug: baseSlug } });
  const slug = existing ? `${baseSlug}-${Date.now()}` : baseSlug;

  await prisma.team.create({ data: { name, slug } });

  revalidatePath("/admin/teams");
}

export async function deleteTeam(formData: FormData) {
  const teamId = formData.get("teamId") as string;

  if (!teamId) {
    throw new Error("Team ID manquant");
  }

  await prisma.team.delete({ where: { id: teamId } });

  revalidatePath("/admin/teams");
}

export async function addTeamMember(formData: FormData) {
  const teamId = formData.get("teamId") as string;
  const userId = formData.get("userId") as string;

  if (!teamId || !userId) {
    throw new Error("Paramètres manquants");
  }

  const existing = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId } },
  });

  if (!existing) {
    await prisma.teamMember.create({ data: { userId, teamId } });
  }

  revalidatePath("/admin/teams");
}

export async function removeTeamMember(formData: FormData) {
  const teamId = formData.get("teamId") as string;
  const userId = formData.get("userId") as string;

  if (!teamId || !userId) {
    throw new Error("Paramètres manquants");
  }

  await prisma.teamMember.delete({
    where: { userId_teamId: { userId, teamId } },
  });

  revalidatePath("/admin/teams");
}
