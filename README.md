# Business Plan Generator 📊

Une application moderne de génération de business plans avec analyse financière intelligente pour les entreprises nouvelles et en activité.

## 🚀 Fonctionnalités

### 📈 Analyse Financière Complète
- **Entreprises Nouvelles** : Projections financières complètes sur 3-10 ans
- **Entreprises en Activité** : Analyse de documents existants (bilans, comptes de résultat)
- Calculs automatiques de ratios et indicateurs clés
- Visualisations interactives avec graphiques

### 🤖 Intelligence Artificielle
- **Auto-remplissage** : Génération automatique du business plan basée sur vos données
- **IA Enhanced** : Amélioration par GPT-4o pour un contenu professionnel
- Analyse intelligente des documents financiers uploadés

### 📋 Gestion de Projets
- Interface en onglets intuitive et moderne
- Système conditionnel selon le type d'entreprise
- Export Excel complet pour présentation aux investisseurs
- Sauvegarde automatique en temps réel

## 🛠 Technologies

- **Frontend** : Next.js 15.5.3, React 19, TypeScript
- **Backend** : Supabase (PostgreSQL + Auth + Storage)
- **IA** : OpenAI GPT-4o
- **UI** : Radix UI, Tailwind CSS, Lucide Icons
- **Charts** : Recharts
- **Export** : SheetJS (xlsx)

## 📦 Installation

### Prérequis
- Node.js 18+
- npm ou yarn
- Compte Supabase
- Clé API OpenAI

### Configuration

1. Cloner le repository
```bash
git clone https://github.com/sismaila-sudo/bpchatgpt.git
cd bpchatgpt
```

2. Installer les dépendances
```bash
cd frontend
npm install
```

3. Configurer les variables d'environnement
```bash
cp ../.env.example .env.local
```

Remplir les variables dans `.env.local`:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key
SUPABASE_SERVICE_ROLE_KEY=votre-service-key

# OpenAI Configuration
OPENAI_API_KEY=votre-openai-api-key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Lancer l'application
```bash
npm run dev
```

L'application sera disponible sur `http://localhost:3000`

## 🗃 Structure de la Base de Données

### Tables Principales
- `projects` : Projets et métadonnées
- `products_services` : Produits et services
- `sales_projections` : Projections de vente
- `opex_items` : Charges opérationnelles
- `capex_items` : Investissements
- `financial_outputs` : Résultats calculés
- `uploaded_documents` : Documents uploadés

### Schéma de Déploiement Supabase
Le projet inclut des scripts SQL pour créer toutes les tables et configurer les RLS (Row Level Security).

## 🚀 Déploiement

### Vercel (Recommandé)

1. Connecter votre repository GitHub à Vercel
2. Configurer les variables d'environnement dans Vercel
3. Déployer automatiquement

### Variables d'Environnement Vercel
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
NEXT_PUBLIC_APP_URL
```

## 📱 Utilisation

### 1. Création de Projet
- Choisir le type : **Nouvelle Entreprise** ou **Entreprise en Activité**
- Remplir les informations de base
- Définir l'horizon de projection (3-10 ans)

### 2. Saisie des Données
- **Identité** : Informations de l'entreprise
- **Données Financières** : Produits, ventes, charges, investissements
- **Analyse Existant** : Upload de documents (entreprises en activité)

### 3. Calculs et Résultats
- Calculs automatiques des projections
- Visualisation des ratios et indicateurs
- Tableaux de bord interactifs

### 4. Business Plan
- Auto-remplissage basé sur vos données
- Édition manuelle de toutes les sections
- Amélioration IA optionnelle (premium)

### 5. Export
- Export Excel complet
- Formats FONGIP, FAISE, Standard
- Aperçu avant export

## 🔧 Développement

### Structure des Fichiers
```
frontend/
├── src/
│   ├── app/                    # App Router Next.js
│   ├── components/             # Composants React
│   │   ├── project/           # Composants projet
│   │   │   ├── tabs/          # Onglets du workbook
│   │   │   └── sections/      # Sections business plan
│   │   └── ui/                # Composants UI Radix
│   ├── lib/                   # Utilitaires
│   └── services/              # Services (API, calculs, etc.)
```

### Scripts Disponibles
```bash
npm run dev          # Développement
npm run build        # Build production
npm run start        # Serveur production
npm run lint         # Linting
```

## 🤝 Contribution

1. Fork le repository
2. Créer une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les changements (`git commit -am 'Ajouter nouvelle fonctionnalité'`)
4. Push la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrir une Pull Request

## 📄 License

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Pour toute question ou problème :
- Ouvrir une issue GitHub
- Consulter la documentation Supabase
- Vérifier les logs Vercel en cas de problème de déploiement

## 🎯 Roadmap

- [ ] Authentification utilisateur complète
- [ ] Collaboration multi-utilisateurs
- [ ] Templates de business plans sectoriels
- [ ] Intégration comptabilité (Sage, Ciel)
- [ ] API REST complète
- [ ] Application mobile





---

**Business Plan Generator** - Générez des business plans professionnels en quelques clics ! 🚀