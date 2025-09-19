# Business Plan Generator

Application web complète pour créer des business plans bancables à partir de données financières réelles.

## Vue d'ensemble

Cette application transforme les données comptables (bilans, comptes de résultats, relevés bancaires) en business plans professionnels acceptables par les banques et investisseurs.

### Fonctionnalités principales

- **Import de données** : Excel, CSV, PDF avec OCR
- **Calculs financiers robustes** : VAN, TRI, DSCR, ratios bancaires
- **Interface type Excel** : Navigation par onglets, tableaux dynamiques
- **Exports multi-formats** : PDF, Word, Excel selon l'audience
- **Collaboration** : Rôles utilisateurs, commentaires, verrouillage
- **Multi-tenant** : Organisations avec sécurité RLS

## Architecture

```
├── frontend/          # Next.js 14 + TypeScript + Tailwind
├── backend/           # Fastify + TypeScript + Supabase
├── supabase-schema.sql # Schéma de base de données complet
└── docs/              # Documentation technique
```

### Stack technique

**Frontend :**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Supabase Auth
- React Query + Zustand
- Recharts pour les graphiques

**Backend :**
- Fastify (API REST)
- Supabase (PostgreSQL + Auth + Storage)
- TypeScript
- Decimal.js pour la précision financière
- Bulls + Redis pour les tâches async

**Infrastructure :**
- Supabase (base de données, auth, storage)
- Vercel (frontend)
- Edge Functions (calculs lourds)

## Installation

### Prérequis

- Node.js 18+
- Compte Supabase Pro
- Redis (optionnel, pour le cache)

### Configuration Supabase

1. Créer un nouveau projet Supabase
2. Exécuter le schéma de base de données :

```sql
-- Copier le contenu de supabase-schema.sql
-- dans l'éditeur SQL de Supabase
```

3. Configurer l'authentification Google OAuth
4. Activer Row Level Security (RLS)

### Frontend

```bash
cd frontend
npm install

# Copier les variables d'environnement
cp .env.local.example .env.local

# Modifier .env.local avec vos clés Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Lancer en développement
npm run dev
```

### Backend

```bash
cd backend
npm install

# Copier les variables d'environnement
cp .env.example .env

# Modifier .env avec vos clés Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret

# Lancer en développement
npm run dev
```

## Utilisation

### 1. Création d'un projet

1. Se connecter via Google OAuth
2. Créer une nouvelle organisation
3. Créer un projet avec :
   - Secteur d'activité
   - Taille (TPE/PME/ETI/GE)
   - Horizon (3-7 ans)
   - Date de début

### 2. Saisie des données

**Onglet Produits/Services :**
- Ajouter les produits/services
- Définir prix, coûts, modèle de revenu
- Configurer la saisonnalité

**Onglet Ventes :**
- Projections mensuelles par produit
- Volumes et prix par période

**Onglet CAPEX :**
- Investissements prévus
- Durées d'amortissement
- Méthodes de calcul

**Onglet OPEX :**
- Charges fixes et variables
- Indexation sur l'inflation
- Périodicité

**Onglet Paie :**
- Rôles et salaires
- Plan d'embauche
- Charges sociales

**Onglet Financement :**
- Prêts bancaires
- Apports en capital
- Conditions (taux, durée, différés)

### 3. Calculs automatiques

Lancer les calculs via l'API :

```javascript
POST /api/calculations/calculate
{
  "project_id": "uuid",
  "scenario_id": "uuid", // optionnel
  "force_recalculation": false
}
```

### 4. Visualisation

- **Tableaux financiers** : Compte de résultat, flux de trésorerie, bilans
- **Graphiques** : Évolution CA, marges, ratios, DSCR
- **Ratios bancaires** : VAN, TRI, DSCR, gearing, coverage
- **Scénarios** : Base, optimiste, pessimiste avec comparaisons

### 5. Exports

Génération de documents professionnels :

```javascript
POST /api/exports/generate
{
  "project_id": "uuid",
  "format": "pdf|docx|xlsx",
  "theme": "bank|investor|guarantee",
  "sections": ["summary", "financials", "risks"]
}
```

## Modèle financier

### Calculs mensuels

1. **Chiffre d'affaires** = Σ(Volume × Prix × Saisonnalité)
2. **Marge brute** = CA - Coût des ventes
3. **EBITDA** = Marge brute - OPEX
4. **EBIT** = EBITDA - Amortissements
5. **Résultat net** = EBIT - Intérêts - IS
6. **CAF** = RN + Amortissements ± ΔBFR
7. **BFR** = DSO × ventes/jour + Stock - DPO × achats/jour

### Ratios clés

- **DSCR** = Cash flow opérationnel / Service de la dette
- **VAN** = Σ(Flux actualisés au WACC) - Investissement initial
- **TRI** = Taux qui annule la VAN
- **Point mort** = Charges fixes / (1 - COGS/CA)

### Contrôles qualité

- Actif = Passif
- Produits - Charges = Résultat
- CAF = Flux opérationnel
- DSCR ≥ 1,2 (alerte bancaire)

## API Endpoints

### Projets
- `GET /api/projects` - Liste des projets
- `POST /api/projects` - Créer un projet
- `GET /api/projects/:id` - Détails d'un projet
- `PUT /api/projects/:id` - Modifier un projet
- `DELETE /api/projects/:id` - Supprimer un projet

### Calculs
- `POST /api/calculations/calculate` - Lancer les calculs
- `GET /api/calculations/status/:project_id` - Statut des calculs
- `POST /api/calculations/validate/:project_id` - Valider le modèle

### Métriques
- `GET /api/metrics/:project_id` - Métriques du projet
- `GET /api/metrics/:project_id/dashboard` - Données dashboard
- `GET /api/metrics/:project_id/timeseries` - Séries temporelles
- `GET /api/metrics/:project_id/sensitivity` - Analyse de sensibilité

### Imports
- `POST /api/imports/excel/:project_id` - Import Excel/CSV
- `POST /api/imports/bank-statements/:project_id` - Import relevés bancaires
- `GET /api/imports/templates/:type` - Templates d'import

### Exports
- `POST /api/exports/generate` - Générer un export
- `GET /api/exports/download/:export_id` - Télécharger un export
- `GET /api/exports/status/:export_id` - Statut de l'export

## Sécurité

### Row Level Security (RLS)

Tous les accès aux données sont protégés par RLS Supabase :

```sql
-- Exemple de politique RLS
CREATE POLICY "Users can access their projects" ON projects
FOR ALL USING (
  id IN (
    SELECT project_id FROM project_collaborators
    WHERE user_id = auth.uid()
  )
);
```

### Authentification

- OAuth Google via Supabase Auth
- JWT tokens pour l'API
- Refresh automatique des sessions

### Audit

Toutes les modifications sont tracées :

```sql
CREATE TRIGGER audit_projects
AFTER INSERT OR UPDATE OR DELETE ON projects
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
```

## Performance

### Optimisations

- **Index composites** sur project_id + year + month
- **Calculs en arrière-plan** avec Bulls/Redis
- **Cache Redis** pour les métriques fréquentes
- **Pagination** sur les grandes listes

### Limites

- Recalcul complet : < 300ms pour 10k lignes
- Import PDF : < 90s avec OCR
- Export PDF : ≤ 40 pages
- Précision : 28 décimales (Decimal.js)

## Tests

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

Coverage minimale :
- Calculs financiers : 90%
- API endpoints : 80%
- Composants UI : 70%

## Déploiement

### Production

1. **Frontend** → Vercel
2. **Backend** → Railway/Render
3. **Base de données** → Supabase
4. **CDN** → Vercel/Cloudflare

### Variables d'environnement

```bash
# Production
NODE_ENV=production
SUPABASE_URL=https://prod.supabase.co
SUPABASE_SERVICE_KEY=prod-service-key
REDIS_URL=redis://prod-redis:6379
```

### CI/CD

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm test
      - run: npm run build
      - run: vercel --prod
```

## Support

### Secteurs supportés

Templates pré-configurés pour :
- Commerce/Retail
- Services BtoB
- Industrie/Manufacturing
- Technologies/SaaS
- Immobilier/Construction

### Devises

- XOF (Franc CFA) - par défaut
- EUR, USD, MAD - support complet
- Taux de change automatiques

### Réglementations

- **SYSCOHADA** (Afrique de l'Ouest)
- **IFRS** (International)
- **Fiscalité** paramétrable par pays

## Contribuer

1. Fork le repository
2. Créer une branche feature
3. Ajouter des tests
4. Créer une Pull Request

### Standards de code

- **TypeScript strict** mode
- **ESLint + Prettier**
- **Conventional Commits**
- **Tests obligatoires** pour nouveaux features

## Licence

MIT - voir [LICENSE](LICENSE)

## Contact

- **Documentation** : https://docs.business-plan-generator.com
- **Support** : support@business-plan-generator.com
- **Issues** : GitHub Issues