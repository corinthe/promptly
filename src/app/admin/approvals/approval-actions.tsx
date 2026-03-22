"use client";

import { Button } from "@/components/ui/button";
import { useRole } from "@/components/role-provider";
import { approvePrompt, rejectPrompt } from "@/lib/actions/prompts";
import { CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";

export function ApprovalActions({ approvalId }: { approvalId: string }) {
  const { userId } = useRole();
  const [showRejectNote, setShowRejectNote] = useState(false);

  return (
    <div className="space-y-3">
      {showRejectNote && (
        <form action={rejectPrompt} className="space-y-2">
          <input type="hidden" name="approvalId" value={approvalId} />
          <input type="hidden" name="reviewerId" value={userId} />
          <textarea
            name="reviewNote"
            placeholder="Raison du rejet (optionnel)..."
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            rows={2}
          />
          <div className="flex gap-2">
            <Button type="submit" variant="outline" size="sm">
              <XCircle className="h-4 w-4 mr-1" />
              Confirmer le rejet
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowRejectNote(false)}
            >
              Annuler
            </Button>
          </div>
        </form>
      )}

      {!showRejectNote && (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRejectNote(true)}
          >
            <XCircle className="h-4 w-4 mr-1" />
            Rejeter
          </Button>
          <form action={approvePrompt}>
            <input type="hidden" name="approvalId" value={approvalId} />
            <input type="hidden" name="reviewerId" value={userId} />
            <Button size="sm" type="submit">
              <CheckCircle className="h-4 w-4 mr-1" />
              Approuver
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
