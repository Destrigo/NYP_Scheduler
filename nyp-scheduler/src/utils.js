export function today() {
  return new Date().toISOString().slice(0, 10)
}

export function getMonday(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff)).toISOString().slice(0, 10)
}

export function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export function timeToMin(t) {
  if (!t) return 0
  const [h, m] = t.slice(0, 5).split(':').map(Number)
  return h * 60 + m
}

export function workedHours(startTime, endTime, breakMinutes = 0) {
  const diff = timeToMin(endTime) - timeToMin(startTime) - Number(breakMinutes)
  return Math.max(0, diff / 60)
}

export function getAge(dob) {
  if (!dob) return 99
  const t = new Date()
  const b = new Date(dob)
  let age = t.getFullYear() - b.getFullYear()
  if (t < new Date(t.getFullYear(), b.getMonth(), b.getDate())) age--
  return age
}

export function checkMinorViolation(employee, endTime) {
  if (!employee || !endTime) return null
  const age = getAge(employee.date_of_birth)
  const endMin = timeToMin(endTime)
  if (age < 16 && endMin > timeToMin('20:00'))
    return `${employee.first_name} is under 16 and cannot work past 20:00`
  if (age < 18 && endMin > timeToMin('22:00'))
    return `${employee.first_name} is under 18 and cannot work past 22:00`
  return null
}

export function fmtDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

export function fmtDateShort(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'numeric',
  })
}

export function fmtDateFull(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

export function monthLabel(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    month: 'long', year: 'numeric',
  })
}

export function weekDays(weekStart) {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}

export function isToday(dateStr) {
  return dateStr === today()
}

export function shiftCost(shift, employee) {
  if (!employee) return 0
  return workedHours(shift.start_time, shift.end_time, shift.break_minutes) * employee.hourly_rate
}
