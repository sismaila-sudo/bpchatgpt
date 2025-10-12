# 🔍 DEBUG : ERREUR PAGE SYNOPSIS

## ❌ **ERREUR OBSERVÉE**
```
Erreur lors du chargement des données
```

## 🎯 **CAUSES POSSIBLES**

### 1. **Règles Firestore trop restrictives**

**Vérifier :** `firestore.rules`

```javascript
// ❌ Si les règles sont comme ça, ça bloque :
match /fichesSynoptiques/{documentId} {
  allow read: if false;  // ← BLOQUE TOUT
}

// ✅ Devrait être comme ça :
match /fichesSynoptiques/{documentId} {
  allow read: if request.auth != null;  // ← AUTORISE USERS CONNECTÉS
  allow write: if request.auth != null && request.auth.uid == resource.data.userId;
}
```

### 2. **Utilisateur pas connecté**

**Test dans la console du navigateur (F12)** :
```javascript
// Vérifier si user est défini
console.log('User:', user)
// Devrait afficher : { uid: '...', email: '...' }
```

### 3. **Firebase pas initialisé**

**Vérifier :** `.env.local` contient toutes les clés Firebase

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### 4. **Collection vide (première utilisation)**

C'est normal ! Le service essaie de générer automatiquement la fiche :
```typescript
// Ligne 101 dans fiche-synoptique/page.tsx
const generated = await FicheSynoptiqueService.generateFromProject(projectId, user.uid)
```

Si cette génération échoue, c'est qu'il manque des données dans le projet.

---

## ✅ **SOLUTIONS**

### **Solution 1 : Vérifier les règles Firestore**

1. Ouvre Firebase Console : https://console.firebase.google.com/
2. Va dans **Firestore Database** → **Rules**
3. Vérifie que la règle pour `fichesSynoptiques` autorise la lecture :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Projects collection
    match /projects/{projectId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Fiches Synoptiques collection
    match /fichesSynoptiques/{ficheId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Autres collections...
  }
}
```

4. Clique sur **Publier**

### **Solution 2 : Vérifier la connexion**

Ouvre la console du navigateur (F12) et vérifie :
```javascript
// Dans la console
console.log('Auth:', auth.currentUser)
console.log('Project ID:', projectId)
```

### **Solution 3 : Créer manuellement une fiche**

Si le projet est nouveau, clique sur "Générer automatiquement" dans la page Synopsis.

### **Solution 4 : Redémarrer le serveur**

Parfois, les variables d'environnement ne se rechargent pas :
```bash
# Arrêter le serveur (Ctrl+C dans le terminal)
# Puis relancer :
npm run dev
```

---

## 🧪 **TEST RAPIDE**

### Dans la console du navigateur (F12) :

```javascript
// 1. Vérifier l'authentification
console.log('User UID:', user?.uid)

// 2. Vérifier le project ID
console.log('Project ID:', projectId)

// 3. Tester manuellement le service
import { FicheSynoptiqueService } from '@/services/ficheSynoptiqueService'
FicheSynoptiqueService.getFicheSynoptique(projectId)
  .then(data => console.log('Fiche:', data))
  .catch(err => console.error('Erreur:', err))
```

---

## 📝 **QUELLE EST LA VRAIE ERREUR ?**

Pour voir l'erreur complète :

1. Ouvre DevTools (F12)
2. Va dans l'onglet **Console**
3. Regarde le message complet
4. Envoie-moi le message d'erreur exact !

**Exemple d'erreurs possibles :**
- `FirebaseError: Missing or insufficient permissions` → Problème de règles
- `Cannot read property 'uid' of null` → User pas connecté
- `Document not found` → Normal, première utilisation

---

## 🎯 **PROCHAINE ÉTAPE**

**Dis-moi ce que tu vois dans la console du navigateur (F12) !** 

Ça m'aidera à identifier exactement le problème. 🔍

