'use client'

import { useState, useEffect, useTransition } from 'react'
import { ChevronLeft, ChevronRight, Trash2, Pencil, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { getTransactions, getTransactionsByDate, deleteTransaction, updateTransaction, getCategories, getPaymentMethods } from '@/app/actions'
import { formatCurrency, formatFullDate, getMonthName, getDaysInMonth, getFirstDayOfMonth } from '@/lib/format'
import { DEFAULT_CATEGORIES, DEFAULT_PAYMENT_METHODS, type Transaction } from '@/lib/types'
import { cn } from '@/lib/utils'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export function CalendarView() {
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [year, setYear] = useState(today.getFullYear())
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTransactions, setSelectedTransactions] = useState<Transaction[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Edit modal state
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [paymentMethods, setPaymentMethods] = useState<string[]>([])
  
  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null)

  useEffect(() => {
    setIsLoading(true)
    setError(null)
    startTransition(async () => {
      try {
        const data = await getTransactions(month, year)
        setTransactions(data)
      } catch (err) {
        setError('데이터를 불러오는 중 오류가 발생했습니다.')
        console.error('Error loading transactions:', err)
      } finally {
        setIsLoading(false)
      }
    })
  }, [month, year])

  useEffect(() => {
    const loadOptions = async () => {
      const [cats, methods] = await Promise.all([
        getCategories(),
        getPaymentMethods(),
      ])
      setCategories(cats.length > 0 ? cats : DEFAULT_CATEGORIES)
      setPaymentMethods(methods.length > 0 ? methods : DEFAULT_PAYMENT_METHODS)
    }
    loadOptions()
  }, [])

  const daysInMonth = getDaysInMonth(month, year)
  const firstDay = getFirstDayOfMonth(month, year)

  // 일별 실제 지출: is_excluded_from_total === false 만 합산 (월 합계·셀 배경 강도)
  // 일별 표시 합계: 해당 날짜 모든 거래 금액(절댓값) 합 — 셀에 숫자로 표기
  const dailyIncludedTotal: Record<string, number> = {}
  const dailyGrossTotal: Record<string, number> = {}
  const dailyTransactionsByDate: Record<string, Transaction[]> = {}
  transactions.forEach((t) => {
    const dateKey = t.date
    if (!dailyTransactionsByDate[dateKey]) dailyTransactionsByDate[dateKey] = []
    dailyTransactionsByDate[dateKey].push(t)
    const absAmt = Math.abs(Number(t.amount)) || 0
    dailyGrossTotal[dateKey] = (dailyGrossTotal[dateKey] || 0) + absAmt
    if (!t.is_excluded_from_total) {
      dailyIncludedTotal[dateKey] = (dailyIncludedTotal[dateKey] || 0) + absAmt
    }
  })
  for (const key of Object.keys(dailyTransactionsByDate)) {
    dailyTransactionsByDate[key].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }

  const maxSpending = Math.max(...Object.values(dailyIncludedTotal), 1)

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

  const handleDateClick = async (day: number) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setSelectedDate(dateStr)
    
    startTransition(async () => {
      const data = await getTransactionsByDate(dateStr)
      setSelectedTransactions(data)
      setDialogOpen(true)
    })
  }

  const handleDeleteClick = (id: string) => {
    setTransactionToDelete(id)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!transactionToDelete) return
    
    startTransition(async () => {
      const result = await deleteTransaction(transactionToDelete)
      if (result.success) {
        setSelectedTransactions(selectedTransactions.filter((t) => t.id !== transactionToDelete))
        setTransactions(transactions.filter((t) => t.id !== transactionToDelete))
      }
      setDeleteConfirmOpen(false)
      setTransactionToDelete(null)
    })
  }

  const handleEditClick = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setEditDialogOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingTransaction) return

    const formData = new FormData(e.currentTarget)
    const data = {
      date: formData.get('date') as string,
      amount: parseFloat((formData.get('amount') as string).replace(/,/g, '')),
      content: formData.get('content') as string,
      category: formData.get('category') as string,
      detail: formData.get('detail') as string || '',
      payment_method: formData.get('payment_method') as string,
    }

    startTransition(async () => {
      const result = await updateTransaction(editingTransaction.id, data)
      if (!result.error && result.data) {
        const updatedTransaction = result.data as Transaction
        setSelectedTransactions(
          selectedTransactions.map((t) =>
            t.id === editingTransaction.id ? updatedTransaction : t
          )
        )
        setTransactions(
          transactions.map((t) =>
            t.id === editingTransaction.id ? updatedTransaction : t
          )
        )
        setEditDialogOpen(false)
        setEditingTransaction(null)
      }
    })
  }

  const getSpendingColor = (spending: number) => {
    if (spending === 0) return ''
    const intensity = Math.min(spending / maxSpending, 1)
    if (intensity < 0.25) return 'bg-green-600/10 dark:bg-green-500/15'
    if (intensity < 0.5) return 'bg-green-600/22 dark:bg-green-500/25'
    if (intensity < 0.75) return 'bg-green-600/35 dark:bg-green-500/38'
    return 'bg-green-600/48 dark:bg-green-500/50'
  }

  const formatAmountInput = (value: string) => {
    const numbers = value.replace(/[^\d-]/g, '')
    if (!numbers || numbers === '-') return numbers
    const num = parseInt(numbers, 10)
    return num.toLocaleString('ko-KR')
  }

  const calendarDays = []
  
  // Empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="min-h-[4.25rem]" />)
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const spending = dailyIncludedTotal[dateStr] || 0
    const dayGrossTotal = dailyGrossTotal[dateStr] || 0
    const dayTransactions = dailyTransactionsByDate[dateStr] ?? []
    const totalCount = dayTransactions.length
    const isToday =
      day === today.getDate() &&
      month === today.getMonth() + 1 &&
      year === today.getFullYear()

    calendarDays.push(
      <button
        key={day}
        type="button"
        onClick={() => handleDateClick(day)}
        className={cn(
          'min-h-[4.25rem] flex flex-col items-center justify-start gap-0.5 p-1 rounded-lg transition-colors',
          'hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring',
          getSpendingColor(spending),
          isToday && 'ring-2 ring-primary'
        )}
      >
        <div className="flex items-center justify-center w-full px-0.5">
          <span className={cn('text-sm font-medium leading-none', isToday && 'text-primary')}>
            {day}
          </span>
        </div>
        {totalCount > 0 && (
          <span
            className="text-[11px] text-muted-foreground leading-none tabular-nums"
            title="이 날짜에 기록된 거래 금액 합계"
          >
            {formatCurrency(dayGrossTotal).replace('₩', '')}
          </span>
        )}
        {totalCount > 0 && (
          <div
            className="flex flex-wrap justify-center gap-px max-w-full px-0.5 mt-0.5"
            title={`거래 ${totalCount}건`}
          >
            {dayTransactions.map((t) => (
              <span
                key={t.id}
                className={cn(
                  'size-1.5 shrink-0 rounded-full',
                  t.is_excluded_from_total
                    ? 'bg-muted-foreground/50 dark:bg-muted-foreground/45'
                    : 'bg-green-600 dark:bg-green-500'
                )}
              />
            ))}
          </div>
        )}
      </button>
    )
  }

  // Total spending for the month
  const monthlyTotal = Object.values(dailyIncludedTotal).reduce((sum, val) => sum + val, 0)

  const includedDayTransactions = selectedTransactions.filter((t) => !t.is_excluded_from_total)
  const excludedDayTransactions = selectedTransactions.filter((t) => t.is_excluded_from_total)
  const includedDaySum = includedDayTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
  const excludedDaySum = excludedDayTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const renderTransactionCard = (t: Transaction) => {
    const excluded = t.is_excluded_from_total
    return (
    <Card
      key={t.id}
      className={cn(
        'p-3 flex items-center justify-between gap-2 border',
        excluded
          ? 'border-muted-foreground/20 bg-muted/40 text-muted-foreground'
          : 'border-green-600/30 bg-green-50/80 dark:bg-green-950/35 dark:border-green-700/45'
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              'font-medium truncate',
              excluded ? 'text-muted-foreground' : 'text-green-900 dark:text-green-100'
            )}
          >
            {t.content}
          </span>
          <span
            className={cn(
              'text-xs px-1.5 py-0.5 rounded shrink-0',
              excluded
                ? 'bg-muted text-muted-foreground'
                : 'bg-green-100 text-green-900 dark:bg-green-900/55 dark:text-green-100'
            )}
          >
            {t.category}
          </span>
          {excluded && (
            <Badge
              variant="outline"
              className="text-[10px] font-normal shrink-0 border-muted-foreground/35 text-muted-foreground"
            >
              합계 제외
            </Badge>
          )}
        </div>
        <div
          className={cn(
            'flex items-center gap-2 text-xs mt-1',
            excluded ? 'text-muted-foreground' : 'text-green-800 dark:text-green-300/90'
          )}
        >
          <span>{t.payment_method}</span>
        </div>
        {t.detail && (
          <p
            className={cn(
              'text-xs mt-1 truncate',
              excluded ? 'text-muted-foreground/90' : 'text-green-800/85 dark:text-green-400/80'
            )}
          >
            {t.detail}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <span
          className={cn(
            'font-semibold mr-1 tabular-nums',
            excluded
              ? 'text-muted-foreground'
              : t.amount < 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-green-700 dark:text-green-400'
          )}
        >
          {formatCurrency(t.amount)}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={() => handleEditClick(t)}
          disabled={isPending}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => handleDeleteClick(t.id)}
          disabled={isPending}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4">
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

      {error && (
        <Card className="p-4 bg-destructive/10 text-destructive">
          {error}
        </Card>
      )}

      <Card className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {WEEKDAYS.map((day, i) => (
                <div
                  key={day}
                  className={cn(
                    'text-center text-xs font-medium py-2',
                    i === 0 && 'text-red-500',
                    i === 6 && 'text-blue-500'
                  )}
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">{calendarDays}</div>
          </>
        )}
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-sm text-muted-foreground">이번 달 총 지출</span>
            <p className="text-xs text-muted-foreground mt-0.5">
              합계에 포함되는 거래만 집계합니다.
            </p>
          </div>
          <span className="text-xl font-bold shrink-0">{formatCurrency(monthlyTotal)}</span>
        </div>
      </Card>

      {/* Transaction List Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDate && formatFullDate(selectedDate)}
            </DialogTitle>
            <DialogDescription className="sr-only">
              선택한 날짜의 거래 내역을 확인하고 수정하거나 삭제할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          {isPending ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : selectedTransactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              거래 내역이 없습니다
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg border border-green-600/25 bg-green-50/70 dark:bg-green-950/40 dark:border-green-700/40 p-3">
                  <p className="text-green-800/90 dark:text-green-300/90 text-xs mb-1">
                    실제 지출 (합계 반영)
                  </p>
                  <p className="font-semibold text-green-900 dark:text-green-100">
                    {formatCurrency(includedDaySum)}
                  </p>
                  <p className="text-[11px] text-green-800/75 dark:text-green-400/80 mt-0.5">
                    {includedDayTransactions.length}건
                  </p>
                </div>
                <div className="rounded-lg border border-muted-foreground/20 border-dashed bg-muted/35 p-3">
                  <p className="text-muted-foreground text-xs mb-1">합계 제외</p>
                  <p className="font-semibold text-muted-foreground">{formatCurrency(excludedDaySum)}</p>
                  <p className="text-[11px] text-muted-foreground/90 mt-0.5">
                    {excludedDayTransactions.length}건
                  </p>
                </div>
              </div>

              {includedDayTransactions.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-medium text-green-800 dark:text-green-400">실제 지출</h3>
                  {includedDayTransactions.map(renderTransactionCard)}
                </div>
              )}

              {excludedDayTransactions.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-medium text-muted-foreground">합계 제외 항목</h3>
                  <p className="text-xs text-muted-foreground -mt-1">
                    저축·투자·네이버포인트(복지) 등은 월 합계와 분석에서 빠집니다.
                  </p>
                  {excludedDayTransactions.map(renderTransactionCard)}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Transaction Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>거래 수정</DialogTitle>
            <DialogDescription className="sr-only">
              거래 내역의 날짜, 금액, 내용, 카테고리, 결제수단을 수정할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          {editingTransaction && (
            <form onSubmit={handleEditSubmit} className="flex flex-col gap-4 mt-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-date">날짜</Label>
                <Input
                  id="edit-date"
                  name="date"
                  type="date"
                  defaultValue={editingTransaction.date}
                  className="h-11"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-amount">금액</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    ₩
                  </span>
                  <Input
                    id="edit-amount"
                    name="amount"
                    type="text"
                    inputMode="numeric"
                    defaultValue={formatAmountInput(editingTransaction.amount.toString())}
                    className="h-11 pl-8"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-content">내용</Label>
                <Input
                  id="edit-content"
                  name="content"
                  type="text"
                  defaultValue={editingTransaction.content}
                  className="h-11"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-category">카테고리</Label>
                <Select name="category" defaultValue={editingTransaction.category} required>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-payment">결제수단</Label>
                <Select name="payment_method" defaultValue={editingTransaction.payment_method} required>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="결제수단 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-detail">상세 (선택)</Label>
                <Input
                  id="edit-detail"
                  name="detail"
                  type="text"
                  defaultValue={editingTransaction.detail || ''}
                  className="h-11"
                />
              </div>

              <Button
                type="submit"
                className="h-12 mt-2"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  '저장'
                )}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>거래를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. 거래 내역이 영구적으로 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  삭제 중...
                </>
              ) : (
                '삭제'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
