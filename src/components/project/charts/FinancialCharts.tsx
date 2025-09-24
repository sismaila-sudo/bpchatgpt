'use client'

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

interface FinancialData {
  id: string
  year: number
  month: number
  revenue: number
  cogs: number
  gross_margin: number
  total_opex: number
  depreciation: number
  ebitda: number
  ebit: number
  net_income: number
  cash_flow: number
}

interface FinancialChartsProps {
  data: FinancialData[]
  currency: string
}

export function FinancialCharts({ data, currency }: FinancialChartsProps) {
  const chartData = useMemo(() => {
    return data.map(item => ({
      period: `${item.month.toString().padStart(2, '0')}/${item.year}`,
      date: new Date(item.year, item.month - 1),
      ...item
    })).sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [data])

  const annualData = useMemo(() => {
    const yearlyTotals = new Map()

    data.forEach(item => {
      const year = item.year
      if (!yearlyTotals.has(year)) {
        yearlyTotals.set(year, {
          year,
          revenue: 0,
          cogs: 0,
          gross_margin: 0,
          total_opex: 0,
          depreciation: 0,
          ebitda: 0,
          ebit: 0,
          net_income: 0,
          cash_flow: 0
        })
      }

      const yearData = yearlyTotals.get(year)
      yearData.revenue += item.revenue
      yearData.cogs += item.cogs
      yearData.gross_margin += item.gross_margin
      yearData.total_opex += item.total_opex
      yearData.depreciation += item.depreciation
      yearData.ebitda += item.ebitda
      yearData.ebit += item.ebit
      yearData.net_income += item.net_income
      yearData.cash_flow += item.cash_flow
    })

    return Array.from(yearlyTotals.values()).sort((a, b) => a.year - b.year)
  }, [data])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency || 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatCompactCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M ${currency}`
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k ${currency}`
    }
    return formatCurrency(value)
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  // Données pour le graphique en secteurs des charges
  const expenseBreakdown = useMemo(() => {
    const totals = data.reduce((acc, item) => {
      acc.cogs += item.cogs
      acc.opex += item.total_opex
      acc.depreciation += item.depreciation
      return acc
    }, { cogs: 0, opex: 0, depreciation: 0 })

    return [
      { name: 'Coûts directs (COGS)', value: totals.cogs, color: '#ef4444' },
      { name: 'Charges opérationnelles', value: totals.opex, color: '#f97316' },
      { name: 'Amortissements', value: totals.depreciation, color: '#6b7280' }
    ].filter(item => item.value > 0)
  }, [data])

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

  return (
    <div className="space-y-6">
      {/* Métriques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-600 font-medium">Croissance CA</div>
          <div className="text-2xl font-bold text-blue-700">
            {annualData.length > 1 ?
              `${(((annualData[annualData.length-1].revenue - annualData[0].revenue) / annualData[0].revenue) * 100).toFixed(1)}%`
              : 'N/A'
            }
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
          <div className="text-sm text-green-600 font-medium">Rentabilité moyenne</div>
          <div className="text-2xl font-bold text-green-700">
            {data.length > 0 ?
              `${((data.reduce((sum, d) => sum + d.net_income, 0) / data.reduce((sum, d) => sum + d.revenue, 0)) * 100).toFixed(1)}%`
              : '0%'
            }
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
          <div className="text-sm text-purple-600 font-medium">Point mort</div>
          <div className="text-2xl font-bold text-purple-700">
            {(() => {
              const positiveMonths = data.filter(d => d.net_income > 0)
              return positiveMonths.length > 0 ?
                `M${positiveMonths[0].month}/${positiveMonths[0].year}` : 'Non atteint'
            })()}
          </div>
        </div>
      </div>

      {/* Graphique des revenus et rentabilité */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <div className="w-2 h-6 bg-gradient-to-b from-blue-400 to-blue-600 rounded mr-3"></div>
          Évolution des revenus et de la rentabilité
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="period"
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={formatCompactCurrency}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#3b82f6"
              strokeWidth={3}
              name="Chiffre d'affaires"
            />
            <Line
              type="monotone"
              dataKey="gross_margin"
              stroke="#10b981"
              strokeWidth={2}
              name="Marge brute"
            />
            <Line
              type="monotone"
              dataKey="net_income"
              stroke="#f59e0b"
              strokeWidth={2}
              name="Résultat net"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Graphique de structure des coûts */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <div className="w-2 h-6 bg-gradient-to-b from-red-400 to-orange-400 rounded mr-3"></div>
          Structure des coûts mensuels
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="period"
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={formatCompactCurrency}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="cogs"
              stackId="1"
              stroke="#ef4444"
              fill="#ef4444"
              name="Coûts directs"
            />
            <Area
              type="monotone"
              dataKey="total_opex"
              stackId="1"
              stroke="#f97316"
              fill="#f97316"
              name="Charges opérationnelles"
            />
            <Area
              type="monotone"
              dataKey="depreciation"
              stackId="1"
              stroke="#6b7280"
              fill="#6b7280"
              name="Amortissements"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Vue annuelle */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <div className="w-2 h-6 bg-gradient-to-b from-green-400 to-emerald-600 rounded mr-3"></div>
          Performance annuelle
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={annualData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" tick={{ fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={formatCompactCurrency}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="revenue" fill="#3b82f6" name="Chiffre d'affaires" />
            <Bar dataKey="net_income" fill="#10b981" name="Résultat net" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Graphique de flux de trésorerie */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <div className="w-2 h-6 bg-gradient-to-b from-purple-400 to-violet-600 rounded mr-3"></div>
          Flux de trésorerie
        </h3>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="period"
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={formatCompactCurrency}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="cash_flow"
              stroke="#8b5cf6"
              strokeWidth={3}
              name="Flux de trésorerie"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Répartition des charges (Pie Chart) */}
      {expenseBreakdown.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <div className="w-2 h-6 bg-gradient-to-b from-orange-400 to-red-600 rounded mr-3"></div>
            Répartition des charges totales
          </h3>
          <div className="flex flex-col lg:flex-row items-center">
            <div className="lg:w-1/2">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expenseBreakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {expenseBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="lg:w-1/2 lg:pl-8">
              <div className="space-y-3">
                {expenseBreakdown.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className="w-4 h-4 rounded mr-3"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-gray-700">{item.name}</span>
                    </div>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}