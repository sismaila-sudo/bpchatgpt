'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit2, Trash2, Package, Upload } from 'lucide-react'
import { ImportDialog } from '../ImportDialog'

interface Product {
  id: string
  name: string
  unit: string
  unit_price: number
  unit_cost: number
  created_at: string
}

interface ProductsTabProps {
  project: any
}

export function ProductsTab({ project }: ProductsTabProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    unit: 'unité',
    unit_price: 0,
    unit_cost: 0
  })

  const supabase = createClient()

  useEffect(() => {
    loadProducts()
  }, [project.id])

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products_services')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Erreur chargement produits:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert('Le nom du produit est requis')
      return
    }

    try {
      if (editingProduct) {
        // Modifier
        const { error } = await supabase
          .from('products_services')
          .update({
            name: formData.name.trim(),
            unit: formData.unit,
            unit_price: formData.unit_price,
            unit_cost: formData.unit_cost
          })
          .eq('id', editingProduct.id)

        if (error) throw error
      } else {
        // Créer
        const { error } = await supabase
          .from('products_services')
          .insert({
            project_id: project.id,
            name: formData.name.trim(),
            unit: formData.unit,
            unit_price: formData.unit_price,
            unit_cost: formData.unit_cost
          })

        if (error) throw error
      }

      // Réinitialiser le formulaire
      setFormData({ name: '', unit: 'unité', unit_price: 0, unit_cost: 0 })
      setEditingProduct(null)
      setShowForm(false)

      // Recharger la liste
      loadProducts()
    } catch (error) {
      console.error('Erreur sauvegarde produit:', error)
      alert('Erreur lors de la sauvegarde')
    }
  }

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      unit: product.unit,
      unit_price: product.unit_price,
      unit_cost: product.unit_cost
    })
    setEditingProduct(product)
    setShowForm(true)
  }

  const handleDelete = async (productId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('products_services')
        .delete()
        .eq('id', productId)

      if (error) throw error

      loadProducts()
    } catch (error) {
      console.error('Erreur suppression produit:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: project.organizations?.currency || 'XOF',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Package className="h-6 w-6 mr-2 text-blue-600" />
            Produits & Services
          </h2>
          <p className="text-gray-600 mt-1">
            Définissez vos offres commerciales avec leurs prix et coûts
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={() => setShowImportDialog(true)}
            variant="outline"
          >
            <Upload className="h-4 w-4 mr-2" />
            Importer Excel
          </Button>
          <Button
            onClick={() => {
              setFormData({ name: '', unit: 'unité', unit_price: 0, unit_cost: 0 })
              setEditingProduct(null)
              setShowForm(true)
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau produit
          </Button>
        </div>
      </div>

      {/* Formulaire */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingProduct ? 'Modifier le produit' : 'Nouveau produit'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du produit/service *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Pain complet, Consultation juridique..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unité de mesure
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="unité">Unité</option>
                    <option value="kg">Kilogramme</option>
                    <option value="litre">Litre</option>
                    <option value="heure">Heure</option>
                    <option value="jour">Jour</option>
                    <option value="m²">Mètre carré</option>
                    <option value="abonnement">Abonnement</option>
                    <option value="licence">Licence</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prix de vente ({project.organizations?.currency || 'XOF'})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.unit_price || ''}
                    onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Coût unitaire ({project.organizations?.currency || 'XOF'})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.unit_cost || ''}
                    onChange={(e) => setFormData({ ...formData, unit_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Marge calculée */}
              {formData.unit_price > 0 && (
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Marge unitaire:</strong> {formatCurrency(formData.unit_price - formData.unit_cost)}
                    ({formData.unit_price > 0 ? (((formData.unit_price - formData.unit_cost) / formData.unit_price) * 100).toFixed(1) : 0}%)
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setEditingProduct(null)
                  }}
                >
                  Annuler
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingProduct ? 'Modifier' : 'Ajouter'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Liste des produits */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des produits ({products.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Chargement...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Aucun produit défini</p>
              <p className="text-sm text-gray-500 mb-4">
                Commencez par ajouter vos produits ou services
              </p>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter le premier produit
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Produit/Service</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Unité</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900">Prix de vente</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900">Coût unitaire</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900">Marge</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900">Marge %</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const margin = product.unit_price - product.unit_cost
                    const marginPct = product.unit_price > 0 ? (margin / product.unit_price) * 100 : 0

                    return (
                      <tr key={product.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{product.name}</td>
                        <td className="py-3 px-4 text-gray-600">{product.unit}</td>
                        <td className="py-3 px-4 text-right font-mono">
                          {formatCurrency(product.unit_price)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          {formatCurrency(product.unit_cost)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          <span className={margin >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(margin)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          <span className={marginPct >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {marginPct.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(product)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(product.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conseils */}
      {products.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-green-900 mb-2">
            ✅ Étape suivante
          </h3>
          <p className="text-sm text-green-700">
            Parfait ! Vous avez défini vos produits. Passez maintenant à l'onglet "Ventes"
            pour créer vos projections de volumes mensuels.
          </p>
        </div>
      )}

      {/* Dialog d'import */}
      <ImportDialog
        isOpen={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onSuccess={() => {
          loadProducts()
          setShowImportDialog(false)
        }}
        projectId={project.id}
        type="products"
      />
    </div>
  )
}