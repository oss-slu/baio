import { Loader2, PlayCircle, ShieldCheck, SlidersHorizontal } from 'lucide-react'
import type { ModelConfig } from '../types'
import { cn } from '../lib/utils'

type ConfigPanelProps = {
  config: ModelConfig
  onChange: <K extends keyof ModelConfig>(key: K, value: ModelConfig[K]) => void
  onRun: () => void
  isRunning: boolean
  parsedCount: number
}

function ConfigPanel({ config, onChange, onRun, isRunning, parsedCount }: ConfigPanelProps) {
  const sliderLabel = (label: string, value: number) => (
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-semibold text-emerald-600 dark:text-emerald-400">{value.toFixed(2)}</span>
    </div>
  )

  return (
    <section className={cn(
      'rounded-2xl border p-5 shadow-lg transition-colors',
      'border-slate-200 bg-white',
      'dark:border-slate-700 dark:bg-slate-800'
    )}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg border',
            'border-slate-200 bg-slate-50',
            'dark:border-slate-600 dark:bg-slate-700'
          )}>
            <SlidersHorizontal className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Configuration
            </p>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Model controls</h3>
          </div>
        </div>
        <span className={cn(
          'rounded-full border px-3 py-1 text-xs font-semibold',
          'border-slate-200 bg-slate-50 text-slate-600',
          'dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300'
        )}>
          {config.type}
        </span>
      </div>

      <div className="mt-4 grid gap-4">
        <div className={cn(
          'space-y-2 rounded-xl border p-4',
          'border-slate-200 bg-slate-50',
          'dark:border-slate-600 dark:bg-slate-700/50'
        )}>
          <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">Classification type</label>
          <select
            value={config.type}
            onChange={(e) => onChange('type', e.target.value)}
            className={cn(
              'w-full rounded-lg border px-3 py-2 text-sm font-medium outline-none transition',
              'border-slate-200 bg-white text-slate-800 hover:border-emerald-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100',
              'dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-emerald-600 dark:focus:border-emerald-500 dark:focus:ring-emerald-900'
            )}
            disabled={isRunning}
          >
            <option>Binary (Virus vs Host)</option>
            <option>Multi-class (Detailed Taxonomy)</option>
          </select>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className={cn(
            'space-y-2 rounded-xl border p-4',
            'border-slate-200 bg-slate-50',
            'dark:border-slate-600 dark:bg-slate-700/50'
          )}>
            {sliderLabel('Confidence threshold', config.confidence_threshold)}
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={config.confidence_threshold}
              onChange={(e) => onChange('confidence_threshold', Number(e.target.value))}
              className="accent-emerald-500 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 dark:bg-slate-600 outline-none"
              disabled={isRunning}
            />
          </div>

          <div className={cn(
            'space-y-2 rounded-xl border p-4',
            'border-slate-200 bg-slate-50',
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
              className="accent-emerald-500 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 dark:bg-slate-600 outline-none"
              disabled={isRunning}
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className={cn(
            'space-y-2 rounded-xl border p-4',
            'border-slate-200 bg-slate-50',
            'dark:border-slate-600 dark:bg-slate-700/50'
          )}>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Batch size</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{config.batch_size}</span>
            </div>
            <input
              type="number"
              min={1}
              max={512}
              value={config.batch_size}
              onChange={(e) => onChange('batch_size', Number(e.target.value))}
              className={cn(
                'w-full rounded-lg border px-3 py-2 text-sm font-semibold outline-none transition',
                'border-slate-200 bg-white text-slate-800 hover:border-emerald-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100',
                'dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-emerald-600 dark:focus:border-emerald-500 dark:focus:ring-emerald-900'
              )}
              disabled={isRunning}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">Controls throughput vs. latency.</p>
          </div>

          <div className={cn(
            'space-y-2 rounded-xl border p-4',
            'border-slate-200 bg-slate-50',
            'dark:border-slate-600 dark:bg-slate-700/50'
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Novel / OOD detection
                </p>
              </div>
              <button
                type="button"
                onClick={() => onChange('enable_ood', !config.enable_ood)}
                className={cn(
                  'flex h-8 w-14 items-center rounded-full border px-1 transition',
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
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Flags sequences outside training distribution.
            </p>
          </div>
        </div>
      </div>

      <div className={cn(
        'mt-5 flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between',
        'border-emerald-200 bg-gradient-to-r from-emerald-50 via-slate-50 to-blue-50',
        'dark:border-emerald-900/50 dark:from-emerald-950/30 dark:via-slate-900 dark:to-blue-950/30'
      )}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Ready to run
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            {parsedCount ? `${parsedCount} sequences queued for classification.` : 'Add FASTA to get started.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onRun}
          disabled={isRunning || parsedCount === 0}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold text-white shadow-lg transition',
            'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/25',
            'hover:shadow-xl hover:shadow-emerald-500/30 hover:from-emerald-600 hover:to-teal-600',
            'disabled:cursor-not-allowed disabled:opacity-60'
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
