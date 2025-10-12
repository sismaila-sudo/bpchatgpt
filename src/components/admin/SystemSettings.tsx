'use client'

import { useState, useEffect } from 'react'
import {
  CogIcon,
  KeyIcon,
  ShieldCheckIcon,
  CloudIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  InformationCircleIcon,
  ServerIcon,
  BellIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline'

interface SystemConfig {
  firebase: {
    status: 'connected' | 'error' | 'warning'
    projectId: string
    region: string
    lastSync: string
  }
  openai: {
    status: 'active' | 'inactive' | 'limited'
    model: string
    rateLimitRemaining: number
    lastUsed: string
  }
  security: {
    twoFactorEnabled: boolean
    passwordPolicy: 'basic' | 'strong' | 'enterprise'
    sessionTimeout: number
    ipWhitelist: string[]
  }
  notifications: {
    email: boolean
    sms: boolean
    push: boolean
    frequency: 'immediate' | 'daily' | 'weekly'
  }
  backup: {
    enabled: boolean
    frequency: 'daily' | 'weekly' | 'monthly'
    location: string
    lastBackup: string
  }
}

export default function SystemSettings() {
  const [config, setConfig] = useState<SystemConfig>({
    firebase: {
      status: 'connected',
      projectId: 'bpdesign-firebase-prod',
      region: 'europe-west1',
      lastSync: '2024-03-15T10:30:00Z'
    },
    openai: {
      status: 'active',
      model: 'gpt-4-turbo',
      rateLimitRemaining: 450,
      lastUsed: '2024-03-15T09:45:00Z'
    },
    security: {
      twoFactorEnabled: true,
      passwordPolicy: 'strong',
      sessionTimeout: 3600,
      ipWhitelist: ['192.168.1.0/24', '10.0.0.0/8']
    },
    notifications: {
      email: true,
      sms: false,
      push: true,
      frequency: 'daily'
    },
    backup: {
      enabled: true,
      frequency: 'daily',
      location: 'Google Cloud Storage',
      lastBackup: '2024-03-15T02:00:00Z'
    }
  })

  const [activeTab, setActiveTab] = useState('firebase')
  const [saving, setSaving] = useState(false)
  const [showLogs, setShowLogs] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active':
        return 'text-green-600 bg-green-100'
      case 'warning':
      case 'limited':
        return 'text-yellow-600 bg-yellow-100'
      case 'error':
      case 'inactive':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active':
        return <CheckCircleIcon className="h-4 w-4" />
      case 'warning':
      case 'limited':
        return <ExclamationTriangleIcon className="h-4 w-4" />
      case 'error':
      case 'inactive':
        return <XMarkIcon className="h-4 w-4" />
      default:
        return <InformationCircleIcon className="h-4 w-4" />
    }
  }

  const handleSave = async () => {
    setSaving(true)
    // Simulation de la sauvegarde
    await new Promise(resolve => setTimeout(resolve, 1500))
    setSaving(false)
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR')
  }

  const tabs = [
    { id: 'firebase', name: 'Firebase', icon: CloudIcon },
    { id: 'security', name: 'Sécurité', icon: ShieldCheckIcon },
    { id: 'apis', name: 'APIs', icon: KeyIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'backup', name: 'Sauvegarde', icon: ServerIcon },
    { id: 'logs', name: 'Logs', icon: DocumentTextIcon }
  ]

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* En-tête */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CogIcon className="h-6 w-6 text-purple-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Configuration système</h2>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Navigation des onglets */}
        <div className="w-64 border-r border-gray-200">
          <nav className="p-4 space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-purple-100 text-purple-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {tab.name}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Contenu des onglets */}
        <div className="flex-1 p-6">
          {activeTab === 'firebase' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Configuration Firebase</h3>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Statut de connexion</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(config.firebase.status)}`}>
                      {getStatusIcon(config.firebase.status)}
                      <span className="ml-1 capitalize">{config.firebase.status}</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Projet ID:</span>
                      <span className="ml-2 font-mono">{config.firebase.projectId}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Région:</span>
                      <span className="ml-2">{config.firebase.region}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">Dernière synchronisation:</span>
                      <span className="ml-2">{formatDateTime(config.firebase.lastSync)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Projet Firebase
                    </label>
                    <input
                      type="text"
                      value={config.firebase.projectId}
                      onChange={(e) => setConfig({
                        ...config,
                        firebase: { ...config.firebase, projectId: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Région
                    </label>
                    <select
                      value={config.firebase.region}
                      onChange={(e) => setConfig({
                        ...config,
                        firebase: { ...config.firebase, region: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="europe-west1">Europe West 1 (Belgique)</option>
                      <option value="us-central1">US Central 1 (Iowa)</option>
                      <option value="asia-southeast1">Asia Southeast 1 (Singapour)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Paramètres de sécurité</h3>

                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Authentification à deux facteurs</h4>
                      <p className="text-sm text-gray-500">Exiger une authentification à deux facteurs pour tous les administrateurs</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.security.twoFactorEnabled}
                        onChange={(e) => setConfig({
                          ...config,
                          security: { ...config.security, twoFactorEnabled: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Politique de mot de passe
                    </label>
                    <select
                      value={config.security.passwordPolicy}
                      onChange={(e) => setConfig({
                        ...config,
                        security: { ...config.security, passwordPolicy: e.target.value as any }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="basic">Basique (8 caractères min.)</option>
                      <option value="strong">Forte (12 caractères, majuscules, chiffres, symboles)</option>
                      <option value="enterprise">Entreprise (16 caractères, rotation obligatoire)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timeout de session (secondes)
                    </label>
                    <input
                      type="number"
                      value={config.security.sessionTimeout}
                      onChange={(e) => setConfig({
                        ...config,
                        security: { ...config.security, sessionTimeout: parseInt(e.target.value) }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Whitelist IP (une par ligne)
                    </label>
                    <textarea
                      value={config.security.ipWhitelist.join('\n')}
                      onChange={(e) => setConfig({
                        ...config,
                        security: { ...config.security, ipWhitelist: e.target.value.split('\n').filter(ip => ip.trim()) }
                      })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                      placeholder="192.168.1.0/24&#10;10.0.0.0/8"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'apis' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Configuration des APIs</h3>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="h-8 w-8 bg-green-600 rounded-lg flex items-center justify-center mr-3">
                        <KeyIcon className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">OpenAI API</h4>
                        <p className="text-sm text-gray-500">Service d'intelligence artificielle</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(config.openai.status)}`}>
                      {getStatusIcon(config.openai.status)}
                      <span className="ml-1 capitalize">{config.openai.status}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Modèle:</span>
                      <span className="ml-2 font-medium">{config.openai.model}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Limite restante:</span>
                      <span className="ml-2 font-medium">{config.openai.rateLimitRemaining}/500</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">Dernière utilisation:</span>
                      <span className="ml-2">{formatDateTime(config.openai.lastUsed)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Clé API OpenAI
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value="sk-••••••••••••••••••••••••••••••••••••••••"
                        readOnly
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                      />
                      <button className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <PencilIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Modèle par défaut
                    </label>
                    <select
                      value={config.openai.model}
                      onChange={(e) => setConfig({
                        ...config,
                        openai: { ...config.openai, model: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="gpt-4-turbo">GPT-4 Turbo</option>
                      <option value="gpt-4">GPT-4</option>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Paramètres de notification</h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Notifications par email</h4>
                      <p className="text-sm text-gray-500">Recevoir les alertes système par email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.notifications.email}
                        onChange={(e) => setConfig({
                          ...config,
                          notifications: { ...config.notifications, email: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Notifications SMS</h4>
                      <p className="text-sm text-gray-500">Recevoir les alertes critiques par SMS</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.notifications.sms}
                        onChange={(e) => setConfig({
                          ...config,
                          notifications: { ...config.notifications, sms: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Notifications push</h4>
                      <p className="text-sm text-gray-500">Recevoir les notifications dans le navigateur</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.notifications.push}
                        onChange={(e) => setConfig({
                          ...config,
                          notifications: { ...config.notifications, push: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fréquence des rapports
                    </label>
                    <select
                      value={config.notifications.frequency}
                      onChange={(e) => setConfig({
                        ...config,
                        notifications: { ...config.notifications, frequency: e.target.value as any }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="immediate">Immédiat</option>
                      <option value="daily">Quotidien</option>
                      <option value="weekly">Hebdomadaire</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Configuration des sauvegardes</h3>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Statut des sauvegardes</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.backup.enabled ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'}`}>
                      {config.backup.enabled ? <CheckCircleIcon className="h-4 w-4" /> : <XMarkIcon className="h-4 w-4" />}
                      <span className="ml-1">{config.backup.enabled ? 'Activées' : 'Désactivées'}</span>
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span>Dernière sauvegarde: {formatDateTime(config.backup.lastBackup)}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Sauvegardes automatiques</h4>
                      <p className="text-sm text-gray-500">Activer les sauvegardes automatiques du système</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.backup.enabled}
                        onChange={(e) => setConfig({
                          ...config,
                          backup: { ...config.backup, enabled: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fréquence des sauvegardes
                    </label>
                    <select
                      value={config.backup.frequency}
                      onChange={(e) => setConfig({
                        ...config,
                        backup: { ...config.backup, frequency: e.target.value as any }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={!config.backup.enabled}
                    >
                      <option value="daily">Quotidienne</option>
                      <option value="weekly">Hebdomadaire</option>
                      <option value="monthly">Mensuelle</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Emplacement de stockage
                    </label>
                    <input
                      type="text"
                      value={config.backup.location}
                      onChange={(e) => setConfig({
                        ...config,
                        backup: { ...config.backup, location: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={!config.backup.enabled}
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      disabled={!config.backup.enabled}
                    >
                      Sauvegarder maintenant
                    </button>
                    <button
                      className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                    >
                      Restaurer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Journaux système</h3>

                <div className="bg-gray-900 text-green-400 font-mono text-sm p-4 rounded-lg h-96 overflow-y-auto">
                  <div className="space-y-1">
                    <div>[2024-03-15 10:30:15] INFO: Système démarré</div>
                    <div>[2024-03-15 10:30:16] INFO: Firebase connecté</div>
                    <div>[2024-03-15 10:30:17] INFO: OpenAI API initialisée</div>
                    <div>[2024-03-15 10:35:22] INFO: Nouvel utilisateur créé: marie@consultplus.sn</div>
                    <div>[2024-03-15 10:42:33] INFO: Projet créé: Centre de Formation Numérique</div>
                    <div>[2024-03-15 11:15:45] WARN: Rate limit approché pour OpenAI API</div>
                    <div>[2024-03-15 11:30:12] INFO: Sauvegarde automatique effectuée</div>
                    <div>[2024-03-15 12:05:18] INFO: Connexion utilisateur: amadou@example.com</div>
                    <div>[2024-03-15 12:45:22] ERROR: Échec de génération PDF pour projet #3</div>
                    <div>[2024-03-15 13:12:33] INFO: Projet terminé: Restaurant Teranga Dakar</div>
                    <div>[2024-03-15 14:20:45] INFO: Mise à jour système effectuée</div>
                    <div>[2024-03-15 15:30:12] INFO: Nettoyage des sessions expirées</div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center space-x-2">
                    <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                      <option value="all">Tous les niveaux</option>
                      <option value="info">INFO</option>
                      <option value="warn">WARN</option>
                      <option value="error">ERROR</option>
                    </select>
                    <input
                      type="date"
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      defaultValue="2024-03-15"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="bg-gray-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors">
                      Télécharger
                    </button>
                    <button className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors">
                      Vider
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}