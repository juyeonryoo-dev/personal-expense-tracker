import { ExpenseTracker } from '@/components/expense-tracker'
import { DEFAULT_CATEGORIES, DEFAULT_PAYMENT_METHODS } from '@/lib/types'
import { getCategories, getPaymentMethods } from './actions'

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
