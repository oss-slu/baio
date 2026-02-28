import { useEffect, useRef, useState, useCallback } from 'react'
import { Loader2, Bot, Send, X, GripVertical } from 'lucide-react'
import { cn } from '../lib/utils'
import type { ChatMessage } from '../types'

type Position = {
  x: number
  y: number
}

type ChatWidgetProps = {
  messages: ChatMessage[]
  input: string
  onInputChange: (value: string) => void
  onSend: () => void
  isLoading: boolean
}

const DEFAULT_POSITION: Position = { x: 20, y: 20 }

function ChatWidget({ messages, input, onInputChange, onSend, isLoading }: ChatWidgetProps) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<Position>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chatWidgetPosition')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch {
          return DEFAULT_POSITION
        }
      }
    }
    return DEFAULT_POSITION
  })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 })
  const widgetRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isLoading])

  useEffect(() => {
    localStorage.setItem('chatWidgetPosition', JSON.stringify(position))
  }, [position])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.chat-input-area')) return
    setIsDragging(true)
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })
  }, [position])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return
    const newX = Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - 400))
    const newY = Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - 500))
    setPosition({ x: newX, y: newY })
  }, [isDragging, dragOffset])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const handleSubmit = () => {
    if (!input.trim() || isLoading) return
    onSend()
  }

  const resetPosition = () => {
    setPosition(DEFAULT_POSITION)
    localStorage.removeItem('chatWidgetPosition')
  }

  return (
    <>
      <div
        ref={widgetRef}
        className={cn(
          'fixed z-40 transition-opacity',
          open ? 'pointer-events-none opacity-0' : 'pointer-events-auto opacity-100'
        )}
        style={{ left: position.x, top: position.y }}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          onMouseDown={handleMouseDown}
          className={cn(
            'flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white shadow-xl transition-all hover:-translate-y-0.5',
            'bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600',
            'shadow-blue-500/25 hover:shadow-blue-500/40',
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          )}
        >
          <Bot className="h-4 w-4" />
          AI Assistant
          <GripVertical className="h-3 w-3 opacity-60" />
        </button>
      </div>

      <div
        className={cn(
          'fixed inset-0 z-50 flex transition',
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
          'bg-black/20 backdrop-blur-sm dark:bg-black/40'
        )}
        aria-hidden={!open}
        onClick={() => setOpen(false)}
      >
        <div
          className={cn(
            'relative flex h-full w-full max-w-md flex-col shadow-2xl transition duration-300 ease-out',
            'bg-white dark:bg-slate-900',
            open ? 'translate-x-0' : 'translate-x-full'
          )}
          style={{ marginLeft: open ? position.x : undefined, marginTop: open ? position.y : undefined }}
          onClick={(e) => e.stopPropagation()}
        >
          <div 
            className="flex items-center justify-between gap-3 border-b border-slate-200 bg-gradient-to-r from-blue-500 to-violet-500 p-4 dark:border-slate-700 cursor-move"
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-white" />
              <div>
                <p className="text-sm font-semibold text-white">
                  AI Assistant
                </p>
                <p className="text-xs text-white/80">
                  Drag to reposition
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetPosition}
                className="rounded-lg bg-white/20 px-2 py-1 text-xs text-white hover:bg-white/30"
                title="Reset position"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 text-white hover:bg-white/30"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div
            ref={listRef}
            className={cn(
              'flex-1 space-y-3 overflow-y-auto p-4',
              'bg-slate-50 dark:bg-slate-800'
            )}
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex flex-col gap-1 rounded-lg px-3 py-2 text-sm shadow-sm',
                  msg.role === 'assistant'
                    ? 'border border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                    : 'border border-slate-200 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100'
                )}
              >
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {msg.role}
                </span>
                <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Thinking...
              </div>
            )}
          </div>

          <div className={cn(
            'border-t border-slate-200 p-4 dark:border-slate-700',
            'bg-white dark:bg-slate-900'
          )}>
            <div className="chat-input-area space-y-3">
              <textarea
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit()
                  }
                }}
                placeholder="Ask about BAIO, novelty detection, or results..."
                className={cn(
                  'h-24 w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none transition',
                  'border-slate-200 bg-slate-50 text-slate-800 focus:border-blue-400 focus:ring-2 focus:ring-blue-100',
                  'dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-blue-500 dark:focus:ring-blue-900',
                  'placeholder:text-slate-400 dark:placeholder:text-slate-500'
                )}
              />
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Shift + Enter for new line</span>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading || !input.trim()}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-60',
                    'bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600'
                  )}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ChatWidget
