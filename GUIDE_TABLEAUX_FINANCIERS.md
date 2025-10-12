# 📊 GUIDE D'UTILISATION : TABLEAUX FINANCIERS PROFESSIONNELS

## Vue d'ensemble

Le système de tableaux financiers de BP Design Pro génère **6 tableaux professionnels** conformes aux standards **FONGIP** et **bancaires sénégalais** :

1. **Compte de Résultat Prévisionnel** (CA, EBE, Résultat Net)
2. **Tableau des Charges Détaillé** (charges externes et personnel)
3. **Plan d'Amortissement** (avec VNC)
4. **Bilan Prévisionnel** (Actif/Passif équilibré)
5. **Plan de Trésorerie Mensuel** (Année 1)
6. **Calculs BFR/FDR/TN** (analyse du fonds de roulement)

---

## 🚀 WORKFLOW COMPLET

### ÉTAPE 1 : Remplir les Projections Financières

📍 **Navigation** : Tableau de bord projet → **"Projections Financières"**

#### 1.1 Sources de Revenus
- Ajoutez vos flux de revenus (produits/services)
- Définissez les montants annuels sur 3 ans
- Exemple : "Ventes de produits X : 5M FCFA An 1, 7M An 2, 10M An 3"

#### 1.2 Coûts d'Exploitation
- **Charges fixes** : loyer, salaires, assurances...
- **Charges variables** : matières premières, électricité...
- Renseignez les montants mensuels/annuels

#### 1.3 Investissements
- **Immobilisations corporelles** : équipements, véhicules, bâtiments
- **Immobilisations incorporelles** : logiciels, brevets
- Pour chaque investissement :
  - Nom : "Machine industrielle"
  - Montant : 2 000 000 FCFA
  - Date : 2025-01
  - Durée d'amortissement : 5 ans

#### 1.4 Financement
- **Apports en capital** : fonds propres
- **Emprunts** : prêts bancaires
  - Montant principal
  - Taux d'intérêt annuel
  - Durée (années)

---

### ÉTAPE 2 : Recalculer les Projections

📍 **Bouton** : `🔄 Recalculer` (en haut de la page Projections Financières)

**Ce qui se passe** :
- Le moteur financier calcule automatiquement :
  - Revenus nets sur 3 ans
  - Coûts totaux sur 3 ans
  - Amortissements annuels
  - Charges d'intérêts
  - Flux de trésorerie
  - Résultat net par année

**Indicateurs affichés** :
- ✅ Marge brute
- ✅ Seuil de rentabilité
- ✅ ROI (Return on Investment)
- ✅ Période de récupération

---

### ÉTAPE 3 : Exporter vers les Tableaux Financiers

📍 **Bouton** : `📊 Exporter vers Tableaux` (en haut de la page Projections Financières)

**Ce qui est généré** :

#### 📄 Tableau 1 : Compte de Résultat (3 ans)
```
ÉLÉMENTS                           An 1         An 2         An 3
────────────────────────────────────────────────────────────────
Chiffre d'affaires              5 000 000    7 000 000   10 000 000
Achats consommés               -2 000 000   -2 800 000   -4 000 000
Marge commerciale               3 000 000    4 200 000    6 000 000

Charges externes                 -500 000     -550 000     -600 000
Charges de personnel             -800 000     -850 000     -900 000
Charges sociales (24%)           -192 000     -204 000     -216 000

VALEUR AJOUTÉE                  1 508 000    2 596 000    4 284 000
EBE (Excédent Brut)               916 000    1 742 000    3 184 000

Dotations amortissements         -400 000     -400 000     -400 000
RÉSULTAT D'EXPLOITATION           516 000    1 342 000    2 784 000

Charges financières               -60 000      -48 000      -36 000
Résultat avant impôts             456 000    1 294 000    2 748 000
Impôt sociétés (30%)             -136 800     -388 200     -824 400

RÉSULTAT NET                      319 200      905 800    1 923 600
```

**Ratios calculés** :
- Taux marge EBE : 18,3% → 24,9% → 31,8%
- Taux marge nette : 6,4% → 12,9% → 19,2%

---

#### 💰 Tableau 2 : Charges Détaillées

**Charges Externes** :
- Loyer et charges : 120 000 FCFA/an
- Électricité, eau, gaz : 60 000 FCFA/an
- Télécommunications : 40 000 FCFA/an
- Assurances : 80 000 FCFA/an
- Transport/Déplacements : 100 000 FCFA/an
- Publicité/Marketing : 100 000 FCFA/an

**Charges de Personnel** :
- Direction : 1 employé → 400 000 FCFA brut/an
  - Charges sociales (24%) : 96 000 FCFA
  - Coût total : 496 000 FCFA
- Opérations : 2 employés → 300 000 FCFA brut/an
  - Charges sociales : 72 000 FCFA
  - Coût total : 372 000 FCFA

---

#### 📉 Tableau 3 : Plan d'Amortissement

**Immobilisations** :
| Immobilisation        | Valeur  | Durée | Taux | An 1 Dotation | Cumul   | VNC     |
|-----------------------|---------|-------|------|---------------|---------|---------|
| Machine industrielle  | 2M FCFA | 5 ans | 20%  | 400 000 FCFA  | 400 000 | 1 600 000|
| Véhicule de transport | 3M FCFA | 4 ans | 25%  | 750 000 FCFA  | 750 000 | 2 250 000|

**VNC** = Valeur Nette Comptable (valeur résiduelle)

---

#### ⚖️ Tableau 4 : Bilan Prévisionnel

**ACTIF** :
- **Actif Immobilisé**
  - Immobilisations corporelles (net) : 3 850 000 FCFA
- **Actif Circulant**
  - Stocks : 411 000 FCFA
  - Créances clients : 411 000 FCFA
  - Disponibilités : 500 000 FCFA
- **TOTAL ACTIF** : 5 172 000 FCFA

**PASSIF** :
- **Capitaux Propres**
  - Capital : 2 000 000 FCFA
  - Résultat exercice : 319 200 FCFA
- **Dettes**
  - Emprunts LT/MT : 2 000 000 FCFA
  - Dettes fournisseurs : 328 800 FCFA
  - Dettes fiscales/sociales : 524 000 FCFA
- **TOTAL PASSIF** : 5 172 000 FCFA

✅ **Bilan équilibré** (Actif = Passif)

---

#### 💵 Tableau 5 : Plan de Trésorerie Mensuel (An 1)

| Mois    | Encaissements | Décaissements | Flux Net  | Trésorerie Fin |
|---------|---------------|---------------|-----------|----------------|
| Janvier | 416 667       | 333 333       | +83 334   | 583 334        |
| Février | 416 667       | 333 333       | +83 334   | 666 668        |
| Mars    | 416 667       | 333 333       | +83 334   | 750 002        |
| ...     | ...           | ...           | ...       | ...            |
| Décembre| 416 667       | 333 333       | +83 334   | 1 500 008      |

**Métriques Année 1** :
- Encaissements totaux : 5 000 004 FCFA
- Décaissements totaux : 4 000 000 FCFA
- Trésorerie finale : 1 500 008 FCFA
- Mois négatifs : 0 ✅

---

#### 🔄 Tableau 6 : BFR/FDR/TN

**BFR (Besoin en Fonds de Roulement)** :
- Stocks : 164 400 FCFA (30 jours)
- Créances clients : 410 959 FCFA (30 jours)
- **Moins** Dettes fournisseurs : 328 767 FCFA (60 jours)
- **Moins** Dettes fiscales/sociales : 136 800 FCFA
- **= BFR** : 109 792 FCFA (8 jours de CA)

**FDR (Fonds de Roulement)** :
- Capitaux permanents : 2 319 200 FCFA
- **Moins** Actif immobilisé : 1 600 000 FCFA
- **= FDR** : 719 200 FCFA

**TN (Trésorerie Nette)** :
- FDR : 719 200 FCFA
- **Moins** BFR : 109 792 FCFA
- **= TN** : 609 408 FCFA ✅

**Interprétation** :
✅ Le FDR couvre le BFR. L'entreprise dispose d'une trésorerie nette positive de 609 408 FCFA.
- BFR représente 2,2% du CA (8 jours)
- TN représente 12,2% du CA

---

### ÉTAPE 4 : Consulter les Tableaux Financiers

📍 **Navigation** : Tableau de bord projet → **"Tableaux Financiers"**

**Interface** :
- 6 onglets en haut de la page
- Cliquez sur chaque onglet pour voir le tableau correspondant
- Bouton `🔄 Rafraîchir` pour recharger les données

**Fonctionnalités** :
- ✅ Affichage professionnel avec code couleur
- ✅ Calculs automatiques des ratios
- ✅ Interprétations financières
- ✅ Format conforme FONGIP/bancaire

---

## 🔧 PARAMÈTRES SÉNÉGALAIS APPLIQUÉS

Le système intègre automatiquement les paramètres économiques du Sénégal :

| Paramètre               | Valeur |
|-------------------------|--------|
| Charges sociales        | 24%    |
| Impôt sur les sociétés  | 30%    |
| Délai clients (défaut)  | 30 jours |
| Délai fournisseurs      | 60 jours |
| Rotation stocks         | 30 jours |

---

## 📋 CHECKLIST DE VALIDATION

Avant d'exporter, vérifiez que :

✅ **Revenus** :
- [ ] Tous les flux de revenus sont renseignés sur 3 ans
- [ ] Les montants sont réalistes et justifiés

✅ **Coûts** :
- [ ] Charges fixes et variables complètes
- [ ] Salaires bruts renseignés par poste
- [ ] Charges externes détaillées

✅ **Investissements** :
- [ ] Liste complète des immobilisations
- [ ] Durées d'amortissement conformes (3-10 ans)
- [ ] Dates d'acquisition précises

✅ **Financement** :
- [ ] Apport en capital défini
- [ ] Emprunts avec taux et durée
- [ ] Total financement ≥ Total investissements

---

## ❓ FAQ

### Q1 : Que faire si le bilan n'est pas équilibré ?
**R** : Un écart signifie une erreur de calcul. Vérifiez :
- Les apports en capital
- Les emprunts
- Les investissements initiaux

### Q2 : Comment modifier les tableaux après export ?
**R** : Retournez dans **"Projections Financières"**, modifiez vos données, puis cliquez à nouveau sur **"Exporter vers Tableaux"**.

### Q3 : Les tableaux sont vides ?
**R** : Vous devez d'abord :
1. Remplir les données dans "Projections Financières"
2. Cliquer sur "Recalculer"
3. Cliquer sur "Exporter vers Tableaux"

### Q4 : Puis-je exporter les tableaux en PDF ?
**R** : Oui ! Utilisez le bouton **"Exporter PDF"** dans la page "Tableaux Financiers" pour générer un document professionnel.

---

## 🎯 CONFORMITÉ FONGIP

Les tableaux générés respectent les exigences FONGIP :

✅ Compte de résultat avec EBE et Valeur Ajoutée
✅ Bilan actif/passif équilibré
✅ Plan d'amortissement linéaire
✅ Plan de trésorerie mensuel (Année 1)
✅ Calculs BFR/FDR/TN
✅ Ratios financiers (rentabilité, liquidité, solvabilité)
✅ Application taux sénégalais (IS 30%, charges sociales 24%)

---

## 📞 SUPPORT

Pour toute question ou problème :
- 📧 Contactez le support technique
- 📚 Consultez la documentation complète
- 💬 Utilisez l'assistant IA intégré

---

**Dernière mise à jour** : Octobre 2025
**Version** : 2.0 - Tableaux Financiers Professionnels
