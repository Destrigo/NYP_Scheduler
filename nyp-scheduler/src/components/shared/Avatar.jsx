const COLORS = [
  '#6366f1','#ef4444','#22c55e','#f59e0b','#8b5cf6',
  '#06b6d4','#f97316','#ec4899','#14b8a6','#84cc16',
]

function colorFor(name = '') {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return COLORS[h % COLORS.length]
}

export default function Avatar({ firstName = '', lastName = '', size = 'md' }) {
  const initials = (firstName[0] || '') + (lastName[0] || '')
  const bg = colorFor(firstName + lastName)
  return (
    <span className={`avatar avatar-${size}`} style={{ background: bg }}>
      {initials.toUpperCase()}
    </span>
  )
}
