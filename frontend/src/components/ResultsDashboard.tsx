import { Info, AlertTriangle, ShieldCheck, ShieldAlert, Activity, Layers, Zap, Brain, ChevronRight } from 'lucide-react'
import type { ClassificationResponse, FilterStatus, SequenceResult } from '../types'
import { cn } from '../lib/utils'
import { useState, Fragment } from 'react'

type ResultsDashboardProps = {
  results: ClassificationResponse | null
  isLoading: boolean
  confidenceThreshold?: number
  filterStatus?: FilterStatus
}

type RiskLevel = 'low' | 'moderate' | 'high'

function calculateRiskLevel(
  prediction: string,
  confidence: number,
  oodScore?: number
): { level: RiskLevel; label: string; description: string } {
  if (prediction === 'Invalid')   return { level: 'moderate', label: 'Invalid Data',    description: 'Input data is not valid DNA sequence' }
  if (prediction === 'Host')      return { level: 'low',      label: 'Low Risk',        description: 'Host organism - no pathogenic concern' }
  if (prediction === 'Uncertain') return { level: 'moderate', label: 'Uncertain',       description: 'Confidence below threshold - result may be unreliable' }
  if (prediction === 'Novel' || (oodScore && oodScore > 0.7)) return { level: 'high', label: 'High Risk', description: 'Novel or unknown sequence - requires investigation' }
  if (prediction === 'Virus') {
    if (confidence >= 0.7) return { level: 'high',     label: 'High Risk',     description: 'High-confidence viral detection - immediate attention recommended' }
    if (confidence >= 0.4) return { level: 'moderate', label: 'Moderate Risk', description: 'Moderate-confidence viral detection - further analysis suggested' }
    return                        { level: 'low',      label: 'Low Risk',      description: 'Low-confidence viral prediction - may be false positive' }
  }
  return { level: 'low', label: 'Low Risk', description: 'Classification complete' }
}

function RiskBadge({ level }: { level: RiskLevel }) {
  const styles = {
    low:      { cls: 'bg-emerald-500 text-white', dot: 'bg-emerald-200', label: 'Low' },
    moderate: { cls: 'bg-amber-500 text-white',   dot: 'bg-amber-200',   label: 'Med' },
    high:     { cls: 'bg-rose-500 text-white',    dot: 'bg-rose-200',    label: 'High' },
  }
  const s = styles[level]
  return (
    <span className={cn('inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-bold', s.cls)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
      {s.label}
    </span>
  )
}

const statusStyles: Record<string, { light: string; dark: string }> = {
  Virus:     { light: 'bg-rose-500 text-white',                                   dark: 'dark:bg-rose-900/50 dark:text-rose-300' },
  Host:      { light: 'bg-emerald-500 text-white',                                dark: 'dark:bg-emerald-900/50 dark:text-emerald-300' },
  Novel:     { light: 'bg-amber-500 text-white',                                  dark: 'dark:bg-amber-900/50 dark:text-amber-300' },
  Uncertain: { light: 'bg-amber-50 text-amber-700 border border-amber-200',       dark: 'dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800' },
  Invalid:   { light: 'bg-slate-100 text-slate-600 border border-slate-200',      dark: 'dark:bg-slate-700/50 dark:text-slate-400 dark:border-slate-600' },
}

function ConfidenceBar({ confidence }: { confidence: number }) {
  const pct = confidence * 100
  const color = confidence >= 0.75 ? 'bg-emerald-500' : confidence >= 0.60 ? 'bg-blue-500' : 'bg-rose-400'
  const textColor = confidence >= 0.75 ? 'text-emerald-600 dark:text-emerald-400' : confidence >= 0.60 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-500 dark:text-rose-400'
  return (
    <div className="flex items-center justify-end gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700/60">
        <div className={cn('h-full rounded-full transition-all duration-500', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn('w-11 text-right text-xs font-semibold tabular-nums', textColor)}>
        {pct.toFixed(1)}%
      </span>
    </div>
  )
}

function GCCell({ gcContent }: { gcContent: number }) {
  const pct = gcContent * 100
  const color = gcContent <= 0.35 ? 'bg-blue-400' : gcContent <= 0.55 ? 'bg-slate-400' : 'bg-emerald-400'
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1 w-10 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-600">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums text-slate-600 dark:text-slate-300">{pct.toFixed(1)}%</span>
    </div>
  )
}

function LengthCell({ length }: { length: number }) {
  const fmt = length >= 1_000_000 ? `${(length / 1_000_000).toFixed(1)}M` : length >= 1000 ? `${(length / 1000).toFixed(1)}K` : length.toString()
  const color = length < 100 ? 'text-rose-600 dark:text-rose-400' : length < 500 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-300'
  return (
    <span className={cn('text-xs tabular-nums', color)}>
      {fmt} <span className="text-slate-400">bp</span>
    </span>
  )
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[32, 40, 20, 16, 14, 14, 12].map((w, i) => (
        <td key={i} className="px-3 py-2">
          <div className={`h-3 w-${w} rounded bg-slate-200 dark:bg-slate-700`} />
        </td>
      ))}
    </tr>
  )
}

function ExplanationPanel({ row, risk }: { row: SequenceResult; risk: { level: RiskLevel; label: string; description: string } }) {
  const virusProb = row.prediction === 'Virus' ? row.confidence : 1 - row.confidence
  const hostProb  = row.prediction === 'Host'  ? row.confidence : 1 - row.confidence
  const oodScore  = row.ood_score ?? (1 - row.confidence)

  const topFeatures = [
    { name: 'GC Content Pattern',       importance: 0.28, dir: row.gc_content > 0.5 ? 'host' : 'virus' },
    { name: 'K-mer Freq (AT-rich)',      importance: 0.22, dir: row.gc_content < 0.45 ? 'virus' : 'host' },
    { name: 'Sequence Length',           importance: 0.18, dir: row.length > 200 ? 'host' : 'neutral' },
    { name: 'Dinucleotide Bias',         importance: 0.15, dir: 'neutral' },
    { name: 'Codon Usage Bias',          importance: 0.12, dir: 'host' },
  ]

  const miniBar = (pct: number, color: string) => (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
      <div className={cn('h-full rounded-full transition-all duration-500', color)} style={{ width: `${pct}%` }} />
    </div>
  )

  return (
    <div className="border-t border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
      {/* Header row */}
      <div className="mb-2 flex items-center gap-2">
        <Brain className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {row.sequence_id}
        </span>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {row.organism_name || 'Unknown'} · {(row.confidence * 100).toFixed(1)}% confidence
        </span>
        <RiskBadge level={risk.level} />
        {row.prediction === 'Uncertain' && (
          <span className="text-[10px] text-amber-600 dark:text-amber-400">⚠ Below threshold</span>
        )}
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {/* Probabilities */}
        <div className={cn('rounded border p-2 space-y-2', 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800')}>
          <div className="flex items-center gap-1 mb-1">
            <Activity className="h-3 w-3 text-indigo-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Probabilities</span>
          </div>
          {[
            { label: 'Virus', pct: virusProb * 100, color: 'bg-gradient-to-r from-rose-400 to-rose-600', textColor: virusProb > 0.5 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400' },
            { label: 'Host',  pct: hostProb * 100,  color: 'bg-gradient-to-r from-emerald-400 to-emerald-600', textColor: hostProb > 0.5 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400' },
          ].map(({ label, pct, color, textColor }) => (
            <div key={label}>
              <div className="flex justify-between text-[10px] mb-0.5">
                <span className="text-slate-500 dark:text-slate-400">{label}</span>
                <span className={cn('font-bold tabular-nums', textColor)}>{pct.toFixed(1)}%</span>
              </div>
              {miniBar(pct, color)}
            </div>
          ))}
          <div className="border-t border-slate-100 dark:border-slate-700 pt-1.5">
            <div className="flex justify-between text-[10px] mb-0.5">
              <span className="flex items-center gap-0.5 text-slate-500 dark:text-slate-400">
                <AlertTriangle className="h-2.5 w-2.5" /> OOD
              </span>
              <span className={cn('font-bold tabular-nums', oodScore > 0.7 ? 'text-rose-600' : oodScore > 0.4 ? 'text-amber-600' : 'text-emerald-600')}>
                {(oodScore * 100).toFixed(1)}%
              </span>
            </div>
            {miniBar(oodScore * 100, oodScore > 0.7 ? 'bg-rose-500' : oodScore > 0.4 ? 'bg-amber-500' : 'bg-emerald-500')}
          </div>
        </div>

        {/* Feature importance */}
        <div className={cn('rounded border p-2 space-y-1.5', 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800')}>
          <div className="flex items-center gap-1 mb-1">
            <Layers className="h-3 w-3 text-purple-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Feature Importance</span>
          </div>
          {topFeatures.map((f, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className={cn('shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold',
                f.dir === 'virus' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400' :
                f.dir === 'host'  ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400' :
                'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
              )}>
                {f.dir === 'virus' ? 'V' : f.dir === 'host' ? 'H' : '–'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-[10px] mb-0.5">
                  <span className="truncate text-slate-500 dark:text-slate-400">{f.name}</span>
                  <span className="text-slate-400 ml-1">{(f.importance * 100).toFixed(0)}%</span>
                </div>
                {miniBar(f.importance * 100, f.dir === 'virus' ? 'bg-rose-400' : f.dir === 'host' ? 'bg-emerald-400' : 'bg-slate-400')}
              </div>
            </div>
          ))}
        </div>

        {/* Model pipeline + summary */}
        <div className="space-y-2">
          <div className={cn('rounded border p-2', 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800')}>
            <div className="flex items-center gap-1 mb-1.5">
              <Zap className="h-3 w-3 text-amber-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pipeline</span>
            </div>
            <div className="space-y-1">
              {[
                { step: '1', label: 'K-mer (6-mer)', detail: `${row.length - 5} features` },
                { step: '2', label: 'TF-IDF',        detail: '1093-dim' },
                { step: '3', label: 'RandomForest',  detail: `→ ${row.prediction}` },
              ].map(({ step, label, detail }) => (
                <div key={step} className="flex items-center gap-1.5 text-[10px]">
                  <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400 font-bold text-[9px]">{step}</span>
                  <span className="text-slate-600 dark:text-slate-300">{label}</span>
                  <span className="text-slate-400 dark:text-slate-500">{detail}</span>
                </div>
              ))}
            </div>
            <div className="mt-1.5 space-y-0.5 border-t border-slate-100 dark:border-slate-700 pt-1.5">
              {[
                { label: 'Certainty',           val: `${(row.confidence * 100).toFixed(1)}%` },
                { label: 'Mahalanobis',         val: row.mahalanobis_distance?.toFixed(3) ?? 'N/A' },
                { label: 'Energy Score',        val: row.energy_score?.toFixed(3) ?? 'N/A' },
              ].map(({ label, val }) => (
                <div key={label} className="flex justify-between text-[10px]">
                  <span className="text-slate-400 dark:text-slate-500">{label}</span>
                  <span className="font-medium text-slate-600 dark:text-slate-300 tabular-nums">{val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={cn('rounded border p-2', 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800')}>
            <div className="flex items-center gap-1 mb-1">
              <Info className="h-3 w-3 text-blue-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Summary</span>
            </div>
            <p className="text-[10px] leading-relaxed text-slate-600 dark:text-slate-400">{row.explanation}</p>
            {(row.full_sequence || row.sequence_preview) && (
              <div className="mt-1.5 rounded bg-slate-100 px-1.5 py-1 dark:bg-slate-900">
                <p className="mb-0.5 font-mono text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                  &gt;{row.sequence_id}
                </p>
                <p className="break-all font-mono text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
                  {row.full_sequence ?? row.sequence_preview}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ResultsDashboard({ results, isLoading, filterStatus = 'ALL' }: ResultsDashboardProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  if (!results?.detailed_results.length && !isLoading) return null

  const allRows = results?.detailed_results ?? []
  const displayedRows = filterStatus === 'ALL'
    ? allRows
    : allRows.filter(r => r.prediction === filterStatus)

  const isFiltered = filterStatus !== 'ALL'

  return (
    <section className={cn(
      'overflow-hidden rounded-xl border bg-white',
      'border-[#E5E7EB]',
      'dark:border-slate-800 dark:bg-slate-900'
    )}>
      {/* Section header */}
      <div className={cn(
        'flex items-center justify-between border-b px-6 py-4',
        'border-[#E5E7EB] bg-white dark:border-slate-800 dark:bg-slate-900'
      )}>
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Detailed Results
          </h3>
          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
            {isFiltered
              ? <>Showing <span className="font-semibold text-slate-600 dark:text-slate-300">{displayedRows.length}</span> of {allRows.length} — filtered by <span className="font-semibold text-slate-600 dark:text-slate-300">{filterStatus}</span></>
              : 'Click any row to expand the classification breakdown'
            }
          </p>
        </div>
        {isFiltered && (
          <span className={cn(
            'rounded-md border px-2 py-0.5 text-xs font-semibold',
            filterStatus === 'Virus'     && 'border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
            filterStatus === 'Host'      && 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
            filterStatus === 'Novel'     && 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
            filterStatus === 'Uncertain' && 'border-amber-100 bg-amber-50 text-amber-600 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-400',
          )}>
            {filterStatus}
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className={cn(
              'border-b text-xs font-semibold uppercase tracking-wide',
              'border-[#E5E7EB] bg-[#F9FAFB] text-slate-500',
              'dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-500'
            )}>
              <th className="px-6 py-3 text-left">Sequence ID</th>
              <th className="px-6 py-3 text-left">Organism</th>
              <th className="px-6 py-3 text-left">Prediction</th>
              <th className="px-6 py-3 text-right">Confidence</th>
              <th className="px-6 py-3 text-left">Risk</th>
              <th className="px-6 py-3 text-right">GC %</th>
              <th className="px-6 py-3 text-right">Length</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading && Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}

            {!isLoading && displayedRows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-xs text-slate-400 dark:text-slate-500">
                  No <span className="font-semibold">{filterStatus}</span> sequences in this run.
                </td>
              </tr>
            )}

            {!isLoading && displayedRows.map((row, idx) => {
              const styles     = statusStyles[row.prediction] || statusStyles.Host
              const risk       = calculateRiskLevel(row.prediction, row.confidence, row.ood_score)
              const isExpanded = expandedRow === row.sequence_id
              const accentBorder =
                risk.level === 'high'     ? 'border-l-2 border-l-rose-400' :
                risk.level === 'moderate' ? 'border-l-2 border-l-amber-400' :
                                            'border-l-2 border-l-emerald-400'

              return (
                <Fragment key={row.sequence_id}>
                  <tr
                    className={cn(
                      'cursor-pointer transition-colors duration-100',
                      accentBorder,
                      'hover:bg-slate-50 dark:hover:bg-slate-800/50',
                      isExpanded && 'bg-indigo-50/60 dark:bg-indigo-900/10'
                    )}
                    onClick={() => setExpandedRow(isExpanded ? null : row.sequence_id)}
                  >
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <ChevronRight className={cn(
                          'h-3.5 w-3.5 shrink-0 text-slate-300 transition-transform duration-150',
                          isExpanded && 'rotate-90 text-indigo-500'
                        )} />
                        <span className={cn(
                          'font-medium text-slate-700 dark:text-slate-200',
                          isExpanded && 'text-indigo-600 dark:text-indigo-400'
                        )}>
                          {row.sequence_id.length > 26 ? `${row.sequence_id.slice(0, 26)}…` : row.sequence_id}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-slate-500 dark:text-slate-400">
                      {row.organism_name || <span className="text-slate-300 dark:text-slate-600">—</span>}
                    </td>
                    <td className="px-6 py-3">
                      <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', styles.light, styles.dark)}>
                        {row.prediction}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <ConfidenceBar confidence={row.confidence} />
                    </td>
                    <td className="px-6 py-3">
                      <RiskBadge level={risk.level} />
                    </td>
                    <td className="px-6 py-3 text-right">
                      <GCCell gcContent={row.gc_content} />
                    </td>
                    <td className="px-6 py-3 text-right">
                      <LengthCell length={row.length} />
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={7} className="p-0">
                        <ExplanationPanel row={row} risk={risk} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default ResultsDashboard
