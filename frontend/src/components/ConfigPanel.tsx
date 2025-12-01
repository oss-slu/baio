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

const sliderClasses =
  'accent-emerald-400 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 outline-none'

function ConfigPanel({ config, onChange, onRun, isRunning, parsedCount }: ConfigPanelProps) {
  const sliderLabel = (label: string, value: number) => (
    <div className="flex items-center justify-between text-xs text-slate-400">
      <span>{label}</span>
      <span className="font-semibold text-indigo-200">{value.toFixed(2)}</span>
    </div>
  )

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-emerald-50">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
            <SlidersHorizontal className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Configuration
            </p>
            <h3 className="text-lg font-semibold text-slate-900">Model controls</h3>
          </div>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
          {config.type}
        </span>
      </div>

      <div className="mt-4 grid gap-4">
        <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <label className="text-sm font-semibold text-slate-800">Classification type</label>
          <select
            value={config.type}
            onChange={(e) => onChange('type', e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 outline-none transition hover:border-emerald-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            disabled={isRunning}
          >
            <option>Binary (Virus vs Host)</option>
            <option>Multi-class (Detailed Taxonomy)</option>
          </select>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
            {sliderLabel('Confidence threshold', config.confidence_threshold)}
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={config.confidence_threshold}
              onChange={(e) => onChange('confidence_threshold', Number(e.target.value))}
              className={sliderClasses}
              disabled={isRunning}
            />
          </div>

          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
            {sliderLabel('Novelty sensitivity', config.ood_threshold)}
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={config.ood_threshold}
              onChange={(e) => onChange('ood_threshold', Number(e.target.value))}
              className={sliderClasses}
              disabled={isRunning}
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Batch size</span>
              <span className="font-semibold text-emerald-600">{config.batch_size}</span>
            </div>
            <input
              type="number"
              min={1}
              max={512}
              value={config.batch_size}
              onChange={(e) => onChange('batch_size', Number(e.target.value))}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none transition hover:border-emerald-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              disabled={isRunning}
            />
            <p className="text-xs text-slate-500">Controls throughput vs. latency.</p>
          </div>

          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <p className="text-sm font-semibold text-slate-900">
                  Novel / OOD detection
                </p>
              </div>
              <button
                type="button"
                onClick={() => onChange('enable_ood', !config.enable_ood)}
                className={cn(
                  'flex h-8 w-14 items-center rounded-full border border-slate-200 bg-white px-1 transition',
                  config.enable_ood
                    ? 'justify-end border-emerald-500/60 bg-emerald-100'
                    : 'justify-start',
                )}
                disabled={isRunning}
              >
                <span
                  className={cn(
                    'h-6 w-6 rounded-full bg-slate-300 transition',
                    config.enable_ood && 'bg-emerald-500 shadow-[0_0_0_8px_rgba(52,211,153,0.18)]',
                  )}
                />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Flags sequences outside the training distribution to highlight novel biology.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 rounded-xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-amber-50 to-rose-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Ready to run
          </p>
          <p className="text-sm text-slate-700">
            {parsedCount ? `${parsedCount} sequences queued for classification.` : 'Add FASTA to get started.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onRun}
          disabled={isRunning || parsedCount === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-400 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:shadow-xl hover:shadow-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Running analysis...
            </>
          ) : (
            <>
              <PlayCircle className="h-4 w-4" />
              Run classification
            </>
          )}
        </button>
      </div>
    </section>
  )
}

export default ConfigPanel
