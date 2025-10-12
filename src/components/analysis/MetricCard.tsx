interface MetricCardProps {
  label: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  gradient?: string
}

export default function MetricCard({ label, value, subtitle, icon, gradient = 'from-blue-500 to-purple-500' }: MetricCardProps) {
  return (
    <div className={`bg-gradient-to-br ${gradient} text-white p-6 rounded-2xl shadow-lg`}>
      {icon && (
        <div className="mb-3">
          {icon}
        </div>
      )}
      <div className="text-sm opacity-90 mb-1">{label}</div>
      <div className="text-4xl font-bold mb-1">{value}</div>
      {subtitle && (
        <div className="text-sm opacity-80">{subtitle}</div>
      )}
    </div>
  )
}