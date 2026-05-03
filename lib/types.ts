export interface Transaction {
  id: string
  date: string
  amount: number
  content: string
  category: string
  detail: string | null
  payment_method: string
  is_excluded_from_total: boolean
  created_at: string
}

export interface Category {
  id: string
  name: string
  created_at: string
}

export interface PaymentMethod {
  id: string
  name: string
  created_at: string
}

export interface TransactionFormData {
  date: string
  amount: number
  content: string
  category: string
  detail: string
  payment_method: string
}

export interface DailySpending {
  date: string
  total: number
  transactions: Transaction[]
}

export interface CategorySpending {
  category: string
  total: number
  percentage: number
}

export interface MonthlyAnalytics {
  totalSpending: number
  categoryBreakdown: CategorySpending[]
  transactionCount: number
}

// Exclusion rules
export const EXCLUDED_CATEGORIES = ['저축', '투자']
export const EXCLUDED_PAYMENT_METHODS = ['네이버포인트(복지)']

export function shouldExcludeFromTotal(category: string, paymentMethod: string): boolean {
  return (
    EXCLUDED_CATEGORIES.includes(category) ||
    EXCLUDED_PAYMENT_METHODS.includes(paymentMethod)
  )
}

export const DEFAULT_CATEGORIES = [
  '식비(회사)',
  '카페(회사)',
  '식비(일반)',
  '카페(일반)',
  '교통비',
  '통신비',
  '관리비',
  '도시가스',
  '전기세',
  '수도세',
  '대출이자',
  '쇼핑(옷)',
  '쇼핑(화장품)',
  '쇼핑(생필품)',
  '쇼핑(약)',
  '쇼핑(그 외)',
  '문화생활',
  '선물',
  '계',
  '저축',
  '투자',
]

export const DEFAULT_PAYMENT_METHODS = [
  '체크카드(하나)',
  '신용카드(롯데)',
  '신용카드(삼성)',
  '네이버포인트(복지)',
]
