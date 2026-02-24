import { Activity, Dna, Moon, Sun, Database, Cpu, FileText, ChevronDown } from 'lucide-react'
import { cn } from '../lib/utils'
import { useState } from 'react'

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

function ModelInfoBadge() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition',
          'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
          'dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
        )}
      >
        <Cpu className="h-3.5 w-3.5 text-indigo-500" />
        <span>baio-v1.2</span>
        <ChevronDown className={cn('h-3 w-3 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className={cn(
            'absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border p-4 shadow-xl',
            'border-slate-200 bg-white',
            'dark:border-slate-700 dark:bg-slate-800'
          )}>
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                <Cpu className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Model Info</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Scientific transparency</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2">
                <span className="text-slate-400 dark:text-slate-500 w-20 flex-shrink-0">Model:</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">baio-v1.2 (RandomForest)</span>
              </div>
              <div className="flex items-start gap-2">
                <Database className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">
                  <strong>Training:</strong> Virus-Host 2024 Dataset
                </span>
              </div>
              <div className="flex items-start gap-2">
                <FileText className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">
                  <strong>Features:</strong> K-mer (6-mer) + TF-IDF
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Dna className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">
                  <strong>Embedding:</strong> K-mer Tokenization
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Accuracy</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">94.2%</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-slate-500 dark:text-slate-400">F1-Score</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">0.93</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
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
          <ModelInfoBadge />
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
