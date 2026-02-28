import { useRef } from 'react'
import { ChevronDown, ChevronUp, FileUp, Sparkles } from 'lucide-react'
import { cn } from '../lib/utils'

type SequenceInputProps = {
  rawSequences: string
  onChange: (value: string) => void
  parsedCount: number
  onLoadSample: () => void
  isRunning: boolean
  isOpen: boolean
  onToggle: () => void
}

function SequenceInput({
  rawSequences,
  onChange,
  parsedCount,
  onLoadSample,
  isRunning,
  isOpen,
  onToggle,
}: SequenceInputProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFileUpload = async (file?: File) => {
    if (!file) return
    const text = await file.text()
    onChange(text)
  }

  const preview = rawSequences
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(' · ')

  return (
    <section className={cn(
      'rounded-2xl border p-4 shadow-lg transition-colors',
      'border-slate-200 bg-white',
      'dark:border-slate-700 dark:bg-slate-800'
    )}>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition',
          'border-slate-200 bg-slate-50 hover:border-emerald-300 hover:bg-white',
          'dark:border-slate-600 dark:bg-slate-700/50 dark:hover:border-emerald-600 dark:hover:bg-slate-700'
        )}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Input
          </p>
          <div className="flex items-center gap-3">
            <h2 className={cn(
              'text-lg font-semibold',
              'text-slate-900 dark:text-white'
            )}>
              Upload or paste FASTA
            </h2>
            <span className={cn(
              'rounded-full border px-3 py-1 text-xs font-semibold',
              'border-emerald-200 bg-emerald-100 text-emerald-700',
              'dark:border-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
            )}>
              {parsedCount} parsed
            </span>
          </div>
          {!isOpen && preview && (
            <p className="mt-1 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
              {preview.length > 120 ? `${preview.slice(0, 120)}…` : preview}
            </p>
          )}
        </div>
        <div className={cn(
          'flex h-10 w-10 items-center justify-center rounded-lg border',
          'border-slate-200 bg-slate-100 text-slate-600',
          'dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300'
        )}>
          {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </button>

      {isOpen && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Paste FASTA (headers become IDs, bases are upper-cased automatically).
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onLoadSample}
                className={cn(
                  'group inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition',
                  'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
                  'dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50'
                )}
                disabled={isRunning}
              >
                <Sparkles className="h-4 w-4" />
                Load sample
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition',
                  'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-600',
                  'dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:border-blue-600'
                )}
                disabled={isRunning}
              >
                <FileUp className="h-4 w-4" />
                Upload
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".fa,.fasta,.txt"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files?.[0])}
              />
            </div>
          </div>

          <textarea
            value={rawSequences}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`>NC_045512.2 SARS-CoV-2
CAAGTGCTTTTGTGGAAACTGTGAAAGGTTTGGATTATAAAGCATTCA
>HUMAN|chr1|fragment1
CCAAACTTCGGGCGGCGGCTGAGGCGGCGGCCGAGGA`}
            className={cn(
              'h-56 w-full resize-none rounded-xl border px-4 py-3 text-sm shadow-inner outline-none transition',
              'font-dna',
              'border-slate-200 bg-slate-50 text-slate-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200',
              'dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-emerald-500 dark:focus:ring-emerald-800',
              'placeholder:text-slate-400 dark:placeholder:text-slate-500'
            )}
            spellCheck={false}
            disabled={isRunning}
          />
        </div>
      )}
    </section>
  )
}

export default SequenceInput
