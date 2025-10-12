/**
 * Script d'upload de documents dans Pinecone
 *
 * Usage:
 * 1. Déposer vos PDFs/Word dans le dossier /knowledge-base
 * 2. Exécuter: npm run upload-docs
 *
 * Le script va automatiquement:
 * - Lire tous les fichiers PDF/Word
 * - Extraire le texte
 * - Découper en morceaux intelligents
 * - Générer les embeddings
 * - Uploader dans Pinecone
 */

import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import pdf from 'pdf-parse'
import mammoth from 'mammoth'
import { getRagServiceInstance, Document } from '../src/services/ragService'

// Charger .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

// Configuration
const KNOWLEDGE_BASE_DIR = path.join(process.cwd(), 'knowledge-base')
const CHUNK_SIZE = 2000 // Nombre de caractères par morceau
const CHUNK_OVERLAP = 200 // Chevauchement entre morceaux

interface DocumentMetadata {
  source: string
  title: string
  category: string
  year: number
  url?: string
  reliability: 'high' | 'medium' | 'low'
}

/**
 * Lire un fichier PDF
 */
async function readPDF(filePath: string): Promise<string> {
  const dataBuffer = fs.readFileSync(filePath)
  const data = await pdf(dataBuffer)
  return data.text
}

/**
 * Lire un fichier Word (.docx)
 */
async function readWord(filePath: string): Promise<string> {
  const result = await mammoth.extractRawText({ path: filePath })
  return result.value
}

/**
 * Découper le texte en morceaux intelligents
 */
function chunkText(text: string, chunkSize: number = CHUNK_SIZE, overlap: number = CHUNK_OVERLAP): string[] {
  const chunks: string[] = []
  let startIndex = 0

  while (startIndex < text.length) {
    const endIndex = Math.min(startIndex + chunkSize, text.length)
    const chunk = text.slice(startIndex, endIndex)

    // Nettoyer le chunk
    const cleanChunk = chunk
      .replace(/\s+/g, ' ') // Remplacer espaces multiples
      .replace(/\n{3,}/g, '\n\n') // Limiter sauts de ligne
      .trim()

    if (cleanChunk.length > 100) { // Ignorer chunks trop courts
      chunks.push(cleanChunk)
    }

    startIndex += chunkSize - overlap
  }

  return chunks
}

/**
 * Extraire métadonnées du nom de fichier
 * Format attendu: [Secteur]_[Titre]_[Année].pdf
 * Exemple: Agriculture_Rapport_ANSD_2024.pdf
 */
function extractMetadataFromFilename(filename: string): Partial<DocumentMetadata> {
  const parts = filename.replace(/\.(pdf|docx)$/i, '').split('_')

  return {
    category: parts[0]?.toLowerCase() || 'general',
    title: parts.slice(1, -1).join(' ') || filename,
    year: parseInt(parts[parts.length - 1]) || new Date().getFullYear(),
    source: 'Document uploadé',
    reliability: 'medium'
  }
}

/**
 * Uploader un document dans Pinecone
 */
async function uploadDocument(filePath: string, ragService: ReturnType<typeof getRagServiceInstance>): Promise<void> {
  const filename = path.basename(filePath)
  const ext = path.extname(filePath).toLowerCase()

  console.log(`\n📄 Traitement: ${filename}`)

  try {
    // 1. Lire le fichier
    let text: string
    if (ext === '.pdf') {
      console.log('  🔍 Extraction PDF...')
      text = await readPDF(filePath)
    } else if (ext === '.docx') {
      console.log('  🔍 Extraction Word...')
      text = await readWord(filePath)
    } else {
      console.log(`  ⚠️ Format non supporté: ${ext}`)
      return
    }

    console.log(`  ✅ Texte extrait: ${text.length} caractères`)

    // 2. Découper en morceaux
    console.log('  ✂️ Découpage en morceaux...')
    const chunks = chunkText(text)
    console.log(`  ✅ ${chunks.length} morceaux créés`)

    // 3. Extraire métadonnées
    const metadata = extractMetadataFromFilename(filename)

    // 4. Créer documents pour Pinecone
    const documents: Document[] = chunks.map((chunk, index) => ({
      id: `${filename.replace(/\.(pdf|docx)$/i, '')}-chunk-${index}`,
      text: chunk,
      metadata: {
        source: metadata.source || 'Document uploadé',
        title: `${metadata.title} (partie ${index + 1}/${chunks.length})`,
        category: metadata.category || 'general',
        year: metadata.year || new Date().getFullYear(),
        url: `file://${filename}`,
        reliability: metadata.reliability || 'medium',
        chunkIndex: index,
        totalChunks: chunks.length
      }
    }))

    // 5. Uploader dans Pinecone
    console.log('  ☁️ Upload vers Pinecone...')
    await ragService.addDocuments(documents)
    console.log(`  ✅ ${documents.length} morceaux uploadés dans Pinecone`)

  } catch (error) {
    console.error(`  ❌ Erreur: ${error}`)
  }
}

/**
 * Uploader tous les documents du dossier knowledge-base
 */
async function uploadAllDocuments(): Promise<void> {
  console.log('🚀 Démarrage upload documents vers Pinecone\n')
  console.log(`📂 Dossier: ${KNOWLEDGE_BASE_DIR}\n`)

  // Initialiser le service RAG avec les env vars chargées
  console.log('🔄 Initialisation du service RAG...')
  const ragService = getRagServiceInstance()
  await ragService.reinitialize()

  // Vérifier que le service RAG est disponible
  if (!ragService.isAvailable()) {
    console.error('❌ Service RAG non disponible. Vérifiez PINECONE_API_KEY dans .env.local')
    process.exit(1)
  }

  console.log('✅ Service RAG prêt\n')

  // Vérifier que le dossier existe
  if (!fs.existsSync(KNOWLEDGE_BASE_DIR)) {
    console.error(`❌ Dossier ${KNOWLEDGE_BASE_DIR} introuvable`)
    console.log('\nCréez le dossier et déposez-y vos documents PDF/Word')
    process.exit(1)
  }

  // Lister les fichiers
  const files = fs.readdirSync(KNOWLEDGE_BASE_DIR)
    .filter(f => /\.(pdf|docx)$/i.test(f))
    .map(f => path.join(KNOWLEDGE_BASE_DIR, f))

  if (files.length === 0) {
    console.log('⚠️ Aucun document PDF/Word trouvé dans le dossier')
    console.log('\nDéposez vos documents dans:', KNOWLEDGE_BASE_DIR)
    console.log('\nFormats supportés: .pdf, .docx')
    console.log('\nNommage recommandé: [Secteur]_[Titre]_[Année].pdf')
    console.log('Exemple: Agriculture_Rapport_ANSD_2024.pdf')
    process.exit(0)
  }

  console.log(`📚 ${files.length} document(s) trouvé(s)\n`)

  // Uploader chaque document
  for (const file of files) {
    await uploadDocument(file, ragService)
  }

  // Statistiques finales
  console.log('\n' + '='.repeat(60))
  console.log('✅ Upload terminé !')

  const stats = await ragService.getStats()
  console.log(`\n📊 Base de connaissances Pinecone:`)
  console.log(`   - Total vecteurs: ${stats.vectorCount}`)
  console.log(`   - Dimension: ${stats.dimension}`)
  console.log('='.repeat(60) + '\n')
}

// Exécution
uploadAllDocuments().catch(console.error)
