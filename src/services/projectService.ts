import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  DocumentData,
  QuerySnapshot,
  Timestamp
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Project, ProjectBasicInfo, ProjectStatus, CompanyIdentification } from '@/types/project'

export class ProjectService {
  private collectionName = 'projects'

  // Créer un nouveau projet
  async createProject(
    ownerId: string,
    basicInfo: ProjectBasicInfo,
    organizationId?: string,
    companyIdentification?: CompanyIdentification
  ): Promise<string> {
    const projectData: Record<string, unknown> = {
      ownerId,
      basicInfo,
      sections: {},
      status: ProjectStatus.DRAFT,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      collaborators: []
    }

    // Ajouter organizationId seulement s'il est défini
    if (organizationId) {
      projectData.organizationId = organizationId
    }

    // Ajouter la fiche d'identification si fournie
    if (companyIdentification) {
      (projectData.sections as Record<string, unknown>).identification = {
        ...companyIdentification,
        // Convertir les dates en Timestamp pour Firestore
        dates: {
          ...companyIdentification.dates,
          creation: companyIdentification.dates.creation ? Timestamp.fromDate(companyIdentification.dates.creation) : null,
          registrationRC: companyIdentification.dates.registrationRC ? Timestamp.fromDate(companyIdentification.dates.registrationRC) : null,
          debutActivite: companyIdentification.dates.debutActivite ? Timestamp.fromDate(companyIdentification.dates.debutActivite) : null
        }
      }
    }

    const docRef = await addDoc(collection(db, this.collectionName), projectData)
    return docRef.id
  }

  // Récupérer tous les projets d'un utilisateur
  async getUserProjects(userId: string): Promise<Project[]> {
    const q = query(
      collection(db, this.collectionName),
      where('ownerId', '==', userId),
      orderBy('updatedAt', 'desc')
    )

    const querySnapshot = await getDocs(q)
    return this.mapQuerySnapshotToProjects(querySnapshot)
  }

  // Récupérer les projets actifs
  async getActiveProjects(userId: string): Promise<Project[]> {
    const q = query(
      collection(db, this.collectionName),
      where('ownerId', '==', userId),
      where('status', 'in', [ProjectStatus.DRAFT, ProjectStatus.IN_PROGRESS, ProjectStatus.REVIEW]),
      orderBy('updatedAt', 'desc')
    )

    const querySnapshot = await getDocs(q)
    return this.mapQuerySnapshotToProjects(querySnapshot)
  }

  // Récupérer les projets archivés
  async getArchivedProjects(userId: string): Promise<Project[]> {
    const q = query(
      collection(db, this.collectionName),
      where('ownerId', '==', userId),
      where('status', '==', ProjectStatus.ARCHIVED),
      orderBy('updatedAt', 'desc')
    )

    const querySnapshot = await getDocs(q)
    return this.mapQuerySnapshotToProjects(querySnapshot)
  }

  // Récupérer les projets récents
  async getRecentProjects(userId: string, limitCount: number = 5): Promise<Project[]> {
    const q = query(
      collection(db, this.collectionName),
      where('ownerId', '==', userId),
      where('status', '!=', ProjectStatus.ARCHIVED),
      orderBy('updatedAt', 'desc'),
      limit(limitCount)
    )

    const querySnapshot = await getDocs(q)
    return this.mapQuerySnapshotToProjects(querySnapshot)
  }

  // Récupérer un projet par ID
  async getProjectById(projectId: string, userId: string): Promise<Project | null> {
    const docRef = doc(db, this.collectionName, projectId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const data = docSnap.data()
      const project = {
        id: docSnap.id,
        ...data,
        // Convertir les Timestamps en Date pour l'interface
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        basicInfo: {
          ...data.basicInfo,
          timeline: {
            ...data.basicInfo?.timeline,
            startDate: data.basicInfo?.timeline?.startDate?.toDate() || new Date()
          }
        }
      } as Project

      // Vérifier que l'utilisateur a accès au projet
      if (project.ownerId === userId || project.collaborators?.includes(userId)) {
        return project
      }
    }

    return null
  }

  // Mettre à jour un projet
  async updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
    const docRef = doc(db, this.collectionName, projectId)
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    })
  }

  // Mettre à jour les informations de base d'un projet
  async updateProjectBasicInfo(projectId: string, userId: string, basicInfo: ProjectBasicInfo): Promise<void> {
    // Vérifier d'abord que l'utilisateur a accès au projet
    const project = await this.getProjectById(projectId, userId)
    if (!project) {
      throw new Error('Projet introuvable ou accès non autorisé')
    }

    const docRef = doc(db, this.collectionName, projectId)
    await updateDoc(docRef, {
      basicInfo: {
        ...basicInfo,
        timeline: {
          ...basicInfo.timeline,
          startDate: Timestamp.fromDate(new Date(basicInfo.timeline.startDate))
        }
      },
      updatedAt: Timestamp.now()
    })
  }

  // Mettre à jour le statut d'un projet
  async updateProjectStatus(projectId: string, status: ProjectStatus): Promise<void> {
    const docRef = doc(db, this.collectionName, projectId)
    await updateDoc(docRef, {
      status,
      updatedAt: Timestamp.now()
    })
  }

  // Archiver un projet
  async archiveProject(projectId: string): Promise<void> {
    await this.updateProjectStatus(projectId, ProjectStatus.ARCHIVED)
  }

  // Restaurer un projet archivé
  async unarchiveProject(projectId: string): Promise<void> {
    await this.updateProjectStatus(projectId, ProjectStatus.DRAFT)
  }

  // Supprimer un projet
  async deleteProject(projectId: string): Promise<void> {
    const docRef = doc(db, this.collectionName, projectId)
    await deleteDoc(docRef)
  }

  // Dupliquer un projet
  async duplicateProject(projectId: string, userId: string, newName: string): Promise<string> {
    const originalProject = await this.getProjectById(projectId, userId)

    if (!originalProject) {
      throw new Error('Projet introuvable')
    }

    const duplicatedProject: Omit<Project, 'id'> = {
      ...originalProject,
      basicInfo: {
        ...originalProject.basicInfo,
        name: newName
      },
      status: ProjectStatus.DRAFT,
      createdAt: Timestamp.now().toDate(),
      updatedAt: Timestamp.now().toDate(),
      collaborators: []
    }

    const docRef = await addDoc(collection(db, this.collectionName), duplicatedProject)
    return docRef.id
  }

  // Ajouter un collaborateur
  async addCollaborator(projectId: string, collaboratorId: string): Promise<void> {
    const project = await this.getProjectById(projectId, collaboratorId)
    if (!project) throw new Error('Projet introuvable')

    const collaborators = project.collaborators || []
    if (!collaborators.includes(collaboratorId)) {
      collaborators.push(collaboratorId)
      await this.updateProject(projectId, { collaborators })
    }
  }

  // Supprimer un collaborateur
  async removeCollaborator(projectId: string, collaboratorId: string): Promise<void> {
    const docRef = doc(db, this.collectionName, projectId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const project = docSnap.data() as Project
      const collaborators = project.collaborators?.filter(id => id !== collaboratorId) || []
      await updateDoc(docRef, { collaborators, updatedAt: Timestamp.now() })
    }
  }

  // Rechercher des projets
  async searchProjects(userId: string, searchTerm: string): Promise<Project[]> {
    // Note: Firestore ne supporte pas la recherche full-text
    // Pour une vraie recherche, utiliser Algolia ou recherche côté client
    const userProjects = await this.getUserProjects(userId)

    const searchLower = searchTerm.toLowerCase()
    return userProjects.filter(project =>
      project.basicInfo.name.toLowerCase().includes(searchLower) ||
      project.basicInfo.description.toLowerCase().includes(searchLower)
    )
  }

  // Convertir QuerySnapshot en tableau de projets
  private mapQuerySnapshotToProjects(querySnapshot: QuerySnapshot<DocumentData>): Project[] {
    return querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        // Convertir les Timestamps en Date pour l'interface
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        basicInfo: {
          ...data.basicInfo,
          timeline: {
            ...data.basicInfo?.timeline,
            startDate: data.basicInfo?.timeline?.startDate?.toDate() || new Date()
          }
        }
      }
    }) as Project[]
  }

  // Sauvegarder les données financières (clé alignée sur getFinancialData)
  async updateFinancialData(projectId: string, userId: string, financialData: Record<string, unknown>): Promise<void> {
    // Vérifier d'abord que l'utilisateur a accès au projet
    const project = await this.getProjectById(projectId, userId)
    if (!project) {
      throw new Error('Projet introuvable ou accès non autorisé')
    }

    const docRef = doc(db, this.collectionName, projectId)
    await updateDoc(docRef, {
      'sections.financialData': financialData,
      updatedAt: Timestamp.now()
    })
  }

  // Récupérer les données financières
  async getFinancialData(projectId: string, userId: string): Promise<Record<string, unknown> | null> {
    const project = await this.getProjectById(projectId, userId)
    if (!project) {
      throw new Error('Projet introuvable ou accès non autorisé')
    }

    return (project.sections?.financialData as unknown as Record<string, unknown>) || null
  }

  // Sauvegarder une section spécifique du projet
  async updateProjectSection(projectId: string, userId: string, sectionName: string, sectionData: Record<string, unknown>): Promise<void> {
    // Vérifier d'abord que l'utilisateur a accès au projet
    const project = await this.getProjectById(projectId, userId)
    if (!project) {
      throw new Error('Projet introuvable ou accès non autorisé')
    }

    const docRef = doc(db, this.collectionName, projectId)
    await updateDoc(docRef, {
      [`sections.${sectionName}`]: sectionData,
      updatedAt: Timestamp.now()
    })
  }

  // Récupérer une section spécifique du projet
  async getProjectSection(projectId: string, userId: string, sectionName: string): Promise<Record<string, unknown> | null> {
    const project = await this.getProjectById(projectId, userId)
    if (!project) {
      throw new Error('Projet introuvable ou accès non autorisé')
    }

    return (project.sections as Record<string, unknown> | undefined)?.[sectionName] as Record<string, unknown> || null
  }
}

// Instance singleton
export const projectService = new ProjectService()

// ===== ADD-ONLY: seedMissingSections (marketing, hr) =====
import { doc as _doc, getDoc as _getDoc, setDoc as _setDoc, serverTimestamp as _serverTimestamp } from 'firebase/firestore'

/**
 * Vérifie et crée les sections manquantes (marketing, hr)
 */
export async function seedMissingSections(userId: string, projectId: string): Promise<void> {
  const sections = ['marketing', 'hr']
  for (const section of sections) {
    try {
      const ref = _doc(db, `users/${userId}/projects/${projectId}/sections/${section}`)
      const snap = await _getDoc(ref)
      if (snap.exists()) {
        console.log(`⚠️ Section ${section} existait déjà`)
        continue
      }
      let data: any = { ownerId: userId, dateCreation: _serverTimestamp() }
      if (section === 'marketing') {
        data = {
          ...data,
          promotion: {
            marketingChannels: [],
            targetCustomers: [],
            advertisingBudget: 0,
          },
        }
      } else if (section === 'hr') {
        data = {
          ...data,
          organization: {},
          managementTeam: [],
          staffingPlan: [],
        }
      }
      await _setDoc(ref, data)
      console.log(`✅ Section ${section} créée`)
    } catch (err) {
      console.error(`❌ Erreur création section ${section}:`, err)
    }
  }
}