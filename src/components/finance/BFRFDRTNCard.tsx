import React from 'react';

type Series = number | number[];

type Props = {
  bfr: Series;                 // Besoin en Fonds de Roulement (par année ou valeur unique)
  fdr: Series;                 // Fonds de Roulement (par année ou valeur unique)
  tn?: Series;                 // Trésorerie Nette (optionnel; calculée si non fournie)
  years?: number[];            // optionnel (affiche l'année utilisée)
  className?: string;
  decimals?: number;           // nb de décimales (par défaut 2)
  currency?: string;           // ex: "€", "CFA", "USD"
};

function toArray(s: Series): number[] {
  return Array.isArray(s) ? s : [s];
}

function lastFinite(arr: number[]): { value: number; index: number } | null {
  for (let i = arr.length - 1; i >= 0; i--) {
    const v = arr[i];
    if (Number.isFinite(v)) return { value: v, index: i };
  }
  return null;
}

function fmt(x: number, decimals: number, currency?: string) {
  if (!Number.isFinite(x)) return '—';
  const num = x.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return currency ? `${num} ${currency}` : num;
}

function badgeColorTN(tn: number) {
  if (!Number.isFinite(tn)) return 'bg-gray-100 text-gray-700';
  return tn >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700';
}

function chipColor(kind: 'BFR' | 'FDR') {
  return kind === 'BFR'
    ? 'bg-amber-50 text-amber-800 ring-1 ring-amber-200'
    : 'bg-blue-50 text-blue-800 ring-1 ring-blue-200';
}

function deltaBadge(deltaAbs: number, decimals: number) {
  if (!Number.isFinite(deltaAbs)) {
    return <span className="text-xs text-gray-500">cohérence: —</span>;
  }
  const ok = deltaAbs < 1e-6; // tolérance stricte
  return ok ? (
    <span className="inline-flex items-center gap-1 text-xs text-green-700">
      <svg width="12" height="12" viewBox="0 0 20 20" className="fill-green-600"><path d="M7.629 13.233l-3.3-3.3 1.414-1.415 1.886 1.887 5.657-5.657 1.414 1.414z"/></svg>
      cohérence OK
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs text-amber-700">
      <svg width="12" height="12" viewBox="0 0 24 24" className="fill-amber-600"><path d="M12 2L1 21h22L12 2zm1 15h-2v-2h2v2zm0-4h-2V9h2v4z"/></svg>
      Δ={deltaAbs.toFixed(decimals)}
    </span>
  );
}

/**
 * Carte affichant BFR / FDR / TN (dernière année disponible) et la cohérence TN ≈ FDR − BFR.
 * Conventions:
 * - BFR > 0 = besoin (immobilise la trésorerie)
 * - FDR > 0 = ressource longue
 * - TN = FDR − BFR
 */
const BFRFDRTNCard: React.FC<Props> = ({ bfr, fdr, tn, years, className, decimals = 2, currency }) => {
  const bfrArr = toArray(bfr);
  const fdrArr = toArray(fdr);
  const tnArr = tn ? toArray(tn) : null;

  // On aligne sur le plus petit index valide commun
  const bfrLast = lastFinite(bfrArr);
  const fdrLast = lastFinite(fdrArr);
  const idx = Math.min(
    bfrLast ? bfrLast.index : Infinity,
    fdrLast ? fdrLast.index : Infinity,
    tnArr ? (lastFinite(tnArr)?.index ?? Infinity) : Infinity
  );

  const bfrVal = Number.isFinite(bfrArr[idx]) ? bfrArr[idx] : (bfrLast?.value ?? Number.NaN);
  const fdrVal = Number.isFinite(fdrArr[idx]) ? fdrArr[idx] : (fdrLast?.value ?? Number.NaN);
  const tnValProvided = tnArr ? (Number.isFinite(tnArr[idx]) ? tnArr[idx] : (lastFinite(tnArr)?.value ?? Number.NaN)) : Number.NaN;
  const tnValComputed = fdrVal - bfrVal;
  const tnVal = tnArr ? tnValProvided : tnValComputed;

  const delta = Math.abs(tnVal - tnValComputed);

  const yearLabel = years && Number.isFinite(idx) && idx >= 0 && idx < years.length ? `Année ${years[idx]}` : '';

  return (
    <div className={`rounded-2xl border border-gray-200 p-4 shadow-sm bg-white ${className ?? ''}`}>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">BFR / FDR / TN</h3>
        <div className="text-xs text-gray-500">{yearLabel}</div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className={`rounded-xl px-3 py-3 ${chipColor('BFR')}`}>
          <div className="text-xs uppercase tracking-wide opacity-80">BFR</div>
          <div className="text-lg font-semibold">{fmt(bfrVal, decimals, currency)}</div>
          <div className="text-[11px] opacity-70">Besoin en fonds de roulement</div>
        </div>

        <div className={`rounded-xl px-3 py-3 ${chipColor('FDR')}`}>
          <div className="text-xs uppercase tracking-wide opacity-80">FDR</div>
          <div className="text-lg font-semibold">{fmt(fdrVal, decimals, currency)}</div>
          <div className="text-[11px] opacity-70">Fonds de roulement</div>
        </div>

        <div className={`rounded-xl px-3 py-3 ${badgeColorTN(tnVal)}`}>
          <div className="text-xs uppercase tracking-wide opacity-80">Trésorerie nette (TN)</div>
          <div className="text-lg font-semibold">{fmt(tnVal, decimals, currency)}</div>
          <div className="text-[11px] opacity-80">TN = FDR − BFR</div>
        </div>
      </div>

      <div className="mt-3">{deltaBadge(delta, decimals)}</div>
    </div>
  );
};

export default BFRFDRTNCard;
