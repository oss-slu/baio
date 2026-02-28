import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, Menu } from 'lucide-react'
import { classifySequences, checkHealth, sendChat } from './api'
import Header from './components/Header'
import SequenceInput from './components/SequenceInput'
import ConfigPanel from './components/ConfigPanel'
import ResultsDashboard from './components/ResultsDashboard'
import ChatWidget from './components/ChatWidget'
import type {
  ChatMessage,
  ClassificationResponse,
  ModelConfig,
  SequenceInput as SequenceInputType,
} from './types'

const defaultConfig: ModelConfig = {
  type: 'Binary (Virus vs Host)',
  confidence_threshold: 0.01,
  batch_size: 16,
  enable_ood: false,
  ood_threshold: 0.99,
}

const sampleFasta = `>NC_045512.2 SARS-CoV-2
CAAGTGCTTTTGTGGAAACTGTGAAAGGTTTGGATTATAAAGCATTCAAACAAATTGTTGAATCCTGTGGTAATTTTAAAGTTACAAAAGGAAAAGCTAAAAAAGGTGCCTGGAATATTGGTGAACAGAAATCAATACTGAGTCCTCTTT
>HUMAN|chr1|fragment1
CCAAACTTCGGGCGGCGGCTGAGGCGGCGGCCGAGGAGCGGCGGACTCGGGGCGCGGGGAGTCGAGGCATTTGCGCCTGTGCTTCGGACCGTAGCGCCAGGGCCTGAGCCTTTGAAGCAGGAGGAGGGGAGGAGAGAGTG
`

function parseFasta(text: string): SequenceInputType[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim())
  const sequences: SequenceInputType[] = []
  let currentId = ''
  let currentSeq = ''

  for (const line of lines) {
    if (!line) continue
    if (line.startsWith('>')) {
      if (currentId && currentSeq) {
        sequences.push({ id: currentId, sequence: currentSeq })
      }
      currentId = line.replace(/^>/, '') || `seq_${sequences.length + 1}`
      currentSeq = ''
    } else {
      currentSeq += line.toUpperCase()
    }
  }

  if (currentId && currentSeq) {
    sequences.push({ id: currentId, sequence: currentSeq })
  } else if (!sequences.length && currentSeq) {
    sequences.push({ id: 'seq_1', sequence: currentSeq })
  }

  return sequences
}

function App() {
  const [rawSequences, setRawSequences] = useState('')
  const [config, setConfig] = useState<ModelConfig>(defaultConfig)
  const [results, setResults] = useState<ClassificationResponse | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [healthOk, setHealthOk] = useState<boolean | null>(null)
  const [inputOpen, setInputOpen] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true' ||
        (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches)
    }
    return false
  })

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Hi! Paste FASTA sequences, run classification, and ask questions here.',
    },
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('darkMode', String(darkMode))
  }, [darkMode])

  useEffect(() => {
    checkHealth().then(setHealthOk).catch(() => setHealthOk(false))
  }, [])

  const parsedSequences = useMemo(
    () => (rawSequences.trim() ? parseFasta(rawSequences) : []),
    [rawSequences],
  )

  const handleRun = async () => {
    setError(null)
    if (!parsedSequences.length) {
      setError('Add at least one sequence in FASTA format to run.')
      return
    }

    setIsRunning(true)
    try {
      const response = await classifySequences({
        sequences: parsedSequences,
        config,
        source: 'frontend_upload',
      })
      setResults(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setIsRunning(false)
    }
  }

  const handleChatSend = async () => {
    if (!chatInput.trim()) return
    const nextMessages: ChatMessage[] = [
      ...chatMessages,
      { role: 'user', content: chatInput.trim() },
    ]
    setChatMessages(nextMessages)
    setChatInput('')
    setChatLoading(true)

    try {
      const { reply } = await sendChat({ messages: nextMessages, mode: 'default' })
      setChatMessages([...nextMessages, { role: 'assistant', content: reply }])
    } catch (err) {
      setChatMessages([
        ...nextMessages,
        {
          role: 'assistant',
          content:
            err instanceof Error
              ? `Chat failed: ${err.message}`
              : 'Chat failed',
        },
      ])
    } finally {
      setChatLoading(false)
    }
  }

  const handleConfigChange = <K extends keyof ModelConfig>(
    key: K,
    value: ModelConfig[K],
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode 
        ? 'bg-slate-950 text-slate-100' 
        : 'bg-slate-100 text-slate-900'
    }`}>
      <Header 
        healthOk={healthOk} 
        darkMode={darkMode} 
        toggleDarkMode={() => setDarkMode(!darkMode)}
      />

      {error && (
        <div className={`mx-auto max-w-7xl px-4 pt-4 ${sidebarOpen ? 'md:ml-80' : ''} transition-all duration-300`}>
          <div className={`rounded-xl border px-4 py-3 ${
            darkMode 
              ? 'border-rose-800 bg-rose-950/50 text-rose-200' 
              : 'border-rose-300 bg-rose-50 text-rose-800'
          }`}>
            {error}
          </div>
        </div>
      )}

      <div className="flex">
        {/* Left Sidebar - Collapsible */}
        <div
          className={`fixed left-0 top-14 h-[calc(100vh-3.5rem)] z-30 transform transition-all duration-300 ease-in-out ${
            sidebarOpen ? 'w-80' : 'w-0'
          } overflow-hidden ${
            darkMode 
              ? 'border-r border-slate-800 bg-slate-900' 
              : 'border-r border-slate-200 bg-white'
          } shadow-xl`}
        >
          <div className="flex h-full w-80 flex-col overflow-y-auto p-4">
            <button
              onClick={() => setSidebarOpen(false)}
              className={`mb-4 flex items-center gap-2 text-sm ${
                darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
              Close sidebar
            </button>

            <SequenceInput
              rawSequences={rawSequences}
              onChange={setRawSequences}
              parsedCount={parsedSequences.length}
              onLoadSample={() => setRawSequences(sampleFasta)}
              isRunning={isRunning}
              isOpen={inputOpen}
              onToggle={() => setInputOpen((prev) => !prev)}
            />

            <div className="mt-4">
              <ConfigPanel
                config={config}
                onChange={handleConfigChange}
                onRun={handleRun}
                isRunning={isRunning}
                parsedCount={parsedSequences.length}
              />
            </div>
          </div>
        </div>

        {/* Sidebar Toggle Button */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className={`fixed left-4 top-20 z-30 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium shadow-md ${
              darkMode 
                ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700' 
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Menu className="h-4 w-4" />
            Open Panel
          </button>
        )}

        {/* Main Content Area */}
        <div
          className={`flex-1 transition-all duration-300 ${
            sidebarOpen ? 'md:ml-80' : 'ml-0'
          }`}
        >
          <div className="mx-auto max-w-6xl px-6 py-6">
            <ResultsDashboard
              results={results}
              isLoading={isRunning}
              parsedCount={parsedSequences.length}
            />
          </div>
        </div>
      </div>

      <ChatWidget
        messages={chatMessages}
        input={chatInput}
        onInputChange={setChatInput}
        onSend={handleChatSend}
        isLoading={chatLoading}
      />
    </div>
  )
}

export default App
