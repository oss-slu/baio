import { BarChart3, Clock, Shield, Sparkles, Info, Dna, Bug, User, HelpCircle, AlertTriangle, ShieldCheck, ShieldAlert } from 'lucide-react'
import type { ClassificationResponse } from '../types'
import { cn } from '../lib/utils'
import { useState } from 'react'

type ResultsDashboardProps = {
  results: ClassificationResponse | null
  isLoading: boolean
  parsedCount: number
}

type RiskLevel = 'low' | 'moderate' | 'high'

function calculateRiskLevel(
  prediction: string,
  confidence: number,
  oodScore?: number
): { level: RiskLevel; label: string; description: string } {
  // Host sequences are always low risk
  if (prediction === 'Host') {
    return {
      level: 'low',
      label: 'Low Risk',
      description: 'Host organism - no pathogenic concern'
    }
  }

  // Novel/unknown sequences
  if (prediction === 'Novel' || (oodScore && oodScore > 0.7)) {
    return {
      level: 'high',
      label: 'High Risk',
      description: 'Novel or unknown sequence - requires investigation'
    }
  }

  // Virus risk based on confidence
  if (prediction === 'Virus') {
    if (confidence >= 0.7) {
      return {
        level: 'high',
        label: 'High Risk',
        description: 'High-confidence viral detection - immediate attention recommended'
      }
    }
    if (confidence >= 0.4) {
      return {
        level: 'moderate',
        label: 'Moderate Risk',
        description: 'Moderate-confidence viral detection - further analysis suggested'
      }
    }
    return {
      level: 'low',
      label: 'Low Risk',
      description: 'Low-confidence viral prediction - may be false positive'
    }
  }

  return {
    level: 'low',
    label: 'Low Risk',
    description: 'Classification complete'
  }
}

function RiskBadge({ level, compact = false }: { level: RiskLevel; compact?: boolean }) {
  const styles = {
    low: {
      bg: 'bg-emerald-100 dark:bg-emerald-900/40',
      border: 'border-emerald-300 dark:border-emerald-700',
      text: 'text-emerald-700 dark:text-emerald-300',
      dot: 'bg-emerald-500',
      icon: ShieldCheck,
    },
    moderate: {
      bg: 'bg-amber-100 dark:bg-amber-900/40',
      border: 'border-amber-300 dark:border-amber-700',
      text: 'text-amber-700 dark:text-amber-300',
      dot: 'bg-amber-500',
      icon: AlertTriangle,
    },
    high: {
      bg: 'bg-rose-100 dark:bg-rose-900/40',
      border: 'border-rose-300 dark:border-rose-700',
      text: 'text-rose-700 dark:text-rose-300',
      dot: 'bg-rose-500',
      icon: ShieldAlert,
    },
  }

  const style = styles[level]
  const Icon = style.icon

  if (compact) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold',
          style.bg,
          style.border,
          style.text
        )}
      >
        <span className={cn('h-1.5 w-1.5 rounded-full', style.dot)} />
        {level === 'high' ? 'High' : level === 'moderate' ? 'Med' : 'Low'}
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold',
        style.bg,
        style.border,
        style.text
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {level === 'high' ? 'High Risk' : level === 'moderate' ? 'Moderate' : 'Low Risk'}
    </span>
  )
}

function OverallRiskBanner({ results }: { results: ClassificationResponse }) {
  if (!results) return null

  const virusCount = results.virus_count
  const novelCount = results.novel_count
  const total = results.total_sequences

  // Calculate overall risk
  let overallLevel: RiskLevel = 'low'
  if (virusCount > 0 || novelCount > 0) {
    const riskRatio = (virusCount + novelCount) / total
    if (riskRatio > 0.5 || novelCount > 0) {
      overallLevel = 'high'
    } else if (riskRatio > 0.2) {
      overallLevel = 'moderate'
    } else {
      overallLevel = 'moderate'
    }
  }

  const styles = {
    low: {
      bg: 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30',
      border: 'border-emerald-200 dark:border-emerald-800',
      text: 'text-emerald-800 dark:text-emerald-200',
      icon: ShieldCheck,
      iconBg: 'bg-emerald-500',
    },
    moderate: {
      bg: 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-800 dark:text-amber-200',
      icon: AlertTriangle,
      iconBg: 'bg-amber-500',
    },
    high: {
      bg: 'bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-950/30 dark:to-red-950/30',
      border: 'border-rose-200 dark:border-rose-800',
      text: 'text-rose-800 dark:text-rose-200',
      icon: ShieldAlert,
      iconBg: 'bg-rose-500',
    },
  }

  const style = styles[overallLevel]
  const Icon = style.icon

  const getMessage = () => {
    if (overallLevel === 'high') {
      return `${virusCount + novelCount} potential pathogen(s) detected. Immediate review recommended.`
    }
    if (overallLevel === 'moderate') {
      return `${virusCount} viral sequence(s) detected. Further analysis suggested.`
    }
    return 'No significant pathogenic threat detected in this sample.'
  }

  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-xl border-2 p-4',
        style.bg,
        style.border
      )}
    >
      <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-lg', style.iconBg)}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <span className={cn('text-lg font-bold', style.text)}>
            {overallLevel === 'high' ? 'High Risk Detected' : overallLevel === 'moderate' ? 'Moderate Risk' : 'Low Risk'}
          </span>
          <RiskBadge level={overallLevel} />
        </div>
        <p className={cn('text-sm mt-0.5', style.text, 'opacity-80')}>
          {getMessage()}
        </p>
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  icon: Icon,
  tone,
  hint,
}: {
  label: string
  value: number | string
  icon: React.ElementType
  tone?: 'rose' | 'emerald' | 'amber' | 'slate' | 'blue'
  hint?: string
}) {
  const toneMap: Record<string, { 
    bg: string; 
    border: string; 
    text: string; 
    iconBg: string;
    darkBg: string;
    darkBorder: string;
    darkText: string;
  }> = {
    rose: {
      bg: 'bg-gradient-to-br from-rose-50 to-rose-100',
      border: 'border-rose-200',
      text: 'text-rose-700',
      iconBg: 'bg-gradient-to-br from-rose-500 to-rose-600',
      darkBg: 'dark:bg-gradient-to-br dark:from-rose-950/50 dark:to-rose-900/30',
      darkBorder: 'dark:border-rose-800',
      darkText: 'dark:text-rose-300',
    },
    emerald: {
      bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      darkBg: 'dark:bg-gradient-to-br dark:from-emerald-950/50 dark:to-emerald-900/30',
      darkBorder: 'dark:border-emerald-800',
      darkText: 'dark:text-emerald-300',
    },
    amber: {
      bg: 'bg-gradient-to-br from-amber-50 to-amber-100',
      border: 'border-amber-200',
      text: 'text-amber-700',
      iconBg: 'bg-gradient-to-br from-amber-500 to-amber-600',
      darkBg: 'dark:bg-gradient-to-br dark:from-amber-950/50 dark:to-amber-900/30',
      darkBorder: 'dark:border-amber-800',
      darkText: 'dark:text-amber-300',
    },
    slate: {
      bg: 'bg-gradient-to-br from-slate-50 to-slate-100',
      border: 'border-slate-200',
      text: 'text-slate-700',
      iconBg: 'bg-gradient-to-br from-slate-500 to-slate-600',
      darkBg: 'dark:bg-gradient-to-br dark:from-slate-800/50 dark:to-slate-900/30',
      darkBorder: 'dark:border-slate-700',
      darkText: 'dark:text-slate-300',
    },
    blue: {
      bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
      border: 'border-blue-200',
      text: 'text-blue-700',
      iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
      darkBg: 'dark:bg-gradient-to-br dark:from-blue-950/50 dark:to-blue-900/30',
      darkBorder: 'dark:border-blue-800',
      darkText: 'dark:text-blue-300',
    },
  }

  const styles = tone ? toneMap[tone] : toneMap.slate

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border-2 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1',
        styles.bg,
        styles.border,
        styles.darkBg,
        styles.darkBorder
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className={cn('metric-value mt-2 text-5xl tabular-nums', styles.text, styles.darkText)}>{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
        </div>
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-3',
            styles.iconBg
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  )
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="py-3">
        <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700" />
      </td>
      <td className="py-3">
        <div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-700" />
      </td>
      <td className="py-3">
        <div className="h-6 w-20 rounded-full bg-slate-200 dark:bg-slate-700" />
      </td>
      <td className="py-3">
        <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-700" />
      </td>
      <td className="py-3">
        <div className="h-4 w-14 rounded bg-slate-200 dark:bg-slate-700" />
      </td>
      <td className="py-3">
        <div className="h-4 w-14 rounded bg-slate-200 dark:bg-slate-700" />
      </td>
    </tr>
  )
}

const statusStyles = {
  Virus: {
    light: 'bg-rose-100 text-rose-800 border-rose-300',
    dark: 'dark:bg-rose-900/50 dark:text-rose-300 dark:border-rose-700',
    dot: 'bg-rose-500',
  },
  Host: {
    light: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    dark: 'dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-700',
    dot: 'bg-emerald-500',
  },
  Novel: {
    light: 'bg-amber-100 text-amber-800 border-amber-300',
    dark: 'dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700',
    dot: 'bg-amber-500',
  },
}

function ConfidenceBar({ confidence }: { confidence: number }) {
  const pct = confidence * 100
  const getColor = (conf: number) => {
    if (conf >= 0.7) return { bg: 'bg-emerald-500', glow: 'shadow-emerald-500/50' }
    if (conf >= 0.5) return { bg: 'bg-amber-500', glow: 'shadow-amber-500/50' }
    if (conf >= 0.3) return { bg: 'bg-orange-500', glow: 'shadow-orange-500/50' }
    return { bg: 'bg-rose-500', glow: 'shadow-rose-500/50' }
  }
  const color = getColor(confidence)

  return (
    <div className="flex items-center gap-3">
      <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        {/* Background gradient for visual depth */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        {/* Confidence bar */}
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            color.bg,
            confidence > 0.5 && 'shadow-sm'
          )}
          style={{ width: `${pct}%` }}
        >
          {/* Animated shine effect */}
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </div>
      </div>
      <span className={cn(
        'w-14 text-right text-xs font-bold tabular-nums',
        confidence >= 0.7 ? 'text-emerald-600 dark:text-emerald-400' :
        confidence >= 0.5 ? 'text-amber-600 dark:text-amber-400' :
        confidence >= 0.3 ? 'text-orange-600 dark:text-orange-400' :
        'text-rose-600 dark:text-rose-400'
      )}>
        {pct.toFixed(1)}%
      </span>
    </div>
  )
}

function GCCell({ gcContent }: { gcContent: number }) {
  const pct = gcContent * 100
  
  // Calculate background intensity based on GC content
  // Low GC (0-30%): blue tint, Medium (30-50%): neutral, High (50-100%): green tint
  const getBackgroundStyle = (gc: number) => {
    const intensity = Math.min(gc * 1.5, 1) // Scale up for visibility
    
    if (gc <= 0.35) {
      // Low GC - blue tint
      return {
        background: `linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, ${intensity * 0.15}) 100%)`,
      }
    } else if (gc <= 0.55) {
      // Medium GC - neutral/slate
      return {
        background: `linear-gradient(90deg, transparent 0%, rgba(100, 116, 139, ${intensity * 0.1}) 100%)`,
      }
    } else {
      // High GC - green tint
      return {
        background: `linear-gradient(90deg, transparent 0%, rgba(34, 197, 94, ${intensity * 0.15}) 100%)`,
      }
    }
  }

  return (
    <div 
      className="relative flex items-center justify-end rounded-md px-2 py-1"
      style={getBackgroundStyle(gcContent)}
    >
      {/* Mini bar indicator */}
      <div className="mr-2 h-1.5 w-12 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-600">
        <div 
          className={cn(
            'h-full rounded-full transition-all',
            gcContent <= 0.35 ? 'bg-blue-400' :
            gcContent <= 0.55 ? 'bg-slate-400' :
            'bg-emerald-400'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium tabular-nums">{pct.toFixed(1)}%</span>
    </div>
  )
}

function LengthCell({ length }: { length: number }) {
  const formatLength = (len: number) => {
    if (len >= 1000000) return `${(len / 1000000).toFixed(1)}M`
    if (len >= 1000) return `${(len / 1000).toFixed(1)}K`
    return len.toString()
  }

  const getLengthColor = (len: number) => {
    if (len < 100) return 'text-rose-600 dark:text-rose-400'
    if (len < 500) return 'text-amber-600 dark:text-amber-400'
    return 'text-slate-600 dark:text-slate-300'
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className={cn('text-xs font-medium tabular-nums', getLengthColor(length))}>
        {formatLength(length)}
      </span>
      <span className="text-xs text-slate-400 dark:text-slate-500">bp</span>
    </div>
  )
}

function ResultsDashboard({ results, isLoading, parsedCount }: ResultsDashboardProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      {/* Summary Cards - Full Width */}
      <section className={cn(
        'rounded-2xl border p-6 shadow-lg transition-colors',
        'border-slate-200 bg-white',
        'dark:border-slate-800 dark:bg-slate-900'
      )}>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h2 className={cn(
              'text-xl font-bold',
              'text-slate-900 dark:text-white'
            )}>
              Classification Summary
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {results ? 'Results from sequence analysis' : 'Run classification to see results'}
            </p>
          </div>
        </div>

        {!results && !isLoading && (
          <div className={cn(
            'flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center',
            'border-slate-200 bg-slate-50',
            'dark:border-slate-700 dark:bg-slate-800/50'
          )}>
            <Sparkles className="h-12 w-12 text-slate-300 dark:text-slate-600" />
            <p className={cn(
              'mt-4 text-lg font-medium',
              'text-slate-600 dark:text-slate-300'
            )}>
              {parsedCount
                ? 'Ready to classify sequences'
                : 'No sequences loaded'}
            </p>
            <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
              {parsedCount
                ? 'Click "Run Classification" in the sidebar to start'
                : 'Open the sidebar to add FASTA sequences'}
            </p>
          </div>
        )}

        {(isLoading || results) && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {isLoading ? (
              <>
                <div className="h-32 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
                <div className="h-32 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
                <div className="h-32 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
                <div className="h-32 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
              </>
            ) : (
              <>
                <MetricCard
                  label="Total Sequences"
                  value={results?.total_sequences ?? 0}
                  icon={Dna}
                  tone="blue"
                  hint="All input sequences"
                />
                <MetricCard
                  label="Virus Detected"
                  value={results?.virus_count ?? 0}
                  icon={Bug}
                  tone="rose"
                  hint="Viral origin predicted"
                />
                <MetricCard
                  label="Host Sequences"
                  value={results?.host_count ?? 0}
                  icon={User}
                  tone="emerald"
                  hint="Host/non-viral origin"
                />
                <MetricCard
                  label="Novel / Unknown"
                  value={results?.novel_count ?? 0}
                  icon={HelpCircle}
                  tone="amber"
                  hint="Outside training distribution"
                />
              </>
            )}
          </div>
        )}

        {results && (
          <div className="space-y-4">
            {/* Overall Risk Banner */}
            <OverallRiskBanner results={results} />
            
            <div className={cn(
              'flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 text-sm',
              'border-slate-200 bg-slate-50',
              'dark:border-slate-700 dark:bg-slate-800/50'
            )}>
              <div className={cn(
                'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-medium',
                'border-slate-200 bg-white text-slate-600',
                'dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
              )}>
                <Shield className="h-4 w-4 text-emerald-500" />
                {parsedCount} sequences processed
              </div>
              <div className={cn(
                'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-medium',
                'border-slate-200 bg-white text-slate-600',
                'dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
              )}>
                <Clock className="h-4 w-4 text-blue-500" />
                {results.processing_time.toFixed(2)}s runtime
              </div>
              <div className="ml-auto text-xs text-slate-400 dark:text-slate-500">
                Source: {results.source}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Data Table */}
      {((results && results.detailed_results.length > 0) || isLoading) && (
        <section className={cn(
          'overflow-hidden rounded-2xl border shadow-lg',
          'border-slate-200 bg-white',
          'dark:border-slate-800 dark:bg-slate-900'
        )}>
          <div className={cn(
            'border-b px-6 py-4',
            'border-slate-200 bg-slate-50',
            'dark:border-slate-800 dark:bg-slate-800/50'
          )}>
            <h3 className={cn(
              'text-lg font-semibold',
              'text-slate-900 dark:text-white'
            )}>
              Detailed Results
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Click on a row to see classification explanation
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead className={cn(
                'bg-slate-50 dark:bg-slate-800/50'
              )}>
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="px-6 py-4">Sequence ID</th>
                  <th className="px-6 py-4">Organism</th>
                  <th className="px-6 py-4">Prediction</th>
                  <th className="px-6 py-4 min-w-[180px]">Confidence</th>
                  <th className="px-6 py-4">Risk Level</th>
                  <th className="px-6 py-4 min-w-[140px]">GC Content</th>
                  <th className="px-6 py-4">Length</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading &&
                  Array.from({ length: 4 }).map((_, idx) => (
                    <SkeletonRow key={idx} />
                  ))}

                {!isLoading &&
                  results?.detailed_results.map((row) => {
                    const styles = statusStyles[row.prediction] || statusStyles.Host
                    const risk = calculateRiskLevel(row.prediction, row.confidence, row.ood_score)
                    return (
                      <>
                        <tr
                          key={row.sequence_id}
                          className={cn(
                            'cursor-pointer transition-all',
                            'hover:bg-slate-50 dark:hover:bg-slate-800/50',
                            expandedRow === row.sequence_id && 'bg-slate-50 dark:bg-slate-800/50'
                          )}
                          onClick={() =>
                            setExpandedRow(
                              expandedRow === row.sequence_id ? null : row.sequence_id
                            )
                          }
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                'font-medium',
                                'text-slate-900 dark:text-white'
                              )}>
                                {row.sequence_id.length > 25 
                                  ? `${row.sequence_id.slice(0, 25)}...` 
                                  : row.sequence_id}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-slate-600 dark:text-slate-300">
                              {row.organism_name || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold',
                                styles.light,
                                styles.dark
                              )}
                            >
                              <span className={cn('h-2 w-2 rounded-full', styles.dot)} />
                              {row.prediction}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <ConfidenceBar confidence={row.confidence} />
                          </td>
                          <td className="px-6 py-4">
                            <RiskBadge level={risk.level} />
                          </td>
                          <td className="px-6 py-4">
                            <GCCell gcContent={row.gc_content} />
                          </td>
                          <td className="px-6 py-4">
                            <LengthCell length={row.length} />
                          </td>
                        </tr>
                        {expandedRow === row.sequence_id && row.explanation && (
                          <tr key={`${row.sequence_id}-details`} className="bg-slate-50 dark:bg-slate-800/30">
                            <td colSpan={7} className="px-6 py-5">
                              <div className="flex items-start gap-3">
                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
                                  <Info className="h-4 w-4" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                                      Classification Explanation
                                    </p>
                                    <RiskBadge level={risk.level} />
                                  </div>
                                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 mb-2">
                                    {row.explanation}
                                  </p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">
                                    <strong>Risk Assessment:</strong> {risk.description}
                                  </p>
                                  <div className="mt-3 rounded-md bg-slate-100 dark:bg-slate-800 px-3 py-2">
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Sequence preview:</p>
                                    <p className="font-dna text-xs text-slate-600 dark:text-slate-300 break-all">
                                      {row.sequence_preview}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}

export default ResultsDashboard
