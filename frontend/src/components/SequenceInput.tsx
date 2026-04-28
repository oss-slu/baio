import { useRef } from 'react'
import { FileUp, Sparkles } from 'lucide-react'
import { cn } from '../lib/utils'

type SequenceInputProps = {
  rawSequences: string
  onChange: (value: string) => void
  parsedCount: number
  onLoadSample: () => void
  isRunning: boolean
  isOpen?: boolean
  onClose?: () => void
}

function SequenceInput({
  rawSequences,
  onChange,
  parsedCount,
  onLoadSample,
  isRunning,
}: SequenceInputProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFileUpload = async (file?: File) => {
    if (!file) return
    const text = await file.text()
    onChange(text)
  }

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Input
        </p>
        {parsedCount > 0 && (
          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
            {parsedCount} parsed
          </span>
        )}
      </div>

      <p className="text-[11px] text-slate-400 dark:text-slate-500">
        Paste FASTA — headers become IDs, bases are auto-uppercased.
      </p>

      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={onLoadSample}
          className={cn(
            'flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold transition',
            'bg-slate-900 text-white hover:bg-emerald-700',
            'dark:bg-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-900/70'
          )}
          disabled={isRunning}
        >
          <Sparkles className="h-3 w-3" />
          Sample
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold transition',
            'bg-slate-900 text-white hover:bg-blue-600',
            'dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
          )}
          disabled={isRunning}
        >
          <FileUp className="h-3 w-3" />
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

      <textarea
        value={rawSequences}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`>NC_045512.2 SARS-CoV-2\nCAAGTGCTTTTGTGGAAACTGTGAAAGGTTTGGATTATAAAGCATTCA\n>HUMAN|chr1|fragment1\nCCAAACTTCGGGCGGCGGCTGAGGCGGCGGCCGAGGA`}
        className={cn(
          'h-32 w-full resize-none rounded border px-2.5 py-2 text-xs outline-none transition',
          'font-dna',
          'border-slate-200 bg-slate-50 text-slate-800 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200',
          'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-indigo-500',
          'placeholder:text-slate-400 dark:placeholder:text-slate-600'
        )}
        spellCheck={false}
        disabled={isRunning}
      />
    </section>
  )
}

export default SequenceInput
