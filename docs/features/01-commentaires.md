# Feature 1 : Commentaires & discussions

## Objectif

Permettre aux utilisateurs de donner du feedback qualitatif sur les prompts via un fil de commentaires. Les ratings (étoiles) ne suffisent pas pour expliquer ce qui fonctionne, ce qui pourrait être amélioré, ou partager des cas d'usage. Les commentaires créent une boucle de feedback riche entre auteurs et utilisateurs.

## User stories

### US-1.1 : Poster un commentaire
**En tant que** utilisateur (ADMIN, EDITOR ou READER),
**je veux** poster un commentaire sur un prompt publié,
**afin de** partager mon avis, une suggestion ou un retour d'expérience.

**Critères d'acceptation :**
- Un formulaire de commentaire est visible en bas de la page de détail d'un prompt
- Le commentaire est limité à 2000 caractères
- Le commentaire apparaît immédiatement après soumission (revalidation de la page)
- Le commentaire affiche le nom de l'auteur, la date et le contenu

### US-1.2 : Répondre à un commentaire
**En tant que** utilisateur,
**je veux** répondre à un commentaire existant,
**afin de** engager une discussion sur un point précis.

**Critères d'acceptation :**
- Un bouton "Répondre" est affiché sous chaque commentaire de premier niveau
- Cliquer dessus ouvre un formulaire de réponse en dessous du commentaire
- Les réponses sont imbriquées visuellement sous le commentaire parent (indentation)
- L'imbrication est limitée à 1 niveau de profondeur : on ne peut pas répondre à une réponse
- Le bouton "Répondre" n'apparaît pas sur les réponses (commentaires de second niveau)

### US-1.3 : Supprimer un commentaire (modération)
**En tant que** administrateur (ADMIN),
**je veux** supprimer n'importe quel commentaire,
**afin de** modérer les contenus inappropriés.

**Critères d'acceptation :**
- Un bouton "Supprimer" est visible uniquement pour les utilisateurs ADMIN
- La suppression d'un commentaire parent supprime aussi toutes ses réponses (cascade)
- Une confirmation est demandée avant suppression
- Les rôles EDITOR et READER ne voient pas le bouton de suppression

### US-1.4 : Voir les commentaires d'un prompt
**En tant que** visiteur,
**je veux** voir tous les commentaires d'un prompt,
**afin de** comprendre les retours de la communauté avant d'utiliser ce prompt.

**Critères d'acceptation :**
- Les commentaires sont affichés par ordre chronologique (plus ancien en premier)
- Le nombre total de commentaires est affiché dans un badge à côté du titre de section
- Les réponses sont groupées sous leur commentaire parent
- Chaque commentaire affiche : auteur, date relative ("il y a 2 heures"), contenu

## Modèle de données

```prisma
model Comment {
  id        String   @id @default(uuid())
  content   String
  userId    String
  promptId  String
  parentId  String?
  createdAt DateTime @default(now())

  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  prompt   Prompt    @relation(fields: [promptId], references: [id], onDelete: Cascade)
  parent   Comment?  @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies  Comment[] @relation("CommentReplies")
}
```

Relations inverses à ajouter :
- `User` : `comments Comment[]`
- `Prompt` : `comments Comment[]`

## Permissions

| Action | ADMIN | EDITOR | READER |
|--------|-------|--------|--------|
| Poster un commentaire | Oui | Oui | Oui |
| Répondre à un commentaire | Oui | Oui | Oui |
| Supprimer un commentaire | Oui | Non | Non |

## Architecture technique

### Server actions — `src/lib/actions/comments.ts`

```
"use server"

createComment(formData: FormData)
  - Champs : userId, promptId, content, parentId (optionnel)
  - Validation : content non vide et <= 2000 caractères
  - Validation : si parentId fourni, vérifier que le parent n'a pas lui-même un parentId (1 niveau max)
  - Création en base via Prisma
  - revalidatePath("/prompts/[slug]")

deleteComment(formData: FormData)
  - Champs : commentId, userId
  - Vérification : l'utilisateur a le rôle ADMIN
  - Suppression du commentaire (les réponses sont supprimées par cascade)
  - revalidatePath("/prompts/[slug]")
```

### Composant client — `src/components/prompts/comment-section.tsx`

Props :
- `promptId: string`
- `comments: CommentWithReplies[]` (sérialisés depuis le serveur)

Comportement :
- Affiche le formulaire de nouveau commentaire en haut
- Liste les commentaires de premier niveau avec leurs réponses
- Utilise `useRole()` pour récupérer userId et role
- Le bouton "Supprimer" n'est rendu que si `role === "ADMIN"`
- Le bouton "Répondre" toggle un formulaire sous le commentaire ciblé

### Page modifiée — `src/app/prompts/[slug]/page.tsx`

Requête Prisma à ajouter :
```typescript
const comments = await prisma.comment.findMany({
  where: { promptId: prompt.id, parentId: null },
  include: {
    user: true,
    replies: {
      include: { user: true },
      orderBy: { createdAt: "asc" }
    }
  },
  orderBy: { createdAt: "asc" }
})
```

Le `<CommentSection>` est placé après la section historique des versions.

## Maquette UI

```
┌─────────────────────────────────────────────────┐
│ Commentaires (3)                                │
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐ │
│ │ 💬 Votre commentaire                        │ │
│ │ ┌─────────────────────────────────────────┐ │ │
│ │ │ Écrire un commentaire...                │ │ │
│ │ │                                         │ │ │
│ │ └─────────────────────────────────────────┘ │ │
│ │                              [Commenter]   │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ Alice Martin · il y a 2 heures              │ │
│ │ Excellent prompt ! Je l'utilise pour mes    │ │
│ │ rapports hebdomadaires.                     │ │
│ │                          [Répondre]         │ │
│ │                                             │ │
│ │   ┌─────────────────────────────────────┐   │ │
│ │   │ Bob Dupont · il y a 1 heure         │   │ │
│ │   │ Pareil, très utile pour le résumé   │   │ │
│ │   │ de réunions aussi.                  │   │ │
│ │   └─────────────────────────────────────┘   │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ Claire Bernard · il y a 30 min              │ │
│ │ Je suggère d'ajouter une variable pour le   │ │
│ │ ton souhaité (formel/informel).             │ │
│ │                 [Répondre] [Supprimer*]      │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ * Visible uniquement pour les ADMIN              │
└─────────────────────────────────────────────────┘
```

## Fichiers impactés

| Fichier | Action | Description |
|---------|--------|-------------|
| `prisma/schema.prisma` | Modifier | Ajouter le modèle Comment + relations inverses |
| `src/lib/actions/comments.ts` | Créer | Server actions createComment, deleteComment |
| `src/components/prompts/comment-section.tsx` | Créer | Composant client commentaires |
| `src/app/prompts/[slug]/page.tsx` | Modifier | Ajouter requête + rendu CommentSection |
| `src/lib/permissions.ts` | Modifier | Ajouter create_comment, delete_comment |
| `prisma/seed.ts` | Modifier | Ajouter des commentaires exemples |

## Critères d'acceptation globaux

- [ ] Les commentaires s'affichent sur la page de détail de chaque prompt publié
- [ ] Un utilisateur peut poster un commentaire et voir le résultat immédiatement
- [ ] Les réponses sont imbriquées sur 1 niveau maximum
- [ ] Seuls les ADMIN peuvent supprimer des commentaires
- [ ] La suppression d'un commentaire parent supprime ses réponses
- [ ] Le compteur de commentaires est affiché dans le badge de la section
- [ ] Les commentaires sont limités à 2000 caractères
- [ ] `npm run build` passe sans erreur
