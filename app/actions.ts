'use server'

import { createClient } from '@/lib/supabase'
import { formatYearMonthDay, getDaysInMonth } from '@/lib/format'
import { revalidateTag } from 'next/cache'
import { shouldExcludeFromTotal } from '@/lib/types'
import type { TransactionFormData, Transaction, MonthlyAnalytics, CategorySpending } from '@/lib/types'

export async function createTransaction(data: TransactionFormData) {
  const supabase = createClient()

  const isExcluded = shouldExcludeFromTotal(data.category, data.payment_method)

  const { data: transaction, error } = await supabase
    .from('transactions')
    .insert({
      date: data.date,
      amount: data.amount,
      content: data.content,
      category: data.category,
      detail: data.detail || null,
      payment_method: data.payment_method,
      is_excluded_from_total: isExcluded,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating transaction:', error)
    return { error: error.message }
  }

  revalidateTag('transactions', 'max')
  return { data: transaction }
}

export async function updateTransaction(id: string, data: TransactionFormData) {
  const supabase = createClient()

  const isExcluded = shouldExcludeFromTotal(data.category, data.payment_method)

  const { data: transaction, error } = await supabase
    .from('transactions')
    .update({
      date: data.date,
      amount: data.amount,
      content: data.content,
      category: data.category,
      detail: data.detail || null,
      payment_method: data.payment_method,
      is_excluded_from_total: isExcluded,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating transaction:', error)
    return { error: error.message }
  }

  revalidateTag('transactions', 'max')
  return { data: transaction }
}

export async function getTransactions(month: number, year: number): Promise<Transaction[]> {
  const supabase = createClient()

  const startDate = formatYearMonthDay(year, month, 1)
  const lastDay = getDaysInMonth(month, year)
  const endDate = formatYearMonthDay(year, month, lastDay)

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching transactions:', error)
    return []
  }

  return data || []
}

export async function getTransactionsByDate(date: string): Promise<Transaction[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('date', date)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching transactions by date:', error)
    return []
  }

  return data || []
}

export async function deleteTransaction(id: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting transaction:', error)
    return { error: error.message }
  }

  revalidateTag('transactions', 'max')
  return { success: true }
}

export async function getMonthlyAnalytics(month: number, year: number): Promise<MonthlyAnalytics> {
  const supabase = createClient()

  const startDate = formatYearMonthDay(year, month, 1)
  const lastDay = getDaysInMonth(month, year)
  const endDate = formatYearMonthDay(year, month, lastDay)

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .eq('is_excluded_from_total', false)

  if (error) {
    console.error('Error fetching analytics:', error)
    return { totalSpending: 0, categoryBreakdown: [], transactionCount: 0 }
  }

  const transactions = data || []
  const totalSpending = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const categoryTotals = transactions.reduce((acc, t) => {
    const absAmount = Math.abs(t.amount)
    acc[t.category] = (acc[t.category] || 0) + absAmount
    return acc
  }, {} as Record<string, number>)

  const categoryBreakdown: CategorySpending[] = Object.entries(categoryTotals)
    .map(([category, total]) => ({
      category,
      total,
      percentage: totalSpending > 0 ? (total / totalSpending) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total)

  return {
    totalSpending,
    categoryBreakdown,
    transactionCount: transactions.length,
  }
}

export async function getCategories(): Promise<string[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('categories')
    .select('name')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  return data?.map((c) => c.name) || []
}

export async function addCategory(name: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('categories')
    .insert({ name })

  if (error) {
    console.error('Error adding category:', error)
    return { error: error.message }
  }

  revalidateTag('categories', 'max')
  return { success: true }
}

export async function getPaymentMethods(): Promise<string[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('payment_methods')
    .select('name')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching payment methods:', error)
    return []
  }

  return data?.map((p) => p.name) || []
}

export async function getPreviousMonthAnalytics(month: number, year: number): Promise<MonthlyAnalytics> {
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  return getMonthlyAnalytics(prevMonth, prevYear)
}
