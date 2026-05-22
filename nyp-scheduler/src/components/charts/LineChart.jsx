// Line chart for labor % trend over time
const PALETTE = [
  '#6366f1','#ef4444','#22c55e','#f59e0b','#8b5cf6',
  '#06b6d4','#f97316','#ec4899','#14b8a6','#84cc16',
  '#a855f7','#0ea5e9','#d97706','#10b981',
]

export default function LineChart({ series, xLabels, threshold = 35, height = 200 }) {
  if (!series?.length || !xLabels?.length) return null

  const W   = 560
  const H   = height
  const PAD = { top: 14, right: 16, bottom: 32, left: 42 }
  const IW  = W - PAD.left - PAD.right
  const IH  = H - PAD.top - PAD.bottom

  const allVals = series.flatMap(s => s.data.filter(v => v != null))
  const yMax    = Math.max(...allVals, threshold * 1.4, 50)
  const yTicks  = [0, 20, 40, 60, 80].filter(v => v <= yMax * 1.1)

  function xPos(i) { return PAD.left + (i / Math.max(xLabels.length - 1, 1)) * IW }
  function yPos(v) { return PAD.top  + IH - (v / yMax) * IH }

  const threshY = yPos(threshold)

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ height }}>
        {/* Y gridlines + labels */}
        {yTicks.map(v => (
          <g key={v}>
            <line x1={PAD.left} y1={yPos(v)} x2={W - PAD.right} y2={yPos(v)}
              stroke="#e2e8f0" strokeWidth="1" />
            <text x={PAD.left - 6} y={yPos(v) + 4}
              textAnchor="end" fontSize="9" fill="#94a3b8"
              style={{ fontFamily: 'Inter, sans-serif' }}>
              {v}%
            </text>
          </g>
        ))}

        {/* Threshold line */}
        <line x1={PAD.left} y1={threshY} x2={W - PAD.right} y2={threshY}
          stroke="#ef4444" strokeWidth="1.5" strokeDasharray="6,3" />
        <text x={W - PAD.right + 3} y={threshY + 4}
          fontSize="9" fill="#ef4444" fontWeight="700"
          style={{ fontFamily: 'Inter, sans-serif' }}>
          {threshold}%
        </text>

        {/* X labels */}
        {xLabels.map((l, i) => (
          <text key={i} x={xPos(i)} y={H - PAD.bottom + 14}
            textAnchor="middle" fontSize="9" fill="#94a3b8"
            style={{ fontFamily: 'Inter, sans-serif' }}>
            {l}
          </text>
        ))}

        {/* Series lines */}
        {series.map(({ name, data }, si) => {
          const color  = PALETTE[si % PALETTE.length]
          let pathD    = ''
          data.forEach((v, i) => {
            if (v == null) return
            const cmd = pathD === '' || data[i - 1] == null ? 'M' : 'L'
            pathD += `${cmd}${xPos(i).toFixed(1)},${yPos(v).toFixed(1)}`
          })
          return (
            <g key={si}>
              {pathD && (
                <path d={pathD} fill="none" stroke={color} strokeWidth="2"
                  strokeLinejoin="round" strokeLinecap="round" />
              )}
              {data.map((v, i) => v != null && (
                <circle key={i} cx={xPos(i)} cy={yPos(v)} r="3"
                  fill={color} stroke="#fff" strokeWidth="1.5">
                  <title>{name}: {v.toFixed(1)}%</title>
                </circle>
              ))}
            </g>
          )
        })}
      </svg>

      {/* Legend */}
      {series.length > 1 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', marginTop: 8, fontSize: 11 }}>
          {series.map(({ name }, si) => (
            <span key={si} style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)' }}>
              <span style={{ display: 'inline-block', width: 16, height: 3, borderRadius: 2, background: PALETTE[si % PALETTE.length] }} />
              {name}
            </span>
          ))}
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#ef4444' }}>
            <span style={{ display: 'inline-block', width: 16, height: 2, borderRadius: 1, background: '#ef4444', borderTop: '2px dashed #ef4444' }} />
            {threshold}% threshold
          </span>
        </div>
      )}
    </div>
  )
}
