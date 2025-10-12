# 📚 Base de Connaissances - Dossier d'Upload

## 🎯 Comment ça marche

1. **Déposez vos documents** (PDF ou Word) dans ce dossier
2. **Exécutez la commande** : `npm run upload-docs`
3. **C'est tout !** Les documents sont automatiquement chargés dans Pinecone

## 📁 Formats supportés

- ✅ **PDF** (.pdf)
- ✅ **Word** (.docx)

## 🏷️ Nommage recommandé

Format : `[Secteur]_[Titre]_[Année].extension`

### Exemples :
- `Agriculture_Rapport_ANSD_2024.pdf`
- `BTP_Etude_Marche_Dakar_2024.pdf`
- `Finance_Taux_Bancaires_2024.docx`
- `Tourisme_Statistiques_Ministere_2024.pdf`
- `Energie_Plan_Solaire_2024.pdf`

## 📊 Secteurs suggérés

Utilisez ces noms pour le préfixe `[Secteur]` :

- `Agriculture` - Cultures, élevage, agrobusiness
- `Peche` - Pêche artisanale et industrielle
- `BTP` - Bâtiment, travaux publics, construction
- `Tourisme` - Hôtellerie, restauration, tourisme
- `Transport` - Logistique, fret, transport
- `Energie` - Électricité, solaire, énergies renouvelables
- `Sante` - Cliniques, pharmacies, équipements médicaux
- `Education` - Écoles, formations, université
- `Textile` - Confection, mode, habillement
- `Numerique` - IT, fintech, services numériques
- `Finance` - Banques, assurances, microfinance
- `Commerce` - Import-export, distribution, retail
- `Industrie` - Transformation, manufacturing
- `Mines` - Extraction, ressources minérales

## ⚡ Commandes

### Uploader les documents
```bash
npm run upload-docs
```

### Vérifier la base de connaissances
Les documents sont stockés dans Pinecone (cloud). Pour voir combien de documents sont chargés, exécutez la commande d'upload (elle affiche les stats sans réuploader si déjà présent).

## 🔍 Ce qui se passe automatiquement

1. **Extraction** : Le texte est extrait du PDF/Word
2. **Découpage** : Le document est découpé en morceaux de ~2000 caractères
3. **Vectorisation** : Chaque morceau est transformé en vecteur (embeddings OpenAI)
4. **Upload** : Les vecteurs sont uploadés dans Pinecone
5. **Indexation** : Pinecone indexe pour recherche sémantique ultra-rapide

## 💡 Conseils

- **Qualité** : Privilégiez les documents officiels (gouvernement, organismes)
- **Actualité** : Utilisez des documents récents (2023-2024)
- **Taille** : Pas de limite, les gros documents sont découpés automatiquement
- **Langue** : Français de préférence (contexte Sénégal)

## 🚫 Documents à éviter

- Documents confidentiels (données sensibles)
- Documents brouillons ou non vérifiés
- Documents en mauvaise qualité (scans illisibles)
- Informations obsolètes (> 5 ans)

## 📈 Capacité

- **Gratuit Pinecone** : 100,000 vecteurs
- **Actuellement** : 6 documents officiels de base
- **Capacité restante** : ~16,000 documents supplémentaires
- **Coût après quota** : 70$/mois (si dépassement)

## ❓ Support

En cas de problème avec l'upload, vérifiez :
1. `PINECONE_API_KEY` est bien dans `.env.local`
2. Le fichier PDF/Word n'est pas corrompu
3. Le nom de fichier ne contient pas de caractères spéciaux

Pour les documents très volumineux (> 100 pages), l'upload peut prendre quelques minutes.
