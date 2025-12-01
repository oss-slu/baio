import { useEffect, useMemo, useState } from 'react'
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
  confidence_threshold: 0.5,
  batch_size: 16,
  enable_ood: true,
  ood_threshold: 0.3,
}

const sampleFasta = `>virus_mock
ATGCGTACGTTAGCCGAATTCGCGATCGATC
>host_mock
GCTAGCTAGCTAGCTAGCTAGCTAGCTAGC
>novel_mock
NNNNNNNNNNACGTACGTACGTACGTACGTACGT
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

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Hi! Paste FASTA sequences on the left, run classification, and ask questions here.',
    },
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-slate-50 to-sky-50 text-slate-900">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:gap-8 lg:px-6 xl:px-10">
        <Header healthOk={healthOk} />

        {error && (
          <div className="rounded-xl border border-rose-800/60 bg-rose-950/40 px-4 py-3 text-rose-100 shadow-glow">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:gap-8 xl:grid-cols-[0.42fr_0.58fr]">
          <div className="space-y-6">
            <SequenceInput
              rawSequences={rawSequences}
              onChange={setRawSequences}
              parsedCount={parsedSequences.length}
              onLoadSample={() => setRawSequences(sampleFasta)}
              isRunning={isRunning}
              isOpen={inputOpen}
              onToggle={() => setInputOpen((prev) => !prev)}
            />

            <ConfigPanel
              config={config}
              onChange={handleConfigChange}
              onRun={handleRun}
              isRunning={isRunning}
              parsedCount={parsedSequences.length}
            />
          </div>

          <ResultsDashboard
            results={results}
            isLoading={isRunning}
            parsedCount={parsedSequences.length}
          />
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
