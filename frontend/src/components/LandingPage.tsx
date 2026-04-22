import { useState } from 'react'
import {
  Dna, Shield, FileText, Bot, GitPullRequest,
  ChevronRight, ExternalLink, Github, Play,
  CheckCircle, AlertTriangle, Activity,
  Moon, Sun, Search, Cpu, Lock, Layers, ArrowRight,
} from 'lucide-react'
import { cn } from '../lib/utils'
import ArchitectureDiagram from './ArchitectureDiagram'

type LandingPageProps = {
  onGetStarted: () => void
  darkMode: boolean
  toggleDarkMode: () => void
}

// ─── Product Preview Mockup Data ───────────────────────────────────────────
const mockRows = [
  { id: 'NC_045512.2 SARS-CoV-2', prediction: 'Virus',     confidence: 94, risk: 'High', gc: 38.1, riskColor: 'text-rose-400',    badgeLight: 'bg-rose-500',    badgeDark: '' },
  { id: 'HUMAN|chr1|fragment1',   prediction: 'Host',      confidence: 87, risk: 'Low',  gc: 52.3, riskColor: 'text-emerald-400', badgeLight: 'bg-emerald-500', badgeDark: '' },
  { id: 'unknown_env_seq_003',    prediction: 'Uncertain',  confidence: 54, risk: 'Med',  gc: 49.8, riskColor: 'text-amber-400',   badgeLight: 'bg-amber-400',   badgeDark: '' },
  { id: 'phage_lambda_frag_01',   prediction: 'Virus',     confidence: 91, risk: 'High', gc: 34.2, riskColor: 'text-rose-400',    badgeLight: 'bg-rose-500',    badgeDark: '' },
]

function ProductPreview() {
  return (
    <div className="relative">
      {/* Glow */}
      <div className="absolute -inset-4 rounded-2xl bg-blue-500/10 blur-2xl" />
      <div className="relative overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900 shadow-2xl shadow-blue-900/30">
        {/* Window chrome */}
        <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-950 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
          <div className="ml-3 flex items-center gap-1.5 rounded bg-slate-800 px-3 py-0.5">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            <span className="font-mono text-[10px] text-slate-400">baio.app/classify</span>
          </div>
        </div>

        {/* Summary bar */}
        <div className="flex items-center gap-3 border-b border-slate-800 bg-slate-950/60 px-4 py-2">
          {[
            { label: '4 Total', color: 'text-slate-300 border-slate-700 bg-slate-800' },
            { label: '2 Virus', color: 'text-rose-300 border-rose-800/50 bg-rose-900/20' },
            { label: '1 Host',  color: 'text-emerald-300 border-emerald-800/50 bg-emerald-900/20' },
            { label: '1 Uncertain', color: 'text-amber-300 border-amber-800/50 bg-amber-900/20' },
          ].map(({ label, color }) => (
            <span key={label} className={cn('rounded border px-2 py-0.5 font-mono text-[10px] font-semibold', color)}>
              {label}
            </span>
          ))}
          <span className="ml-auto font-mono text-[10px] text-slate-500">0.34s</span>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-[1fr_80px_70px_40px] gap-2 border-b border-slate-800 bg-slate-800/30 px-4 py-2 text-[9px] font-semibold uppercase tracking-widest text-slate-500">
          <span>Sequence ID</span>
          <span className="text-center">Prediction</span>
          <span className="text-right">Confidence</span>
          <span className="text-right">GC%</span>
        </div>

        {/* Table rows */}
        {mockRows.map((row, i) => (
          <div
            key={i}
            className={cn(
              'grid grid-cols-[1fr_80px_70px_40px] items-center gap-2 border-b border-slate-800/50 px-4 py-2.5 transition-colors',
              i % 2 === 0 ? 'bg-slate-900' : 'bg-slate-900/60',
            )}
          >
            {/* ID */}
            <span className="truncate font-mono text-[10px] text-slate-300">
              {row.id}
            </span>
            {/* Badge */}
            <div className="flex justify-center">
              <span className={cn('rounded px-1.5 py-0.5 text-[9px] font-bold text-white', row.badgeLight)}>
                {row.prediction}
              </span>
            </div>
            {/* Confidence bar */}
            <div className="flex items-center justify-end gap-1.5">
              <div className="h-1 w-10 overflow-hidden rounded-full bg-slate-700">
                <div
                  className={cn('h-full rounded-full', row.confidence >= 75 ? 'bg-emerald-500' : row.confidence >= 60 ? 'bg-blue-500' : 'bg-amber-400')}
                  style={{ width: `${row.confidence}%` }}
                />
              </div>
              <span className="w-7 text-right font-mono text-[9px] font-semibold text-slate-300">
                {row.confidence}%
              </span>
            </div>
            {/* GC */}
            <span className="text-right font-mono text-[9px] text-slate-400">
              {row.gc}%
            </span>
          </div>
        ))}

        {/* Footer bar */}
        <div className="flex items-center justify-between bg-slate-950/60 px-4 py-2">
          <span className="font-mono text-[9px] text-slate-600">RandomForest · 6-mer TF-IDF</span>
          <span className="font-mono text-[9px] text-blue-500">Export ↓</span>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function LandingPage({ onGetStarted, darkMode, toggleDarkMode }: LandingPageProps) {
  const [showArchitecture, setShowArchitecture] = useState(false)

  const features = [
    {
      icon: Dna,
      title: 'DNA Sequence Classification',
      description: 'Classify sequences into Virus or Host categories with high accuracy using 6-mer k-mer ML pipelines.',
      iconColor: 'text-emerald-500',
      iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/10',
    },
    {
      icon: Search,
      title: 'K-mer Pattern Analysis',
      description: '6-mer frequency features with TF-IDF vectorization for robust sequence representation.',
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-500/10',
    },
    {
      icon: Shield,
      title: 'Risk Assessment',
      description: 'Color-coded Low/Moderate/High risk indicators with OOD novelty detection for unknown sequences.',
      iconColor: 'text-rose-500',
      iconBg: 'bg-rose-500/10',
    },
    {
      icon: Activity,
      title: 'Confidence Scoring',
      description: 'Calibrated probability scores with temperature scaling to eliminate false Uncertain results.',
      iconColor: 'text-violet-500',
      iconBg: 'bg-violet-500/10',
    },
    {
      icon: Bot,
      title: 'AI Assistant',
      description: 'Gemini-powered chat for in-context sequence analysis questions and interpretation guidance.',
      iconColor: 'text-cyan-500',
      iconBg: 'bg-cyan-500/10',
    },
    {
      icon: FileText,
      title: 'Multi-format Export',
      description: 'Download full classification reports as JSON, CSV, PDF, or plain text for downstream analysis.',
      iconColor: 'text-amber-500',
      iconBg: 'bg-amber-500/10',
    },
  ]

  const pipeline = [
    { step: '01', icon: Lock,     title: 'Validate',  desc: 'Sequence validity, length, and nucleotide composition checks' },
    { step: '02', icon: Layers,   title: 'K-mer',     desc: '6-mer extraction and TF-IDF vectorization into feature space' },
    { step: '03', icon: Cpu,      title: 'Classify',  desc: 'RandomForest / SVM inference with temperature-calibrated confidence' },
    { step: '04', icon: Activity, title: 'Results',   desc: 'Risk-scored predictions with OOD novelty flags and export' },
  ]

  const techPills = [
    'React 18', 'TypeScript', 'Vite', 'Tailwind CSS',
    'FastAPI', 'Python 3.11', 'Scikit-learn', 'SQLite',
    'Docker', 'Gemini AI', 'jsPDF', 'Joblib',
  ]

  if (showArchitecture) {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <button
          onClick={() => setShowArchitecture(false)}
          className="fixed top-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-lg hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
          Back to Home
        </button>
        <button
          onClick={toggleDarkMode}
          className={cn(
            'fixed top-4 right-4 z-50 flex h-9 w-9 items-center justify-center rounded-lg border shadow-md transition-all',
            darkMode ? 'border-slate-700 bg-slate-800 text-amber-400 hover:bg-slate-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
          )}
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <ArchitectureDiagram />
      </div>
    )
  }

  return (
    <div className={cn('min-h-screen', darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900')}>

      {/* ── Sticky Nav with Glassmorphism ─────────────────────────────────── */}
      <header className={cn(
        'sticky top-0 z-50 border-b px-6 py-3',
        'border-slate-200/70 bg-white/80 backdrop-blur-lg dark:border-slate-800/70 dark:bg-slate-950/80',
      )}>
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <Dna className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">BAIO</span>
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-400">
              Beta
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/oss-slu/baio"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 sm:flex"
            >
              <Github className="h-3.5 w-3.5" />
              GitHub
            </a>
            <button
              onClick={toggleDarkMode}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg border transition-all',
                darkMode
                  ? 'border-slate-700 bg-slate-800 text-amber-400 hover:bg-slate-700'
                  : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50',
              )}
            >
              {darkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 py-20 lg:py-28">
        {/* Background gradients */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/4 top-0 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl dark:bg-blue-500/8" />
          <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-violet-500/8 blur-3xl" />
        </div>

        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">

            {/* Left — Value proposition */}
            <div className="flex flex-col gap-6">
              {/* Eyebrow badge */}
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 dark:border-blue-800/60 dark:bg-blue-950/40">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                <span className="font-mono text-xs font-medium text-blue-700 dark:text-blue-400">
                  Open-source · Saint Louis University
                </span>
              </div>

              <div>
                <h1 className="text-5xl font-bold tracking-tight text-slate-900 dark:text-white lg:text-6xl">
                  Classify DNA
                  <br />
                  <span className="bg-gradient-to-r from-blue-600 via-violet-500 to-cyan-500 bg-clip-text text-transparent">
                    with confidence.
                  </span>
                </h1>
                <p className="mt-5 max-w-lg text-lg leading-relaxed text-slate-500 dark:text-slate-400">
                  BAIO is a metagenomic analysis platform that distinguishes viral and host
                  DNA sequences using calibrated machine learning — built for researchers and clinicians.
                </p>
              </div>

              {/* Trust metrics */}
              <div className="flex flex-wrap gap-4">
                {[
                  { val: '6-mer', label: 'K-mer features' },
                  { val: 'RF+SVM', label: 'ML models' },
                  { val: 'OOD', label: 'Novelty detection' },
                ].map(({ val, label }) => (
                  <div key={val} className="flex flex-col">
                    <span className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100">{val}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{label}</span>
                  </div>
                ))}
              </div>

              {/* CTA buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={onGetStarted}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200',
                    'bg-blue-600 shadow-lg shadow-blue-600/30',
                    'hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/40 hover:-translate-y-0.5',
                  )}
                >
                  <Play className="h-4 w-4" />
                  Launch BAIO
                </button>
                <button
                  onClick={() => setShowArchitecture(true)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold transition-all',
                    'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
                    'dark:border-slate-700 dark:bg-transparent dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800/50',
                  )}
                >
                  <GitPullRequest className="h-4 w-4" />
                  Architecture
                </button>
                <a
                  href="https://github.com/oss-slu/baio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold transition-all',
                    'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
                    'dark:border-slate-700 dark:bg-transparent dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800/50',
                  )}
                >
                  <Github className="h-4 w-4" />
                  GitHub
                  <ExternalLink className="h-3 w-3 opacity-50" />
                </a>
              </div>
            </div>

            {/* Right — Product preview */}
            <div className="hidden lg:block">
              <ProductPreview />
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Grid ─────────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-500">
              Capabilities
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
              Powerful Features
            </h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400">
              Everything you need for DNA sequence classification and analysis
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, idx) => (
              <div
                key={idx}
                className={cn(
                  'group relative rounded-xl border p-5 transition-all duration-200',
                  'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900',
                  'hover:-translate-y-1.5 hover:shadow-lg hover:shadow-slate-200/60 dark:hover:shadow-slate-900/60',
                  'hover:border-slate-300 dark:hover:border-slate-700',
                )}
              >
                {/* Subtle hover glow */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/0 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-5" />
                <div className={cn('mb-3 flex h-9 w-9 items-center justify-center rounded-lg', f.iconBg)}>
                  <f.icon className={cn('h-4.5 w-4.5', f.iconColor)} />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {f.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works — Horizontal Steps ───────────────────────────────── */}
      <section className={cn(
        'px-6 py-20',
        'bg-slate-100/60 dark:bg-slate-900/50',
      )}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-500">
              Pipeline
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
              How It Works
            </h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400">
              A streamlined ML pipeline for DNA classification
            </p>
          </div>

          <div className="relative grid grid-cols-2 gap-6 lg:grid-cols-4">
            {/* Connecting line */}
            <div className="absolute left-0 right-0 top-[22px] hidden h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-700 lg:block" />

            {pipeline.map((step, idx) => (
              <div key={idx} className="relative flex flex-col items-center text-center">
                {/* Step number circle */}
                <div className={cn(
                  'relative mb-4 flex h-11 w-11 items-center justify-center rounded-xl border-2 bg-white dark:bg-slate-950',
                  'border-blue-600 shadow-md shadow-blue-500/20',
                )}>
                  <span className="font-mono text-sm font-bold text-blue-600">
                    {step.step}
                  </span>
                </div>
                <div className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg',
                  'bg-slate-100 dark:bg-slate-800',
                )}>
                  <step.icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                </div>
                <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                  {step.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Technology Stack — Pill Grid ──────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-500">
              Stack
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
              Technology
            </h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400">
              Built with modern, production-grade open-source tools
            </p>
          </div>

          {/* Two rows of pills */}
          <div className="flex flex-col gap-3">
            {[techPills.slice(0, 6), techPills.slice(6)].map((row, rowIdx) => (
              <div key={rowIdx} className={cn('flex flex-wrap justify-center gap-2', rowIdx === 1 && 'px-8')}>
                {row.map((tech) => (
                  <span
                    key={tech}
                    className={cn(
                      'rounded-full border px-4 py-1.5 font-mono text-xs font-medium transition-colors duration-150',
                      'border-slate-200 bg-white text-slate-600',
                      'hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700',
                      'dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400',
                      'dark:hover:border-blue-700 dark:hover:bg-blue-950/30 dark:hover:text-blue-400',
                    )}
                  >
                    {tech}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Use Cases ─────────────────────────────────────────────────────── */}
      <section className={cn('px-6 py-20', 'bg-slate-100/60 dark:bg-slate-900/50')}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-500">
              Applications
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
              Use Cases
            </h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400">
              Designed for researchers, clinicians, and bioinformaticians
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {[
              {
                icon: CheckCircle,
                iconBg: 'bg-emerald-500/10',
                iconColor: 'text-emerald-600 dark:text-emerald-400',
                title: 'Research Applications',
                items: ['Metagenomic sample analysis', 'Pathogen discovery research', 'Viral contamination detection', 'Host response studies'],
              },
              {
                icon: AlertTriangle,
                iconBg: 'bg-amber-500/10',
                iconColor: 'text-amber-600 dark:text-amber-400',
                title: 'Clinical Applications',
                items: ['Infectious disease screening', 'Outbreak investigation', 'Environmental monitoring', 'Vaccine development support'],
              },
            ].map(({ icon: Icon, iconBg, iconColor, title, items }) => (
              <div
                key={title}
                className={cn(
                  'rounded-xl border p-6 transition-all duration-200',
                  'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900',
                  'hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700',
                )}
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', iconBg)}>
                    <Icon className={cn('h-4.5 w-4.5', iconColor)} />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
                </div>
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <span className="h-1 w-1 shrink-0 rounded-full bg-blue-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ───────────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className={cn(
            'relative overflow-hidden rounded-2xl border px-8 py-16 text-center',
            'border-blue-100 bg-gradient-to-br from-blue-600 to-violet-600',
            'dark:border-blue-900',
          )}>
            {/* Subtle light blobs */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-1/4 top-0 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
              <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
            </div>
            <div className="relative">
              <Dna className="mx-auto h-10 w-10 text-white/70" />
              <h2 className="mt-5 text-3xl font-bold text-white">
                Ready to analyze your sequences?
              </h2>
              <p className="mt-3 text-base text-white/70">
                Free, open-source, and deployable anywhere. No signup required.
              </p>
              <button
                onClick={onGetStarted}
                className={cn(
                  'mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-blue-700 shadow-lg transition-all',
                  'hover:bg-white/90 hover:shadow-xl hover:-translate-y-0.5',
                )}
              >
                Launch BAIO
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className={cn(
        'border-t px-6 py-8',
        'border-slate-200 dark:border-slate-800',
      )}>
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
                <Dna className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm font-bold text-slate-900 dark:text-white">BAIO</span>
              <span className="font-mono text-xs text-slate-400">· v1.0 Beta</span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              © 2024 BAIO Project · Open-source under MIT License
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Research prototype — not for clinical use
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
