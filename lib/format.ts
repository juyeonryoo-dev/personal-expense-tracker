export function formatCurrency(amount: number): string {
  const absAmount = Math.abs(amount)
  const formatted = absAmount.toLocaleString('ko-KR')
  const prefix = amount < 0 ? '-' : ''
  return `${prefix}₩${formatted}`
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  })
}

export function formatFullDate(date: string): string {
  return new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
}

/** 로컬 달력 기준 YYYY-MM-DD (toISOString() 사용 시 타임존으로 하루 밀리는 문제 방지) */
export function formatYearMonthDay(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function getToday(): string {
  const d = new Date()
  return formatYearMonthDay(d.getFullYear(), d.getMonth() + 1, d.getDate())
}

export function getMonthName(month: number): string {
  const date = new Date(2024, month - 1, 1)
  return date.toLocaleDateString('ko-KR', { month: 'long' })
}

export function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate()
}

export function getFirstDayOfMonth(month: number, year: number): number {
  return new Date(year, month - 1, 1).getDay()
}
