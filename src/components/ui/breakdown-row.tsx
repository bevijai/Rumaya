export type RowKind = 'neutral' | 'positive' | 'negative' | 'total'

const dotColor: Record<RowKind, string> = {
  neutral: 'bg-slate-300',
  positive: 'bg-emerald-500',
  negative: 'bg-red-500',
  total: 'bg-blue-500',
}
const valueColor: Record<RowKind, string> = {
  neutral: 'text-slate-700',
  positive: 'text-emerald-600',
  negative: 'text-red-600',
  total: 'text-blue-700',
}

/** A labelled money row for salary/payslip breakdowns, color-coded by whether it adds, subtracts, or totals. */
export function BreakdownRow({
  label,
  value,
  bold,
  kind = 'neutral',
}: {
  label: string
  value: number
  bold?: boolean
  kind?: RowKind
}) {
  return (
    <div className={`flex items-center justify-between px-3 py-2.5 ${kind === 'total' ? 'mt-1 rounded-xl bg-blue-50/70' : ''}`}>
      <span className="flex items-center gap-2 text-sm text-slate-600">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotColor[kind]}`} />
        <span className={bold ? 'font-semibold text-slate-900' : ''}>{label}</span>
      </span>
      <span className={`text-sm ${bold ? `font-bold ${valueColor[kind]}` : valueColor[kind]}`}>
        {value < 0 ? '-' : ''}${Math.abs(value).toFixed(2)}
      </span>
    </div>
  )
}
