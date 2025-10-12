# 📄 Guide Export Preview - Business Plan HTML Éditable

## 🎯 Vue d'ensemble

La page **Export Preview** remplace le système d'export PDF traditionnel par une **prévisualisation HTML éditable** du business plan complet.

### Avantages

✅ **Visualisation immédiate** - Voir le business plan complet sans téléchargement
✅ **Édition inline** - Modifier le texte directement dans le navigateur
✅ **Templates institutionnels** - FONGIP, Banque, Pitch, Complet
✅ **Impression optimisée** - Générer PDF via `Ctrl+P`
✅ **Téléchargement HTML** - Sauvegarder le HTML pour édition externe
✅ **Performance** - Pas de librairie PDF lourde côté client

---

## 📍 Accès

### Option 1 : Depuis la page Vue d'ensemble
```
/projects/[id] → Actions rapides → "Export Preview"
```

### Option 2 : Depuis la sidebar
```
Sidebar → Section "Export" → "Export Preview"
```

### Option 3 : URL directe
```
/projects/[projectId]/export-preview
```

---

## 🎨 Templates disponibles

| Template | Sections | Usage | Couleur |
|----------|----------|-------|---------|
| **FONGIP** | 15 sections | Dossier complet FONGIP | Bleu |
| **Banque** | 11 sections | Financement bancaire (focus financier) | Vert |
| **Pitch** | 7 sections | Présentation investisseurs (synthèse) | Violet |
| **Complet** | 16 sections | Export exhaustif (tout) | Indigo |

### Sections par template

#### FONGIP (15 sections)
- ✅ Résumé Exécutif
- ✅ Identification Entreprise
- ✅ Étude de Marché
- ✅ Analyse SWOT
- ✅ Stratégie Marketing
- ✅ Ressources Humaines
- ✅ Plan de Financement
- ✅ Fiche Synoptique FONGIP
- ✅ Analyse Financière Historique
- ✅ Tableaux Financiers
- ✅ Relations Bancaires
- ✅ VAN/TRI/DRCI
- ✅ Projections Financières
- ✅ Scoring FONGIP
- ✅ Cover + TOC

#### Banque (11 sections)
- Focus sur sections financières et garanties
- Exclut Marketing et RH

#### Pitch (7 sections)
- Résumé, Marché, SWOT, Financier, Projections, VAN/TRI
- Format court pour investisseurs

#### Complet (16 sections)
- Toutes les sections BP + FONGIP
- Export le plus exhaustif

---

## 🛠️ Fonctionnalités

### 1. Sélection de template

**Barre supérieure** : 4 boutons pour changer de template instantanément

```tsx
[FONGIP] [Banque] [Pitch] [Complet]
```

**Changement de template** :
- ⏱️ Recharge automatiquement le HTML
- 🎨 Applique palette de couleurs spécifique
- 📋 Filtre sections selon template

### 2. Mode édition

**Activer** : Bouton "Éditer" dans barre supérieure

**Fonctionnement** :
- Clic sur n'importe quel texte pour modifier
- Édition inline avec `contentEditable`
- Bordure orange indique mode actif

**Actions** :
- **Annuler** : Restaure HTML original
- **Sauvegarder** : Conserve modifications (localement)

⚠️ **Limitations actuelles** :
- Modifications non sauvegardées en base de données
- Perdues au rechargement de page
- Future évolution : sauvegarde Firebase personnalisée

### 3. Impression / PDF

**Bouton** : "Imprimer / PDF" (bouton bleu principal)

**Workflow** :
1. Clic sur "Imprimer / PDF"
2. Si mode édition actif → désactivation automatique
3. Ouverture dialog impression navigateur (`window.print()`)
4. **Options disponibles** :
   - 🖨️ Imprimer physiquement
   - 💾 Sauvegarder en PDF (destination : "PDF")
   - 📧 Envoyer par email
   - ☁️ Sauvegarder dans Google Drive/OneDrive

**Optimisations CSS** :
```css
@media print {
  @page { size: A4 portrait; margin: 2cm; }
  .page-break { page-break-before: always; }
  .section { page-break-inside: avoid; }
}
```

### 4. Téléchargement HTML

**Bouton** : "HTML" (à côté de "Imprimer")

**Usage** :
- Télécharge fichier `.html` complet
- Ouvrir avec navigateur ou éditeur HTML
- Éditer avec outils externes (Word via "Ouvrir avec...")
- Partager fichier autonome

**Nom fichier** : `business-plan-[nom-projet].html`

### 5. Navigation

**Retour** : Bouton "← Retour" (retour page précédente)

---

## 🏗️ Architecture technique

### Frontend

**Route** : `src/app/projects/[id]/export-preview/page.tsx`

**Composant principal** : `ExportPreviewPage`

**État** :
```tsx
const [html, setHtml] = useState<string>('')
const [editMode, setEditMode] = useState(false)
const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('complet')
const [options, setOptions] = useState<PDFExportOptions>({ ... })
```

**Hooks** :
- `useEffect` → Charge HTML au montage
- `useParams` → Récupère `projectId`
- `useRouter` → Navigation retour

### Backend

**API** : `POST /api/pdf/export`

**Payload** :
```json
{
  "projectId": "abc123",
  "options": {
    "template": "fongip",
    "includeResume": true,
    "includeIdentification": true,
    ...
  }
}
```

**Response** :
```json
{
  "success": true,
  "html": "<!DOCTYPE html>...",
  "projectName": "Mon Projet",
  "tablesBundle": { ... }
}
```

**Service** : `CompletePDFExportService`

**Méthodes clés** :
- `getAvailableSections(projectId)` → Liste sections disponibles
- `prepareExportData(project, projectId, options)` → Charge données Firebase
- `generateCompleteHTML(exportData, options)` → Génère HTML final

### Flux de données

```
[Client]
    ↓ POST /api/pdf/export
[API Route]
    ↓ prepareExportData()
[CompletePDFExportService]
    ├─ FicheSynoptiqueService.getFicheSynoptique()
    ├─ AnalyseFinanciereHistoriqueService.getAnalyse()
    ├─ TableauxFinanciersService.getTableauxFinanciers()
    ├─ RelationsBancairesService.getRelationsBancaires()
    └─ FONGIPScoringService.calculateProjectScore()
        ↓
[ExportedPDFData]
    ├─ project: Project
    ├─ sections: PDFSection[]
    ├─ fongipData: { ... }
    └─ metadata: { ... }
        ↓ generateCompleteHTML()
[HTML complet]
    ↓ Response JSON
[Client]
    ↓ setHtml(data.html)
[Rendu dangerouslySetInnerHTML]
```

---

## 🎨 Styles et rendu

### HTML généré

Structure type :
```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Business Plan - [Nom Projet]</title>
  <style>
    /* Styles inline pour portabilité */
    body { font-family: 'Segoe UI', sans-serif; }
    .page { padding: 60px; max-width: 210mm; }
    h1 { color: #2563eb; font-size: 32px; }
    /* ... 500+ lignes CSS */
  </style>
</head>
<body>
  <!-- Page de couverture -->
  <div class="page">...</div>

  <!-- Table des matières -->
  <div class="page">...</div>

  <!-- Sections -->
  <div class="page">...</div>

  <!-- Footer -->
  <div class="watermark">BP Design Pro</div>
</body>
</html>
```

### Styles adaptatifs

**Écran** :
- Max-width: 210mm (format A4)
- Shadow box pour effet papier
- Scrollable

**Impression** :
- @page A4 portrait
- Marges 2cm
- Page breaks intelligents
- Pas de shadow

---

## 📊 Performance

### Métriques estimées

| Opération | Temps | Consommation |
|-----------|-------|--------------|
| Chargement données Firebase | 500-1000ms | 5-10 reads |
| Génération HTML serveur | 200-500ms | ~300KB |
| Rendu client | 100-200ms | ~500KB RAM |
| **Total** | **~1-2 secondes** | **Acceptable** |

### Optimisations appliquées

✅ **Lazy loading** : Charge uniquement sections sélectionnées
✅ **Cache potentiel** : Données Firebase cachables
✅ **HTML statique** : Pas de re-render React
✅ **CSS inline** : Pas de requêtes externes

### Scalabilité

**100 utilisateurs simultanés** :
- 100 appels API `/api/pdf/export` → ✅ OK (Next.js Edge)
- 500-1000 reads Firestore → ✅ OK (quotas 50K/jour gratuit)
- Génération HTML serveur → ✅ Stateless, scalable

**Risques** :
- ⚠️ Timeout API si génération > 10s (Vercel)
- ⚠️ Quotas Firestore si > 5000 exports/jour

---

## 🔮 Évolutions futures

### Phase 10 - Sauvegarde éditions

**Objectif** : Persister modifications utilisateur

**Architecture** :
```typescript
// Firestore: users/{uid}/projects/{pid}/customExports/{exportId}
interface CustomExport {
  id: string
  projectId: string
  template: TemplateType
  editedHTML: string
  createdAt: Date
  updatedAt: Date
}
```

**Fonctionnalités** :
- Liste exports personnalisés
- Restaurer export précédent
- Partager export avec lien

### Phase 11 - Exports alternatifs

**Word (.docx)** :
```bash
npm install html-docx-js
```

**PowerPoint (pitch deck)** :
```bash
npm install pptxgenjs
```

**JSON API** :
```typescript
GET /api/projects/{id}/export.json
→ { project, sections, fongipData }
```

### Phase 12 - Templates customs

**Éditeur visuel** :
- Drag & drop sections
- Personnalisation couleurs/polices
- Sauvegarde template réutilisable
- Partage inter-utilisateurs

### Phase 13 - Export serveur PDF

**Service externe** (Puppeteer Cloud) :
```typescript
POST /api/pdf/generate-server
→ Utilise Puppeteer headless
→ Retourne vrai PDF blob
```

**Alternatives** :
- https://pdfshift.io
- https://api2pdf.com
- AWS Lambda + Puppeteer

---

## ❓ FAQ

### Q1: Pourquoi HTML au lieu de PDF direct ?

**Raisons** :
1. **Performance** : Pas de librairie lourde côté client (~15MB jsPDF)
2. **Flexibilité** : Édition inline impossible avec PDF
3. **Qualité** : Impression navigateur > jsPDF rendering
4. **Portabilité** : HTML ouvrable partout
5. **Coût** : Pas de service externe payant

### Q2: Les modifications sont-elles sauvegardées ?

**Actuellement** : ❌ Non, perdues au refresh

**Solution de contournement** :
1. Éditer dans navigateur
2. Télécharger HTML
3. Rouvrir et imprimer

**Futur** : ✅ Phase 10 ajoutera sauvegarde Firebase

### Q3: Comment générer un vrai PDF ?

**Méthode 1** (Recommandée) :
1. Ouvrir Export Preview
2. Clic "Imprimer / PDF"
3. Sélectionner destination "PDF"
4. Enregistrer

**Méthode 2** (Chrome/Edge) :
1. `Ctrl+P` ou `Cmd+P`
2. Destination → Enregistrer en PDF
3. Options → Arrière-plans activés

**Méthode 3** (Firefox) :
1. Fichier → Imprimer
2. Destination → Microsoft Print to PDF

### Q4: Puis-je personnaliser les couleurs ?

**Actuellement** : ⚠️ Templates prédéfinis seulement

Couleurs par template :
- FONGIP : Bleu (#2563eb)
- Banque : Vert (#059669)
- Pitch : Violet (#7c3aed)
- Complet : Bleu (#2563eb)

**Futur** : Phase 12 ajoutera éditeur visuel

### Q5: Le HTML est-il compatible avec Word ?

**Partiellement** : ✅ Oui

**Workflow** :
1. Télécharger HTML
2. Ouvrir avec Microsoft Word
3. "Fichier → Ouvrir" → Sélectionner `.html`
4. Éditer dans Word
5. Enregistrer en `.docx`

**Limitations** :
- Styles CSS complexes peuvent être perdus
- Tableaux peuvent nécessiter réajustement
- Images inline doivent être base64 ou URL absolues

### Q6: Combien de temps pour générer l'export ?

**Temps moyen** : 1-2 secondes

**Détail** :
- Chargement données Firebase : 500-1000ms
- Génération HTML serveur : 200-500ms
- Rendu client : 100-200ms

**Cas lent** (> 3s) :
- Projet avec > 50 sections
- Images volumineuses (> 2MB)
- Connexion lente

### Q7: Puis-je exporter en anglais ?

**Actuellement** : ❌ Français uniquement

**Futur** : Possible via :
```typescript
interface PDFExportOptions {
  ...
  language: 'fr' | 'en'
}
```

Traduction automatique avec :
- Google Cloud Translation API
- OpenAI GPT-4 (meilleure qualité contexte métier)

---

## 🐛 Dépannage

### Problème : Page blanche après chargement

**Causes** :
1. Projet sans données
2. API timeout
3. Erreur génération HTML

**Solution** :
1. F12 → Console → Vérifier erreurs
2. Retourner à `/projects/[id]`
3. Compléter au moins 3 sections
4. Réessayer

### Problème : "HTML non disponible"

**Causes** :
- API `/api/pdf/export` en erreur
- Firestore permissions
- ProjectId invalide

**Solution** :
1. Vérifier `projectId` dans URL
2. Console → Network → Vérifier requête POST
3. Si 403 → problème permissions Firebase
4. Si 500 → voir logs serveur Vercel

### Problème : Modifications perdues après refresh

**Cause** : Comportement normal (Phase 9)

**Solution** :
1. Télécharger HTML avant refresh
2. Ou attendre Phase 10 (sauvegarde Firebase)

### Problème : Impression coupée

**Causes** :
- Marges navigateur trop grandes
- Format papier incorrect

**Solution** :
1. Dialog impression → Options avancées
2. Marges : "Minimales" ou "Personnalisées 1cm"
3. Format : A4 (210x297mm)
4. Arrière-plans : ✅ Activés

---

## 📚 Ressources

### Code source

| Fichier | Rôle |
|---------|------|
| `src/app/projects/[id]/export-preview/page.tsx` | Composant principal |
| `src/app/api/pdf/export/route.ts` | API endpoint |
| `src/services/completePDFExportService.ts` | Service génération HTML |
| `src/components/ModernSidebar.tsx` | Lien sidebar |

### APIs externes

| Service | URL | Rôle |
|---------|-----|------|
| Firebase Firestore | `firestore.googleapis.com` | Base données |
| Next.js API Routes | `/api/*` | Endpoints backend |

### Documentation

- [Guide Utilisation BP Design Pro](./GUIDE_UTILISATION_BP_DESIGN_PRO.md)
- [Rapport Audit Phase 8](./docs/RAPPORT_AUDIT_PHASE8.md) (à créer)

---

## 🎯 Résumé

**Export Preview** = Page HTML éditable remplaçant export PDF

**3 actions principales** :
1. **Voir** : Sélectionner template et visualiser
2. **Éditer** : Mode édition inline
3. **Imprimer** : Générer PDF via navigateur

**Accès rapide** :
- Sidebar → "Export Preview"
- Actions rapides → "Export Preview"

**Next step** : Phase 10 - Sauvegarde éditions Firebase

---

**Date** : 10 octobre 2025
**Version** : 1.0
**Auteur** : BP Design Pro Team
