'use client'

// Force le rendu dynamique pour éviter DataCloneError
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { projectService } from '@/services/projectService'
import { Project } from '@/types/project'
import { HumanResources } from '@/types/businessPlan'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  PlusIcon,
  TrashIcon,
  UserGroupIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  ChartBarIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import ModernProjectLayout from '@/components/ModernProjectLayout'
import { LazyBusinessPlanAIAssistant as BusinessPlanAIAssistant } from '@/components/LazyComponents'

function deepMerge<T>(base: T, patch: any): T {
  if (patch == null || typeof patch !== 'object') return base
  const output: any = Array.isArray(base) ? [...(Array.isArray(patch) ? patch : base)] : { ...base }
  if (Array.isArray(base)) {
    return output as T
  }
  for (const key of Object.keys(patch)) {
    const b: any = (base as any)[key]
    const p: any = patch[key]
    if (p && typeof p === 'object' && !Array.isArray(p) && b && typeof b === 'object' && !Array.isArray(b)) {
      output[key] = deepMerge(b, p)
    } else {
      output[key] = p ?? b
    }
  }
  return output as T
}

function makeDefaultHR(projectId: string): HumanResources {
  return {
    id: projectId,
    projectId: projectId,
    organization: {
      orgChart: {
        levels: [],
        totalPositions: 0,
        reportingLines: []
      },
      governance: {
        board: [],
        committees: [],
        decisionMaking: '',
        meetingFrequency: ''
      },
      advisors: []
    },
    managementTeam: [],
    recruitmentPlan: {
      positions: [],
      timeline: [],
      budget: {
        total: 0,
        breakdown: {
          advertising: 0,
          agencies: 0,
          referrals: 0,
          events: 0,
          other: 0
        }
      }
    },
    hrPolicies: {
      compensation: {
        philosophy: '',
        structure: {
          base: '',
          variable: '',
          equity: ''
        },
        benchmarking: '',
        reviews: ''
      },
      benefits: {
        insurance: [],
        retirement: '',
        vacation: '',
        training: '',
        other: [],
        cost: 0
      },
      training: {
        onboarding: '',
        continuous: [],
        leadership: [],
        budget: 0,
        providers: []
      },
      performance: {
        system: '',
        frequency: '',
        criteria: [],
        consequences: {
          rewards: [],
          development: [],
          corrective: []
        }
      }
    },
    projections: {
      headcount: [],
      costs: [],
      productivity: {
        revenuePerEmployee: [],
        costPerEmployee: [],
        turnoverRate: 0,
        satisfactionScore: 0
      }
    },
    lastUpdated: new Date()
  }
}

export default function HumanResourcesPage() {
  const params = useParams()
  const { user } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAIAssistant, setShowAIAssistant] = useState(false)

  const projectId = params.id as string

  // État initial RH
  const [hrData, setHrData] = useState<HumanResources>(makeDefaultHR(projectId))

  useEffect(() => {
    if (user && projectId) {
      loadProject()
    }
  }, [user, projectId])

  // Écoute de l'événement pour ouvrir l'assistant IA depuis la sidebar
  useEffect(() => {
    const handleOpenAIAssistant = () => {
      setShowAIAssistant(true)
    }

    window.addEventListener('openAIAssistant', handleOpenAIAssistant)
    return () => {
      window.removeEventListener('openAIAssistant', handleOpenAIAssistant)
    }
  }, [])

  const loadProject = async () => {
    if (!user || !projectId) return

    setLoading(true)
    try {
      const projectData = await projectService.getProjectById(projectId, user.uid)
      if (projectData) {
        setProject(projectData)

        // Charger d'abord les données RH sauvegardées si elles existent
        try {
          const saved = await projectService.getProjectSection(projectId, user.uid, 'humanResources')
          if (saved) {
            setHrData(prev => deepMerge(makeDefaultHR(projectId), saved))
          } else if (projectData.businessPlan?.humanResources) {
            // Fallback vers ancien schéma
            setHrData(prev => deepMerge(makeDefaultHR(projectId), projectData.businessPlan!.humanResources))
          }
        } catch (e) {
          console.error('Erreur chargement section humanResources:', e)
          if (projectData.businessPlan?.humanResources) {
            setHrData(prev => deepMerge(makeDefaultHR(projectId), projectData.businessPlan!.humanResources))
          }
        }
      }
    } catch (err) {
      console.error('Erreur lors du chargement du projet:', err)
      toast.error('Erreur lors du chargement du projet')
    } finally {
      setLoading(false)
    }
  }

  const saveHRData = async () => {
    if (!user || !projectId) return

    setSaving(true)
    try {
      await projectService.updateProjectSection(
        projectId,
        user.uid,
        'humanResources',
        { ...hrData, lastUpdated: new Date() } as unknown as Record<string, unknown>
      )
      toast.success('Plan RH sauvegardé avec succès')
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleAIContentGenerated = async (content: string, section: string) => {
    // ✅ MODE COPIER-COLLER PUR : Pas d'intégration automatique
    // L'utilisateur copie manuellement le contenu généré depuis le modal IA

    console.info('[HR IA] Contenu généré (copier-coller manuel)', {
      section,
      contentLength: content?.length || 0,
      timestamp: new Date().toISOString()
    })

    // Note : Le contenu est affiché dans le modal BusinessPlanAIAssistant
    // L'utilisateur le copie et le colle où il le souhaite dans le formulaire
    // Aucune modification automatique des champs du formulaire
  }

  // Gestion des membres du conseil
  const addBoardMember = () => {
    setHrData(prev => ({
      ...prev,
      organization: {
        ...prev.organization,
        governance: {
          ...prev.organization.governance,
          board: [
            ...prev.organization.governance.board,
            {
              id: `board-${Date.now()}`,
              name: '',
              role: '',
              expertise: [],
              experience: '',
              equity: 0
            }
          ]
        }
      }
    }))
  }

  const removeBoardMember = (id: string) => {
    setHrData(prev => ({
      ...prev,
      organization: {
        ...prev.organization,
        governance: {
          ...prev.organization.governance,
          board: prev.organization.governance.board.filter(m => m.id !== id)
        }
      }
    }))
  }

  // Gestion des membres de l'équipe
  const addTeamMember = () => {
    setHrData(prev => ({
      ...prev,
      managementTeam: [
        ...prev.managementTeam,
        {
          id: `team-${Date.now()}`,
          name: '',
          position: '',
          department: '',
          education: '',
          experience: '',
          skills: [],
          responsibilities: [],
          kpis: [],
          salary: 0,
          equity: 0,
          startDate: new Date()
        }
      ]
    }))
  }

  const removeTeamMember = (id: string) => {
    setHrData(prev => ({
      ...prev,
      managementTeam: prev.managementTeam.filter(m => m.id !== id)
    }))
  }

  // Gestion des positions à recruter
  const addPosition = () => {
    setHrData(prev => ({
      ...prev,
      recruitmentPlan: {
        ...prev.recruitmentPlan,
        positions: [
          ...prev.recruitmentPlan.positions,
          {
            id: `pos-${Date.now()}`,
            title: '',
            department: '',
            type: 'full_time',
            level: 'entry',
            salary: { min: 0, max: 0 },
            requirements: { education: '', experience: '', skills: [], languages: [] },
            responsibilities: [],
            benefits: [],
            priority: 'medium',
            timeline: ''
          }
        ]
      }
    }))
  }

  const removePosition = (id: string) => {
    setHrData(prev => ({
      ...prev,
      recruitmentPlan: {
        ...prev.recruitmentPlan,
        positions: prev.recruitmentPlan.positions.filter(p => p.id !== id)
      }
    }))
  }

  if (!user) {
    return <div>Veuillez vous connecter</div>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-opacity-75 mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">Chargement du plan RH...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Projet introuvable</h2>
          <Link href="/projects" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            Retour aux projets
          </Link>
        </div>
      </div>
    )
  }

  return (
    <ModernProjectLayout
      projectId={project.id}
      projectName={project.basicInfo.name}
      title="Ressources Humaines"
      subtitle="Organisation et gestion du capital humain"
      project={project}
      currentSection="hr"
    >
      <div className="space-y-6">

        {/* Boutons d'action */}
        <div className="flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur-sm z-10 -mx-6 px-6 py-4 border-b border-slate-200">
          <button
            onClick={() => setShowAIAssistant(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg"
          >
            <SparklesIcon className="w-5 h-5" />
            Assistant IA
          </button>

          <button
            onClick={saveHRData}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>

        {/* Gouvernance */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <UserGroupIcon className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-slate-900">Conseil d'Administration</h2>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Processus de décision
                </label>
                <textarea
                  value={hrData.organization.governance.decisionMaking}
                  onChange={(e) => setHrData(prev => ({
                    ...prev,
                    organization: {
                      ...prev.organization,
                      governance: {
                        ...prev.organization.governance,
                        decisionMaking: e.target.value
                      }
                    }
                  }))}
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Décrivez le processus de prise de décision"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Fréquence des réunions
                </label>
                <input
                  type="text"
                  value={hrData.organization.governance.meetingFrequency}
                  onChange={(e) => setHrData(prev => ({
                    ...prev,
                    organization: {
                      ...prev.organization,
                      governance: {
                        ...prev.organization.governance,
                        meetingFrequency: e.target.value
                      }
                    }
                  }))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Mensuelle, Trimestrielle..."
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-semibold text-slate-700">
                  Membres du conseil
                </label>
                <button
                  onClick={addBoardMember}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  <PlusIcon className="w-4 h-4" />
                  Ajouter
                </button>
              </div>

              <div className="space-y-4">
                {hrData.organization.governance.board.map((member) => (
                  <div key={member.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold text-slate-900">Membre du conseil</h4>
                      <button
                        onClick={() => removeBoardMember(member.id)}
                        className="text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={member.name}
                        onChange={(e) => setHrData(prev => ({
                          ...prev,
                          organization: {
                            ...prev.organization,
                            governance: {
                              ...prev.organization.governance,
                              board: prev.organization.governance.board.map(m =>
                                m.id === member.id ? { ...m, name: e.target.value } : m
                              )
                            }
                          }
                        }))}
                        placeholder="Nom complet"
                        className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        value={member.role}
                        onChange={(e) => setHrData(prev => ({
                          ...prev,
                          organization: {
                            ...prev.organization,
                            governance: {
                              ...prev.organization.governance,
                              board: prev.organization.governance.board.map(m =>
                                m.id === member.id ? { ...m, role: e.target.value } : m
                              )
                            }
                          }
                        }))}
                        placeholder="Rôle (Président, Membre...)"
                        className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="number"
                        value={member.equity}
                        onChange={(e) => setHrData(prev => ({
                          ...prev,
                          organization: {
                            ...prev.organization,
                            governance: {
                              ...prev.organization.governance,
                              board: prev.organization.governance.board.map(m =>
                                m.id === member.id ? { ...m, equity: Number(e.target.value) } : m
                              )
                            }
                          }
                        }))}
                        placeholder="Part equity (%)"
                        className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <textarea
                        value={member.experience}
                        onChange={(e) => setHrData(prev => ({
                          ...prev,
                          organization: {
                            ...prev.organization,
                            governance: {
                              ...prev.organization.governance,
                              board: prev.organization.governance.board.map(m =>
                                m.id === member.id ? { ...m, experience: e.target.value } : m
                              )
                            }
                          }
                        }))}
                        placeholder="Expérience pertinente"
                        rows={2}
                        className="col-span-2 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Équipe dirigeante */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <BriefcaseIcon className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-slate-900">Équipe Dirigeante</h2>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm text-slate-600">Membres clés de l'équipe de direction</p>
              <button
                onClick={addTeamMember}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                <PlusIcon className="w-4 h-4" />
                Ajouter un membre
              </button>
            </div>

            <div className="space-y-4">
              {hrData.managementTeam.map((member) => (
                <div key={member.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-semibold text-slate-900">Membre de l'équipe</h4>
                    <button
                      onClick={() => removeTeamMember(member.id)}
                      className="text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={member.name}
                      onChange={(e) => setHrData(prev => ({
                        ...prev,
                        managementTeam: prev.managementTeam.map(m =>
                          m.id === member.id ? { ...m, name: e.target.value } : m
                        )
                      }))}
                      placeholder="Nom complet"
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      value={member.position}
                      onChange={(e) => setHrData(prev => ({
                        ...prev,
                        managementTeam: prev.managementTeam.map(m =>
                          m.id === member.id ? { ...m, position: e.target.value } : m
                        )
                      }))}
                      placeholder="Poste"
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      value={member.department}
                      onChange={(e) => setHrData(prev => ({
                        ...prev,
                        managementTeam: prev.managementTeam.map(m =>
                          m.id === member.id ? { ...m, department: e.target.value } : m
                        )
                      }))}
                      placeholder="Département"
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      value={member.salary}
                      onChange={(e) => setHrData(prev => ({
                        ...prev,
                        managementTeam: prev.managementTeam.map(m =>
                          m.id === member.id ? { ...m, salary: Number(e.target.value) } : m
                        )
                      }))}
                      placeholder="Salaire (FCFA)"
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      value={member.equity}
                      onChange={(e) => setHrData(prev => ({
                        ...prev,
                        managementTeam: prev.managementTeam.map(m =>
                          m.id === member.id ? { ...m, equity: Number(e.target.value) } : m
                        )
                      }))}
                      placeholder="Equity (%)"
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Plan de recrutement */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <AcademicCapIcon className="w-6 h-6 text-green-600" />
            <h2 className="text-2xl font-bold text-slate-900">Plan de Recrutement</h2>
          </div>

          <div className="space-y-6">
            {/* Budget de recrutement */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Budget total de recrutement (FCFA)
              </label>
              <input
                type="number"
                value={hrData.recruitmentPlan.budget.total}
                onChange={(e) => setHrData(prev => ({
                  ...prev,
                  recruitmentPlan: {
                    ...prev.recruitmentPlan,
                    budget: { ...prev.recruitmentPlan.budget, total: Number(e.target.value) }
                  }
                }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Positions à recruter */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-semibold text-slate-700">
                  Positions à recruter
                </label>
                <button
                  onClick={addPosition}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  <PlusIcon className="w-4 h-4" />
                  Ajouter une position
                </button>
              </div>

              <div className="space-y-4">
                {hrData.recruitmentPlan.positions.map((position) => (
                  <div key={position.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold text-slate-900">Position</h4>
                      <button
                        onClick={() => removePosition(position.id)}
                        className="text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={position.title}
                        onChange={(e) => setHrData(prev => ({
                          ...prev,
                          recruitmentPlan: {
                            ...prev.recruitmentPlan,
                            positions: prev.recruitmentPlan.positions.map(p =>
                              p.id === position.id ? { ...p, title: e.target.value } : p
                            )
                          }
                        }))}
                        placeholder="Titre du poste"
                        className="col-span-2 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <select
                        value={position.level}
                        onChange={(e) => setHrData(prev => ({
                          ...prev,
                          recruitmentPlan: {
                            ...prev.recruitmentPlan,
                            positions: prev.recruitmentPlan.positions.map(p =>
                              p.id === position.id ? { ...p, level: e.target.value as 'entry' | 'mid' | 'senior' | 'executive' } : p
                            )
                          }
                        }))}
                        className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="entry">Débutant</option>
                        <option value="mid">Intermédiaire</option>
                        <option value="senior">Senior</option>
                        <option value="executive">Exécutif</option>
                      </select>
                      <select
                        value={position.type}
                        onChange={(e) => setHrData(prev => ({
                          ...prev,
                          recruitmentPlan: {
                            ...prev.recruitmentPlan,
                            positions: prev.recruitmentPlan.positions.map(p =>
                              p.id === position.id ? { ...p, type: e.target.value as any } : p
                            )
                          }
                        }))}
                        className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="full_time">Temps plein</option>
                        <option value="part_time">Temps partiel</option>
                        <option value="contract">Contrat</option>
                        <option value="internship">Stage</option>
                      </select>
                      <select
                        value={position.level}
                        onChange={(e) => setHrData(prev => ({
                          ...prev,
                          recruitmentPlan: {
                            ...prev.recruitmentPlan,
                            positions: prev.recruitmentPlan.positions.map(p =>
                              p.id === position.id ? { ...p, level: e.target.value as any } : p
                            )
                          }
                        }))}
                        className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="junior">Junior</option>
                        <option value="mid">Intermédiaire</option>
                        <option value="senior">Senior</option>
                        <option value="executive">Exécutif</option>
                      </select>
                      <input
                        type="text"
                        value={position.department}
                        onChange={(e) => setHrData(prev => ({
                          ...prev,
                          recruitmentPlan: {
                            ...prev.recruitmentPlan,
                            positions: prev.recruitmentPlan.positions.map(p =>
                              p.id === position.id ? { ...p, department: e.target.value } : p
                            )
                          }
                        }))}
                        placeholder="Département"
                        className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Politiques RH */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <ChartBarIcon className="w-6 h-6 text-orange-600" />
            <h2 className="text-2xl font-bold text-slate-900">Politiques RH</h2>
          </div>

          <div className="space-y-6">
            {/* Compensation */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Structure de compensation</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={hrData.hrPolicies.compensation.structure.base}
                  onChange={(e) => setHrData(prev => ({
                    ...prev,
                    hrPolicies: {
                      ...prev.hrPolicies,
                      compensation: {
                        ...prev.hrPolicies.compensation,
                        structure: { ...prev.hrPolicies.compensation.structure, base: e.target.value }
                      }
                    }
                  }))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Salaire de base"
                />
                <input
                  type="text"
                  value={hrData.hrPolicies.compensation.structure.variable}
                  onChange={(e) => setHrData(prev => ({
                    ...prev,
                    hrPolicies: {
                      ...prev.hrPolicies,
                      compensation: {
                        ...prev.hrPolicies.compensation,
                        structure: { ...prev.hrPolicies.compensation.structure, variable: e.target.value }
                      }
                    }
                  }))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Part variable"
                />
                <input
                  type="text"
                  value={hrData.hrPolicies.compensation.structure.equity}
                  onChange={(e) => setHrData(prev => ({
                    ...prev,
                    hrPolicies: {
                      ...prev.hrPolicies,
                      compensation: {
                        ...prev.hrPolicies.compensation,
                        structure: { ...prev.hrPolicies.compensation.structure, equity: e.target.value }
                      }
                    }
                  }))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Actions/Equity"
                />
              </div>
            </div>

            {/* Avantages sociaux */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Avantages sociaux</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Politique de congés
                  </label>
                  <input
                    type="text"
                    value={hrData.hrPolicies.benefits.vacation}
                    onChange={(e) => setHrData(prev => ({
                      ...prev,
                      hrPolicies: {
                        ...prev.hrPolicies,
                        benefits: { ...prev.hrPolicies.benefits, vacation: e.target.value }
                      }
                    }))}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: 30 jours de congés payés par an"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Plan de retraite
                  </label>
                  <input
                    type="text"
                    value={hrData.hrPolicies.benefits.retirement}
                    onChange={(e) => setHrData(prev => ({
                      ...prev,
                      hrPolicies: {
                        ...prev.hrPolicies,
                        benefits: { ...prev.hrPolicies.benefits, retirement: e.target.value }
                      }
                    }))}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Cotisation IPRES + plan complémentaire"
                  />
                </div>
              </div>
            </div>

            {/* Formation */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Formation et développement</h3>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Budget formation (FCFA)
                </label>
                <input
                  type="number"
                  value={hrData.hrPolicies.training.budget}
                  onChange={(e) => setHrData(prev => ({
                    ...prev,
                    hrPolicies: {
                      ...prev.hrPolicies,
                      training: { ...prev.hrPolicies.training, budget: Number(e.target.value) }
                    }
                  }))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Performance */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Gestion de la performance</h3>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Fréquence d'évaluation
                </label>
                <input
                  type="text"
                  value={hrData.hrPolicies.performance.frequency}
                  onChange={(e) => setHrData(prev => ({
                    ...prev,
                    hrPolicies: {
                      ...prev.hrPolicies,
                      performance: { ...prev.hrPolicies.performance, frequency: e.target.value }
                    }
                  }))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Annuel, Semestriel, Trimestriel"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Projections RH */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Projections RH</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Taux de rotation du personnel (%)
              </label>
              <input
                type="number"
                value={hrData.projections.productivity.turnoverRate}
                onChange={(e) => setHrData(prev => ({
                  ...prev,
                  projections: {
                    ...prev.projections,
                    productivity: { ...prev.projections.productivity, turnoverRate: Number(e.target.value) }
                  }
                }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                max="100"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Note: Revenu et Coût par employé
              </label>
              <p className="text-sm text-slate-600 mt-2">
                Les métriques de revenu et coût par employé sont calculées automatiquement dans les projections financières
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Score de satisfaction (%)
              </label>
              <input
                type="number"
                value={hrData.projections.productivity.satisfactionScore}
                onChange={(e) => setHrData(prev => ({
                  ...prev,
                  projections: {
                    ...prev.projections,
                    productivity: { ...prev.projections.productivity, satisfactionScore: Number(e.target.value) }
                  }
                }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                max="100"
              />
            </div>
          </div>
        </div>

      </div>

      {/* Assistant IA Modal */}
      {project && showAIAssistant && (
        <BusinessPlanAIAssistant
          project={project}
          currentSection="hr"
          isOpen={showAIAssistant}
          onClose={() => setShowAIAssistant(false)}
          onContentGenerated={handleAIContentGenerated}
          userId={user?.uid}
        />
      )}
    </ModernProjectLayout>
  )
}
