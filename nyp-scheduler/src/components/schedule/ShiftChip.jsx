import { workedHours } from '../../utils.js'

export default function ShiftChip({ shift, onClick, onDragStart, onDragEnd, isDragging }) {
  const hours = workedHours(shift.start_time, shift.end_time, shift.break_minutes)

  return (
    <div
      className={`shift-chip ${shift.role}${isDragging ? ' dragging' : ''}`}
      draggable
      onClick={e => { e.stopPropagation(); onClick?.(shift) }}
      onDragStart={e => {
        e.dataTransfer.effectAllowed = 'copy'
        onDragStart?.(shift)
      }}
      onDragEnd={onDragEnd}
      title={`${shift.role} · ${shift.start_time}–${shift.end_time} · ${hours.toFixed(1)}h`}
    >
      <span className="shift-chip-time">{shift.start_time}–{shift.end_time}</span>
      <span className="shift-chip-hours">{hours.toFixed(1)}h</span>
    </div>
  )
}
