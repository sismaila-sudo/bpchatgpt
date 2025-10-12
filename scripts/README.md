# Script de Migration - BP Firebase

## 📋 Description

Ce script migre les anciens projets BP Firebase du format monolithique (toutes les données dans `projects/{id}`) vers la nouvelle architecture avec sous-collections séparées.

## 🎯 Objectif

Transformer la structure de données:

**AVANT (ancien format):**
```
projects/{id}
  ├── basicInfo
  ├── sections
  │   ├── marketStudy
  │   ├── swotAnalysis
  │   ├── financialEngine
  │   └── ...
  └── businessPlan
      ├── marketingPlan
      ├── humanResources
      └── ...
```

**APRÈS (nouveau format):**
```
projects/{id}
  ├── basicInfo (inchangé)
  └── sections/{sectionId} (sous-collection)
      ├── marketStudy
      ├── swotAnalysis
      └── ...

tableauxFinanciers/{projectId}
analysesFinancieresHistoriques/{projectId}
relationsBancaires/{projectId}
analyseRentabilite/{projectId}
fichesSynoptiques/{projectId}
```

## 🚀 Utilisation

### 1. Installation des dépendances

```bash
npm install
```

### 2. Lancer la migration

```bash
npx tsx scripts/migrateOldProject.ts <projectId>
```

**Exemple:**
```bash
npx tsx scripts/migrateOldProject.ts 0IDBKsYQhdUtJtXhBAtf
```

### 3. Authentification

Le script vous demandera de vous authentifier avec vos identifiants Firebase:
- **Email:** Votre email Firebase
- **Password:** Votre mot de passe Firebase

> ⚠️ Vous devez être le propriétaire du projet ou avoir les droits admin pour effectuer la migration.

## 📊 Résultat

Le script affiche un résumé détaillé de la migration:

```
============================================================
✅ MIGRATION TERMINÉE
============================================================
📊 Résumé :
  • Sections créées       : 8
  • Tableaux financiers   : 1
  • Analyses financières  : 1
  • Relations bancaires   : 1
  • Fiches synoptiques    : 1
  • Analyses rentabilité  : 1
  • Documents totaux      : 13

✨ Les données de l'ancien projet ont été copiées dans les sous-collections.
   Le document principal reste inchangé pour compatibilité.
============================================================
```

## 🔒 Sécurité

- ✅ Le document principal `projects/{id}` reste **inchangé** (compatibilité assurée)
- ✅ Les données sont **copiées**, pas déplacées
- ✅ Chaque document migré reçoit les champs:
  - `ownerId`: ID du propriétaire
  - `projectId`: ID du projet parent
  - `migratedAt`: Date de migration (ISO 8601)
  - `updatedAt`: Date de dernière modification

## 📁 Collections créées

### 1. Sous-collection `sections`
Path: `/projects/{projectId}/sections/{sectionId}`

Sections migrées:
- `executiveSummary`
- `companyIdentification`
- `marketStudy`
- `swotAnalysis`
- `marketingPlan`
- `humanResources`
- `productionPlan`
- `legalStructure`
- `financialPlan`
- `risks`
- `timeline`
- `appendices`

### 2. Collection `tableauxFinanciers`
Path: `/tableauxFinanciers/{projectId}`

Données financières issues de `sections.financialEngine` ou `financialEngine`.

### 3. Collection `analysesFinancieresHistoriques`
Path: `/analysesFinancieresHistoriques/{projectId}`

Analyses financières issues de `businessPlan.financialAnalysis`.

### 4. Collection `relationsBancaires`
Path: `/relationsBancaires/{projectId}`

Relations bancaires du projet.

### 5. Collection `analyseRentabilite`
Path: `/analyseRentabilite/{projectId}`

Analyses de rentabilité (VAN/TRI/DRCI).

### 6. Collection `fichesSynoptiques`
Path: `/fichesSynoptiques/{projectId}`

Fiche synoptique du projet.

## ⚠️ Cas d'erreur

Si une section n'existe pas ou est vide, elle est **silencieusement ignorée** (pas d'erreur).

Si une erreur se produit lors de la migration d'une section:
- L'erreur est loggée dans la console
- La migration continue pour les autres sections
- Le résumé final liste toutes les erreurs rencontrées

## 🔄 Relancer la migration

Le script peut être relancé plusieurs fois sur le même projet en toute sécurité. Il écrasera les documents existants dans les sous-collections avec les données actuelles du document principal.

## 🛠️ Dépannage

### Erreur: "Project not found"
Vérifiez que le projectId existe dans Firestore.

### Erreur: "Authentication failed"
Vérifiez vos identifiants Firebase.

### Erreur: "Missing or insufficient permissions"
Vous devez être le propriétaire du projet ou avoir le rôle `admin`.

### Erreur: "Could not load credentials"
Vérifiez que le fichier `.env.local` contient toutes les variables Firebase:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...
```

## 📝 Logs

Le script génère des logs détaillés:
- ✅ Vert: Migration réussie
- ❌ Rouge: Erreur rencontrée
- 🔐 Cadenas: Authentification
- 📦 Boîte: Chargement du projet
- 👤 Personne: Propriétaire du projet
- 📂 Dossier: Migration de sections
- 💰 Dollar: Migration de données financières

## 💡 Conseils

1. **Testez d'abord sur un projet de test** avant de migrer des projets de production
2. **Sauvegardez Firestore** avant de lancer des migrations massives
3. **Vérifiez les règles Firestore** pour s'assurer qu'elles autorisent l'accès aux nouvelles collections
4. **Migrez pendant les heures creuses** pour minimiser l'impact sur les utilisateurs

## 📚 Références

- [Firestore Security Rules](../firestore.rules)
- [Documentation Firebase](https://firebase.google.com/docs/firestore)
- [Architecture du projet](../ARCHITECTURE.md)
