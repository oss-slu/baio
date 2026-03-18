import { Dna, Shield, Zap, FileText, Bot, BarChart3, GitBranch, Code, Database, Brain, ChevronRight, ExternalLink, Github, Play, CheckCircle, AlertTriangle, Users, BookOpen, Activity, FlaskConical } from 'lucide-react'
import { cn } from '../lib/utils'

type LandingPageProps = {
  onGetStarted: () => void
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const features = [
    {
      icon: Dna,
      title: 'DNA Sequence Classification',
      description: 'Classify DNA sequences into Virus or Host categories with high accuracy using advanced ML algorithms.',
      color: 'text-emerald-500',
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    },
    {
      icon: BarChart3,
      title: 'K-mer Analysis',
      description: 'Uses 6-mer frequency features for robust sequence representation and pattern recognition.',
      color: 'text-blue-500',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      icon: Shield,
      title: 'Risk Assessment',
      description: 'Color-coded risk level indicators (Low/Moderate/High) for quick threat evaluation.',
      color: 'text-rose-500',
      bg: 'bg-rose-100 dark:bg-rose-900/30',
    },
    {
      icon: Zap,
      title: 'Confidence Visualization',
      description: 'Real-time confidence scores with color-coded bars for each prediction.',
      color: 'text-amber-500',
      bg: 'bg-amber-100 dark:bg-amber-900/30',
    },
    {
      icon: Bot,
      title: 'AI Assistant',
      description: 'Gemini-powered chat for sequence analysis questions and guidance.',
      color: 'text-violet-500',
      bg: 'bg-violet-100 dark:bg-violet-900/30',
    },
    {
      icon: FileText,
      title: 'Export Options',
      description: 'Download results as JSON, CSV, or PDF for further analysis and documentation.',
      color: 'text-cyan-500',
      bg: 'bg-cyan-100 dark:bg-cyan-900/30',
    },
  ]

  const techStack = [
    { name: 'React + Vite', desc: 'Frontend UI', icon: Code },
    { name: 'FastAPI', desc: 'Backend API', icon: Database },
    { name: 'Scikit-learn', desc: 'ML Models', icon: Brain },
    { name: 'Gemini AI', desc: 'AI Assistant', icon: Bot },
    { name: 'Docker', desc: 'Deployment', icon: FlaskConical },
    { name: 'TypeScript', desc: 'Type Safety', icon: GitBranch },
  ]

  const pipeline = [
    { step: '01', title: 'Validate Input', desc: 'Check sequence validity, length, and nucleotide composition' },
    { step: '02', title: 'K-mer Extraction', desc: 'Convert DNA to 6-mer features for ML processing' },
    { step: '03', title: 'Vectorize & Classify', desc: 'Use trained SVM/RandomForest models' },
    { step: '04', title: 'Generate Results', desc: 'Return predictions with confidence scores' },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 py-20 lg:py-32">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 h-72 w-72 rounded-full bg-primary-500/20 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        </div>
        
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/30">
              <Dna className="h-10 w-10 text-white" />
            </div>
            
            <h1 className="text-5xl font-bold tracking-tight text-slate-900 dark:text-white lg:text-6xl">
              BAIO
            </h1>
            <p className="mt-4 text-xl font-medium text-slate-600 dark:text-slate-300">
              Bioinformatics AI for Open-set detection
            </p>
            <p className="mt-6 max-w-2xl text-lg text-slate-500 dark:text-slate-400">
              A web-based metagenomic analysis platform that classifies DNA sequences with machine learning. 
              Distinguish viral and host DNA with high accuracy using 6-mer sequence features.
            </p>
            
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <button
                onClick={onGetStarted}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-6 py-3 text-base font-semibold text-white shadow-lg transition-all',
                  'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700',
                  'hover:shadow-xl hover:shadow-primary-500/30 hover:-translate-y-0.5'
                )}
              >
                <Play className="h-5 w-5" />
                Get Started
              </button>
              <a
                href="https://github.com/oss-slu/baio"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-base font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                )}
              >
                <Github className="h-5 w-5" />
                View on GitHub
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
              Powerful Features
            </h2>
            <p className="mt-4 text-lg text-slate-500 dark:text-slate-400">
              Everything you need for DNA sequence classification and analysis
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className={cn(
                  'group relative overflow-hidden rounded-2xl border p-6 transition-all hover:-translate-y-1 hover:shadow-xl',
                  'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900',
                  'hover:border-slate-300 dark:hover:border-slate-700'
                )}
              >
                <div className={cn('mb-4 flex h-12 w-12 items-center justify-center rounded-xl', feature.bg)}>
                  <feature.icon className={cn('h-6 w-6', feature.color)} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-slate-500 dark:text-slate-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="px-6 py-20 bg-slate-50 dark:bg-slate-900/50">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-slate-500 dark:text-slate-400">
              A streamlined ML pipeline for DNA classification
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {pipeline.map((step, idx) => (
              <div key={idx} className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-lg font-bold text-white shadow-lg shadow-primary-500/30">
                    {step.step}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    {step.desc}
                  </p>
                </div>
                {idx < pipeline.length - 1 && (
                  <ChevronRight className="absolute -right-4 top-7 hidden h-8 w-8 text-slate-300 dark:text-slate-600 lg:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
              Technology Stack
            </h2>
            <p className="mt-4 text-lg text-slate-500 dark:text-slate-400">
              Built with modern, reliable technologies
            </p>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {techStack.map((tech, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex items-center gap-4 rounded-xl border p-4 transition-colors',
                  'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900',
                  'hover:border-primary-300 dark:hover:border-primary-700'
                )}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30">
                  <tech.icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{tech.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{tech.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="px-6 py-20 bg-slate-50 dark:bg-slate-900/50">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
              Use Cases
            </h2>
            <p className="mt-4 text-lg text-slate-500 dark:text-slate-400">
              BAIO is designed for researchers and clinicians
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className={cn(
              'rounded-2xl border p-6',
              'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
            )}>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Research Applications</h3>
              </div>
              <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-primary-500" />
                  Metagenomic sample analysis
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-primary-500" />
                  Pathogen discovery research
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-primary-500" />
                  Viral contamination detection
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-primary-500" />
                  Host response studies
                </li>
              </ul>
            </div>
            
            <div className={cn(
              'rounded-2xl border p-6',
              'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
            )}>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Clinical Applications</h3>
              </div>
              <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-primary-500" />
                  Infectious disease screening
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-primary-500" />
                  outbreak investigation
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-primary-500" />
                  Environmental monitoring
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-primary-500" />
                  Vaccine development support
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Contributors Section */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
            Our Team
          </h2>
          <p className="mt-4 text-lg text-slate-500 dark:text-slate-400">
            Open-source project from Saint Louis University
          </p>
          
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              { name: 'Mainuddin', role: 'Tech Lead', icon: Users },
              { name: 'Luis Palmejar', role: 'Developer', icon: Code },
              { name: 'Kevin Yang', role: 'Developer', icon: BookOpen },
            ].map((contributor, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex flex-col items-center rounded-2xl border p-6',
                  'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                )}
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600">
                  <contributor.icon className="h-8 w-8 text-white" />
                </div>
                <p className="mt-4 font-semibold text-slate-900 dark:text-white">{contributor.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{contributor.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className={cn(
            'relative overflow-hidden rounded-3xl px-8 py-16 text-center',
            'bg-gradient-to-br from-primary-600 to-primary-700'
          )}>
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-1/4 h-64 w-64 rounded-full bg-white blur-3xl" />
              <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-white blur-3xl" />
            </div>
            <div className="relative">
              <Activity className="mx-auto h-12 w-12 text-white/80" />
              <h2 className="mt-6 text-3xl font-bold text-white">
                Ready to get started?
              </h2>
              <p className="mt-4 text-lg text-white/80">
                Start classifying DNA sequences today. It's free and open-source.
              </p>
              <button
                onClick={onGetStarted}
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-lg font-semibold text-primary-600 shadow-lg transition-all hover:bg-white/90 hover:shadow-xl"
              >
                Launch BAIO
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 px-6 py-8 dark:border-slate-800">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-600">
                <Dna className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-slate-900 dark:text-white">BAIO</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              © 2024 BAIO Project. Open-source under MIT License.
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Research prototype - not for clinical use
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
