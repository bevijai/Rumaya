import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, CheckCircle2, ClipboardCheck, FileCheck2, LogOut, RefreshCw, ShieldCheck, UserRoundCheck, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/api'
import { useMarketplaceAuth } from '@/context/useMarketplaceAuth'

interface ValidationProfile {
  id: string
  displayName: string
  sourceCountry: string
  locationType: string
  status: string
  bio: string | null
  languages: unknown
  yearsExperience: number
  availableFrom: string | null
  expectedSalary: string | number | null
  submittedAt: string | null
  member: { name: string; phone: string; preferredLanguage: string }
  skills: Array<{ id: string; type: string; proficiency: string; yearsExperience: number; verified: boolean }>
  documents: Array<{ id: string; type: string; status: string; expiresAt: string | null; rejectionReason: string | null }>
  validations: Array<{ id: string; outcome: string; language: string; notes: string; completedAt: string }>
  scores: Array<{ id: string; version: number; identityPoints: number; skillsPoints: number; referencesPoints: number; readinessPoints: number; completenessPoints: number; totalPoints: number; reviewedAt: string | null }>
  representations: Array<{ status: string; agency: { displayName: string; status: string } }>
}

function messageFor(error: unknown) {
  return error instanceof ApiError ? error.message : 'Could not complete this request. Please try again.'
}

function formatStatus(status: string) {
  return status.replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase())
}

export default function ValidatorPage() {
  const navigate = useNavigate()
  const { account, loading, startPhoneVerification, verifyPhone, call, logout } = useMarketplaceAuth()
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [profiles, setProfiles] = useState<ValidationProfile[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [outcome, setOutcome] = useState<'passed' | 'needs_changes' | 'failed'>('passed')
  const [language, setLanguage] = useState('en')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const selected = profiles.find((profile) => profile.id === selectedId) ?? profiles[0]

  async function loadQueue() {
    const data = await call<{ profiles: ValidationProfile[] }>('/marketplace/validation/profiles/queue')
    setProfiles(data.profiles)
    setSelectedId((current) => data.profiles.some((profile) => profile.id === current) ? current : data.profiles[0]?.id ?? '')
  }

  useEffect(() => {
    if (!account || !['validator', 'admin'].includes(account.platformRole)) return
    loadQueue().catch((loadError) => setError(messageFor(loadError)))
    // Queue reloads when the authenticated validator changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.id])

  async function handleAccess(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    const normalized = phone.trim().replace(/[\s()-]/g, '')
    try {
      if (!codeSent) {
        await startPhoneVerification(normalized)
        setCodeSent(true)
      } else {
        await verifyPhone(normalized, code)
      }
    } catch (accessError) {
      setError(messageFor(accessError))
    } finally {
      setBusy(false)
    }
  }

  async function recordValidation(event: FormEvent) {
    event.preventDefault()
    if (!selected) return
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await call(`/marketplace/validation/profiles/${selected.id}/validation`, {
        method: 'POST', body: { outcome, language, notes },
      })
      await loadQueue()
      setNotes('')
      setNotice(outcome === 'passed' ? 'Validation passed and an initial score was calculated.' : `Profile marked ${formatStatus(outcome)}.`)
    } catch (validationError) {
      setError(messageFor(validationError))
    } finally {
      setBusy(false)
    }
  }

  async function reviewScore() {
    if (!selected) return
    setBusy(true)
    setError(null)
    try {
      await call(`/marketplace/validation/profiles/${selected.id}/scores/review`, { method: 'POST', body: {} })
      await loadQueue()
      setNotice('Latest score reviewed without adjustment.')
    } catch (scoreError) {
      setError(messageFor(scoreError))
    } finally {
      setBusy(false)
    }
  }

  async function publishProfile() {
    if (!selected) return
    setBusy(true)
    setError(null)
    try {
      await call(`/marketplace/validation/profiles/${selected.id}/publish`, { method: 'POST' })
      await loadQueue()
      setNotice(`${selected.displayName} was published. An accepted active agency representation is still required for public discovery.`)
    } catch (publishError) {
      setError(messageFor(publishError))
    } finally {
      setBusy(false)
    }
  }

  async function reviewDocument(documentId: string, status: 'verified' | 'rejected') {
    if (!selected) return
    const reason = status === 'rejected' ? 'Document did not meet verification requirements' : undefined
    setBusy(true)
    setError(null)
    try {
      await call(`/marketplace/validation/profiles/${selected.id}/documents/${documentId}/review`, {
        method: 'POST', body: { status, ...(reason ? { reason } : {}) },
      })
      await loadQueue()
    } catch (documentError) {
      setError(messageFor(documentError))
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className="min-h-screen bg-slate-950 p-8 text-sm text-slate-300">Loading validator access...</div>

  if (!account) {
    return (
      <div className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <div className="mx-auto max-w-md">
          <button type="button" onClick={() => navigate('/')} className="flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white"><ArrowLeft className="h-4 w-4" /> Rumaya home</button>
          <div className="mt-12 rounded-lg border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
            <ShieldCheck className="h-7 w-7 text-blue-300" /><h1 className="mt-4 text-2xl font-extrabold">Rumaya validator access</h1><p className="mt-2 text-sm leading-6 text-slate-300">Restricted to authorised validation and administration accounts.</p>
            <form onSubmit={handleAccess} className="mt-6 space-y-4">{!codeSent ? <label className="block text-xs font-bold text-slate-200">Authorised mobile number<input required value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+6591234567" className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-white/10 px-3 text-sm font-normal text-white" /></label> : <label className="block text-xs font-bold text-slate-200">Verification code<input required value={code} onChange={(event) => setCode(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-white/10 px-3 text-sm font-normal text-white" /><span className="mt-2 block font-normal text-slate-400">Development code: 123456</span></label>}{error && <p className="rounded-md bg-red-950/40 px-3 py-2 text-xs text-red-200">{error}</p>}<Button type="submit" className="w-full" disabled={busy}>{busy ? 'Please wait...' : codeSent ? 'Verify and continue' : 'Send access code'}</Button></form>
          </div>
        </div>
      </div>
    )
  }

  if (!['validator', 'admin'].includes(account.platformRole)) {
    return <div className="min-h-screen bg-slate-50 px-5 py-16"><div className="mx-auto max-w-lg border-y border-slate-200 py-10 text-center"><XCircle className="mx-auto h-8 w-8 text-red-500" /><h1 className="mt-4 text-xl font-extrabold">Validator access required</h1><p className="mt-2 text-sm text-slate-500">This account is not authorised to review marketplace profiles.</p><Button className="mt-6" onClick={logout}>Sign out and use an authorised account</Button></div></div>
  }

  const latestValidation = selected?.validations[0]
  const latestScore = selected?.scores[0]

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <header className="bg-slate-950 text-white"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-xs font-bold text-blue-300">Rumaya Trust Operations</p><h1 className="mt-1 text-xl font-extrabold">Helper validation queue</h1></div><div className="flex gap-2"><Button variant="ghost" size="sm" onClick={loadQueue} className="text-slate-200 hover:bg-white/10 hover:text-white"><RefreshCw className="h-4 w-4" /> Refresh</Button><Button variant="secondary" size="sm" onClick={logout}><LogOut className="h-4 w-4" /> Sign out</Button></div></div></header>
      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        {error && <p className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {notice && <p className="mb-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}
        {profiles.length === 0 ? <section className="border-y border-slate-300 py-20 text-center"><ClipboardCheck className="mx-auto h-9 w-9 text-slate-400" /><h2 className="mt-4 text-lg font-extrabold">Validation queue is clear</h2></section> : (
          <div className="grid gap-6 lg:grid-cols-[19rem_1fr]">
            <aside className="border border-slate-200 bg-white"><div className="border-b border-slate-200 px-4 py-3"><p className="text-xs font-extrabold uppercase text-slate-500">Awaiting review · {profiles.length}</p></div>{profiles.map((profile) => <button key={profile.id} type="button" onClick={() => { setSelectedId(profile.id); setLanguage(profile.member.preferredLanguage); setError(null); setNotice(null) }} className={`w-full border-b border-slate-100 px-4 py-4 text-left ${selected?.id === profile.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}><p className="text-sm font-extrabold">{profile.displayName}</p><p className="mt-1 text-xs text-slate-500">{formatStatus(profile.sourceCountry)} · {formatStatus(profile.status)}</p><p className="mt-2 text-[11px] text-slate-400">Submitted {profile.submittedAt ? new Date(profile.submittedAt).toLocaleDateString() : 'not recorded'}</p></button>)}</aside>

            {selected && <div className="space-y-6">
              <section className="border border-slate-200 bg-white p-5 sm:p-6"><div className="flex flex-col justify-between gap-4 sm:flex-row"><div><p className="text-xs font-bold text-blue-700">PROFILE REVIEW</p><h2 className="mt-2 text-2xl font-extrabold">{selected.displayName}</h2><p className="mt-1 text-sm text-slate-500">{selected.member.name} · {selected.member.phone} · {selected.member.preferredLanguage.toUpperCase()}</p></div><span className="h-fit rounded-md bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-900">{formatStatus(selected.status)}</span></div><div className="mt-6 grid gap-5 border-t border-slate-200 pt-5 sm:grid-cols-3"><div><p className="text-xs font-bold text-slate-500">Experience</p><p className="mt-1 text-sm font-bold">{selected.yearsExperience} years</p></div><div><p className="text-xs font-bold text-slate-500">Availability</p><p className="mt-1 text-sm font-bold">{selected.availableFrom ? new Date(selected.availableFrom).toLocaleDateString() : 'Not set'}</p></div><div><p className="text-xs font-bold text-slate-500">Expected salary</p><p className="mt-1 text-sm font-bold">{selected.expectedSalary ? `SGD ${selected.expectedSalary}` : 'Not set'}</p></div></div><div className="mt-5"><p className="text-xs font-bold text-slate-500">Profile summary</p><p className="mt-2 text-sm leading-6 text-slate-700">{selected.bio || 'No summary provided'}</p></div><div className="mt-5 flex flex-wrap gap-2">{selected.skills.map((skill) => <span key={skill.id} className="rounded-md bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-700">{formatStatus(skill.type)} · {skill.proficiency} · {skill.yearsExperience}y</span>)}</div></section>

              <section className="border border-slate-200 bg-white p-5 sm:p-6"><div className="flex items-center gap-2"><FileCheck2 className="h-5 w-5 text-blue-700" /><h3 className="font-extrabold">Documents</h3></div>{selected.documents.length === 0 ? <p className="mt-4 text-sm text-amber-700">No documents uploaded. Identity evidence cannot be verified yet.</p> : <div className="mt-4 divide-y divide-slate-200">{selected.documents.map((document) => <div key={document.id} className="flex flex-col justify-between gap-3 py-3 sm:flex-row sm:items-center"><div><p className="text-sm font-bold">{formatStatus(document.type)}</p><p className="mt-1 text-xs text-slate-500">{formatStatus(document.status)}</p></div>{document.status === 'pending' && <div className="flex gap-2"><Button size="sm" onClick={() => reviewDocument(document.id, 'verified')} disabled={busy}>Verify</Button><Button size="sm" variant="secondary" onClick={() => reviewDocument(document.id, 'rejected')} disabled={busy}>Reject</Button></div>}</div>)}</div>}</section>

              <section className="grid gap-6 xl:grid-cols-2">
                <form onSubmit={recordValidation} className="border border-slate-200 bg-white p-5 sm:p-6"><div className="flex items-center gap-2"><UserRoundCheck className="h-5 w-5 text-blue-700" /><h3 className="font-extrabold">Validation outcome</h3></div>{latestValidation && <p className="mt-3 text-xs text-slate-500">Latest: {formatStatus(latestValidation.outcome)} · {new Date(latestValidation.completedAt).toLocaleString()}</p>}<div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold text-slate-700">Outcome<select value={outcome} onChange={(event) => setOutcome(event.target.value as typeof outcome)} disabled={latestValidation?.outcome === 'passed'} className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-normal disabled:bg-slate-100"><option value="passed">Passed</option><option value="needs_changes">Needs changes</option><option value="failed">Failed</option></select></label><label className="text-xs font-bold text-slate-700">Call language<select value={language} onChange={(event) => setLanguage(event.target.value)} disabled={latestValidation?.outcome === 'passed'} className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-normal disabled:bg-slate-100"><option value="en">English</option><option value="id">Indonesian</option><option value="tl">Tagalog</option><option value="my">Burmese</option></select></label></div><label className="mt-4 block text-xs font-bold text-slate-700">Review notes<textarea required minLength={1} maxLength={5000} rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} disabled={latestValidation?.outcome === 'passed'} className="mt-2 w-full rounded-md border border-slate-300 p-3 text-sm font-normal disabled:bg-slate-100" /></label><Button type="submit" className="mt-4" disabled={busy || latestValidation?.outcome === 'passed'}>{latestValidation?.outcome === 'passed' ? 'Validation completed' : 'Record outcome'}</Button></form>

                <section className="border border-slate-200 bg-white p-5 sm:p-6"><div className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-blue-700" /><h3 className="font-extrabold">Score and publication</h3></div>{!latestScore ? <p className="mt-4 text-sm text-slate-500">A score is calculated after validation passes.</p> : <><div className="mt-5 flex items-end justify-between"><div><p className="text-xs font-bold text-slate-500">Profile score</p><p className="mt-1 text-3xl font-extrabold">{latestScore.totalPoints}<span className="text-base text-slate-400">/100</span></p></div><span className={`text-xs font-bold ${latestScore.reviewedAt ? 'text-emerald-700' : 'text-amber-700'}`}>{latestScore.reviewedAt ? 'Reviewed' : 'Review required'}</span></div><dl className="mt-5 grid grid-cols-2 gap-3 text-xs"><div><dt className="text-slate-500">Identity</dt><dd className="font-bold">{latestScore.identityPoints}/30</dd></div><div><dt className="text-slate-500">Skills</dt><dd className="font-bold">{latestScore.skillsPoints}/30</dd></div><div><dt className="text-slate-500">References</dt><dd className="font-bold">{latestScore.referencesPoints}/20</dd></div><div><dt className="text-slate-500">Readiness</dt><dd className="font-bold">{latestScore.readinessPoints}/15</dd></div></dl><div className="mt-6 flex flex-wrap gap-2">{!latestScore.reviewedAt && <Button onClick={reviewScore} disabled={busy}>Review score</Button>}<Button variant="secondary" onClick={publishProfile} disabled={busy || !latestScore.reviewedAt}><CheckCircle2 className="h-4 w-4" /> Publish profile</Button></div></>}</section>
              </section>
            </div>}
          </div>
        )}
      </main>
    </div>
  )
}