"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History, ChevronDown, ChevronUp, User, Calendar } from "lucide-react";

type Version = {
  id: string;
  versionNumber: number;
  content: string;
  notes: string | null;
  createdAt: string;
  author: { name: string };
};

export function VersionHistory({
  versions,
  currentVersionNumber,
}: {
  versions: Version[];
  currentVersionNumber: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);

  if (versions.length <= 1) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique des versions ({versions.length})
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent>
          <div className="space-y-3">
            {versions.map((version) => (
              <div
                key={version.id}
                className="rounded-lg border p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        version.versionNumber === currentVersionNumber
                          ? "default"
                          : "outline"
                      }
                    >
                      v{version.versionNumber}
                    </Badge>
                    {version.versionNumber === currentVersionNumber && (
                      <span className="text-xs text-muted-foreground">
                        (actuelle)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {version.author.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(version.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                </div>

                {version.notes && (
                  <p className="text-sm text-muted-foreground">
                    {version.notes}
                  </p>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() =>
                    setSelectedVersion(
                      selectedVersion === version.id ? null : version.id
                    )
                  }
                >
                  {selectedVersion === version.id
                    ? "Masquer le contenu"
                    : "Voir le contenu"}
                </Button>

                {selectedVersion === version.id && (
                  <pre className="whitespace-pre-wrap rounded-lg bg-muted p-3 text-xs font-mono max-h-[300px] overflow-y-auto">
                    {version.content}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
