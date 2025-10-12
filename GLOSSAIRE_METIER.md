# 📖 Glossaire Métier - Business Plan & Finance

## 🎯 Objectif
Ce glossaire définit les termes financiers et métier utilisés dans l'application BP FONGIP pour garantir une compréhension commune entre développeurs, analystes et utilisateurs.

---

## 💰 INDICATEURS FINANCIERS

### VAN (Valeur Actuelle Nette) / NPV (Net Present Value)
**Définition** : Somme des flux de trésorerie actualisés sur la durée du projet.

**Formule** :
```
VAN = Σ [Flux(t) / (1 + r)^t] - Investissement Initial
```

**Interprétation** :
- ✅ **VAN > 0** : Projet rentable (gains > investissement)
- ⚠️ **VAN = 0** : Projet à l'équilibre
- ❌ **VAN < 0** : Projet non rentable

**Seuil FONGIP** : VAN doit être positive pour l'éligibilité.

---

### TRI (Taux de Rendement Interne) / IRR (Internal Rate of Return)
**Définition** : Taux d'actualisation pour lequel la VAN = 0.

**Interprétation** :
- ✅ **TRI > 12%** : Bon rendement (supérieur au coût du capital Sénégal)
- ⚠️ **TRI = 10-12%** : Rendement acceptable
- ❌ **TRI < 10%** : Rendement insuffisant

**Seuil FONGIP** : TRI minimum recommandé = 12%.

---

### DRCI (Délai de Récupération du Capital Investi) / Payback Period
**Définition** : Nombre d'années nécessaires pour récupérer l'investissement initial via les flux de trésorerie.

**Formule** :
```
DRCI = Année où Flux Cumulé ≥ 0
```

**Interprétation** :
- ✅ **DRCI ≤ 3 ans** : Excellent (récupération rapide)
- ⚠️ **DRCI = 4-5 ans** : Acceptable
- ❌ **DRCI > 5 ans** : Risque élevé

**Seuil FONGIP** : DRCI < durée des projections.

---

### ROE (Return On Equity)
**Définition** : Rentabilité des capitaux propres.

**Formule** :
```
ROE = (Résultat Net / Capitaux Propres) × 100
```

**Interprétation** :
- ✅ **ROE > 15%** : Excellente rentabilité
- ⚠️ **ROE = 10-15%** : Rentabilité correcte
- ❌ **ROE < 10%** : Rentabilité faible

---

### ROCE (Return On Capital Employed)
**Définition** : Rentabilité du capital employé (fonds propres + dettes).

**Formule** :
```
ROCE = (EBIT / Capital Employé) × 100
Capital Employé = Actifs - Passifs Courants
```

**Interprétation** :
- ✅ **ROCE > 12%** : Utilisation efficace du capital
- ⚠️ **ROCE = 8-12%** : Utilisation correcte
- ❌ **ROCE < 8%** : Capital sous-utilisé

---

### DSCR (Debt Service Coverage Ratio)
**Définition** : Capacité à couvrir le service de la dette (remboursement + intérêts).

**Formule** :
```
DSCR = Flux de Trésorerie d'Exploitation / Service de la Dette
```

**Interprétation** :
- ✅ **DSCR > 1.5** : Excellente capacité de remboursement
- ⚠️ **DSCR = 1.2-1.5** : Capacité acceptable
- ❌ **DSCR < 1.2** : Risque de défaut

**Seuil FONGIP OBLIGATOIRE** : DSCR ≥ 1.2.

---

### Marge Brute (Gross Margin)
**Définition** : Pourcentage du chiffre d'affaires restant après déduction des coûts variables.

**Formule** :
```
Marge Brute = [(CA - Coûts Variables) / CA] × 100
```

**Interprétation** :
- ✅ **> 40%** : Excellente marge
- ⚠️ **20-40%** : Marge correcte
- ❌ **< 20%** : Marge faible

---

### Marge Nette (Net Margin)
**Définition** : Pourcentage du chiffre d'affaires restant après TOUTES les charges (y compris impôts).

**Formule** :
```
Marge Nette = (Résultat Net / CA) × 100
```

**Interprétation** :
- ✅ **> 15%** : Excellente rentabilité
- ⚠️ **5-15%** : Rentabilité correcte
- ❌ **< 5%** : Rentabilité faible

---

## 🏦 CRITÈRES FONGIP (Fonds de Garantie des Investissements Prioritaires)

### Autonomie Financière
**Définition** : Part des capitaux propres dans le financement total.

**Formule** :
```
Autonomie Financière = (Capitaux Propres / Total Bilan) × 100
```

**Seuil FONGIP OBLIGATOIRE** : ≥ 20%

**Interprétation** :
- ✅ **≥ 30%** : Excellente autonomie
- ⚠️ **20-30%** : Autonomie acceptable
- ❌ **< 20%** : Dépendance excessive aux dettes (REJET FONGIP)

---

### Liquidité
**Définition** : Capacité à honorer les dettes à court terme.

**Formule** :
```
Liquidité = Actifs Courants / Passifs Courants
```

**Seuil FONGIP OBLIGATOIRE** : ≥ 1.0

**Interprétation** :
- ✅ **≥ 1.5** : Excellente liquidité
- ⚠️ **1.0-1.5** : Liquidité acceptable
- ❌ **< 1.0** : Risque de défaut (REJET FONGIP)

---

## 📊 FLUX DE TRÉSORERIE (CASH FLOWS)

### Flux de Trésorerie d'Exploitation (Operating Cash Flow)
**Définition** : Liquidités générées par l'activité principale.

**Formule** :
```
FCO = Résultat Net + Amortissements + Δ BFR
```

---

### Flux de Trésorerie d'Investissement (Investment Cash Flow)
**Définition** : Liquidités utilisées pour les investissements (équipements, etc.).

**Formule** :
```
FCI = - Investissements en Immobilisations
```

---

### Flux de Trésorerie de Financement (Financing Cash Flow)
**Définition** : Liquidités provenant des emprunts et apports en capital.

**Formule** :
```
FCF = Emprunts - Remboursements + Apports en Capital
```

---

## 📈 PARAMÈTRES ÉCONOMIQUES SÉNÉGAL (2025)

| Paramètre | Valeur | Justification |
|-----------|--------|---------------|
| **Taux d'actualisation** | 12% | Taux bancaire moyen Sénégal |
| **Taux d'imposition corporatif** | 30% | Impôt sur les sociétés (IS) |
| **Charges sociales** | 24% | IPRES + CSS + FNE |
| **Taux d'inflation** | 3% | Moyenne BCEAO 2024-2025 |
| **Taux d'intérêt bancaire** | 10-14% | Fourchette prêts PME |

---

## 🎓 TERMES MÉTIER

### BFR (Besoin en Fonds de Roulement)
**Définition** : Montant nécessaire pour financer le décalage entre encaissements et décaissements.

**Formule** :
```
BFR = Stocks + Créances Clients - Dettes Fournisseurs
```

---

### EBIT (Earnings Before Interest and Taxes)
**Définition** : Résultat d'exploitation avant intérêts et impôts.

**Formule** :
```
EBIT = CA - Coûts d'Exploitation
```

---

### EBITDA (Earnings Before Interest, Taxes, Depreciation, and Amortization)
**Définition** : EBIT + Amortissements (indicateur de performance opérationnelle).

**Formule** :
```
EBITDA = EBIT + Amortissements
```

---

### Flux de Trésorerie Libre (Free Cash Flow)
**Définition** : Trésorerie disponible après toutes les opérations.

**Formule** :
```
FCL = FCO + FCI + FCF
```

---

### Saisonnalité
**Définition** : Variations mensuelles de l'activité (ex: agriculture, tourisme).

**Exemple** :
- **Janvier-Mars** : 120% (haute saison)
- **Avril-Juin** : 80% (basse saison)
- **Juillet-Septembre** : 100% (normale)
- **Octobre-Décembre** : 110% (préparation fêtes)

---

## 🔍 RÈGLES DE VALIDATION

### Cohérence des Projections
1. **Revenus** : Ne peuvent pas être négatifs
2. **Marges** : Marge brute > Marge nette (logique)
3. **Croissance** : Taux de croissance annuel réaliste (< 30% sauf cas exceptionnel)
4. **Coûts** : Variables proportionnels au CA, fixes stables

### Éligibilité FONGIP (Score 100/100)
- ✅ Autonomie Financière ≥ 20%
- ✅ Liquidité ≥ 1.0
- ✅ DSCR ≥ 1.2
- ✅ VAN > 0
- ✅ TRI ≥ 12%

---

## 📚 SOURCES & RÉFÉRENCES

1. **BCEAO** : Banque Centrale des États de l'Afrique de l'Ouest
2. **Code Général des Impôts Sénégal** : Fiscalité corporative
3. **IPRES** : Institution de Prévoyance Retraite du Sénégal
4. **FONGIP** : Fonds de Garantie des Investissements Prioritaires

---

## 📝 NOTES IMPORTANTES

⚠️ **Mise à jour** : Ce glossaire reflète les paramètres de **2025**. Les taux peuvent évoluer.

🔄 **Révision** : Vérifier annuellement les paramètres BCEAO et fiscaux.

💡 **Support** : Pour questions techniques, consulter la documentation développeur.

