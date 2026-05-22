// Horizontal bar chart for labor % per store
export default function BarChart({ data, threshold = 35 }) {
  if (!data?.length) return null

  const sorted   = [...data].sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
  const maxVal   = Math.max(...sorted.map(d => d.value ?? 0), threshold * 1.6, 50)
  const BAR_H    = 28
  const PAD      = { left: 154, right: 64, top: 8, bottom: 8 }
  const W        = 560
  const IW       = W - PAD.left - PAD.right
  const totalH   = sorted.length * BAR_H + PAD.top + PAD.bottom

  const threshX  = PAD.left + (threshold / maxVal) * IW

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${W} ${totalH}`} width="100%" style={{ height: totalH }}>
        {/* Threshold line */}
        <line x1={threshX} y1={PAD.top} x2={threshX} y2={totalH - PAD.bottom}
          stroke="#ef4444" strokeWidth="1.5" strokeDasharray="5,3" />
        <text x={threshX + 3} y={PAD.top + 9} fontSize="9" fill="#ef4444" fontWeight="600">
          {threshold}%
        </text>

        {sorted.map((d, i) => {
          const y       = PAD.top + i * BAR_H
          const val     = d.value ?? 0
          const barW    = (val / maxVal) * IW
          const isHigh  = val > threshold
          const barColor = isHigh ? '#fca5a5' : '#bbf7d0'
          const textColor = isHigh ? '#b91c1c' : '#15803d'
          return (
            <g key={d.label}>
              {/* Label */}
              <text x={PAD.left - 8} y={y + BAR_H / 2 + 4}
                textAnchor="end" fontSize="11" fill="#374151"
                style={{ fontFamily: 'Inter, sans-serif' }}>
                {d.label}
              </text>
              {/* Bar */}
              <rect x={PAD.left} y={y + 5} width={Math.max(barW, 2)} height={BAR_H - 10} rx="4"
                fill={barColor} />
              {/* Value */}
              {val > 0 && (
                <text x={PAD.left + barW + 5} y={y + BAR_H / 2 + 4}
                  fontSize="11" fill={textColor} fontWeight="700"
                  style={{ fontFamily: 'Inter, sans-serif' }}>
                  {val.toFixed(1)}%
                </text>
              )}
              {val === 0 && (
                <text x={PAD.left + 5} y={y + BAR_H / 2 + 4}
                  fontSize="10" fill="#9ca3af" style={{ fontFamily: 'Inter, sans-serif' }}>
                  no data
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
