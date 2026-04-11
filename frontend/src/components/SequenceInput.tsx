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


  return (
    <section>
      <div>
        <div className ="flex - justify-between">
          <p className="text-2xl font-normal font-custom3  tracking-wider text-center text-black dark:text-white">
          Input
          </p>
          <div className="flex-column items-center gap-5 text-center">
            <span className={cn(
              'rounded-full text-sm text-black font-custom2 font-normal ',
              'dark:text-white'
            )}>
              {parsedCount} Parsed
            </span>
          </div>
        </div>
      </div>

      {(
        <div className="mt-4 space-y-3">
          <div className="flex-wrap space-y-2 gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-light font-custom2 text-black dark:text-slate-400">
                Paste FASTA (headers become IDs, bases are upper-cased automatically).
              </p>
            </div>
            <div className="flex flex-row gap-2 justify-between">
              <button
                type="button"
                onClick={onLoadSample}
                className={cn(
                  'group flex items-center gap-1 rounded-lg px-2 py-2 text-sm font-bold font-custom2 transition',
                  ' bg-black text-white hover:bg-emerald-700',
                  'dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50'
                )}
                disabled={isRunning}
              >
                <Sparkles className="h-4 w-4" />
                Load Sample
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'flex items-center gap-2 rounded-lg  px-6 py-2 text-sm font-bold font-custom2 transition',
                  'border-slate-950 bg-black text-white hover:bg-blue-300',
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
              'h-40 w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none transition',
              'font-dna',
              'border-slate-50 bg-slate-50 text-slate-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200',
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
