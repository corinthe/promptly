# Feature 4 : Import/Export en masse

## Objectif

Permettre aux utilisateurs d'exporter une collection entière de prompts en un seul fichier, et d'importer des prompts en masse depuis un fichier JSON ou CSV. Cela facilite le partage de bibliothèques de prompts entre équipes, la sauvegarde, et la migration de prompts depuis d'autres outils.

## User stories

### US-4.1 : Exporter une collection en JSON
**En tant que** utilisateur (tout rôle),
**je veux** exporter une collection entière en un seul fichier JSON,
**afin de** sauvegarder ou partager une bibliothèque de prompts.

**Critères d'acceptation :**
- Sur la page import/export, un menu déroulant liste les collections disponibles
- Un bouton "Exporter" déclenche le téléchargement d'un fichier JSON
- Le fichier contient : nom de la collection, description, date d'export, et tous les prompts avec leurs métadonnées (titre, description, contenu, catégorie, tags)
- Le nom du fichier est `collection-[slug]-[date].json`
- Seuls les prompts publiés de la collection sont exportés

### US-4.2 : Importer des prompts depuis un fichier JSON
**En tant que** éditeur ou administrateur,
**je veux** importer des prompts depuis un fichier JSON,
**afin de** créer rapidement plusieurs prompts à partir d'un export ou d'une source externe.

**Critères d'acceptation :**
- Un champ d'upload accepte les fichiers `.json`
- Le format attendu correspond au format d'export (compatible aller-retour)
- Chaque prompt importé est créé avec le statut DRAFT
- Les catégories sont matchées par nom (si la catégorie n'existe pas, le prompt est importé sans catégorie)
- Les tags sont matchés par nom (les tags inexistants sont créés automatiquement)
- L'utilisateur importateur devient l'auteur de tous les prompts importés
- Un rapport d'import est affiché : nombre de prompts créés, erreurs éventuelles par ligne

### US-4.3 : Importer des prompts depuis un fichier CSV
**En tant que** éditeur ou administrateur,
**je veux** importer des prompts depuis un fichier CSV,
**afin de** migrer facilement des prompts depuis un tableur ou un autre outil.

**Critères d'acceptation :**
- Un champ d'upload accepte les fichiers `.csv`
- Le format CSV attendu : `title,description,content,category,tags`
- La première ligne est un header obligatoire
- Les colonnes `title` et `content` sont obligatoires, les autres optionnelles
- Les tags sont séparés par des points-virgules dans la colonne tags : `email;résumé;formel`
- Les mêmes règles que l'import JSON s'appliquent (DRAFT, matching catégories/tags, rapport)
- Les erreurs de parsing sont reportées par ligne avec un message explicite

### US-4.4 : Voir le rapport d'import
**En tant que** importateur,
**je veux** voir un rapport détaillé après l'import,
**afin de** savoir ce qui a fonctionné et ce qui a échoué.

**Critères d'acceptation :**
- Le rapport affiche : nombre total de lignes traitées, nombre de prompts créés avec succès, nombre d'erreurs
- Chaque erreur indique : numéro de ligne, message d'erreur (ex: "titre manquant", "contenu vide")
- Le rapport reste affiché jusqu'à ce que l'utilisateur navigue ailleurs
- Un lien "Voir mes brouillons" renvoie vers `/my-prompts` pour retrouver les prompts importés

## Modèle de données

Aucun nouveau modèle Prisma nécessaire. Cette feature utilise les modèles existants :
- `Prompt` : création de prompts en DRAFT
- `PromptVersion` : création de la version 1 pour chaque prompt importé
- `Category` : matching par nom
- `Tag` : matching par nom, création si inexistant
- `Collection` : lecture pour l'export

### Format JSON d'export/import

```json
{
  "format": "promptly-export-v1",
  "collectionName": "Prompts de rédaction",
  "collectionDescription": "Mes meilleurs prompts pour la rédaction",
  "exportedAt": "2026-03-22T10:00:00.000Z",
  "promptCount": 3,
  "prompts": [
    {
      "title": "Rédiger un email professionnel",
      "description": "Génère un email structuré et professionnel",
      "content": "Rédige un email professionnel à {{destinataire}} concernant {{sujet}}. Le ton doit être {{ton}}.",
      "category": "Rédaction",
      "tags": ["email", "professionnel", "communication"]
    },
    {
      "title": "Résumé de réunion",
      "description": "Résume les points clés d'une réunion",
      "content": "Résume la réunion suivante en points clés : {{notes_reunion}}",
      "category": "Analyse",
      "tags": ["résumé", "réunion"]
    }
  ]
}
```

### Format CSV d'import

```csv
title,description,content,category,tags
"Rédiger un email","Génère un email","Rédige un email à {{destinataire}}...","Rédaction","email;professionnel"
"Résumé de réunion","Résume une réunion","Résume la réunion : {{notes}}...","Analyse","résumé;réunion"
```

## Permissions

| Action | ADMIN | EDITOR | READER |
|--------|-------|--------|--------|
| Exporter une collection | Oui | Oui | Oui |
| Importer des prompts (JSON/CSV) | Oui | Oui | Non |

## Architecture technique

### Server actions — `src/lib/actions/import-export.ts`

```
"use server"

importPromptsFromJson(formData: FormData)
  - Champs : userId, file (File)
  - Parse le JSON, valide la structure (format "promptly-export-v1")
  - Pour chaque prompt :
    - Vérifie title et content non vides
    - Cherche la catégorie par nom (prisma.category.findFirst)
    - Cherche/crée les tags (prisma.tag.upsert)
    - Crée le prompt en DRAFT avec version 1
    - Génère le slug via slugify(title)
  - Retourne : { created: number, errors: { row: number, message: string }[] }

importPromptsFromCsv(formData: FormData)
  - Champs : userId, file (File)
  - Parse le CSV (split lignes, split virgules avec gestion des guillemets)
  - Valide le header (colonnes attendues)
  - Pour chaque ligne : même logique que l'import JSON
  - Tags séparés par point-virgule
  - Retourne : { created: number, errors: { row: number, message: string }[] }
```

### API route pour l'export — `src/app/api/collections/[id]/export/route.ts`

```
GET /api/collections/[id]/export
  - Fetch la collection avec tous ses prompts publiés
  - Include : prompt.category, prompt.tags, prompt.versions (dernière)
  - Construit le JSON au format "promptly-export-v1"
  - Retourne avec headers :
    Content-Type: application/json
    Content-Disposition: attachment; filename="collection-[slug]-[date].json"
```

### Page — `src/app/import-export/page.tsx` (serveur)

- Fetch la liste des collections pour le dropdown d'export
- Passe au composant client

### Composant client — `src/app/import-export/import-export-view.tsx`

```
Props : collections: { id, name }[]

État local :
  - selectedCollectionId: string
  - importFile: File | null
  - importFormat: "json" | "csv"
  - importResult: { created: number, errors: { row, message }[] } | null
  - isImporting: boolean

Section Export :
  - Dropdown pour sélectionner une collection
  - Bouton "Exporter en JSON"
  - onClick : fetch("/api/collections/[id]/export") → blob → download
  - Réutiliser le pattern downloadFile de export-prompt.tsx

Section Import :
  - Toggle JSON / CSV
  - Input file (accept=".json" ou ".csv" selon le toggle)
  - Bouton "Importer"
  - onClick : FormData avec file → appel server action
  - Affichage du rapport après import
```

### Parsing CSV

Implémentation simple sans dépendance externe :

```typescript
function parseCsv(text: string): { headers: string[], rows: string[][] } {
  const lines = text.split("\n").filter(l => l.trim())
  const headers = parseRow(lines[0])
  const rows = lines.slice(1).map(parseRow)
  return { headers, rows }
}

function parseRow(line: string): string[] {
  // Gestion des guillemets : "valeur avec, virgule"
  const result: string[] = []
  let current = ""
  let inQuotes = false
  for (const char of line) {
    if (char === '"') { inQuotes = !inQuotes; continue }
    if (char === ',' && !inQuotes) { result.push(current.trim()); current = ""; continue }
    current += char
  }
  result.push(current.trim())
  return result
}
```

### Validation

| Règle | JSON | CSV |
|-------|------|-----|
| Format reconnu | `format === "promptly-export-v1"` | Header avec `title` et `content` |
| Titre obligatoire | `prompt.title` non vide | Colonne `title` non vide |
| Contenu obligatoire | `prompt.content` non vide | Colonne `content` non vide |
| Catégorie | Matchée par nom, ignorée si inexistante | Idem |
| Tags | Matchés par nom, créés si inexistants | Séparés par `;`, même logique |
| Doublon de slug | Suffixe `-2`, `-3`, etc. | Idem |

## Maquette UI

```
┌─────────────────────────────────────────────────┐
│ Import / Export                                  │
├─────────────────────────────────────────────────┤
│                                                  │
│ ━━━ Exporter une collection ━━━━━━━━━━━━━━━━━━━ │
│                                                  │
│ Collection : [▼ Prompts de rédaction        ]    │
│                                                  │
│ [Exporter en JSON]                               │
│                                                  │
│ ━━━ Importer des prompts ━━━━━━━━━━━━━━━━━━━━━━ │
│                                                  │
│ Format : [JSON] [CSV]                            │
│                                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │  Glissez un fichier ici ou cliquez pour     │ │
│ │  sélectionner                               │ │
│ │                                             │ │
│ │  Formats acceptés : .json, .csv             │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ [Importer]                                       │
│                                                  │
│ ━━━ Rapport d'import ━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                  │
│ ✅ 8 prompts créés avec succès                   │
│ ❌ 2 erreurs :                                   │
│                                                  │
│   Ligne 4 : Titre manquant                       │
│   Ligne 7 : Contenu vide                         │
│                                                  │
│ Les prompts importés sont en statut BROUILLON.   │
│ [Voir mes brouillons →]                          │
│                                                  │
└─────────────────────────────────────────────────┘
```

## Fichiers impactés

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/lib/actions/import-export.ts` | Créer | Server actions import JSON/CSV |
| `src/app/api/collections/[id]/export/route.ts` | Créer | API route export collection |
| `src/app/import-export/page.tsx` | Créer | Page serveur import/export |
| `src/app/import-export/import-export-view.tsx` | Créer | Composant client avec upload/download |
| `src/components/layout/sidebar.tsx` | Modifier | Ajouter lien "Import/Export" (EDITOR/ADMIN) |
| `src/lib/permissions.ts` | Modifier | Ajouter import_prompts |

## Dépendances

- **Aucune dépendance** sur les autres features (1, 2, 3)
- **Réutilise** le pattern `downloadFile` de `src/components/prompts/export-prompt.tsx`
- **Réutilise** la logique de création de prompt/version de `src/lib/actions/prompts.ts`
- **Utilise** les modèles existants Collection, Prompt, PromptVersion, Category, Tag

## Critères d'acceptation globaux

- [ ] L'export d'une collection télécharge un fichier JSON valide avec tous les prompts publiés
- [ ] Le fichier exporté peut être réimporté sans erreur (aller-retour)
- [ ] L'import JSON crée les prompts en statut DRAFT
- [ ] L'import CSV crée les prompts en statut DRAFT
- [ ] Les catégories sont matchées par nom lors de l'import
- [ ] Les tags inexistants sont créés automatiquement lors de l'import
- [ ] Les erreurs de validation sont reportées par ligne avec un message clair
- [ ] Le rapport d'import affiche le nombre de succès et d'erreurs
- [ ] Un READER ne peut pas accéder à l'import (le formulaire n'est pas affiché)
- [ ] Un READER peut exporter une collection
- [ ] Les doublons de slug sont gérés avec un suffixe incrémental
- [ ] Le parsing CSV gère correctement les guillemets et les virgules dans les valeurs
- [ ] `npm run build` passe sans erreur
