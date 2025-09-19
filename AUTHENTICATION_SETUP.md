# Configuration de l'Authentification - Business Plan Generator

## 🚀 Système d'Authentification Implémenté

Le Business Plan Generator dispose maintenant d'un système d'authentification complet avec :

### ✅ Fonctionnalités Principales

1. **Authentification Multi-Méthodes**
   - Connexion par email/mot de passe
   - Connexion via Google OAuth
   - Inscription avec validation par email

2. **Gestion des Utilisateurs**
   - Profils utilisateurs complets
   - Tableau de bord personnalisé
   - Statistiques d'utilisation

3. **Collaboration Multi-Utilisateurs**
   - Propriété des projets
   - Invitation de collaborateurs
   - Rôles et permissions (Admin, Financier, Analyste, Lecteur)
   - Gestion des équipes projet

4. **Sécurité**
   - Sessions sécurisées avec Supabase Auth
   - Protection des routes
   - Row Level Security (RLS) sur la base de données

## 🔧 Configuration Requise

### 1. Variables d'Environnement

Créez un fichier `.env.local` dans le dossier `frontend/` :

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anonyme

# API Backend
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 2. Configuration Supabase

#### A. Créer un Projet Supabase
1. Allez sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Notez l'URL et la clé API anonyme

#### B. Configurer l'Authentification
1. Dans Supabase Dashboard → Authentication → Settings
2. Activez les providers souhaités :
   - **Email** : Activé par défaut
   - **Google** : Configurez les clés OAuth Google

#### C. Configuration Google OAuth (Optionnel)
1. Allez sur [Google Cloud Console](https://console.cloud.google.com)
2. Créez un projet ou sélectionnez un existant
3. Activez l'API Google+
4. Créez des identifiants OAuth 2.0
5. Ajoutez les URIs de redirection :
   - `https://votre-projet.supabase.co/auth/v1/callback`
   - `http://localhost:3002/auth/callback` (dev)

#### D. Configuration des URLs de redirection
Dans Supabase → Authentication → URL Configuration :
- **Site URL** : `http://localhost:3002` (dev) / `https://votre-domaine.com` (prod)
- **Redirect URLs** : Ajoutez vos URLs de callback

### 3. Base de Données

Exécutez ces scripts SQL dans l'éditeur SQL de Supabase :

```sql
-- 1. Script principal d'authentification
\i add-auth-support.sql

-- 2. Fonctionnalités de collaboration
\i add-collaboration-features.sql
```

## 🏃‍♂️ Démarrage

1. **Installation des dépendances**
   ```bash
   cd frontend
   npm install
   ```

2. **Démarrage du frontend**
   ```bash
   npm run dev
   ```

3. **Démarrage du backend**
   ```bash
   cd ../backend
   npm run dev
   ```

4. **Accès à l'application**
   - Frontend : http://localhost:3002
   - Backend API : http://localhost:3001

## 🔐 Utilisation du Système

### Première Connexion

1. **Inscription**
   - Allez sur http://localhost:3002
   - Cliquez sur "Créer un compte"
   - Remplissez le formulaire
   - Vérifiez votre email pour activer le compte

2. **Connexion**
   - Email/mot de passe OU Google OAuth
   - Accès automatique au tableau de bord

### Gestion des Projets

1. **Création de Projet**
   - Clic sur "Nouveau Projet"
   - Remplissage des informations de base
   - Création automatique de l'organisation utilisateur
   - Ajout automatique comme collaborateur admin

2. **Collaboration**
   - Onglet "Collaborateurs" dans chaque projet
   - Invitation par email avec rôles spécifiques
   - Gestion des permissions en temps réel

### Rôles et Permissions

| Rôle | Permissions |
|------|-------------|
| **Admin** | Accès complet, gestion collaborateurs, paramètres |
| **Financier** | Modification données financières et projections |
| **Analyste** | Modification produits, ventes, données métier |
| **Lecteur** | Consultation uniquement, export rapports |

## 🛠️ Fonctionnalités Avancées

### Protection des Routes
- Redirection automatique vers `/auth/login` si non connecté
- Middleware Next.js pour gestion des sessions
- Protection côté serveur avec Supabase Auth

### Gestion des Erreurs
- Messages d'erreur contextuels
- Validation côté client et serveur
- Gestion des timeouts et erreurs réseau

### Performance
- Cache des sessions utilisateur
- Optimisation des requêtes Supabase
- Chargement asynchrone des données

## 🔍 Dépannage

### Problèmes Courants

1. **Erreur "User not authenticated"**
   - Vérifiez les variables d'environnement
   - Confirmez la configuration Supabase
   - Videz le cache navigateur

2. **Google OAuth ne fonctionne pas**
   - Vérifiez les clés Google Cloud
   - Confirmez les URLs de redirection
   - Testez en mode incognito

3. **Invitations qui ne marchent pas**
   - Vérifiez que la table `project_collaborators` existe
   - Exécutez le script `add-collaboration-features.sql`
   - Vérifiez les permissions RLS

### Logs de Debug
- Frontend : Console navigateur (F12)
- Backend : Terminal du serveur
- Supabase : Dashboard → Logs

## 📚 Architecture Technique

### Structure des Composants
```
src/
├── hooks/
│   └── useAuth.ts                 # Hook d'authentification global
├── components/
│   ├── providers/
│   │   └── AuthProvider.tsx       # Context provider d'auth
│   ├── project/tabs/
│   │   └── CollaboratorsTab.tsx   # Gestion collaborateurs
│   └── RecentProjects.tsx         # Liste projets utilisateur
├── app/
│   ├── auth/
│   │   ├── login/page.tsx         # Page de connexion
│   │   ├── register/page.tsx      # Page d'inscription
│   │   └── callback/route.ts      # Callback OAuth
│   ├── profile/page.tsx           # Profil utilisateur
│   └── projects/new/page.tsx      # Création projet
└── lib/supabase/
    ├── client.ts                  # Client Supabase browser
    ├── server.ts                  # Client Supabase server
    └── middleware.ts              # Middleware sessions
```

### Base de Données
```sql
-- Tables principales
organizations          # Organisations utilisateurs
projects               # Projets business plan
project_collaborators  # Collaborations et permissions
auth.users            # Utilisateurs Supabase (natif)
```

## 🚀 Prochaines Étapes

Le système d'authentification est maintenant **complet et fonctionnel**. Vous pouvez :

1. **Tester l'application** avec de vrais utilisateurs
2. **Configurer un domaine personnalisé** pour la production
3. **Ajouter des fonctionnalités avancées** :
   - Notifications en temps réel
   - Audit des modifications
   - Sauvegarde automatique
   - Intégration email avancée

## 📞 Support

- Documentation Supabase : https://supabase.com/docs
- Guide Next.js Auth : https://nextjs.org/docs/authentication
- Issues GitHub : https://github.com/votre-repo/issues

---

**✅ L'authentification est maintenant prête pour la production !**