export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { TeamsView } from "./teams-view";

export default async function TeamsPage() {
  const teams = await prisma.team.findMany({
    include: {
      teamMembers: {
        include: { user: true },
      },
      _count: { select: { prompts: true } },
    },
    orderBy: { name: "asc" },
  });

  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Équipes</h1>
        <p className="text-sm text-muted-foreground">
          Gérez les équipes et leurs membres
        </p>
      </div>
      <TeamsView teams={teams} users={users} />
    </div>
  );
}
