import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock3,
  LogOut,
  Mail,
  Phone,
  Search,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/api'
import { useMarketplaceAuth } from '@/context/useMarketplaceAuth'

interface EmployerInquiry {
  id: string
  status: string
  submittedAt: string
  helperProfile: { id: string; displayName: string; status: string }
  agency: { id: string; displayName: string; status: string }
}

function describeError(error: unknown) {
  if (error instanceof ApiError) return error.message
  return 'Something went wrong. Please try again.'
}

function formatStatus(status: string) {
  return status.replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase())
}

export default function EmployerAccessPage() {
  const navigate = useNavigate()
  const {
    account,
    loading,
    registerEmployer,
    startPhoneVerification,
    verifyPhone,
    startEmailVerification,
    verifyEmail,
    call,
    logout,
  } = useMarketplaceAuth()
  const [mode, setMode] = useState<'signin' | 'create'>('signin')
  const [step, setStep] = useState<'details' | 'phone-code'>('details')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [emailCode, setEmailCode] = useState('')
  const [emailCodeSent, setEmailCodeSent] = useState(false)
  const [inquiries, setInquiries] = useState<EmployerInquiry[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!account) return
    call<{ inquiries: EmployerInquiry[] }>('/marketplace/employer-agency/mine')
      .then((data) => setInquiries(data.inquiries))
      .catch(() => setInquiries([]))
  }, [account, call])

  async function handleAccess(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (step === 'details') {
        if (mode === 'create') await registerEmployer({ name, phone, email })
        else await startPhoneVerification(phone)
        setStep('phone-code')
      } else {
        await verifyPhone(phone, code)
      }
    } catch (accessError) {
      setError(describeError(accessError))
    } finally {
      setBusy(false)
    }
  }

  async function handleSendEmailCode() {
    setError(null)
    setBusy(true)
    try {
      await startEmailVerification(account?.email ?? email)
      setEmailCodeSent(true)
    } catch (verificationError) {
      setError(describeError(verificationError))
    } finally {
      setBusy(false)
    }
  }

  async function handleVerifyEmail() {
    setError(null)
    setBusy(true)
    try {
      await verifyEmail(emailCode)
      setEmailCodeSent(false)
    } catch (verificationError) {
      setError(describeError(verificationError))
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-slate-50 p-8 text-sm text-slate-500">Loading employer access...</div>
  }

  if (!account) {
    return (
      <div className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <div className="mx-auto max-w-md">
          <button
            type="button"
            onClick={() => navigate('/helpers')}
            className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Helper Network
          </button>

          <div className="mt-12 rounded-lg bg-white p-6 text-slate-950 shadow-2xl sm:p-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-blue-50 text-blue-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h1 className="mt-5 text-2xl font-extrabold">Employer access</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Passwordless access to introduction requests and agency updates.
            </p>

            {step === 'details' && (
              <div className="mt-6 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin')
                    setError(null)
                  }}
                  className={`rounded-md py-2 text-xs font-bold ${mode === 'signin' ? 'bg-white shadow-sm' : 'text-slate-500'}`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('create')
                    setError(null)
                  }}
                  className={`rounded-md py-2 text-xs font-bold ${mode === 'create' ? 'bg-white shadow-sm' : 'text-slate-500'}`}
                >
                  Create account
                </button>
              </div>
            )}

            <form onSubmit={handleAccess} className="mt-6 space-y-4">
              {step === 'details' ? (
                <>
                  {mode === 'create' && (
                    <label className="block text-xs font-bold text-slate-700">
                      Your name
                      <input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        required
                        maxLength={100}
                        autoComplete="name"
                        className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </label>
                  )}
                  <label className="block text-xs font-bold text-slate-700">
                    Mobile number
                    <input
                      type="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      required
                      placeholder="+6591234567"
                      autoComplete="tel"
                      className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                  {mode === 'create' && (
                    <label className="block text-xs font-bold text-slate-700">
                      Email address
                      <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                        autoComplete="email"
                        className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </label>
                  )}
                </>
              ) : (
                <label className="block text-xs font-bold text-slate-700">
                  Mobile verification code
                  <input
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    required
                    inputMode="numeric"
                    maxLength={8}
                    autoComplete="one-time-code"
                    className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <span className="mt-2 block font-normal text-slate-500">Development code: 123456</span>
                </label>
              )}

              {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}

              <Button type="submit" disabled={busy} className="w-full">
                {busy ? 'Please wait...' : step === 'phone-code' ? 'Verify and sign in' : mode === 'create' ? 'Create passwordless account' : 'Send sign-in code'}
              </Button>
              {step === 'phone-code' && (
                <button type="button" onClick={() => setStep('details')} className="w-full text-xs font-bold text-blue-600">
                  Change mobile number
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    )
  }

  const fullyVerified = Boolean(account.phoneVerifiedAt && account.emailVerifiedAt)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <div>
            <p className="text-xs font-bold text-blue-700">Rumaya Helper Network</p>
            <h1 className="mt-1 text-xl font-extrabold">Employer account</h1>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
        <section className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-8 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-extrabold">Welcome back, {account.name}</h2>
            <p className="mt-2 text-sm text-slate-500">Manage your agency introductions and contact verification.</p>
          </div>
          <Button type="button" onClick={() => navigate('/helpers')}>
            <Search className="h-4 w-4" /> Browse helpers
          </Button>
        </section>

        <section className="grid gap-4 border-b border-slate-200 py-7 sm:grid-cols-2">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100"><Phone className="h-4 w-4" /></span>
            <div>
              <p className="text-xs font-semibold text-slate-500">Mobile number</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-bold">{account.phone}<BadgeCheck className="h-4 w-4 text-emerald-600" /></p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100"><Mail className="h-4 w-4" /></span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500">Email address</p>
              <p className="mt-1 flex items-center gap-1.5 truncate text-sm font-bold">
                {account.email ?? 'Not added'}
                {account.emailVerifiedAt && <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" />}
              </p>
            </div>
          </div>
        </section>

        {!fullyVerified && (
          <section className="my-7 rounded-lg border border-amber-200 bg-amber-50 p-5">
            <h2 className="font-extrabold text-amber-950">Verify your email address</h2>
            <p className="mt-1 text-xs leading-5 text-amber-800">Email verification is required before sending an agency request.</p>
            {!emailCodeSent ? (
              <Button type="button" size="sm" onClick={handleSendEmailCode} disabled={busy} className="mt-4">
                Send email code
              </Button>
            ) : (
              <div className="mt-4 flex max-w-sm gap-2">
                <input
                  value={emailCode}
                  onChange={(event) => setEmailCode(event.target.value)}
                  placeholder="Verification code"
                  className="h-10 min-w-0 flex-1 rounded-md border border-amber-300 bg-white px-3 text-sm outline-none"
                />
                <Button type="button" size="sm" onClick={handleVerifyEmail} disabled={busy}>Verify</Button>
              </div>
            )}
            <p className="mt-2 text-[11px] text-amber-700">Development code: 123456</p>
            {error && <p role="alert" className="mt-3 text-xs text-red-700">{error}</p>}
          </section>
        )}

        <section className="py-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold">Agency requests</h2>
              <p className="mt-1 text-sm text-slate-500">Updates from representing agencies appear here.</p>
            </div>
            {fullyVerified && <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Account verified</span>}
          </div>

          {inquiries.length === 0 ? (
            <div className="mt-6 border-y border-slate-200 py-12 text-center">
              <Building2 className="mx-auto h-7 w-7 text-slate-400" />
              <p className="mt-3 text-sm font-bold">No agency requests yet</p>
              <p className="mt-1 text-xs text-slate-500">Connect from a helper profile to begin.</p>
            </div>
          ) : (
            <div className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
              {inquiries.map((inquiry) => (
                <article key={inquiry.id} className="flex flex-col justify-between gap-4 py-5 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-extrabold">{inquiry.helperProfile.displayName}</p>
                    <p className="mt-1 text-xs text-slate-500">{inquiry.agency.displayName}</p>
                  </div>
                  <div className="sm:text-right">
                    <p className="flex items-center gap-1.5 text-xs font-bold text-blue-700 sm:justify-end"><Clock3 className="h-3.5 w-3.5" /> {formatStatus(inquiry.status)}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{new Date(inquiry.submittedAt).toLocaleDateString('en-SG')}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
