import { useEffect, useRef, useState, useCallback } from 'react'
import { Loader2, Bot, X, Minus, Plus } from 'lucide-react'
import { cn } from '../lib/utils'
import type { ChatMessage } from '../types'

type Position = {
  x: number
  y: number
}

type Size = {
  width: number
  height: number
}

type ChatWidgetProps = {
  messages: ChatMessage[]
  input: string
  onInputChange: (value: string) => void
  onSend: () => void
  isLoading: boolean
}

function ChatWidget({ messages, input, onInputChange, onSend, isLoading }: ChatWidgetProps) {
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [position, setPosition] = useState<Position>({ x: 20, y: 80 })
  const [size, setSize] = useState<Size>({ width: 400, height: 500 })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const widgetRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const savedPosition = localStorage.getItem('chatWidgetPosition')
    const savedSize = localStorage.getItem('chatWidgetSize')
    
    if (savedPosition) {
      try {
        const parsed = JSON.parse(savedPosition)
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number' && 
            parsed.x >= 0 && parsed.y >= 0 && 
            parsed.x < window.innerWidth && parsed.y < window.innerHeight) {
          setPosition(parsed)
        } else {
          setPosition({ x: 20, y: 80 })
        }
      } catch {
        setPosition({ x: 20, y: 80 })
      }
    } else {
      setPosition({ x: 20, y: 80 })
    }
    
    if (savedSize) {
      try {
        const parsed = JSON.parse(savedSize)
        if (typeof parsed.width === 'number' && typeof parsed.height === 'number' &&
            parsed.width >= 280 && parsed.height >= 250) {
          setSize(parsed)
        }
      } catch {
        console.log('Using default size')
      }
    }
    setIsInitialized(true)
  }, [])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isLoading])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.chat-input-area') || 
        (e.target as HTMLElement).closest('.resize-handle') ||
        (e.target as HTMLElement).closest('button')) return
    e.preventDefault()
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }, [position])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x
      const newY = e.clientY - dragStart.y
      setPosition({ x: newX, y: newY })
    }
    if (isResizing && resizeStart) {
      const deltaX = e.clientX - resizeStart.x
      const deltaY = e.clientY - resizeStart.y
      const newWidth = Math.max(300, Math.min(window.innerWidth - 40, resizeStart.width + deltaX))
      const newHeight = Math.max(300, Math.min(window.innerHeight - 40, resizeStart.height + deltaY))
      setSize({ width: newWidth, height: newHeight })
    }
  }, [isDragging, isResizing, dragStart, resizeStart])

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      localStorage.setItem('chatWidgetPosition', JSON.stringify(position))
    }
    if (isResizing) {
      localStorage.setItem('chatWidgetSize', JSON.stringify(size))
    }
    setIsDragging(false)
    setIsResizing(false)
    setResizeStart(null)
  }, [isDragging, isResizing, position, size])

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

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    setResizeStart({ x: e.clientX, y: e.clientY, width: size.width, height: size.height })
  }, [size])

  const handleSubmit = () => {
    if (!input.trim() || isLoading) return
    onSend()
  }

  const resetPosition = () => {
    const defaultPos = { x: 20, y: 80 }
    setPosition(defaultPos)
    setOpen(false)
    setMinimized(true)
    localStorage.removeItem('chatWidgetPosition')
  }

  const resetSize = () => {
    const defaultSize = { width: 400, height: 500 }
    setSize(defaultSize)
    localStorage.removeItem('chatWidgetSize')
  }

  const resetAll = () => {
    resetPosition()
    resetSize()
  }

  const handleClose = () => {
    setOpen(false)
    setMinimized(true)
  }

  if (!isInitialized) {
    return null
  }

  return (
    <>
      <div
        ref={widgetRef}
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          zIndex: 9999,
        }}
      >
        <button
          type="button"
          onClick={() => {
            if (minimized) {
              setMinimized(false)
              setOpen(true)
            } else if (open) {
              setOpen(false)
              setMinimized(true)
            } else {
              setOpen(true)
            }
          }}
          onDoubleClick={() => {
            setPosition({ x: 20, y: 80 })
            setOpen(false)
            setMinimized(true)
          }}
          onMouseDown={handleMouseDown}
          className={cn(
            'flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white shadow-xl',
            'bg-gradient-to-r from-blue-500 to-violet-500',
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          )}
          title={minimized ? "Click to open" : "Double-click to reset position"}
        >
          {minimized ? <Plus className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
          {minimized ? 'Show AI' : 'AI Assistant'}
        </button>
      </div>

      {open && !minimized && (
        <div
          style={{
            position: 'fixed',
            left: `${position.x}px`,
            top: `${position.y}px`,
            zIndex: 10000,
            width: `${size.width}px`,
            height: `${size.height}px`,
            minWidth: '280px',
            minHeight: '250px',
          }}
        >
          <div
            className={cn(
              'flex flex-col h-full rounded-xl shadow-2xl overflow-hidden',
              'bg-white dark:bg-slate-900',
              'border border-slate-200 dark:border-slate-700'
            )}
          >
            <div 
              className="flex items-center justify-between gap-3 px-4 py-2 bg-gradient-to-r from-blue-500 to-violet-500 cursor-grab flex-shrink-0"
              onMouseDown={handleMouseDown}
            >
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-white" />
                <div>
                  <p className="text-sm font-semibold text-white">AI Assistant</p>
                  <p className="text-[10px] text-white/70">Drag to move • Resize from corner</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={resetAll}
                  className="rounded-lg bg-white/20 px-2 py-1 text-xs text-white hover:bg-white/30"
                  title="Reset position & size"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    setMinimized(true)
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 text-white hover:bg-white/30"
                  title="Minimize"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 text-white hover:bg-white/30"
                  title="Close"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>

            <div
              ref={listRef}
              className="flex-1 overflow-y-auto p-3 bg-slate-50 dark:bg-slate-800"
            >
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'mb-2 rounded-lg px-3 py-2 text-sm',
                    msg.role === 'assistant'
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200'
                      : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-600'
                  )}
                >
                  <span className="text-[10px] font-semibold uppercase text-slate-400">
                    {msg.role}
                  </span>
                  <p className="whitespace-pre-line">{msg.content}</p>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking...
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-900 flex-shrink-0">
              <div className="chat-input-area">
                <textarea
                  value={input}
                  onChange={(e) => onInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit()
                    }
                  }}
                  placeholder="Ask about BAIO..."
                  className={cn(
                    'h-16 w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none',
                    'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800',
                    'focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900'
                  )}
                />
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Shift + Enter for new line</span>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isLoading || !input.trim()}
                    className={cn(
                      'rounded-lg px-4 py-2 text-sm font-semibold text-white',
                      'bg-gradient-to-r from-blue-500 to-violet-500',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send'}
                  </button>
                </div>
              </div>
            </div>

            <div
              className="resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-center justify-center"
              onMouseDown={handleResizeStart}
              title="Drag to resize"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" className="text-white/60">
                <path d="M10 0L0 10M10 4L4 10M10 8L8 10" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ChatWidget
