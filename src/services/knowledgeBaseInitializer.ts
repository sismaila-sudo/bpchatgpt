/**
 * Initialisation de la base de connaissances Sénégal
 * Documents officiels et données de référence
 */

import { getRagServiceInstance, Document } from './ragService'

/**
 * Documents de base à charger dans Pinecone
 */
export const SENEGAL_KNOWLEDGE_BASE: Document[] = [
  // Vision Sénégal 2050
  {
    id: 'vision-2050-overview',
    text: `Vision Sénégal 2050 - Document stratégique du gouvernement sénégalais lancé en mars 2024 sous la présidence de Bassirou Diomaye Faye.

Objectifs principaux:
1. Souveraineté alimentaire - Réduire dépendance importations, développer agriculture locale
2. Transformation numérique et digitale - Infrastructure 5G, e-gouvernement, fintech
3. Industrialisation et transformation locale - Substitution importations, zones industrielles
4. Développement du capital humain - Éducation, formation professionnelle, santé
5. Développement durable et transition écologique - Énergies renouvelables, gestion ressources
6. Renforcement des infrastructures - Routes, ports, aéroports, électrification rurale
7. Justice sociale et équité territoriale - Décentralisation, développement régions

Programmes de financement:
- FONGIP: Fonds de Garantie des Investissements Prioritaires (garanties crédit PME)
- FAISE: Fonds d'Appui à l'Investissement des Sénégalais de l'Extérieur (diaspora)
- DER: Délégation à l'Entrepreneuriat Rapide (jeunes entrepreneurs)
- ADEPME: Agence de Développement des PME (accompagnement technique)
- FONSIS: Fonds Souverain d'Investissements Stratégiques (investissements stratégiques)

Secteurs prioritaires: Agriculture, Pêche, Mining, Services numériques, Tourisme, Textile, Énergies renouvelables, BTP

Horizon: 2050 (remplace Plan Sénégal Émergent 2035)`,
    metadata: {
      source: 'Gouvernement du Sénégal',
      title: 'Vision Sénégal 2050 - Document stratégique',
      category: 'politique-economique',
      year: 2024,
      url: 'https://www.sec.gouv.sn/vision-senegal-2050',
      reliability: 'high'
    }
  },

  // Indicateurs économiques ANSD
  {
    id: 'ansd-economic-indicators-2024',
    text: `Indicateurs économiques Sénégal 2024 - Agence Nationale de la Statistique et de la Démographie (ANSD)

PIB et croissance:
- Croissance PIB: 4.8% (2024)
- Inflation: 3.0% (2024)
- PIB par habitant: 1,607 USD (estimation 2024)

Démographie:
- Population totale: 18 millions d'habitants (2024)
- Population urbaine: 48% (en augmentation)
- Population < 35 ans: 70%
- Taux de croissance démographique: 2.7%/an

Emploi:
- Taux de chômage: 16%
- Secteur informel: 55% de l'emploi
- Population active: 60% de la population totale

Secteurs économiques (contribution PIB):
- Agriculture: 16%
- Services: 58%
- Industrie: 26%

Commerce extérieur:
- Principales exportations: Phosphates, poisson, arachides, or
- Principales importations: Pétrole, produits alimentaires, biens d'équipement
- Balance commerciale: déficit 12% du PIB`,
    metadata: {
      source: 'ANSD',
      title: 'Indicateurs économiques Sénégal 2024',
      category: 'statistiques',
      year: 2024,
      url: 'https://ansd.sn',
      reliability: 'high'
    }
  },

  // Données BCEAO
  {
    id: 'bceao-banking-rates-2024',
    text: `Taux et normes bancaires UEMOA/BCEAO 2024 - Banque Centrale des États de l'Afrique de l'Ouest

Taux directeurs:
- Taux directeur BCEAO: 3.5%
- Taux minimum crédit bancaire: 8%
- Taux maximum crédit bancaire: 12%
- Taux moyen crédit PME: 10%

Réserves obligatoires: 3.0% des dépôts

Ratios prudentiels:
- DSCR minimum (Debt Service Coverage Ratio): 1.3x
- Ratio de solvabilité minimum: 8%
- Ratio d'endettement maximum: Dette/Fonds propres < 3.0
- Liquidité générale minimum: 1.0

Garanties standards:
- Hypothèque pour crédit immobilier
- Nantissement équipements/stocks
- Caution solidaire dirigeants
- Domiciliation irrévocable des revenus

Durées crédit typiques:
- Crédit investissement: 5-7 ans
- Crédit immobilier: 10-15 ans
- Crédit exploitation: 12 mois renouvelables
- Crédit équipement: 3-5 ans

Monnaie: FCFA (XOF) - Parité fixe avec Euro (1 EUR = 655.957 FCFA)

Pays membres UEMOA: Bénin, Burkina Faso, Côte d'Ivoire, Guinée-Bissau, Mali, Niger, Sénégal, Togo`,
    metadata: {
      source: 'BCEAO',
      title: 'Taux et normes bancaires UEMOA 2024',
      category: 'finance',
      year: 2024,
      url: 'https://www.bceao.int',
      reliability: 'high'
    }
  },

  // Fiscalité Sénégal
  {
    id: 'senegal-taxation-2024',
    text: `Système fiscal sénégalais 2024

Impôts sur les sociétés:
- Taux normal IS: 30%
- Taux réduit PME (CA < 500M FCFA): 25%
- Minimum d'impôt forfaitaire: 0.5% du CA

TVA:
- Taux normal: 18%
- Taux réduit (produits de première nécessité): 0%
- Seuil assujettissement: 50 millions FCFA CA annuel

Charges sociales employeur:
- IPRES (retraite): 14% du salaire brut
- IPM (santé): 7% du salaire brut
- Accident du travail: 1-5% selon secteur
- Total charges patronales: ~24%

Salaire minimum (SMIG): 209,100 FCFA/mois (2024)

Incitations fiscales:
- Exonération IS 5 ans pour investissements > 100M FCFA (sous conditions)
- Réduction IS 50% pour zones franches industrielles
- Crédit d'impôt formation professionnelle

Taxes locales:
- Taxe foncière: variable selon commune
- Contribution économique locale: 10-15% du CA
- Taxe véhicules de société: selon puissance fiscale`,
    metadata: {
      source: 'Direction Générale des Impôts et Domaines',
      title: 'Fiscalité des entreprises Sénégal 2024',
      category: 'fiscalite',
      year: 2024,
      url: 'https://www.impotsetdomaines.gouv.sn',
      reliability: 'high'
    }
  },

  // Marché CEDEAO
  {
    id: 'cedeao-market-overview',
    text: `Marché CEDEAO (Communauté Économique des États de l'Afrique de l'Ouest) - Opportunités pour entreprises sénégalaises

Population totale: 400 millions d'habitants
PIB combiné: 750 milliards USD

Pays membres (15): Bénin, Burkina Faso, Cap-Vert, Côte d'Ivoire, Gambie, Ghana, Guinée, Guinée-Bissau, Libéria, Mali, Niger, Nigeria, Sénégal, Sierra Leone, Togo

Libre circulation:
- Marchandises: Tarif extérieur commun (TEC)
- Personnes: Libre circulation citoyens CEDEAO
- Capitaux: En cours d'harmonisation

Monnaies:
- FCFA (8 pays zone UEMOA dont Sénégal)
- Naira (Nigeria)
- Cedi (Ghana)
- Autres monnaies nationales

Secteurs porteurs export intra-CEDEAO:
- Produits alimentaires transformés
- Matériaux de construction
- Textiles et confection
- Produits pharmaceutiques
- Services numériques

Défis:
- Infrastructure transport (routes, ports)
- Barrières non tarifaires
- Harmonisation réglementaire
- Financement commerce transfrontalier

Opportunités Sénégal:
- Hub logistique (Port de Dakar)
- Exportations produits transformés vers Nigeria/Ghana
- Services bancaires et assurance
- Technologies numériques (hub Dakar)`,
    metadata: {
      source: 'CEDEAO',
      title: 'Marché CEDEAO - Guide export',
      category: 'commerce-international',
      year: 2024,
      url: 'https://www.ecowas.int',
      reliability: 'high'
    }
  },

  // Secteur BTP Sénégal
  {
    id: 'senegal-btp-sector-2024',
    text: `Secteur BTP (Bâtiment et Travaux Publics) Sénégal 2024

Taille du marché: ~1,500 milliards FCFA (2.3 milliards EUR)
Croissance annuelle: 6-8%

Grands projets en cours:
- Train Express Régional (TER) extensions
- Autoroute Dakar-Saint-Louis
- Nouvel aéroport international Blaise Diagne (développements)
- Programme 100,000 logements
- Zones économiques spéciales (infrastructure)

Acteurs principaux:
- Entreprises publiques: AGEROUTE, ADM
- Grands groupes privés: Eiffage Sénégal, COLAS Sénégal, SOGEA-SATOM
- PME locales: Nombreuses entreprises construction/finition
- Importateurs matériaux: Ciments, fer à béton, équipements

Coûts moyens (2024):
- Main d'œuvre qualifiée: 150,000-300,000 FCFA/mois
- Main d'œuvre non qualifiée: SMIG (209,100 FCFA/mois)
- Ciment (tonne): 75,000-85,000 FCFA
- Fer à béton (tonne): 450,000-550,000 FCFA
- Location échafaudage: 15,000-25,000 FCFA/mois/m²

Défis:
- Coût matériaux importés (80% importations)
- Qualification main d'œuvre
- Financement projets (taux crédit élevés)
- Respect normes sécurité

Opportunités:
- Demande logement classe moyenne
- Infrastructure Vision 2050
- Développement villes secondaires
- Énergies renouvelables (panneaux solaires)`,
    metadata: {
      source: 'Ministère Urbanisme, Logement et Hygiène Publique',
      title: 'Secteur BTP Sénégal 2024',
      category: 'secteur-btp',
      year: 2024,
      url: 'https://www.urbanisme.gouv.sn',
      reliability: 'high'
    }
  }
]

/**
 * Initialiser la base de connaissances
 */
export async function initializeKnowledgeBase(): Promise<void> {
  const ragService = getRagServiceInstance()
  if (!ragService.isAvailable()) {
    console.warn('⚠️ RAG Service non disponible - skip initialisation')
    return
  }

  console.log('🚀 Initialisation base de connaissances Sénégal...')

  try {
    const stats = await ragService.getStats()

    if (stats.vectorCount === 0) {
      console.log('📚 Chargement documents initiaux...')
      await ragService.addDocuments(SENEGAL_KNOWLEDGE_BASE)
      console.log('✅ Base de connaissances initialisée')
    } else {
      console.log(`✅ Base déjà initialisée (${stats.vectorCount} documents)`)
    }
  } catch (error) {
    console.error('❌ Erreur initialisation base:', error)
  }
}
