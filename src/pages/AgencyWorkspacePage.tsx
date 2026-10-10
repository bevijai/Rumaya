import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, Building2, CheckCircle2, Clock3, LogOut, MessageSquareText, Plus, RefreshCw, UsersRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/api'
import { useMarketplaceAuth } from '@/context/useMarketplaceAuth'

type SkillType = 'infant_care' | 'childcare' | 'eldercare' | 'disability_care' | 'cooking' | 'pet_care' | 'housekeeping' | 'other'

interface Membership {
  id: string
  role: string
  agency: { id: string; displayName: string; legalName: string; licenceNumber: string; status: string }
}

interface Inquiry {
  id: string
  status: string
  submittedAt: string
  employerMessage: string | null
  employer: { name: string; preferredLanguage: string }
  helperProfile: { displayName: string; status: string }
}

interface AgencyHelper {
  id: string
  displayName: string
  sourceCountry: string
  locationType: string
  status: string
  availableFrom: string | null
  member: { name: string; preferredLanguage: string; phoneVerifiedAt: string | null }
  skills: Array<{ type: SkillType; proficiency: string; yearsExperience: number }>
  representations: Array<{ id: string; status: string; requestedAt: string; respondedAt: string | null }>
}

const skills: Array<{ type: SkillType; label: string }> = [
  { type: 'infant_care', label: 'Infant care' }, { type: 'childcare', label: 'Childcare' },
  { type: 'eldercare', label: 'Eldercare' }, { type: 'disability_care', label: 'Disability care' },
  { type: 'cooking', label: 'Cooking' }, { type: 'pet_care', label: 'Pet care' },
  { type: 'housekeeping', label: 'Housekeeping' }, { type: 'other', label: 'Other' },
]

const initialHelper = {
  phone: '', name: '', preferredLanguage: 'en', displayName: '', sourceCountry: 'indonesia',
  locationType: 'overseas', bio: '', yearsExperience: 0, availableFrom: '', expectedSalary: '',
  selectedSkills: [] as SkillType[],
}

function messageFor(error: unknown) {
  return error instanceof ApiError ? error.message : 'Could not complete this request. Please try again.'
}

function normalizePhone(value: string) {
  const compact = value.trim().replace(/[\s()-]/g, '')
  return compact.startsWith('00') ? `+${compact.slice(2)}` : compact
}

function formatStatus(status: string) {
  return status.replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase())
}

export default function AgencyWorkspacePage() {
  const navigate = useNavigate()
  const { account, loading, startPhoneVerification, verifyPhone, call, logout } = useMarketplaceAuth()
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [selectedAgencyId, setSelectedAgencyId] = useState('')
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [helpers, setHelpers] = useState<AgencyHelper[]>([])
  const [view, setView] = useState<'helpers' | 'enquiries'>('helpers')
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [helper, setHelper] = useState(initialHelper)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function loadAgency(agencyId: string) {
    const [profileData, inquiryData] = await Promise.all([
      call<{ profiles: AgencyHelper[] }>(`/marketplace/agency-helper/agency/${agencyId}/profiles`),
      call<{ inquiries: Inquiry[] }>(`/marketplace/employer-agency/agency/${agencyId}`),
    ])
    setHelpers(profileData.profiles)
    setInquiries(inquiryData.inquiries)
  }

  useEffect(() => {
    if (!account) return
    call<{ memberships: Membership[] }>('/marketplace/agencies/me')
      .then(async (data) => {
        setMemberships(data.memberships)
        const agencyId = data.memberships[0]?.agency.id ?? ''
        setSelectedAgencyId(agencyId)
        if (agencyId) await loadAgency(agencyId)
      })
      .catch((loadError) => setError(messageFor(loadError)))
    // Workspace reloads when the authenticated agency account changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.id])

  async function handleAccess(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (!codeSent) {
        await startPhoneVerification(normalizePhone(phone))
        setCodeSent(true)
      } else {
        await verifyPhone(normalizePhone(phone), code)
      }
    } catch (accessError) {
      setError(
        codeSent && accessError instanceof ApiError && accessError.status === 401
          ? 'The code is invalid, expired, or this mobile number has no agency invitation.'
          : messageFor(accessError),
      )
    } finally {
      setBusy(false)
    }
  }

  async function createAssistedProfile(event: FormEvent) {
    event.preventDefault()
    const normalizedPhone = normalizePhone(helper.phone)
    if (!/^\+[1-9]\d{6,14}$/.test(normalizedPhone)) {
      setError('Enter the helper mobile number with country code, for example +628123456789.')
      return
    }
    if (helper.selectedSkills.length === 0) {
      setError('Select at least one helper skill.')
      return
    }

    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await call('/marketplace/agency-helper/assisted', {
        method: 'POST',
        body: {
          agencyId: selectedAgencyId,
          helper: { phone: normalizedPhone, name: helper.name, preferredLanguage: helper.preferredLanguage },
          profile: {
            displayName: helper.displayName || helper.name,
            sourceCountry: helper.sourceCountry,
            locationType: helper.locationType,
            bio: helper.bio || undefined,
            languages: [helper.preferredLanguage],
            yearsExperience: helper.yearsExperience,
            availableFrom: helper.availableFrom || undefined,
            expectedSalary: helper.expectedSalary ? Number(helper.expectedSalary) : undefined,
            skills: helper.selectedSkills.map((type) => ({ type, proficiency: 'intermediate', yearsExperience: helper.yearsExperience })),
          },
        },
      })
      await loadAgency(selectedAgencyId)
      setHelper(initialHelper)
      setShowOnboarding(false)
      setNotice('Helper profile created. The helper must verify their phone and accept agency representation.')
    } catch (createError) {
      setError(messageFor(createError))
    } finally {
      setBusy(false)
    }
  }

  async function respond(inquiryId: string, response: 'accept' | 'decline' | 'request_clarification') {
    setBusy(true)
    setError(null)
    try {
      await call(`/marketplace/employer-agency/${inquiryId}/respond`, { method: 'POST', body: { response } })
      await loadAgency(selectedAgencyId)
    } catch (responseError) {
      setError(messageFor(responseError))
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className="min-h-screen bg-slate-50 p-8 text-sm text-slate-500">Loading agency access...</div>

  if (!account) {
    return (
      <div className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <div className="mx-auto max-w-md">
          <button type="button" onClick={() => navigate('/')} className="flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white"><ArrowLeft className="h-4 w-4" /> Rumaya home</button>
          <div className="mt-12 rounded-lg border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
            <Building2 className="h-6 w-6 text-blue-300" />
            <h1 className="mt-4 text-2xl font-extrabold">Invited agency access</h1>
            <p className="mt-2 text-sm leading-6 text-slate-300">Sign in with the mobile number linked to your verified Rumaya agency invitation.</p>
            <form onSubmit={handleAccess} className="mt-6 space-y-4">
              {!codeSent ? <label className="block text-xs font-bold text-slate-200">Mobile number<input type="tel" required value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+6591234567" className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-white/10 px-3 text-sm font-normal text-white" /></label> : <div><label className="block text-xs font-bold text-slate-200">Verification code<input required value={code} onChange={(event) => setCode(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-white/10 px-3 text-sm font-normal text-white" /><span className="mt-2 block font-normal text-slate-400">Development code: 123456</span></label><button type="button" onClick={() => { setCodeSent(false); setCode(''); setError(null) }} className="mt-3 text-xs font-bold text-blue-300 hover:text-blue-200">Use a different mobile number</button></div>}
              {error && <p className="rounded-md bg-red-950/40 px-3 py-2 text-xs text-red-200">{error}</p>}
              <Button type="submit" className="w-full" disabled={busy}>{busy ? 'Please wait...' : codeSent ? 'Verify and sign in' : 'Send sign-in code'}</Button>
            </form>
            <p className="mt-5 text-xs leading-5 text-slate-400">New agencies are invitation-only and licence-verified during the pilot.</p>
          </div>
        </div>
      </div>
    )
  }

  const membership = memberships.find((item) => item.agency.id === selectedAgencyId)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <button type="button" onClick={() => navigate('/')} className="text-left"><p className="text-xs font-bold text-blue-700">Rumaya Agency Workspace</p><h1 className="mt-1 text-xl font-extrabold">{membership?.agency.displayName ?? 'Agency access'}</h1></button>
          <div className="flex flex-wrap gap-2"><Button variant="ghost" size="sm" onClick={() => loadAgency(selectedAgencyId)} disabled={!selectedAgencyId || busy}><RefreshCw className="h-4 w-4" /> Refresh</Button><Button variant="secondary" size="sm" onClick={logout}><LogOut className="h-4 w-4" /> Sign out</Button></div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        {error && <p className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {notice && <p className="mb-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}
        {memberships.length === 0 ? (
          <section className="border-y border-slate-200 py-16 text-center"><Building2 className="mx-auto h-8 w-8 text-slate-400" /><h2 className="mt-4 font-extrabold">No agency invitation linked</h2><p className="mt-2 text-sm text-slate-500">Ask the Rumaya pilot administrator to invite this mobile number.</p></section>
        ) : (
          <>
            <section className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-7 sm:flex-row sm:items-end">
              <div><p className="text-xs font-bold text-slate-500">MOM licence {membership?.agency.licenceNumber}</p><h2 className="mt-2 text-2xl font-extrabold">Placement operations</h2></div>
              <span className="flex items-center gap-2 text-xs font-bold text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Verified agency</span>
            </section>

            <div className="mt-7 flex gap-1 border-b border-slate-200">
              <button type="button" onClick={() => setView('helpers')} className={`border-b-2 px-4 py-3 text-sm font-bold ${view === 'helpers' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500'}`}><UsersRound className="mr-2 inline h-4 w-4" /> Helpers ({helpers.length})</button>
              <button type="button" onClick={() => setView('enquiries')} className={`border-b-2 px-4 py-3 text-sm font-bold ${view === 'enquiries' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500'}`}><MessageSquareText className="mr-2 inline h-4 w-4" /> Enquiries ({inquiries.length})</button>
            </div>

            {view === 'helpers' && (
              <section className="py-7">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="text-lg font-extrabold">Agency helpers</h2><p className="mt-1 text-sm text-slate-500">Profiles created by or represented by your agency.</p></div><Button onClick={() => setShowOnboarding((current) => !current)}><Plus className="h-4 w-4" /> Add helper</Button></div>

                {showOnboarding && (
                  <form onSubmit={createAssistedProfile} className="mt-6 border-y border-slate-200 bg-white px-4 py-6 sm:px-6">
                    <h3 className="font-extrabold">Agency-assisted helper registration</h3><p className="mt-1 text-xs leading-5 text-slate-500">The helper receives OTP access and must personally accept representation before publication.</p>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <label className="text-xs font-bold text-slate-700">Full name<input required value={helper.name} onChange={(event) => setHelper({ ...helper, name: event.target.value })} className="mt-2 h-10 w-full rounded-md border border-slate-300 px-3 text-sm font-normal" /></label>
                      <label className="text-xs font-bold text-slate-700">Display name<input required value={helper.displayName} onChange={(event) => setHelper({ ...helper, displayName: event.target.value })} className="mt-2 h-10 w-full rounded-md border border-slate-300 px-3 text-sm font-normal" /></label>
                      <label className="text-xs font-bold text-slate-700">Mobile with country code<input required value={helper.phone} onChange={(event) => setHelper({ ...helper, phone: event.target.value })} placeholder="+628123456789" className="mt-2 h-10 w-full rounded-md border border-slate-300 px-3 text-sm font-normal" /></label>
                      <label className="text-xs font-bold text-slate-700">Preferred language<select value={helper.preferredLanguage} onChange={(event) => setHelper({ ...helper, preferredLanguage: event.target.value })} className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-normal"><option value="en">English</option><option value="id">Bahasa Indonesia</option><option value="tl">Filipino</option><option value="my">Burmese</option></select></label>
                      <label className="text-xs font-bold text-slate-700">Source country<select value={helper.sourceCountry} onChange={(event) => setHelper({ ...helper, sourceCountry: event.target.value })} className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-normal"><option value="indonesia">Indonesia</option><option value="philippines">Philippines</option><option value="myanmar">Myanmar</option></select></label>
                      <label className="text-xs font-bold text-slate-700">Location<select value={helper.locationType} onChange={(event) => setHelper({ ...helper, locationType: event.target.value })} className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-normal"><option value="overseas">Overseas</option><option value="singapore_transfer">Singapore transfer</option></select></label>
                      <label className="text-xs font-bold text-slate-700">Years experience<input type="number" min="0" max="60" value={helper.yearsExperience} onChange={(event) => setHelper({ ...helper, yearsExperience: Number(event.target.value) })} className="mt-2 h-10 w-full rounded-md border border-slate-300 px-3 text-sm font-normal" /></label>
                      <label className="text-xs font-bold text-slate-700">Available from<input type="date" value={helper.availableFrom} onChange={(event) => setHelper({ ...helper, availableFrom: event.target.value })} className="mt-2 h-10 w-full rounded-md border border-slate-300 px-3 text-sm font-normal" /></label>
                      <label className="text-xs font-bold text-slate-700">Expected salary (SGD)<input type="number" min="1" value={helper.expectedSalary} onChange={(event) => setHelper({ ...helper, expectedSalary: event.target.value })} className="mt-2 h-10 w-full rounded-md border border-slate-300 px-3 text-sm font-normal" /></label>
                    </div>
                    <label className="mt-4 block text-xs font-bold text-slate-700">Profile summary<textarea rows={3} value={helper.bio} onChange={(event) => setHelper({ ...helper, bio: event.target.value })} className="mt-2 w-full rounded-md border border-slate-300 p-3 text-sm font-normal" /></label>
                    <fieldset className="mt-4"><legend className="text-xs font-bold text-slate-700">Skills</legend><div className="mt-2 flex flex-wrap gap-2">{skills.map((skill) => <label key={skill.type} className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-bold ${helper.selectedSkills.includes(skill.type) ? 'border-blue-300 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-600'}`}><input type="checkbox" checked={helper.selectedSkills.includes(skill.type)} onChange={() => setHelper({ ...helper, selectedSkills: helper.selectedSkills.includes(skill.type) ? helper.selectedSkills.filter((type) => type !== skill.type) : [...helper.selectedSkills, skill.type] })} />{skill.label}</label>)}</div></fieldset>
                    <div className="mt-6 flex flex-wrap gap-2"><Button type="submit" disabled={busy}>Create helper profile</Button><Button type="button" variant="ghost" onClick={() => setShowOnboarding(false)}>Cancel</Button></div>
                  </form>
                )}

                {helpers.length === 0 ? <div className="mt-6 border-y border-slate-200 py-12 text-center"><UsersRound className="mx-auto h-7 w-7 text-slate-400" /><p className="mt-3 text-sm font-bold">No helper profiles yet</p></div> : <div className="mt-6 divide-y divide-slate-200 border-y border-slate-200">{helpers.map((profile) => <article key={profile.id} className="grid gap-4 py-5 md:grid-cols-[1fr_1fr_auto] md:items-center"><div><p className="font-extrabold">{profile.displayName}</p><p className="mt-1 text-xs text-slate-500">{formatStatus(profile.sourceCountry)} · {formatStatus(profile.locationType)}</p></div><div><p className="text-xs font-bold text-slate-700">Profile: {formatStatus(profile.status)}</p><p className="mt-1 text-xs text-slate-500">Representation: {formatStatus(profile.representations[0]?.status ?? 'none')}</p></div><div className="text-xs text-slate-500">{profile.skills.length} skills · {profile.member.phoneVerifiedAt ? 'Phone verified' : 'OTP pending'}</div></article>)}</div>}
              </section>
            )}

            {view === 'enquiries' && (
              <section className="py-7"><h2 className="text-lg font-extrabold">Employer enquiry inbox</h2>{inquiries.length === 0 ? <div className="mt-6 border-y border-slate-200 py-12 text-center"><MessageSquareText className="mx-auto h-7 w-7 text-slate-400" /><p className="mt-3 text-sm font-bold">No enquiries yet</p></div> : <div className="mt-6 divide-y divide-slate-200 border-y border-slate-200">{inquiries.map((inquiry) => <article key={inquiry.id} className="grid gap-4 py-5 md:grid-cols-[1fr_1fr_auto] md:items-center"><div><p className="text-sm font-extrabold">{inquiry.helperProfile.displayName}</p><p className="mt-1 text-xs text-slate-500">Employer: {inquiry.employer.name}</p></div><div><p className="text-xs leading-5 text-slate-600">{inquiry.employerMessage || 'No additional message'}</p><p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400"><Clock3 className="h-3 w-3" /> {new Date(inquiry.submittedAt).toLocaleDateString()}</p></div><div className="flex flex-wrap gap-2">{['submitted', 'clarification_requested'].includes(inquiry.status) ? <><Button size="sm" onClick={() => respond(inquiry.id, 'accept')} disabled={busy}>Accept</Button><Button size="sm" variant="secondary" onClick={() => respond(inquiry.id, 'request_clarification')} disabled={busy}>Clarify</Button><Button size="sm" variant="ghost" onClick={() => respond(inquiry.id, 'decline')} disabled={busy}>Decline</Button></> : <span className="text-xs font-bold text-blue-700">{formatStatus(inquiry.status)}</span>}</div></article>)}</div>}</section>
            )}
          </>
        )}
      </main>
    </div>
  )
}