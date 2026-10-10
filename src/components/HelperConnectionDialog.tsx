import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  ArrowRight,
  Building2,
  CalendarClock,
  BadgeCheck,
  CheckCircle2,
  FileText,
  MapPin,
  Mail,
  MessagesSquare,
  Phone,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/api'
import { useMarketplaceAuth } from '@/context/useMarketplaceAuth'

interface ConnectableProfile {
  id: string
  displayName: string
  imageUrl?: string
  representingAgency?: { displayName: string }
}

interface HelperConnectionDialogProps {
  profile: ConnectableProfile
  isDemo: boolean
  onClose: () => void
}

const connectionSteps = [
  {
    icon: FileText,
    title: 'Share your needs',
    description: 'Tell the agency what matters to your household.',
  },
  {
    icon: Building2,
    title: 'Agency review',
    description: 'The representing agency checks fit and availability.',
  },
  {
    icon: MessagesSquare,
    title: 'Meet safely',
    description: 'The agency coordinates questions and an interview.',
  },
]

function normalizePhone(value: string) {
  return `+65${value.replace(/\D/g, '')}`
}

export default function HelperConnectionDialog({
  profile,
  isDemo,
  onClose,
}: HelperConnectionDialogProps) {
  const {
    account,
    startEmployerPhoneVerification,
    completeEmployerRegistration,
    startPhoneVerification,
    verifyPhone,
    startEmailVerification,
    verifyEmail,
    refreshAccount,
    call,
  } = useMarketplaceAuth()
  const dialogRef = useRef<HTMLElement>(null)
  const [message, setMessage] = useState('')
  const [employerName, setEmployerName] = useState(account?.name ?? '')
  const [phone, setPhone] = useState(account?.phone?.replace(/^\+65/, '') ?? '')
  const [email, setEmail] = useState(account?.email ?? '')
  const [location, setLocation] = useState('')
  const [phoneCodeSent, setPhoneCodeSent] = useState(false)
  const [existingPhoneAccount, setExistingPhoneAccount] = useState(false)
  const [emailCodeSent, setEmailCodeSent] = useState(false)
  const [phoneCode, setPhoneCode] = useState('')
  const [emailCode, setEmailCode] = useState('')
  const [phoneVerified, setPhoneVerified] = useState(Boolean(account?.phoneVerifiedAt))
  const [emailVerified, setEmailVerified] = useState(Boolean(account?.emailVerifiedAt))
  const [reviewing, setReviewing] = useState(false)
  const [consent, setConsent] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [messageError, setMessageError] = useState<string | null>(null)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  useEffect(() => {
    dialogRef.current?.scrollTo({ top: 0 })
  }, [reviewing, submitted])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    if (!reviewing) {
      const trimmedName = employerName.trim()
      const trimmedLocation = location.trim()
      const trimmedMessage = message.trim()
      setNameError(trimmedName ? null : 'Enter your name.')
      setLocationError(trimmedLocation ? null : 'Enter your household location.')
      setMessageError(trimmedMessage ? null : 'Describe your household needs.')
      if (!trimmedName || !trimmedLocation || !trimmedMessage) return
      if (!account || !phoneVerified || !emailVerified) {
        setError('Verify both your mobile number and email address before reviewing the request.')
        return
      }
      setReviewing(true)
      return
    }

    setBusy(true)
    try {
      await call('/marketplace/employer-helper/requirements', {
        method: 'PUT',
        body: {
          consentVersion: '2026-10-02',
          acceptDataProcessing: true,
          requirements: {
            generalLocation: location,
            householdComposition: {
              adults: 1,
              childrenAges: [],
              elderlyPersons: 0,
              personsWithDisabilities: 0,
              pets: [],
            },
            requiredSkills: [],
            preferredLanguages: [],
            notes: message.trim(),
          },
        },
      })
      await refreshAccount()
      if (!isDemo) {
        await call('/marketplace/employer-agency', {
          method: 'POST',
          body: { helperProfileId: profile.id, message: message.trim() || undefined },
        })
      }
      setSubmitted(true)
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : 'The agency request could not be sent. Please try again.',
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleSendPhoneCode() {
    setPhoneError(null)
    const localNumber = phone.replace(/\D/g, '')
    if (!/^\d{8}$/.test(localNumber)) {
      setPhoneError('Enter an 8-digit Singapore mobile number.')
      return
    }
    setError(null)
    setBusy(true)
    const normalizedPhone = normalizePhone(localNumber)
    try {
      if (account) {
        await startPhoneVerification(normalizedPhone)
        setExistingPhoneAccount(true)
      } else {
        const result = await startEmployerPhoneVerification(normalizedPhone)
        setExistingPhoneAccount(result.existingAccount)
      }
      setPhone(localNumber)
      setPhoneCodeSent(true)
    } catch (verificationError) {
      setPhoneError(verificationError instanceof ApiError ? verificationError.message : 'Could not send the mobile code.')
    } finally {
      setBusy(false)
    }
  }

  async function handleVerifyPhoneCode() {
    setError(null)
    setPhoneError(null)
    const trimmedName = employerName.trim()
    const trimmedEmail = email.trim()
    if (!account && !existingPhoneAccount) {
      setNameError(trimmedName ? null : 'Enter your name.')
      setEmailError(
        !trimmedEmail
          ? 'Enter your email address.'
          : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)
            ? null
            : 'Enter a valid email address.',
      )
      if (!trimmedName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) return
    }
    setBusy(true)
    try {
      if (account || existingPhoneAccount) {
        await verifyPhone(normalizePhone(phone), phoneCode)
      } else {
        await completeEmployerRegistration({
          name: trimmedName,
          phone: normalizePhone(phone),
          email: trimmedEmail,
          code: phoneCode,
        })
      }
      setPhoneVerified(true)
    } catch (verificationError) {
      setPhoneError(verificationError instanceof ApiError ? verificationError.message : 'The mobile verification code is incorrect.')
    } finally {
      setBusy(false)
    }
  }

  async function handleSendEmailCode() {
    setEmailError(null)
    if (!phoneVerified) {
      setEmailError('Verify your mobile number before verifying email.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Enter a valid email address before requesting a code.')
      return
    }
    setError(null)
    setBusy(true)
    try {
      await startEmailVerification(email.trim())
      setEmailCodeSent(true)
    } catch (verificationError) {
      setEmailError(verificationError instanceof ApiError ? verificationError.message : 'Could not send the email code.')
    } finally {
      setBusy(false)
    }
  }

  async function handleVerifyEmailCode() {
    setError(null)
    setEmailError(null)
    setBusy(true)
    try {
      await verifyEmail(emailCode)
      setEmailVerified(true)
    } catch (verificationError) {
      setEmailError(verificationError instanceof ApiError ? verificationError.message : 'The email verification code is incorrect.')
    } finally {
      setBusy(false)
    }
  }

  const agencyName = profile.representingAgency?.displayName ?? 'the representing agency'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="connection-title"
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-lg bg-white shadow-2xl sm:max-w-2xl sm:rounded-lg"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {profile.imageUrl ? (
              <img src={profile.imageUrl} alt="" className="h-11 w-11 rounded-md object-cover" />
            ) : (
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-900 font-extrabold text-white">
                {profile.displayName.charAt(0)}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-slate-950">{profile.displayName}</p>
              <p className="truncate text-xs text-slate-500">Represented by {agencyName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-950"
            aria-label="Close request"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {submitted ? (
          <div className="px-6 py-9 sm:px-10 sm:py-10">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-7 w-7" />
            </span>
            <h2 id="connection-title" className="mt-5 text-center text-2xl font-extrabold text-slate-950">
              {isDemo ? 'Account ready - request preview' : 'Introduction request sent'}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-center text-sm leading-6 text-slate-600">
              {isDemo
                ? `Your account and household needs are saved. This preview shows the request ${agencyName} would receive for ${profile.displayName}.`
                : `${agencyName} has received your request to connect with ${profile.displayName}.`}
            </p>

            <div className="mt-7 border-y border-slate-200 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Request status</p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm font-extrabold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" /> {isDemo ? 'Ready to send' : 'Submitted'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Expected response</p>
                  <p className="mt-1 flex items-center justify-end gap-1.5 text-sm font-extrabold text-slate-800">
                    <CalendarClock className="h-4 w-4 text-slate-500" /> Within 1 business day
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 text-left">
              <h3 className="text-sm font-extrabold text-slate-950">Information shared with the agency</h3>
              {isDemo ? (
                <dl className="mt-4 grid gap-4 rounded-lg bg-slate-50 p-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-semibold text-slate-500">Employer</dt>
                    <dd className="mt-1 font-bold text-slate-900">{employerName}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-slate-500">Contact number</dt>
                    <dd className="mt-1 flex items-center gap-1.5 font-bold text-slate-900">
                      +65 {phone} <BadgeCheck className="h-4 w-4 text-emerald-600" aria-label="Verified" />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-slate-500">Email address</dt>
                    <dd className="mt-1 flex items-center gap-1.5 font-bold text-slate-900">
                      {email} <BadgeCheck className="h-4 w-4 text-emerald-600" aria-label="Verified" />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-slate-500">Household location</dt>
                    <dd className="mt-1 font-bold text-slate-900">{location}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-semibold text-slate-500">Household needs and message</dt>
                    <dd className="mt-1 whitespace-pre-wrap font-medium leading-6 text-slate-700">{message}</dd>
                  </div>
                </dl>
              ) : (
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Your verified employer profile, saved household requirements, and message were included.
                </p>
              )}
            </div>

            <div className="mt-6 text-left">
              <h3 className="text-sm font-extrabold text-slate-950">What happens next</h3>
              <div className="mt-4 space-y-4">
                <div className="flex gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-700">
                    <Building2 className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Agency reviews your request</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {agencyName} confirms availability and checks the fit with your household needs.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-700">
                    <MessagesSquare className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-900">You receive an update in Rumaya</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      The agency can accept, ask a follow-up question, or propose an interview time.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {isDemo && (
              <p className="mt-6 rounded-md bg-amber-50 px-3 py-2 text-center text-xs leading-5 text-amber-900">
                Account and requirements saved. No agency request was sent for this fictional profile.
              </p>
            )}

            <Button type="button" onClick={onClose} className="mt-6 w-full sm:w-auto">
              Back to helper profiles
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="px-5 py-6 sm:px-8 sm:py-8">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-700">
                <ShieldCheck className="h-4 w-4" /> Privacy-first connection
              </div>
              <h2 id="connection-title" className="mt-3 text-2xl font-extrabold text-slate-950">
                Request an agency introduction
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                Helper contact details stay private. Rumaya sends your request to {agencyName}, who
                confirms interest and coordinates the next step.
              </p>

              <ol className="mt-7 grid gap-4 border-y border-slate-200 py-6 sm:grid-cols-3">
                {connectionSteps.map(({ icon: Icon, title, description }, index) => (
                  <li key={title} className="flex gap-3 sm:block">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700 sm:mb-3">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-xs font-extrabold text-slate-950">
                        {index + 1}. {title}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
                    </div>
                  </li>
                ))}
              </ol>

              {reviewing ? (
                <div className="mt-6">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-extrabold text-slate-950">Review information shared</h3>
                    {isDemo && (
                      <span className="rounded-md bg-amber-100 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-900">
                        Demo profile
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    This is the information the representing agency would receive with your request.
                  </p>
                  <dl className="mt-4 divide-y divide-slate-200 rounded-lg border border-slate-200 px-4 text-sm">
                    <div className="flex gap-3 py-3">
                      <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      <div>
                        <dt className="text-xs font-semibold text-slate-500">Employer</dt>
                        <dd className="mt-0.5 font-bold text-slate-900">{employerName}</dd>
                      </div>
                    </div>
                    <div className="flex gap-3 py-3">
                      <Phone className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      <div>
                        <dt className="text-xs font-semibold text-slate-500">Contact number</dt>
                        <dd className="mt-0.5 flex items-center gap-1.5 font-bold text-slate-900">
                          +65 {phone} <BadgeCheck className="h-4 w-4 text-emerald-600" aria-label="Verified" />
                        </dd>
                      </div>
                    </div>
                    <div className="flex gap-3 py-3">
                      <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      <div>
                        <dt className="text-xs font-semibold text-slate-500">Email address</dt>
                        <dd className="mt-0.5 flex items-center gap-1.5 font-bold text-slate-900">
                          {email} <BadgeCheck className="h-4 w-4 text-emerald-600" aria-label="Verified" />
                        </dd>
                      </div>
                    </div>
                    <div className="flex gap-3 py-3">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      <div>
                        <dt className="text-xs font-semibold text-slate-500">Household location</dt>
                        <dd className="mt-0.5 font-bold text-slate-900">{location}</dd>
                      </div>
                    </div>
                    <div className="flex gap-3 py-3">
                      <MessagesSquare className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      <div>
                        <dt className="text-xs font-semibold text-slate-500">Household needs and message</dt>
                        <dd className="mt-0.5 whitespace-pre-wrap font-medium leading-5 text-slate-700">{message}</dd>
                      </div>
                    </div>
                  </dl>
                  <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs leading-5 text-slate-600">
                    <p className="flex items-center gap-2 font-bold text-slate-900">
                      <ShieldCheck className="h-4 w-4 shrink-0 text-blue-600" />
                      How Rumaya uses your information
                    </p>
                    <p className="mt-1.5">
                      Rumaya saves your name, verified contact details, household location, requirements, and request history
                      to manage your account, coordinate introductions, and prevent misuse. Your information is not displayed
                      publicly or shared with helpers. Only {agencyName} receives these details for this request. You may ask
                      Rumaya to correct or delete your information, subject to legal retention requirements.
                    </p>
                  </div>
                  <label className="mt-4 flex cursor-pointer items-start gap-3 text-xs leading-5 text-slate-600">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(event) => setConsent(event.target.checked)}
                      required
                      className="mt-1 h-4 w-4 rounded border-slate-300 accent-blue-600"
                    />
                    I agree to Rumaya saving my personal information and sharing these details with {agencyName} for this
                    introduction request.
                  </label>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  <div className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block text-xs font-bold text-slate-700">
                        Your name
                        <input
                          value={employerName}
                          onChange={(event) => {
                            setEmployerName(event.target.value)
                            setNameError(null)
                          }}
                          required
                          maxLength={100}
                          autoComplete="name"
                          placeholder="e.g. Alex Tan"
                          className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                        {nameError && <span role="alert" className="mt-1.5 block font-normal text-red-700">{nameError}</span>}
                      </label>
                      <label className="block text-xs font-bold text-slate-700">
                        Household location
                        <input
                          value={location}
                          onChange={(event) => {
                            setLocation(event.target.value)
                            setLocationError(null)
                          }}
                          required
                          maxLength={100}
                          placeholder="e.g. Bishan, Singapore"
                          className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                        {locationError && <span role="alert" className="mt-1.5 block font-normal text-red-700">{locationError}</span>}
                      </label>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-lg border border-slate-200 p-3">
                          <label className="block text-xs font-bold text-slate-700">
                            Mobile number
                            <div className="mt-2 flex gap-2">
                              <div className="flex h-10 min-w-0 flex-1 overflow-hidden rounded-md border border-slate-300 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                                <span className="flex items-center border-r border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-600">+65</span>
                                <input
                                  type="tel"
                                  value={phone}
                                  disabled={phoneVerified}
                                  onChange={(event) => {
                                    setPhone(event.target.value.replace(/\D/g, '').slice(0, 8))
                                    setPhoneVerified(false)
                                    setPhoneCodeSent(false)
                                    setExistingPhoneAccount(false)
                                    setPhoneCode('')
                                    setPhoneError(null)
                                  }}
                                  required
                                  inputMode="numeric"
                                  maxLength={8}
                                  autoComplete="tel-national"
                                  placeholder="8589 0416"
                                  aria-label="Singapore mobile number"
                                  className="min-w-0 flex-1 border-0 bg-white px-3 text-sm font-normal text-slate-950 outline-none"
                                />
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant={phoneVerified ? 'secondary' : 'default'}
                                disabled={phoneVerified || busy}
                                onClick={handleSendPhoneCode}
                              >
                                {phoneVerified ? 'Verified' : busy ? 'Sending...' : phoneCodeSent ? 'Resend' : 'Send code'}
                              </Button>
                            </div>
                          </label>
                          {phoneCodeSent && !phoneVerified && (
                            <div className="mt-3">
                              <p className="text-xs text-slate-600">Enter the 6-digit code sent to +65 {phone}.</p>
                              <div className="mt-2 flex gap-2">
                                <input
                                  value={phoneCode}
                                  onChange={(event) => setPhoneCode(event.target.value)}
                                  autoFocus
                                  inputMode="numeric"
                                  maxLength={6}
                                  aria-label="Mobile verification code"
                                  placeholder="6-digit code"
                                  className="h-9 min-w-0 flex-1 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500"
                                />
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={busy}
                                  onClick={handleVerifyPhoneCode}
                                >
                                  Verify
                                </Button>
                              </div>
                            </div>
                          )}
                          {phoneError && (
                            <p role="alert" className="mt-2 text-xs leading-5 text-red-700">
                              {phoneError}
                            </p>
                          )}
                        </div>

                        <div className="rounded-lg border border-slate-200 p-3">
                          <label className="block text-xs font-bold text-slate-700">
                            Email address
                            <div className="mt-2 flex gap-2">
                              <input
                                type="email"
                                value={email}
                                disabled={emailVerified}
                                onChange={(event) => {
                                  setEmail(event.target.value)
                                  setEmailVerified(false)
                                  setEmailCodeSent(false)
                                  setEmailCode('')
                                  setEmailError(null)
                                }}
                                required
                                maxLength={254}
                                autoComplete="email"
                                placeholder="alex@example.com"
                                className="h-10 min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 text-sm font-normal text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant={emailVerified ? 'secondary' : 'default'}
                                disabled={!phoneVerified || emailVerified || busy}
                                onClick={handleSendEmailCode}
                              >
                                {emailVerified
                                  ? 'Verified'
                                  : !phoneVerified
                                    ? 'Verify mobile first'
                                    : emailCodeSent
                                      ? 'Resend'
                                      : 'Send code'}
                              </Button>
                            </div>
                          </label>
                          {emailCodeSent && !emailVerified && (
                            <div className="mt-3">
                              <p className="text-[11px] text-slate-500">Development code: <strong>123456</strong></p>
                              <div className="mt-2 flex gap-2">
                                <input
                                  value={emailCode}
                                  onChange={(event) => setEmailCode(event.target.value)}
                                  inputMode="numeric"
                                  maxLength={6}
                                  aria-label="Email verification code"
                                  placeholder="6-digit code"
                                  className="h-9 min-w-0 flex-1 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500"
                                />
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={busy}
                                  onClick={handleVerifyEmailCode}
                                >
                                  Verify
                                </Button>
                              </div>
                            </div>
                          )}
                          {emailError && (
                            <p role="alert" className="mt-2 text-xs leading-5 text-red-700">
                              {emailError}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  <label className="block text-xs font-bold text-slate-700">
                    Household needs and message
                    <textarea
                      value={message}
                      onChange={(event) => {
                        setMessage(event.target.value)
                        setMessageError(null)
                      }}
                      required
                      maxLength={2000}
                      rows={4}
                      placeholder="Tell the agency about your household, care needs, preferred start date, and questions."
                      className="mt-2 w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-normal leading-6 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                    {messageError && <span role="alert" className="mt-1.5 block font-normal text-red-700">{messageError}</span>}
                  </label>
                  {isDemo && (
                    <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
                      Your passwordless account and household needs will be saved. No agency request is sent for a demo profile.
                    </div>
                  )}
                </div>
              )}
              {error && (
                <div role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">
                  {error}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-8">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  if (reviewing) {
                    setReviewing(false)
                    setConsent(false)
                  } else {
                    onClose()
                  }
                }}
              >
                {reviewing ? 'Back' : 'Cancel'}
              </Button>
              <Button type="submit" disabled={busy}>
                {busy
                  ? 'Please wait...'
                  : reviewing
                    ? isDemo
                      ? 'Save account and preview request'
                      : 'Send request to agency'
                    : 'Review request'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}
