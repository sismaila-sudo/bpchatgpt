import React from 'react';
import BFRFDRTNCard from './BFRFDRTNCard';
import {
  computeWorkingCapitalRequirement,
  computeWorkingCapital,
  computeNetTreasury,
} from '@/services/financialRatiosAdvanced';

// Type local minimal (on évite toute dépendance fragile)
export type BundleSourceMinimal = {
  years: number[];
  revenue: number[];          // CA
  operatingCosts: number[];   // coûts d’exploitation pertinents pour BFR
  // Jours de rotation (peuvent être scalaires ou séries)
  daysReceivables: number | number[];
  daysInventory: number | number[];
  daysPayables: number | number[];
  // Pour FDR = capitaux permanents − actifs fixes
  permanentCapital?: number[];
  fixedAssets?: number[];
};

type Props = {
  source: BundleSourceMinimal;
  currency?: string;
  decimals?: number;
  className?: string;
};

/**
 * Section calculant BFR, FDR, TN à partir de `source`
 * et affichant la carte récapitulative.
 */
const BFRFDRTNSection: React.FC<Props> = ({ source, currency, decimals = 2, className }) => {
  // Source sûre (évite tout crash si props incomplètes ou undefined)
  const safe = (a: any) => (Array.isArray(a) ? a : []);
  const src = source ?? {
    years: [],
    revenue: [],
    operatingCosts: [],
    daysReceivables: 0,
    daysInventory: 0,
    daysPayables: 0,
    permanentCapital: [],
    fixedAssets: [],
  };

  // BFR (clients + stocks − fournisseurs) à partir des jours de rotation
  const bfr = computeWorkingCapitalRequirement({
    years: safe(src.years),
    revenue: safe(src.revenue),
    operatingCosts: safe(src.operatingCosts),
    daysReceivables: (src as any).daysReceivables ?? 0,
    daysInventory: (src as any).daysInventory ?? 0,
    daysPayables: (src as any).daysPayables ?? 0,
  });

  // FDR = capitaux permanents − actifs fixes (fallback à 0 si non fournis)
  const fdr = computeWorkingCapital({
    years: safe(src.years),
    revenue: safe(src.revenue),
    operatingCosts: safe(src.operatingCosts),
    daysReceivables: 0,
    daysInventory: 0,
    daysPayables: 0,
    // champs lus par computeWorkingCapital (add-only dans le service)
    permanentCapital: Array.isArray((src as any).permanentCapital) ? (src as any).permanentCapital : new Array(safe(src.years).length).fill(0),
    fixedAssets: Array.isArray((src as any).fixedAssets) ? (src as any).fixedAssets : new Array(safe(src.years).length).fill(0),
  } as any);

  // TN = FDR − BFR
  const tn = computeNetTreasury(bfr, fdr);

  return (
    <div className={className}>
      <BFRFDRTNCard
        bfr={bfr}
        fdr={fdr}
        tn={tn}
        years={source.years}
        currency={currency}
        decimals={decimals}
      />
    </div>
  );
};

export default BFRFDRTNSection;
