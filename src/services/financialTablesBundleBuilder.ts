import type { FinancialTablesBundle, FinancialTable } from '@/types/tableauxFinanciers'

/**
 * Entrées minimales pour construire quelques tableaux PDF-ready.
 * Toutes les séries sont annuelles, alignées sur `years`.
 * Les tableaux gèrent les valeurs manquantes en les remplaçant par 0.
 */
export interface BasicBuilderInput {
  years: number[];

  // Compte de résultat (résumé)
  revenue: number[];
  variableCosts: number[];
  fixedCosts: number[];
  depreciation: number[];
  taxRate: number; // décimal, ex: 0.3

  // Flux de trésorerie
  cfo: number[]; // cash-flow d’exploitation
  cfi: number[]; // investissement
  cff: number[]; // financement

  // Optionnel : planning de dette AGRÉGÉ PAR ANNÉE (peut venir de computeDebtAmortizationSchedule)
  debtSchedule?: { year: number; principal: number; interest: number; payment: number; balance: number }[];
}

/** Helper: valeur sûre (0 si non-finie) */
const num = (v: any) => (Number.isFinite(v) ? (v as number) : 0);

/** Helper: longueur commune minimale d’une liste de tableaux */
function minLen(arrs: any[][]): number {
  return Math.min(...arrs.map((a) => (Array.isArray(a) ? a.length : 0)));
}

/** Construit un tableau Compte de Résultat (résumé) */
function buildIncomeStatement(input: BasicBuilderInput): FinancialTable {
  const n = minLen([input.years, input.revenue, input.variableCosts, input.fixedCosts, input.depreciation]);
  const headers = ['Année', 'CA', 'Charges variables', 'Charges fixes', 'EBITDA', 'Amortissements', 'EBIT', 'Impôt', 'Résultat net'];
  const rows: (string | number)[][] = [];

  for (let i = 0; i < n; i++) {
    const ca = num(input.revenue[i]);
    const cv = num(input.variableCosts[i]);
    const cf = num(input.fixedCosts[i]);
    const dep = num(input.depreciation[i]);
    const ebitda = ca - cv - cf;
    const ebit = ebitda - dep;
    const tax = (ebit > 0 ? ebit : 0) * num(input.taxRate);
    const net = ebit - tax;

    rows.push([num(input.years[i]), ca, cv, cf, ebitda, dep, ebit, tax, net]);
  }

  if (rows.length === 0) {
    rows.push(['Données non disponibles']);
  }

  return {
    id: 'table_income_statement',
    title: 'Compte de Résultat (résumé)',
    headers,
    rows,
    meta: { kind: 'pnl' },
  };
}

/** Construit un tableau des flux de trésorerie (CFO/CFI/CFF, net, cumul) */
function buildCashFlowTable(input: BasicBuilderInput): FinancialTable {
  const n = minLen([input.years, input.cfo, input.cfi, input.cff]);
  const headers = ['Année', 'CFO', 'CFI', 'CFF', 'Flux net', 'Cumul'];
  const rows: (string | number)[][] = [];

  let cumul = 0;
  for (let i = 0; i < n; i++) {
    const cfo = num(input.cfo[i]);
    const cfi = num(input.cfi[i]);
    const cff = num(input.cff[i]);
    const net = cfo + cfi + cff;
    cumul += net;
    rows.push([num(input.years[i]), cfo, cfi, cff, net, cumul]);
  }

  if (rows.length === 0) {
    rows.push(['Données non disponibles']);
  }

  return {
    id: 'table_cash_flows',
    title: 'Flux de trésorerie (CFO / CFI / CFF)',
    headers,
    rows,
    meta: { kind: 'cashflows' },
  };
}

/** Construit un tableau d’amortissement de la dette (agrégé / année) si fourni */
function buildDebtTable(input: BasicBuilderInput): FinancialTable {
  const headers = ['Année', 'Principal', 'Intérêts', 'Paiement', 'Solde fin'];
  const rows: (string | number)[][] = [];

  if (Array.isArray(input.debtSchedule) && input.debtSchedule.length > 0) {
    const sorted = [...input.debtSchedule].sort((a, b) => a.year - b.year);
    for (const r of sorted) {
      rows.push([num(r.year), num(r.principal), num(r.interest), num(r.payment), num(r.balance)]);
    }
  } else {
    rows.push(['Données non disponibles']);
  }

  return {
    id: 'table_debt_amortization',
    title: 'Amortissement de la dette (agrégé / année)',
    headers,
    rows,
    meta: { kind: 'debt' },
  };
}

/**
 * Construit un bundle PDF-ready minimal à partir d’entrées simples.
 * ⚠️ Add-only : ne modifie aucun autre service/contrat.
 */
export function buildFinancialTablesBundle(input: BasicBuilderInput): FinancialTablesBundle {
  const tables: FinancialTable[] = [
    buildIncomeStatement(input),
    buildCashFlowTable(input),
    buildDebtTable(input),
  ];

  return { tables, tableIndexStart: 1, figureIndexStart: 1 };
}

export default { buildFinancialTablesBundle };


