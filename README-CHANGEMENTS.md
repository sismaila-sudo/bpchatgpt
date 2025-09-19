# 🚀 Guide pour Voir les Nouveaux Changements

## 📍 URLs Actuelles
- **Frontend** : http://localhost:3003
- **Backend** : http://localhost:3004

## 🔧 ÉTAPE 1 : Configurer la Base de Données

**IMPORTANT** : Les nouvelles fonctionnalités ne seront visibles qu'après avoir exécuté le script SQL !

1. Va sur **Supabase Dashboard** : https://supabase.com/dashboard
2. Sélectionne ton projet : `nddimpfyofoopjnroswf`
3. Va dans **SQL Editor** (icône </> dans la sidebar)
4. Copie et colle le contenu du fichier `setup-templates.sql`
5. Clique **Run** pour exécuter le script

## 🎯 ÉTAPE 2 : Voir les Nouveaux Changements

### 🆕 **1. Nouveau Flux de Création**
- Va sur http://localhost:3003
- Clique **"Nouveau Projet"**
- Tu verras maintenant **2 étapes** :
  1. ✅ Informations de base (nom, date, horizon)
  2. ✅ **NOUVEAU** : Sélection de template et mode

### 🏢 **2. Sélection des Modes**
Sur l'étape 2, tu peux choisir :
- **Nouvelle Entreprise** : Pour création d'entreprise
- **Entreprise Existante** : Pour expansion/développement

### 🎨 **3. Templates Sectoriels**
Tu verras maintenant des templates par secteur :
- **Général** : Business plans standards
- **Agriculture** : Templates spécialisés agricoles
- **Technologie** : Templates pour startups tech

### 📋 **4. Sections Pré-configurées**
Après avoir créé un projet avec template :
- Les sections sont automatiquement créées
- Contenu pré-rempli selon le secteur
- Prompts IA personnalisés

## 🔍 ÉTAPE 3 : Vérifier Que Tout Fonctionne

### ✅ **Test du Nouveau Système**
1. Crée un nouveau projet via le nouveau flux
2. Choisis "Agriculture" + "Entreprise Existante"
3. Le projet devrait avoir des sections spécialisées agriculture

### 🖼️ **Test des Images (Si tables créées)**
1. Va dans un projet existant
2. Va dans "Business Plan" (tab)
3. Tu devrais voir des boutons pour ajouter des images aux sections

## 🐛 Dépannage

### Si tu ne vois pas les changements :
1. **Vérifier les URLs** : Frontend sur 3003, Backend sur 3004
2. **Exécuter le script SQL** dans Supabase (étape cruciale!)
3. **Vider le cache** : Ctrl+F5 sur le navigateur
4. **Vérifier la console** : F12 pour voir les erreurs

### Si erreurs de compilation :
- Les nouveaux composants sont dans `/src/components/project/`
- Le service est dans `/src/services/documentTemplateService.ts`

## 📁 Fichiers Modifiés/Créés

### 🆕 Nouveaux Fichiers
- `src/components/project/TemplateSelector.tsx`
- `src/components/project/SectionImageManager.tsx`
- `src/services/documentTemplateService.ts`
- `setup-templates.sql`

### ✏️ Fichiers Modifiés
- `src/app/projects/new/page.tsx` (flux multi-étapes)
- `.env.local` (URL backend mise à jour)

## 🎯 Où Voir les Différences

**AVANT** :
- Création simple avec juste nom/secteur
- Sections génériques identiques pour tous

**APRÈS** :
- Flux 2 étapes avec sélection template
- Sections pré-configurées par secteur
- Modes nouveau/existant
- Gestion d'images par section
- Prompts IA contextuels

---
💡 **Conseil** : Commence par exécuter le script SQL, puis teste la création d'un nouveau projet !