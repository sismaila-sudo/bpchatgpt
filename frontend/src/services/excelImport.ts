import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/client'

interface ImportError {
  row: number
  field: string
  message: string
}

interface ImportResult {
  success: boolean
  imported: number
  errors: ImportError[]
  data?: any[]
}

export class ExcelImportService {

  static async importProducts(file: File, projectId: string): Promise<ImportResult> {
    try {
      const data = await this.readExcelFile(file)
      const sheet = data.Sheets[data.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(sheet)

      const products = []
      const errors: ImportError[] = []

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i] as any
        const rowNum = i + 2 // +2 car la ligne 1 est l'entête

        try {
          const product = this.validateProduct(row, rowNum)
          if (product) {
            products.push({
              ...product,
              project_id: projectId
            })
          }
        } catch (error: any) {
          errors.push({
            row: rowNum,
            field: 'general',
            message: error.message
          })
        }
      }

      if (products.length > 0) {
        const supabase = createClient()
        const { data: insertedData, error } = await supabase
          .from('products_services')
          .insert(products)
          .select()

        if (error) {
          throw error
        }

        return {
          success: true,
          imported: products.length,
          errors,
          data: insertedData
        }
      }

      return {
        success: false,
        imported: 0,
        errors: errors.length > 0 ? errors : [{ row: 0, field: 'general', message: 'Aucune donnée valide trouvée' }]
      }

    } catch (error: any) {
      return {
        success: false,
        imported: 0,
        errors: [{ row: 0, field: 'general', message: error.message }]
      }
    }
  }

  static async importSalesProjections(file: File, projectId: string): Promise<ImportResult> {
    try {
      const data = await this.readExcelFile(file)
      const sheet = data.Sheets[data.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(sheet)

      const supabase = createClient()

      // Récupérer les produits existants pour validation
      const { data: products } = await supabase
        .from('products_services')
        .select('id, name')
        .eq('project_id', projectId)

      const projections = []
      const errors: ImportError[] = []

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i] as any
        const rowNum = i + 2

        try {
          const projection = this.validateSalesProjection(row, rowNum, products || [])
          if (projection) {
            projections.push({
              ...projection,
              project_id: projectId
            })
          }
        } catch (error: any) {
          errors.push({
            row: rowNum,
            field: 'general',
            message: error.message
          })
        }
      }

      if (projections.length > 0) {
        const { data: insertedData, error } = await supabase
          .from('sales_projections')
          .insert(projections)
          .select()

        if (error) {
          throw error
        }

        return {
          success: true,
          imported: projections.length,
          errors,
          data: insertedData
        }
      }

      return {
        success: false,
        imported: 0,
        errors: errors.length > 0 ? errors : [{ row: 0, field: 'general', message: 'Aucune donnée valide trouvée' }]
      }

    } catch (error: any) {
      return {
        success: false,
        imported: 0,
        errors: [{ row: 0, field: 'general', message: error.message }]
      }
    }
  }

  static async importOpex(file: File, projectId: string): Promise<ImportResult> {
    try {
      const data = await this.readExcelFile(file)
      const sheet = data.Sheets[data.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(sheet)

      const opexItems = []
      const errors: ImportError[] = []

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i] as any
        const rowNum = i + 2

        try {
          const opex = this.validateOpex(row, rowNum)
          if (opex) {
            opexItems.push({
              ...opex,
              project_id: projectId
            })
          }
        } catch (error: any) {
          errors.push({
            row: rowNum,
            field: 'general',
            message: error.message
          })
        }
      }

      if (opexItems.length > 0) {
        const supabase = createClient()
        const { data: insertedData, error } = await supabase
          .from('opex')
          .insert(opexItems)
          .select()

        if (error) {
          throw error
        }

        return {
          success: true,
          imported: opexItems.length,
          errors,
          data: insertedData
        }
      }

      return {
        success: false,
        imported: 0,
        errors: errors.length > 0 ? errors : [{ row: 0, field: 'general', message: 'Aucune donnée valide trouvée' }]
      }

    } catch (error: any) {
      return {
        success: false,
        imported: 0,
        errors: [{ row: 0, field: 'general', message: error.message }]
      }
    }
  }

  static async importCapex(file: File, projectId: string): Promise<ImportResult> {
    try {
      const data = await this.readExcelFile(file)
      const sheet = data.Sheets[data.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(sheet)

      const capexItems = []
      const errors: ImportError[] = []

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i] as any
        const rowNum = i + 2

        try {
          const capex = this.validateCapex(row, rowNum)
          if (capex) {
            capexItems.push({
              ...capex,
              project_id: projectId
            })
          }
        } catch (error: any) {
          errors.push({
            row: rowNum,
            field: 'general',
            message: error.message
          })
        }
      }

      if (capexItems.length > 0) {
        const supabase = createClient()
        const { data: insertedData, error } = await supabase
          .from('capex')
          .insert(capexItems)
          .select()

        if (error) {
          throw error
        }

        return {
          success: true,
          imported: capexItems.length,
          errors,
          data: insertedData
        }
      }

      return {
        success: false,
        imported: 0,
        errors: errors.length > 0 ? errors : [{ row: 0, field: 'general', message: 'Aucune donnée valide trouvée' }]
      }

    } catch (error: any) {
      return {
        success: false,
        imported: 0,
        errors: [{ row: 0, field: 'general', message: error.message }]
      }
    }
  }

  // Méthodes de validation
  private static validateProduct(row: any, rowNum: number) {
    const getName = (row: any) => row['Nom'] || row['Name'] || row['nom'] || row['name']
    const getPrice = (row: any) => row['Prix'] || row['Prix unitaire'] || row['Price'] || row['Unit Price'] || row['prix'] || row['price']
    const getCost = (row: any) => row['Coût'] || row['Coût unitaire'] || row['Cost'] || row['Unit Cost'] || row['cout'] || row['cost']
    const getUnit = (row: any) => row['Unité'] || row['Unit'] || row['unite'] || row['unit'] || 'unité'

    const name = getName(row)
    const price = parseFloat(getPrice(row)) || 0
    const cost = parseFloat(getCost(row)) || 0
    const unit = getUnit(row)

    if (!name || name.trim() === '') {
      throw new Error('Nom du produit requis')
    }

    if (price <= 0) {
      throw new Error('Prix unitaire doit être > 0')
    }

    return {
      name: name.trim(),
      unit_price: price,
      unit_cost: cost,
      unit: unit
    }
  }

  private static validateSalesProjection(row: any, rowNum: number, products: any[]) {
    const getProductName = (row: any) => row['Produit'] || row['Product'] || row['produit'] || row['product']
    const getYear = (row: any) => parseInt(row['Année'] || row['Year'] || row['annee'] || row['year'])
    const getMonth = (row: any) => parseInt(row['Mois'] || row['Month'] || row['mois'] || row['month'])
    const getVolume = (row: any) => parseFloat(row['Volume'] || row['volume'] || row['Quantité'] || row['quantity']) || 0

    const productName = getProductName(row)
    const year = getYear(row)
    const month = getMonth(row)
    const volume = getVolume(row)

    if (!productName) {
      throw new Error('Nom du produit requis')
    }

    const product = products.find(p => p.name.toLowerCase() === productName.toLowerCase())
    if (!product) {
      throw new Error(`Produit "${productName}" non trouvé`)
    }

    if (!year || year < 2020 || year > 2050) {
      throw new Error('Année invalide (2020-2050)')
    }

    if (!month || month < 1 || month > 12) {
      throw new Error('Mois invalide (1-12)')
    }

    if (volume < 0) {
      throw new Error('Volume ne peut pas être négatif')
    }

    return {
      product_id: product.id,
      year,
      month,
      volume
    }
  }

  private static validateOpex(row: any, rowNum: number) {
    const getName = (row: any) => row['Nom'] || row['Name'] || row['nom'] || row['name']
    const getAmount = (row: any) => parseFloat(row['Montant'] || row['Amount'] || row['montant'] || row['amount']) || 0
    const getFrequency = (row: any) => row['Fréquence'] || row['Frequency'] || row['frequence'] || row['frequency'] || 'monthly'
    const getCategory = (row: any) => row['Catégorie'] || row['Category'] || row['categorie'] || row['category'] || 'autres'
    const getStartYear = (row: any) => parseInt(row['Année début'] || row['Start Year'] || row['annee_debut'] || row['start_year']) || new Date().getFullYear()

    const name = getName(row)
    const amount = getAmount(row)
    const frequency = getFrequency(row)
    const category = getCategory(row)
    const startYear = getStartYear(row)

    if (!name || name.trim() === '') {
      throw new Error('Nom de la charge requis')
    }

    if (amount <= 0) {
      throw new Error('Montant doit être > 0')
    }

    const validFrequencies = ['monthly', 'quarterly', 'yearly']
    if (!validFrequencies.includes(frequency)) {
      throw new Error('Fréquence invalide (monthly, quarterly, yearly)')
    }

    return {
      name: name.trim(),
      amount,
      frequency,
      category,
      start_year: startYear,
      start_month: 1,
      escalation_rate: 0,
      description: ''
    }
  }

  private static validateCapex(row: any, rowNum: number) {
    const getName = (row: any) => row['Nom'] || row['Name'] || row['nom'] || row['name']
    const getAmount = (row: any) => parseFloat(row['Montant'] || row['Amount'] || row['montant'] || row['amount']) || 0
    const getCategory = (row: any) => row['Catégorie'] || row['Category'] || row['categorie'] || row['category'] || 'autres'
    const getPurchaseYear = (row: any) => parseInt(row['Année achat'] || row['Purchase Year'] || row['annee_achat'] || row['purchase_year']) || new Date().getFullYear()
    const getDepreciationYears = (row: any) => parseInt(row['Durée amortissement'] || row['Depreciation Years'] || row['duree_amortissement'] || row['depreciation_years']) || 5
    const getResidualValue = (row: any) => parseFloat(row['Valeur résiduelle'] || row['Residual Value'] || row['valeur_residuelle'] || row['residual_value']) || 0

    const name = getName(row)
    const amount = getAmount(row)
    const category = getCategory(row)
    const purchaseYear = getPurchaseYear(row)
    const depreciationYears = getDepreciationYears(row)
    const residualValue = getResidualValue(row)

    if (!name || name.trim() === '') {
      throw new Error('Nom de l\'investissement requis')
    }

    if (amount <= 0) {
      throw new Error('Montant doit être > 0')
    }

    if (depreciationYears <= 0 || depreciationYears > 20) {
      throw new Error('Durée d\'amortissement invalide (1-20 ans)')
    }

    if (residualValue < 0 || residualValue >= amount) {
      throw new Error('Valeur résiduelle invalide')
    }

    return {
      name: name.trim(),
      amount,
      category,
      purchase_year: purchaseYear,
      purchase_month: 1,
      depreciation_years: depreciationYears,
      depreciation_method: 'linear',
      residual_value: residualValue,
      description: ''
    }
  }

  private static async readExcelFile(file: File): Promise<XLSX.WorkBook> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const data = e.target?.result
          const workbook = XLSX.read(data, { type: 'binary' })
          resolve(workbook)
        } catch (error) {
          reject(new Error('Erreur de lecture du fichier Excel'))
        }
      }

      reader.onerror = () => {
        reject(new Error('Erreur de lecture du fichier'))
      }

      reader.readAsBinaryString(file)
    })
  }

  // Générer un template Excel pour chaque type de données
  static generateProductTemplate() {
    const template = [
      {
        'Nom': 'Pain complet',
        'Prix unitaire': 500,
        'Coût unitaire': 300,
        'Unité': 'unité'
      },
      {
        'Nom': 'Croissant',
        'Prix unitaire': 200,
        'Coût unitaire': 120,
        'Unité': 'unité'
      }
    ]

    this.downloadTemplate(template, 'Template_Produits.xlsx')
  }

  static generateSalesTemplate() {
    const template = [
      {
        'Produit': 'Pain complet',
        'Année': 2024,
        'Mois': 1,
        'Volume': 1000
      },
      {
        'Produit': 'Pain complet',
        'Année': 2024,
        'Mois': 2,
        'Volume': 1200
      }
    ]

    this.downloadTemplate(template, 'Template_Ventes.xlsx')
  }

  static generateOpexTemplate() {
    const template = [
      {
        'Nom': 'Salaire gérant',
        'Montant': 150000,
        'Fréquence': 'monthly',
        'Catégorie': 'personnel',
        'Année début': 2024
      },
      {
        'Nom': 'Loyer local',
        'Montant': 75000,
        'Fréquence': 'monthly',
        'Catégorie': 'location',
        'Année début': 2024
      }
    ]

    this.downloadTemplate(template, 'Template_OPEX.xlsx')
  }

  static generateCapexTemplate() {
    const template = [
      {
        'Nom': 'Four professionnel',
        'Montant': 2500000,
        'Catégorie': 'equipement',
        'Année achat': 2024,
        'Durée amortissement': 5,
        'Valeur résiduelle': 250000
      },
      {
        'Nom': 'Véhicule de livraison',
        'Montant': 8000000,
        'Catégorie': 'vehicules',
        'Année achat': 2024,
        'Durée amortissement': 7,
        'Valeur résiduelle': 1000000
      }
    ]

    this.downloadTemplate(template, 'Template_CAPEX.xlsx')
  }

  private static downloadTemplate(data: any[], filename: string) {
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Template')
    XLSX.writeFile(wb, filename)
  }
}