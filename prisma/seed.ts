import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.PROMPTLY_DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clean existing data
  await prisma.collectionPrompt.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.approvalRequest.deleteMany();
  await prisma.promptTag.deleteMany();
  await prisma.promptVersion.deleteMany();
  await prisma.prompt.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.category.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();

  // Create users (one per role for MVP)
  const admin = await prisma.user.create({
    data: { id: "user-admin", name: "Alice Martin", role: "ADMIN" },
  });
  const editor = await prisma.user.create({
    data: { id: "user-editor", name: "Bob Dupont", role: "EDITOR" },
  });
  const reader = await prisma.user.create({
    data: { id: "user-reader", name: "Claire Bernard", role: "READER" },
  });

  // Create teams
  const engineering = await prisma.team.create({
    data: { name: "Engineering", slug: "engineering" },
  });
  const marketing = await prisma.team.create({
    data: { name: "Marketing", slug: "marketing" },
  });
  const hr = await prisma.team.create({
    data: { name: "Ressources Humaines", slug: "rh" },
  });

  // Assign users to teams
  await prisma.teamMember.createMany({
    data: [
      { userId: admin.id, teamId: engineering.id },
      { userId: editor.id, teamId: marketing.id },
      { userId: reader.id, teamId: hr.id },
    ],
  });

  // Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: { name: "Rédaction", slug: "redaction", description: "Prompts pour la rédaction de contenu", sortOrder: 0 },
    }),
    prisma.category.create({
      data: { name: "Analyse", slug: "analyse", description: "Prompts pour l'analyse de données et documents", sortOrder: 1 },
    }),
    prisma.category.create({
      data: { name: "Code", slug: "code", description: "Prompts pour le développement logiciel", sortOrder: 2 },
    }),
    prisma.category.create({
      data: { name: "Communication", slug: "communication", description: "Prompts pour la communication interne et externe", sortOrder: 3 },
    }),
    prisma.category.create({
      data: { name: "RH", slug: "ressources-humaines", description: "Prompts pour les ressources humaines", sortOrder: 4 },
    }),
    prisma.category.create({
      data: { name: "Stratégie", slug: "strategie", description: "Prompts pour la réflexion stratégique", sortOrder: 5 },
    }),
  ]);

  // Create tags
  const tags = await Promise.all([
    prisma.tag.create({ data: { name: "email", slug: "email" } }),
    prisma.tag.create({ data: { name: "résumé", slug: "resume" } }),
    prisma.tag.create({ data: { name: "traduction", slug: "traduction" } }),
    prisma.tag.create({ data: { name: "python", slug: "python" } }),
    prisma.tag.create({ data: { name: "sql", slug: "sql" } }),
    prisma.tag.create({ data: { name: "rapport", slug: "rapport" } }),
    prisma.tag.create({ data: { name: "brainstorming", slug: "brainstorming" } }),
    prisma.tag.create({ data: { name: "onboarding", slug: "onboarding" } }),
    prisma.tag.create({ data: { name: "feedback", slug: "feedback" } }),
    prisma.tag.create({ data: { name: "présentation", slug: "presentation" } }),
  ]);

  // Create prompts with versions
  const promptsData = [
    {
      title: "Résumé de document technique",
      slug: "resume-document-technique",
      description: "Génère un résumé structuré d'un document technique long",
      authorId: editor.id,
      categoryId: categories[1].id, // Analyse
      teamId: engineering.id,
      status: "PUBLISHED",
      publishedAt: new Date("2026-03-01"),
      viewCount: 142,
      copyCount: 38,
      favoriteCount: 12,
      tags: [tags[1].id, tags[5].id], // résumé, rapport
      content: `Tu es un expert en synthèse de documents techniques. Ton rôle est de produire des résumés clairs et structurés.

Analyse le document suivant et produis un résumé en suivant cette structure :

1. **Points clés** (3-5 bullet points)
2. **Contexte** (2-3 phrases)
3. **Détails importants** (section détaillée)
4. **Actions recommandées** (si applicable)
5. **Questions ouvertes** (points nécessitant clarification)

Document à analyser :
[Collez votre document ici]`,
      useCases: "Synthèse de specs techniques, résumé de rapports d'audit, condensation de documentation API",
      inputExamples: "Un document technique de 10+ pages (spec, RFC, rapport d'analyse...)",
      outputExamples: `**Points clés**
- Le système propose une architecture microservices avec 5 services principaux
- La migration est estimée à 3 mois
- Le coût total est de 150k€

**Contexte**
Le document décrit la migration de l'architecture monolithique vers une architecture microservices...`,
      instructions: "Collez le document complet dans la zone prévue. Pour de meilleurs résultats, incluez le titre et la table des matières si disponible.",
    },
    {
      title: "Rédaction d'email professionnel",
      slug: "redaction-email-professionnel",
      description: "Rédige un email professionnel adapté au contexte et au ton souhaité",
      authorId: editor.id,
      categoryId: categories[0].id, // Rédaction
      teamId: marketing.id,
      status: "PUBLISHED",
      publishedAt: new Date("2026-03-05"),
      viewCount: 231,
      copyCount: 89,
      favoriteCount: 25,
      tags: [tags[0].id], // email
      content: `Tu es un expert en communication professionnelle. Rédige un email en respectant les paramètres suivants :

**Destinataire** : [Type de destinataire - ex: client, collègue, manager]
**Objet** : [Sujet de l'email]
**Ton** : [Formel / Semi-formel / Informel]
**Objectif** : [Ce que l'email doit accomplir]
**Contexte** : [Informations supplémentaires]

L'email doit être :
- Clair et concis
- Professionnel
- Avec un appel à l'action explicite
- Adapté au contexte culturel français`,
      useCases: "Emails clients, communications internes, relances commerciales, demandes de meeting",
      inputExamples: `Destinataire: Client mécontent
Objet: Suivi de réclamation
Ton: Formel et empathique
Objectif: Rassurer le client et proposer une solution
Contexte: Le client a reçu un produit défectueux il y a 3 jours`,
      outputExamples: `Objet : Suivi de votre réclamation - Référence #12345

Madame, Monsieur,

Je vous remercie d'avoir pris le temps de nous signaler le problème rencontré avec votre commande...`,
      instructions: "Remplissez tous les champs entre crochets. Plus vous donnez de contexte, meilleur sera le résultat.",
    },
    {
      title: "Revue de code Python",
      slug: "revue-code-python",
      description: "Effectue une revue de code détaillée avec suggestions d'amélioration",
      authorId: admin.id,
      categoryId: categories[2].id, // Code
      teamId: engineering.id,
      status: "PUBLISHED",
      publishedAt: new Date("2026-03-10"),
      viewCount: 98,
      copyCount: 45,
      favoriteCount: 18,
      tags: [tags[3].id], // python
      content: `Tu es un développeur Python senior spécialisé en revue de code. Analyse le code suivant et fournis une revue détaillée.

Pour chaque point, utilise les niveaux de sévérité :
🔴 Critique - Doit être corrigé avant merge
🟡 Important - Devrait être corrigé
🟢 Suggestion - Amélioration optionnelle

Vérifie les aspects suivants :
1. **Bugs potentiels** et cas limites
2. **Performance** (complexité algorithmique, utilisation mémoire)
3. **Lisibilité** (nommage, structure, documentation)
4. **Sécurité** (injections, gestion des erreurs)
5. **Tests** (couverture, cas de test manquants)
6. **Conformité PEP 8** et bonnes pratiques Python

Code à reviewer :
\`\`\`python
[Collez votre code ici]
\`\`\``,
      useCases: "Revue de PR, mentorat de développeurs juniors, audit de qualité de code",
      inputExamples: "Un fichier Python de 50-500 lignes",
      outputExamples: `## Revue de code

### 🔴 Critique
**Ligne 42** - Injection SQL potentielle
\`\`\`python
# Avant
query = f"SELECT * FROM users WHERE id = {user_id}"
# Après
query = "SELECT * FROM users WHERE id = %s"
cursor.execute(query, (user_id,))
\`\`\``,
      instructions: "Collez le code complet. Précisez le contexte du projet si possible (framework utilisé, version Python, etc.).",
    },
    {
      title: "Génération de requêtes SQL",
      slug: "generation-requetes-sql",
      description: "Transforme une description en langage naturel en requête SQL optimisée",
      authorId: editor.id,
      categoryId: categories[2].id, // Code
      teamId: engineering.id,
      status: "PUBLISHED",
      publishedAt: new Date("2026-03-12"),
      viewCount: 167,
      copyCount: 72,
      favoriteCount: 20,
      tags: [tags[4].id], // sql
      content: `Tu es un expert en bases de données et SQL. Transforme la description suivante en requête SQL optimisée.

**Base de données** : [PostgreSQL / MySQL / SQLite]
**Description du schéma** :
[Décrivez les tables et colonnes pertinentes]

**Ce que je veux obtenir** :
[Décrivez en langage naturel ce que la requête doit faire]

Fournis :
1. La requête SQL avec des commentaires explicatifs
2. Une explication de la logique
3. Des suggestions d'index si pertinent
4. Les cas limites à considérer`,
      useCases: "Développement backend, analyse de données, reporting, migration de données",
      inputExamples: `Base: PostgreSQL
Schéma: users (id, name, email, created_at), orders (id, user_id, total, status, created_at)
Requête: Je veux les 10 clients ayant le plus dépensé ce mois-ci avec leur nombre de commandes`,
      outputExamples: `\`\`\`sql
SELECT
    u.name,
    u.email,
    COUNT(o.id) AS order_count,
    SUM(o.total) AS total_spent
FROM users u
JOIN orders o ON o.user_id = u.id
WHERE o.created_at >= DATE_TRUNC('month', CURRENT_DATE)
  AND o.status = 'completed'
GROUP BY u.id, u.name, u.email
ORDER BY total_spent DESC
LIMIT 10;
\`\`\``,
      instructions: "Décrivez votre schéma de base le plus précisément possible. Mentionnez les contraintes de performance si applicables.",
    },
    {
      title: "Plan de présentation",
      slug: "plan-presentation",
      description: "Crée un plan structuré pour une présentation professionnelle",
      authorId: editor.id,
      categoryId: categories[3].id, // Communication
      teamId: marketing.id,
      status: "PUBLISHED",
      publishedAt: new Date("2026-03-15"),
      viewCount: 76,
      copyCount: 31,
      favoriteCount: 8,
      tags: [tags[9].id], // présentation
      content: `Tu es un expert en communication et en storytelling. Crée un plan de présentation efficace.

**Sujet** : [Sujet de la présentation]
**Audience** : [À qui s'adresse la présentation]
**Durée** : [Durée prévue]
**Objectif** : [Ce que l'audience doit retenir/faire après]
**Ton** : [Inspirant / Informatif / Persuasif]

Produis :
1. Un plan slide par slide avec le contenu clé de chaque slide
2. Les points de transition entre sections
3. Les données/visuels suggérés
4. Un script résumé pour le speaker
5. Les questions anticipées de l'audience`,
      useCases: "Présentations clients, all-hands, pitch investisseurs, formation interne",
      inputExamples: `Sujet: Bilan Q1 2026 de l'équipe produit
Audience: Direction générale (10 personnes)
Durée: 20 minutes
Objectif: Obtenir le budget pour Q2
Ton: Persuasif mais factuel`,
      outputExamples: `## Plan de présentation - 12 slides

### Slide 1 - Titre
"Bilan Q1 2026 : Accélérer notre croissance produit"

### Slide 2 - Agenda (30s)
- Résultats Q1
- Apprentissages clés
- Vision Q2
- Demande de budget...`,
      instructions: "Soyez précis sur l'audience et l'objectif pour obtenir un plan pertinent.",
    },
    {
      title: "Guide d'onboarding personnalisé",
      slug: "guide-onboarding",
      description: "Génère un plan d'onboarding adapté au poste et à l'équipe",
      authorId: admin.id,
      categoryId: categories[4].id, // RH
      teamId: hr.id,
      status: "PUBLISHED",
      publishedAt: new Date("2026-03-18"),
      viewCount: 54,
      copyCount: 15,
      favoriteCount: 6,
      tags: [tags[7].id], // onboarding
      content: `Tu es un expert RH spécialisé en onboarding. Crée un plan d'intégration personnalisé.

**Poste** : [Intitulé du poste]
**Département** : [Équipe/département]
**Niveau** : [Junior / Confirmé / Senior / Manager]
**Date d'arrivée** : [Date]
**Manager** : [Nom du manager]

Produis un plan d'onboarding sur 90 jours :

**Semaine 1** : Accueil et découverte
**Semaines 2-4** : Immersion et premiers projets
**Mois 2** : Autonomie progressive
**Mois 3** : Contribution pleine et bilan

Pour chaque période, détaille :
- Les objectifs
- Les rencontres à planifier
- Les formations/ressources
- Les livrables attendus
- Les points de feedback`,
      useCases: "Intégration de nouveaux collaborateurs, changement de poste interne, onboarding de prestataires",
      inputExamples: `Poste: Développeur Frontend Senior
Département: Engineering - Équipe Produit
Niveau: Senior
Date: 1er avril 2026
Manager: Thomas Lefebvre`,
      outputExamples: `## Plan d'onboarding - Développeur Frontend Senior

### Semaine 1 : Accueil et découverte
**Objectifs** : S'intégrer à l'équipe, comprendre la culture, accéder aux outils

| Jour | Activité | Responsable |
|------|----------|-------------|
| L | Accueil administratif + setup poste | RH + IT |
| L | Déjeuner d'équipe | Manager |...`,
      instructions: "Précisez le contexte de l'entreprise si possible (taille, culture, outils utilisés).",
    },
    {
      title: "Brainstorming structuré",
      slug: "brainstorming-structure",
      description: "Facilite une session de brainstorming avec des techniques éprouvées",
      authorId: editor.id,
      categoryId: categories[5].id, // Stratégie
      status: "SUBMITTED",
      viewCount: 0,
      copyCount: 0,
      favoriteCount: 0,
      tags: [tags[6].id], // brainstorming
      content: `Tu es un facilitateur expert en innovation et créativité. Aide-moi à brainstormer sur le sujet suivant.

**Sujet** : [Décrivez le problème ou l'opportunité]
**Contraintes** : [Budget, temps, ressources, etc.]
**Contexte** : [Informations supplémentaires]

Utilise la méthode suivante :
1. **Divergence** : Génère 20 idées variées (sans filtre)
2. **Catégorisation** : Regroupe par thème
3. **Évaluation** : Note chaque idée sur Impact (1-5) et Faisabilité (1-5)
4. **Top 5** : Développe les 5 meilleures idées avec un mini-plan d'action
5. **Quick wins** : Identifie ce qui peut être fait cette semaine`,
      useCases: "Lancement de projet, résolution de problème, innovation produit, amélioration de processus",
      inputExamples: `Sujet: Comment augmenter l'engagement des utilisateurs sur notre app mobile?
Contraintes: Budget de 50k€, équipe de 3 devs, deadline dans 2 mois
Contexte: App B2B avec 5000 utilisateurs actifs, taux de rétention J30 de 25%`,
      outputExamples: "",
      instructions: "Plus le contexte est riche, plus les idées seront pertinentes et actionnables.",
    },
    {
      title: "Rédaction de feedback constructif",
      slug: "redaction-feedback-constructif",
      description: "Aide à formuler un feedback professionnel et constructif",
      authorId: editor.id,
      categoryId: categories[3].id, // Communication
      teamId: hr.id,
      status: "DRAFT",
      viewCount: 0,
      copyCount: 0,
      favoriteCount: 0,
      tags: [tags[8].id], // feedback
      content: `Tu es un coach en management. Aide-moi à rédiger un feedback constructif.

**Destinataire** : [Relation - collaborateur direct, pair, manager]
**Contexte** : [Situation spécifique]
**Type** : [Positif / Amélioration / Mixte]

Utilise la méthode SBI (Situation-Behavior-Impact) :
1. **Situation** : Quand et où cela s'est passé
2. **Comportement** : Ce qui a été observé (faits, pas interprétations)
3. **Impact** : L'effet sur l'équipe/le projet/les résultats

Puis ajoute :
4. **Recommandation** : Ce qui pourrait être fait différemment
5. **Soutien** : Comment tu peux aider`,
      useCases: "Entretiens annuels, feedback 360, retour post-projet, coaching",
      inputExamples: "",
      outputExamples: "",
      instructions: "Soyez factuel dans la description du contexte. Évitez les jugements de valeur.",
    },
  ];

  for (const promptData of promptsData) {
    const { tags: tagIds, content, useCases, inputExamples, outputExamples, instructions, ...data } = promptData;

    const prompt = await prisma.prompt.create({ data });

    // Create first version
    const version = await prisma.promptVersion.create({
      data: {
        promptId: prompt.id,
        versionNumber: 1,
        authorId: prompt.authorId,
        content,
        useCases: useCases || null,
        inputExamples: inputExamples || null,
        outputExamples: outputExamples || null,
        instructions: instructions || null,
      },
    });

    // Update currentVersionId
    await prisma.prompt.update({
      where: { id: prompt.id },
      data: { currentVersionId: version.id },
    });

    // Create tags
    if (tagIds.length > 0) {
      await prisma.promptTag.createMany({
        data: tagIds.map((tagId) => ({ promptId: prompt.id, tagId })),
      });
    }

    // Create approval request for submitted prompt
    if (prompt.status === "SUBMITTED") {
      await prisma.approvalRequest.create({
        data: {
          promptId: prompt.id,
          versionId: version.id,
          submittedById: prompt.authorId,
          status: "PENDING",
        },
      });
    }
  }

  // Create a sample collection
  const publishedPrompts = await prisma.prompt.findMany({
    where: { status: "PUBLISHED", categoryId: categories[2].id },
  });

  if (publishedPrompts.length > 0) {
    const collection = await prisma.collection.create({
      data: {
        creatorId: admin.id,
        name: "Boîte à outils développeur",
        description: "Les prompts essentiels pour les développeurs",
        isPublic: true,
      },
    });

    await prisma.collectionPrompt.createMany({
      data: publishedPrompts.map((p, i) => ({
        collectionId: collection.id,
        promptId: p.id,
        sortOrder: i,
      })),
    });
  }

  console.log("✅ Seed completed successfully!");
  console.log(`   - 3 users (admin, editor, reader)`);
  console.log(`   - 3 teams`);
  console.log(`   - 6 categories`);
  console.log(`   - 10 tags`);
  console.log(`   - ${promptsData.length} prompts`);
  console.log(`   - 1 collection`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
