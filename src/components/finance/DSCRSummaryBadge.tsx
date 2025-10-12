import React from 'react';

type Props = {
  min: number;  // DSCR minimal (peut être NaN)
  avg: number;  // DSCR moyen (peut être NaN)
  className?: string;
};

function fmt(x: number) {
  return Number.isFinite(x) ? x.toFixed(2) : '—';
}

function colorFor(dscr: number) {
  if (!Number.isFinite(dscr)) return 'bg-gray-200 text-gray-700';
  if (dscr < 1.0) return 'bg-red-100 text-red-700';
  if (dscr < 1.2) return 'bg-amber-100 text-amber-800';
  return 'bg-green-100 text-green-800';
}

/**
 * Petit badge DSCR (min / avg) avec code couleur:
 * - < 1.0  : rouge (risqué)
 * - 1.0–1.2: ambre (limite)
 * - ≥ 1.2  : vert (confort)
 */
const DSCRSummaryBadge: React.FC<Props> = ({ min, avg, className }) => {
  const minColor = colorFor(min);
  const avgColor = colorFor(avg);

  return (
    <div className={`flex items-center gap-2 ${className ?? ''}`}>
      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${minColor}`}>
        DSCR min: {fmt(min)}
      </span>
      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${avgColor}`}>
        DSCR moy: {fmt(avg)}
      </span>
      <span className="text-xs text-gray-500">
        (≥ 1.2 conseillé)
      </span>
    </div>
  );
};

export default DSCRSummaryBadge;
