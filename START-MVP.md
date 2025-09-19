# 🚀 Démarrage MVP - Business Plan Generator

## Étapes de configuration Supabase

### 1. Configuration de la base de données

Copiez et exécutez ce script dans l'éditeur SQL de Supabase :

```sql
-- Coller le contenu complet de supabase-mvp-schema.sql
```

### 2. Configuration de l'authentification

1. Aller dans **Authentication > Providers**
2. Activer **Google OAuth**
3. Configurer avec vos clés Google OAuth (ou utiliser les clés de test)

### 3. Configuration des politiques RLS

Les politiques sont déjà incluses dans le schéma, mais vérifiez dans **Authentication > Policies**

## Démarrage de l'application

### Backend (Terminal 1)

```bash
cd backend
npm install
npm run dev
```

Le serveur API démarre sur http://localhost:3001

### Frontend (Terminal 2)

```bash
cd frontend
npm install
npm run dev
```

L'application démarre sur http://localhost:3000

## Test du MVP

### 1. Connexion
- Aller sur http://localhost:3000
- Cliquer sur "Se connecter avec Google"
- Si Google OAuth n'est pas configuré, modifier temporairement le code pour bypasser l'auth

### 2. Créer un projet
- Cliquer sur "Nouveau projet"
- Remplir : Nom, Secteur, Date de début
- Valider

### 3. Ajouter des produits
- Aller sur l'onglet "Produits/Services"
- Ajouter quelques produits avec prix et coûts
- Exemple : Pain (500 XOF, coût 300 XOF)

### 4. Créer des projections de ventes
- Aller sur l'onglet "Ventes"
- Sélectionner un produit
- Cliquer sur "Template" pour générer des volumes
- Ou saisir manuellement des volumes mensuels

### 5. Calculer les projections
- Cliquer sur le bouton "Calculer" en haut
- Attendre le calcul (quelques secondes)

### 6. Voir les résultats
- Aller sur l'onglet "Résultats"
- Consulter les tableaux financiers
- Vérifier la rentabilité et la trésorerie

## Fonctionnalités testables

✅ **Authentification** - Google OAuth ou bypass temporaire
✅ **Création de projet** - Formulaire complet
✅ **Gestion des produits** - CRUD complet avec calcul de marges
✅ **Projections de ventes** - Saisie mensuelle par produit
✅ **Calculs financiers** - Moteur MVP avec :
  - Compte de résultat mensuel
  - Flux de trésorerie
  - Marges et ratios
✅ **Visualisation des résultats** - Tableaux détaillés
✅ **Synoptique** - Dashboard avec KPIs

## Données de test suggérées

### Projet exemple : "Boulangerie Moderne"
- Secteur : Commerce/Retail
- Date début : 2024-01-01
- Horizon : 3 ans

### Produits exemple :
1. **Pain complet** - 500 XOF/unité (coût 300 XOF)
2. **Croissant** - 200 XOF/unité (coût 120 XOF)
3. **Gâteau** - 2000 XOF/unité (coût 1200 XOF)

### Volumes exemple (par mois) :
- Pain : 3000 unités
- Croissant : 1500 unités
- Gâteau : 200 unités

**Résultat attendu :**
- CA mensuel : ~2.2M XOF
- Marge brute : ~40%
- CA annuel : ~26M XOF

## Dépannage

### Erreur de connexion Supabase
- Vérifier les URLs et clés dans .env.local
- Vérifier que le schéma est bien exécuté

### Erreur de calcul
- Vérifier qu'il y a des produits ET des projections de ventes
- Regarder les logs dans la console du navigateur

### Interface qui ne charge pas
- Vérifier que les deux serveurs (3000 et 3001) sont démarrés
- Regarder les erreurs dans la console

## Améliorations possibles

Pour pousser le MVP plus loin :

1. **CAPEX/OPEX** - Ajouter les onglets manquants
2. **Scenarios** - Implémenter optimiste/pessimiste
3. **Graphiques** - Ajouter Recharts
4. **Export Excel** - Génération basique
5. **Import** - Excel/CSV
6. **Financement** - Calcul des emprunts

## Support

En cas de problème :
1. Vérifier les logs des deux terminaux
2. Tester avec les données exemple ci-dessus
3. Commencer par un projet simple avec 1 produit

Le MVP est conçu pour être **fonctionnel immédiatement** avec vos clés Supabase !