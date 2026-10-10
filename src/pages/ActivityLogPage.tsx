import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import PageHeader from '@/components/PageHeader'
import BottomNav from '@/components/BottomNav'
import { Card } from '@/components/ui/card'
import { ClipboardList } from 'lucide-react'

interface ActivityLogDto {
  id: string
  action: string
  comment: string
  at: string
  by: { name: string }
}

export default function ActivityLogPage() {
  const { call } = useAuth()
  const [logs, setLogs] = useState<ActivityLogDto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    call<{ activityLogs: ActivityLogDto[] }>('/activity-log')
      .then((data) => setLogs(data.activityLogs))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 pb-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-[24rem] w-[24rem] rounded-full bg-indigo-200/20 blur-3xl" />
      </div>
      <div className="relative z-10 mx-auto max-w-md px-5 pt-6">
        <PageHeader title="Activity log" />

        {loading && <p className="text-sm text-slate-500">Loading…</p>}
        {!loading && logs.length === 0 && <p className="text-sm text-slate-500">No activity yet.</p>}

        <Card className="divide-y divide-slate-100">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 px-4 py-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <ClipboardList className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800">{log.comment}</p>
                <p className="text-xs text-slate-400">
                  {log.by.name} · {new Date(log.at).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </Card>
      </div>

      <BottomNav />
    </div>
  )
}
