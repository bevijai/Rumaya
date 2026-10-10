import { NavLink } from 'react-router-dom'
import { CalendarDays, Home, MessageCircle, User, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { to: '/app', label: 'Home', icon: Home, end: true },
  { to: '/app/salary', label: 'Salary', icon: Wallet },
  { to: '/app/leave', label: 'Leave', icon: CalendarDays },
  { to: '/app/messages', label: 'Chat', icon: MessageCircle },
  { to: '/app/profile', label: 'Profile', icon: User },
]

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200/70 bg-white/80 backdrop-blur-xl [padding-bottom:env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors',
                isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full transition-colors',
                    isActive && 'bg-blue-50',
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
