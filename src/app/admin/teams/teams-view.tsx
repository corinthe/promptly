"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  createTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
} from "@/lib/actions/teams";
import { Plus, Trash2, UserPlus, UserMinus, Users } from "lucide-react";
import type { Team, TeamMember, User } from "@/generated/prisma/client";

type TeamWithMembers = Team & {
  teamMembers: (TeamMember & { user: User })[];
  _count: { prompts: number };
};

export function TeamsView({
  teams,
  users,
}: {
  teams: TeamWithMembers[];
  users: User[];
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [addingMemberTo, setAddingMemberTo] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {showCreate ? (
        <Card>
          <CardContent className="pt-6">
            <form action={createTeam} className="flex gap-2">
              <Input name="name" placeholder="Nom de l'équipe" required className="flex-1" />
              <Button type="submit" size="sm">
                Créer
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowCreate(false)}
              >
                Annuler
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Nouvelle équipe
        </Button>
      )}

      {teams.length > 0 ? (
        <div className="space-y-4">
          {teams.map((team) => {
            const memberUserIds = team.teamMembers.map((m) => m.userId);
            const availableUsers = users.filter(
              (u) => !memberUserIds.includes(u.id)
            );
            const isAddingMember = addingMemberTo === team.id;

            return (
              <Card key={team.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{team.name}</CardTitle>
                      <div className="mt-1 flex gap-2">
                        <Badge variant="secondary" className="text-[10px]">
                          {team.teamMembers.length} membre{team.teamMembers.length !== 1 ? "s" : ""}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {team._count.prompts} prompt{team._count.prompts !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setAddingMemberTo(isAddingMember ? null : team.id)
                        }
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                      <form action={deleteTeam}>
                        <input type="hidden" name="teamId" value={team.id} />
                        <Button variant="ghost" size="sm" type="submit">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </form>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isAddingMember && availableUsers.length > 0 && (
                    <div className="rounded-lg border p-3">
                      <p className="mb-2 text-sm font-medium">Ajouter un membre :</p>
                      <div className="flex flex-wrap gap-2">
                        {availableUsers.map((user) => (
                          <form key={user.id} action={addTeamMember}>
                            <input type="hidden" name="teamId" value={team.id} />
                            <input type="hidden" name="userId" value={user.id} />
                            <Button variant="outline" size="sm" type="submit">
                              <UserPlus className="h-3 w-3 mr-1" />
                              {user.name}
                            </Button>
                          </form>
                        ))}
                      </div>
                    </div>
                  )}

                  {team.teamMembers.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {team.teamMembers.map((member) => (
                        <div
                          key={member.userId}
                          className="flex items-center gap-1 rounded-full border px-3 py-1 text-sm"
                        >
                          <span>{member.user.name}</span>
                          <form action={removeTeamMember}>
                            <input type="hidden" name="teamId" value={team.id} />
                            <input type="hidden" name="userId" value={member.userId} />
                            <button
                              type="submit"
                              className="ml-1 text-muted-foreground hover:text-destructive"
                            >
                              <UserMinus className="h-3 w-3" />
                            </button>
                          </form>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Aucun membre dans cette équipe.
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Users className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">
            Aucune équipe créée pour le moment.
          </p>
        </div>
      )}
    </div>
  );
}
