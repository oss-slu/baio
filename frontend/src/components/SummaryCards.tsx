import { BarChart3, Clock, Shield, Sparkles, Dna, Bug, User, HelpCircle, AlertTriangle, ShieldCheck, ShieldAlert, Download, FileJson, FileSpreadsheet, FileText, FileDown } from 'lucide-react'
import type { ClassificationResponse } from '../types'
import { cn } from '../lib/utils'
import { useState} from 'react'
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
      bg: 'bg-emerald-50 border-emerald-50',
      text: 'text-emerald-700 font-custom2',
      icon: ShieldCheck,
    },
    moderate: {
      bg: 'bg-blue-50 border-blue-50',
      text: 'text-blue-700 font-custom2',
      icon: AlertTriangle,
    },
    high: {
      bg: 'bg-rose-50 border-rose-50',
      text: 'text-rose-700 font-custom2',
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
      iconBg: 'bg-rose-500 dark:bg-rose-900',
      iconColor: 'text-rose-600',
    },
    emerald: {
      border: 'border-l-emerald-500',
      text: 'text-emerald-600',
      iconBg: 'bg-emerald-500 dark:bg-emerald-900',
      iconColor: 'text-emerald-600',
    },
    amber: {
      border: 'border-l-amber-500',
      text: 'text-amber-600',
      iconBg: 'bg-amber-500 dark:bg-amber-900',
      iconColor: 'text-amber-600',
    },
    slate: {
      border: 'border-l-slate-500',
      text: 'text-slate-600',
      iconBg: 'bg-slate-500 dark:bg-slate-800',
      iconColor: 'text-slate-600',
    },
    blue: {
      border: 'border-l-blue-500',
      text: 'text-blue-600',
      iconBg: 'bg-blue-500 dark:bg-blue-900',
      iconColor: 'text-blue-600',
    },
  }

  const styles = tone ? toneMap[tone] : toneMap.slate

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-card  border-slate-200 bg-card p-4  transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5',
        styles.border, styles.iconBg
      )}
    >
      <div className="flex lg:flex-col justify-between gap-3">
        <div className="flex lg:flex-row justify-center gap-6">
          <p className={cn(
            'h-4 w-2  text-white', )}
          >
          <Icon className={cn('h-6 w-6')} />
          </p>

          <p className="text-lg font-normal font-custom3 tracking-wider text-white">
            {label}
          </p>
          
          
        </div>


        <div className="items-end gap-2 text-center">
          <p className={'mt-1 text-2xl font-custom3 tabular-nums font-bold text-white'}>{value}</p>
          {hint && <p className="mt-1 text-xs font-custom2 text-white">{hint}</p>}
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
          'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium font-custom2 transition',
          'border-emerald-50 bg-emerald-50 text-emerald-800 hover:bg-emerald-100',
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

function SummaryCards({ results, isLoading, parsedCount }: ResultsDashboardProps) {

  return (
    <section className={cn(
      'top-autoborder-b p-5 h-80 bg-white transition-colors',
    )}>
      <div className="flexspace-y-6 flex flex-col">
        <section className="flex justify-center">
          <div className="flex h-10 w-rounded-xl text-slate-950 dark:text-white ">
            <BarChart3 className="h-8 w-8" />
          </div>
          <div className="mb-2  flex-column text-3xl text-center font-custom3 items-center gap-3">
            Classification Summary
          </div>
        </section>

        {/* Summary Cards - Full Width */}
        
        <section className={cn(
          'rounded-2xl  p-2s',
          'dark:border-white dark:bg-slate-950'
        )}>

          {!results && !isLoading && (
            <div className={cn(
              'flex flex-col items-center justify-center rounded-xl border-dashed text-center',
              'border-slate-950',
            )}>
              <Sparkles className="h-12 w-12 text-slate-950 dark:text-slate-600" />
              <p className={cn(
                'mt-4 text-2xl font-custom3 font-medium',
                'text-slate-950 dark:text-slate-300'
              )}>
                {parsedCount
                  ? 'Ready to Classify Sequences'
                  : 'No Sequences Loaded'}
              </p>
              <p className="mt-1 text-sm text-slate-950 font-custom2 dark:text-slate-500">
                {parsedCount
                  ? 'Click "Run Classification" in the sidebar to start'
                  : 'Open the sidebar to add FASTA sequences'}
              </p>
            </div>
          )}

          {(isLoading || results) && (
            <div className="grid gap-3 lg:grid-cols-5">
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
                'border-white bg-white'
              )}>
                <div className={cn(
                  'inline-flex items-center font-custom2 gap-1.5 rounded-lg border px-2 py-1 font-medium',
                  'border-slate-50 bg-slate-50 text-slate-950'
                )}>
                  <Shield className="h-3 w-3 text-slate-950'" />
                  {parsedCount} sequences
                </div>
                <OverallRiskBanner results={results} />
                <div className={cn(
                  'inline-flex items-center font-custom2 gap-1.5 rounded-full border px-2 py-1 font-custom2 font-medium',
                  'border-slate-50 bg-slate-50 text-slate-950'
                )}>
                  <Clock className="h-3 w-3 text-slate-950" />
                  {results.processing_time.toFixed(2)}s
                </div>
                <div className="flex-1" />
                <span className="text-[10px] text-slate-950 font-custom2">
                  {results.source}
                </span>
                <DownloadReportButton results={results} />
              </div>
            </div>
          )}
        </section>

      </div>
    </section>
  )
}

export default SummaryCards
