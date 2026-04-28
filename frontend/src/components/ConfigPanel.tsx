import { Loader2, PlayCircle, ShieldCheck, SlidersHorizontal, HelpCircle, ChevronDown } from 'lucide-react'
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
  const [isOpen, setIsOpen] = useState(false)
  
  const sliderLabel = (label: string, value: number, tooltip?: string) => (
    <div className="flex-column text-xs">
      <span className="flex items-center gap-1 text-slate-950 uppercase tracking-widest font-bold font-custom2 dark:text-slate-400">
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

  const fieldCls = cn(
    'w-full rounded-md border px-3 py-1.5 text-xs outline-none transition',
    'border-[#E5E7EB] bg-white text-[#1E293B] placeholder:text-slate-400',
    'focus:border-blue-500 focus:ring-2 focus:ring-blue-100',
    'dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-blue-500 dark:focus:ring-blue-900/30',
    'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400'
  )

  return (
    <section className="space-y-3">
      {/* Collapsible toggle */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs transition',
          'hover:bg-slate-100 dark:hover:bg-slate-800'
        )}
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-semibold text-slate-600 dark:text-slate-300">Configuration</span>
        </div>
        <ChevronDown className={cn('h-3.5 w-3.5 text-slate-400 transition-transform duration-200', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="space-y-4">
          {/* Classification type */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
              Classification Type
            </label>
            <select value={config.type} onChange={(e) => onChange('type', e.target.value)} className={fieldCls} disabled={isRunning}>
              <option>Binary (Virus vs Host)</option>
              <option>Binary (Evo 2 - GPU Required)</option>
              <option>Multi-class (Detailed Taxonomy)</option>
            </select>
            {config.type === 'Binary (Evo 2 - GPU Required)' && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                ⚠ Requires NVIDIA GPU with 16 GB+ VRAM
              </p>
            )}
          </div>

          {/* Sliders — full width, stacked */}
          {[
            { key: 'confidence_threshold' as const, label: 'Confidence Threshold', val: config.confidence_threshold, tip: 'Sequences below this are marked Uncertain' },
            { key: 'ood_threshold' as const,        label: 'Novelty Sensitivity',   val: config.ood_threshold,         tip: undefined },
          ].map(({ key, label, val, tip }) => (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {label}
                  {tip && (
                    <div className="group relative">
                      <HelpCircle className="h-3 w-3 cursor-help text-slate-300 dark:text-slate-600" />
                      <div className="absolute bottom-full left-0 z-10 mb-2 hidden w-44 rounded-md bg-slate-800 px-2.5 py-1.5 text-xs text-white shadow-lg group-hover:block">
                        {tip}
                      </div>
                    </div>
                  )}
                </span>
                <span className="text-xs font-bold tabular-nums text-indigo-600 dark:text-indigo-400">
                  {val.toFixed(2)}
                </span>
              </div>
              <div className="relative h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700">
                <div
                  className="absolute left-0 top-0 h-full rounded-full bg-indigo-500"
                  style={{ width: `${val * 100}%` }}
                />
                <input
                  type="range" min={0} max={1} step={0.01} value={val}
                  onChange={(e) => onChange(key, Number(e.target.value))}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  disabled={isRunning}
                />
              </div>
            </div>
          ))}

          {/* Batch size */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Batch Size</label>
              <span className="text-xs text-slate-400 dark:text-slate-500">throughput vs. latency</span>
            </div>
            <input
              type="number" min={1} max={512} value={config.batch_size}
              onChange={(e) => onChange('batch_size', Number(e.target.value))}
              className={fieldCls}
              disabled={isRunning}
            />
          </div>

          {/* Novel / OOD toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Novel / OOD Detection</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">Flags sequences outside training distribution</p>
            </div>
            <button
              type="button"
              onClick={() => onChange('enable_ood', !config.enable_ood)}
              className={cn(
                'flex h-5 w-9 shrink-0 items-center rounded-full px-0.5 transition-colors duration-200',
                config.enable_ood ? 'justify-end bg-emerald-500' : 'justify-start bg-slate-200 dark:bg-slate-700'
              )}
              disabled={isRunning}
            >
              <span className="h-4 w-4 rounded-full bg-white shadow-sm" />
            </button>
          </div>
        </div>
      )}

      {/* Run button — always visible */}
      <div className="space-y-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {parsedCount ? `${parsedCount} sequences queued` : 'Add FASTA sequences to get started'}
        </p>
        <button
          type="button"
          onClick={onRun}
          disabled={isRunning || parsedCount === 0}
          className={cn(
            'inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 text-xs font-semibold shadow-sm transition-all duration-150',
            // Disabled / no sequences — clear muted state
            (parsedCount === 0 || isRunning) && 'cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500',
            // Running — keep it blue but show spinner context
            isRunning && 'bg-blue-600/70 text-white cursor-not-allowed',
            // Ready — solid primary blue with subtle glow
            parsedCount > 0 && !isRunning && 'bg-[#2563EB] text-white hover:bg-blue-700 shadow-sm shadow-blue-600/20 hover:shadow-blue-600/30',
          )}
        >
          {isRunning
            ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Running…</>
            : <><PlayCircle className="h-3.5 w-3.5" /> Run Classification</>
          }
        </button>
      </div>
    </section>
  )
}

export default ConfigPanel
