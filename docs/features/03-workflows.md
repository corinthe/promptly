# Feature 3 : Prompts chaînés (workflows)

## Objectif

Permettre aux utilisateurs de combiner plusieurs prompts en séquence pour créer des pipelines réutilisables. Un workflow représente un processus en plusieurs étapes où la sortie d'un prompt alimente l'entrée du suivant. Par exemple : "Analyser un texte → Résumer les points clés → Rédiger un email de synthèse". Cela transforme les prompts individuels en processus métier complets.

## User stories

### US-3.1 : Créer un workflow
**En tant que** éditeur ou administrateur,
**je veux** créer un workflow en lui donnant un nom et une description,
**afin de** définir un nouveau processus en plusieurs étapes.

**Critères d'acceptation :**
- Un formulaire permet de saisir le nom et la description du workflow
- Le slug est généré automatiquement à partir du nom
- Après création, l'utilisateur est redirigé vers la page de détail du workflow
- Les READER ne peuvent pas créer de workflow

### US-3.2 : Ajouter des étapes au workflow
**En tant que** créateur d'un workflow,
**je veux** ajouter des prompts publiés comme étapes séquentielles,
**afin de** construire mon pipeline.

**Critères d'acceptation :**
- Un bouton "Ajouter une étape" permet de sélectionner un prompt publié dans une liste déroulante
- Chaque étape affiche le titre du prompt et ses variables `{{var}}`
- Les étapes sont numérotées (1, 2, 3...) et reliées visuellement par des flèches
- Maximum 5 étapes par workflow
- Un même prompt peut apparaître plusieurs fois dans le workflow

### US-3.3 : Réordonner et supprimer des étapes
**En tant que** créateur d'un workflow,
**je veux** réordonner ou supprimer des étapes,
**afin de** ajuster mon pipeline.

**Critères d'acceptation :**
- Des boutons haut/bas permettent de déplacer une étape
- Un bouton "Supprimer" permet de retirer une étape
- Les positions sont recalculées automatiquement après suppression
- La suppression d'une étape met à jour les mappings de variables des étapes suivantes

### US-3.4 : Configurer le mapping de variables entre étapes
**En tant que** créateur d'un workflow,
**je veux** définir comment les variables d'une étape sont alimentées par l'étape précédente,
**afin de** créer un flux de données entre les étapes.

**Critères d'acceptation :**
- Pour chaque étape (sauf la première), un panneau de configuration permet de mapper les variables
- Le mapping associe une variable de l'étape courante à la "sortie" de l'étape précédente
- La "sortie" d'une étape est le texte complet du prompt une fois ses variables remplies
- Le mapping est stocké en JSON dans le champ `config` du WorkflowStep

### US-3.5 : Exécuter un workflow dans le playground
**En tant que** utilisateur (tout rôle),
**je veux** exécuter un workflow étape par étape dans le playground,
**afin de** l'utiliser concrètement.

**Critères d'acceptation :**
- Le playground affiche toutes les étapes séquentiellement
- L'étape 1 affiche ses variables à remplir manuellement (comme le playground existant)
- Après avoir rempli l'étape 1, l'utilisateur voit le prompt complété
- L'utilisateur copie le prompt complété, l'utilise avec son IA, puis colle le résultat
- Le résultat collé est automatiquement injecté dans les variables mappées de l'étape 2
- Le processus se répète pour chaque étape
- Un bouton "Copier" est disponible à chaque étape pour copier le prompt complété

### US-3.6 : Parcourir les workflows
**En tant que** utilisateur,
**je veux** voir la liste de tous les workflows disponibles,
**afin de** découvrir des processus utiles.

**Critères d'acceptation :**
- La page `/workflows` liste tous les workflows avec : nom, description, nombre d'étapes, auteur
- Chaque carte est cliquable et mène à la page de détail
- La sidebar contient un lien "Workflows"

### US-3.7 : Supprimer un workflow
**En tant que** administrateur,
**je veux** supprimer un workflow,
**afin de** retirer les processus obsolètes.

**Critères d'acceptation :**
- Seul un ADMIN peut supprimer un workflow
- La suppression est en cascade (supprime aussi les étapes)
- Une confirmation est demandée

## Modèle de données

```prisma
model Workflow {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique
  description String?
  userId      String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user  User           @relation(fields: [userId], references: [id])
  steps WorkflowStep[]
}

model WorkflowStep {
  id         String  @id @default(uuid())
  workflowId String
  promptId   String
  position   Int
  config     String? // JSON : mapping de variables entre étapes

  workflow Workflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  prompt   Prompt   @relation(fields: [promptId], references: [id])

  @@unique([workflowId, position])
}
```

Relations inverses à ajouter :
- `User` : `workflows Workflow[]`
- `Prompt` : `workflowSteps WorkflowStep[]`

### Format du champ `config` (JSON)

```json
{
  "variableMappings": {
    "texte_source": "previous_output"
  }
}
```

- `texte_source` : nom de la variable `{{texte_source}}` dans le prompt de cette étape
- `previous_output` : mot-clé spécial indiquant que cette variable reçoit le résultat collé de l'étape précédente

Pour des mappings plus fins (si l'étape précédente a plusieurs variables) :

```json
{
  "variableMappings": {
    "sujet": "previous_output",
    "ton": "manual"
  }
}
```

- `"manual"` : la variable reste à remplir manuellement par l'utilisateur

## Permissions

| Action | ADMIN | EDITOR | READER |
|--------|-------|--------|--------|
| Créer un workflow | Oui | Oui | Non |
| Modifier un workflow | Oui | Oui (le sien) | Non |
| Supprimer un workflow | Oui | Non | Non |
| Voir les workflows | Oui | Oui | Oui |
| Utiliser le playground | Oui | Oui | Oui |

## Architecture technique

### Server actions — `src/lib/actions/workflows.ts`

```
"use server"

createWorkflow(formData: FormData)
  - Champs : userId, name, description
  - Génère le slug via slugify(name)
  - Vérifie permission : ADMIN ou EDITOR
  - redirect("/workflows/[slug]")

updateWorkflow(formData: FormData)
  - Champs : workflowId, name, description
  - Vérifie : ADMIN ou propriétaire EDITOR

deleteWorkflow(formData: FormData)
  - Champs : workflowId
  - Vérifie : ADMIN uniquement
  - Suppression cascade (les étapes suivent)

addWorkflowStep(formData: FormData)
  - Champs : workflowId, promptId
  - Calcule la position : max(position) + 1
  - Vérifie : max 5 étapes
  - revalidatePath("/workflows/[slug]")

removeWorkflowStep(formData: FormData)
  - Champs : stepId
  - Supprime l'étape
  - Renumérote les étapes restantes (position séquentielle)
  - revalidatePath

reorderWorkflowSteps(formData: FormData)
  - Champs : workflowId, stepIds (JSON array dans l'ordre souhaité)
  - Met à jour les positions en transaction Prisma
  - revalidatePath

updateStepConfig(formData: FormData)
  - Champs : stepId, config (JSON string)
  - Met à jour le champ config
  - revalidatePath
```

### Pages

**`src/app/workflows/page.tsx`** (serveur) :
- Liste tous les workflows avec `include: { user: true, steps: true }`
- Affiche en grille de cards similaire aux collections

**`src/app/workflows/new/page.tsx`** (client) :
- Formulaire nom + description
- Soumission via `createWorkflow` server action

**`src/app/workflows/[slug]/page.tsx`** (serveur) :
- Fetch le workflow avec étapes et prompts associés
- Passe les données au composant client `WorkflowDetail`

### Composants

**`src/app/workflows/[slug]/workflow-detail.tsx`** (client) :
- Affiche la chaîne d'étapes avec visualisation
- Boutons ajouter/supprimer/réordonner
- Panneau de configuration des mappings par étape
- Bouton "Lancer le playground"

**`src/components/workflows/workflow-playground.tsx`** (client) :
- Étend le concept de `src/components/prompts/prompt-playground.tsx`
- Affiche les étapes en séquence verticale
- Pour chaque étape :
  1. Affiche le prompt avec ses variables détectées (pattern `{{var}}`)
  2. Variables mappées depuis l'étape précédente sont pré-remplies
  3. Variables manuelles ont des champs de saisie
  4. Bouton "Générer" remplit le template
  5. Zone de texte "Résultat de l'IA" pour coller la réponse
  6. Bouton "Copier le prompt" pour chaque étape
- L'étape suivante se déverrouille quand le résultat de l'étape courante est collé

## Maquette UI

### Page /workflows

```
┌─────────────────────────────────────────────────┐
│ Workflows                    [Nouveau workflow]  │
├─────────────────────────────────────────────────┤
│                                                  │
│ ┌──────────────────┐  ┌──────────────────┐      │
│ │ Analyse complète │  │ Rédaction email  │      │
│ │                  │  │                  │      │
│ │ Analyse, résumé  │  │ Recherche, plan, │      │
│ │ et recommandation│  │ rédaction, relec.│      │
│ │                  │  │                  │      │
│ │ 3 étapes         │  │ 4 étapes         │      │
│ │ Par Alice Martin │  │ Par Bob Dupont   │      │
│ └──────────────────┘  └──────────────────┘      │
└─────────────────────────────────────────────────┘
```

### Page de détail d'un workflow

```
┌─────────────────────────────────────────────────┐
│ Analyse complète                                 │
│ Par Alice Martin · 3 étapes                      │
│ Analyse un document, résume les points clés,     │
│ et formule des recommandations.                  │
│                                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │  ① Analyser le document                     │ │
│ │  Prompt : "Analyse de texte"                │ │
│ │  Variables : {{document}}, {{objectif}}      │ │
│ │                              [↑] [↓] [✕]   │ │
│ └─────────────────────────────────────────────┘ │
│                    ↓                             │
│ ┌─────────────────────────────────────────────┐ │
│ │  ② Résumer les points clés                  │ │
│ │  Prompt : "Résumé structuré"                │ │
│ │  Variables : {{texte}} ← sortie étape ①     │ │
│ │              {{format}} ← manuel             │ │
│ │                              [↑] [↓] [✕]   │ │
│ └─────────────────────────────────────────────┘ │
│                    ↓                             │
│ ┌─────────────────────────────────────────────┐ │
│ │  ③ Formuler des recommandations             │ │
│ │  Prompt : "Recommandations"                 │ │
│ │  Variables : {{analyse}} ← sortie étape ②   │ │
│ │              {{public_cible}} ← manuel       │ │
│ │                              [↑] [↓] [✕]   │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ [+ Ajouter une étape]    [Lancer le playground]  │
└─────────────────────────────────────────────────┘
```

### Playground workflow

```
┌─────────────────────────────────────────────────┐
│ Playground : Analyse complète                    │
├─────────────────────────────────────────────────┤
│                                                  │
│ ━━━ Étape 1/3 : Analyser le document ━━━━━━━━━ │
│                                                  │
│ document : [________________________]            │
│ objectif : [________________________]            │
│                                                  │
│ Prompt complété :                                │
│ ┌─────────────────────────────────────────────┐ │
│ │ Analyse le document suivant en te           │ │
│ │ concentrant sur l'objectif : productivité   │ │
│ │ ...                                         │ │
│ └─────────────────────────────────────────────┘ │
│                                    [Copier]     │
│                                                  │
│ Résultat de l'IA (collez la réponse) :          │
│ ┌─────────────────────────────────────────────┐ │
│ │                                             │ │
│ │                                             │ │
│ └─────────────────────────────────────────────┘ │
│                              [Passer à l'étape 2]│
│                                                  │
│ ━━━ Étape 2/3 : Résumer les points clés ━━━━━━ │
│ 🔒 Complétez l'étape 1 pour débloquer           │
│                                                  │
│ ━━━ Étape 3/3 : Formuler des recommandations ━━ │
│ 🔒 Complétez l'étape 2 pour débloquer           │
│                                                  │
└─────────────────────────────────────────────────┘
```

## Fichiers impactés

| Fichier | Action | Description |
|---------|--------|-------------|
| `prisma/schema.prisma` | Modifier | Ajouter Workflow + WorkflowStep + relations |
| `src/lib/actions/workflows.ts` | Créer | Toutes les server actions workflow |
| `src/app/workflows/page.tsx` | Créer | Page liste des workflows |
| `src/app/workflows/new/page.tsx` | Créer | Page création workflow |
| `src/app/workflows/[slug]/page.tsx` | Créer | Page détail workflow (serveur) |
| `src/app/workflows/[slug]/workflow-detail.tsx` | Créer | Composant client gestion étapes |
| `src/components/workflows/workflow-playground.tsx` | Créer | Playground chaîné |
| `src/components/layout/sidebar.tsx` | Modifier | Ajouter lien "Workflows" |
| `src/lib/permissions.ts` | Modifier | Ajouter create_workflow, delete_workflow |
| `prisma/seed.ts` | Modifier | Ajouter un workflow exemple avec 3 étapes |

## Dépendances

- **Aucune dépendance** sur les autres features (1, 2, 4)
- **Dépend** de l'existence de prompts publiés (déjà le cas via le seed)
- **Réutilise** le pattern de détection de variables `{{var}}` de `prompt-playground.tsx`

## Critères d'acceptation globaux

- [ ] Un EDITOR peut créer un workflow avec nom et description
- [ ] Un READER ne voit pas le bouton "Nouveau workflow"
- [ ] On peut ajouter jusqu'à 5 étapes (prompts publiés) à un workflow
- [ ] Le bouton "Ajouter une étape" est désactivé/masqué à 5 étapes
- [ ] Les étapes peuvent être réordonnées via les boutons haut/bas
- [ ] Une étape peut être supprimée, les positions se recalculent
- [ ] Le mapping de variables entre étapes fonctionne (config JSON)
- [ ] Le playground affiche les étapes séquentiellement
- [ ] Les variables mappées sont pré-remplies depuis le résultat de l'étape précédente
- [ ] Les étapes suivantes sont verrouillées tant que l'étape courante n'est pas complétée
- [ ] Le bouton "Copier" fonctionne à chaque étape
- [ ] La page /workflows liste tous les workflows avec leurs métadonnées
- [ ] Seul un ADMIN peut supprimer un workflow
- [ ] `npm run build` passe sans erreur
