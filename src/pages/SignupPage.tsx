import { ArrowLeft, ArrowRight, Building2, HeartHandshake, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

const paths = [
  {
    icon: UserRound,
    title: 'I am an employer',
    description: 'Create a verified account, share your household needs, and connect through a licensed agency.',
    action: 'Create employer account',
    route: '/employer',
  },
  {
    icon: HeartHandshake,
    title: 'I am a helper',
    description: 'Create your profile, present your experience, and control publication and agency representation.',
    action: 'Register as a helper',
    route: '/helpers/join',
  },
  {
    icon: Building2,
    title: 'I represent an agency',
    description: 'Access your invited agency workspace to manage helper profiles and employer enquiries.',
    action: 'Agency access',
    route: '/agency',
  },
] as const

export default function SignupPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" /> Rumaya
          </button>
          <Button type="button" variant="ghost" size="sm" onClick={() => navigate('/helpers')}>
            Browse helpers
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="max-w-2xl">
          <p className="text-xs font-extrabold uppercase text-blue-700">Join Rumaya</p>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">Choose how you will use Rumaya</h1>
          <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base">
            Each workspace protects different information and follows the right verification process for your role.
          </p>
        </div>

        <div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 lg:grid-cols-3">
          {paths.map(({ icon: Icon, title, description, action, route }) => (
            <section key={title} className="flex min-h-72 flex-col bg-white p-6 sm:p-8">
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-blue-50 text-blue-700">
                <Icon className="h-5 w-5" />
              </span>
              <h2 className="mt-6 text-lg font-extrabold">{title}</h2>
              <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{description}</p>
              <Button type="button" variant="secondary" onClick={() => navigate(route)} className="mt-6 w-full justify-between">
                {action} <ArrowRight className="h-4 w-4" />
              </Button>
            </section>
          ))}
        </div>

        <p className="mt-6 text-xs leading-5 text-slate-500">
          Agency access is invitation-only during the Singapore pilot. Rumaya verifies each participating agency's MOM licence.
        </p>
      </main>
    </div>
  )
}