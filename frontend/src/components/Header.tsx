import { Activity, Dna, Moon, Sun, Database, Cpu, FileText, ChevronDown, Bot, X, Send, Loader2 } from 'lucide-react'
import { cn } from '../lib/utils'
import { useState, useRef, useEffect, useCallback } from 'react'
import type { ChatMessage } from '../types'

type HeaderProps = {
  healthOk: boolean | null
  darkMode: boolean
  toggleDarkMode: () => void
  chatMessages: ChatMessage[]
  chatInput: string
  onChatInputChange: (value: string) => void
  onChatSend: () => void
  chatLoading: boolean
}

type ChatSize = {
  width: number
  height: number
}

type Position = {
  x: number
  y: number
}

function HealthBadge({ healthOk }: { healthOk: boolean | null }) {
  const status =
    healthOk === null ? 'Checking' : healthOk ? 'API healthy' : 'API unreachable'

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
        healthOk === null && 'border-amber-400 bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700',
        healthOk === true && 'border-emerald-400 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-700',
        healthOk === false && 'border-rose-400 bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300 dark:border-rose-700',
      )}
    >
      <Activity className="h-3.5 w-3.5" />
      <span>{status}</span>
    </div>
  )
}

function ModelInfoBadge() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition',
          'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
          'dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
        )}
      >
        <Cpu className="h-3.5 w-3.5 text-indigo-500" />
        <span>baio-v1.2</span>
        <ChevronDown className={cn('h-3 w-3 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className={cn(
            'absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border p-4 shadow-xl',
            'border-slate-200 bg-white',
            'dark:border-slate-700 dark:bg-slate-800'
          )}>
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                <Cpu className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Model Info</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Scientific transparency</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2">
                <span className="text-slate-400 dark:text-slate-500 w-20 flex-shrink-0">Model:</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">baio-v1.2 (RandomForest)</span>
              </div>
              <div className="flex items-start gap-2">
                <Database className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">
                  <strong>Training:</strong> Virus-Host 2024 Dataset
                </span>
              </div>
              <div className="flex items-start gap-2">
                <FileText className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">
                  <strong>Features:</strong> K-mer (6-mer) + TF-IDF
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Dna className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">
                  <strong>Embedding:</strong> K-mer Tokenization
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Accuracy</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">94.2%</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-slate-500 dark:text-slate-400">F1-Score</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">0.93</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function Header({ 
  healthOk, 
  darkMode, 
  toggleDarkMode,
  chatMessages,
  chatInput,
  onChatInputChange,
  onChatSend,
  chatLoading,
}: HeaderProps) {
  const [chatOpen, setChatOpen] = useState(false)
  const [chatSize, setChatSize] = useState<ChatSize>({ width: 380, height: 450 })
  const [chatPosition, setChatPosition] = useState<Position>({ x: 1000, y: 80 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 })
  const [isResizing, setIsResizing] = useState(false)
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const chatListRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const savedSize = localStorage.getItem('chatWidgetSize')
    if (savedSize) {
      try {
        const parsed = JSON.parse(savedSize)
        if (parsed.width && parsed.height) {
          setChatSize(parsed)
        }
      } catch {}
    }
    
    const savedPos = localStorage.getItem('chatWidgetPosition')
    if (savedPos) {
      try {
        const parsed = JSON.parse(savedPos)
        if (parsed.x !== undefined && parsed.y !== undefined) {
          setChatPosition(parsed)
        }
      } catch {}
    }
  }, [])

  useEffect(() => {
    chatListRef.current?.scrollTo({ top: chatListRef.current.scrollHeight, behavior: 'smooth' })
  }, [chatMessages, chatLoading])

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    setResizeStart({ x: e.clientX, y: e.clientY, width: chatSize.width, height: chatSize.height })
  }, [chatSize])

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('input, textarea, button')) return
    e.preventDefault()
    setIsDragging(true)
    setDragStart({ x: e.clientX - chatPosition.x, y: e.clientY - chatPosition.y })
  }, [chatPosition])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && !isResizing) {
      const newX = e.clientX - dragStart.x
      const newY = e.clientY - dragStart.y
      setChatPosition({ x: newX, y: newY })
    }
    if (isResizing && resizeStart) {
      const deltaX = e.clientX - resizeStart.x
      const deltaY = e.clientY - resizeStart.y
      const newWidth = Math.max(300, Math.min(600, resizeStart.width + deltaX))
      const newHeight = Math.max(300, Math.min(600, resizeStart.height + deltaY))
      setChatSize({ width: newWidth, height: newHeight })
    }
  }, [isDragging, isResizing, resizeStart, dragStart])

  const handleMouseUp = useCallback(() => {
    if (isResizing) {
      localStorage.setItem('chatWidgetSize', JSON.stringify(chatSize))
    }
    if (isDragging) {
      localStorage.setItem('chatWidgetPosition', JSON.stringify(chatPosition))
    }
    setIsDragging(false)
    setIsResizing(false)
    setResizeStart(null)
  }, [isResizing, isDragging, chatSize, chatPosition])

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp])

  const handleChatSubmit = () => {
    if (!chatInput.trim() || chatLoading) return
    onChatSend()
  }

  const resetChatPosition = () => {
    const defaultPos = { x: 1000, y: 80 }
    setChatPosition(defaultPos)
    localStorage.removeItem('chatWidgetPosition')
  }

  const resetChatSize = () => {
    const defaultSize = { width: 380, height: 450 }
    setChatSize(defaultSize)
    localStorage.removeItem('chatWidgetSize')
  }

  const resetAll = () => {
    resetChatPosition()
    resetChatSize()
  }

  return (
    <header className={cn(
      'sticky top-0 z-40 border-b backdrop-blur-md transition-colors',
      darkMode 
        ? 'border-slate-800 bg-slate-900/95' 
        : 'border-slate-200 bg-white/95'
    )}>
      <div className="mx-auto flex max-w-full items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25">
            <Dna className="h-6 w-6" />
          </div>
          <div>
            <p className={cn(
              'text-sm font-bold uppercase tracking-widest',
              darkMode ? 'text-primary-400' : 'text-primary-600'
            )}>
              BAIO
            </p>
            <h1 className={cn(
              'text-sm font-medium',
              darkMode ? 'text-slate-400' : 'text-slate-500'
            )}>
              DNA Classification & Pathogen Detection
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-all',
                'bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600'
              )}
            >
              <Bot className="h-3.5 w-3.5" />
              <span>AI Assistant</span>
            </button>

            {chatOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setChatOpen(false)} />
                <div 
                  className={cn(
                    'fixed z-50 rounded-xl border shadow-xl',
                    'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800',
                    isDragging ? 'cursor-grabbing' : 'cursor-grab'
                  )}
                  style={{ 
                    left: `${chatPosition.x}px`, 
                    top: `${chatPosition.y}px`,
                    width: `${chatSize.width}px`, 
                    height: `${chatSize.height}px` 
                  }}
                >
                  <div 
                    className="flex items-center justify-between border-b border-slate-200 px-3 py-2 dark:border-slate-700 cursor-grab"
                    onMouseDown={handleDragStart}
                  >
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">AI Assistant</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={resetAll}
                        className="rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                        title="Reset position & size"
                      >
                        Reset
                      </button>
                      <button
                        onClick={() => setChatOpen(false)}
                        className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        <X className="h-4 w-4 text-slate-500" />
                      </button>
                    </div>
                  </div>

                  <div
                    ref={chatListRef}
                    className="flex-1 space-y-2 overflow-y-auto p-3"
                    style={{ height: `calc(${chatSize.height}px - 120px)` }}
                  >
                    {chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          'flex flex-col gap-1 rounded-lg px-3 py-2 text-xs shadow-sm',
                          msg.role === 'assistant'
                            ? 'border border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                            : 'border border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100'
                        )}
                      >
                        <span className="text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">
                          {msg.role}
                        </span>
                        <p className="whitespace-pre-line">{msg.content}</p>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Thinking...
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-200 p-3 dark:border-slate-700">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => onChatInputChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleChatSubmit()
                          }
                        }}
                        placeholder="Ask about BAIO..."
                        className={cn(
                          'flex-1 rounded-lg border px-3 py-2 text-xs outline-none transition',
                          'border-slate-200 bg-white text-slate-800 focus:border-blue-400 focus:ring-2 focus:ring-blue-100',
                          'dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:focus:border-blue-500 dark:focus:ring-blue-900',
                          'placeholder:text-slate-400 dark:placeholder:text-slate-500'
                        )}
                      />
                      <button
                        onClick={handleChatSubmit}
                        disabled={chatLoading || !chatInput.trim()}
                        className={cn(
                          'flex items-center justify-center rounded-lg px-3 py-2 transition disabled:cursor-not-allowed disabled:opacity-60',
                          'bg-gradient-to-r from-blue-500 to-violet-500 text-white'
                        )}
                      >
                        {chatLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                      </button>
                    </div>
                  </div>

                  <div
                    className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-center justify-center"
                    onMouseDown={handleResizeStart}
                    title="Drag to resize"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" className="text-slate-400">
                      <path d="M8 0L0 8M8 4L4 8M8 8L8 8" stroke="currentColor" strokeWidth="1.5" fill="none" />
                    </svg>
                  </div>
                </div>
              </>
            )}
          </div>
          <ModelInfoBadge />
          <button
            onClick={toggleDarkMode}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg border transition-all',
              darkMode 
                ? 'border-slate-700 bg-slate-800 text-amber-400 hover:bg-slate-700' 
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            )}
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <HealthBadge healthOk={healthOk} />
        </div>
      </div>
    </header>
  )
}

export default Header
