import { Activity, Dna } from 'lucide-react'
import { cn } from '../lib/utils'

type HeaderProps = {
  healthOk: boolean | null
}

function HealthBadge({ healthOk }: HeaderProps) {
  const status =
    healthOk === null ? 'Checking' : healthOk ? 'API healthy' : 'API unreachable'

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold shadow-glow',
        healthOk === null && 'border-amber-300 bg-amber-50 text-amber-700',
        healthOk === true && 'border-emerald-300 bg-emerald-50 text-emerald-700',
        healthOk === false && 'border-rose-300 bg-rose-50 text-rose-700',
      )}
    >
      <Activity className="h-4 w-4" />
      <span>{status}</span>
    </div>
  )
}

function Header({ healthOk }: HeaderProps) {
  return (
    <header className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-emerald-50/60 to-sky-50 px-6 py-5 shadow-lg shadow-emerald-100">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_25%,rgba(16,185,129,0.2),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(251,146,60,0.16),transparent_32%)]" />
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white ring-1 ring-inset ring-slate-200">
            <Dna className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
              Modern Biotech Dashboard
            </p>
            <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">
              DNA Classification &amp; Novel Pathogen Detection
            </h1>
          </div>
        </div>
        <HealthBadge healthOk={healthOk} />
      </div>
      <p className="mt-3 max-w-3xl text-sm text-slate-500">
        Paste FASTA, tune thresholds, and explore predictions with a responsive,
        lab-grade interface. Use the floating assistant for quick interpretation tips.
      </p>
    </header>
  )
}

export default Header
