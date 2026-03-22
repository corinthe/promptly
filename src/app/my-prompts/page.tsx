export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { MyPromptsList } from "./my-prompts-list";

export default async function MyPromptsPage() {
  // Fetch all prompts for all role-users (client will filter by current role)
  const allPrompts = await prisma.prompt.findMany({
    where: {
      authorId: { in: ["user-admin", "user-editor", "user-reader"] },
    },
    include: {
      author: true,
      category: true,
      tags: { include: { tag: true } },
      forkedFrom: { select: { title: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Group by authorId
  const promptsByUser: Record<string, typeof allPrompts> = {};
  for (const prompt of allPrompts) {
    if (!promptsByUser[prompt.authorId]) {
      promptsByUser[prompt.authorId] = [];
    }
    promptsByUser[prompt.authorId].push(prompt);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mes prompts</h1>
        <p className="text-sm text-muted-foreground">
          Retrouvez tous vos prompts, y compris les brouillons et les forks
        </p>
      </div>
      <MyPromptsList promptsByUser={promptsByUser} />
    </div>
  );
}
