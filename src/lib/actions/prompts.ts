"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function createPrompt(formData: FormData) {
  const userId = formData.get("userId") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const content = formData.get("content") as string;
  const categoryId = (formData.get("categoryId") as string) || null;
  const tagIds = formData.getAll("tagIds") as string[];
  const useCases = (formData.get("useCases") as string) || null;
  const inputExamples = (formData.get("inputExamples") as string) || null;
  const outputExamples = (formData.get("outputExamples") as string) || null;
  const instructions = (formData.get("instructions") as string) || null;
  const intent = formData.get("intent") as string; // "draft" or "submit"

  if (!userId || !title || !description || !content) {
    throw new Error("Champs obligatoires manquants");
  }

  await ensureUser(userId);

  const baseSlug = slugify(title);
  const existing = await prisma.prompt.findUnique({ where: { slug: baseSlug } });
  const slug = existing ? `${baseSlug}-${Date.now()}` : baseSlug;

  const status = intent === "submit" ? "SUBMITTED" : "DRAFT";

  const prompt = await prisma.prompt.create({
    data: {
      title,
      slug,
      description,
      status,
      authorId: userId,
      categoryId,
      tags: tagIds.length > 0
        ? { create: tagIds.map((tagId) => ({ tagId })) }
        : undefined,
      versions: {
        create: {
          versionNumber: 1,
          content,
          useCases,
          inputExamples,
          outputExamples,
          instructions,
          authorId: userId,
        },
      },
    },
    include: { versions: true },
  });

  // Set currentVersionId
  await prisma.prompt.update({
    where: { id: prompt.id },
    data: { currentVersionId: prompt.versions[0].id },
  });

  // Create approval request if submitting
  if (status === "SUBMITTED") {
    await prisma.approvalRequest.create({
      data: {
        promptId: prompt.id,
        versionId: prompt.versions[0].id,
        submittedById: userId,
      },
    });
  }

  revalidatePath("/prompts");
  revalidatePath("/admin/approvals");
  redirect(`/prompts/${slug}`);
}

export async function approvePrompt(formData: FormData) {
  const approvalId = formData.get("approvalId") as string;
  const reviewerId = formData.get("reviewerId") as string;

  if (!approvalId || !reviewerId) {
    throw new Error("Paramètres manquants");
  }

  await ensureUser(reviewerId);

  const approval = await prisma.approvalRequest.update({
    where: { id: approvalId },
    data: {
      status: "APPROVED",
      reviewedById: reviewerId,
      reviewedAt: new Date(),
    },
  });

  await prisma.prompt.update({
    where: { id: approval.promptId },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });

  revalidatePath("/admin/approvals");
  revalidatePath("/prompts");
  revalidatePath("/");
}

export async function rejectPrompt(formData: FormData) {
  const approvalId = formData.get("approvalId") as string;
  const reviewerId = formData.get("reviewerId") as string;
  const reviewNote = (formData.get("reviewNote") as string) || null;

  if (!approvalId || !reviewerId) {
    throw new Error("Paramètres manquants");
  }

  await ensureUser(reviewerId);

  const approval = await prisma.approvalRequest.update({
    where: { id: approvalId },
    data: {
      status: "REJECTED",
      reviewedById: reviewerId,
      reviewedAt: new Date(),
      reviewNote,
    },
  });

  await prisma.prompt.update({
    where: { id: approval.promptId },
    data: { status: "REJECTED" },
  });

  revalidatePath("/admin/approvals");
  revalidatePath("/prompts");
}

export async function submitDraftPrompt(formData: FormData) {
  const promptId = formData.get("promptId") as string;
  const userId = formData.get("userId") as string;

  if (!promptId || !userId) {
    throw new Error("Paramètres manquants");
  }

  await ensureUser(userId);

  const prompt = await prisma.prompt.findUnique({
    where: { id: promptId },
    include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
  });

  if (!prompt || prompt.status !== "DRAFT") {
    throw new Error("Prompt introuvable ou non brouillon");
  }

  await prisma.prompt.update({
    where: { id: promptId },
    data: { status: "SUBMITTED" },
  });

  if (prompt.versions[0]) {
    await prisma.approvalRequest.create({
      data: {
        promptId,
        versionId: prompt.versions[0].id,
        submittedById: userId,
      },
    });
  }

  revalidatePath(`/prompts/${prompt.slug}`);
  revalidatePath("/prompts");
  revalidatePath("/admin/approvals");
  revalidatePath("/my-prompts");
}

export async function copyPrompt(formData: FormData) {
  const promptId = formData.get("promptId") as string;

  if (!promptId) {
    throw new Error("Prompt ID manquant");
  }

  await prisma.prompt.update({
    where: { id: promptId },
    data: { copyCount: { increment: 1 } },
  });

  revalidatePath(`/prompts`);
}

export async function forkPrompt(formData: FormData) {
  const promptId = formData.get("promptId") as string;
  const userId = formData.get("userId") as string;

  if (!promptId || !userId) {
    throw new Error("Paramètres manquants");
  }

  await ensureUser(userId);

  const original = await prisma.prompt.findUnique({
    where: { id: promptId },
    include: {
      versions: { orderBy: { versionNumber: "desc" }, take: 1 },
      tags: true,
    },
  });

  if (!original) {
    throw new Error("Prompt introuvable");
  }

  const baseSlug = `${original.slug}-fork`;
  const existing = await prisma.prompt.findUnique({ where: { slug: baseSlug } });
  const slug = existing ? `${baseSlug}-${Date.now()}` : baseSlug;

  const latestVersion = original.versions[0];

  const forked = await prisma.prompt.create({
    data: {
      title: `${original.title} (fork)`,
      slug,
      description: original.description,
      status: "DRAFT",
      authorId: userId,
      categoryId: original.categoryId,
      forkedFromId: original.id,
      tags: original.tags.length > 0
        ? { create: original.tags.map((t) => ({ tagId: t.tagId })) }
        : undefined,
      versions: latestVersion
        ? {
            create: {
              versionNumber: 1,
              content: latestVersion.content,
              useCases: latestVersion.useCases,
              inputExamples: latestVersion.inputExamples,
              outputExamples: latestVersion.outputExamples,
              instructions: latestVersion.instructions,
              authorId: userId,
            },
          }
        : undefined,
    },
  });

  revalidatePath("/prompts");
  redirect(`/prompts/${forked.slug}`);
}
