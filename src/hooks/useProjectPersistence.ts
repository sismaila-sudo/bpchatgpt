import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { projectService } from '@/services/projectService'

export type PersistenceStatus = 'saved' | 'saving' | 'unsaved' | 'error'

export interface UsePersistenceOptions {
  autoSaveDelay?: number // Délai en ms (défaut: 2000)
  useLocalStorage?: boolean // Backup localStorage (défaut: true)
}

/**
 * Hook personnalisé pour la persistance automatique des données de projet
 * Sauvegarde automatiquement dans Firebase avec fallback localStorage
 */
export function useProjectPersistence<T>(
  projectId: string,
  sectionName: string,
  initialData: T,
  options: UsePersistenceOptions = {}
) {
  const { user } = useAuth()
  const { autoSaveDelay = 2000, useLocalStorage = true } = options

  const [data, setData] = useState<T>(initialData)
  const [status, setStatus] = useState<PersistenceStatus>('saved')
  const [isLoaded, setIsLoaded] = useState(false)

  // Clé pour localStorage
  const localStorageKey = `project_${projectId}_${sectionName}`

  // Fonction de sauvegarde Firebase
  const saveToFirebase = useCallback(async (dataToSave: T) => {
    if (!user) return

    try {
      setStatus('saving')
      await projectService.updateProjectSection(projectId, user.uid, sectionName, dataToSave as unknown as Record<string, unknown>)

      // Backup localStorage
      if (useLocalStorage) {
        localStorage.setItem(localStorageKey, JSON.stringify(dataToSave))
      }

      setStatus('saved')
    } catch (error) {
      console.error(`Erreur sauvegarde ${sectionName}:`, error)
      setStatus('error')
    }
  }, [projectId, user, sectionName, localStorageKey, useLocalStorage])

  // Fonction de chargement des données
  const loadData = useCallback(async () => {
    if (!user) return

    try {
      // Charger depuis Firebase
      const firebaseData = await projectService.getProjectSection(projectId, user.uid, sectionName)

      if (firebaseData) {
        setData(firebaseData as unknown as T)
        setStatus('saved')
        setIsLoaded(true)
        return
      }

      // Fallback localStorage
      if (useLocalStorage) {
        const savedData = localStorage.getItem(localStorageKey)
        if (savedData) {
          const parsedData = JSON.parse(savedData)
          setData(parsedData)
          setStatus('unsaved') // Indique qu'il faut sync avec Firebase
          setIsLoaded(true)
          return
        }
      }

      // Aucune donnée trouvée
      setData(initialData)
      setStatus('saved')
      setIsLoaded(true)

    } catch (error) {
      console.error(`Erreur chargement ${sectionName}:`, error)

      // En cas d'erreur Firebase, essayer localStorage
      if (useLocalStorage) {
        try {
          const savedData = localStorage.getItem(localStorageKey)
          if (savedData) {
            const parsedData = JSON.parse(savedData)
            setData(parsedData)
            setStatus('error')
            setIsLoaded(true)
            return
          }
        } catch (localError) {
          console.error(`Erreur localStorage ${sectionName}:`, localError)
        }
      }

      setData(initialData)
      setStatus('error')
      setIsLoaded(true)
    }
  }, [projectId, user, sectionName, localStorageKey, useLocalStorage, initialData])

  // Chargement initial
  useEffect(() => {
    loadData()
  }, [loadData])

  // Auto-sauvegarde avec debounce
  useEffect(() => {
    if (!isLoaded) return // Ne pas sauvegarder avant le premier chargement

    const timer = setTimeout(() => {
      // Vérifier si les données ont changé
      const hasData = JSON.stringify(data) !== JSON.stringify(initialData)

      if (hasData && status !== 'saving') {
        setStatus('unsaved')
        saveToFirebase(data)
      }
    }, autoSaveDelay)

    return () => clearTimeout(timer)
  }, [data, isLoaded, status, autoSaveDelay, saveToFirebase, initialData])

  // Fonction pour forcer une sauvegarde manuelle
  const forceSave = useCallback(() => {
    if (user && isLoaded) {
      saveToFirebase(data)
    }
  }, [user, isLoaded, saveToFirebase, data])

  // Fonction pour forcer un rechargement
  const forceReload = useCallback(() => {
    setIsLoaded(false)
    loadData()
  }, [loadData])

  return {
    data,
    setData,
    status,
    isLoaded,
    forceSave,
    forceReload
  }
}