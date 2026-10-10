import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import PageHeader from '@/components/PageHeader'
import BottomNav from '@/components/BottomNav'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SUPPORTED_LANGUAGES } from '@/lib/languages'
import { LogOut, ShieldCheck, User, Copy, Check } from 'lucide-react'

const roleLabels: Record<string, string> = { owner: 'Owner', editor: 'Editor', helper: 'Helper' }

export default function AdminPage() {
  const { member, household, members, logout, call, refreshMe } = useAuth()
  const navigate = useNavigate()
  const canInvite = member?.role === 'owner' || member?.role === 'editor'

  const [inviteRole, setInviteRole] = useState<'editor' | 'helper'>('helper')
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [savingLanguage, setSavingLanguage] = useState(false)

  async function generateInvite() {
    setGenerating(true)
    setCopied(false)
    try {
      const data = await call<{ code: string }>('/household/invite', {
        method: 'POST',
        body: { role: inviteRole },
      })
      setInviteCode(data.code)
    } finally {
      setGenerating(false)
    }
  }

  async function copyCode() {
    if (!inviteCode) return
    await navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function updateLanguage(language: string) {
    setSavingLanguage(true)
    try {
      await call('/household/me/language', { method: 'PUT', body: { language } })
      await refreshMe()
    } finally {
      setSavingLanguage(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 pb-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-[24rem] w-[24rem] rounded-full bg-indigo-200/20 blur-3xl" />
      </div>
      <div className="relative z-10 mx-auto max-w-md px-5 pt-6">
        <PageHeader title="Profile" />

        <Card className="flex items-center gap-3 p-5">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <User className="h-6 w-6" />
          </span>
          <div>
            <p className="text-sm font-bold text-slate-900">{member?.name}</p>
            <p className="text-xs text-slate-500">
              {roleLabels[member?.role ?? '']} · {household?.name}
            </p>
          </div>
        </Card>

        <Card className="mt-4 divide-y divide-slate-100">
          <div className="px-4 py-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Preferred language</p>
            <select
              value={member?.preferredLanguage ?? 'en'}
              disabled={savingLanguage}
              onChange={(e) => updateLanguage(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </Card>

        <Card className="mt-4 divide-y divide-slate-100">
          <div className="px-4 py-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Household members</p>
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-1.5 text-sm">
                <span className="text-slate-800">{m.name}</span>
                <span className="text-xs text-slate-500">{roleLabels[m.role]}</span>
              </div>
            ))}
          </div>
        </Card>

        {canInvite && (
          <Card className="mt-4 p-5">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              Invite someone
            </p>
            <div className="flex gap-2">
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'editor' | 'helper')}
                className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm"
              >
                <option value="helper">Helper</option>
                <option value="editor">Editor</option>
              </select>
              <Button size="sm" onClick={generateInvite} disabled={generating}>
                {generating ? 'Generating…' : 'Generate code'}
              </Button>
            </div>
            {inviteCode && (
              <div className="mt-4 space-y-2">
                <p className="rounded-xl bg-slate-100 py-4 text-center font-mono text-2xl font-bold tracking-[0.3em] text-slate-800">
                  {inviteCode}
                </p>
                <Button variant="secondary" size="sm" className="w-full" onClick={copyCode}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied!' : 'Copy code'}
                </Button>
                <p className="text-center text-xs text-slate-400">Expires in 7 days · single use</p>
              </div>
            )}
          </Card>
        )}

        <Button
          variant="secondary"
          className="mt-6 w-full"
          onClick={() => {
            logout()
            navigate('/')
          }}
        >
          <LogOut className="h-4 w-4" />
          Log out
        </Button>
      </div>

      <BottomNav />
    </div>
  )
}
