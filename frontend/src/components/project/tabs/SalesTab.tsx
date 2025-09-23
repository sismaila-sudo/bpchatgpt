'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { TrendingUp, Plus, Eye, Calculator } from 'lucide-react'

interface Product {
  id: string
  name: string
  unit: string
  unit_price: number
}

interface SalesProjection {
  id?: string
  product_id: string
  year: number
  month: number
  volume: number
}

interface SalesTabProps {
  project: any
}

export function SalesTab({ project }: SalesTabProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [projections, setProjections] = useState<SalesProjection[]>([])
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [selectedYear, setSelectedYear] = useState<number>(new Date(project.start_date).getFullYear())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const supabase = createClient()

  // Générer les années disponibles
  const startYear = new Date(project.start_date).getFullYear()
  const years = Array.from({ length: project.horizon_years }, (_, i) => startYear + i)
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ]

  useEffect(() => {
    loadData().then(() => {
      // Nettoyer automatiquement les données après le chargement
      cleanDataBeforeStartDate()
    })
  }, [project.id])

  // Fonction pour nettoyer les données avant la date de démarrage
  const cleanDataBeforeStartDate = async () => {
    try {
      const projectStartDate = new Date(project.start_date)
      const startYear = projectStartDate.getFullYear()
      const startMonth = projectStartDate.getMonth() + 1 // +1 car getMonth() retourne 0-11

      // D'abord supprimer toutes les projections des années antérieures
      const { error: yearError } = await supabase
        .from('sales_projections')
        .delete()
        .eq('project_id', project.id)
        .lt('year', startYear)

      if (yearError) {
        console.error('Erreur nettoyage années:', yearError)
      }

      // Ensuite supprimer les mois antérieurs de l'année de démarrage
      const { error: monthError } = await supabase
        .from('sales_projections')
        .delete()
        .eq('project_id', project.id)
        .eq('year', startYear)
        .lt('month', startMonth)

      if (monthError) {
        console.error('Erreur nettoyage mois:', monthError)
      }

      if (!yearError && !monthError) {
        console.log('Données avant date de démarrage nettoyées')
        await loadData() // Recharger les données
      }
    } catch (error) {
      console.error('Erreur nettoyage:', error)
    }
  }

  const loadData = async () => {
    try {
      // Charger les produits
      const { data: productsData, error: productsError } = await supabase
        .from('products_services')
        .select('id, name, unit, unit_price')
        .eq('project_id', project.id)
        .order('created_at')

      if (productsError) throw productsError

      // Charger les projections existantes
      const { data: projectionsData, error: projectionsError } = await supabase
        .from('sales_projections')
        .select('*')
        .eq('project_id', project.id)
        .order('year, month')

      if (projectionsError) throw projectionsError

      setProducts(productsData || [])
      setProjections(projectionsData || [])

      // Sélectionner le premier produit par défaut
      if (productsData && productsData.length > 0 && !selectedProduct) {
        setSelectedProduct(productsData[0].id)
      }
    } catch (error) {
      console.error('Erreur chargement données:', error)
    } finally {
      setLoading(false)
    }
  }

  const getProjectionValue = (productId: string, year: number, month: number): number => {
    // Vérifier si cette date est avant la date de démarrage du projet
    const projectStartDate = new Date(project.start_date)
    const inputDate = new Date(year, month - 1, 1)

    // Si c'est avant la date de démarrage, retourner 0
    if (inputDate < projectStartDate) {
      return 0
    }

    const projection = projections.find(p =>
      p.product_id === productId && p.year === year && p.month === month
    )
    return projection?.volume || 0
  }

  const updateProjection = async (productId: string, year: number, month: number, volume: number) => {
    const product = products.find(p => p.id === productId)
    if (!product) return

    // Vérifier que la date n'est pas antérieure à la date de démarrage
    const projectStartDate = new Date(project.start_date)
    const inputDate = new Date(year, month - 1, 1) // month - 1 car les mois JS sont 0-indexed

    if (inputDate < projectStartDate) {
      alert(`⚠️ Impossible de saisir des données avant la date de démarrage du projet (${projectStartDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })})`)
      return
    }

    console.log('Updating projection:', { productId, year, month, volume })

    try {
      const { data, error } = await supabase
        .from('sales_projections')
        .upsert({
          project_id: project.id,
          product_id: productId,
          year,
          month,
          volume
        }, {
          onConflict: 'project_id,product_id,year,month'
        })
        .select()

      if (error) {
        console.error('Erreur sauvegarde:', error)
        alert('Erreur: ' + error.message)
        return
      }

      console.log('Projection sauvée:', data)
      await loadData() // Recharger les données
    } catch (error) {
      console.error('Erreur sauvegarde projection:', error)
      alert('Erreur lors de la sauvegarde')
    }
  }

  const generateTemplate = async () => {
    if (!selectedProduct) return

    setSaving(true)
    try {
      const product = products.find(p => p.id === selectedProduct)
      if (!product) return

      // Générer des projections de base (croissance progressive)
      const baseVolume = 100 // Volume de base
      const growthRate = 0.05 // 5% de croissance par mois

      const promises = []
      for (let year of years) {
        for (let month = 1; month <= 12; month++) {
          const monthIndex = (year - startYear) * 12 + (month - 1)
          const volume = Math.round(baseVolume * Math.pow(1 + growthRate, monthIndex))

          // Créer directement en base sans attendre
          const promise = supabase
            .from('sales_projections')
            .upsert({
              project_id: project.id,
              product_id: selectedProduct,
              year,
              month,
              volume
            }, {
              onConflict: 'project_id,product_id,year,month'
            })

          promises.push(promise)
        }
      }

      await Promise.all(promises)
      await loadData() // Recharger les données
    } catch (error) {
      console.error('Erreur génération template:', error)
      alert('Erreur lors de la génération du template')
    } finally {
      setSaving(false)
    }
  }

  const calculateTotals = (productId: string, year: number) => {
    let totalVolume = 0
    let totalRevenue = 0

    for (let month = 1; month <= 12; month++) {
      const volume = getProjectionValue(productId, year, month)
      const product = products.find(p => p.id === productId)
      if (product) {
        totalVolume += volume
        totalRevenue += volume * product.unit_price
      }
    }

    return { totalVolume, totalRevenue }
  }

  // Calculer le total pour TOUS les produits sur une année
  const calculateAllProductsTotals = (year: number) => {
    let totalRevenue = 0
    let totalVolumeByUnit = {}

    console.log(`🔍 Debug calculateAllProductsTotals pour ${year}:`)

    products.forEach(product => {
      let productRevenue = 0
      for (let month = 1; month <= 12; month++) {
        const volume = getProjectionValue(product.id, year, month)
        if (volume > 0) {
          const monthRevenue = volume * product.unit_price
          totalRevenue += monthRevenue
          productRevenue += monthRevenue

          // Grouper les volumes par unité
          if (!totalVolumeByUnit[product.unit]) {
            totalVolumeByUnit[product.unit] = 0
          }
          totalVolumeByUnit[product.unit] += volume
        }
      }
      if (productRevenue > 0) {
        console.log(`- ${product.name}: ${productRevenue} (prix: ${product.unit_price})`)
      }
    })

    console.log(`- Total année ${year}: ${totalRevenue}`)
    return { totalRevenue, totalVolumeByUnit }
  }

  // Calculer le total pour TOUS les produits sur TOUTES les années
  const calculateGrandTotal = () => {
    let grandTotalRevenue = 0

    console.log('🔍 Debug calculateGrandTotal:')
    console.log('- Products:', products.length, products.map(p => ({ name: p.name, price: p.unit_price })))
    console.log('- Years:', years)
    console.log('- Projections total:', projections.length)

    years.forEach(year => {
      const { totalRevenue } = calculateAllProductsTotals(year)
      console.log(`- CA année ${year}:`, totalRevenue)
      grandTotalRevenue += totalRevenue
    })

    console.log('- Grand Total:', grandTotalRevenue)
    return grandTotalRevenue
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: project.organizations?.currency || 'XOF',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Chargement...</p>
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun produit défini
          </h3>
          <p className="text-gray-600 mb-4">
            Vous devez d'abord créer des produits dans l'onglet "Produits/Services"
          </p>
          <Button className="bg-blue-600 hover:bg-blue-700">
            Aller aux Produits
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <TrendingUp className="h-6 w-6 mr-2 text-blue-600" />
            Projections de Ventes
          </h2>
          <p className="text-gray-600 mt-1">
            Définissez vos volumes de vente mensuels pour chaque produit
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={generateTemplate}
            disabled={!selectedProduct || saving}
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            {saving ? 'Génération...' : 'Template'}
          </Button>
        </div>
      </div>

      {/* Récapitulatif Global - TOUS les produits */}
      <Card className="border-l-4 border-l-green-500 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center text-green-700">
            <Calculator className="h-5 w-5 mr-2" />
            Récapitulatif Global - Tous les Produits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(calculateGrandTotal())}
              </div>
              <div className="text-sm text-gray-600">CA Total {years[0]} - {years[years.length - 1]}</div>
            </div>
            {years.map(year => {
              const { totalRevenue } = calculateAllProductsTotals(year)
              return (
                <div key={year} className="text-center">
                  <div className="text-lg font-semibold text-gray-800">
                    {formatCurrency(totalRevenue)}
                  </div>
                  <div className="text-sm text-gray-600">CA {year}</div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 text-xs text-gray-500">
            💡 Ce récapitulatif inclut tous les produits et toutes les années du projet
          </div>
        </CardContent>
      </Card>

      {/* Tableau récapitulatif par produit */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Eye className="h-5 w-5 mr-2 text-blue-600" />
            Détail par Produit et par Année
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 py-2 px-4 text-left">Produit</th>
                  <th className="border border-gray-300 py-2 px-4 text-right">Prix Unitaire</th>
                  {years.map(year => (
                    <th key={year} className="border border-gray-300 py-2 px-4 text-right">{year}</th>
                  ))}
                  <th className="border border-gray-300 py-2 px-4 text-right font-bold">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 py-2 px-4 font-medium">
                      {product.name}
                    </td>
                    <td className="border border-gray-300 py-2 px-4 text-right">
                      {formatCurrency(product.unit_price)}/{product.unit}
                    </td>
                    {years.map(year => {
                      const { totalRevenue } = calculateTotals(product.id, year)
                      return (
                        <td key={year} className="border border-gray-300 py-2 px-4 text-right">
                          {formatCurrency(totalRevenue)}
                        </td>
                      )
                    })}
                    <td className="border border-gray-300 py-2 px-4 text-right font-bold">
                      {(() => {
                        let productTotal = 0
                        years.forEach(year => {
                          const { totalRevenue } = calculateTotals(product.id, year)
                          productTotal += totalRevenue
                        })
                        return formatCurrency(productTotal)
                      })()}
                    </td>
                  </tr>
                ))}
                <tr className="bg-blue-100 font-bold">
                  <td className="border border-gray-300 py-2 px-4" colSpan="2">
                    TOTAL TOUS PRODUITS
                  </td>
                  {years.map(year => {
                    const { totalRevenue } = calculateAllProductsTotals(year)
                    return (
                      <td key={year} className="border border-gray-300 py-2 px-4 text-right">
                        {formatCurrency(totalRevenue)}
                      </td>
                    )
                  })}
                  <td className="border border-gray-300 py-2 px-4 text-right text-blue-600">
                    {formatCurrency(calculateGrandTotal())}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Sélecteurs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Produit/Service
          </label>
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Sélectionner un produit</option>
            {products.map(product => (
              <option key={product.id} value={product.id}>
                {product.name} ({formatCurrency(product.unit_price)}/{product.unit})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Année
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {years.map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tableau des projections */}
      {selectedProduct && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>
                Projections {selectedYear} - {products.find(p => p.id === selectedProduct)?.name}
              </span>
              <div className="text-sm text-gray-600">
                {(() => {
                  const { totalVolume, totalRevenue } = calculateTotals(selectedProduct, selectedYear)
                  return `Total: ${totalVolume} ${products.find(p => p.id === selectedProduct)?.unit} • ${formatCurrency(totalRevenue)}`
                })()}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Mois</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900">Volume</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900">Prix unitaire</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900">Chiffre d'affaires</th>
                  </tr>
                </thead>
                <tbody>
                  {months.map((monthName, index) => {
                    const month = index + 1
                    const volume = getProjectionValue(selectedProduct, selectedYear, month)
                    const product = products.find(p => p.id === selectedProduct)
                    const revenue = volume * (product?.unit_price || 0)

                    // Vérifier si ce mois est avant la date de démarrage du projet
                    const projectStartDate = new Date(project.start_date)
                    const inputDate = new Date(selectedYear, month - 1, 1)
                    const isBeforeStart = inputDate < projectStartDate

                    return (
                      <tr key={month} className={`border-b hover:bg-gray-50 ${isBeforeStart ? 'bg-gray-100' : ''}`}>
                        <td className={`py-3 px-4 font-medium ${isBeforeStart ? 'text-gray-400' : ''}`}>{monthName}</td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={volume || ''}
                            disabled={isBeforeStart}
                            onChange={(e) => {
                              const newVolume = parseInt(e.target.value) || 0
                              updateProjection(selectedProduct, selectedYear, month, newVolume)
                            }}
                            onBlur={(e) => {
                              if (!e.target.value) {
                                updateProjection(selectedProduct, selectedYear, month, 0)
                              }
                            }}
                            className={`w-full px-2 py-1 text-right border rounded focus:outline-none ${
                              isBeforeStart
                                ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                            }`}
                            title={isBeforeStart ? `Saisie non autorisée avant la date de démarrage (${projectStartDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })})` : ''}
                          />
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-gray-600">
                          {formatCurrency(product?.unit_price || 0)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold">
                          {formatCurrency(revenue)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 bg-gray-50">
                    <td className="py-3 px-4 font-bold">TOTAL {selectedYear}</td>
                    <td className="py-3 px-4 text-right font-bold">
                      {(() => {
                        const { totalVolume } = calculateTotals(selectedProduct, selectedYear)
                        return `${totalVolume} ${products.find(p => p.id === selectedProduct)?.unit}`
                      })()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-gray-600">
                      {formatCurrency(products.find(p => p.id === selectedProduct)?.unit_price || 0)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-blue-600">
                      {(() => {
                        const { totalRevenue } = calculateTotals(selectedProduct, selectedYear)
                        return formatCurrency(totalRevenue)
                      })()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Résumé multi-années */}
      {selectedProduct && (
        <Card>
          <CardHeader>
            <CardTitle>Résumé pluriannuel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Année</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900">Volume total</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900">CA total</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900">Croissance</th>
                  </tr>
                </thead>
                <tbody>
                  {years.map((year, index) => {
                    const { totalVolume, totalRevenue } = calculateTotals(selectedProduct, year)
                    const prevYear = index > 0 ? years[index - 1] : null
                    const prevRevenue = prevYear ? calculateTotals(selectedProduct, prevYear).totalRevenue : 0
                    const growth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0

                    return (
                      <tr key={year} className="border-b">
                        <td className="py-3 px-4 font-medium">{year}</td>
                        <td className="py-3 px-4 text-right">
                          {totalVolume} {products.find(p => p.id === selectedProduct)?.unit}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          {formatCurrency(totalRevenue)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {index > 0 && (
                            <span className={growth >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conseils */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">
          💡 Conseils
        </h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Utilisez le bouton "Template" pour générer des projections de base</li>
          <li>• Modifiez ensuite les volumes selon vos prévisions réelles</li>
          <li>• Pensez à la saisonnalité de votre activité</li>
          <li>• Une fois terminé, cliquez sur "Calculer" pour voir vos projections financières</li>
        </ul>
      </div>
    </div>
  )
}