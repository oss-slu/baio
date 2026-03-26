import { cn } from '../lib/utils'

// ──────────────────────────────────────────────
// Primitive building blocks
// ──────────────────────────────────────────────

function LayerLabel({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className={cn('h-3 w-3 rounded-full', color)} />
      <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
        {label}
      </span>
    </div>
  )
}

function Arrow({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center py-1">
      <div className="h-6 w-px bg-slate-300 dark:bg-slate-600" />
      <svg width="12" height="8" viewBox="0 0 12 8" className="text-slate-400 dark:text-slate-500">
        <path d="M6 8L0 0h12z" fill="currentColor" />
      </svg>
      {label && (
        <span className="mt-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          {label}
        </span>
      )}
    </div>
  )
}

function HorizontalArrow({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-2">
      <div className="flex items-center">
        <div className="h-px w-8 bg-slate-300 dark:bg-slate-600" />
        <svg width="8" height="12" viewBox="0 0 8 12" className="text-slate-400 dark:text-slate-500">
          <path d="M8 6L0 0v12z" fill="currentColor" />
        </svg>
      </div>
      {label && (
        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap">
          {label}
        </span>
      )}
    </div>
  )
}

function Box({
  title,
  subtitle,
  tag,
  color,
  wide,
}: {
  title: string
  subtitle?: string
  tag?: string
  color: 'blue' | 'emerald' | 'violet' | 'amber' | 'rose' | 'cyan' | 'indigo' | 'slate'
  wide?: boolean
}) {
  const border = {
    blue:    'border-blue-300 dark:border-blue-700',
    emerald: 'border-emerald-300 dark:border-emerald-700',
    violet:  'border-violet-300 dark:border-violet-700',
    amber:   'border-amber-300 dark:border-amber-700',
    rose:    'border-rose-300 dark:border-rose-700',
    cyan:    'border-cyan-300 dark:border-cyan-700',
    indigo:  'border-indigo-300 dark:border-indigo-700',
    slate:   'border-slate-300 dark:border-slate-600',
  }[color]

  const bg = {
    blue:    'bg-blue-50 dark:bg-blue-900/20',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20',
    violet:  'bg-violet-50 dark:bg-violet-900/20',
    amber:   'bg-amber-50 dark:bg-amber-900/20',
    rose:    'bg-rose-50 dark:bg-rose-900/20',
    cyan:    'bg-cyan-50 dark:bg-cyan-900/20',
    indigo:  'bg-indigo-50 dark:bg-indigo-900/20',
    slate:   'bg-slate-50 dark:bg-slate-800/40',
  }[color]

  const tagColor = {
    blue:    'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    violet:  'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300',
    amber:   'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
    rose:    'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
    cyan:    'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300',
    indigo:  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
    slate:   'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  }[color]

  return (
    <div
      className={cn(
        'rounded-xl border px-4 py-3 text-center',
        border,
        bg,
        wide ? 'min-w-[160px]' : 'min-w-[120px]',
      )}
    >
      {tag && (
        <span className={cn('mb-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider', tagColor)}>
          {tag}
        </span>
      )}
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</p>
      {subtitle && <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{subtitle}</p>}
    </div>
  )
}

function Layer({
  label,
  labelColor,
  borderColor,
  children,
}: {
  label: string
  labelColor: string
  borderColor: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('rounded-2xl border-2 p-5', borderColor, 'bg-white dark:bg-slate-900')}>
      <LayerLabel label={label} color={labelColor} />
      {children}
    </div>
  )
}

// ──────────────────────────────────────────────
// Main diagram
// ──────────────────────────────────────────────

export default function ArchitectureDiagram() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-10">
      <div className="mx-auto max-w-5xl">

        {/* Title */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            BAIO System Architecture
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            End-to-end DNA sequence classification &amp; AI assistant pipeline
          </p>
        </div>

        {/* ── 1. User layer ── */}
        <div className="flex justify-center">
          <div className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-white px-8 py-4 dark:border-slate-600 dark:bg-slate-900">
            <UserIcon />
            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-200">Researcher / Clinician</p>
              <p className="text-xs text-slate-400">uploads FASTA sequences via browser</p>
            </div>
          </div>
        </div>

        <Arrow label="HTTPS" />

        {/* ── 2. Frontend layer ── */}
        <Layer
          label="Frontend — React 18 + Vite + TypeScript + Tailwind CSS"
          labelColor="bg-blue-500"
          borderColor="border-blue-200 dark:border-blue-800"
        >
          <div className="flex flex-wrap justify-center gap-3">
            <Box title="Landing Page"     subtitle="Hero · Features · Pipeline" color="blue" />
            <Box title="Sequence Input"   subtitle="FASTA parser · sample loader" color="blue" />
            <Box title="Config Panel"     subtitle="Threshold · batch · OOD" color="blue" />
            <Box title="Results Dashboard" subtitle="Table · bars · export" color="blue" wide />
            <Box title="Chat Widget"      subtitle="Floating · draggable · resizable" color="violet" />
          </div>
          <div className="mt-3 flex justify-center">
            <Box title="Header" subtitle="Health badge · Model info · Dark mode" color="slate" />
          </div>
        </Layer>

        {/* Two arrows side-by-side */}
        <div className="my-2 flex justify-center gap-32">
          <div className="flex flex-col items-center">
            <div className="h-6 w-px bg-slate-300 dark:bg-slate-600" />
            <svg width="12" height="8" viewBox="0 0 12 8" className="text-slate-400">
              <path d="M6 8L0 0h12z" fill="currentColor" />
            </svg>
            <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              POST /classify
            </span>
          </div>
          <div className="flex flex-col items-center">
            <div className="h-6 w-px bg-slate-300 dark:bg-slate-600" />
            <svg width="12" height="8" viewBox="0 0 12 8" className="text-slate-400">
              <path d="M6 8L0 0h12z" fill="currentColor" />
            </svg>
            <span className="rounded bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
              POST /chat
            </span>
          </div>
        </div>

        {/* ── 3. API + LLM side-by-side ── */}
        <div className="flex gap-4">

          {/* FastAPI */}
          <div className="flex-1">
            <Layer
              label="FastAPI Backend (Python 3.12 · Uvicorn · Pydantic)"
              labelColor="bg-emerald-500"
              borderColor="border-emerald-200 dark:border-emerald-800"
            >
              <div className="flex flex-wrap justify-center gap-3">
                <Box title="POST /classify" subtitle="DNA validation · batch" color="emerald" tag="endpoint" />
                <Box title="POST /chat"     subtitle="Context-aware replies"   color="violet" tag="endpoint" />
                <Box title="GET /health"    subtitle="Liveness probe"          color="cyan"   tag="endpoint" />
              </div>
              <div className="mt-3 flex justify-center">
                <Box title="CORS Middleware" subtitle="allow_origins=['*']" color="slate" />
              </div>
            </Layer>
          </div>

          {/* LLM Client */}
          <div className="w-56 shrink-0">
            <Layer
              label="LLM Client"
              labelColor="bg-violet-500"
              borderColor="border-violet-200 dark:border-violet-800"
            >
              <div className="flex flex-col gap-3 items-center">
                <Box title="OpenRouter" subtitle="nemotron-nano-9b (primary)" color="violet" wide />
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <div className="h-px w-5 bg-slate-300 dark:bg-slate-600" />
                  fallback
                  <div className="h-px w-5 bg-slate-300 dark:bg-slate-600" />
                </div>
                <Box title="Gemini API"  subtitle="Google (fallback)" color="indigo" wide />
              </div>
            </Layer>
          </div>
        </div>

        <Arrow label="predict(sequences)" />

        {/* ── 4. ML Pipeline ── */}
        <Layer
          label="ML Pipeline — binary_classifiers/"
          labelColor="bg-amber-500"
          borderColor="border-amber-200 dark:border-amber-800"
        >
          <div className="flex flex-wrap items-center justify-center gap-2">

            {/* Step 1 */}
            <div className="flex flex-col items-center gap-1">
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[9px] font-bold uppercase text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                Step 1
              </span>
              <Box
                title="DNA Validation"
                subtitle={"length ≥ 10bp · nucleotides\nGC% · AT% · ambiguous%"}
                color="rose"
              />
            </div>

            <HorizontalArrow label="clean seq" />

            {/* Step 2 */}
            <div className="flex flex-col items-center gap-1">
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                Step 2
              </span>
              <Box
                title="K-mer Transformer"
                subtitle="6-mer sliding window → frequency dict"
                color="amber"
                wide
              />
            </div>

            <HorizontalArrow label="feature vector" />

            {/* Step 3 */}
            <div className="flex flex-col items-center gap-1">
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-bold uppercase text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                Step 3
              </span>
              <Box
                title="TF-IDF Vectorizer"
                subtitle="RF vectorizer · SVM vectorizer (.pkl)"
                color="blue"
                wide
              />
            </div>

            <HorizontalArrow label="tf-idf matrix" />

            {/* Step 4 */}
            <div className="flex flex-col gap-2 items-center">
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                Step 4
              </span>
              <Box title="Random Forest" subtitle="best_model.pkl · 94.2% acc" color="emerald" />
              <Box title="SVM"           subtitle="best_model.pkl · F1 0.93"   color="cyan" />
            </div>
          </div>

          {/* OOD */}
          <div className="mt-4 flex justify-center">
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-3 dark:border-slate-600 dark:bg-slate-800/40">
              <span className="rounded bg-slate-200 px-2 py-0.5 text-[9px] font-bold uppercase text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                Optional
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">OOD Detection</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Mahalanobis distance · Energy score → <span className="font-medium">Novel / Uncertain</span>
                </p>
              </div>
            </div>
          </div>
        </Layer>

        <Arrow label="Virus | Host | Novel | Uncertain | Invalid + confidence" />

        {/* ── 5. Response ── */}
        <div className="flex justify-center">
          <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 px-8 py-4 text-center dark:border-emerald-700 dark:bg-emerald-900/20">
            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">JSON Response</p>
            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
              prediction · confidence · gc_content · organism_name · explanation
              <br />
              mahalanobis_distance · energy_score · ood_score
            </p>
          </div>
        </div>

        {/* ── 6. Numbered data flow ── */}
        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 text-base font-bold text-slate-900 dark:text-white">Data Flow</h3>
          <ol className="space-y-2">
            {[
              ['blue',    'User uploads a FASTA file or pastes sequences in the React UI.'],
              ['emerald', 'Frontend parses FASTA → POST /classify with sequences + ModelConfig.'],
              ['rose',    'FastAPI validates each sequence: length, nucleotide set, GC%, AT% composition.'],
              ['amber',   'K-mer Transformer generates 6-mer frequency features for every sequence.'],
              ['blue',    'TF-IDF Vectorizer converts k-mer features into a sparse matrix.'],
              ['emerald', 'RandomForest and/or SVM model predicts Virus or Host with a confidence score.'],
              ['slate',   '(Optional) OOD detection flags Novel or Uncertain sequences via Mahalanobis distance.'],
              ['violet',  'Results + explanation returned to frontend → rendered in Results Dashboard.'],
              ['violet',  'User can ask the AI Assistant (ChatWidget) — routed to OpenRouter / Gemini.'],
            ].map(([color, text], i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                <span className={cn(
                  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white',
                  color === 'blue'    && 'bg-blue-500',
                  color === 'emerald' && 'bg-emerald-500',
                  color === 'rose'    && 'bg-rose-500',
                  color === 'amber'   && 'bg-amber-500',
                  color === 'violet'  && 'bg-violet-500',
                  color === 'slate'   && 'bg-slate-500',
                )}>
                  {i + 1}
                </span>
                {text}
              </li>
            ))}
          </ol>
        </div>

        {/* ── 7. Tech stacks ── */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <TechStack
            title="Frontend"
            color="blue"
            items={['React 18', 'TypeScript 5', 'Vite', 'Tailwind CSS', 'Lucide Icons']}
          />
          <TechStack
            title="Backend"
            color="emerald"
            items={['Python 3.12', 'FastAPI', 'Uvicorn', 'Pydantic v2', 'CORS Middleware']}
          />
          <TechStack
            title="ML / AI"
            color="amber"
            items={['Scikit-learn', 'NumPy · Pandas', '6-mer K-mer Analysis', 'RandomForest · SVM', 'OpenRouter · Gemini']}
          />
        </div>

      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function UserIcon() {
  return (
    <svg className="h-8 w-8 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function TechStack({ title, color, items }: { title: string; color: 'blue' | 'emerald' | 'amber'; items: string[] }) {
  const dot = { blue: 'bg-blue-500', emerald: 'bg-emerald-500', amber: 'bg-amber-500' }[color]
  const header = {
    blue:    'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300',
    amber:   'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300',
  }[color]

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900">
      <div className={cn('border-b px-4 py-2 text-xs font-bold uppercase tracking-wider', header)}>
        {title}
      </div>
      <ul className="space-y-1.5 p-4">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <div className={cn('h-1.5 w-1.5 rounded-full', dot)} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
