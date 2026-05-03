'use client'

import { useState, useEffect, useTransition } from 'react'
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getMonthlyAnalytics, getPreviousMonthAnalytics } from '@/app/actions'
import { formatCurrency, getMonthName } from '@/lib/format'
import type { MonthlyAnalytics, CategorySpending } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'

const COLORS = [
  'oklch(0.646 0.222 41.116)',   // chart-1
  'oklch(0.6 0.118 184.704)',    // chart-2
  'oklch(0.398 0.07 227.392)',   // chart-3
  'oklch(0.828 0.189 84.429)',   // chart-4
  'oklch(0.769 0.188 70.08)',    // chart-5
  'oklch(0.5 0.15 260)',
  'oklch(0.7 0.12 150)',
  'oklch(0.6 0.2 320)',
]

function generateInsights(
  current: MonthlyAnalytics,
  previous: MonthlyAnalytics
): string[] {
  const insights: string[] = []

  // Top spending category
  if (current.categoryBreakdown.length > 0) {
    const top = current.categoryBreakdown[0]
    if (top.percentage >= 30) {
      insights.push(`${top.category} 지출 비중이 ${top.percentage.toFixed(0)}%로 높습니다.`)
    }
  }

  // Compare with previous month
  if (previous.totalSpending > 0) {
    const diff = current.totalSpending - previous.totalSpending
    const percentChange = (diff / previous.totalSpending) * 100

    if (percentChange > 20) {
      insights.push(`지난달 대비 지출이 ${percentChange.toFixed(0)}% 증가했습니다.`)
    } else if (percentChange < -20) {
      insights.push(`지난달 대비 지출이 ${Math.abs(percentChange).toFixed(0)}% 감소했습니다.`)
    }

    // Category comparison
    const currentMap = new Map(current.categoryBreakdown.map((c) => [c.category, c.total]))
    const previousMap = new Map(previous.categoryBreakdown.map((c) => [c.category, c.total]))

    for (const [category, currentTotal] of currentMap) {
      const prevTotal = previousMap.get(category) || 0
      if (prevTotal > 0) {
        const catDiff = ((currentTotal - prevTotal) / prevTotal) * 100
        if (catDiff > 50 && currentTotal > current.totalSpending * 0.1) {
          insights.push(`${category} 지출이 지난달 대비 증가했습니다.`)
          break
        }
      }
    }
  }

  if (insights.length === 0) {
    insights.push('꾸준히 지출을 기록하고 있어요!')
  }

  return insights.slice(0, 3)
}

export function AnalyticsView() {
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [year, setYear] = useState(today.getFullYear())
  const [analytics, setAnalytics] = useState<MonthlyAnalytics | null>(null)
  const [prevAnalytics, setPrevAnalytics] = useState<MonthlyAnalytics | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    startTransition(async () => {
      const [current, previous] = await Promise.all([
        getMonthlyAnalytics(month, year),
        getPreviousMonthAnalytics(month, year),
      ])
      setAnalytics(current)
      setPrevAnalytics(previous)
    })
  }, [month, year])

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12)
      setYear(year - 1)
    } else {
      setMonth(month - 1)
    }
  }

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1)
      setYear(year + 1)
    } else {
      setMonth(month + 1)
    }
  }

  const insights = analytics && prevAnalytics
    ? generateInsights(analytics, prevAnalytics)
    : []

  const comparisonPercent = analytics && prevAnalytics && prevAnalytics.totalSpending > 0
    ? ((analytics.totalSpending - prevAnalytics.totalSpending) / prevAnalytics.totalSpending) * 100
    : null

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-semibold">
          {year}년 {getMonthName(month)}
        </h2>
        <Button variant="ghost" size="icon" onClick={handleNextMonth}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {isPending || !analytics ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-muted-foreground">로딩 중...</div>
        </div>
      ) : (
        <>
          {/* Total Spending Card */}
          <Card className="p-5">
            <p className="text-sm text-muted-foreground mb-1">총 지출</p>
            <div className="flex items-end gap-3">
              <span className="text-3xl font-bold">
                {formatCurrency(analytics.totalSpending)}
              </span>
              {comparisonPercent !== null && (
                <div
                  className={cn(
                    'flex items-center gap-1 text-sm pb-1',
                    comparisonPercent > 0 ? 'text-red-500' : 'text-green-500'
                  )}
                >
                  {comparisonPercent > 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span>
                    {comparisonPercent > 0 ? '+' : ''}
                    {comparisonPercent.toFixed(0)}%
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              총 {analytics.transactionCount}건의 거래
            </p>
          </Card>

          {/* Category Breakdown */}
          {analytics.categoryBreakdown.length > 0 && (
            <Card className="p-5">
              <h3 className="font-semibold mb-4">카테고리별 지출</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.categoryBreakdown.slice(0, 8)}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="total"
                      nameKey="category"
                    >
                      {analytics.categoryBreakdown.slice(0, 8).map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(label) => label}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {analytics.categoryBreakdown.slice(0, 8).map((item, index) => (
                  <div key={item.category} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm truncate">{item.category}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {item.percentage.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Bar Chart for Top Categories */}
          {analytics.categoryBreakdown.length > 0 && (
            <Card className="p-5">
              <h3 className="font-semibold mb-4">상위 카테고리</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analytics.categoryBreakdown.slice(0, 5)}
                    layout="vertical"
                    margin={{ left: 0, right: 16 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="category"
                      width={80}
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="total" fill="oklch(0.646 0.222 41.116)" radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* Insights */}
          <Card className="p-5">
            <h3 className="font-semibold mb-3">인사이트</h3>
            <div className="flex flex-col gap-2">
              {insights.map((insight, i) => (
                <p key={i} className="text-sm text-muted-foreground">
                  {insight}
                </p>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
