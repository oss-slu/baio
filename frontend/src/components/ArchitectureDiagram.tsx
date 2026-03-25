import { Database, Code, Brain, Bot, FileText, Zap, Globe, Server, Cpu, ArrowDown, Layers } from 'lucide-react'
import { cn } from '../lib/utils'

export default function ArchitectureDiagram() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            BAIO Architecture
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            DNA Sequence Classification System Architecture
          </p>
        </div>

        {/* User Layer */}
        <div className="mb-8">
          <div className="flex justify-center">
            <div className={cn(
              'flex items-center gap-3 rounded-xl border-2 border-dashed px-6 py-4',
              'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50'
            )}>
              <Globe className="h-6 w-6 text-primary-500" />
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-300">User / Browser</p>
                <p className="text-xs text-slate-500 dark:text-slate-500">HTTP/HTTPS</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center mb-8">
          <ArrowDown className="h-6 w-6 text-slate-400" />
        </div>

        {/* Frontend Layer */}
        <div className="mb-8">
          <div className="flex justify-center mb-4">
            <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
              Frontend
            </span>
          </div>
          <div className="flex justify-center gap-4 flex-wrap">
            <ArchitectureCard
              icon={Code}
              title="React + Vite"
              description="User Interface"
              color="primary"
            />
            <ArchitectureCard
              icon={FileText}
              title="FASTA Input"
              description="Sequence Upload"
              color="emerald"
            />
            <ArchitectureCard
              icon={Zap}
              title="Results Display"
              description="Visualization"
              color="amber"
            />
          </div>
        </div>

        <div className="flex justify-center mb-8">
          <ArrowDown className="h-6 w-6 text-slate-400" />
        </div>

        {/* API Layer */}
        <div className="mb-8">
          <div className="flex justify-center mb-4">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              FastAPI Backend
            </span>
          </div>
          <div className="flex justify-center gap-4 flex-wrap">
            <ArchitectureCard
              icon={Server}
              title="/classify"
              description="Sequence Classification"
              color="emerald"
            />
            <ArchitectureCard
              icon={Bot}
              title="/chat"
              description="AI Assistant"
              color="violet"
            />
            <ArchitectureCard
              icon={Zap}
              title="/health"
              description="Health Check"
              color="cyan"
            />
          </div>
        </div>

        <div className="flex justify-center mb-8">
          <ArrowDown className="h-6 w-6 text-slate-400" />
        </div>

        {/* ML Layer */}
        <div className="mb-8">
          <div className="flex justify-center mb-4">
            <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
              ML Pipeline
            </span>
          </div>
          <div className="flex justify-center gap-4 flex-wrap">
            <ArchitectureCard
              icon={Layers}
              title="Validation"
              description="DNA Check"
              color="rose"
            />
            <ArchitectureCard
              icon={Cpu}
              title="K-mer Transformer"
              description="6-mer Features"
              color="amber"
            />
            <ArchitectureCard
              icon={Brain}
              title="RandomForest / SVM"
              description="Classification"
              color="primary"
            />
          </div>
        </div>

        <div className="flex justify-center mb-8">
          <ArrowDown className="h-6 w-6 text-slate-400" />
        </div>

        {/* Data Layer */}
        <div className="mb-8">
          <div className="flex justify-center mb-4">
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              Models & Data
            </span>
          </div>
          <div className="flex justify-center gap-4 flex-wrap">
            <ArchitectureCard
              icon={Database}
              title="Training Data"
              description="Virus / Host FASTA"
              color="emerald"
            />
            <ArchitectureCard
              icon={Brain}
              title="Saved Models"
              description=".pkl Artifacts"
              color="primary"
            />
            <ArchitectureCard
              icon={Database}
              title="Vectorizers"
              description="TF-IDF Features"
              color="cyan"
            />
          </div>
        </div>

        {/* Flow Description */}
        <div className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Data Flow
          </h3>
          <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
            <p className="flex items-start gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">1</span>
              <span>User uploads FASTA sequences via React UI (browser)</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">2</span>
              <span>Frontend sends POST request to FastAPI /classify endpoint</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">3</span>
              <span>API validates DNA sequences (length, nucleotides, GC content)</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">4</span>
              <span>K-mer transformer converts DNA to 6-mer features</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">5</span>
              <span>Saved RandomForest/SVM model classifies sequences</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">6</span>
              <span>API returns prediction, confidence, and explanation to frontend</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">7</span>
              <span>Results displayed in interactive dashboard with risk indicators</span>
            </p>
          </div>
        </div>

        {/* Technology Details */}
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <TechDetail
            title="Frontend Stack"
            items={['React 18', 'TypeScript', 'Vite', 'Tailwind CSS', 'Lucide Icons']}
          />
          <TechDetail
            title="Backend Stack"
            items={['Python 3.12', 'FastAPI', 'Uvicorn', 'Pydantic', 'CORS']}
          />
          <TechDetail
            title="ML Stack"
            items={['Scikit-learn', 'NumPy', 'Pandas', 'Joblib', 'K-mer Analysis']}
          />
        </div>
      </div>
    </div>
  )
}

function ArchitectureCard({ 
  icon: Icon, 
  title, 
  description, 
  color 
}: { 
  icon: React.ElementType
  title: string
  description: string
  color: 'primary' | 'emerald' | 'amber' | 'violet' | 'rose' | 'cyan'
}) {
  const colors = {
    primary: 'border-primary-300 bg-primary-50 dark:border-primary-800 dark:bg-primary-900/20',
    emerald: 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20',
    amber: 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20',
    violet: 'border-violet-300 bg-violet-50 dark:border-violet-800 dark:bg-violet-900/20',
    rose: 'border-rose-300 bg-rose-50 dark:border-rose-800 dark:bg-rose-900/20',
    cyan: 'border-cyan-300 bg-cyan-50 dark:border-cyan-800 dark:bg-cyan-900/20',
  }

  const iconColors = {
    primary: 'text-primary-600 dark:text-primary-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    amber: 'text-amber-600 dark:text-amber-400',
    violet: 'text-violet-600 dark:text-violet-400',
    rose: 'text-rose-600 dark:text-rose-400',
    cyan: 'text-cyan-600 dark:text-cyan-400',
  }

  return (
    <div className={cn(
      'flex flex-col items-center rounded-xl border p-4 text-center min-w-[140px]',
      colors[color]
    )}>
      <Icon className={cn('h-8 w-8 mb-2', iconColors[color])} />
      <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">{title}</p>
      <p className="text-xs text-slate-500 dark:text-slate-500">{description}</p>
    </div>
  )
}

function TechDetail({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h4 className="font-semibold text-slate-900 dark:text-white mb-3">{title}</h4>
      <ul className="space-y-1">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <div className="h-1.5 w-1.5 rounded-full bg-primary-500" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
