'use client'

import { useState, useTransition, useEffect } from 'react'
import { Button } from '@/components/ui/button'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, X, Loader2, Check } from 'lucide-react'
import { createTransaction, addCategory } from '@/app/actions'
import { getToday } from '@/lib/format'
import { shouldExcludeFromTotal } from '@/lib/types'

interface TransactionFormProps {
  categories: string[]
  paymentMethods: string[]
  onSuccess?: () => void
}

export function TransactionForm({
  categories,
  paymentMethods,
  onSuccess,
}: TransactionFormProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [date, setDate] = useState(getToday())
  const [amount, setAmount] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('')
  const [detail, setDetail] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [localCategories, setLocalCategories] = useState(categories)
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    setLocalCategories(categories)
  }, [categories])

  const isExcluded = category && paymentMethod
    ? shouldExcludeFromTotal(category, paymentMethod)
    : false

  const resetForm = () => {
    setDate(getToday())
    setAmount('')
    setContent('')
    setCategory('')
    setDetail('')
    setPaymentMethod('')
    setNewCategory('')
    setShowNewCategory(false)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const cleanedAmount = amount.replace(/,/g, '')
    const numAmount = parseFloat(cleanedAmount)
    
    if (isNaN(numAmount) || numAmount === 0) {
      setError('유효한 금액을 입력해주세요.')
      return
    }
    
    if (!content || !category || !paymentMethod) {
      setError('모든 필수 항목을 입력해주세요.')
      return
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(date)) {
      setError('날짜 형식이 올바르지 않습니다.')
      return
    }

    const transactionData = {
      date,
      amount: numAmount,
      content,
      category,
      detail: detail || '',
      payment_method: paymentMethod,
    }

    startTransition(async () => {
      try {
        const result = await createTransaction(transactionData)

        if (result.error) {
          setError(result.error)
        } else {
          setShowSuccess(true)
          setTimeout(() => {
            setShowSuccess(false)
            resetForm()
            setOpen(false)
            onSuccess?.()
          }, 800)
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
        setError(errMsg)
      }
    })
  }

  const handleAddCategory = () => {
    if (!newCategory.trim()) return

    startTransition(async () => {
      const result = await addCategory(newCategory.trim())
      if (!result.error) {
        setLocalCategories([...localCategories, newCategory.trim()])
        setCategory(newCategory.trim())
        setNewCategory('')
        setShowNewCategory(false)
      } else {
        setError('카테고리 추가에 실패했습니다.')
      }
    })
  }

  const formatAmountInput = (value: string) => {
    const numbers = value.replace(/[^\d-]/g, '')
    if (!numbers || numbers === '-') return numbers
    const num = parseInt(numbers, 10)
    return num.toLocaleString('ko-KR')
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) {
        setError(null)
        setShowSuccess(false)
      }
    }}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg z-50 bg-primary hover:bg-primary/90"
        >
          <Plus className="h-6 w-6" />
          <span className="sr-only">거래 추가</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">거래 추가</DialogTitle>
          <DialogDescription className="sr-only">
            날짜, 금액, 내용, 카테고리, 결제수단을 입력하여 새 거래를 추가합니다.
          </DialogDescription>
        </DialogHeader>

        {showSuccess ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-lg font-medium text-green-600">저장 완료!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
            {error && (
              <div className="rounded-lg bg-destructive/10 text-destructive p-3 text-sm">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="date">날짜</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="amount">금액</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  ₩
                </span>
                <Input
                  id="amount"
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(formatAmountInput(e.target.value))}
                  className="h-11 pl-8"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                양수(+)는 지출, 음수(-)는 수입
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="content">내용</Label>
              <Input
                id="content"
                type="text"
                placeholder="점심, 커피 등"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="h-11"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="category">카테고리</Label>
              {showNewCategory ? (
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="새 카테고리 이름"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="h-11 flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleAddCategory}
                    className="h-11 w-11"
                    disabled={isPending}
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowNewCategory(false)}
                    className="h-11 w-11"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {localCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                    <button
                      type="button"
                      onClick={() => setShowNewCategory(true)}
                      className="w-full px-2 py-1.5 text-sm text-left text-primary hover:bg-accent rounded-sm"
                    >
                      + 새 카테고리 추가
                    </button>
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="payment">결제수단</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
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
              <Label htmlFor="detail">상세 (선택)</Label>
              <Input
                id="detail"
                type="text"
                placeholder="추가 메모"
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                className="h-11"
              />
            </div>

            {isExcluded && (
              <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                이 거래는 총 지출에서 제외됩니다.
              </div>
            )}

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
  )
}
