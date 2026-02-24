import { Activity, Dna, Moon, Sun } from 'lucide-react'
import { cn } from '../lib/utils'

type HeaderProps = {
  healthOk: boolean | null
  darkMode: boolean
  toggleDarkMode: () => void
}

function HealthBadge({ healthOk }: { healthOk: boolean | null }) {
  const status =
    healthOk === null ? 'Checking' : healthOk ? 'API healthy' : 'API unreachable'

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
        healthOk === null && 'border-amber-400 bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700',
        healthOk === true && 'border-emerald-400 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-700',
        healthOk === false && 'border-rose-400 bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300 dark:border-rose-700',
      )}
    >
      <Activity className="h-3.5 w-3.5" />
      <span>{status}</span>
    </div>
  )
}

function Header({ healthOk, darkMode, toggleDarkMode }: HeaderProps) {
  return (
    <header className={cn(
      'sticky top-0 z-40 border-b backdrop-blur-md transition-colors',
      darkMode 
        ? 'border-slate-800 bg-slate-900/95' 
        : 'border-slate-200 bg-white/95'
    )}>
      <div className="mx-auto flex max-w-full items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
            <Dna className="h-5 w-5" />
          </div>
          <div>
            <p className={cn(
              'text-xs font-medium uppercase tracking-wider',
              darkMode ? 'text-slate-500' : 'text-slate-400'
            )}>
              BAIO
            </p>
            <h1 className={cn(
              'text-base font-semibold',
              darkMode ? 'text-white' : 'text-slate-900'
            )}>
              DNA Classification & Pathogen Detection
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleDarkMode}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg border transition-all',
              darkMode 
                ? 'border-slate-700 bg-slate-800 text-amber-400 hover:bg-slate-700' 
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            )}
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <HealthBadge healthOk={healthOk} />
        </div>
      </div>
    </header>
  )
}

export default Header
