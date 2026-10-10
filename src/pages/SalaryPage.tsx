import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { ApiError } from '@/lib/api'
import PageHeader from '@/components/PageHeader'
import BottomNav from '@/components/BottomNav'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BreakdownRow } from '@/components/ui/breakdown-row'
import { PayTrendChart } from '@/components/ui/trend-chart'
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  Wallet,
  CalendarDays,
  TrendingUp,
} from 'lucide-react'
import type { MonthSalaryResult, TallyState } from '@/domain/salary/types'

type PayFieldType = 'add' | 'subtract' | 'note' | 'number' | 'date' | 'yesno'
interface PayFieldWithValue {
  id: string
  name: string
  type: PayFieldType
  visible: boolean
  value: unknown
}
interface TallyInfo {
  state: TallyState
  helperOff: number | null
  employerOff: number | null
  comment: string | null
  respondedAt: string | null
}
interface MonthResponse {
  result: MonthSalaryResult
  payDay: string
  status: 'paid' | 'due' | 'overdue' | 'upcoming'
  paid: boolean
  paidOn: string | null
  signed: boolean
  tallyInPerson: boolean
  payFields: PayFieldWithValue[]
  tally: TallyInfo
  helperName: string
  employerName: string
}
interface MonthListItem {
  yyyymm: string
  netPay: number
  status: MonthResponse['status']
  paid: boolean
  payDay: string
}

const statusStyles: Record<MonthResponse['status'], string> = {
  paid: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  due: 'bg-amber-50 text-amber-700 ring-amber-200',
  overdue: 'bg-red-50 text-red-700 ring-red-200',
  upcoming: 'bg-slate-100 text-slate-600 ring-slate-200',
}

const tallyStyles: Record<TallyState, { label: string; cls: string }> = {
  not_recorded: { label: 'Not recorded', cls: 'bg-slate-100 text-slate-500 ring-slate-200' },
  month_not_ended: { label: 'Month not ended', cls: 'bg-slate-100 text-slate-500 ring-slate-200' },
  waiting_for_her: { label: 'Waiting for confirmation', cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  agreed: { label: 'Agreed', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  disputed: { label: 'Disputed', cls: 'bg-red-50 text-red-700 ring-red-200' },
  needs_recheck: { label: 'Needs re-check', cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  confirmed_in_person: { label: 'Confirmed in person', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
}

function monthLabel(yyyymm: string) {
  const [y, m] = yyyymm.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-SG', { month: 'long', year: 'numeric' })
}

function monthShortLabel(yyyymm: string) {
  const [y, m] = yyyymm.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-SG', { month: 'short' })
}

export default function SalaryPage() {
  const { call, member } = useAuth()
  const navigate = useNavigate()
  const canEdit = member?.role === 'owner' || member?.role === 'editor'
  const isHelper = member?.role === 'helper'

  const [allMonths, setAllMonths] = useState<MonthListItem[]>([])
  const [selected, setSelected] = useState<string>(new Date().toISOString().slice(0, 7))
  const [data, setData] = useState<MonthResponse | null>(null)
  const [notSetUp, setNotSetUp] = useState(false)
  const [loading, setLoading] = useState(true)

  const [restDaysTaken, setRestDaysTaken] = useState(0)
  const [paidOn, setPaidOn] = useState('')
  const [signed, setSigned] = useState(false)
  const [tallyInPerson, setTallyInPerson] = useState(false)
  const [fieldValues, setFieldValues] = useState<Record<string, unknown>>({})
  const [saving, setSaving] = useState(false)
  const [actionMsg, setActionMsg] = useState<string | null>(null)

  const [expandedMonth, setExpandedMonth] = useState<string | null>(null)
  const [monthDetails, setMonthDetails] = useState<Record<string, MonthResponse>>({})
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null)

  useEffect(() => {
    call<{ months: MonthListItem[] }>('/months')
      .then((res) => {
        setAllMonths(res.months)
        const current = new Date().toISOString().slice(0, 7)
        if (res.months.some((m) => m.yyyymm === current)) setSelected(current)
        else if (res.months.length) setSelected(res.months[0].yyyymm)
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setNotSetUp(true)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function loadMonth(yyyymm: string) {
    setLoading(true)
    setActionMsg(null)
    call<MonthResponse>(`/months/${yyyymm}`)
      .then((res) => {
        setData(res)
        setRestDaysTaken(res.result.restDaysTaken)
        setPaidOn(res.paidOn ?? res.payDay)
        setSigned(res.signed)
        setTallyInPerson(res.tallyInPerson)
        const values: Record<string, unknown> = {}
        res.payFields.forEach((f) => (values[f.id] = f.value ?? ''))
        setFieldValues(values)
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setNotSetUp(true)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!notSetUp) loadMonth(selected)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected])

  const idx = allMonths.findIndex((m) => m.yyyymm === selected)

  async function saveDraft() {
    setSaving(true)
    setActionMsg(null)
    try {
      await call(`/months/${selected}/draft`, {
        method: 'PUT',
        body: { restDaysTaken, paidOn, signed, tallyInPerson, fieldValues },
      })
      setActionMsg('Saved.')
      loadMonth(selected)
    } catch (err) {
      setActionMsg(err instanceof ApiError ? err.message : 'Could not save.')
    } finally {
      setSaving(false)
    }
  }

  async function markPaid(paid: boolean) {
    const comment = window.prompt(paid ? 'Add a note for marking this month as paid:' : 'Add a note for reversing this payment:')
    if (comment === null) return
    setSaving(true)
    setActionMsg(null)
    try {
      await call(`/months/${selected}/${paid ? 'mark-paid' : 'mark-unpaid'}`, { method: 'POST', body: { comment } })
      loadMonth(selected)
    } catch (err) {
      setActionMsg(err instanceof ApiError ? err.message : 'Could not update payment status.')
    } finally {
      setSaving(false)
    }
  }

  async function respondTally(response: 'agree' | 'disagree') {
    const comment = response === 'disagree' ? window.prompt('What is wrong with the rest-day count?') : ''
    if (comment === null) return
    setSaving(true)
    try {
      await call(`/months/${selected}/tally/respond`, { method: 'POST', body: { response, comment } })
      loadMonth(selected)
    } finally {
      setSaving(false)
    }
  }

  function copyPayslip() {
    if (!data) return
    const r = data.result
    const lines = [
      `Payslip \u00b7 ${monthLabel(selected)}`,
      `${data.helperName} \u2014 employer: ${data.employerName}`,
      `Pro-rated basic: $${r.proRatedBasic.toFixed(2)}`,
      `Rest-day pay (${r.sundaysWorked} Sundays worked): $${r.restDayPay.toFixed(2)}`,
      `Additions: $${r.additions.toFixed(2)}`,
      `Deductions: -$${r.deductions.toFixed(2)}`,
      `Unpaid leave (${r.unpaidLeaveDays} days): -$${r.unpaidDeduction.toFixed(2)}`,
      `Net pay: $${r.netPay.toFixed(2)}`,
      data.paid ? `Paid on ${data.paidOn}` : `Pay day: ${data.payDay}`,
    ]
    navigator.clipboard.writeText(lines.join('\n'))
    setActionMsg('Payslip copied to clipboard.')
  }

  async function toggleMonthDetail(yyyymm: string) {
    if (expandedMonth === yyyymm) {
      setExpandedMonth(null)
      return
    }
    setExpandedMonth(yyyymm)
    if (!monthDetails[yyyymm]) {
      setLoadingDetail(yyyymm)
      try {
        const detail = await call<MonthResponse>(`/months/${yyyymm}`)
        setMonthDetails((d) => ({ ...d, [yyyymm]: detail }))
      } finally {
        setLoadingDetail(null)
      }
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 pb-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-[24rem] w-[24rem] rounded-full bg-indigo-200/20 blur-3xl" />
      </div>
      <div className="relative z-10 mx-auto max-w-md px-5 pt-6">
        <PageHeader title="Salary" />

        {loading && !data && <p className="text-sm text-slate-500">Loading…</p>}

        {notSetUp && (
          <Card className="p-6 text-center">
            <p className="text-sm text-slate-600">
              Contract terms haven&rsquo;t been set up yet, so salary can&rsquo;t be calculated.
            </p>
            {canEdit && (
              <Button className="mt-4" onClick={() => navigate('/app/contract-terms')}>
                Set up contract terms
              </Button>
            )}
          </Card>
        )}

        {!notSetUp && data && (
          <>
            {/* Month navigator + hero */}
            <div className="mb-3 flex items-center justify-between">
              <button
                disabled={idx <= 0}
                onClick={() => setSelected(allMonths[idx - 1].yyyymm)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200 disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <p className="text-sm font-bold text-slate-900">{monthLabel(selected)}</p>
              <button
                disabled={idx < 0 || idx >= allMonths.length - 1}
                onClick={() => setSelected(allMonths[idx + 1].yyyymm)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200 disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 text-white shadow-2xl shadow-slate-900/30">
              <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-blue-400/20 blur-2xl" />
              <p className="text-sm text-slate-300">Net pay</p>
              <p className="mt-1 text-4xl font-extrabold tracking-tight">${data.result.netPay.toFixed(2)}</p>
              <span
                className={`mt-4 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ${statusStyles[data.status]}`}
              >
                {data.status === 'paid' ? `Paid on ${data.paidOn}` : `Pay day ${data.payDay}`}
              </span>
            </div>

            {/* Side stats */}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Stat label="Basic salary" value={`$${data.result.proRatedBasic.toFixed(2)}`} tone="slate" icon={Wallet} />
              <Stat
                label="Rest-day rate"
                value={`$${data.result.restDayRate.toFixed(2)}`}
                tone="indigo"
                icon={CalendarDays}
              />
              <Stat
                label="Paid to date"
                value={`$${allMonths
                  .filter((m) => m.paid)
                  .reduce((s, m) => s + m.netPay, 0)
                  .toFixed(2)}`}
                tone="green"
                icon={CheckCircle2}
              />
              <Stat
                label="Months paid"
                value={`${allMonths.filter((m) => m.paid).length} / ${allMonths.length}`}
                tone="blue"
                icon={TrendingUp}
              />
            </div>

            {/* Payment trend */}
            {allMonths.length > 1 && (
              <Card className="mt-3 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">Payment trend</p>
                  <div className="flex items-center gap-2.5 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Paid
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Due
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> Upcoming
                    </span>
                  </div>
                </div>
                <PayTrendChart
                  points={allMonths.map((m) => ({
                    label: monthShortLabel(m.yyyymm),
                    value: m.netPay,
                    status: m.status,
                  }))}
                />
              </Card>
            )}

            {/* Editable draft */}
            <Card className="mt-4 p-5">
              <p className="mb-3 text-sm font-semibold text-slate-900">Rest days &amp; payment</p>
              <div className="space-y-3">
                <FieldRow label={`Rest days ${data.helperName} took (of ${data.result.sundaysInPeriod} Sundays)`}>
                  <Input
                    type="number"
                    min={0}
                    max={data.result.sundaysInPeriod}
                    value={restDaysTaken}
                    disabled={!canEdit}
                    onChange={(e) => setRestDaysTaken(Number(e.target.value))}
                    className="h-10 w-24"
                  />
                </FieldRow>
                <FieldRow label="Paid on">
                  <Input type="date" value={paidOn} disabled={!canEdit} onChange={(e) => setPaidOn(e.target.value)} className="h-10 w-40" />
                </FieldRow>
                {data.payFields
                  .filter((f) => f.visible)
                  .map((f) => (
                    <FieldRow key={f.id} label={f.name}>
                      <PayFieldInput
                        field={f}
                        value={fieldValues[f.id]}
                        disabled={!canEdit}
                        onChange={(v) => setFieldValues((vals) => ({ ...vals, [f.id]: v }))}
                      />
                    </FieldRow>
                  ))}
                <label className="flex items-center justify-between text-sm text-slate-700">
                  {data.helperName} has signed for this amount
                  <input
                    type="checkbox"
                    checked={signed}
                    disabled={!canEdit}
                    onChange={(e) => setSigned(e.target.checked)}
                    className="h-4 w-4 accent-blue-600"
                  />
                </label>
                <label className="flex items-center justify-between text-sm text-slate-700">
                  Confirmed rest-days in person
                  <input
                    type="checkbox"
                    checked={tallyInPerson}
                    disabled={!canEdit}
                    onChange={(e) => setTallyInPerson(e.target.checked)}
                    className="h-4 w-4 accent-blue-600"
                  />
                </label>
              </div>
              {canEdit && (
                <Button size="sm" className="mt-4" onClick={saveDraft} disabled={saving}>
                  {saving ? 'Saving\u2026' : 'Save changes'}
                </Button>
              )}
            </Card>

            {/* Tally */}
            <Card className="mt-4 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">Month-end rest-day tally</p>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${tallyStyles[data.tally.state].cls}`}>
                  {tallyStyles[data.tally.state].label}
                </span>
              </div>
              {data.tally.comment && <p className="mt-2 text-sm text-slate-600">&ldquo;{data.tally.comment}&rdquo;</p>}
              {isHelper && ['waiting_for_her', 'needs_recheck', 'disputed'].includes(data.tally.state) && (
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={() => respondTally('agree')} disabled={saving}>
                    Yes, correct
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => respondTally('disagree')} disabled={saving}>
                    Not correct
                  </Button>
                </div>
              )}
              {canEdit && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => markPaid(true)} disabled={saving}>
                    {data.paid ? 'Update payment' : 'Mark as paid'}
                  </Button>
                  {data.paid && (
                    <Button size="sm" variant="secondary" onClick={() => markPaid(false)} disabled={saving}>
                      Mark unpaid
                    </Button>
                  )}
                </div>
              )}
              {actionMsg && <p className="mt-2 text-xs text-slate-500">{actionMsg}</p>}
            </Card>

            {/* Payslip receipt */}
            <Card className="mt-4 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">Payslip</p>
                <button onClick={copyPayslip} className="flex items-center gap-1 text-xs font-medium text-blue-600">
                  <Copy className="h-3.5 w-3.5" /> Copy
                </button>
              </div>
              <div className="mt-3 divide-y divide-slate-100">
                <Row label="Pro-rated basic" value={data.result.proRatedBasic} />
                <Row label={`Rest-day pay (${data.result.sundaysWorked} Sundays)`} value={data.result.restDayPay} kind="positive" />
                <Row label="Additions" value={data.result.additions} kind="positive" />
                <Row label="Deductions" value={-data.result.deductions} kind="negative" />
                <Row
                  label={`Unpaid leave (${data.result.unpaidLeaveDays} days)`}
                  value={-data.result.unpaidDeduction}
                  kind="negative"
                />
                <Row label="Net pay" value={data.result.netPay} bold kind="total" />
              </div>
            </Card>

            {/* All months */}
            <div className="mt-6">
              <p className="mb-2 text-sm font-semibold text-slate-900">All months</p>
              <Card className="divide-y divide-slate-100">
                {allMonths.map((m) => {
                  const expanded = expandedMonth === m.yyyymm
                  const detail = monthDetails[m.yyyymm]
                  return (
                    <div key={m.yyyymm}>
                      <button
                        onClick={() => toggleMonthDetail(m.yyyymm)}
                        className={`flex w-full items-center justify-between px-4 py-3 text-left ${m.yyyymm === selected ? 'bg-blue-50' : ''}`}
                      >
                        <span className="text-sm font-medium text-slate-800">{monthLabel(m.yyyymm)}</span>
                        <span className="flex items-center gap-2">
                          <span className="text-sm text-slate-600">${m.netPay.toFixed(2)}</span>
                          <StatusIcon status={m.status} />
                          <ChevronRight className={`h-3.5 w-3.5 text-slate-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                        </span>
                      </button>
                      {expanded && (
                        <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3">
                          {loadingDetail === m.yyyymm && <p className="text-xs text-slate-500">Loading…</p>}
                          {detail && (
                            <div className="space-y-2">
                              <div className="divide-y divide-slate-200">
                                <Row label="Pro-rated basic" value={detail.result.proRatedBasic} />
                                <Row
                                  label={`Rest-day pay (${detail.result.sundaysWorked} Sundays)`}
                                  value={detail.result.restDayPay}
                                  kind="positive"
                                />
                                <Row label="Additions" value={detail.result.additions} kind="positive" />
                                <Row label="Deductions" value={-detail.result.deductions} kind="negative" />
                                <Row
                                  label={`Unpaid leave (${detail.result.unpaidLeaveDays} days)`}
                                  value={-detail.result.unpaidDeduction}
                                  kind="negative"
                                />
                                <Row label="Net pay" value={detail.result.netPay} bold kind="total" />
                              </div>
                              <div className="flex items-center justify-between pt-1 text-xs text-slate-500">
                                <span className={`rounded-full px-2 py-0.5 ring-1 ${tallyStyles[detail.tally.state].cls}`}>
                                  {tallyStyles[detail.tally.state].label}
                                </span>
                                <button
                                  onClick={() => setSelected(m.yyyymm)}
                                  className="font-medium text-blue-600 hover:underline"
                                >
                                  Open in editor →
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </Card>
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

const statTones = {
  slate: { icon: 'bg-slate-100 text-slate-500', value: 'text-slate-900' },
  indigo: { icon: 'bg-indigo-50 text-indigo-600', value: 'text-indigo-600' },
  green: { icon: 'bg-emerald-50 text-emerald-600', value: 'text-emerald-600' },
  blue: { icon: 'bg-blue-50 text-blue-600', value: 'text-blue-600' },
} as const

function Stat({
  label,
  value,
  tone = 'slate',
  icon: Icon,
}: {
  label: string
  value: string
  tone?: keyof typeof statTones
  icon?: typeof Wallet
}) {
  const t = statTones[tone]
  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center gap-2">
        {Icon && (
          <span className={`flex h-6 w-6 items-center justify-center rounded-lg ${t.icon}`}>
            <Icon className="h-3.5 w-3.5" />
          </span>
        )}
        <p className="text-xs text-slate-500">{label}</p>
      </div>
      <p className={`mt-1 font-mono text-base font-semibold ${t.value}`}>{value}</p>
    </div>
  )
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-slate-700">{label}</span>
      {children}
    </div>
  )
}

function PayFieldInput({
  field,
  value,
  disabled,
  onChange,
}: {
  field: PayFieldWithValue
  value: unknown
  disabled: boolean
  onChange: (v: unknown) => void
}) {
  if (field.type === 'yesno') {
    return (
      <input
        type="checkbox"
        checked={!!value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-blue-600"
      />
    )
  }
  if (field.type === 'date') {
    return (
      <Input type="date" value={(value as string) ?? ''} disabled={disabled} onChange={(e) => onChange(e.target.value)} className="h-10 w-40" />
    )
  }
  if (field.type === 'note') {
    return (
      <Input
        type="text"
        value={(value as string) ?? ''}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-40"
      />
    )
  }
  return (
    <Input
      type="number"
      step="0.01"
      value={(value as number) ?? ''}
      disabled={disabled}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-10 w-24"
    />
  )
}

const Row = BreakdownRow

function StatusIcon({ status }: { status: MonthResponse['status'] }) {
  if (status === 'paid') return <CheckCircle2 className="h-4 w-4 text-emerald-600" />
  if (status === 'overdue') return <AlertTriangle className="h-4 w-4 text-red-600" />
  return <Clock3 className="h-4 w-4 text-slate-400" />
}
