'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

export default function DebugStructurePage() {
  const { user } = useAuth()
  const [output, setOutput] = useState<string>('Chargement...')

  useEffect(() => {
    if (!user) {
      setOutput('⚠️ Vous devez être connecté pour utiliser cette page de debug')
      return
    }

    async function inspectProject() {
      try {
        const projectId = 'JGuSemkoWm1Ax5kAdtx9'
        const projectRef = doc(db, 'projects', projectId)
        const projectSnap = await getDoc(projectRef)

        if (!projectSnap.exists()) {
          setOutput('❌ Project not found')
          return
        }

        const project = projectSnap.data()

        let result = '=== PROJECT STRUCTURE ===\n\n'
        result += '📦 Top-level keys: ' + Object.keys(project).join(', ') + '\n\n'

        result += '=== BASIC INFO ===\n'
        result += JSON.stringify(project.basicInfo, null, 2) + '\n\n'

        result += '=== SECTIONS ===\n'
        if (project.sections) {
          result += 'Available sections: ' + Object.keys(project.sections).join(', ') + '\n\n'

          // Market Study
          if (project.sections.marketStudy) {
            result += '--- Market Study ---\n'
            result += 'Keys: ' + Object.keys(project.sections.marketStudy).join(', ') + '\n'
            const marketStr = JSON.stringify(project.sections.marketStudy, null, 2)
            result += 'Full data:\n' + marketStr.substring(0, 2000) + '\n...\n\n'

            console.log('📊 MARKET STUDY COMPLET:', project.sections.marketStudy)
          }

          // SWOT Analysis
          if (project.sections.swotAnalysis) {
            result += '--- SWOT Analysis ---\n'
            result += 'Keys: ' + Object.keys(project.sections.swotAnalysis).join(', ') + '\n'
            const swotStr = JSON.stringify(project.sections.swotAnalysis, null, 2)
            result += 'Full data:\n' + swotStr.substring(0, 2000) + '\n...\n\n'

            console.log('📊 SWOT ANALYSIS COMPLET:', project.sections.swotAnalysis)
          }

          // Marketing Plan
          if (project.sections.marketingPlan) {
            result += '--- Marketing Plan ---\n'
            result += 'Keys: ' + Object.keys(project.sections.marketingPlan).join(', ') + '\n'
            const marketingStr = JSON.stringify(project.sections.marketingPlan, null, 2)
            result += 'Full data:\n' + marketingStr.substring(0, 2000) + '\n...\n\n'

            console.log('📊 MARKETING PLAN COMPLET:', project.sections.marketingPlan)
          }

          // Human Resources
          if (project.sections.humanResources) {
            result += '--- Human Resources ---\n'
            result += 'Keys: ' + Object.keys(project.sections.humanResources).join(', ') + '\n'
            const hrStr = JSON.stringify(project.sections.humanResources, null, 2)
            result += 'Full data:\n' + hrStr.substring(0, 2000) + '\n...\n\n'

            console.log('📊 HUMAN RESOURCES COMPLET:', project.sections.humanResources)
          }

          // Financial Engine
          if (project.sections.financialEngine) {
            result += '--- Financial Engine ---\n'
            result += 'Keys: ' + Object.keys(project.sections.financialEngine).join(', ') + '\n'
            const finStr = JSON.stringify(project.sections.financialEngine, null, 2)
            result += 'Sample:\n' + finStr.substring(0, 1000) + '\n...\n\n'

            console.log('📊 FINANCIAL ENGINE COMPLET:', project.sections.financialEngine)
          }
        } else {
          result += '⚠️ Aucune section trouvée\n\n'
        }

        result += '=== BUSINESS PLAN ===\n'
        if (project.businessPlan) {
          result += 'Keys: ' + Object.keys(project.businessPlan).join(', ') + '\n'
          const bpStr = JSON.stringify(project.businessPlan, null, 2)
          result += 'Sample:\n' + bpStr.substring(0, 1000) + '\n...\n\n'

          console.log('📊 BUSINESS PLAN COMPLET:', project.businessPlan)
        } else {
          result += '⚠️ Pas de businessPlan\n\n'
        }

        result += '\n✅ TOUTES LES DONNÉES COMPLÈTES SONT DANS LA CONSOLE (F12)\n'
        result += 'Cherchez les logs avec 📊\n'

        setOutput(result)

        // Log complet dans la console
        console.log('========================================')
        console.log('📦 PROJET COMPLET:', project)
        console.log('========================================')

      } catch (error: any) {
        console.error('❌ Error:', error)
        setOutput('❌ Error: ' + error.message)
      }
    }

    inspectProject()
  }, [user])

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', fontSize: '12px' }}>
      <h1>🔍 Debug Project Structure</h1>
      <pre style={{
        background: '#1e1e1e',
        color: '#d4d4d4',
        padding: '20px',
        borderRadius: '8px',
        overflow: 'auto',
        maxHeight: '80vh'
      }}>
        {output}
      </pre>
    </div>
  )
}
