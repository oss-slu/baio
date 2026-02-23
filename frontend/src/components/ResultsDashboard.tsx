import { BarChart3, Clock, Shield, Sparkles, Info } from 'lucide-react'
import type { ClassificationResponse } from '../types'
import { cn } from '../lib/utils'
import { useState } from 'react'

type ResultsDashboardProps = {
  results: ClassificationResponse | null
  isLoading: boolean
  parsedCount: number
}

const statusClasses: Record<string, string> = {
  Virus: 'text-rose-700 bg-rose-50 border-rose-200',
  Host: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  Novel: 'text-amber-700 bg-amber-50 border-amber-200',
}

function Metric({
  label,
  value,
  tone,
  hint,
}: {
  label: string
  value: number | string
  tone?: 'rose' | 'emerald' | 'amber' | 'slate'
  hint?: string
}) {
  const toneMap: Record<string, string> = {
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
  }

  return (
    <div className={cn('rounded-xl border p-4 backdrop-blur', tone ? toneMap[tone] : toneMap.slate)}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="py-2">
        <div className="h-4 w-24 rounded bg-slate-200" />
      </td>
      <td className="py-2">
        <div className="h-6 w-20 rounded-full bg-slate-200" />
      </td>
      <td className="py-2">
        <div className="h-4 w-14 rounded bg-slate-200" />
      </td>
      <td className="py-2">
        <div className="h-4 w-14 rounded bg-slate-200" />
      </td>
      <td className="py-2">
        <div className="h-4 w-10 rounded bg-slate-200" />
      </td>
      <td className="py-2">
        <div className="h-4 w-32 rounded bg-slate-200" />
      </td>
    </tr>
  )
}

function ResultsDashboard({ results, isLoading, parsedCount }: ResultsDashboardProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  return (
    <section className="flex h-full flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-emerald-50">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
            <BarChart3 className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Results
            </p>
            <h3 className="text-lg font-semibold text-slate-900">Classification summary</h3>
          </div>
        </div>
        {results && (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
            Source: {results.source}
          </span>
        )}
      </div>

      {!results && !isLoading && (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <div className="space-y-2">
            <Sparkles className="mx-auto h-6 w-6 text-emerald-500" />
            <p className="text-sm text-slate-600">
              {parsedCount
                ? 'Ready when you are. Launch classification to populate results.'
                : 'No run yet. Paste FASTA, configure thresholds, then hit Run.'}
            </p>
          </div>
        </div>
      )}

      {(isLoading || results) && (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {isLoading ? (
              <>
                <div className="h-24 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
                <div className="h-24 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
                <div className="h-24 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
                <div className="h-24 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
              </>
            ) : (
              <>
                <Metric
                  label="Total sequences"
                  value={results?.total_sequences ?? 0}
                  tone="slate"
                  hint="Includes every FASTA entry parsed."
                />
                <Metric
                  label="Virus"
                  value={results?.virus_count ?? 0}
                  hint="Predicted viral origin."
                  tone="rose"
                />
                <Metric
                  label="Host"
                  value={results?.host_count ?? 0}
                  hint="Predicted host / non-viral."
                  tone="emerald"
                />
                <Metric
                  label="Novel / Unknown"
                  value={results?.novel_count ?? 0}
                  hint="Flagged as outside training distribution."
                  tone="amber"
                />
              </>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1">
              <Shield className="h-4 w-4 text-emerald-500" />
              {parsedCount ? `${parsedCount} sequences processed` : 'Awaiting sequences'}
            </div>
            {results && (
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1">
                <Clock className="h-4 w-4 text-emerald-500" />
                {results.processing_time.toFixed(2)}s runtime
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead className="sticky top-0 bg-slate-50 backdrop-blur">
                  <tr className="text-left text-xs uppercase tracking-[0.12em] text-slate-500">
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Organism</th>
                    <th className="px-4 py-3">Prediction</th>
                    <th className="px-4 py-3">Confidence</th>
                    <th className="px-4 py-3">GC</th>
                    <th className="px-4 py-3">Length</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {isLoading &&
                    Array.from({ length: 6 }).map((_, idx) => <SkeletonRow key={idx} />)}

                  {!isLoading &&
                    results?.detailed_results.map((row) => (
                      <>
                        <tr 
                          key={row.sequence_id} 
                          className="hover:bg-slate-50 cursor-pointer"
                          onClick={() => setExpandedRow(expandedRow === row.sequence_id ? null : row.sequence_id)}
                        >
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {row.sequence_id}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {row.organism_name || 'Unknown'}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold',
                                statusClasses[row.prediction] ?? statusClasses.Host,
                              )}
                            >
                              <span
                                className={cn(
                                  'h-2.5 w-2.5 rounded-full',
                                  row.prediction === 'Virus' && 'bg-rose-500',
                                  row.prediction === 'Host' && 'bg-emerald-400',
                                  row.prediction === 'Novel' && 'bg-amber-400',
                                )}
                              />
                              {row.prediction}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-800">{(row.confidence * 100).toFixed(1)}%</td>
                          <td className="px-4 py-3 text-slate-800">{(row.gc_content * 100).toFixed(1)}%</td>
                          <td className="px-4 py-3 text-slate-800">{row.length}bp</td>
                        </tr>
                        {expandedRow === row.sequence_id && row.explanation && (
                          <tr key={`${row.sequence_id}-details`} className="bg-slate-50">
                            <td colSpan={6} className="px-4 py-4">
                              <div className="flex items-start gap-2">
                                <Info className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                                    Classification Explanation
                                  </p>
                                  <p className="text-sm text-slate-700">{row.explanation}</p>
                                  <p className="text-xs text-slate-400 mt-2 font-mono">
                                    Preview: {row.sequence_preview}
                                  </p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  )
}

export default ResultsDashboard
