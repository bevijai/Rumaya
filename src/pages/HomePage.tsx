import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import BottomNav from '@/components/BottomNav'
import { useAuth } from '@/context/AuthContext'
import {
  Bell,
  CalendarDays,
  ClipboardList,
  ReceiptText,
  Wallet,
  ArrowUpRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'

const quickActions = [
  { icon: Wallet, label: 'Salary', to: '/app/salary', accent: 'from-blue-500 to-blue-600 shadow-blue-500/25' },
  { icon: CalendarDays, label: 'Leave', to: '/app/leave', accent: 'from-indigo-500 to-indigo-600 shadow-indigo-500/25' },
  { icon: ClipboardList, label: 'Activity', to: '/app/activity', accent: 'from-amber-500 to-amber-600 shadow-amber-500/25' },
  { icon: ReceiptText, label: 'Payslip', to: '/app/payslip', accent: 'from-slate-600 to-slate-700 shadow-slate-500/25' },
]

const currentYyyymm = new Date().toISOString().slice(0, 7)

interface MonthResponse {
  result: { netPay: number }
  payDay: string
  status: 'paid' | 'due' | 'overdue' | 'upcoming'
  helperName: string
}

interface ActivityLogDto {
  id: string
  comment: string
  at: string
}

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function relativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

function daysUntil(dateStr: string) {
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000)
  return diff
}

function initials(name?: string) {
  if (!name) return '?'
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join('')
}

export default function HomePage() {
  const { call, member, household } = useAuth()
  const navigate = useNavigate()
  const [month, setMonth] = useState<MonthResponse | null>(null)
  const [activity, setActivity] = useState<ActivityLogDto[]>([])

  useEffect(() => {
    call<MonthResponse>(`/months/${currentYyyymm}`)
      .then(setMonth)
      .catch(() => {})
    call<{ activityLogs: ActivityLogDto[] }>('/activity-log')
      .then((data) => setActivity(data.activityLogs.slice(0, 3)))
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const untilPayday = month && month.status !== 'paid' ? daysUntil(month.payDay) : null

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50">
      {/* Same ambient brand glow as the login screen, toned down for a light background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="bg-dot-grid absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]" />
        <div className="absolute -top-48 -left-48 h-[32rem] w-[32rem] rounded-full bg-blue-200/40 blur-3xl" />
        <div className="absolute top-1/4 -right-40 h-[28rem] w-[28rem] rounded-full bg-indigo-200/30 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-md px-5 pb-28 pt-[calc(env(safe-area-inset-top)+1.5rem)]">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-sm text-slate-500">
              {greeting()}, <span className="font-semibold text-slate-700">{member?.name ?? '…'}</span>
            </p>
            {household?.name && <p className="truncate text-xs text-slate-400">{household.name}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
              <Bell className="h-5 w-5 text-slate-600" />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-blue-500" />
            </button>
            <button
              onClick={() => navigate('/app/profile')}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-bold text-white shadow-sm shadow-blue-500/25"
            >
              {initials(member?.name)}
            </button>
          </div>
        </div>

        {/* Hero balance card */}
        <button
          onClick={() => navigate('/app/salary')}
          className="relative mt-6 w-full overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 text-left text-white shadow-2xl shadow-slate-900/40 ring-1 ring-white/10"
        >
          <div className="pointer-events-none absolute -top-14 -right-14 h-48 w-48 rounded-full bg-blue-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-indigo-400/10 blur-3xl" />
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-sm text-slate-300">
              <Sparkles className="h-3.5 w-3.5 text-blue-300" />
              This month&rsquo;s net pay
            </p>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/10">
              <Wallet className="h-4 w-4 text-blue-300" />
            </span>
          </div>
          <p className="mt-2 text-[2.75rem] font-extrabold leading-none tracking-tight">
            {month ? `$${month.result.netPay.toFixed(2)}` : '—'}
          </p>
          {month?.helperName && <p className="mt-1.5 text-xs text-slate-400">for {month.helperName}</p>}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {month ? (
              <>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-blue-300 ring-1 ring-white/10">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  {month.status === 'paid' ? 'Paid' : `Pay day ${month.payDay}`}
                </span>
                {untilPayday !== null && untilPayday >= 0 && (
                  <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-200 ring-1 ring-white/10">
                    {untilPayday === 0 ? 'Due today' : `${untilPayday} day${untilPayday === 1 ? '' : 's'} left`}
                  </span>
                )}
              </>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-200 ring-1 ring-white/10">
                Set up contract terms to see salary
              </span>
            )}
          </div>
        </button>

        {/* Quick actions */}
        <div className="mt-7 grid grid-cols-4 gap-3">
          {quickActions.map(({ icon: Icon, label, to, accent }) => (
            <button
              key={label}
              onClick={() => navigate(to)}
              className="flex flex-col items-center gap-2 rounded-2xl bg-white py-4 shadow-sm ring-1 ring-slate-200 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md ${accent}`}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-xs font-medium text-slate-700">{label}</span>
            </button>
          ))}
        </div>

        {/* Recent activity */}
        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Recent activity</h2>
            <button className="text-xs font-medium text-blue-600" onClick={() => navigate('/app/activity')}>
              See all
            </button>
          </div>
          <Card className="divide-y divide-slate-100 bg-white/90">
            {activity.length === 0 && <p className="px-4 py-3.5 text-sm text-slate-500">No activity yet.</p>}
            {activity.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 px-4 py-3.5 first:rounded-t-3xl last:rounded-b-3xl"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{item.comment}</p>
                </div>
                <span className="shrink-0 text-xs text-slate-400">{relativeTime(item.at)}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
