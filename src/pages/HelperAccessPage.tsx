import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, BadgeCheck, Building2, CheckCircle2, Clock3, FileCheck2, Home, Languages, LogIn, LogOut, Save, Search, Send, ShieldCheck, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ApiError, apiFetch } from '@/lib/api'
import { useMarketplaceAuth } from '@/context/useMarketplaceAuth'

type Country = 'indonesia' | 'philippines' | 'myanmar'
type Location = 'overseas' | 'singapore_transfer'
type Proficiency = 'basic' | 'intermediate' | 'advanced'
type Skill = 'infant_care' | 'childcare' | 'eldercare' | 'disability_care' | 'cooking' | 'pet_care' | 'housekeeping' | 'other'
type PilotLanguage = 'en' | 'id' | 'tl' | 'my'

const pilotLanguages: Array<{ code: PilotLanguage; label: string }> = [
  { code: 'en', label: 'English' },
  { code: 'id', label: 'Bahasa Indonesia' },
  { code: 'tl', label: 'Filipino (Tagalog)' },
  { code: 'my', label: 'မြန်မာဘာသာ (Burmese)' },
]

const onboardingCopy = {
  en: {
    browse: 'Browse helper profiles', chooseLanguage: 'Choose your language', eyebrow: 'For helpers', headline: 'Find your next job with a profile you control.', intro: 'Registration is free. Rumaya keeps your phone number and documents private, and you decide when your profile can be shared.', create: 'Create my profile', existing: 'I already have a profile', pilot: 'Available for helpers from Indonesia, the Philippines, and Myanmar during the Singapore pilot.', how: 'How it works', step1: '1. Tell us about yourself', step1Detail: 'Add your experience, skills, languages, and availability.', step2: '2. Rumaya checks your profile', step2Detail: 'We review your information before anything is published.', step3: '3. Connect through an agency', step3Detail: 'You approve agency representation. Employers do not receive your private contact details.', free: 'Helpers never pay Rumaya to register or publish a profile.', backInfo: 'Back to helper information', access: 'Helper access', registerTitle: 'Create your helper profile', signinTitle: 'Welcome back', registerIntro: 'Start with a few basic details. You can add your full experience after phone verification.', signinIntro: 'Use the mobile number connected to your helper profile.', name: 'Your name', sourceCountry: 'Source country', location: 'Current location', preferredLanguage: 'Preferred language', mobile: 'Mobile number', overseas: 'Overseas', transfer: 'Singapore transfer', verificationCode: 'Verification code', devCode: 'Development code: 123456', wait: 'Please wait...', verify: 'Verify and continue', sendCode: 'Send sign-in code', back: 'Back',
  },
  id: {
    browse: 'Lihat profil pekerja rumah tangga', chooseLanguage: 'Pilih bahasa Anda', eyebrow: 'Untuk pekerja rumah tangga', headline: 'Temukan pekerjaan berikutnya dengan profil yang Anda kendalikan.', intro: 'Pendaftaran gratis. Rumaya menjaga nomor telepon dan dokumen Anda tetap pribadi, dan Anda menentukan kapan profil dapat dibagikan.', create: 'Buat profil saya', existing: 'Saya sudah memiliki profil', pilot: 'Tersedia untuk pekerja rumah tangga dari Indonesia, Filipina, dan Myanmar selama program percontohan Singapura.', how: 'Cara kerjanya', step1: '1. Ceritakan tentang diri Anda', step1Detail: 'Tambahkan pengalaman, keterampilan, bahasa, dan ketersediaan Anda.', step2: '2. Rumaya memeriksa profil Anda', step2Detail: 'Kami meninjau informasi Anda sebelum dipublikasikan.', step3: '3. Terhubung melalui agensi', step3Detail: 'Anda menyetujui perwakilan agensi. Pemberi kerja tidak menerima detail kontak pribadi Anda.', free: 'Pekerja rumah tangga tidak pernah membayar Rumaya untuk mendaftar atau menerbitkan profil.', backInfo: 'Kembali ke informasi pekerja', access: 'Akses pekerja', registerTitle: 'Buat profil pekerja Anda', signinTitle: 'Selamat datang kembali', registerIntro: 'Mulai dengan beberapa informasi dasar. Anda dapat menambahkan pengalaman lengkap setelah verifikasi telepon.', signinIntro: 'Gunakan nomor ponsel yang terhubung ke profil Anda.', name: 'Nama Anda', sourceCountry: 'Negara asal', location: 'Lokasi saat ini', preferredLanguage: 'Bahasa pilihan', mobile: 'Nomor ponsel', overseas: 'Di luar negeri', transfer: 'Transfer di Singapura', verificationCode: 'Kode verifikasi', devCode: 'Kode pengembangan: 123456', wait: 'Mohon tunggu...', verify: 'Verifikasi dan lanjutkan', sendCode: 'Kirim kode masuk', back: 'Kembali',
  },
  tl: {
    browse: 'Tingnan ang mga profile ng helper', chooseLanguage: 'Piliin ang iyong wika', eyebrow: 'Para sa mga helper', headline: 'Hanapin ang susunod mong trabaho gamit ang profile na ikaw ang may kontrol.', intro: 'Libre ang pagpaparehistro. Pinananatiling pribado ng Rumaya ang iyong numero ng telepono at mga dokumento, at ikaw ang magpapasya kung kailan maaaring ibahagi ang iyong profile.', create: 'Gumawa ng profile ko', existing: 'May profile na ako', pilot: 'Available para sa mga helper mula Indonesia, Pilipinas, at Myanmar sa Singapore pilot.', how: 'Paano ito gumagana', step1: '1. Ikuwento ang tungkol sa iyo', step1Detail: 'Idagdag ang iyong karanasan, kasanayan, wika, at availability.', step2: '2. Susuriin ng Rumaya ang profile mo', step2Detail: 'Susuriin namin ang impormasyon bago ito mailathala.', step3: '3. Kumonekta sa pamamagitan ng ahensya', step3Detail: 'Ikaw ang aapruba sa ahensyang kakatawan sa iyo. Hindi matatanggap ng employer ang pribado mong contact details.', free: 'Hindi kailanman magbabayad ang helper sa Rumaya para magparehistro o maglathala ng profile.', backInfo: 'Bumalik sa impormasyon ng helper', access: 'Access ng helper', registerTitle: 'Gawin ang iyong helper profile', signinTitle: 'Maligayang pagbabalik', registerIntro: 'Magsimula sa ilang pangunahing detalye. Maaari mong idagdag ang buong karanasan pagkatapos ma-verify ang telepono.', signinIntro: 'Gamitin ang mobile number na nakakonekta sa iyong helper profile.', name: 'Iyong pangalan', sourceCountry: 'Bansang pinagmulan', location: 'Kasalukuyang lokasyon', preferredLanguage: 'Gustong wika', mobile: 'Mobile number', overseas: 'Nasa ibang bansa', transfer: 'Singapore transfer', verificationCode: 'Verification code', devCode: 'Development code: 123456', wait: 'Sandali lang...', verify: 'I-verify at magpatuloy', sendCode: 'Ipadala ang sign-in code', back: 'Bumalik',
  },
  my: {
    browse: 'အိမ်အကူပရိုဖိုင်များ ကြည့်ရန်', chooseLanguage: 'သင့်ဘာသာစကားကို ရွေးချယ်ပါ', eyebrow: 'အိမ်အကူများအတွက်', headline: 'သင်ကိုယ်တိုင် ထိန်းချုပ်နိုင်သော ပရိုဖိုင်ဖြင့် နောက်အလုပ်ကို ရှာဖွေပါ။', intro: 'မှတ်ပုံတင်ခြင်း အခမဲ့ဖြစ်သည်။ Rumaya သည် သင့်ဖုန်းနံပါတ်နှင့် စာရွက်စာတမ်းများကို လျှို့ဝှက်ထားပြီး ပရိုဖိုင်ကို မည်သည့်အချိန်တွင် မျှဝေမည်ကို သင်ဆုံးဖြတ်နိုင်သည်။', create: 'ကျွန်ုပ်၏ပရိုဖိုင် ဖန်တီးရန်', existing: 'ကျွန်ုပ်တွင် ပရိုဖိုင်ရှိပြီးသား', pilot: 'စင်ကာပူ စမ်းသပ်အစီအစဉ်တွင် အင်ဒိုနီးရှား၊ ဖိလစ်ပိုင်နှင့် မြန်မာနိုင်ငံမှ အိမ်အကူများအတွက် ရရှိနိုင်သည်။', how: 'လုပ်ဆောင်ပုံ', step1: '၁။ သင့်အကြောင်း ပြောပြပါ', step1Detail: 'အတွေ့အကြုံ၊ ကျွမ်းကျင်မှု၊ ဘာသာစကားနှင့် အလုပ်စနိုင်မည့်အချိန်ကို ထည့်ပါ။', step2: '၂။ Rumaya က သင့်ပရိုဖိုင်ကို စစ်ဆေးမည်', step2Detail: 'အများပြည်သူသို့ မဖော်ပြမီ သင့်အချက်အလက်များကို စစ်ဆေးပါမည်။', step3: '၃။ အေဂျင်စီမှတစ်ဆင့် ချိတ်ဆက်ပါ', step3Detail: 'သင့်ကိုယ်စားပြုမည့် အေဂျင်စီကို သင်ခွင့်ပြုရမည်။ အလုပ်ရှင်များသည် သင့်ကိုယ်ရေးဆက်သွယ်ရန်အချက်အလက်ကို မရရှိပါ။', free: 'အိမ်အကူများသည် Rumaya တွင် မှတ်ပုံတင်ရန် သို့မဟုတ် ပရိုဖိုင်ဖော်ပြရန် ငွေပေးစရာမလိုပါ။', backInfo: 'အိမ်အကူအချက်အလက်သို့ ပြန်သွားရန်', access: 'အိမ်အကူ ဝင်ရောက်ရန်', registerTitle: 'သင့်အိမ်အကူပရိုဖိုင် ဖန်တီးပါ', signinTitle: 'ပြန်လည်ကြိုဆိုပါသည်', registerIntro: 'အခြေခံအချက်အလက်အနည်းငယ်ဖြင့် စတင်ပါ။ ဖုန်းအတည်ပြုပြီးနောက် အတွေ့အကြုံအပြည့်အစုံကို ထည့်နိုင်သည်။', signinIntro: 'သင့်အိမ်အကူပရိုဖိုင်နှင့် ချိတ်ထားသော ဖုန်းနံပါတ်ကို အသုံးပြုပါ။', name: 'သင့်အမည်', sourceCountry: 'မူရင်းနိုင်ငံ', location: 'လက်ရှိနေရာ', preferredLanguage: 'နှစ်သက်ရာဘာသာစကား', mobile: 'မိုဘိုင်းဖုန်းနံပါတ်', overseas: 'နိုင်ငံရပ်ခြား', transfer: 'စင်ကာပူတွင်း အလုပ်ပြောင်း', verificationCode: 'အတည်ပြုကုဒ်', devCode: 'စမ်းသပ်ကုဒ်: 123456', wait: 'ခဏစောင့်ပါ...', verify: 'အတည်ပြုပြီး ဆက်လုပ်ရန်', sendCode: 'ဝင်ရောက်ရန်ကုဒ် ပို့ပါ', back: 'ပြန်သွားရန်',
  },
} as const

interface ProfileForm {
  displayName: string
  sourceCountry: Country
  locationType: Location
  bio: string
  languages: string[]
  yearsExperience: number
  availableFrom: string
  expectedSalary: string
  skills: Array<{ type: Skill; proficiency: Proficiency; yearsExperience: number }>
}

interface HelperProfile extends Omit<ProfileForm, 'availableFrom' | 'expectedSalary'> {
  id: string
  status: string
  availableFrom: string | null
  expectedSalary: string | number | null
  lastAvailabilityConfirmedAt: string | null
  availabilityDueAt: string | null
  representations: Representation[]
  documents: unknown[]
  validations: unknown[]
}

interface Representation {
  id: string
  status: string
  agency: { displayName: string; status: string }
}

const skillLabels: Record<Skill, string> = {
  infant_care: 'Infant care', childcare: 'Childcare', eldercare: 'Eldercare', disability_care: 'Disability care',
  cooking: 'Cooking', pet_care: 'Pet care', housekeeping: 'Housekeeping', other: 'Other',
}

const initialForm: ProfileForm = {
  displayName: '', sourceCountry: 'indonesia', locationType: 'overseas', bio: '', languages: ['en'],
  yearsExperience: 0, availableFrom: '', expectedSalary: '', skills: [],
}

function messageFor(error: unknown) {
  return error instanceof ApiError ? error.message : 'Could not complete this request. Please try again.'
}

function profilePayload(form: ProfileForm) {
  return {
    ...form,
    bio: form.bio.trim() || undefined,
    availableFrom: form.availableFrom || undefined,
    expectedSalary: form.expectedSalary ? Number(form.expectedSalary) : undefined,
  }
}

export default function HelperAccessPage() {
  const navigate = useNavigate()
  const { account, loading, startPhoneVerification, verifyPhone, call, refreshAccount, logout } = useMarketplaceAuth()
  const [mode, setMode] = useState<'signin' | 'register' | null>(null)
  const [step, setStep] = useState<'details' | 'code'>('details')
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [preferredLanguage, setPreferredLanguage] = useState('en')
  const [code, setCode] = useState('')
  const [form, setForm] = useState<ProfileForm>(initialForm)
  const [profile, setProfile] = useState<HelperProfile | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const copy = onboardingCopy[preferredLanguage as PilotLanguage] ?? onboardingCopy.en

  async function loadProfile() {
    const data = await call<{ profile: HelperProfile }>('/marketplace/helper-profiles/me')
    setProfile(data.profile)
    setForm({
      displayName: data.profile.displayName,
      sourceCountry: data.profile.sourceCountry,
      locationType: data.profile.locationType,
      bio: data.profile.bio ?? '',
      languages: data.profile.languages,
      yearsExperience: data.profile.yearsExperience,
      availableFrom: data.profile.availableFrom?.slice(0, 10) ?? '',
      expectedSalary: data.profile.expectedSalary?.toString() ?? '',
      skills: data.profile.skills.map(({ type, proficiency, yearsExperience }) => ({ type, proficiency, yearsExperience })),
    })
  }

  useEffect(() => {
    if (!account?.helperProfile) return
    loadProfile().catch((loadError) => setError(messageFor(loadError)))
    // Load whenever the authenticated helper changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.helperProfile?.id])

  async function handleAccess(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (step === 'details') {
        if (mode === 'register') {
          await apiFetch('/marketplace/auth/register-helper', {
            method: 'POST',
            body: {
              phone, name, preferredLanguage, consentVersion: '2026-10-02', acceptDataProcessing: true,
              profile: profilePayload({ ...form, displayName: form.displayName || name, languages: [preferredLanguage] }),
            },
          })
        } else {
          await startPhoneVerification(phone)
        }
        setStep('code')
      } else {
        await verifyPhone(phone, code)
      }
    } catch (accessError) {
      setError(messageFor(accessError))
    } finally {
      setBusy(false)
    }
  }

  function toggleSkill(type: Skill) {
    setForm((current) => ({
      ...current,
      skills: current.skills.some((skill) => skill.type === type)
        ? current.skills.filter((skill) => skill.type !== type)
        : [...current.skills, { type, proficiency: 'intermediate', yearsExperience: 0 }],
    }))
  }

  async function saveProfile() {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await call('/marketplace/helper-profiles/me', { method: 'PUT', body: profilePayload(form) })
      await loadProfile()
      setNotice('Profile saved to your Rumaya account.')
    } catch (saveError) {
      setError(messageFor(saveError))
    } finally {
      setBusy(false)
    }
  }

  async function submitProfile() {
    const missingFields = [
      !form.bio.trim() ? 'About me' : null,
      !form.availableFrom ? 'Available from' : null,
      form.skills.length === 0 ? 'at least one skill' : null,
    ].filter((field): field is string => Boolean(field))

    if (missingFields.length > 0) {
      setNotice(null)
      setError(`Please complete ${missingFields.join(', ')} before submitting.`)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setBusy(true)
    setError(null)
    try {
      await call('/marketplace/helper-profiles/me', { method: 'PUT', body: profilePayload(form) })
      await call('/marketplace/helper-profiles/me/submit', {
        method: 'POST', body: { consentVersion: '2026-10-02', acceptProfilePublication: true },
      })
      await refreshAccount()
      await loadProfile()
      setNotice('Profile submitted for Rumaya validation.')
    } catch (submitError) {
      setError(messageFor(submitError))
    } finally {
      setBusy(false)
    }
  }

  async function confirmAvailability() {
    setBusy(true)
    setError(null)
    try {
      await call('/marketplace/helper-profiles/me/availability', { method: 'POST' })
      await loadProfile()
      setNotice('Availability confirmed for the next 30 days.')
    } catch (availabilityError) {
      setError(messageFor(availabilityError))
    } finally {
      setBusy(false)
    }
  }

  async function respondToRepresentation(id: string, response: 'accept' | 'decline') {
    setBusy(true)
    setError(null)
    try {
      await call(`/marketplace/agency-helper/representations/${id}/respond`, { method: 'POST', body: { response } })
      await loadProfile()
      setNotice(`Agency representation ${response === 'accept' ? 'accepted' : 'declined'}.`)
    } catch (responseError) {
      setError(messageFor(responseError))
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className="min-h-screen bg-slate-50 p-8 text-sm text-slate-500">Loading helper access...</div>

  if (!account) {
    if (!mode) {
      return (
        <div className="min-h-screen bg-slate-50 text-slate-950">
          <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5 sm:px-8">
              <button type="button" onClick={() => navigate('/')} className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-950">
                <ArrowLeft className="h-4 w-4" /> Rumaya
              </button>
              <Button type="button" variant="ghost" size="sm" onClick={() => navigate('/helpers')}>{copy.browse}</Button>
            </div>
          </header>

          <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-16">
            <div className="mb-10 flex flex-col gap-3 border-y border-slate-200 py-4 sm:flex-row sm:items-center sm:justify-between">
              <label htmlFor="helper-welcome-language" className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                <Languages className="h-5 w-5 text-blue-700" /> {copy.chooseLanguage}
              </label>
              <select
                id="helper-welcome-language"
                value={preferredLanguage}
                onChange={(event) => setPreferredLanguage(event.target.value)}
                className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-64"
              >
                {pilotLanguages.map((language) => <option key={language.code} value={language.code}>{language.label}</option>)}
              </select>
            </div>

            <section className="grid gap-10 lg:grid-cols-[1fr_22rem] lg:items-start">
              <div>
                <span className="flex h-12 w-12 items-center justify-center rounded-md bg-blue-100 text-blue-700">
                  <UserRound className="h-6 w-6" />
                </span>
                <p className="mt-6 text-xs font-extrabold uppercase text-blue-700">{copy.eyebrow}</p>
                <h1 className="mt-3 max-w-xl text-3xl font-extrabold leading-tight sm:text-5xl">{copy.headline}</h1>
                <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
                  {copy.intro}
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button type="button" size="lg" onClick={() => setMode('register')}>
                    {copy.create} <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button type="button" size="lg" variant="secondary" onClick={() => setMode('signin')}>
                    <LogIn className="h-4 w-4" /> {copy.existing}
                  </Button>
                </div>

                <p className="mt-4 text-xs leading-5 text-slate-500">{copy.pilot}</p>
              </div>

              <aside className="border-y border-slate-200 bg-white px-5 py-6 sm:px-6 lg:border lg:border-slate-200">
                <h2 className="text-sm font-extrabold">{copy.how}</h2>
                <ol className="mt-5 space-y-5">
                  <li className="flex gap-3"><UserRound className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" /><div><p className="text-sm font-bold">{copy.step1}</p><p className="mt-1 text-xs leading-5 text-slate-500">{copy.step1Detail}</p></div></li>
                  <li className="flex gap-3"><FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" /><div><p className="text-sm font-bold">{copy.step2}</p><p className="mt-1 text-xs leading-5 text-slate-500">{copy.step2Detail}</p></div></li>
                  <li className="flex gap-3"><Building2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" /><div><p className="text-sm font-bold">{copy.step3}</p><p className="mt-1 text-xs leading-5 text-slate-500">{copy.step3Detail}</p></div></li>
                </ol>
                <div className="mt-6 flex gap-2 border-t border-slate-200 pt-5 text-xs leading-5 text-slate-600"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {copy.free}</div>
              </aside>
            </section>
          </main>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <div className="mx-auto max-w-2xl">
          <button type="button" onClick={() => { setMode(null); setStep('details'); setError(null) }} className="flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> {copy.backInfo}
          </button>
          <div className="mt-10 rounded-lg bg-white p-6 text-slate-950 shadow-2xl sm:p-8">
            <p className="text-xs font-extrabold uppercase text-blue-700">{copy.access}</p>
            <h1 className="mt-3 text-2xl font-extrabold">{mode === 'register' ? copy.registerTitle : copy.signinTitle}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">{mode === 'register' ? copy.registerIntro : copy.signinIntro}</p>

            <form onSubmit={handleAccess} className="mt-6 space-y-4">
              {step === 'details' ? (
                <>
                  {mode === 'register' && (
                    <>
                      <label className="block text-xs font-bold text-slate-700">{copy.name}<input required value={name} onChange={(event) => setName(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm font-normal" /></label>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block text-xs font-bold text-slate-700">{copy.sourceCountry}<select value={form.sourceCountry} onChange={(event) => setForm({ ...form, sourceCountry: event.target.value as Country })} className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal"><option value="indonesia">Indonesia</option><option value="philippines">Philippines</option><option value="myanmar">Myanmar</option></select></label>
                        <label className="block text-xs font-bold text-slate-700">{copy.location}<select value={form.locationType} onChange={(event) => setForm({ ...form, locationType: event.target.value as Location })} className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal"><option value="overseas">{copy.overseas}</option><option value="singapore_transfer">{copy.transfer}</option></select></label>
                      </div>
                      <label className="block text-xs font-bold text-slate-700">{copy.preferredLanguage}<select value={preferredLanguage} onChange={(event) => setPreferredLanguage(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal">{pilotLanguages.map((language) => <option key={language.code} value={language.code}>{language.label}</option>)}</select></label>
                    </>
                  )}
                  <label className="block text-xs font-bold text-slate-700">{copy.mobile}<input type="tel" required placeholder="+639123456789" value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm font-normal" /></label>
                </>
              ) : (
                <label className="block text-xs font-bold text-slate-700">{copy.verificationCode}<input required value={code} onChange={(event) => setCode(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm font-normal" /><span className="mt-2 block font-normal text-slate-500">{copy.devCode}</span></label>
              )}
              {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
              <Button type="submit" disabled={busy} className="w-full">{busy ? copy.wait : step === 'code' ? copy.verify : mode === 'register' ? copy.create : copy.sendCode}</Button>
              {step === 'code' && <button type="button" onClick={() => setStep('details')} className="w-full text-xs font-bold text-blue-600">{copy.back}</button>}
            </form>
          </div>
        </div>
      </div>
    )
  }

  if (!account.helperProfile || !profile) {
    return <div className="min-h-screen bg-slate-50 p-8"><p className="text-sm text-slate-600">This signed-in account does not have a helper profile.</p><Button className="mt-4" onClick={logout}>Sign out</Button></div>
  }

  const editable = ['draft', 'changes_requested'].includes(profile.status)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <button type="button" onClick={() => navigate('/')} className="text-left">
            <p className="text-xs font-bold text-blue-700">Rumaya Helper Network</p>
            <h1 className="mt-1 text-xl font-extrabold">My helper profile</h1>
          </button>
          <nav aria-label="Helper navigation" className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => navigate('/helpers')}>
              <Search className="h-4 w-4" /> Browse network
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => navigate('/')}>
              <Home className="h-4 w-4" /> Rumaya home
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <section className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-7 sm:flex-row sm:items-center">
          <div><div className="flex items-center gap-2"><h2 className="text-2xl font-extrabold">{profile.displayName}</h2><BadgeCheck className="h-5 w-5 text-blue-600" /></div><p className="mt-2 text-sm text-slate-500">Profile status: <span className="font-bold text-slate-800">{profile.status.replaceAll('_', ' ')}</span></p></div>
          <div className="flex flex-wrap gap-2">{editable && <Button onClick={saveProfile} disabled={busy}><Save className="h-4 w-4" /> Save draft</Button>}{editable && <Button variant="secondary" onClick={submitProfile} disabled={busy}><Send className="h-4 w-4" /> Save and submit</Button>}{['published', 'hidden'].includes(profile.status) && <Button onClick={confirmAvailability} disabled={busy}><CheckCircle2 className="h-4 w-4" /> Confirm availability</Button>}</div>
        </section>
        {notice && <p className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}
        {error && <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
          <section className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-bold text-slate-700">Public display name<input disabled={!editable} value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal disabled:bg-slate-100" /></label>
              <label className="text-xs font-bold text-slate-700">Available from<input type="date" disabled={!editable} value={form.availableFrom} onChange={(event) => setForm({ ...form, availableFrom: event.target.value })} className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal disabled:bg-slate-100" /></label>
              <label className="text-xs font-bold text-slate-700">Years of experience<input type="number" min="0" max="60" disabled={!editable} value={form.yearsExperience} onChange={(event) => setForm({ ...form, yearsExperience: Number(event.target.value) })} className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal disabled:bg-slate-100" /></label>
              <label className="text-xs font-bold text-slate-700">Expected monthly salary (SGD)<input type="number" min="1" disabled={!editable} value={form.expectedSalary} onChange={(event) => setForm({ ...form, expectedSalary: event.target.value })} className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal disabled:bg-slate-100" /></label>
            </div>
            <label className="block text-xs font-bold text-slate-700">About me<textarea disabled={!editable} value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} rows={5} maxLength={2000} className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm font-normal disabled:bg-slate-100" /></label>
            <div><h3 className="text-sm font-extrabold">Skills and experience</h3><div className="mt-4 grid gap-3 sm:grid-cols-2">{(Object.entries(skillLabels) as Array<[Skill, string]>).map(([type, label]) => { const selected = form.skills.find((skill) => skill.type === type); return <div key={type} className="rounded-lg border border-slate-200 bg-white p-4"><label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" disabled={!editable} checked={Boolean(selected)} onChange={() => toggleSkill(type)} /> {label}</label>{selected && <div className="mt-3 grid grid-cols-2 gap-2"><select disabled={!editable} value={selected.proficiency} onChange={(event) => setForm({ ...form, skills: form.skills.map((skill) => skill.type === type ? { ...skill, proficiency: event.target.value as Proficiency } : skill) })} className="h-9 rounded-md border border-slate-300 px-2 text-xs"><option value="basic">Basic</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select><input type="number" min="0" max="60" disabled={!editable} aria-label={`${label} years`} value={selected.yearsExperience} onChange={(event) => setForm({ ...form, skills: form.skills.map((skill) => skill.type === type ? { ...skill, yearsExperience: Number(event.target.value) } : skill) })} className="h-9 rounded-md border border-slate-300 px-2 text-xs" /></div>}</div>})}</div></div>
          </section>

          <aside className="space-y-6">
            <section className="border-t-4 border-blue-600 bg-white p-5 shadow-sm"><Clock3 className="h-5 w-5 text-blue-700" /><h3 className="mt-3 font-extrabold">Validation progress</h3><p className="mt-2 text-xs leading-5 text-slate-500">Complete your bio, availability, and at least one skill before submitting.</p><dl className="mt-4 space-y-2 text-xs"><div className="flex justify-between"><dt>Documents</dt><dd className="font-bold">{profile.documents.length}</dd></div><div className="flex justify-between"><dt>Validation reviews</dt><dd className="font-bold">{profile.validations.length}</dd></div>{profile.availabilityDueAt && <div><dt className="text-slate-500">Availability due</dt><dd className="mt-1 font-bold">{new Date(profile.availabilityDueAt).toLocaleDateString()}</dd></div>}</dl></section>
            <section className="bg-white p-5 shadow-sm"><Building2 className="h-5 w-5 text-slate-700" /><h3 className="mt-3 font-extrabold">Agency representation</h3>{profile.representations.length === 0 ? <p className="mt-2 text-xs leading-5 text-slate-500">No agency representation request yet.</p> : <div className="mt-4 space-y-4">{profile.representations.map((representation) => <div key={representation.id} className="border-t border-slate-200 pt-4"><p className="text-sm font-bold">{representation.agency.displayName}</p><p className="mt-1 text-xs text-slate-500">{representation.status}</p>{representation.status === 'pending' && <div className="mt-3 flex gap-2"><Button size="sm" onClick={() => respondToRepresentation(representation.id, 'accept')} disabled={busy}>Accept</Button><Button size="sm" variant="secondary" onClick={() => respondToRepresentation(representation.id, 'decline')} disabled={busy}>Decline</Button></div>}</div>)}</div>}</section>
          </aside>
        </div>
      </main>
    </div>
  )
}