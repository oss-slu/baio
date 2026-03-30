import { Loader2, PlayCircle, ShieldCheck, SlidersHorizontal, HelpCircle } from 'lucide-react'
import type { ModelConfig } from '../types'
import { cn } from '../lib/utils'
import { useState } from 'react'

type ConfigPanelProps = {
  config: ModelConfig
  onChange: <K extends keyof ModelConfig>(key: K, value: ModelConfig[K]) => void
  onRun: () => void
  isRunning: boolean
  parsedCount: number
}

function ConfigPanel({ config, onChange, onRun, isRunning, parsedCount }: ConfigPanelProps) {
  const [showThresholdHelp, setShowThresholdHelp] = useState(false)
  
  const sliderLabel = (label: string, value: number, tooltip?: string) => (
    <div className="flex-column text-xs">
      <span className="flex items-center gap-1 text-slate-950 font-custom2 dark:text-slate-400">
        {label}
        {tooltip && (
          <div className="relative">
            <HelpCircle 
              className="h-3 w-3 cursor-help text-slate-950" 
              onMouseEnter={() => setShowThresholdHelp(true)}
              onMouseLeave={() => setShowThresholdHelp(false)}
            />
            {showThresholdHelp && tooltip && (
              <div className="absolute bottom-full left-0 mb-2 w-48 rounded-lg bg-slate-800 p-2 text-[10px] text-white shadow-lg z-10">
                {tooltip}
              </div>
            )}
          </div>
        )}
      </span>
      <span className="font-bold text-slate-950 font-custom2 dark:text-emerald-400">{value.toFixed(2)}</span>
    </div>
  )

  return (
    <section className={cn(
      'dark:border-slate-700 dark:bg-slate-800'
    )}>
      <div className="flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg',
            'dark:border-slate-600 dark:bg-slate-700'
          )}>
            <SlidersHorizontal className="h-8 w-8 text-black" />
          </div>
          <div>
            <p className="text-3xl font-normal font-custom3 tracking-wider text-black dark:text-slate-400">
              Configuration
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        <div className={cn(
          'space-y-2 rounded-xl border p-4 text-center',
          'border-white bg-white',
          'dark:border-slate-600 dark:bg-slate-700/50'
        )}>
          <label className="text-sm font-custom2 text-center font-normal text-slate-800 dark:text-slate-200">Classification Type</label>
          <select
            value={config.type}
            onChange={(e) => onChange('type', e.target.value)}
            className={cn(
              'w-full rounded-lg border px-3 py-2 text-sm font-medium font-custom2 outline-none transition',
              'border-slate-950 bg-white text-slate-950 hover:bg-slate-500 focus:border-slate-400 focus:ring-2 focus:ring-slate-100',
              'dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-emerald-600 dark:focus:border-emerald-500 dark:focus:ring-emerald-900'
            )}
            disabled={isRunning}
          >
            <option>Binary (Virus vs Host)</option>
            <option>Multi-class (Detailed Taxonomy)</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className={cn(
            'space-y-2 rounded-xl border p-4',
            'border-white bg-white',
            'dark:border-slate-600 dark:bg-slate-700/50'
          )}>
            {sliderLabel('Confidence threshold', config.confidence_threshold, 'Sequences below this threshold will be marked as Uncertain')}
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={config.confidence_threshold}
              onChange={(e) => onChange('confidence_threshold', Number(e.target.value))}
              className="accent-slate-500 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-900 dark:bg-slate-600 outline-none"
              disabled={isRunning}
            />
          </div>

          <div className={cn(
            'space-y-2 rounded-xl border p-4',
            'border-white bg-white',
            'dark:border-slate-600 dark:bg-slate-700/50'
          )}>
            {sliderLabel('Novelty sensitivity', config.ood_threshold)}
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={config.ood_threshold}
              onChange={(e) => onChange('ood_threshold', Number(e.target.value))}
              className="accent-slate-500 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-900 dark:bg-slate-600 outline-none"
              disabled={isRunning}
            />
          </div>
        </div>

        <div className="grid grid-r-2 gap-2">
          <div className={cn(
            'space-y-2 rounded-xl p-1',
            'dark:border-slate-600 dark:bg-slate-700/50'
          )}>
            <div className="flex items-center justify-between gap-2 text-md font-custom2">
              <span className="text-black dark:text-slate-400">Batch size</span>
              <span className="font-bold text-black dark:text-emerald-400">{config.batch_size}</span>
            </div>
            <input
              type="number"
              min={1}
              max={512}
              value={config.batch_size}
              onChange={(e) => onChange('batch_size', Number(e.target.value))}
              className={cn(
                'w-full rounded-lg border px-3 py-2 text-sm font-semibold outline-none transition',
                'border-black bg-white text-slate-800 hover:border-emerald-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100',
                'dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-emerald-600 dark:focus:border-emerald-500 dark:focus:ring-emerald-900'
              )}
              disabled={isRunning}
            />
            <p className="text-xs text-black font-custom2 dark:text-slate-400">Controls throughput vs. latency.</p>
          </div>

          <div className={cn(
            'space-y-2 rounded-xl p-1',
            'dark:border-slate-600 dark:bg-slate-700/50'
          )}>
            <div className="flex flex-col gap-2 justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-8 w-8 text-black" />
                <p className="text-xl font-custom2 font-normal text-black dark:text-white">
                  Novel / OOD detection
                </p>
              </div>
              <button
                type="button"
                onClick={() => onChange('enable_ood', !config.enable_ood)}
                className={cn(
                  'flex h-8 w-14 items-center rounded-full px-1 transition',
                  config.enable_ood
                    ? 'justify-end border-emerald-500 bg-emerald-500'
                    : 'justify-start border-slate-300 bg-slate-200 dark:border-slate-600 dark:bg-slate-700',
                )}
                disabled={isRunning}
              >
                <span
                  className={cn(
                    'h-6 w-6 rounded-full bg-white shadow-md transition',
                  )}
                />
              </button>
            </div>
            <p className="text-xs text-black font-custom2 dark:text-slate-400">
              Flags sequences outside training distribution.
            </p>
          </div>
        </div>
      </div>

      <div className={cn(
        'mt-5 flex flex-col gap-3 rounded-xl',
        'dark:border-emerald-900/50 dark:from-emerald-950/30 dark:via-slate-900 dark:to-blue-950/30'
      )}>
        <div className="flex flex-col gap-1">
          <p className="text-md font-semibold text-center tracking-wider text-black font-custom2 dark:text-slate-400">
            Ready to Run
          </p>
          <p className="text-sm text-slate-700 font-custom2 dark:text-slate-300">
            {parsedCount ? `${parsedCount} sequences queued for classification.` : 'Add FASTA to get started.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onRun}
          disabled={isRunning || parsedCount === 0}
          className={cn(
            'inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold text-white shadow-lg transition',
            'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/25',
            'hover:shadow-xl hover:shadow-emerald-500/30 hover:from-emerald-600 hover:to-teal-600',
            'disabled:cursor-not-allowed disabled:opacity-60',
            parsedCount > 0 && !isRunning && 'animate-pulse'
          )}
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <PlayCircle className="h-4 w-4" />
              Run Classification
            </>
          )}
        </button>
      </div>
    </section>
  )
}

export default ConfigPanel
