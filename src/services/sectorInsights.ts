/**
 * Mapping secteur → Insights spécifiques pour l'IA
 *
 * Enrichit les prompts IA avec des questions, défis et opportunités
 * adaptés à chaque secteur d'activité au Sénégal.
 *
 * OBJECTIF: Rendre l'IA plus pertinente et contextuelle
 * UTILISATION: Injecté dans buildPrompt() de businessPlanAI.ts
 * NON-INTRUSIF: Aucune modification des données utilisateur
 */

export interface SectorInsight {
  label: string
  keyQuestions: string[]
  specificChallenges: string[]
  opportunities: string[]
  keyMetrics: string[]
}

export const SECTOR_INSIGHTS: Record<string, SectorInsight> = {
  // ========================================
  // 🌾 AGRICULTURE & PÊCHE
  // ========================================
  agriculture: {
    label: 'Agriculture & Maraîchage',
    keyQuestions: [
      'Quelles cultures ou produits cultivez-vous (légumes, céréales, fruits) ?',
      'Quelle superficie exploitez-vous (en hectares) ?',
      'Quel est le cycle de production (saisonnier, continu, rotation) ?',
      'Avez-vous accès à l\'irrigation (puits, forages, système goutte-à-goutte) ?',
      'Quelle est votre stratégie de commercialisation (vente directe, coopérative, grossistes) ?',
      'Utilisez-vous des intrants (engrais, pesticides) ? Lesquels ?'
    ],
    specificChallenges: [
      'Accès à l\'eau et irrigation fiable',
      'Variabilité climatique et saisonnalité',
      'Accès aux semences de qualité certifiée',
      'Stockage et conservation des récoltes',
      'Transport rapide vers les marchés urbains',
      'Fluctuation des prix au marché',
      'Financement des campagnes agricoles'
    ],
    opportunities: [
      'Programme national d\'autosuffisance alimentaire (riz, oignon, arachide)',
      'Demande croissante des zones urbaines (Dakar, Thiès)',
      'Export vers CEDEAO (tomates, oignons, fruits)',
      'Transformation locale (séchage, jus, conserves)',
      'Agriculture biologique (segment premium)',
      'Appui de l\'ANCAR et des projets PASA',
      'Accès aux intrants subventionnés (CNAAS)'
    ],
    keyMetrics: [
      'Rendement par hectare (kg/ha ou t/ha)',
      'Coût de production par unité (FCFA/kg)',
      'Taux de perte post-récolte (%)',
      'Délai de rotation des cultures (jours)',
      'Marge brute par campagne'
    ]
  },

  elevage: {
    label: 'Élevage',
    keyQuestions: [
      'Quel type d\'élevage pratiquez-vous (bovins, ovins, volaille, porcin) ?',
      'Quelle est la taille de votre cheptel ?',
      'Quel système d\'élevage utilisez-vous (intensif, semi-intensif, extensif) ?',
      'Avez-vous un vétérinaire attitré ou accès à des services vétérinaires ?',
      'Comment gérez-vous l\'alimentation du bétail ?'
    ],
    specificChallenges: [
      'Coût élevé de l\'aliment bétail',
      'Maladies animales et vaccination',
      'Transhumance et gestion de pâturages',
      'Accès aux services vétérinaires',
      'Commercialisation (circuits informels dominants)'
    ],
    opportunities: [
      'Forte demande locale (viande, lait, œufs)',
      'Import-substitution (lait en poudre, viande congelée)',
      'Transformation (yaourt, fromage, charcuterie)',
      'Appui PRODAM et programmes d\'appui à l\'élevage',
      'Marchés urbains et supermarchés'
    ],
    keyMetrics: [
      'Taux de mortalité du cheptel (%)',
      'Gain moyen quotidien (GMQ) pour bovins',
      'Taux de ponte pour volaille (%)',
      'Indice de consommation (IC)',
      'Coût alimentaire par kg de viande produit'
    ]
  },

  peche: {
    label: 'Pêche & Aquaculture',
    keyQuestions: [
      'Type d\'activité : pêche artisanale, industrielle ou aquaculture ?',
      'Quelles espèces ciblez-vous ?',
      'Disposez-vous d\'embarcations ou de bassins d\'élevage ?',
      'Comment conservez-vous les prises (glace, chambre froide) ?'
    ],
    specificChallenges: [
      'Raréfaction des ressources halieutiques',
      'Coût élevé du carburant',
      'Chaîne du froid déficiente',
      'Concurrence des bateaux industriels',
      'Licences et permis de pêche'
    ],
    opportunities: [
      'Demande locale forte (thiéboudienne, yassa)',
      'Aquaculture en développement (tilapia, crevettes)',
      'Export vers Europe (mérous, crevettes)',
      'Transformation (poisson séché, fumé)',
      'Appui du PAPIL et CRODT'
    ],
    keyMetrics: [
      'Poids moyen de capture par sortie (kg)',
      'Coût carburant par kg pêché',
      'Taux de survie (aquaculture)',
      'Prix moyen de vente au kg'
    ]
  },

  transformation_agricole: {
    label: 'Transformation Agricole',
    keyQuestions: [
      'Quelles matières premières transformez-vous ?',
      'Quelle capacité de production avez-vous (tonnes/jour) ?',
      'Disposez-vous d\'équipements (décortiqueuse, broyeur, extracteur) ?',
      'Quels produits finis commercialisez-vous ?'
    ],
    specificChallenges: [
      'Approvisionnement régulier en matières premières',
      'Coût élevé de l\'énergie (électricité)',
      'Normes sanitaires et certification',
      'Emballage et conservation',
      'Accès aux circuits de distribution'
    ],
    opportunities: [
      'Valorisation produits locaux (bissap, tamarin, fruits)',
      'Demande croissante produits transformés',
      'Export vers diaspora et CEDEAO',
      'Labels (bio, commerce équitable)',
      'Appui ITA et CFPA'
    ],
    keyMetrics: [
      'Taux de rendement matière (% produit fini/matière brute)',
      'Coût de transformation par kg',
      'Durée de conservation produits finis',
      'Marge sur valeur ajoutée'
    ]
  },

  // ========================================
  // 🏗️ INDUSTRIE & CONSTRUCTION
  // ========================================
  construction: {
    label: 'Bâtiment & Travaux Publics (BTP)',
    keyQuestions: [
      'Quel type de chantier réalisez-vous (construction neuve, rénovation, génie civil) ?',
      'Quelle est la taille moyenne de vos projets (budget, durée) ?',
      'Quels sont vos clients principaux (État, privés, particuliers) ?',
      'Disposez-vous de matériel propre ou louez-vous ?',
      'Combien d\'équipes ou d\'ouvriers gérez-vous ?'
    ],
    specificChallenges: [
      'Délais de paiement très longs (surtout marchés publics)',
      'Concurrence informelle (tâcherons non déclarés)',
      'Fluctuation des prix des matériaux (ciment, fer)',
      'Trésorerie tendue (avances de fonds)',
      'Pénuries de main-d\'œuvre qualifiée',
      'Accidents de travail et sécurité chantier',
      'Respect des délais contractuels'
    ],
    opportunities: [
      'Croissance urbaine rapide (Dakar, Thiès, Mbour)',
      'Grands projets infrastructures (TER, autoroutes, ports)',
      'Programme 100 000 logements',
      'Réhabilitation bâtiments publics',
      'Demande croissante en équipements de sécurité',
      'Partenariats avec promoteurs immobiliers',
      'Accès aux marchés AGEROUTE, APIX'
    ],
    keyMetrics: [
      'Taux d\'utilisation du matériel (%)',
      'Marge brute par chantier (%)',
      'Nombre de projets actifs simultanément',
      'Délai moyen de paiement clients (jours)',
      'Taux d\'accidents de travail',
      'Respect des délais (% projets livrés à temps)'
    ]
  },

  materiaux: {
    label: 'Matériaux de Construction',
    keyQuestions: [
      'Quels matériaux vendez-vous (ciment, fer, sable, gravier, peinture) ?',
      'Disposez-vous d\'un point de vente fixe ou livrez-vous ?',
      'Quelle est votre capacité de stockage ?',
      'Travaillez-vous avec des grossistes ou importez-vous directement ?'
    ],
    specificChallenges: [
      'Fluctuation des prix mondiaux (fer, ciment)',
      'Coût du transport et logistique',
      'Concurrence des carrières informelles',
      'Crédit clients (délais paiement)',
      'Stockage et gestion des invendus'
    ],
    opportunities: [
      'Boom immobilier au Sénégal',
      'Partenariats avec entreprises BTP',
      'Vente en ligne et livraison',
      'Diversification (quincaillerie, sanitaire)'
    ],
    keyMetrics: [
      'Rotation des stocks (jours)',
      'Marge commerciale par catégorie (%)',
      'Coût logistique par tonne livrée',
      'Taux de créances impayées'
    ]
  },

  // ========================================
  // 🛒 COMMERCE & DISTRIBUTION
  // ========================================
  commerce_detail: {
    label: 'Commerce de Détail',
    keyQuestions: [
      'Quels produits vendez-vous (alimentaire, textile, électronique, etc.) ?',
      'Quel est votre emplacement (marché, boutique, rue, en ligne) ?',
      'Comment gérez-vous vos stocks et approvisionnements ?',
      'Avez-vous une stratégie omnicanal (physique + e-commerce) ?',
      'Quel est votre panier moyen actuel ?'
    ],
    specificChallenges: [
      'Concurrence féroce du secteur informel',
      'Pouvoir d\'achat limité de la clientèle',
      'Gestion de trésorerie et rotation des stocks',
      'Loyers commerciaux élevés (emplacements prisés)',
      'Coupures électriques (conservation produits)',
      'Vol et démarque inconnue',
      'Crédits clients (gestion impayés)'
    ],
    opportunities: [
      'Croissance de la classe moyenne urbaine',
      'Émergence de l\'e-commerce local (Jumia, Promo, Senfacile)',
      'Partenariats avec grossistes et fournisseurs',
      'Digitalisation (paiement mobile, gestion stocks)',
      'Ouverture de centres commerciaux modernes',
      'Programmes de fidélisation clients'
    ],
    keyMetrics: [
      'Panier moyen (FCFA/transaction)',
      'Rotation des stocks (jours)',
      'Marge commerciale (%)',
      'Taux de conversion (% visiteurs → acheteurs)',
      'Trafic en magasin (clients/jour)',
      'Taux de fidélisation client'
    ]
  },

  commerce_gros: {
    label: 'Commerce de Gros',
    keyQuestions: [
      'Quels produits distribuez-vous en gros ?',
      'Quelle est votre zone de chalandise (régionale, nationale, CEDEAO) ?',
      'Disposez-vous d\'entrepôts et de véhicules de livraison ?',
      'Quels sont vos clients (détaillants, institutions, entreprises) ?'
    ],
    specificChallenges: [
      'Besoin en fonds de roulement important',
      'Risque de créances clients',
      'Logistique et transport (coûts, délais)',
      'Stockage (surface, sécurité)',
      'Concurrence des importateurs directs'
    ],
    opportunities: [
      'Distribution vers zones rurales mal desservies',
      'Partenariats avec producteurs locaux',
      'Export CEDEAO (Mali, Guinée, Gambie)',
      'Digitalisation de la chaîne d\'approvisionnement'
    ],
    keyMetrics: [
      'Chiffre d\'affaires par client (FCFA)',
      'Marge brute (%)',
      'Délai moyen de paiement clients (jours)',
      'Coût logistique (% CA)',
      'Taux de rotation des stocks'
    ]
  },

  import_export: {
    label: 'Import-Export',
    keyQuestions: [
      'Quels produits importez/exportez-vous ?',
      'Vers/depuis quels pays travaillez-vous ?',
      'Disposez-vous d\'agréments douaniers et de transitaires ?',
      'Comment financez-vous vos opérations (crédit documentaire, avance) ?'
    ],
    specificChallenges: [
      'Formalités douanières complexes',
      'Risque de change (FCFA/USD/EUR)',
      'Délais de paiement et financement',
      'Contrôles qualité et normes',
      'Coûts portuaires et frais de transit'
    ],
    opportunities: [
      'Position stratégique du port de Dakar',
      'Accès CEDEAO (15 pays, 400M habitants)',
      'Export produits transformés vers Europe',
      'Digitalisation des démarches (Gainde 2000)',
      'Partenariats avec chambres de commerce'
    ],
    keyMetrics: [
      'Valeur moyenne par conteneur (FCFA)',
      'Délai moyen de dédouanement (jours)',
      'Marge commerciale par transaction (%)',
      'Coût logistique total (%)',
      'Taux de conformité douanière'
    ]
  },

  // ========================================
  // 🏨 SERVICES & TOURISME
  // ========================================
  tourisme: {
    label: 'Tourisme & Hôtellerie',
    keyQuestions: [
      'Quelle est votre capacité d\'accueil (nombre de chambres/lits) ?',
      'Ciblez-vous les touristes nationaux, internationaux ou d\'affaires ?',
      'Quelle est votre période de haute saison ?',
      'Quelles activités annexes proposez-vous (restauration, excursions, spa) ?',
      'Avez-vous des partenariats avec des tours opérateurs ?'
    ],
    specificChallenges: [
      'Saisonnalité forte (novembre-mai haute saison)',
      'Concurrence des plateformes en ligne (Booking, Airbnb)',
      'Formation du personnel (langues, service client)',
      'Normes de classification touristique',
      'Promotion à l\'international',
      'Sécurité et image du Sénégal',
      'Coûts énergétiques (climatisation, eau chaude)'
    ],
    opportunities: [
      'Tourisme culturel et mémoriel (Gorée, Saint-Louis, patrimoine)',
      'Écotourisme (parcs nationaux, Casamance)',
      'Tourisme d\'affaires (CICAD, conférences, événements)',
      'Diaspora sénégalaise (retours vacances)',
      'Promotion via Ministère Tourisme et SAPCO',
      'Événements internationaux (Biennale, FIDAK)'
    ],
    keyMetrics: [
      'Taux d\'occupation (%)',
      'Revenu par chambre disponible - RevPAR (FCFA)',
      'Durée moyenne de séjour (nuits)',
      'Taux de satisfaction client (avis en ligne)',
      'Coût d\'acquisition client (CAC)',
      'Taux de réservation directe vs OTA'
    ]
  },

  transport: {
    label: 'Transport',
    keyQuestions: [
      'Quel type de transport proposez-vous (personnes, marchandises, urbain, interurbain) ?',
      'Quelle est la taille de votre flotte ?',
      'Êtes-vous en location ou propriétaire de vos véhicules ?',
      'Disposez-vous d\'une licence de transport ou d\'un agrément ?'
    ],
    specificChallenges: [
      'Coût élevé du carburant',
      'Entretien et réparations véhicules',
      'Concurrence informelle (clandos)',
      'État des routes (dégradation, trafic)',
      'Assurance et sinistres',
      'Réglementation (carte grise, visite technique)'
    ],
    opportunities: [
      'Croissance urbaine (Dakar, banlieue)',
      'E-commerce et livraisons (last-mile delivery)',
      'Transport scolaire et personnel entreprises',
      'Partenariats avec plateformes (Yango, Heetch)',
      'Transport de marchandises CEDEAO'
    ],
    keyMetrics: [
      'Taux d\'utilisation de la flotte (%)',
      'Coût au kilomètre (FCFA/km)',
      'Chiffre d\'affaires par véhicule/mois',
      'Nombre de pannes ou immobilisations',
      'Taux de satisfaction client'
    ]
  },

  // ========================================
  // 💻 TECHNOLOGIES & DIGITAL
  // ========================================
  technologies: {
    label: 'Technologies & Digital',
    keyQuestions: [
      'Quel type de solution développez-vous (web, mobile, SaaS, matériel) ?',
      'Qui sont vos clients cibles (B2C, B2B, B2G) ?',
      'Quel est votre modèle de revenus (abonnement, licence, commission) ?',
      'Disposez-vous d\'une équipe technique en interne ?'
    ],
    specificChallenges: [
      'Coût d\'acquisition client (CAC) élevé',
      'Infrastructure internet limitée (zones rurales)',
      'Piratage et sécurité des données',
      'Talents tech rares et coûteux',
      'Financement (investisseurs, VC rares)'
    ],
    opportunities: [
      'Digitalisation accélérée (gouvernement, entreprises)',
      'Pénétration mobile >100%',
      'Jeunesse connectée et dynamique',
      'Hub tech émergent (Dakar, Yoff Tech Hub)',
      'Programmes d\'appui (CTIC, ADIE, Jokkolabs)',
      'Marché CEDEAO sous-digitalisé'
    ],
    keyMetrics: [
      'Coût d\'acquisition client (CAC)',
      'Valeur vie client (LTV)',
      'Taux de rétention (%)',
      'Monthly Recurring Revenue (MRR)',
      'Taux de conversion'
    ]
  },

  fintech: {
    label: 'Fintech',
    keyQuestions: [
      'Quelle solution fintech proposez-vous (paiement, crédit, épargne, assurance) ?',
      'Êtes-vous agréé par la BCEAO ou en partenariat avec une institution financière ?',
      'Quelle est votre stratégie d\'acquisition client ?',
      'Comment gérez-vous la sécurité et la conformité KYC/AML ?',
      'Quels canaux utilisez-vous (mobile, web, agents physiques) ?'
    ],
    specificChallenges: [
      'Réglementation BCEAO très stricte (agrément, capital minimum)',
      'Concurrence des opérateurs mobiles (Orange Money, Wave, Free Money)',
      'Coût d\'acquisition client élevé',
      'Infrastructure réseau (zones rurales)',
      'Éducation financière des utilisateurs',
      'Fraudes et sécurité des transactions',
      'Partenariats bancaires complexes'
    ],
    opportunities: [
      'Forte pénétration du mobile (>100%)',
      'Population jeune et connectée',
      'Inclusion financière (60% non bancarisés)',
      'Digitalisation des paiements (salaires, factures)',
      'Marché UEMOA (8 pays, 130M habitants)',
      'Programmes d\'appui (BCEAO, Banque Mondiale)',
      'Remittances diaspora (2Mds USD/an)'
    ],
    keyMetrics: [
      'Nombre d\'utilisateurs actifs (DAU, MAU)',
      'Volume de transactions (FCFA/mois)',
      'Coût d\'acquisition client (CAC)',
      'Valeur vie client (LTV)',
      'Taux de fraude (%)',
      'Taux de conversion'
    ]
  },

  e_commerce: {
    label: 'E-commerce',
    keyQuestions: [
      'Quels produits vendez-vous en ligne ?',
      'Quelle plateforme utilisez-vous (site propre, marketplace, réseaux sociaux) ?',
      'Comment gérez-vous la logistique et les livraisons ?',
      'Quels modes de paiement acceptez-vous ?',
      'Quelle est votre zone de livraison ?'
    ],
    specificChallenges: [
      'Confiance limitée dans paiement en ligne',
      'Logistique du dernier kilomètre',
      'Taux de retour et annulations',
      'Coût de livraison élevé',
      'Concurrence des marketplaces (Jumia, Promo)'
    ],
    opportunities: [
      'Croissance rapide e-commerce Sénégal',
      'Paiement mobile généralisé',
      'Jeunesse connectée',
      'Vente via réseaux sociaux (Instagram, Facebook)',
      'Niche produits locaux et artisanat'
    ],
    keyMetrics: [
      'Taux de conversion (%)',
      'Panier moyen (FCFA)',
      'Coût acquisition client (CAC)',
      'Taux d\'abandon panier',
      'Délai moyen de livraison (jours)'
    ]
  },

  // ========================================
  // 🏥 SERVICES PROFESSIONNELS
  // ========================================
  sante: {
    label: 'Santé',
    keyQuestions: [
      'Quel type d\'établissement (clinique, cabinet, pharmacie, laboratoire) ?',
      'Quels services proposez-vous ?',
      'Disposez-vous d\'autorisations du Ministère de la Santé ?',
      'Combien de professionnels de santé employez-vous ?'
    ],
    specificChallenges: [
      'Coût élevé des équipements médicaux',
      'Pénurie de personnel qualifié',
      'Réglementation stricte',
      'Paiement patients (assurance vs cash)',
      'Concurrence hôpitaux publics subventionnés'
    ],
    opportunities: [
      'Demande croissante soins de qualité',
      'Tourisme médical',
      'Partenariats assurances et mutuelles',
      'Télémédecine',
      'Services à domicile'
    ],
    keyMetrics: [
      'Nombre de consultations/jour',
      'Taux d\'occupation (lits)',
      'Revenu moyen par patient',
      'Taux de satisfaction patient'
    ]
  },

  education: {
    label: 'Éducation',
    keyQuestions: [
      'Quel niveau enseignez-vous (préscolaire, primaire, secondaire, supérieur) ?',
      'Quelle est votre capacité d\'accueil ?',
      'Proposez-vous un programme spécifique (bilingue, religieux, international) ?',
      'Disposez-vous d\'une autorisation d\'ouverture ?'
    ],
    specificChallenges: [
      'Recrutement enseignants qualifiés',
      'Infrastructures (salles, équipements)',
      'Concurrence écoles publiques gratuites',
      'Paiement frais de scolarité (retards, impayés)',
      'Respect programmes officiels'
    ],
    opportunities: [
      'Demande forte pour éducation de qualité',
      'Classes surchargées dans public',
      'Offres bilingues et internationales',
      'E-learning et cours en ligne',
      'Soutien scolaire et formations pros'
    ],
    keyMetrics: [
      'Taux d\'inscription (%)',
      'Ratio élèves/enseignant',
      'Taux de réussite aux examens (%)',
      'Taux d\'impayés frais scolarité'
    ]
  },

  formation: {
    label: 'Formation & Éducation Professionnelle',
    keyQuestions: [
      'Quels types de formations proposez-vous (technique, professionnelle, continue) ?',
      'Êtes-vous agréé par l\'État ou certifié ?',
      'Quels sont vos débouchés pour les apprenants ?',
      'Proposez-vous des formations en ligne ou en présentiel ?'
    ],
    specificChallenges: [
      'Adéquation formation-emploi',
      'Concurrence centres publics (3FPT, CFPT)',
      'Financement apprenants',
      'Mise à jour contenus pédagogiques',
      'Insertion professionnelle diplômés'
    ],
    opportunities: [
      'Forte demande compétences techniques',
      'Partenariats entreprises (stages, embauches)',
      'Programmes gouvernementaux (PROMOJEUNES, ANPEJ)',
      'Formation continue salariés',
      'Certifications internationales'
    ],
    keyMetrics: [
      'Nombre d\'apprenants formés/an',
      'Taux d\'insertion professionnelle (%)',
      'Taux de satisfaction apprenants',
      'Revenu moyen par formation'
    ]
  },

  // ========================================
  // 🌍 AUTRES SECTEURS
  // ========================================
  autres: {
    label: 'Autres secteurs',
    keyQuestions: [
      'Décrivez précisément votre activité',
      'Qui sont vos clients cibles ?',
      'Quels sont vos produits ou services principaux ?',
      'Quelle est votre proposition de valeur unique ?'
    ],
    specificChallenges: [
      'Définir clairement votre positionnement',
      'Identifier les barrières à l\'entrée',
      'Structurer votre offre',
      'Trouver vos premiers clients'
    ],
    opportunities: [
      'Innovation et différenciation',
      'Niches de marché inexploitées',
      'Partenariats stratégiques',
      'Digitalisation de votre secteur'
    ],
    keyMetrics: [
      'Chiffre d\'affaires mensuel',
      'Nombre de clients',
      'Taux de croissance',
      'Marge opérationnelle'
    ]
  }
}
