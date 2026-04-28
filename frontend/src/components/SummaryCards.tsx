import { Clock, Shield, Dna, Bug, User, HelpCircle, AlertTriangle, ShieldCheck, ShieldAlert, Download, FileJson, FileSpreadsheet, FileText, FileDown } from 'lucide-react'
import type { ClassificationResponse, FilterStatus } from '../types'
import { cn } from '../lib/utils'
import { useState } from 'react'
import { jsPDF } from 'jspdf'

type ResultsDashboardProps = {
  results: ClassificationResponse | null
  isLoading: boolean
  parsedCount: number
  confidenceThreshold?: number
  filterStatus: FilterStatus
  onFilterChange: (status: FilterStatus) => void
}

type RiskLevel = 'low' | 'moderate' | 'high'

function calculateRiskLevel(
  prediction: string,
  confidence: number,
  oodScore?: number
): { level: RiskLevel; label: string; description: string } {
  if (prediction === 'Invalid') return { level: 'moderate', label: 'Invalid Data', description: 'Input data is not valid DNA sequence' }
  if (prediction === 'Host') return { level: 'low', label: 'Low Risk', description: 'Host organism - no pathogenic concern' }
  if (prediction === 'Uncertain') return { level: 'moderate', label: 'Uncertain', description: 'Confidence below threshold - result may be unreliable' }
  if (prediction === 'Novel' || (oodScore && oodScore > 0.7)) return { level: 'high', label: 'High Risk', description: 'Novel or unknown sequence - requires investigation' }
  if (prediction === 'Virus') {
    if (confidence >= 0.7) return { level: 'high', label: 'High Risk', description: 'High-confidence viral detection - immediate attention recommended' }
    if (confidence >= 0.4) return { level: 'moderate', label: 'Moderate Risk', description: 'Moderate-confidence viral detection - further analysis suggested' }
    return { level: 'low', label: 'Low Risk', description: 'Low-confidence viral prediction - may be false positive' }
  }
  return { level: 'low', label: 'Low Risk', description: 'Classification complete' }
}

function OverallRiskBanner({ results }: { results: ClassificationResponse }) {
  if (!results) return null
  const { virus_count, novel_count, total_sequences } = results
  let overallLevel: RiskLevel = 'low'
  if (virus_count > 0 || novel_count > 0) {
    overallLevel = ((virus_count + novel_count) / total_sequences > 0.5 || novel_count > 0) ? 'high' : 'moderate'
  }
  const styles = {
    low:      { bg: 'bg-emerald-600', text: 'text-white', icon: ShieldCheck },
    moderate: { bg: 'bg-amber-500',   text: 'text-white', icon: AlertTriangle },
    high:     { bg: 'bg-rose-600',    text: 'text-white', icon: ShieldAlert },
  }
  const { bg, text, icon: Icon } = styles[overallLevel]
  const msg = overallLevel === 'high' ? `${virus_count + novel_count} detected` : overallLevel === 'moderate' ? `${virus_count} viral` : 'All clear'
  return (
    <span className={cn('inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-semibold', bg, text)}>
      <Icon className="h-3 w-3" />
      {overallLevel === 'low' ? 'Safe' : overallLevel.charAt(0).toUpperCase() + overallLevel.slice(1)}
      <span className="opacity-60">·</span>
      {msg}
    </span>
  )
}

function StatPill({
  label, value, icon: Icon, color, onClick, isActive,
}: {
  label: string
  value: number | string
  icon: React.ElementType
  color: string
  onClick?: () => void
  isActive?: boolean
}) {
  if (value === 0) return null
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 rounded border px-2 py-1 transition-all duration-150',
        color,
        onClick ? 'cursor-pointer hover:opacity-90 hover:scale-105' : 'cursor-default',
        isActive && 'ring-2 ring-offset-1 ring-current scale-105 shadow-sm',
      )}
    >
      <Icon className="h-3 w-3 shrink-0" />
      <span className="text-xs font-bold tabular-nums">{value}</span>
      <span className="text-xs opacity-70">{label}</span>
    </button>
  )
}

function DownloadReportButton({ results }: { results: ClassificationResponse }) {
  const [isOpen, setIsOpen] = useState(false)

  const downloadJSON = () => {
    const report = {
      metadata: { generated_at: new Date().toISOString(), model_version: 'baio-v1.2', model_type: 'RandomForest', training_data: 'Virus-Host 2024 Dataset' },
      summary: { total_sequences: results.total_sequences, virus_count: results.virus_count, host_count: results.host_count, novel_count: results.novel_count, processing_time_seconds: results.processing_time, source: results.source },
      detailed_results: results.detailed_results.map(r => ({ sequence_id: r.sequence_id, prediction: r.prediction, confidence: r.confidence, organism_name: r.organism_name, gc_content: r.gc_content, length: r.length, ood_score: r.ood_score, explanation: r.explanation })),
    }
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `baio-report-${Date.now()}.json`; a.click()
    URL.revokeObjectURL(url); setIsOpen(false)
  }

  const downloadCSV = () => {
    const headers = ['Sequence ID', 'Organism', 'Prediction', 'Confidence', 'GC Content', 'Length', 'OOD Score', 'Risk Level']
    const rows = results.detailed_results.map(r => {
      const risk = calculateRiskLevel(r.prediction, r.confidence, r.ood_score)
      return [r.sequence_id, r.organism_name || 'Unknown', r.prediction, (r.confidence * 100).toFixed(1) + '%', (r.gc_content * 100).toFixed(1) + '%', r.length, r.ood_score?.toFixed(3) || 'N/A', risk.level.toUpperCase()].map(v => `"${v}"`).join(',')
    })
    const summaryRows = ['', '# Summary', `# Total Sequences,${results.total_sequences}`, `# Virus Count,${results.virus_count}`, `# Host Count,${results.host_count}`, `# Novel Count,${results.novel_count}`, `# Processing Time,${results.processing_time.toFixed(2)}s`, `# Generated At,${new Date().toISOString()}`, `# Model Version,baio-v1.2`, '']
    const csv = [...summaryRows, headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `baio-report-${Date.now()}.csv`; a.click()
    URL.revokeObjectURL(url); setIsOpen(false)
  }

  const downloadPDF = () => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    let y = 20
    doc.setFontSize(20); doc.setTextColor(34, 197, 94)
    doc.text('BAIO Classification Report', pageWidth / 2, y, { align: 'center' }); y += 15
    doc.setFontSize(10); doc.setTextColor(100, 116, 139)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, y)
    doc.text(`Model: baio-v1.2 (RandomForest)`, 20, y + 6)
    doc.text(`Source: ${results.source}`, 20, y + 12); y += 30
    doc.setFontSize(14); doc.setTextColor(15, 23, 42); doc.text('Summary', 20, y); y += 10
    doc.setDrawColor(226, 232, 240); doc.setFillColor(248, 250, 252)
    doc.roundedRect(20, y, pageWidth - 40, 35, 3, 3, 'FD')
    doc.setFontSize(11); doc.setTextColor(51, 65, 85)
    doc.text(`Total: ${results.total_sequences}`, 30, y + 10)
    doc.text(`Virus: ${results.virus_count}`, 30, y + 18)
    doc.text(`Host: ${results.host_count}`, pageWidth / 2, y + 10)
    doc.text(`Novel: ${results.novel_count}`, pageWidth / 2, y + 18)
    doc.text(`Time: ${results.processing_time.toFixed(2)}s`, pageWidth - 70, y + 18); y += 45
    doc.setFontSize(14); doc.setTextColor(15, 23, 42); doc.text('Detailed Results', 20, y); y += 10
    doc.setFillColor(241, 245, 249); doc.rect(20, y, pageWidth - 40, 8, 'F')
    doc.setFontSize(9); doc.setTextColor(71, 85, 105)
    doc.text('Sequence ID', 25, y + 5); doc.text('Prediction', 75, y + 5); doc.text('Confidence', 110, y + 5); doc.text('GC%', 145, y + 5); doc.text('Length', 165, y + 5); y += 12
    doc.setFontSize(8)
    results.detailed_results.forEach((r, index) => {
      if (y > 270) { doc.addPage(); y = 20 }
      if (index % 2 === 0) { doc.setFillColor(248, 250, 252); doc.rect(20, y - 3, pageWidth - 40, 8, 'F') }
      doc.setTextColor(51, 65, 85)
      const seqId = r.sequence_id.length > 25 ? r.sequence_id.slice(0, 25) + '...' : r.sequence_id
      doc.text(seqId, 25, y)
      if (r.prediction === 'Virus') doc.setTextColor(225, 29, 72)
      else if (r.prediction === 'Host') doc.setTextColor(22, 163, 74)
      else doc.setTextColor(245, 158, 11)
      doc.text(r.prediction, 75, y)
      doc.setTextColor(51, 65, 85)
      doc.text(`${(r.confidence * 100).toFixed(1)}%`, 110, y)
      doc.text(`${(r.gc_content * 100).toFixed(1)}%`, 145, y)
      doc.text(`${r.length} bp`, 165, y); y += 8
    })
    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i); doc.setFontSize(8); doc.setTextColor(148, 163, 184)
      doc.text(`Page ${i} of ${totalPages} | BAIO | ${new Date().toLocaleDateString()}`, pageWidth / 2, 285, { align: 'center' })
    }
    doc.save(`baio-report-${Date.now()}.pdf`); setIsOpen(false)
  }

  const downloadText = () => {
    const report = `BAIO Classification Report\n==========================\nGenerated: ${new Date().toLocaleString()}\nModel: baio-v1.2\n\nSUMMARY\n-------\nTotal: ${results.total_sequences}\nVirus: ${results.virus_count}  Host: ${results.host_count}  Novel: ${results.novel_count}\nTime: ${results.processing_time.toFixed(2)}s\n\nDETAILED RESULTS\n----------------\n${results.detailed_results.map(r => { const risk = calculateRiskLevel(r.prediction, r.confidence, r.ood_score); return `${r.sequence_id}\n  ${r.prediction} | ${(r.confidence * 100).toFixed(1)}% | GC ${(r.gc_content * 100).toFixed(1)}% | ${r.length}bp | ${risk.label}` }).join('\n')}`
    const blob = new Blob([report], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `baio-report-${Date.now()}.txt`; a.click()
    URL.revokeObjectURL(url); setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-1 rounded border px-2 py-1 text-xs font-semibold transition',
          'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
          'dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50'
        )}
      >
        <Download className="h-3 w-3" />
        Export
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className={cn(
            'absolute right-0 top-full z-50 mt-1 w-36 overflow-hidden rounded-lg border shadow-lg',
            'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
          )}>
            {[
              { label: 'JSON', icon: FileJson, color: 'text-blue-500', action: downloadJSON },
              { label: 'CSV',  icon: FileSpreadsheet, color: 'text-emerald-500', action: downloadCSV },
              { label: 'PDF',  icon: FileDown, color: 'text-rose-500', action: downloadPDF },
              { label: 'Text', icon: FileText, color: 'text-slate-500', action: downloadText },
            ].map(({ label, icon: Icon, color, action }) => (
              <button
                key={label}
                onClick={action}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition hover:bg-slate-50 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <Icon className={cn('h-3.5 w-3.5', color)} />
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function SummaryCards({ results, isLoading, parsedCount, filterStatus, onFilterChange }: ResultsDashboardProps) {
  const toggle = (next: FilterStatus) =>
    onFilterChange(filterStatus === next ? 'ALL' : next)

  return (
    <section className={cn(
      'border-b bg-white px-8 py-3',
      'border-[#E5E7EB] dark:border-slate-800 dark:bg-slate-900'
    )}>
      {!results && !isLoading && (
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {parsedCount
            ? `${parsedCount} sequences loaded — run classification to see results.`
            : 'Open the sidebar and paste FASTA sequences to get started.'}
        </p>
      )}

      {isLoading && (
        <div className="flex items-center gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-7 w-28 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      )}

      {results && !isLoading && (
        <div className="flex flex-wrap items-center gap-3">
          {/* Stat pills — Total resets, others toggle filter */}
          <StatPill label="Total"     value={results.total_sequences}       icon={Dna}           color="border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"                       onClick={() => onFilterChange('ALL')}       isActive={filterStatus === 'ALL'} />
          <StatPill label="Virus"     value={results.virus_count}           icon={Bug}           color="border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-300"                        onClick={() => toggle('Virus')}             isActive={filterStatus === 'Virus'} />
          <StatPill label="Host"      value={results.host_count}            icon={User}          color="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"      onClick={() => toggle('Host')}              isActive={filterStatus === 'Host'} />
          <StatPill label="Novel"     value={results.novel_count}           icon={HelpCircle}    color="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300"                  onClick={() => toggle('Novel')}             isActive={filterStatus === 'Novel'} />
          <StatPill label="Uncertain" value={results.uncertain_count ?? 0}  icon={AlertTriangle} color="border-amber-100 bg-amber-50 text-amber-600 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-400"              onClick={() => toggle('Uncertain')}         isActive={filterStatus === 'Uncertain'} />

          <span className="h-5 w-px bg-slate-200 dark:bg-slate-700" />

          <OverallRiskBanner results={results} />

          <span className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
            <Clock className="h-3 w-3" />
            {results.processing_time.toFixed(2)}s
          </span>

          <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            <Shield className="h-3 w-3" />
            {parsedCount} seqs
          </span>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-xs text-slate-400 dark:text-slate-500 sm:inline">
              {results.source}
            </span>
            <DownloadReportButton results={results} />
          </div>
        </div>
      )}
    </section>
  )
}

export default SummaryCards
