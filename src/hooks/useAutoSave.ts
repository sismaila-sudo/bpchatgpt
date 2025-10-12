import { useEffect, useRef } from 'react'

interface UseAutoSaveOptions {
  delay?: number
  onSave: (data: any) => Promise<void>
  enabled?: boolean
}

export function useAutoSave<T>(
  data: T,
  options: UseAutoSaveOptions
) {
  const { delay = 2000, onSave, enabled = true } = options
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const lastSavedRef = useRef<T>(data)

  useEffect(() => {
    if (!enabled) return

    // Vérifier si les données ont changé
    const hasChanged = JSON.stringify(data) !== JSON.stringify(lastSavedRef.current)

    if (hasChanged) {
      // Annuler la sauvegarde précédente
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Programmer une nouvelle sauvegarde
      timeoutRef.current = setTimeout(async () => {
        try {
          await onSave(data)
          lastSavedRef.current = data
        } catch (error) {
          console.error('Erreur lors de la sauvegarde automatique:', error)
        }
      }, delay)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [data, delay, onSave, enabled])

  // Forcer la sauvegarde immédiate
  const forceSave = async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    try {
      await onSave(data)
      lastSavedRef.current = data
    } catch (error) {
      console.error('Erreur lors de la sauvegarde forcée:', error)
      throw error
    }
  }

  return { forceSave }
}