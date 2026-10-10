import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { ApiError } from '@/lib/api'
import PageHeader from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react'

interface ContractTermsDto {
  helperName: string
  employerName: string
  basicSalary: number
  restDayRateOverride?: number
  contractStart: string
  contractLengthMonths: number
  agreedRestDaysPerMonth: number
  homeLeaveAllowanceDays: number
  payDayWorkingDayN: number
  unpaidHome: boolean
  unpaidExtraDayOff: boolean
  unpaidSick: boolean
  unpaidOther: boolean
}

type PayFieldType = 'add' | 'subtract' | 'note' | 'number' | 'date' | 'yesno'

interface PayFieldDto {
  id: string
  name: string
  type: PayFieldType
  visible: boolean
  sortOrder: number
}

const PAY_FIELD_TYPE_LABELS: Record<PayFieldType, string> = {
  add: 'Adds to pay',
  subtract: 'Takes from pay',
  note: 'Note',
  number: 'Number',
  date: 'Date',
  yesno: 'Yes / No',
}

const DEFAULTS: ContractTermsDto = {
  helperName: '',
  employerName: '',
  basicSalary: 700,
  contractStart: new Date().toISOString().slice(0, 10),
  contractLengthMonths: 24,
  agreedRestDaysPerMonth: 1,
  homeLeaveAllowanceDays: 15,
  payDayWorkingDayN: 2,
  unpaidHome: false,
  unpaidExtraDayOff: true,
  unpaidSick: false,
  unpaidOther: true,
}

export default function ContractTermsPage() {
  const { call, member } = useAuth()
  const navigate = useNavigate()
  const canEdit = member?.role === 'owner' || member?.role === 'editor'

  const [form, setForm] = useState<ContractTermsDto>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const [payFields, setPayFields] = useState<PayFieldDto[]>([])
  const [newFieldName, setNewFieldName] = useState('')
  const [newFieldType, setNewFieldType] = useState<PayFieldType>('add')

  function loadPayFields() {
    call<{ payFields: PayFieldDto[] }>('/household/pay-fields').then((data) => setPayFields(data.payFields))
  }

  useEffect(() => {
    loadPayFields()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function addPayField() {
    if (!newFieldName.trim()) return
    await call('/household/pay-fields', { method: 'POST', body: { name: newFieldName.trim(), type: newFieldType } })
    setNewFieldName('')
    loadPayFields()
  }

  async function updatePayField(id: string, patch: Partial<PayFieldDto>) {
    setPayFields((fs) => fs.map((f) => (f.id === id ? { ...f, ...patch } : f)))
    await call(`/household/pay-fields/${id}`, { method: 'PATCH', body: patch })
  }

  async function deletePayField(id: string) {
    setPayFields((fs) => fs.filter((f) => f.id !== id))
    await call(`/household/pay-fields/${id}`, { method: 'DELETE' })
  }

  useEffect(() => {
    call<{ contractTerms: (ContractTermsDto & { contractStart: string }) | null }>('/household/contract-terms')
      .then((data) => {
        if (data.contractTerms) {
          setForm({ ...data.contractTerms, contractStart: data.contractTerms.contractStart.slice(0, 10) })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function set<K extends keyof ContractTermsDto>(key: K, value: ContractTermsDto[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    setSaved(false)
    try {
      await call('/household/contract-terms', { method: 'PUT', body: form })
      setSaved(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save contract terms.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 pb-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-[24rem] w-[24rem] rounded-full bg-indigo-200/20 blur-3xl" />
      </div>
      <div className="relative z-10 mx-auto max-w-md px-5 pt-6">
        <PageHeader title="Contract terms" />

        {!canEdit && (
          <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700 ring-1 ring-amber-200">
            Only your employer can edit contract terms. You&rsquo;re viewing in read-only mode.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Card>
            <CardContent className="space-y-4 p-5">
              <Field label="Helper name">
                <Input value={form.helperName} disabled={!canEdit} onChange={(e) => set('helperName', e.target.value)} required />
              </Field>
              <Field label="Employer name">
                <Input value={form.employerName} disabled={!canEdit} onChange={(e) => set('employerName', e.target.value)} required />
              </Field>
              <Field label="Basic monthly salary (S$)">
                <Input
                  type="number"
                  step="0.01"
                  value={form.basicSalary}
                  disabled={!canEdit}
                  onChange={(e) => set('basicSalary', Number(e.target.value))}
                  required
                />
              </Field>
              <Field label="Contract start date">
                <Input
                  type="date"
                  value={form.contractStart}
                  disabled={!canEdit}
                  onChange={(e) => set('contractStart', e.target.value)}
                  required
                />
              </Field>
              <Field label="Contract length (months)">
                <Input
                  type="number"
                  value={form.contractLengthMonths}
                  disabled={!canEdit}
                  onChange={(e) => set('contractLengthMonths', Number(e.target.value))}
                  required
                />
              </Field>
              <Field label="Agreed rest days per month">
                <Input
                  type="number"
                  value={form.agreedRestDaysPerMonth}
                  disabled={!canEdit}
                  onChange={(e) => set('agreedRestDaysPerMonth', Number(e.target.value))}
                  required
                />
              </Field>
              <Field label="Paid home-leave allowance (days)">
                <Input
                  type="number"
                  value={form.homeLeaveAllowanceDays}
                  disabled={!canEdit}
                  onChange={(e) => set('homeLeaveAllowanceDays', Number(e.target.value))}
                  required
                />
              </Field>
              <Field label="Pay day = Nth working day of next month">
                <Input
                  type="number"
                  value={form.payDayWorkingDayN}
                  disabled={!canEdit}
                  onChange={(e) => set('payDayWorkingDayN', Number(e.target.value))}
                  required
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-5">
              <p className="text-sm font-semibold text-slate-900">Unpaid leave types</p>
              {(
                [
                  ['unpaidHome', 'All home leave'],
                  ['unpaidExtraDayOff', 'Extra day off'],
                  ['unpaidSick', 'Sick leave'],
                  ['unpaidOther', 'Other leave'],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center justify-between text-sm text-slate-700">
                  {label}
                  <input
                    type="checkbox"
                    checked={form[key]}
                    disabled={!canEdit}
                    onChange={(e) => set(key, e.target.checked)}
                    className="h-4 w-4 accent-blue-600"
                  />
                </label>
              ))}
            </CardContent>
          </Card>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {saved && <p className="text-sm text-blue-600">Contract terms saved.</p>}

          {canEdit && (
            <Button type="submit" size="lg" className="w-full" disabled={saving}>
              {saving ? 'Saving…' : 'Save contract terms'}
            </Button>
          )}
        </form>

        <Card className="mt-4">
          <CardContent className="space-y-3 p-5">
            <p className="text-sm font-semibold text-slate-900">Pay fields</p>
            <p className="text-xs text-slate-500">
              Shown when entering each month’s salary. “Adds to pay” and “Takes from pay” change the total.
            </p>
            {payFields.map((f) => (
              <div key={f.id} className="flex items-center gap-2 rounded-xl bg-slate-50 p-2">
                <Input
                  value={f.name}
                  disabled={!canEdit}
                  onChange={(e) => setPayFields((fs) => fs.map((x) => (x.id === f.id ? { ...x, name: e.target.value } : x)))}
                  onBlur={(e) => updatePayField(f.id, { name: e.target.value })}
                  className="h-9 flex-1"
                />
                <select
                  value={f.type}
                  disabled={!canEdit}
                  onChange={(e) => updatePayField(f.id, { type: e.target.value as PayFieldType })}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs"
                >
                  {Object.entries(PAY_FIELD_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                {canEdit && (
                  <>
                    <button
                      type="button"
                      onClick={() => updatePayField(f.id, { visible: !f.visible })}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                    >
                      {f.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => deletePayField(f.id)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            ))}
            {canEdit && (
              <div className="flex items-center gap-2 pt-1">
                <Input
                  placeholder="New field name"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  className="h-9 flex-1"
                />
                <select
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value as PayFieldType)}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs"
                >
                  {Object.entries(PAY_FIELD_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <Button type="button" size="sm" onClick={addPayField}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Button type="button" variant="secondary" className="mt-4 w-full" onClick={() => navigate('/app/salary')}>
          View salary
        </Button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  )
}
