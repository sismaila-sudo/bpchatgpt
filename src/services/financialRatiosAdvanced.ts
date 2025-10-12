/**
 * financialRatiosAdvanced.ts
 * Fonctions PURES (sans I/O) pour ratios et flux avancés:
 * - BFR, FDR, Trésorerie Nette
 * - Amortissement de la dette (agrégé par année)
 * - Flux PROJET (avant dette) vs ACTIONNAIRE (après dette)
 * - NPV/IRR (wrapper à harmoniser avec le moteur)
 * - DSCR: série annuelle + synthèse (min/avg)
 *
 * ⚠️ Module add-only. Placeholders retournent des valeurs neutres.
 *    L’implémentation réelle sera faite dans une étape suivante.
 */

export type Year = number;

/** Emprunt minimaliste (à aligner plus tard si un type Loan existe déjà). */
export interface LoanLike {
  amount: number;
  annualRate: number;
  termMonths: number;
  gracePeriodMonths?: number;
  startYear?: number;
}

/** Entrées minimales pour calculs flux PROJET/ACTIONNAIRE. */
export interface FinancialScenarioInputs {
  years: Year[];
  revenue: number[];
  variableCosts: number[];
  fixedCosts: number[];
  taxRate: number;
  capex: number[];
  depreciation: number[];
  changeInWorkingCapital?: number[];
  debtService?: number[];
}

/** BFR: Besoin en Fonds de Roulement. Entrées minimales (à enrichir si besoin) */
export interface WorkingCapitalInputs {
  years: Year[];
  revenue: number[];
  operatingCosts: number[];
  daysReceivables: number | number[];
  daysInventory: number | number[];
  daysPayables: number | number[];
}

/** Résumé DSCR (ratio de couverture du service de la dette) */
export interface DscrSummary {
  min: number;
  avg: number;
}

/** Scénario : multiplicateurs/ajustements simples pour sensibilités */
export interface ScenarioInput {
  name: string;
  revenueMultiplier?: number;
  variableCostsMultiplier?: number;
  fixedCostsMultiplier?: number;
  taxRateShift?: number;
  inflation?: number;
}

/** Calcule BFR (clients + stocks − fournisseurs) par année. */
export function computeWorkingCapitalRequirement(inputs: WorkingCapitalInputs): number[] {
  const getDaysAt = (value: number | number[], i: number): number => {
    const v = Array.isArray(value) ? value[Math.min(i, value.length - 1)] : value;
    return Math.max(0, Number.isFinite(v as number) ? (v as number) : 0);
  };

  const n = Math.min(
    inputs.years.length,
    inputs.revenue.length,
    inputs.operatingCosts.length
  );

  const out: number[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const rev = Number.isFinite(inputs.revenue[i]) ? inputs.revenue[i] : 0;
    const opex = Number.isFinite(inputs.operatingCosts[i]) ? inputs.operatingCosts[i] : 0;

    const jr = getDaysAt(inputs.daysReceivables, i);
    const ji = getDaysAt(inputs.daysInventory, i);
    const jp = getDaysAt(inputs.daysPayables, i);

    const clients = rev * (jr / 365);
    const stocks = opex * (ji / 365);
    const fournisseurs = opex * (jp / 365);

    out[i] = clients + stocks - fournisseurs;
  }
  return out;
}

/** Calcule FDR = capitaux permanents − actifs fixes, ou 0 si absent. */
export function computeWorkingCapital(inputs: WorkingCapitalInputs): number[] {
  const anyInputs = inputs as any;
  const pc: number[] | undefined = anyInputs.permanentCapital;
  const fa: number[] | undefined = anyInputs.fixedAssets;

  const yearsLen = inputs.years.length;
  if (!Array.isArray(pc) || !Array.isArray(fa) || pc.length === 0 || fa.length === 0) {
    return new Array(yearsLen).fill(0);
  }

  const n = Math.min(yearsLen, pc.length, fa.length);
  const out: number[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const perm = Number.isFinite(pc[i]) ? pc[i] : 0;
    const fixed = Number.isFinite(fa[i]) ? fa[i] : 0;
    out[i] = perm - fixed;
  }
  return out;
}

/** TN = FDR − BFR. */
export function computeNetTreasury(bfr: number[], fdr: number[]): number[] {
  const n = Math.min(bfr.length, fdr.length);
  const out: number[] = new Array(n);
  for (let i = 0; i < n; i++) out[i] = fdr[i] - bfr[i];
  return out;
}

/** Dette agrégée par année depuis des mensualités avec différé. */
export function computeDebtAmortizationSchedule(
  loans: LoanLike[]
): { year: Year; principal: number; interest: number; payment: number; balance: number }[] {
  type YearRow = { principal: number; interest: number; payment: number; balance: number };

  const globalByYear = new Map<number, YearRow>();

  for (const loan of loans) {
    if (!loan || !Number.isFinite(loan.amount) || loan.amount <= 0 || !Number.isFinite(loan.termMonths) || loan.termMonths <= 0) {
      continue;
    }

    const annualRate = Math.max(0, Number.isFinite(loan.annualRate) ? loan.annualRate : 0);
    const r = annualRate / 12;
    const grace = Math.max(0, loan.gracePeriodMonths || 0);
    const totalMonths = Math.floor(loan.termMonths);
    const baseYear = Math.max(1, loan.startYear || 1);
    const offsetMonths = 12 * (baseYear - 1);

    let balance = loan.amount;
    let amortPayment: number | null = null;
    let amortPrincipalLinear: number | null = null;
    const loanByYear = new Map<number, YearRow>();

    for (let m = 0; m < totalMonths; m++) {
      const year = 1 + Math.floor((offsetMonths + m) / 12);
      const row = loanByYear.get(year) || { principal: 0, interest: 0, payment: 0, balance: 0 };

      let interest = balance * r;
      if (m < grace) {
        const payment = interest;
        const principal = 0;
        row.interest += interest;
        row.payment += payment;
        row.principal += principal;
      } else {
        const monthsElapsedInAmort = m - grace;
        const remainingMonths = (totalMonths - grace) - monthsElapsedInAmort;
        if (r > 0) {
          if (amortPayment == null) {
            amortPayment = balance * (r / (1 - Math.pow(1 + r, -remainingMonths)));
          }
          interest = balance * r;
          let principal = amortPayment - interest;
          if (principal > balance) principal = balance;
          if (remainingMonths === 1) principal = balance;
          const payment = principal + interest;
          balance -= principal;
          row.interest += interest;
          row.payment += payment;
          row.principal += principal;
        } else {
          if (amortPrincipalLinear == null) amortPrincipalLinear = balance / remainingMonths;
          let principal = amortPrincipalLinear;
          if (principal > balance || remainingMonths === 1) principal = balance;
          const payment = principal;
          balance -= principal;
          row.interest += 0;
          row.payment += payment;
          row.principal += principal;
        }
      }

      row.balance = balance;
      loanByYear.set(year, row);
    }

    for (const [year, data] of loanByYear.entries()) {
      const acc = globalByYear.get(year) || { principal: 0, interest: 0, payment: 0, balance: 0 };
      acc.principal += data.principal;
      acc.interest += data.interest;
      acc.payment += data.payment;
      acc.balance += data.balance;
      globalByYear.set(year, acc);
    }
  }

  const years = Array.from(globalByYear.keys()).sort((a, b) => a - b);
  return years.map((y) => ({ year: y, ...globalByYear.get(y)! }));
}

/** Flux PROJET (avant dette) – FCFF. */
export function computeProjectFreeCashFlow(inputs: FinancialScenarioInputs): number[] {
  const safe = (v: any) => (Number.isFinite(v) ? (v as number) : 0);
  const arrays = [
    inputs.years,
    inputs.revenue,
    inputs.variableCosts,
    inputs.fixedCosts,
    inputs.depreciation,
    inputs.capex,
  ];
  if (inputs.changeInWorkingCapital) arrays.push(inputs.changeInWorkingCapital);
  const n = Math.min(...arrays.map((a) => a.length));

  const out: number[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const revenue = safe(inputs.revenue[i]);
    const varC = safe(inputs.variableCosts[i]);
    const fixC = safe(inputs.fixedCosts[i]);
    const dep = safe(inputs.depreciation[i]);
    const capex = safe(inputs.capex[i]);
    const dBfr = inputs.changeInWorkingCapital ? safe(inputs.changeInWorkingCapital[i]) : 0;
    const taxRate = safe(inputs.taxRate);

    const ebitda = revenue - varC - fixC;
    const ebit = ebitda - dep;
    const tax = (ebit > 0 ? ebit : 0) * taxRate;
    const nopat = ebit - tax;
    const fcff = nopat + dep - capex - dBfr;
    out[i] = fcff;
  }
  return out;
}

/** Flux ACTIONNAIRE (après dette) – FCFE = FCFF − debtService. */
export function computeEquityCashFlow(inputs: FinancialScenarioInputs): number[] {
  const fcff = computeProjectFreeCashFlow(inputs);
  const n = fcff.length;
  const out: number[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const ds = inputs.debtService ? (Number.isFinite(inputs.debtService[i]) ? (inputs.debtService[i] as number) : 0) : 0;
    out[i] = fcff[i] - ds;
  }
  return out;
}

/** VAN/NPV: Σ CF[t] / (1+rate)^t, t=0..n-1. */
export function computeNPV(cashFlows: number[], discountRate: number): number {
  if (discountRate <= -1) return Number.NaN;
  if (!cashFlows || cashFlows.length === 0) return 0;
  let npv = 0;
  const r = 1 + discountRate;
  for (let t = 0; t < cashFlows.length; t++) {
    const cf = Number.isFinite(cashFlows[t]) ? cashFlows[t] : 0;
    npv += cf / Math.pow(r, t);
  }
  return npv;
}

/** TRI/IRR par bracketing + bissection. Retourne le taux ou null si pas de racine. */
export function computeIRR(cashFlows: number[]): number | null {
  if (!cashFlows || cashFlows.length === 0) return null;

  const f = (rate: number) => computeNPV(cashFlows, rate);
  const tol = 1e-7;
  const maxIter = 100;

  const a = -0.9;
  const fa = f(a);
  if (!Number.isFinite(fa)) return null;
  if (Math.abs(fa) < tol) return a;

  let b = 0.1;
  let fb = f(b);
  if (Math.abs(fb) < tol) return b;

  while (b < 10 && fa * fb > 0) {
    b *= 2;
    if (b > 10) b = 10;
    fb = f(b);
    if (!Number.isFinite(fb)) break;
    if (Math.abs(fb) < tol) return b;
  }

  if (!Number.isFinite(fb) || fa * fb > 0) return null;

  let left = a;
  let right = b;
  let fLeft = fa;
  for (let i = 0; i < maxIter; i++) {
    const mid = (left + right) / 2;
    const fMid = f(mid);
    if (!Number.isFinite(fMid)) return null;
    if (Math.abs(fMid) < tol || Math.abs(right - left) < tol) return mid;
    if (fLeft * fMid < 0) {
      right = mid;
    } else {
      left = mid;
      fLeft = fMid;
    }
  }
  return (left + right) / 2;
}

/** Applique un scénario multiplicatif/shift simple. */
export function applyScenario(base: FinancialScenarioInputs, scenario: ScenarioInput): FinancialScenarioInputs {
  const revMul = Number.isFinite(scenario.revenueMultiplier) ? (scenario.revenueMultiplier as number) : 1;
  const varMul = Number.isFinite(scenario.variableCostsMultiplier) ? (scenario.variableCostsMultiplier as number) : 1;
  const fixMul = Number.isFinite(scenario.fixedCostsMultiplier) ? (scenario.fixedCostsMultiplier as number) : 1;
  const infl = Number.isFinite(scenario.inflation) ? (scenario.inflation as number) : 0;

  const years = base.years.slice();
  const powInfl = (t: number) => Math.pow(1 + infl, t);
  const scaleArr = (arr: number[], mul: number) => arr.map((v, i) => (Number.isFinite(v) ? v * mul * powInfl(i) : 0));

  const revenue = scaleArr(base.revenue, revMul);
  const variableCosts = scaleArr(base.variableCosts, varMul);
  const fixedCosts = scaleArr(base.fixedCosts, fixMul);

  let taxRate = base.taxRate + (Number.isFinite(scenario.taxRateShift) ? (scenario.taxRateShift as number) : 0);
  taxRate = Math.max(0, Math.min(1, taxRate));

  return {
    years,
    revenue,
    variableCosts,
    fixedCosts,
    taxRate,
    capex: base.capex.slice(),
    depreciation: base.depreciation.slice(),
    changeInWorkingCapital: base.changeInWorkingCapital?.slice(),
    debtService: base.debtService?.slice(),
  };
}


