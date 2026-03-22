# Feature 2 : Notifications in-app

## Objectif

Créer une boucle de feedback pour les contributeurs. Actuellement, un éditeur qui soumet un prompt n'a aucun moyen de savoir qu'il a été approuvé, rejeté, commenté ou forké sans vérifier manuellement. Les notifications in-app informent les utilisateurs des événements importants liés à leurs prompts.

## User stories

### US-2.1 : Recevoir une notification
**En tant que** auteur d'un prompt,
**je veux** être notifié quand quelqu'un interagit avec mon prompt,
**afin de** rester informé sans vérifier manuellement.

**Critères d'acceptation :**
- Une notification est créée automatiquement pour les événements suivants :
  - Mon prompt est approuvé par un admin → type `PROMPT_APPROVED`
  - Mon prompt est rejeté par un admin → type `PROMPT_REJECTED`
  - Quelqu'un commente mon prompt → type `NEW_COMMENT`
  - Quelqu'un fork mon prompt → type `NEW_FORK`
  - Quelqu'un note mon prompt → type `NEW_RATING`
- Si je suis l'auteur de l'action (je commente mon propre prompt), aucune notification n'est créée
- Pour les réponses à un commentaire, l'auteur du commentaire parent est aussi notifié

### US-2.2 : Voir le badge de notifications non-lues
**En tant que** utilisateur,
**je veux** voir un indicateur visuel quand j'ai des notifications non-lues,
**afin de** savoir immédiatement qu'il y a du nouveau.

**Critères d'acceptation :**
- Une icône cloche est affichée dans la barre supérieure (topbar)
- Un badge rouge avec le nombre de notifications non-lues est superposé à la cloche
- Le badge disparaît quand il n'y a plus de notifications non-lues
- Le compteur se met à jour au chargement de la page

### US-2.3 : Consulter mes notifications
**En tant que** utilisateur,
**je veux** consulter la liste de toutes mes notifications,
**afin de** suivre l'historique des interactions sur mes prompts.

**Critères d'acceptation :**
- La page `/notifications` affiche toutes mes notifications triées par date (récentes en premier)
- Chaque notification affiche : icône par type, message descriptif, date relative, lien vers le prompt concerné
- Les notifications non-lues ont un style visuel distinct (fond coloré ou point indicateur)
- Cliquer sur une notification la marque comme lue et redirige vers le prompt

### US-2.4 : Marquer les notifications comme lues
**En tant que** utilisateur,
**je veux** marquer mes notifications comme lues,
**afin de** nettoyer mon fil de notifications.

**Critères d'acceptation :**
- Un bouton "Tout marquer comme lu" est disponible en haut de la page
- Chaque notification peut être marquée individuellement comme lue
- Le badge de la cloche se met à jour après le marquage

## Modèle de données

```prisma
model Notification {
  id        String   @id @default(uuid())
  userId    String
  type      String   // PROMPT_APPROVED | PROMPT_REJECTED | NEW_COMMENT | NEW_FORK | NEW_RATING
  message   String
  promptId  String?
  read      Boolean  @default(false)
  createdAt DateTime @default(now())

  user   User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  prompt Prompt? @relation(fields: [promptId], references: [id])
}
```

Relations inverses à ajouter :
- `User` : `notifications Notification[]`
- `Prompt` : `notifications Notification[]`

### Types de notifications

| Type | Destinataire | Message exemple |
|------|-------------|-----------------|
| `PROMPT_APPROVED` | Auteur du prompt | "Votre prompt «Rédiger un email» a été approuvé" |
| `PROMPT_REJECTED` | Auteur du prompt | "Votre prompt «Rédiger un email» a été rejeté" |
| `NEW_COMMENT` | Auteur du prompt (+ auteur du commentaire parent si réponse) | "Alice a commenté votre prompt «Rédiger un email»" |
| `NEW_FORK` | Auteur du prompt original | "Bob a forké votre prompt «Rédiger un email»" |
| `NEW_RATING` | Auteur du prompt | "Claire a noté votre prompt «Rédiger un email» (4/5)" |

## Permissions

| Action | ADMIN | EDITOR | READER |
|--------|-------|--------|--------|
| Recevoir des notifications | Oui | Oui | Oui |
| Consulter ses notifications | Oui | Oui | Oui |
| Marquer comme lu | Oui | Oui | Oui |

Aucune permission spéciale — chaque utilisateur accède uniquement à ses propres notifications.

## Architecture technique

### Helper serveur — `src/lib/actions/notifications.ts`

```
"use server"

// Helper (pas un server action) — appelé depuis d'autres actions
createNotification(userId: string, type: string, message: string, promptId?: string)
  - Crée une entrée Notification en base
  - Ne crée PAS de notification si userId === l'auteur de l'action

// Server actions
getNotifications(userId: string)
  - Retourne toutes les notifications de l'utilisateur, triées par date desc
  - Include la relation prompt pour le lien

markAsRead(formData: FormData)
  - Champs : notificationId
  - Met à jour read = true
  - revalidatePath("/notifications")

markAllAsRead(formData: FormData)
  - Champs : userId
  - Met à jour toutes les notifications non-lues de l'utilisateur
  - revalidatePath("/notifications")
```

### API route pour le badge — `src/app/api/notifications/unread/route.ts`

```
GET /api/notifications/unread?userId=xxx
  - Retourne { count: number }
  - Utilisé par le composant cloche pour afficher le badge
```

### Déclencheurs dans les actions existantes

| Fichier | Action déclencheuse | Notification |
|---------|---------------------|-------------|
| `src/lib/actions/prompts.ts` | `approvePrompt` | → auteur du prompt : PROMPT_APPROVED |
| `src/lib/actions/prompts.ts` | `rejectPrompt` | → auteur du prompt : PROMPT_REJECTED |
| `src/lib/actions/prompts.ts` | `forkPrompt` | → auteur du prompt original : NEW_FORK |
| `src/lib/actions/ratings.ts` | `ratePrompt` | → auteur du prompt : NEW_RATING |
| `src/lib/actions/comments.ts` | `createComment` | → auteur du prompt : NEW_COMMENT (+ auteur du parent si réponse) |

### Composants

**`src/components/layout/notification-bell.tsx`** (client) :
- Utilise `useRole()` pour récupérer le userId
- Fetch `/api/notifications/unread?userId=xxx` au montage
- Affiche l'icône `Bell` de lucide-react avec un badge rouge superposé
- Lien vers `/notifications`

**`src/app/notifications/notifications-view.tsx`** (client) :
- Reçoit la liste des notifications en props
- Filtre par userId via `useRole()`
- Affiche chaque notification dans une Card avec icône, message, date, lien
- Style différencié pour lu/non-lu (opacité, fond, point indicateur)

## Maquette UI

### Cloche dans la topbar

```
┌──────────────────────────────────────────────────┐
│  Promptly                    🔔(3)  ADMIN ▼      │
└──────────────────────────────────────────────────┘
```

### Page /notifications

```
┌─────────────────────────────────────────────────┐
│ Notifications                                    │
│                          [Tout marquer comme lu] │
├─────────────────────────────────────────────────┤
│                                                  │
│ ● ┌───────────────────────────────────────────┐ │
│   │ ✅ Prompt approuvé · il y a 10 min        │ │
│   │ Votre prompt «Rédiger un email» a été     │ │
│   │ approuvé                                   │ │
│   │                        [Voir le prompt →]  │ │
│   └───────────────────────────────────────────┘ │
│                                                  │
│ ● ┌───────────────────────────────────────────┐ │
│   │ 💬 Nouveau commentaire · il y a 30 min    │ │
│   │ Alice a commenté votre prompt «Analyse    │ │
│   │ de données»                                │ │
│   │                        [Voir le prompt →]  │ │
│   └───────────────────────────────────────────┘ │
│                                                  │
│   ┌───────────────────────────────────────────┐ │
│   │ 🔀 Nouveau fork · il y a 2 heures        │ │
│   │ Bob a forké votre prompt «Résumé de       │ │
│   │ réunion»                                   │ │
│   │                        [Voir le prompt →]  │ │
│   └───────────────────────────────────────────┘ │
│                                                  │
│ ● = non lu                                       │
└─────────────────────────────────────────────────┘
```

### Icônes par type

| Type | Icône |
|------|-------|
| PROMPT_APPROVED | `CheckCircle` (vert) |
| PROMPT_REJECTED | `XCircle` (rouge) |
| NEW_COMMENT | `MessageCircle` (bleu) |
| NEW_FORK | `GitFork` (violet) |
| NEW_RATING | `Star` (jaune) |

## Fichiers impactés

| Fichier | Action | Description |
|---------|--------|-------------|
| `prisma/schema.prisma` | Modifier | Ajouter le modèle Notification + relations |
| `src/lib/actions/notifications.ts` | Créer | Server actions + helper createNotification |
| `src/app/api/notifications/unread/route.ts` | Créer | Endpoint pour le compteur non-lu |
| `src/app/notifications/page.tsx` | Créer | Page serveur notifications |
| `src/app/notifications/notifications-view.tsx` | Créer | Composant client liste notifications |
| `src/components/layout/notification-bell.tsx` | Créer | Cloche avec badge dans la topbar |
| `src/components/layout/topbar.tsx` | Modifier | Intégrer la cloche |
| `src/components/layout/sidebar.tsx` | Modifier | Ajouter lien "Notifications" |
| `src/lib/actions/prompts.ts` | Modifier | Ajouter déclencheurs approve/reject/fork |
| `src/lib/actions/ratings.ts` | Modifier | Ajouter déclencheur rating |
| `src/lib/actions/comments.ts` | Modifier | Ajouter déclencheur commentaire |
| `prisma/seed.ts` | Modifier | Ajouter notifications exemples |

## Dépendances

- **Dépend de Feature 1 (Commentaires)** : le déclencheur `NEW_COMMENT` est ajouté dans `comments.ts` qui doit exister au préalable.

## Critères d'acceptation globaux

- [ ] L'approbation d'un prompt crée une notification chez l'auteur
- [ ] Le rejet d'un prompt crée une notification chez l'auteur
- [ ] Un commentaire crée une notification chez l'auteur du prompt
- [ ] Une réponse à un commentaire notifie aussi l'auteur du commentaire parent
- [ ] Un fork crée une notification chez l'auteur du prompt original
- [ ] Une note crée une notification chez l'auteur du prompt
- [ ] Aucune notification n'est créée si l'utilisateur agit sur son propre prompt
- [ ] La cloche affiche le bon compteur de notifications non-lues
- [ ] La page /notifications affiche toutes les notifications triées par date
- [ ] Les notifications non-lues ont un style visuel distinct
- [ ] "Tout marquer comme lu" fonctionne et met à jour le badge
- [ ] Cliquer sur une notification la marque comme lue
- [ ] `npm run build` passe sans erreur
