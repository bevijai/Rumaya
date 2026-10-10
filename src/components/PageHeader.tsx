import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

export default function PageHeader({ title }: { title: string }) {
  const navigate = useNavigate()
  return (
    <div className="flex items-center gap-3 px-1 pb-2">
      <button
        onClick={() => navigate(-1)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200"
      >
        <ChevronLeft className="h-5 w-5 text-slate-600" />
      </button>
      <h1 className="text-lg font-bold text-slate-900">{title}</h1>
    </div>
  )
}
