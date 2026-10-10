import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { ApiError } from '@/lib/api'
import PageHeader from '@/components/PageHeader'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BreakdownRow } from '@/components/ui/breakdown-row'
import type { MonthSalaryResult } from '@/domain/salary/types'

interface PayslipDto {
  yyyymm: string
  helperName: string
  employerName: string
  basicSalary: number
  payDay: string
  status: string
  breakdown: MonthSalaryResult
}

const currentYyyymm = new Date().toISOString().slice(0, 7)

export default function PayslipPage() {
  const { call } = useAuth()
  const [data, setData] = useState<PayslipDto | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    call<PayslipDto>(`/payslip/${currentYyyymm}`)
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load payslip.'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 pb-28 print:overflow-visible print:bg-white print:pb-0">
      <div className="pointer-events-none absolute inset-0 print:hidden">
        <div className="absolute -top-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-[24rem] w-[24rem] rounded-full bg-indigo-200/20 blur-3xl" />
      </div>
      <div className="relative z-10 mx-auto max-w-md px-5 pt-6 print:max-w-full">
        <div className="print:hidden">
          <PageHeader title="Payslip" />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {data && (
          <>
            <Card className="p-6">
              <p className="text-xs uppercase tracking-wide text-slate-400">Payslip · {data.yyyymm}</p>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-slate-500">Helper</span>
                <span className="font-medium text-slate-900">{data.helperName}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-slate-500">Employer</span>
                <span className="font-medium text-slate-900">{data.employerName}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-slate-500">Pay day</span>
                <span className="font-medium text-slate-900">{data.payDay}</span>
              </div>

              <div className="mt-5 divide-y divide-slate-100 border-t border-slate-100">
                <BreakdownRow label="Pro-rated basic" value={data.breakdown.proRatedBasic} />
                <BreakdownRow
                  label={`Rest-day pay (${data.breakdown.sundaysWorked} Sundays)`}
                  value={data.breakdown.restDayPay}
                  kind="positive"
                />
                <BreakdownRow label="Additions" value={data.breakdown.additions} kind="positive" />
                <BreakdownRow label="Deductions" value={-data.breakdown.deductions} kind="negative" />
                <BreakdownRow
                  label={`Unpaid leave (${data.breakdown.unpaidLeaveDays} days)`}
                  value={-data.breakdown.unpaidDeduction}
                  kind="negative"
                />
                <BreakdownRow label="Net pay" value={data.breakdown.netPay} bold kind="total" />
              </div>
            </Card>

            <Button className="mt-5 w-full print:hidden" onClick={() => window.print()}>
              Print / Export
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

