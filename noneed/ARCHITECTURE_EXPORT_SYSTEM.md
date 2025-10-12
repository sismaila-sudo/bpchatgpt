# Architecture - Système d'Export Complet & Corrections

## 📋 Problèmes Identifiés

### 1. Export PDF Analyse Financière
**Statut**: Non implémenté (bouton présent, fonction vide)
**Localisation**: `src/app/analysis/[id]/page.tsx:79-82`

### 2. Bugs de Sauvegarde
**Problème A**: Boutons d'enregistrement ne fonctionnent pas dans certaines sections
**Problème B**: Bouton "Utiliser ce contenu" de l'assistant IA ne sauvegarde rien

### 3. Onglet Export Global
**Statut**: À créer entièrement
**Besoin**: Centralisation de toutes les sections + Templates + Export PDF professionnel

---

## 🏗️ ARCHITECTURE PROPOSÉE

### Phase 1: Export PDF Analyse Financière ✅

#### Solution: jsPDF + autoTable
```typescript
// src/services/analysisExportService.ts
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export class AnalysisExportService {
  static generateCreditNotePDF(analysis: ProjectAnalysis): void {
    const doc = new jsPDF()

    // 1. Page de couverture avec logo
    this.addCoverPage(doc, analysis)

    // 2. Résumé & Décision
    this.addDecisionSummary(doc, analysis)

    // 3. Tableau Sources & Emplois
    this.addSourcesEmploisTable(doc, analysis)

    // 4. Ratios financiers avec graphiques
    this.addFinancialRatios(doc, analysis)

    // 5. Projections sur 3 ans
    this.addProjectionsTable(doc, analysis)

    // 6. Risques & Mitigations
    this.addRisksAnalysis(doc, analysis)

    // 7. Note de crédit complète
    this.addCreditNote(doc, analysis)

    // Footer avec branding
    this.addFooter(doc)

    doc.save(`note-credit-${analysis.projectName}.pdf`)
  }
}
```

**Librairies nécessaires**:
- `jspdf`: Génération PDF côté client
- `jspdf-autotable`: Tableaux professionnels
- `chart.js` + `chartjs-node-canvas`: Graphiques (optionnel)

**Design**: Identique au design HTML Note Crédit FONGIP fourni

---

### Phase 2: Correction Bugs de Sauvegarde 🐛

#### Problème A: Boutons d'enregistrement

**Diagnostic**:
```typescript
// Sections concernées:
// - Synopsis: ✅ Fonctionne (utilise html2pdf)
// - Market Study: ❌ À vérifier
// - SWOT: ❌ À vérifier
// - Marketing: ❌ À vérifier
// - HR: ❌ À vérifier
// - Financial: ✅ Fonctionne (updateFinancialData)
```

**Cause probable**:
- Sections n'appellent pas `projectService.updateProjectSection()`
- Données stockées en state local mais jamais sauvegardées dans Firestore

**Solution**:
```typescript
// Pattern à appliquer dans chaque section
const handleSave = async () => {
  try {
    setSaving(true)

    await projectService.updateProjectSection(
      projectId,
      user.uid,
      'marketStudy', // nom de la section
      sectionData     // données à sauvegarder
    )

    toast.success('Section sauvegardée')
  } catch (error) {
    toast.error('Erreur de sauvegarde')
  } finally {
    setSaving(false)
  }
}
```

#### Problème B: Bouton "Utiliser ce contenu"

**Localisation**: `BusinessPlanAIAssistant.tsx:186-220`

**Diagnostic**:
```typescript
// Ligne 196: handleQuickAction() génère le contenu
// Ligne 205+: Ajoute seulement le message dans le chat
// ❌ MANQUANT: Callback onContentGenerated()
```

**Solution**:
```typescript
// Dans BusinessPlanAIAssistant.tsx
const handleUseContent = (content: string, section: string) => {
  if (onContentGenerated) {
    onContentGenerated(content, section)
  }

  // Notification
  toast.success('Contenu ajouté à la section')
}

// Dans les pages (ex: market-study/page.tsx)
const handleAIContent = async (content: string, section: string) => {
  // Parser le contenu markdown
  const parsedContent = parseAIContent(content)

  // Merger avec données existantes
  setMarketStudyData(prev => ({
    ...prev,
    ...parsedContent
  }))

  // Sauvegarder automatiquement
  await handleSave()
}
```

---

### Phase 3: Onglet Export Dynamique 🎯

#### Architecture Complète

```
src/
├── app/
│   └── projects/
│       └── [id]/
│           └── export/                    # NOUVEAU
│               └── page.tsx               # Interface export complète
│
├── components/
│   └── export/                            # NOUVEAU
│       ├── ExportPreview.tsx              # Prévisualisation en temps réel
│       ├── ExportSidebar.tsx              # Liste sections + toggle
│       ├── TemplateSelector.tsx           # Choix template
│       ├── ImageUploader.tsx              # Logo, photos
│       ├── SectionEditor.tsx              # Édition inline sections
│       └── PDFExporter.tsx                # Bouton export final
│
├── services/
│   ├── exportService.ts                   # NOUVEAU - Orchestrateur
│   └── templates/                         # NOUVEAU
│       ├── baseTemplate.ts                # Template de base
│       ├── faiseTemplate.ts               # Template FAISE
│       ├── fongipTemplate.ts              # Template FONGIP
│       ├── bankTemplate.ts                # Template Banque
│       └── customTemplates.ts             # Templates admin
│
└── types/
    └── export.ts                          # NOUVEAU - Types export
```

#### Types Export

```typescript
// src/types/export.ts
export interface ExportTemplate {
  id: string
  name: string
  description: string
  institution: 'FAISE' | 'FONGIP' | 'BANK' | 'CUSTOM'

  // Structure du document
  sections: ExportSection[]

  // Styling
  styles: {
    primaryColor: string
    secondaryColor: string
    font: string
    headerImage?: string
    footerText: string
  }

  // Métadonnées
  requiredSections: string[]  // Sections obligatoires
  optionalSections: string[]
  pageBreaks: string[]         // Après quelles sections

  // Ordre des sections
  sectionOrder: string[]

  // Images
  allowImages: boolean
  maxImagesPerSection: number
}

export interface ExportSection {
  id: string
  title: string
  type: 'cover' | 'toc' | 'synopsis' | 'market' | 'swot' | 'marketing' | 'hr' | 'financial' | 'appendix'

  // Données
  content: any
  images?: ExportImage[]

  // Configuration
  included: boolean        // Inclure dans l'export ?
  editable: boolean       // Éditable avant export ?
  pageNumber?: number

  // Statut
  completed: boolean      // Section validée ?
  lastUpdated: Date
}

export interface ExportImage {
  id: string
  url: string
  type: 'logo' | 'photo' | 'chart' | 'diagram'
  caption?: string
  position: 'cover' | 'header' | 'inline' | 'appendix'
  section?: string        // Section associée
}

export interface ExportConfig {
  projectId: string
  template: ExportTemplate
  sections: ExportSection[]
  images: ExportImage[]
  metadata: {
    title: string
    author: string
    date: Date
    version: string
  }
}
```

#### Interface Export (page.tsx)

```typescript
'use client'

export default function ProjectExportPage() {
  const { id } = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [exportConfig, setExportConfig] = useState<ExportConfig | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<ExportTemplate | null>(null)
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview'>('edit')

  // Layout: 3 colonnes
  return (
    <ModernProjectLayout project={project} currentSection="export">
      <div className="flex h-screen">
        {/* Sidebar gauche: Sections */}
        <ExportSidebar
          sections={exportConfig?.sections || []}
          onToggleSection={handleToggleSection}
          onReorderSections={handleReorderSections}
        />

        {/* Centre: Prévisualisation / Édition */}
        <div className="flex-1 overflow-y-auto">
          <ExportPreview
            config={exportConfig}
            mode={previewMode}
            onEditSection={handleEditSection}
          />
        </div>

        {/* Sidebar droite: Options */}
        <div className="w-80 bg-white border-l overflow-y-auto">
          {/* 1. Choix template */}
          <TemplateSelector
            selectedTemplate={selectedTemplate}
            onSelectTemplate={handleSelectTemplate}
          />

          {/* 2. Images */}
          <ImageUploader
            images={exportConfig?.images || []}
            onAddImage={handleAddImage}
            onRemoveImage={handleRemoveImage}
          />

          {/* 3. Métadonnées */}
          <MetadataEditor
            metadata={exportConfig?.metadata}
            onChange={handleMetadataChange}
          />

          {/* 4. Export */}
          <PDFExporter
            config={exportConfig}
            onExport={handleExportPDF}
          />
        </div>
      </div>
    </ModernProjectLayout>
  )
}
```

#### Service d'Export Principal

```typescript
// src/services/exportService.ts
export class ExportService {

  /**
   * Crée une configuration d'export à partir d'un projet
   */
  static async createExportConfig(project: Project): Promise<ExportConfig> {
    // Collecter toutes les sections complétées
    const sections: ExportSection[] = []

    // Cover (toujours inclus)
    sections.push({
      id: 'cover',
      title: 'Page de couverture',
      type: 'cover',
      content: this.extractCoverData(project),
      included: true,
      editable: true,
      completed: true,
      lastUpdated: project.updatedAt
    })

    // Synopsis (si disponible)
    if (project.sections?.synopsis) {
      sections.push({
        id: 'synopsis',
        title: 'Résumé exécutif',
        type: 'synopsis',
        content: project.sections.synopsis,
        included: true,
        editable: true,
        completed: true,
        lastUpdated: project.updatedAt
      })
    }

    // Market Study
    if (project.sections?.marketStudy) {
      sections.push({
        id: 'market',
        title: 'Étude de marché',
        type: 'market',
        content: project.sections.marketStudy,
        included: true,
        editable: true,
        completed: true,
        lastUpdated: project.updatedAt
      })
    }

    // SWOT
    if (project.sections?.swot) {
      sections.push({
        id: 'swot',
        title: 'Analyse SWOT',
        type: 'swot',
        content: project.sections.swot,
        included: true,
        editable: true,
        completed: true,
        lastUpdated: project.updatedAt
      })
    }

    // Marketing
    if (project.sections?.marketing) {
      sections.push({
        id: 'marketing',
        title: 'Plan marketing',
        type: 'marketing',
        content: project.sections.marketing,
        included: true,
        editable: true,
        completed: true,
        lastUpdated: project.updatedAt
      })
    }

    // HR
    if (project.sections?.hr) {
      sections.push({
        id: 'hr',
        title: 'Ressources humaines',
        type: 'hr',
        content: project.sections.hr,
        included: true,
        editable: true,
        completed: true,
        lastUpdated: project.updatedAt
      })
    }

    // Financial
    if (project.sections?.financial) {
      sections.push({
        id: 'financial',
        title: 'Plan financier',
        type: 'financial',
        content: project.sections.financial,
        included: true,
        editable: true,
        completed: true,
        lastUpdated: project.updatedAt
      })
    }

    return {
      projectId: project.id,
      template: TEMPLATES.base, // Template par défaut
      sections,
      images: [],
      metadata: {
        title: project.basicInfo.name,
        author: 'BP Design Pro',
        date: new Date(),
        version: '1.0'
      }
    }
  }

  /**
   * Génère le PDF final
   */
  static async generatePDF(config: ExportConfig): Promise<Blob> {
    const { template } = config

    // Sélectionner le bon template
    const templateGenerator = TEMPLATES[template.institution.toLowerCase()]

    if (!templateGenerator) {
      throw new Error('Template introuvable')
    }

    // Générer le PDF avec le template
    return templateGenerator.generate(config)
  }

  /**
   * Sauvegarde la configuration d'export
   */
  static async saveExportConfig(config: ExportConfig): Promise<void> {
    const docRef = doc(db, 'exportConfigs', config.projectId)
    await setDoc(docRef, {
      ...config,
      updatedAt: Timestamp.now()
    })
  }

  /**
   * Charge une configuration existante
   */
  static async loadExportConfig(projectId: string): Promise<ExportConfig | null> {
    const docRef = doc(db, 'exportConfigs', projectId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return docSnap.data() as ExportConfig
    }

    return null
  }
}
```

#### Templates

```typescript
// src/services/templates/fongipTemplate.ts
export const FongipTemplate: ExportTemplate = {
  id: 'fongip',
  name: 'Template FONGIP',
  description: 'Format standard pour soumission au FONGIP',
  institution: 'FONGIP',

  sections: [],

  styles: {
    primaryColor: '#1e3a8a',      // Bleu FONGIP
    secondaryColor: '#10b981',     // Vert
    font: 'Arial, sans-serif',
    headerImage: '/templates/fongip-header.png',
    footerText: 'Document généré par BP Design Pro - FONGIP'
  },

  requiredSections: [
    'cover',
    'synopsis',
    'market',
    'financial'
  ],

  optionalSections: [
    'swot',
    'marketing',
    'hr',
    'appendix'
  ],

  pageBreaks: ['cover', 'synopsis', 'market', 'financial'],

  sectionOrder: [
    'cover',
    'toc',
    'synopsis',
    'market',
    'swot',
    'marketing',
    'hr',
    'financial',
    'appendix'
  ],

  allowImages: true,
  maxImagesPerSection: 3
}

export class FongipTemplateGenerator {
  static generate(config: ExportConfig): Promise<Blob> {
    const doc = new jsPDF({
      format: 'a4',
      unit: 'mm'
    })

    // Styles FONGIP
    const primaryColor = [30, 58, 138]   // RGB
    const secondaryColor = [16, 185, 129]

    // Page de couverture FONGIP
    this.addFongipCover(doc, config)

    // Table des matières
    doc.addPage()
    this.addTableOfContents(doc, config)

    // Sections
    config.sections
      .filter(s => s.included)
      .forEach(section => {
        doc.addPage()
        this.addSection(doc, section, config.template.styles)
      })

    // Footer sur toutes les pages
    const pageCount = doc.internal.pages.length - 1
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      this.addFongipFooter(doc, i, pageCount)
    }

    return Promise.resolve(doc.output('blob'))
  }

  private static addFongipCover(doc: jsPDF, config: ExportConfig): void {
    // Logo FONGIP en haut
    // Titre centré
    // Informations projet
    // Date
    // Footer BP Design Pro
  }

  private static addSection(doc: jsPDF, section: ExportSection, styles: any): void {
    // Titre de section avec couleur primaire
    // Contenu formaté selon le type
    // Images si présentes
  }

  private static addFongipFooter(doc: jsPDF, pageNum: number, totalPages: number): void {
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text(
      `Page ${pageNum} / ${totalPages} - ${config.metadata.title}`,
      105,
      285,
      { align: 'center' }
    )
  }
}
```

---

## 📦 PACKAGES NÉCESSAIRES

```json
{
  "dependencies": {
    "jspdf": "^2.5.1",
    "jspdf-autotable": "^3.8.2",
    "html2canvas": "^1.4.1",
    "react-dropzone": "^14.2.3",
    "react-hot-toast": "^2.4.1",
    "react-beautiful-dnd": "^13.1.1"
  }
}
```

---

## 🎯 PLAN D'IMPLÉMENTATION

### Semaine 1: Corrections & Export Analyse
1. ✅ Corriger bugs sauvegarde sections
2. ✅ Implémenter callback "Utiliser ce contenu"
3. ✅ Créer `AnalysisExportService`
4. ✅ Implémenter export PDF note de crédit

### Semaine 2: Onglet Export - Base
1. ✅ Créer types `export.ts`
2. ✅ Créer `ExportService`
3. ✅ Créer page `/projects/[id]/export`
4. ✅ Implémenter `ExportSidebar`
5. ✅ Implémenter `ExportPreview`

### Semaine 3: Templates & Images
1. ✅ Créer template de base
2. ✅ Créer template FONGIP
3. ✅ Créer template FAISE
4. ✅ Créer template Banque
5. ✅ Implémenter `ImageUploader`
6. ✅ Intégration Firebase Storage pour images

### Semaine 4: Finalisation & Tests
1. ✅ Éditeur inline sections
2. ✅ Génération PDF finale
3. ✅ Tests avec vrais business plans
4. ✅ Optimisations performance
5. ✅ Documentation utilisateur

---

## 🔧 EXEMPLE D'UTILISATION

```typescript
// 1. Utilisateur va dans l'onglet Export
// 2. Système charge automatiquement toutes les sections complétées
const config = await ExportService.createExportConfig(project)

// 3. Utilisateur choisit template FONGIP
setSelectedTemplate(TEMPLATES.fongip)

// 4. Utilisateur ajoute logo
await handleAddImage({
  type: 'logo',
  position: 'cover',
  file: logoFile
})

// 5. Utilisateur édite une section
await handleEditSection('market', newContent)

// 6. Utilisateur exporte en PDF
const pdfBlob = await ExportService.generatePDF(finalConfig)
downloadPDF(pdfBlob, `BP-${project.basicInfo.name}.pdf`)
```

---

## ✨ FEATURES AVANCÉES (Phase 2)

1. **Collaboration temps réel**
   - Plusieurs utilisateurs éditent le même export
   - Firestore real-time sync

2. **Versions**
   - Historique des exports
   - Restauration versions précédentes

3. **Templates personnalisés admin**
   - Interface admin pour créer nouveaux templates
   - Stockage dans Firestore

4. **Export Word (.docx)**
   - Utiliser `docx` library
   - Format éditable post-export

5. **Prévisualisation interactive**
   - Zoom, navigation sections
   - Mode plein écran

---

## 🎨 DESIGN SYSTEM

### Couleurs par institution
- **FONGIP**: Bleu #1e3a8a, Vert #10b981
- **FAISE**: Orange #f97316, Bleu #3b82f6
- **Banques**: Vert foncé #065f46, Or #fbbf24
- **Custom**: Choix libre

### Polices
- Titres: Montserrat Bold
- Corps: Inter Regular
- Tableaux: Roboto Mono

### Structure PDF Standard
1. Page de couverture (logo, titre, date)
2. Table des matières automatique
3. Résumé exécutif (1-2 pages)
4. Sections détaillées
5. Annexes (documents, CV, etc.)
6. Footer avec branding BP Design Pro

---

## 📊 MÉTRIQUES DE SUCCÈS

- ✅ Export PDF analyse financière < 3 secondes
- ✅ Toutes les sections sauvegardent correctement
- ✅ "Utiliser ce contenu" fonctionne à 100%
- ✅ Export BP complet < 10 secondes
- ✅ Qualité PDF: 300 DPI minimum
- ✅ Templates conformes aux exigences institutions
- ✅ Support images jusqu'à 5MB par image

---

**Prêt à implémenter ?** 🚀
