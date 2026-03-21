export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, User } from "lucide-react";

export default async function ApprovalsPage() {
  const pendingApprovals = await prisma.approvalRequest.findMany({
    where: { status: "PENDING" },
    include: {
      prompt: { include: { author: true, category: true } },
      version: true,
      submittedBy: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Approbations</h1>
        <p className="text-sm text-muted-foreground">
          Examinez et approuvez les prompts soumis
        </p>
      </div>

      {pendingApprovals.length > 0 ? (
        <div className="space-y-4">
          {pendingApprovals.map((approval) => (
            <Card key={approval.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {approval.prompt.title}
                    </CardTitle>
                    <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {approval.submittedBy.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(approval.createdAt).toLocaleDateString("fr-FR")}
                      </span>
                      {approval.prompt.category && (
                        <Badge variant="outline" className="text-[10px]">
                          {approval.prompt.category.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline">En attente</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  {approval.prompt.description}
                </p>
                <pre className="mb-4 whitespace-pre-wrap rounded-lg bg-muted p-3 text-xs font-mono">
                  {approval.version.content.slice(0, 300)}
                  {approval.version.content.length > 300 && "..."}
                </pre>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm">
                    <XCircle className="h-4 w-4 mr-1" />
                    Rejeter
                  </Button>
                  <Button size="sm">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approuver
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            Aucun prompt en attente d&apos;approbation.
          </p>
        </div>
      )}
    </div>
  );
}
