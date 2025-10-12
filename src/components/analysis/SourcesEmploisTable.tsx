import { SourcesEmplois } from '@/types/analysis'

interface SourcesEmploisTableProps {
  data: SourcesEmplois
}

export default function SourcesEmploisTable({ data }: SourcesEmploisTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Sources */}
      <div>
        <h4 className="text-lg font-bold text-slate-900 mb-4">Sources de financement</h4>
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-200">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <th className="px-4 py-3 text-left text-sm font-semibold">Source</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Montant</th>
              </tr>
            </thead>
            <tbody>
              {data.sources.map((source, index) => (
                <tr key={index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-slate-700">{source.description}</td>
                  <td className="px-4 py-3 text-sm text-slate-900 font-medium text-right">
                    {formatCurrency(source.montant)}
                  </td>
                </tr>
              ))}
              <tr className="bg-gradient-to-r from-blue-50 to-purple-50 font-bold">
                <td className="px-4 py-3 text-sm text-slate-900">TOTAL</td>
                <td className="px-4 py-3 text-sm text-slate-900 text-right">
                  {formatCurrency(data.totalSources)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Emplois */}
      <div>
        <h4 className="text-lg font-bold text-slate-900 mb-4">Emplois</h4>
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-200">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                <th className="px-4 py-3 text-left text-sm font-semibold">Emploi</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Montant</th>
              </tr>
            </thead>
            <tbody>
              {data.emplois.map((emploi, index) => (
                <tr key={index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-slate-700">{emploi.description}</td>
                  <td className="px-4 py-3 text-sm text-slate-900 font-medium text-right">
                    {formatCurrency(emploi.montant)}
                  </td>
                </tr>
              ))}
              <tr className="bg-gradient-to-r from-emerald-50 to-teal-50 font-bold">
                <td className="px-4 py-3 text-sm text-slate-900">TOTAL</td>
                <td className="px-4 py-3 text-sm text-slate-900 text-right">
                  {formatCurrency(data.totalEmplois)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}