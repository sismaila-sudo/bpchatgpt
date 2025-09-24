# BP ChatGPT - Business Plan Assistant

Assistant IA pour la création de business plans professionnels.

## 🚀 Déploiement rapide

### Option 1: Vercel (Recommandé)

1. Push le code sur GitHub
2. Connecte ton compte Vercel à GitHub
3. Importe le repository
4. Configure les variables d'environnement si nécessaire
5. Deploie automatiquement

### Option 2: AWS Amplify

1. Push le code sur GitHub
2. Va sur AWS Amplify Console
3. Connecte ton repository GitHub
4. Le fichier `amplify.yml` configure le build automatiquement
5. Deploie

### Option 3: Netlify

1. Push le code sur GitHub
2. Connecte Netlify à ton repository
3. Build automatique avec les paramètres par défaut

## 📁 Structure du projet

```
├── src/
│   ├── app/
│   │   ├── layout.tsx    # Layout principal
│   │   ├── page.tsx      # Page d'accueil
│   │   └── globals.css   # Styles globaux
│   ├── components/       # Composants React
│   └── lib/             # Utilitaires
├── public/              # Fichiers statiques
├── amplify.yml          # Configuration AWS
├── vercel.json          # Configuration Vercel
└── package.json         # Dépendances
```

## 🔧 Développement local

```bash
# Installer les dépendances
npm ci

# Démarrer en mode dev
npm run dev

# Builder pour la production
npm run build

# Démarrer la version production
npm start
```

## 🌐 Variables d'environnement

Copie `.env.example` vers `.env.local` et configure :

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## ✅ Prêt pour la production

- ✅ Next.js 15 avec App Router
- ✅ TypeScript configuré
- ✅ Tailwind CSS
- ✅ Configuration Vercel/AWS/Netlify
- ✅ Structure modulaire
- ✅ Optimisé pour le déploiement
- ✅ Variables d'environnement configurées

🚀 **Déployé avec succès sur AWS Amplify !**