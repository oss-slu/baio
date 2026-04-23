import { Activity, Dna, Moon, Sun, Database, Cpu, FileText, ChevronDown, Bot} from 'lucide-react'
import { cn } from '../lib/utils'
import { useState } from 'react'

type HeaderProps = {
  healthOk: boolean | null
  darkMode: boolean
  toggleDarkMode: () => void
  chatOpen?: boolean
  onToggleChat?: () => void
}

function HealthBadge({ healthOk }: { healthOk: boolean | null }) {
  const status =
    healthOk === null ? 'Checking' : healthOk ? 'API healthy' : 'API unreachable'

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
        healthOk === null && 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400',
        healthOk === true && 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400',
        healthOk === false && 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-400',
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
          'border-[#E5E7EB] bg-white text-[#1E293B] hover:bg-slate-50 hover:border-slate-300',
          'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
        )}
      >
        <Cpu className="h-3.5 w-3.5 text-indigo-500" />
        <span>baio-v1.2</span>
        <ChevronDown className={cn('h-3 w-3 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-60" onClick={() => setIsOpen(false)} />
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

function Header({
  healthOk,
  darkMode,
  toggleDarkMode,
  chatOpen = false,
  onToggleChat,
}: HeaderProps) {
  return (
    <header className={cn(
      'sticky top-0 z-40 border-b transition-colors',
      darkMode
        ? 'border-slate-800 bg-slate-950'
        : 'border-[#E5E7EB] bg-white'
    )}>
      <div className="flex w-full items-center justify-between px-8 py-3">
        {/* Left — BAIO logo */}
        <div className="flex items-center gap-2">
          <div className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg',
            darkMode ? 'bg-slate-800 text-indigo-400' : 'bg-slate-100 text-indigo-600'
          )}>
            <Dna className="h-5 w-5" />
          </div>
          <p className={cn(
            'text-lg font-bold tracking-tight',
            darkMode ? 'text-white' : 'text-[#1E293B]'
          )}>
            BAIO
          </p>
        </div>

        {/* Right — actions */}
        <div className="flex items-center gap-4">
          {onToggleChat && (
            <button
              onClick={onToggleChat}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all',
                chatOpen
                  ? 'border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                  : darkMode
                    ? 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
                    : 'border-[#E5E7EB] bg-white text-[#1E293B] hover:bg-slate-50'
              )}
              aria-label="Toggle AI Assistant"
            >
              <Bot className="h-4 w-4" />
              AI Assistant
            </button>
          )}
          <ModelInfoBadge />
          <button
            onClick={toggleDarkMode}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg border transition-all',
              darkMode
                ? 'border-slate-700 bg-slate-900 text-amber-400 hover:bg-slate-800'
                : 'border-[#E5E7EB] bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700'
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
