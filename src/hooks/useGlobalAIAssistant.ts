'use client'

import { useState, useEffect } from 'react'
import { Project } from '@/types/project'

interface UseGlobalAIAssistantProps {
  project: Project | null
  currentSection?: string
  userId?: string
}

export function useGlobalAIAssistant({ project, currentSection, userId }: UseGlobalAIAssistantProps) {
  const [showAIAssistant, setShowAIAssistant] = useState(false)

  useEffect(() => {
    const handleOpenAIAssistant = () => {
      if (project) {
        setShowAIAssistant(true)
      }
    }

    window.addEventListener('openAIAssistant', handleOpenAIAssistant)
    
    return () => {
      window.removeEventListener('openAIAssistant', handleOpenAIAssistant)
    }
  }, [project])

  return {
    showAIAssistant,
    setShowAIAssistant
  }
}
