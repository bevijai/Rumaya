import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { ApiError } from '@/lib/api'
import PageHeader from '@/components/PageHeader'
import BottomNav from '@/components/BottomNav'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, ChevronLeft, ChevronRight, CalendarCheck, CalendarDays, CalendarPlus, Clock3 } from 'lucide-react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  startOfMonth,
  startOfWeek,
} from 'date-fns'

type LeaveType = 'home' | 'extra_day_off' | 'sick' | 'other'
type LeaveStatus = 'pending' | 'approved' | 'declined' | 'cancelled'

interface LeaveRequestDto {
  id: string
  type: LeaveType
  fromDate: string
  toDate: string
  reason: string
  status: LeaveStatus
  requestedBy: { id: string; name: string }
  decision?: { comment: string; status: LeaveStatus } | null
}

interface LeaveBalance {
  homeLeaveAllowanceDays: number
  homeLeaveUsedDays: number
  homeLeaveRemainingDays: number
  extraDayOffUsedDays: number
  sickUsedDays: number
  otherUsedDays: number
  pendingCount: number
}

const typeLabels: Record<LeaveType, string> = {
  home: 'Home leave',
  extra_day_off: 'Extra day off',
  sick: 'Sick leave',
  other: 'Other',
}

const typeDot: Record<LeaveType, string> = {
  home: 'bg-emerald-500',
  extra_day_off: 'bg-indigo-500',
  sick: 'bg-red-500',
  other: 'bg-slate-500',
}

const statusStyles: Record<LeaveStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  declined: 'bg-red-50 text-red-700 ring-red-200',
  cancelled: 'bg-slate-100 text-slate-500 ring-slate-200',
}

export default function LeavePage() {
  const { call, member } = useAuth()
  const canDecide = member?.role === 'owner' || member?.role === 'editor'
  const canCreate = member?.role === 'helper'
  const canRecord = member?.role === 'owner' || member?.role === 'editor'

  const [requests, setRequests] = useState<LeaveRequestDto[]>([])
  const [balance, setBalance] = useState<LeaveBalance | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()))

  const [type, setType] = useState<LeaveType>('home')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [reason, setReason] = useState('')
  const [recordComment, setRecordComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function load() {
    call<{ leaveRequests: LeaveRequestDto[] }>('/leave-requests')
      .then((data) => setRequests(data.leaveRequests))
      .finally(() => setLoading(false))
    call<LeaveBalance>('/leave-requests/balance')
      .then(setBalance)
      .catch(() => {})
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const path = canRecord && !canCreate ? '/leave-requests/record' : '/leave-requests'
      const body =
        canRecord && !canCreate
          ? { type, fromDate, toDate, reason, comment: recordComment || 'Recorded leave' }
          : { type, fromDate, toDate, reason }
      await call(path, { method: 'POST', body })
      setShowForm(false)
      setFromDate('')
      setToDate('')
      setReason('')
      setRecordComment('')
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not submit leave request.')
    } finally {
      setSubmitting(false)
    }
  }

  async function decide(id: string, status: 'approved' | 'declined', comment: string) {
    await call(`/leave-requests/${id}/decision`, { method: 'POST', body: { status, comment } })
    load()
  }

  const pending = requests.filter((r) => r.status === 'pending')
  const rest = requests.filter((r) => r.status !== 'pending')

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 pb-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-[24rem] w-[24rem] rounded-full bg-indigo-200/20 blur-3xl" />
      </div>
      <div className="relative z-10 mx-auto max-w-md px-5 pt-6">
        <div className="flex items-center justify-between">
          <PageHeader title="Leave" />
          {(canCreate || canRecord) && (
            <button
              onClick={() => setShowForm((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/25"
            >
              <Plus className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Balance */}
        {balance && (
          <div className="mb-5 grid grid-cols-2 gap-2">
            <BalanceStat label="Home leave left" value={balance.homeLeaveRemainingDays} tone="blue" icon={CalendarCheck} />
            <BalanceStat label="Home leave used" value={balance.homeLeaveUsedDays} tone="slate" icon={CalendarDays} />
            <BalanceStat label="Extra days used" value={balance.extraDayOffUsedDays} tone="indigo" icon={CalendarPlus} />
            <BalanceStat label="Pending requests" value={balance.pendingCount} tone="amber" icon={Clock3} />
          </div>
        )}

        {/* Calendar */}
        <Card className="mb-5 p-4">
          <div className="mb-3 flex items-center justify-between">
            <button
              onClick={() => setCalendarMonth((m) => addMonths(m, -1))}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-semibold text-slate-900">{format(calendarMonth, 'MMMM yyyy')}</p>
            <button
              onClick={() => setCalendarMonth((m) => addMonths(m, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <LeaveCalendarGrid month={calendarMonth} requests={requests} />
          <div className="mt-3 flex flex-wrap gap-3">
            {Object.entries(typeLabels).map(([value, label]) => (
              <span key={value} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className={`h-2 w-2 rounded-full ${typeDot[value as LeaveType]}`} />
                {label}
              </span>
            ))}
          </div>
        </Card>

        {(canCreate || canRecord) && showForm && (
          <Card className="mb-5 p-5">
            <p className="mb-3 text-sm font-semibold text-slate-900">
              {canCreate ? 'Ask for leave' : 'Record leave'}
            </p>
            <form onSubmit={handleCreate} className="space-y-3">
              <select
                value={type}
                onChange={(e) => setType(e.target.value as LeaveType)}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm"
              >
                {Object.entries(typeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <div className="flex gap-3">
                <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} required />
                <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} required />
              </div>
              <Input placeholder="Reason" value={reason} onChange={(e) => setReason(e.target.value)} required />
              {canRecord && !canCreate && (
                <Input
                  placeholder="Comment (e.g. agreed on WhatsApp)"
                  value={recordComment}
                  onChange={(e) => setRecordComment(e.target.value)}
                  required
                />
              )}
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Submitting…' : canCreate ? 'Submit request' : 'Record leave'}
              </Button>
            </form>
          </Card>
        )}

        {loading && <p className="text-sm text-slate-500">Loading…</p>}

        {!loading && canDecide && (
          <div className="mb-5">
            <p className="mb-2 text-sm font-semibold text-slate-900">Requests waiting</p>
            {pending.length === 0 && <p className="text-sm text-slate-500">No requests waiting.</p>}
            <div className="space-y-3">
              {pending.map((r) => (
                <LeaveItem key={r.id} request={r} canDecide={canDecide} onDecide={decide} />
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-900">All leave</p>
          <div className="space-y-3">
            {!loading && (canDecide ? rest : requests).length === 0 && (
              <p className="text-sm text-slate-500">No leave recorded yet.</p>
            )}
            {(canDecide ? rest : requests).map((r) => (
              <LeaveItem key={r.id} request={r} canDecide={canDecide} onDecide={decide} />
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}

const balanceTones = {
  slate: { icon: 'bg-slate-100 text-slate-500', value: 'text-slate-900' },
  indigo: { icon: 'bg-indigo-50 text-indigo-600', value: 'text-indigo-600' },
  blue: { icon: 'bg-blue-50 text-blue-600', value: 'text-blue-600' },
  amber: { icon: 'bg-amber-50 text-amber-600', value: 'text-amber-600' },
} as const

function BalanceStat({
  label,
  value,
  tone = 'slate',
  icon: Icon,
}: {
  label: string
  value: number
  tone?: keyof typeof balanceTones
  icon?: typeof CalendarCheck
}) {
  const t = balanceTones[tone]
  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <p className={`font-serif text-2xl font-semibold ${t.value}`}>{value}</p>
        {Icon && (
          <span className={`flex h-6 w-6 items-center justify-center rounded-lg ${t.icon}`}>
            <Icon className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  )
}

function LeaveCalendarGrid({ month, requests }: { month: Date; requests: LeaveRequestDto[] }) {
  const gridStart = startOfWeek(startOfMonth(month))
  const gridEnd = endOfWeek(endOfMonth(month))
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })
  const today = new Date()

  function leaveOn(day: Date) {
    return requests.find(
      (r) =>
        r.status !== 'cancelled' &&
        r.status !== 'declined' &&
        isWithinInterval(day, { start: new Date(r.fromDate), end: new Date(r.toDate) }),
    )
  }

  return (
    <div className="grid grid-cols-7 gap-1 text-center">
      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
        <div key={i} className="text-[10px] font-semibold uppercase text-slate-400">
          {d}
        </div>
      ))}
      {days.map((day) => {
        const leave = leaveOn(day)
        const inMonth = isSameMonth(day, month)
        return (
          <div
            key={day.toISOString()}
            className={`relative flex h-8 items-center justify-center rounded-lg text-xs ${
              inMonth ? 'text-slate-700' : 'text-slate-300'
            } ${isSameDay(day, today) ? 'font-bold ring-1 ring-blue-400' : ''}`}
          >
            {format(day, 'd')}
            {leave && (
              <span
                className={`absolute bottom-0.5 h-1.5 w-1.5 rounded-full ${typeDot[leave.type]} ${
                  leave.status === 'pending' ? 'opacity-40' : ''
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function LeaveItem({
  request,
  canDecide,
  onDecide,
}: {
  request: LeaveRequestDto
  canDecide: boolean
  onDecide: (id: string, status: 'approved' | 'declined', comment: string) => Promise<void>
}) {
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
            <span className={`h-2 w-2 rounded-full ${typeDot[request.type]}`} />
            {typeLabels[request.type]}
          </p>
          <p className="text-xs text-slate-500">
            {request.fromDate.slice(0, 10)} → {request.toDate.slice(0, 10)}
          </p>
          <p className="mt-1 text-xs text-slate-500">by {request.requestedBy.name}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${statusStyles[request.status]}`}>
          {request.status}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-600">{request.reason}</p>
      {request.decision?.comment && (
        <p className="mt-1 text-xs text-slate-500">&ldquo;{request.decision.comment}&rdquo;</p>
      )}

      {canDecide && request.status === 'pending' && (
        <div className="mt-3 space-y-2">
          <Input
            placeholder="Comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="h-10"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1"
              disabled={busy || !comment}
              onClick={async () => {
                setBusy(true)
                await onDecide(request.id, 'approved', comment)
                setBusy(false)
              }}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="flex-1"
              disabled={busy || !comment}
              onClick={async () => {
                setBusy(true)
                await onDecide(request.id, 'declined', comment)
                setBusy(false)
              }}
            >
              Decline
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
