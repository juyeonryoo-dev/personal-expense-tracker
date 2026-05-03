'use client'

import { useState } from 'react'
import { CalendarView } from './calendar-view'
import { AnalyticsView } from './analytics-view'
import { TransactionForm } from './transaction-form'
import { BottomNav } from './bottom-nav'

type Tab = 'calendar' | 'analytics'

interface ExpenseTrackerProps {
  categories: string[]
  paymentMethods: string[]
}

export function ExpenseTracker({ categories, paymentMethods }: ExpenseTrackerProps) {
  const [activeTab, setActiveTab] = useState<Tab>('calendar')
  const [refreshKey, setRefreshKey] = useState(0)

  const handleTransactionSuccess = () => {
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-md mx-auto px-4 py-3">
          <h1 className="text-xl font-bold text-foreground">가계부</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto" key={refreshKey}>
        {activeTab === 'calendar' && <CalendarView />}
        {activeTab === 'analytics' && <AnalyticsView />}
      </main>

      <TransactionForm
        categories={categories}
        paymentMethods={paymentMethods}
        onSuccess={handleTransactionSuccess}
      />

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
