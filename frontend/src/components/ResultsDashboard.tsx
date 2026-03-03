import { BarChart3, Clock, Shield, Sparkles, Info, Dna, Bug, User, HelpCircle, AlertTriangle, ShieldCheck, ShieldAlert, Activity, Layers, Zap, Brain, ChevronRight, Download, FileJson, FileSpreadsheet, FileText, FileDown } from 'lucide-react'
import type { ClassificationResponse, SequenceResult } from '../types'
import { cn } from '../lib/utils'
import { useState, Fragment } from 'react'
import { jsPDF } from 'jspdf'

type ResultsDashboardProps = {
  results: ClassificationResponse | null
  isLoading: boolean
  parsedCount: number
  confidenceThreshold?: number
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

  // Uncertain predictions
  if (prediction === 'Uncertain') {
    return {
      level: 'moderate',
      label: 'Uncertain',
      description: 'Confidence below threshold - result may be unreliable'
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

  let overallLevel: RiskLevel = 'low'
  if (virusCount > 0 || novelCount > 0) {
    const riskRatio = (virusCount + novelCount) / total
    if (riskRatio > 0.5 || novelCount > 0) {
      overallLevel = 'high'
    } else {
      overallLevel = 'moderate'
    }
  }

  const styles = {
    low: {
      bg: 'bg-emerald-50 border-emerald-200',
      text: 'text-emerald-700',
      icon: ShieldCheck,
    },
    moderate: {
      bg: 'bg-blue-50 border-blue-200',
      text: 'text-blue-700',
      icon: AlertTriangle,
    },
    high: {
      bg: 'bg-rose-50 border-rose-200',
      text: 'text-rose-700',
      icon: ShieldAlert,
    },
  }

  const style = styles[overallLevel]
  const Icon = style.icon

  const getMessage = () => {
    if (overallLevel === 'high') return `${virusCount + novelCount} detected`
    if (overallLevel === 'moderate') return `${virusCount} viral`
    return 'No threats'
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-card border px-2 py-1 text-xs font-medium',
        style.bg, style.text
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="font-semibold capitalize">{overallLevel === 'low' ? 'Safe' : overallLevel}</span>
      <span className="text-slate-400">·</span>
      <span>{getMessage()}</span>
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
    border: string; 
    text: string; 
    iconBg: string;
    iconColor: string;
  }> = {
    rose: {
      border: 'border-l-rose-500',
      text: 'text-rose-600',
      iconBg: 'bg-rose-100',
      iconColor: 'text-rose-600',
    },
    emerald: {
      border: 'border-l-emerald-500',
      text: 'text-emerald-600',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
    },
    amber: {
      border: 'border-l-amber-500',
      text: 'text-amber-600',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
    },
    slate: {
      border: 'border-l-slate-500',
      text: 'text-slate-600',
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-600',
    },
    blue: {
      border: 'border-l-blue-500',
      text: 'text-blue-600',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
  }

  const styles = tone ? toneMap[tone] : toneMap.slate

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-card border border-slate-200 bg-card p-4 shadow-card transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5',
        styles.border
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {label}
          </p>
          <p className={cn('mt-1 text-2xl tabular-nums font-bold', styles.text)}>{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
        </div>
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-lg',
            styles.iconBg
          )}
        >
          <Icon className={cn('h-6 w-6', styles.iconColor)} />
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
  Uncertain: {
    light: 'bg-slate-200 text-slate-600 border-slate-400',
    dark: 'dark:bg-slate-600/50 dark:text-slate-300 dark:border-slate-500',
    dot: 'bg-slate-500',
  },
}

function ConfidenceBar({ confidence }: { confidence: number }) {
  const pct = confidence * 100
  const getColor = (conf: number) => {
    if (conf >= 0.75) return { bg: 'bg-emerald-500', text: 'text-emerald-600' }
    if (conf >= 0.60) return { bg: 'bg-blue-500', text: 'text-blue-600' }
    return { bg: 'bg-rose-500', text: 'text-rose-600' }
  }
  const color = getColor(confidence)

  return (
    <div className="flex items-center gap-2">
      <div className="relative h-6 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300',
            color.bg
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={cn(
        'w-12 text-right text-xs font-bold tabular-nums',
        color.text
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

function ExplanationPanel({ row, risk }: { row: SequenceResult; risk: { level: RiskLevel; label: string; description: string } }) {
  // Calculate probabilities (using confidence as base)
  const virusProb = row.prediction === 'Virus' ? row.confidence : (1 - row.confidence)
  const hostProb = row.prediction === 'Host' ? row.confidence : (1 - row.confidence)
  const oodScore = row.ood_score ?? (1 - row.confidence)
  
  // Simulated feature importance (in real app, this would come from the model)
  const topFeatures = [
    { name: 'GC Content Pattern', importance: 0.28, direction: row.gc_content > 0.5 ? 'host' : 'virus' },
    { name: 'K-mer Frequency (AT-rich)', importance: 0.22, direction: row.gc_content < 0.45 ? 'virus' : 'host' },
    { name: 'Sequence Length', importance: 0.18, direction: row.length > 200 ? 'host' : 'neutral' },
    { name: 'Dinucleotide Bias', importance: 0.15, direction: 'neutral' },
    { name: 'Codon Usage Bias', importance: 0.12, direction: 'host' },
  ]

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
          <Brain className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            Analysis for: <span className="text-indigo-600 dark:text-indigo-400">{row.sequence_id}</span>
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {row.organism_name || 'Unknown organism'} • {row.prediction} • {(row.confidence * 100).toFixed(1)}% confidence
          </p>
          {row.prediction === 'Uncertain' && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              ⚠️ Confidence below threshold — result unreliable
            </p>
          )}
        </div>
        <div className="ml-auto flex-shrink-0">
          <RiskBadge level={risk.level} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Probabilities */}
        <div className="space-y-4">
          {/* Probability Distribution */}
          <div className={cn(
            'rounded-xl border p-4',
            'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
          )}>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-4 w-4 text-indigo-500" />
              <h5 className="text-sm font-semibold text-slate-900 dark:text-white">
                Probability Distribution
              </h5>
            </div>
            
            {/* Virus Probability */}
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 dark:text-slate-400">Virus</span>
                <span className={cn(
                  'font-bold tabular-nums',
                  virusProb > 0.5 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'
                )}>
                  {(virusProb * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-rose-400 to-rose-600 rounded-full transition-all duration-500"
                  style={{ width: `${virusProb * 100}%` }}
                />
              </div>
            </div>

            {/* Host Probability */}
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 dark:text-slate-400">Host</span>
                <span className={cn(
                  'font-bold tabular-nums',
                  hostProb > 0.5 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'
                )}>
                  {(hostProb * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: `${hostProb * 100}%` }}
                />
              </div>
            </div>

            {/* OOD Score */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Out-of-Distribution Score
                </span>
                <span className={cn(
                  'font-bold tabular-nums',
                  oodScore > 0.7 ? 'text-rose-600 dark:text-rose-400' :
                  oodScore > 0.4 ? 'text-amber-600 dark:text-amber-400' :
                  'text-emerald-600 dark:text-emerald-400'
                )}>
                  {(oodScore * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    oodScore > 0.7 ? 'bg-rose-500' :
                    oodScore > 0.4 ? 'bg-amber-500' :
                    'bg-emerald-500'
                  )}
                  style={{ width: `${oodScore * 100}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                {oodScore > 0.7 ? 'High novelty - may require validation' :
                 oodScore > 0.4 ? 'Moderate novelty detected' :
                 'Within known distribution'}
              </p>
            </div>
          </div>

          {/* Model Confidence Breakdown */}
          <div className={cn(
            'rounded-xl border p-4',
            'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
          )}>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-amber-500" />
              <h5 className="text-sm font-semibold text-slate-900 dark:text-white">
                Confidence Breakdown
              </h5>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Model Certainty</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {(row.confidence * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Mahalanobis Distance</span>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {row.mahalanobis_distance?.toFixed(3) ?? 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Energy Score</span>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {row.energy_score?.toFixed(3) ?? 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Feature Importance */}
        <div className="space-y-4">
          {/* Feature Importance */}
          <div className={cn(
            'rounded-xl border p-4',
            'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
          )}>
            <div className="flex items-center gap-2 mb-4">
              <Layers className="h-4 w-4 text-purple-500" />
              <h5 className="text-sm font-semibold text-slate-900 dark:text-white">
                Feature Importance
              </h5>
            </div>
            
            <div className="space-y-3">
              {topFeatures.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600 dark:text-slate-400">{feature.name}</span>
                      <span className="font-medium text-slate-500 dark:text-slate-300">
                        {(feature.importance * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          'h-full rounded-full transition-all duration-300',
                          feature.direction === 'virus' ? 'bg-rose-400' :
                          feature.direction === 'host' ? 'bg-emerald-400' :
                          'bg-slate-400'
                        )}
                        style={{ width: `${feature.importance * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs',
                    feature.direction === 'virus' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400' :
                    feature.direction === 'host' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400' :
                    'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                  )}>
                    {feature.direction === 'virus' ? 'V' : feature.direction === 'host' ? 'H' : '–'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Decision Path */}
          <div className={cn(
            'rounded-xl border p-4',
            'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
          )}>
            <div className="flex items-center gap-2 mb-3">
              <ChevronRight className="h-4 w-4 text-blue-500" />
              <h5 className="text-sm font-semibold text-slate-900 dark:text-white">
                Decision Path
              </h5>
            </div>
            
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">1</div>
                <div>
                  <p className="text-slate-700 dark:text-slate-300">K-mer tokenization (6-mers)</p>
                  <p className="text-slate-400 dark:text-slate-500">{row.length} bp → {row.length - 5} features</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">2</div>
                <div>
                  <p className="text-slate-700 dark:text-slate-300">TF-IDF Vectorization</p>
                  <p className="text-slate-400 dark:text-slate-500">1093-dim feature space</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">3</div>
                <div>
                  <p className="text-slate-700 dark:text-slate-300">RandomForest Classification</p>
                  <p className="text-slate-400 dark:text-slate-500">100 decision trees → {row.prediction}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom - Explanation & Sequence Preview */}
      <div className={cn(
        'rounded-xl border p-4',
        'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
      )}>
        <div className="flex items-center gap-2 mb-2">
          <Info className="h-4 w-4 text-blue-500" />
          <h5 className="text-sm font-semibold text-slate-900 dark:text-white">
            Classification Summary
          </h5>
        </div>
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 mb-3">
          {row.explanation}
        </p>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            <strong>Risk:</strong> {risk.description}
          </span>
        </div>
        
        <div className="mt-4 rounded-lg bg-slate-100 dark:bg-slate-900 p-3">
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-2 font-mono">Sequence preview:</p>
          <p className="font-dna text-xs text-slate-600 dark:text-slate-300 break-all leading-relaxed">
            {row.sequence_preview}
          </p>
        </div>
      </div>
    </div>
  )
}

function DownloadReportButton({ results }: { results: ClassificationResponse }) {
  const [isOpen, setIsOpen] = useState(false)

  const downloadJSON = () => {
    const report = {
      metadata: {
        generated_at: new Date().toISOString(),
        model_version: 'baio-v1.2',
        model_type: 'RandomForest',
        training_data: 'Virus-Host 2024 Dataset',
      },
      summary: {
        total_sequences: results.total_sequences,
        virus_count: results.virus_count,
        host_count: results.host_count,
        novel_count: results.novel_count,
        processing_time_seconds: results.processing_time,
        source: results.source,
      },
      detailed_results: results.detailed_results.map(r => ({
        sequence_id: r.sequence_id,
        prediction: r.prediction,
        confidence: r.confidence,
        organism_name: r.organism_name,
        gc_content: r.gc_content,
        length: r.length,
        ood_score: r.ood_score,
        explanation: r.explanation,
      })),
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `baio-report-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    setIsOpen(false)
  }

  const downloadCSV = () => {
    const headers = [
      'Sequence ID',
      'Organism',
      'Prediction',
      'Confidence',
      'GC Content',
      'Length',
      'OOD Score',
      'Risk Level',
    ]

    const rows = results.detailed_results.map(r => {
      const risk = calculateRiskLevel(r.prediction, r.confidence, r.ood_score)
      return [
        r.sequence_id,
        r.organism_name || 'Unknown',
        r.prediction,
        (r.confidence * 100).toFixed(1) + '%',
        (r.gc_content * 100).toFixed(1) + '%',
        r.length,
        r.ood_score?.toFixed(3) || 'N/A',
        risk.level.toUpperCase(),
      ].map(v => `"${v}"`).join(',')
    })

    const summaryRows = [
      '',
      '# Summary',
      `# Total Sequences,${results.total_sequences}`,
      `# Virus Count,${results.virus_count}`,
      `# Host Count,${results.host_count}`,
      `# Novel Count,${results.novel_count}`,
      `# Processing Time,${results.processing_time.toFixed(2)}s`,
      `# Generated At,${new Date().toISOString()}`,
      `# Model Version,baio-v1.2`,
      '',
    ]

    const csv = [...summaryRows, headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `baio-report-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setIsOpen(false)
  }

  const downloadPDF = () => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    let y = 20

    // Title
    doc.setFontSize(20)
    doc.setTextColor(34, 197, 94) // emerald-500
    doc.text('BAIO Classification Report', pageWidth / 2, y, { align: 'center' })
    y += 15

    // Metadata
    doc.setFontSize(10)
    doc.setTextColor(100, 116, 139) // slate-500
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, y)
    doc.text(`Model: baio-v1.2 (RandomForest)`, 20, y + 6)
    doc.text(`Training Data: Virus-Host 2024 Dataset`, 20, y + 12)
    doc.text(`Source: ${results.source}`, 20, y + 18)
    y += 30

    // Summary Section
    doc.setFontSize(14)
    doc.setTextColor(15, 23, 42) // slate-900
    doc.text('Summary', 20, y)
    y += 10

    // Summary box
    doc.setDrawColor(226, 232, 240) // slate-200
    doc.setFillColor(248, 250, 252) // slate-50
    doc.roundedRect(20, y, pageWidth - 40, 35, 3, 3, 'FD')
    
    doc.setFontSize(11)
    doc.setTextColor(51, 65, 85) // slate-700
    const summaryY = y + 10
    doc.text(`Total Sequences: ${results.total_sequences}`, 30, summaryY)
    doc.text(`Virus Detected: ${results.virus_count}`, 30, summaryY + 8)
    doc.text(`Host Sequences: ${results.host_count}`, pageWidth / 2 + 10, summaryY)
    doc.text(`Novel/Unknown: ${results.novel_count}`, pageWidth / 2 + 10, summaryY + 8)
    doc.text(`Processing Time: ${results.processing_time.toFixed(2)}s`, pageWidth - 70, summaryY + 8)
    y += 45

    // Detailed Results Header
    doc.setFontSize(14)
    doc.setTextColor(15, 23, 42)
    doc.text('Detailed Results', 20, y)
    y += 10

    // Table Header
    doc.setFillColor(241, 245, 249) // slate-100
    doc.rect(20, y, pageWidth - 40, 8, 'F')
    doc.setFontSize(9)
    doc.setTextColor(71, 85, 105) // slate-600
    doc.text('Sequence ID', 25, y + 5)
    doc.text('Prediction', 75, y + 5)
    doc.text('Confidence', 110, y + 5)
    doc.text('GC%', 145, y + 5)
    doc.text('Length', 165, y + 5)
    y += 12

    // Table Rows
    doc.setFontSize(8)
    results.detailed_results.forEach((r, index) => {
      // Check if we need a new page
      if (y > 270) {
        doc.addPage()
        y = 20
        // Repeat header on new page
        doc.setFillColor(241, 245, 249)
        doc.rect(20, y, pageWidth - 40, 8, 'F')
        doc.setFontSize(9)
        doc.setTextColor(71, 85, 105)
        doc.text('Sequence ID', 25, y + 5)
        doc.text('Prediction', 75, y + 5)
        doc.text('Confidence', 110, y + 5)
        doc.text('GC%', 145, y + 5)
        doc.text('Length', 165, y + 5)
        y += 12
      }

      const risk = calculateRiskLevel(r.prediction, r.confidence, r.ood_score)
      
      // Row background (alternating)
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252) // slate-50
        doc.rect(20, y - 3, pageWidth - 40, 8, 'F')
      }

      // Risk indicator color
      if (risk.level === 'high') {
        doc.setTextColor(225, 29, 72) // rose-600
      } else if (risk.level === 'moderate') {
        doc.setTextColor(217, 119, 6) // amber-600
      } else {
        doc.setTextColor(22, 163, 74) // emerald-600
      }

      doc.setTextColor(51, 65, 85) // slate-700
      const seqId = r.sequence_id.length > 25 ? r.sequence_id.slice(0, 25) + '...' : r.sequence_id
      doc.text(seqId, 25, y)
      
      // Prediction with color
      if (r.prediction === 'Virus') {
        doc.setTextColor(225, 29, 72) // rose-600
      } else if (r.prediction === 'Host') {
        doc.setTextColor(22, 163, 74) // emerald-600
      } else {
        doc.setTextColor(245, 158, 11) // amber-500
      }
      doc.text(r.prediction, 75, y)
      
      doc.setTextColor(51, 65, 85)
      doc.text(`${(r.confidence * 100).toFixed(1)}%`, 110, y)
      doc.text(`${(r.gc_content * 100).toFixed(1)}%`, 145, y)
      doc.text(`${r.length} bp`, 165, y)
      
      y += 8
    })

    // Footer
    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(148, 163, 184) // slate-400
      doc.text(
        `Page ${i} of ${totalPages} | BAIO Classification Report | Generated: ${new Date().toLocaleDateString()}`,
        pageWidth / 2,
        285,
        { align: 'center' }
      )
    }

    doc.save(`baio-report-${Date.now()}.pdf`)
    setIsOpen(false)
  }

  const downloadText = () => {
    const report = `
BAIO Classification Report
==========================
Generated: ${new Date().toLocaleString()}
Model: baio-v1.2 (RandomForest)
Training Data: Virus-Host 2024 Dataset

SUMMARY
-------
Total Sequences: ${results.total_sequences}
Virus Detected: ${results.virus_count}
Host Sequences: ${results.host_count}
Novel/Unknown: ${results.novel_count}
Processing Time: ${results.processing_time.toFixed(2)}s

DETAILED RESULTS
----------------
${results.detailed_results.map(r => {
  const risk = calculateRiskLevel(r.prediction, r.confidence, r.ood_score)
  return `
ID: ${r.sequence_id}
   Organism: ${r.organism_name || 'Unknown'}
   Prediction: ${r.prediction} (Risk: ${risk.label})
   Confidence: ${(r.confidence * 100).toFixed(1)}%
   GC Content: ${(r.gc_content * 100).toFixed(1)}%
   Length: ${r.length} bp
`.trim()
}).join('\n\n')}
    `.trim()

    const blob = new Blob([report], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `baio-report-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition',
          'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
          'dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50'
        )}
      >
        <Download className="h-4 w-4" />
        Download Report
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className={cn(
            'absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border shadow-xl overflow-hidden',
            'border-slate-200 bg-white',
            'dark:border-slate-700 dark:bg-slate-800'
          )}>
            <button
              onClick={downloadJSON}
              className={cn(
                'flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition',
                'hover:bg-slate-50 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'
              )}
            >
              <FileJson className="h-4 w-4 text-blue-500" />
              JSON Format
            </button>
            <button
              onClick={downloadCSV}
              className={cn(
                'flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition',
                'hover:bg-slate-50 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'
              )}
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
              CSV Format
            </button>
            <button
              onClick={downloadPDF}
              className={cn(
                'flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition',
                'hover:bg-slate-50 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'
              )}
            >
              <FileDown className="h-4 w-4 text-rose-500" />
              PDF Format
            </button>
            <button
              onClick={downloadText}
              className={cn(
                'flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition',
                'hover:bg-slate-50 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'
              )}
            >
              <FileText className="h-4 w-4 text-slate-500" />
              Text Format
            </button>
          </div>
        </>
      )}
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {isLoading ? (
              <>
                <div className="h-20 animate-pulse rounded-card bg-slate-100" />
                <div className="h-20 animate-pulse rounded-card bg-slate-100" />
                <div className="h-20 animate-pulse rounded-card bg-slate-100" />
                <div className="h-20 animate-pulse rounded-card bg-slate-100" />
                <div className="h-20 animate-pulse rounded-card bg-slate-100" />
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
                <MetricCard
                  label="Uncertain"
                  value={results?.uncertain_count ?? 0}
                  icon={AlertTriangle}
                  tone="slate"
                  hint="Below confidence threshold"
                />
              </>
            )}
          </div>
        )}

        {results && (
          <div className="space-y-2">
            <div className={cn(
              'flex flex-wrap items-center gap-2 rounded-card border px-3 py-2 text-xs',
              'border-slate-200 bg-white'
            )}>
              <div className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2 py-1 font-medium',
                'border-slate-200 bg-slate-50 text-slate-600'
              )}>
                <Shield className="h-3 w-3 text-emerald-500" />
                {parsedCount} sequences
              </div>
              <OverallRiskBanner results={results} />
              <div className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2 py-1 font-medium',
                'border-slate-200 bg-slate-50 text-slate-600'
              )}>
                <Clock className="h-3 w-3 text-blue-500" />
                {results.processing_time.toFixed(2)}s
              </div>
              <div className="flex-1" />
              <span className="text-[10px] text-slate-400">
                {results.source}
              </span>
              <DownloadReportButton results={results} />
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
                  results?.detailed_results.map((row, idx) => {
                    const styles = statusStyles[row.prediction] || statusStyles.Host
                    const risk = calculateRiskLevel(row.prediction, row.confidence, row.ood_score)
                    const isExpanded = expandedRow === row.sequence_id
                    const isEven = idx % 2 === 0
                    return (
                      <Fragment key={row.sequence_id}>
                        <tr
                          className={cn(
                            'cursor-pointer transition-all',
                            isEven ? 'bg-white' : 'bg-slate-50/50',
                            'hover:bg-blue-50/50',
                            isExpanded && 'bg-blue-50'
                          )}
                          onClick={() =>
                            setExpandedRow(
                              isExpanded ? null : row.sequence_id
                            )
                          }
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <ChevronRight className={cn(
                                'h-4 w-4 text-slate-400 transition-transform duration-200',
                                isExpanded && 'rotate-90 text-blue-500'
                              )} />
                              <span className={cn(
                                'font-medium text-sm',
                                'text-slate-900',
                                isExpanded && 'text-blue-700'
                              )}>
                                {row.sequence_id.length > 25 
                                  ? `${row.sequence_id.slice(0, 25)}...` 
                                  : row.sequence_id}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-slate-600">
                              {row.organism_name || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
                                styles.light,
                                styles.dark
                              )}
                            >
                              <span className={cn('h-2 w-2 rounded-full', styles.dot)} />
                              {row.prediction}
                            </span>
                            {row.prediction === 'Uncertain' && (
                              <p className="mt-1 text-[10px] text-amber-600 dark:text-amber-400">
                                Confidence below threshold — result unreliable
                              </p>
                            )}
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
      )}
    </div>
  )
}

export default ResultsDashboard
