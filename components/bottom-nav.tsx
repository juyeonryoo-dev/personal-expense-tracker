'use client'

import { Calendar, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Tab = 'calendar' | 'analytics'

interface BottomNavProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-40">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        <button
          onClick={() => onTabChange('calendar')}
          className={cn(
            'flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors',
            activeTab === 'calendar'
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Calendar className="h-5 w-5" />
          <span className="text-xs font-medium">캘린더</span>
        </button>
        <button
          onClick={() => onTabChange('analytics')}
          className={cn(
            'flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors',
            activeTab === 'analytics'
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <BarChart3 className="h-5 w-5" />
          <span className="text-xs font-medium">분석</span>
        </button>
      </div>
    </nav>
  )
}
