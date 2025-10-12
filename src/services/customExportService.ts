/**
 * Service de gestion des exports personnalisés (Phase 10)
 *
 * Permet de sauvegarder, récupérer, mettre à jour et supprimer
 * les versions éditées du business plan
 */

import { db } from '@/lib/firebase'
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  increment,
  writeBatch
} from 'firebase/firestore'
import {
  CustomExport,
  CreateCustomExportInput,
  UpdateCustomExportInput,
  CustomExportFilters,
  CustomExportStats,
  ExportHistoryAction
} from '@/types/customExport'

export class CustomExportService {
  /**
   * Génère un ID unique pour l'export
   */
  private static generateExportId(): string {
    return `export-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Crée un nouvel export personnalisé
   */
  static async createCustomExport(input: CreateCustomExportInput): Promise<CustomExport> {
    const exportId = this.generateExportId()
    const now = Timestamp.now()

    // Détecter si éditions
    const hasEdits = input.originalHTML !== input.editedHTML

    const customExport: CustomExport = {
      id: exportId,
      projectId: input.projectId,
      userId: input.userId,
      name: input.name,
      description: input.description,
      template: input.template,
      colorScheme: input.colorScheme,
      originalHTML: input.originalHTML,
      editedHTML: input.editedHTML,
      hasEdits,
      projectSnapshot: input.projectSnapshot,
      isDefault: false, // Premier export n'est pas default
      isPinned: false,
      isArchived: false,
      isPublic: false,
      viewCount: 0,
      downloadCount: 0,
      printCount: 0,
      createdAt: now,
      updatedAt: now,
      tags: input.tags || [],
      version: 1
    }

    // Sauvegarder dans Firestore
    const exportRef = doc(
      db,
      'users',
      input.userId,
      'projects',
      input.projectId,
      'customExports',
      exportId
    )

    await setDoc(exportRef, customExport)

    // Enregistrer action historique
    await this.recordAction(exportId, input.userId, input.projectId, 'created')

    return customExport
  }

  /**
   * Récupère un export par ID
   */
  static async getCustomExport(
    userId: string,
    projectId: string,
    exportId: string
  ): Promise<CustomExport | null> {
    const exportRef = doc(
      db,
      'users',
      userId,
      'projects',
      projectId,
      'customExports',
      exportId
    )

    const snapshot = await getDoc(exportRef)

    if (!snapshot.exists()) {
      return null
    }

    // Incrémenter viewCount
    await updateDoc(exportRef, {
      viewCount: increment(1),
      lastViewedAt: Timestamp.now()
    })

    // Enregistrer action
    await this.recordAction(exportId, userId, projectId, 'viewed')

    return snapshot.data() as CustomExport
  }

  /**
   * Liste tous les exports d'un projet
   */
  static async listCustomExports(
    userId: string,
    projectId: string,
    filters?: CustomExportFilters
  ): Promise<CustomExport[]> {
    const exportsRef = collection(
      db,
      'users',
      userId,
      'projects',
      projectId,
      'customExports'
    )

    let q = query(exportsRef)

    // Filtres
    if (filters) {
      if (filters.template) {
        q = query(q, where('template', '==', filters.template))
      }
      if (filters.isDefault !== undefined) {
        q = query(q, where('isDefault', '==', filters.isDefault))
      }
      if (filters.isPinned !== undefined) {
        q = query(q, where('isPinned', '==', filters.isPinned))
      }
      if (filters.isArchived !== undefined) {
        q = query(q, where('isArchived', '==', filters.isArchived))
      }

      // Tri
      const sortField = filters.sortBy || 'updatedAt'
      const sortDirection = filters.sortOrder || 'desc'
      q = query(q, orderBy(sortField, sortDirection))
    } else {
      // Tri par défaut
      q = query(q, orderBy('updatedAt', 'desc'))
    }

    const snapshot = await getDocs(q)
    const exports = snapshot.docs.map(doc => doc.data() as CustomExport)

    // Filtrage client-side pour recherche texte
    if (filters?.searchQuery) {
      const searchLower = filters.searchQuery.toLowerCase()
      return exports.filter(
        exp =>
          exp.name.toLowerCase().includes(searchLower) ||
          exp.description?.toLowerCase().includes(searchLower)
      )
    }

    return exports
  }

  /**
   * Met à jour un export
   */
  static async updateCustomExport(
    userId: string,
    projectId: string,
    exportId: string,
    updates: UpdateCustomExportInput
  ): Promise<void> {
    const exportRef = doc(
      db,
      'users',
      userId,
      'projects',
      projectId,
      'customExports',
      exportId
    )

    // Si mise à jour HTML, incrémenter version et recalculer hasEdits
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now()
    }

    if (updates.editedHTML) {
      const currentExport = await this.getCustomExport(userId, projectId, exportId)
      if (currentExport) {
        updateData.hasEdits = updates.editedHTML !== currentExport.originalHTML
        updateData.version = increment(1)
      }
    }

    // Si définir comme default, retirer default des autres
    if (updates.isDefault === true) {
      await this.unsetAllDefaults(userId, projectId, exportId)
    }

    await updateDoc(exportRef, updateData)

    // Enregistrer action
    await this.recordAction(exportId, userId, projectId, 'updated', {
      changedFields: Object.keys(updates)
    })
  }

  /**
   * Supprime un export
   */
  static async deleteCustomExport(
    userId: string,
    projectId: string,
    exportId: string
  ): Promise<void> {
    const exportRef = doc(
      db,
      'users',
      userId,
      'projects',
      projectId,
      'customExports',
      exportId
    )

    await deleteDoc(exportRef)

    // Enregistrer action
    await this.recordAction(exportId, userId, projectId, 'deleted')
  }

  /**
   * Récupère l'export par défaut
   */
  static async getDefaultExport(
    userId: string,
    projectId: string
  ): Promise<CustomExport | null> {
    const exportsRef = collection(
      db,
      'users',
      userId,
      'projects',
      projectId,
      'customExports'
    )

    const q = query(
      exportsRef,
      where('isDefault', '==', true),
      limit(1)
    )

    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      return null
    }

    return snapshot.docs[0].data() as CustomExport
  }

  /**
   * Définit un export comme default (et retire default des autres)
   */
  static async setDefaultExport(
    userId: string,
    projectId: string,
    exportId: string
  ): Promise<void> {
    await this.unsetAllDefaults(userId, projectId, exportId)

    const exportRef = doc(
      db,
      'users',
      userId,
      'projects',
      projectId,
      'customExports',
      exportId
    )

    await updateDoc(exportRef, {
      isDefault: true,
      updatedAt: Timestamp.now()
    })
  }

  /**
   * Retire le statut default de tous les exports sauf celui spécifié
   */
  private static async unsetAllDefaults(
    userId: string,
    projectId: string,
    exceptExportId?: string
  ): Promise<void> {
    const exportsRef = collection(
      db,
      'users',
      userId,
      'projects',
      projectId,
      'customExports'
    )

    const q = query(exportsRef, where('isDefault', '==', true))
    const snapshot = await getDocs(q)

    const batch = writeBatch(db)

    snapshot.docs.forEach(doc => {
      if (!exceptExportId || doc.id !== exceptExportId) {
        batch.update(doc.ref, { isDefault: false })
      }
    })

    await batch.commit()
  }

  /**
   * Archive/désarchive un export
   */
  static async toggleArchive(
    userId: string,
    projectId: string,
    exportId: string,
    archived: boolean
  ): Promise<void> {
    const exportRef = doc(
      db,
      'users',
      userId,
      'projects',
      projectId,
      'customExports',
      exportId
    )

    await updateDoc(exportRef, {
      isArchived: archived,
      updatedAt: Timestamp.now()
    })

    await this.recordAction(exportId, userId, projectId, 'archived')
  }

  /**
   * Épingle/désépingle un export
   */
  static async togglePin(
    userId: string,
    projectId: string,
    exportId: string,
    pinned: boolean
  ): Promise<void> {
    const exportRef = doc(
      db,
      'users',
      userId,
      'projects',
      projectId,
      'customExports',
      exportId
    )

    await updateDoc(exportRef, {
      isPinned: pinned,
      updatedAt: Timestamp.now()
    })
  }

  /**
   * Incrémente le compteur de téléchargements
   */
  static async incrementDownloadCount(
    userId: string,
    projectId: string,
    exportId: string,
    format: 'html' | 'pdf' = 'html'
  ): Promise<void> {
    const exportRef = doc(
      db,
      'users',
      userId,
      'projects',
      projectId,
      'customExports',
      exportId
    )

    await updateDoc(exportRef, {
      downloadCount: increment(1)
    })

    await this.recordAction(exportId, userId, projectId, 'downloaded', {
      downloadFormat: format
    })
  }

  /**
   * Incrémente le compteur d'impressions
   */
  static async incrementPrintCount(
    userId: string,
    projectId: string,
    exportId: string
  ): Promise<void> {
    const exportRef = doc(
      db,
      'users',
      userId,
      'projects',
      projectId,
      'customExports',
      exportId
    )

    await updateDoc(exportRef, {
      printCount: increment(1)
    })

    await this.recordAction(exportId, userId, projectId, 'printed')
  }

  /**
   * Récupère les statistiques des exports utilisateur
   */
  static async getExportStats(
    userId: string,
    projectId: string
  ): Promise<CustomExportStats> {
    const exports = await this.listCustomExports(userId, projectId)

    const templateBreakdown = {
      fongip: 0,
      banque: 0,
      pitch: 0,
      complet: 0,
      custom: 0
    }

    let totalViews = 0
    let totalDownloads = 0
    let totalPrints = 0
    let totalEdited = 0

    exports.forEach(exp => {
      templateBreakdown[exp.template]++
      totalViews += exp.viewCount
      totalDownloads += exp.downloadCount
      totalPrints += exp.printCount
      if (exp.hasEdits) totalEdited++
    })

    // 5 derniers
    const recentExports = [...exports]
      .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
      .slice(0, 5)

    // 5 plus vus
    const mostViewed = [...exports]
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 5)

    return {
      totalExports: exports.length,
      totalEdited,
      totalViews,
      totalDownloads,
      totalPrints,
      templateBreakdown,
      recentExports,
      mostViewed
    }
  }

  /**
   * Duplique un export (créer copie)
   */
  static async duplicateExport(
    userId: string,
    projectId: string,
    exportId: string,
    newName?: string
  ): Promise<CustomExport> {
    const originalExport = await this.getCustomExport(userId, projectId, exportId)

    if (!originalExport) {
      throw new Error('Export non trouvé')
    }

    const duplicatedExport = await this.createCustomExport({
      projectId,
      userId,
      name: newName || `${originalExport.name} (Copie)`,
      description: originalExport.description,
      template: originalExport.template,
      colorScheme: originalExport.colorScheme,
      originalHTML: originalExport.originalHTML,
      editedHTML: originalExport.editedHTML,
      projectSnapshot: originalExport.projectSnapshot,
      tags: originalExport.tags
    })

    return duplicatedExport
  }

  /**
   * Enregistre une action dans l'historique
   */
  private static async recordAction(
    exportId: string,
    userId: string,
    projectId: string,
    action: ExportHistoryAction['action'],
    metadata?: ExportHistoryAction['metadata']
  ): Promise<void> {
    const actionId = `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const historyAction: ExportHistoryAction = {
      id: actionId,
      exportId,
      action,
      timestamp: Timestamp.now(),
      metadata
    }

    const actionRef = doc(
      db,
      'users',
      userId,
      'projects',
      projectId,
      'customExports',
      exportId,
      'history',
      actionId
    )

    await setDoc(actionRef, historyAction)
  }

  /**
   * Récupère l'historique d'actions d'un export
   */
  static async getExportHistory(
    userId: string,
    projectId: string,
    exportId: string,
    limitCount: number = 20
  ): Promise<ExportHistoryAction[]> {
    const historyRef = collection(
      db,
      'users',
      userId,
      'projects',
      projectId,
      'customExports',
      exportId,
      'history'
    )

    const q = query(historyRef, orderBy('timestamp', 'desc'), limit(limitCount))
    const snapshot = await getDocs(q)

    return snapshot.docs.map(doc => doc.data() as ExportHistoryAction)
  }
}
