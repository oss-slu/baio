import { useRef } from 'react'
import { ChevronDown, ChevronUp, FileUp, Sparkles } from 'lucide-react'

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
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg shadow-emerald-50">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-emerald-300 hover:bg-white"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Input
          </p>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-50">Upload or paste FASTA</h2>
            <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
              {parsedCount} parsed
            </span>
          </div>
          {!isOpen && preview && (
            <p className="mt-1 line-clamp-1 text-xs text-slate-500">
              {preview.length > 120 ? `${preview.slice(0, 120)}…` : preview}
            </p>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/70 text-slate-200">
          {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </button>

      {isOpen && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-400">
                Paste FASTA (headers become IDs, bases are upper-cased automatically).
              </p>
              <p className="text-xs text-slate-500">
                DNA text uses <span className="font-mono text-indigo-200">font-mono</span> and
                a code-like surface to mimic an editor.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onLoadSample}
                className="group inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                disabled={isRunning}
              >
                <Sparkles className="h-4 w-4" />
                Load sample FASTA
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:border-amber-300 hover:text-amber-600"
                disabled={isRunning}
              >
                <FileUp className="h-4 w-4" />
                Upload .fasta
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
            placeholder={`>sequence_1
ATGCGTACGTTAGCCGAATTCGCGATCGATC
>sequence_2
GCTAGCTAGCTAGCTAGCTAG...`}
            className="h-56 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-800 shadow-inner outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
            spellCheck={false}
            disabled={isRunning}
          />
        </div>
      )}
    </section>
  )
}

export default SequenceInput
