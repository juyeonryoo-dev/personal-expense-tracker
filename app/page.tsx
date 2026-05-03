import { ExpenseTracker } from '@/components/expense-tracker'
import { DEFAULT_CATEGORIES, DEFAULT_PAYMENT_METHODS } from '@/lib/types'
import { getCategories, getPaymentMethods } from './actions'

/** Vercel 등 배포 환경에서 정적 프리렌더·캐시 이슈로 루트 404가 나는 경우 방지 */
export const dynamic = 'force-dynamic'

export default async function Home() {
  const [fromDbCategories, fromDbMethods] = await Promise.all([
    getCategories(),
    getPaymentMethods(),
  ])

  const categories =
    fromDbCategories.length > 0 ? fromDbCategories : DEFAULT_CATEGORIES
  const paymentMethods =
    fromDbMethods.length > 0 ? fromDbMethods : DEFAULT_PAYMENT_METHODS

  return (
    <ExpenseTracker
      categories={categories}
      paymentMethods={paymentMethods}
    />
  )
}
