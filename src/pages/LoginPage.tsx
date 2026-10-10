import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, ArrowRight, Building2, HeartHandshake, Home, Search, ShieldCheck, Sparkles, UserRound, Wallet } from 'lucide-react'
import { apiFetch, ApiError } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { SUPPORTED_LANGUAGES } from '@/lib/languages'

const trustPoints = [
  { icon: Search, text: 'Discover verified helper profiles matched to your household' },
  { icon: Building2, text: 'Connect through licensed Singapore employment agencies' },
  { icon: Wallet, text: 'Manage salary, leave, and records after placement' },
  { icon: ShieldCheck, text: 'Consent-led profiles with clear validation history' },
]

/** Turns a thrown error into a user-facing message, distinguishing API errors from network failures. */
function describeError(err: unknown): string {
  if (err instanceof ApiError) return err.message
  if (err instanceof TypeError) return 'Could not reach the server. Is the backend running?'
  return 'Something went wrong. Please try again.'
}

function normalizePhone(value: string): string {
  const compact = value.trim().replace(/[\s()-]/g, '')
  if (/^\d{8}$/.test(compact)) return `+65${compact}`
  if (compact.startsWith('00')) return `+${compact.slice(2)}`
  return compact
}

type Mode = 'signin' | 'create' | 'join'

export default function LoginPage() {
  const navigate = useNavigate()
  const { completeLogin } = useAuth()

  const [mode, setMode] = useState<Mode>('signin')
  const [step, setStep] = useState<'form' | 'otp'>('form')
  const [showHouseholdAccess, setShowHouseholdAccess] = useState(false)
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [householdName, setHouseholdName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [language, setLanguage] = useState('en')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const normalizedPhone = normalizePhone(phone)
    if (!/^\+[1-9]\d{6,14}$/.test(normalizedPhone)) {
      setError('Enter a valid phone number with country code, such as +65 9123 4567.')
      return
    }
    setBusy(true)
    try {
      if (mode === 'signin') {
        await apiFetch('/auth/otp/start', { method: 'POST', body: { phone: normalizedPhone } })
      } else if (mode === 'create') {
        await apiFetch('/auth/register-household', {
          method: 'POST',
          body: { phone: normalizedPhone, name, householdName, language },
        })
      } else {
        await apiFetch('/auth/join', {
          method: 'POST',
          body: { code: inviteCode, phone: normalizedPhone, name, language },
        })
      }
      setPhone(normalizedPhone)
      setStep('otp')
    } catch (err) {
      setError(describeError(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const data = await apiFetch<{ accessToken: string; refreshToken: string }>('/auth/otp/verify', {
        method: 'POST',
        body: { phone: normalizePhone(phone), code },
      })
      await completeLogin(data.accessToken, data.refreshToken)
      navigate('/app')
    } catch (err) {
      setError(describeError(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleDevSkip() {
    setError(null)
    setBusy(true)
    try {
      const data = await apiFetch<{ accessToken: string; refreshToken: string }>('/auth/dev-login', {
        method: 'POST',
      })
      await completeLogin(data.accessToken, data.refreshToken)
      navigate('/app')
    } catch (err) {
      setError(describeError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      {/* Ambient premium background: deep navy base with soft blue/indigo glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[36rem] w-[36rem] rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-[30rem] w-[30rem] rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-[26rem] w-[26rem] rounded-full bg-teal-400/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col lg:flex-row lg:items-center">
        {/* Branding / trust panel */}
        <div className="flex flex-1 flex-col justify-center px-8 pt-16 pb-10 lg:px-16 lg:py-16">
          <div className="mb-8 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium tracking-wide text-blue-300">
            <Sparkles className="h-3.5 w-3.5" />
            For employers, helpers, and licensed agencies
          </div>
          <h1 className="max-w-lg text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
            Find, hire, and support the right helper, <span className="text-blue-400">all in one place</span>.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-slate-400">
            Browse verified profiles, connect through an agency, and continue with Rumaya
            throughout the employment relationship.
          </p>

          <Button
            type="button"
            size="lg"
            onClick={() => navigate('/helpers')}
            className="mt-7 w-fit"
          >
            Browse verified helpers
            <ArrowRight className="h-4 w-4" />
          </Button>

          <ul className="mt-10 space-y-4">
            {trustPoints.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-slate-300">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 text-blue-400 ring-1 ring-white/10">
                  <Icon className="h-4 w-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* Auth card */}
        <div className="flex flex-1 items-center justify-center px-6 pb-16 lg:px-16 lg:py-16">
          <Card className="relative w-full max-w-md overflow-hidden rounded-lg border-white/10 bg-white/[0.06] shadow-[0_32px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
            <div className="absolute inset-x-0 top-0 h-px bg-blue-400/70" />
            <CardHeader className="gap-2 p-6 pb-0 sm:p-8 sm:pb-0">
              <p className="text-[11px] font-extrabold uppercase text-blue-300">Secure access</p>
              <CardTitle className="text-2xl text-white">
                {step === 'otp' ? 'Enter your code' : showHouseholdAccess ? 'Household access' : 'Welcome to Rumaya'}
              </CardTitle>
              <CardDescription className="leading-6 text-slate-300">
                {step === 'otp'
                  ? `We sent a code to ${phone}.`
                  : showHouseholdAccess
                    ? 'Manage an existing household, create one, or join by invitation.'
                    : 'Choose your role to register or sign in.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 sm:p-8">
              {step === 'form' && !showHouseholdAccess && (
                <div>
                  <div className="divide-y divide-white/10 border-y border-white/10">
                  <button
                    type="button"
                    onClick={() => navigate('/employer')}
                    className="group flex w-full items-center gap-4 px-1 py-5 text-left transition hover:bg-white/[0.04]"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-blue-400/20 bg-blue-400/10 text-blue-300"><UserRound className="h-5 w-5" /></span>
                    <span className="min-w-0 flex-1"><span className="block text-sm font-extrabold text-white">Employer</span><span className="mt-1 block text-xs text-slate-400">Register or sign in to find a helper</span></span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-500 transition group-hover:translate-x-1 group-hover:text-blue-300" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/helpers/join')}
                    className="group flex w-full items-center gap-4 px-1 py-5 text-left transition hover:bg-white/[0.04]"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-emerald-400/20 bg-emerald-400/10 text-emerald-300"><HeartHandshake className="h-5 w-5" /></span>
                    <span className="min-w-0 flex-1"><span className="block text-sm font-extrabold text-white">Helper</span><span className="mt-1 block text-xs text-slate-400">Create a profile or sign in</span></span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-500 transition group-hover:translate-x-1 group-hover:text-emerald-300" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/agency')}
                    className="group flex w-full items-center gap-4 px-1 py-5 text-left transition hover:bg-white/[0.04]"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-amber-300/20 bg-amber-300/10 text-amber-200"><Building2 className="h-5 w-5" /></span>
                    <span className="min-w-0 flex-1"><span className="block text-sm font-extrabold text-white">Employment agency</span><span className="mt-1 block text-xs text-slate-400">Invited agency registration and sign in</span></span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-500 transition group-hover:translate-x-1 group-hover:text-amber-200" />
                  </button>
                  </div>

                  <div className="pt-5">
                    <button
                      type="button"
                      onClick={() => setShowHouseholdAccess(true)}
                      className="flex w-full items-center justify-center gap-2 text-sm font-bold text-slate-300 hover:text-white"
                    >
                      <Home className="h-4 w-4" /> Manage an existing household
                    </button>
                  </div>
                </div>
              )}

              {step === 'form' && showHouseholdAccess && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setShowHouseholdAccess(false)
                      setError(null)
                    }}
                    className="mb-5 flex items-center gap-2 text-xs font-bold text-blue-300 hover:text-white"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to role selection
                  </button>
                  <div className="mb-5 grid grid-cols-3 gap-1 rounded-lg border border-white/10 bg-black/20 p-1">
                    {(
                      [
                        { key: 'signin', label: 'Sign in' },
                        { key: 'create', label: 'Create' },
                        { key: 'join', label: 'Join' },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => {
                          setMode(tab.key)
                          setError(null)
                        }}
                        className={`rounded-md py-2 text-xs font-semibold transition-colors ${
                          mode === tab.key ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleSubmitForm} className="space-y-4">
                    {mode === 'create' && (
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-300">Household name</label>
                        <Input
                          placeholder="e.g. The Tan Family"
                          value={householdName}
                          onChange={(e) => setHouseholdName(e.target.value)}
                          required
                          className="border-white/10 bg-white/[0.07] text-white placeholder:text-slate-500"
                        />
                      </div>
                    )}
                    {mode === 'join' && (
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-300">Invite code</label>
                        <Input
                          placeholder="e.g. GUD52J"
                          value={inviteCode}
                          onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                          required
                          maxLength={6}
                          className="border-white/10 bg-white/[0.07] text-white placeholder:text-slate-500"
                        />
                      </div>
                    )}
                    {mode !== 'signin' && (
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-300">Your name</label>
                        <Input
                          placeholder="Full name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          className="border-white/10 bg-white/[0.07] text-white placeholder:text-slate-500"
                        />
                      </div>
                    )}
                    {mode !== 'signin' && (
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-300">Preferred language</label>
                        <select
                          value={language}
                          onChange={(e) => setLanguage(e.target.value)}
                          className="h-12 w-full rounded-lg border border-white/10 bg-slate-900 px-4 text-sm text-white"
                        >
                          {SUPPORTED_LANGUAGES.map((l) => (
                            <option key={l.code} value={l.code}>
                              {l.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <label htmlFor="phone" className="text-sm font-medium text-slate-300">
                        Phone number
                      </label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+65 9123 4567"
                        autoComplete="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        className="border-white/10 bg-white/[0.07] text-white placeholder:text-slate-500"
                      />
                    </div>

                    {error && <p className="text-sm text-red-300">{error}</p>}

                    <Button type="submit" className="w-full" size="lg" disabled={busy}>
                      {busy ? 'Please wait…' : 'Continue'}
                    </Button>

                    {import.meta.env.DEV && (
                      <button
                        type="button"
                        onClick={handleDevSkip}
                        disabled={busy}
                        className="w-full text-center text-sm font-medium text-slate-500 hover:text-slate-300"
                      >
                        Skip for now (dev) →
                      </button>
                    )}
                  </form>
                </>
              )}

              {step === 'otp' && (
                <form onSubmit={handleVerify} className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="code" className="text-sm font-medium text-slate-300">
                      Verification code
                    </label>
                    <Input
                      id="code"
                      inputMode="numeric"
                      placeholder="123456"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      required
                      className="border-white/10 bg-white/[0.07] text-white placeholder:text-slate-500"
                    />
                  </div>

                  {error && <p className="text-sm text-red-300">{error}</p>}

                  <Button type="submit" className="w-full" size="lg" disabled={busy}>
                    {busy ? 'Verifying…' : 'Verify & continue'}
                  </Button>

                  <button
                    type="button"
                    onClick={() => {
                      setStep('form')
                      setError(null)
                    }}
                    className="w-full text-center text-sm font-medium text-slate-400 hover:text-white"
                  >
                    ← Back
                  </button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
