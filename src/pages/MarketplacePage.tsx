import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Banknote,
  Building2,
  CalendarDays,
  CheckCircle2,
  Languages,
  MapPin,
  PlayCircle,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import HelperConnectionDialog from '@/components/HelperConnectionDialog'
import { DEMO_HELPER_PROFILES } from '@/data/demoHelperProfiles'
import { apiFetch } from '@/lib/api'

type SourceCountry = 'indonesia' | 'philippines' | 'myanmar'
type LocationType = 'overseas' | 'singapore_transfer'
type SkillType =
  | 'infant_care'
  | 'childcare'
  | 'eldercare'
  | 'disability_care'
  | 'cooking'
  | 'pet_care'
  | 'housekeeping'
  | 'other'

interface PublicHelperProfile {
  id: string
  displayName: string
  sourceCountry: SourceCountry
  locationType: LocationType
  bio: string | null
  languages: unknown
  yearsExperience: number
  availableFrom: string | null
  expectedSalary: number | string | null
  introductionType: 'video' | 'audio' | 'assisted' | null
  introductionVerifiedAt: string | null
  imageUrl?: string
  skills: ReadonlyArray<{
    type: SkillType
    proficiency: 'basic' | 'intermediate' | 'advanced'
    yearsExperience: number
    verified: boolean
  }>
  representingAgency?: { displayName: string }
}

const COUNTRY_LABELS: Record<SourceCountry, string> = {
  indonesia: 'Indonesia',
  philippines: 'Philippines',
  myanmar: 'Myanmar',
}

const SKILL_LABELS: Record<SkillType, string> = {
  infant_care: 'Infant care',
  childcare: 'Childcare',
  eldercare: 'Eldercare',
  disability_care: 'Disability care',
  cooking: 'Cooking',
  pet_care: 'Pet care',
  housekeeping: 'Housekeeping',
  other: 'Other',
}

function formatDate(date: string | null) {
  if (!date) return 'Flexible'
  return new Intl.DateTimeFormat('en-SG', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(date),
  )
}

export default function MarketplacePage() {
  const navigate = useNavigate()
  const [sourceCountry, setSourceCountry] = useState('')
  const [locationType, setLocationType] = useState('')
  const [skill, setSkill] = useState('')
  const [profiles, setProfiles] = useState<PublicHelperProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedProfile, setSelectedProfile] = useState<PublicHelperProfile | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    apiFetch<{ items: PublicHelperProfile[] }>('/marketplace/helper-profiles')
      .then((data) => {
        if (!controller.signal.aborted) setProfiles(data.items)
      })
      .catch(() => {
        if (!controller.signal.aborted) setError('Helper profiles could not be loaded.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [])

  const isDemoMode = !loading && !error && profiles.length === 0
  const catalogue: readonly PublicHelperProfile[] = isDemoMode ? DEMO_HELPER_PROFILES : profiles
  const visibleProfiles = catalogue.filter((profile) => {
    if (sourceCountry && profile.sourceCountry !== sourceCountry) return false
    if (locationType && profile.locationType !== locationType) return false
    if (skill && !profile.skills.some((profileSkill) => profileSkill.type === skill)) return false
    return true
  })

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="bg-slate-950 text-white">
        <div className="mx-auto max-w-6xl px-5 py-5 sm:px-8">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Rumaya
            </button>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="text-slate-200 hover:bg-white/10 hover:text-white"
              >
                Household access
              </Button>
              <Button type="button" size="sm" onClick={() => navigate('/helpers/join')}>
                <UserRound className="h-4 w-4" /> Helper sign up / sign in
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => navigate('/employer')}>
                Employer access
              </Button>
            </div>
          </div>

          <div className="max-w-3xl py-12 sm:py-16">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-blue-300">
              <BadgeCheck className="h-4 w-4" />
              Rumaya Helper Network
            </div>
            <h1 className="text-3xl font-extrabold leading-tight sm:text-5xl">
              Trusted help, thoughtfully matched.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Discover validated experience, verified introductions, and agency-backed profiles
              ready for Singapore households.
            </p>
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/10 pt-6 text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" /> Identity checked
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-400" /> Skills validated
              </span>
              <span className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-amber-300" /> Agency represented
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-7 sm:px-8 sm:py-10">
        {isDemoMode && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <span className="mt-0.5 rounded bg-amber-200 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider">
              Demo
            </span>
            <p>These fictional profiles preview the helper network while the pilot directory is being prepared.</p>
          </div>
        )}

        <section
          aria-label="Helper filters"
          className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <div className="mb-4 flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-bold">Filter profiles</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="space-y-1.5 text-xs font-semibold text-slate-600">
              Source country
              <select
                value={sourceCountry}
                onChange={(event) => {
                  setSourceCountry(event.target.value)
                }}
                className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900"
              >
                <option value="">All pilot countries</option>
                <option value="indonesia">Indonesia</option>
                <option value="philippines">Philippines</option>
                <option value="myanmar">Myanmar</option>
              </select>
            </label>
            <label className="space-y-1.5 text-xs font-semibold text-slate-600">
              Availability
              <select
                value={locationType}
                onChange={(event) => {
                  setLocationType(event.target.value)
                }}
                className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900"
              >
                <option value="">Overseas and transfers</option>
                <option value="overseas">Overseas</option>
                <option value="singapore_transfer">Singapore transfer</option>
              </select>
            </label>
            <label className="space-y-1.5 text-xs font-semibold text-slate-600">
              Primary skill
              <select
                value={skill}
                onChange={(event) => {
                  setSkill(event.target.value)
                }}
                className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900"
              >
                <option value="">All skills</option>
                {Object.entries(SKILL_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <div className="flex items-end justify-between gap-4 py-6">
          <div>
            <h2 className="text-xl font-extrabold">Available helpers</h2>
            <p className="mt-1 text-sm text-slate-500">
              {loading
                ? 'Checking current availability'
                : `${visibleProfiles.length} ${visibleProfiles.length === 1 ? 'profile' : 'profiles'} found`}
            </p>
          </div>
          <Search className="h-5 w-5 text-slate-400" />
        </div>

        {error && (
          <div className="border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {!error && loading && (
          <div className="grid gap-4 md:grid-cols-2">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-64 animate-pulse rounded-lg border border-slate-200 bg-white" />
            ))}
          </div>
        )}

        {!error && !loading && visibleProfiles.length === 0 && (
          <div className="border-y border-slate-200 py-16 text-center">
            <Search className="mx-auto h-8 w-8 text-slate-400" />
            <h3 className="mt-4 font-bold">No matching profiles right now</h3>
            <p className="mt-2 text-sm text-slate-500">Try widening the filters to see more helpers.</p>
          </div>
        )}

        {!error && !loading && visibleProfiles.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visibleProfiles.map((profile) => {
              const languages = Array.isArray(profile.languages)
                ? profile.languages.filter((language): language is string => typeof language === 'string')
                : []
              return (
                <article
                  key={profile.id}
                  className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-200">
                    {profile.imageUrl ? (
                      <img
                        src={profile.imageUrl}
                        alt=""
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-slate-800 text-4xl font-extrabold text-white">
                        {profile.displayName.charAt(0)}
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/80 to-transparent" />
                    <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-md bg-white/95 px-2.5 py-1.5 text-xs font-bold text-slate-900 shadow-sm backdrop-blur">
                      <BadgeCheck className="h-3.5 w-3.5 text-blue-600" /> Rumaya verified
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3 text-white">
                      <div>
                        <h3 className="text-xl font-extrabold">{profile.displayName}</h3>
                        <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                          <MapPin className="h-3.5 w-3.5" /> {COUNTRY_LABELS[profile.sourceCountry]}
                        </p>
                      </div>
                      <span className="rounded-md bg-slate-950/60 px-2 py-1 text-xs font-bold backdrop-blur">
                        {profile.yearsExperience} yrs exp.
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-bold text-emerald-700">
                        {profile.locationType === 'overseas' ? 'Overseas placement' : 'Singapore transfer'}
                      </span>
                      {profile.introductionVerifiedAt && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                          <PlayCircle className="h-3.5 w-3.5" /> Verified intro
                        </span>
                      )}
                    </div>

                    {profile.bio && <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{profile.bio}</p>}

                    <div className="mt-4 flex flex-wrap gap-2">
                      {profile.skills.slice(0, 3).map((profileSkill) => (
                        <span
                          key={profileSkill.type}
                          className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700"
                        >
                          {profileSkill.verified && <BadgeCheck className="h-3 w-3" />}
                          {SKILL_LABELS[profileSkill.type]}
                        </span>
                      ))}
                    </div>

                    <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 border-y border-slate-100 py-4 text-sm">
                      <div>
                        <dt className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                          <CalendarDays className="h-3.5 w-3.5" /> Available
                        </dt>
                        <dd className="mt-1 font-bold">{formatDate(profile.availableFrom)}</dd>
                      </div>
                      <div>
                        <dt className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                          <Banknote className="h-3.5 w-3.5" /> Expected salary
                        </dt>
                        <dd className="mt-1 font-bold">
                          {profile.expectedSalary ? `S$${profile.expectedSalary}/mo` : 'Discuss with agency'}
                        </dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                          <Languages className="h-3.5 w-3.5" /> Languages
                        </dt>
                        <dd className="mt-1 font-bold">{languages.join(' · ') || 'Not listed'}</dd>
                      </div>
                    </dl>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100">
                          <Building2 className="h-4 w-4 text-slate-600" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Represented by</p>
                          <p className="truncate text-xs font-bold text-slate-700">
                            {profile.representingAgency?.displayName ?? 'Verified agency'}
                          </p>
                        </div>
                      </div>
                      <Button type="button" size="sm" onClick={() => setSelectedProfile(profile)}>
                        Connect
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>
      {selectedProfile && (
        <HelperConnectionDialog
          profile={selectedProfile}
          isDemo={isDemoMode}
          onClose={() => setSelectedProfile(null)}
        />
      )}
    </div>
  )
}
