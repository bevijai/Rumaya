export interface TrendPoint {
  label: string
  value: number
  status?: 'paid' | 'due' | 'overdue' | 'upcoming'
}

const dotColors: Record<NonNullable<TrendPoint['status']>, string> = {
  paid: '#10b981',
  due: '#f59e0b',
  overdue: '#ef4444',
  upcoming: '#94a3b8',
}

/** Simple SVG run chart (line + dots) for a series of monthly values, no charting library needed. */
export function PayTrendChart({ points }: { points: TrendPoint[] }) {
  const width = Math.max(points.length * 34, 240)
  const height = 84
  const padding = 14
  const max = Math.max(1, ...points.map((p) => p.value))
  const stepX = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0

  const coords = points.map((p, i) => ({
    x: padding + i * stepX,
    y: padding + (1 - p.value / max) * (height - padding * 2),
    p,
  }))
  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ')
  const areaPath =
    coords.length > 0
      ? `${linePath} L ${coords[coords.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`
      : ''

  if (points.length === 0) return null

  return (
    <div className="no-scrollbar overflow-x-auto">
      <svg width={width} height={height + 18} className="block">
        <defs>
          <linearGradient id="payTrendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#payTrendFill)" />
        <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((c, i) => (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={3.5}
            fill={dotColors[c.p.status ?? 'upcoming']}
            stroke="white"
            strokeWidth={1.5}
          >
            <title>{`${c.p.label}: $${c.p.value.toFixed(2)}`}</title>
          </circle>
        ))}
        {coords.map((c, i) => (
          <text key={`t-${i}`} x={c.x} y={height + 14} fontSize={9} fill="#94a3b8" textAnchor="middle">
            {c.p.label}
          </text>
        ))}
      </svg>
    </div>
  )
}
