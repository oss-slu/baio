import { Info, AlertTriangle, ShieldCheck, ShieldAlert, Activity, Layers, Zap, Brain, ChevronRight, } from 'lucide-react'
import type { ClassificationResponse, SequenceResult } from '../types'
import { cn } from '../lib/utils'
import { useState, Fragment } from 'react'

type ResultsDashboardProps = {
  results: ClassificationResponse | null
  isLoading: boolean
  confidenceThreshold?: number
}

type RiskLevel = 'low' | 'moderate' | 'high'

function calculateRiskLevel(
  prediction: string,
  confidence: number,
  oodScore?: number
): { level: RiskLevel; label: string; description: string } {
  // Invalid sequences
  if (prediction === 'Invalid') {
    return {
      level: 'moderate',
      label: 'Invalid Data',
      description: 'Input data is not valid DNA sequence'
    }
  }

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
  Invalid: {
    light: 'bg-red-100 text-red-800 border-red-300',
    dark: 'dark:bg-red-900/50 dark:text-red-300 dark:border-red-700',
    dot: 'bg-red-500',
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
      <div className="h-6 flex-1 overflow-hidden rounded-full bg-slate-100">
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

function ResultsDashboard({ results, isLoading }: ResultsDashboardProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  return (
    
    <div className="space-y-6 z-0">

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
