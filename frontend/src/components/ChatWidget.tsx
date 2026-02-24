import { useEffect, useRef, useState } from 'react'
import { Loader2, MessageCircle, Send, X } from 'lucide-react'
import { cn } from '../lib/utils'
import type { ChatMessage } from '../types'

type ChatWidgetProps = {
  messages: ChatMessage[]
  input: string
  onInputChange: (value: string) => void
  onSend: () => void
  isLoading: boolean
}

function ChatWidget({ messages, input, onInputChange, onSend, isLoading }: ChatWidgetProps) {
  const [open, setOpen] = useState(false)
  const listRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSubmit = () => {
    if (!input.trim() || isLoading) return
    onSend()
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white shadow-xl transition hover:-translate-y-0.5',
          'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/25 hover:shadow-emerald-500/40'
        )}
      >
        <MessageCircle className="h-4 w-4" />
        Assistant
      </button>

      <div
        className={cn(
          'fixed inset-0 z-50 flex justify-end transition',
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
          'bg-black/20 backdrop-blur-sm dark:bg-black/40'
        )}
        aria-hidden={!open}
        onClick={() => setOpen(false)}
      >
        <div
          className={cn(
            'relative flex h-full w-full max-w-md flex-col p-4 shadow-2xl transition duration-300 ease-out',
            'border-l border-slate-200 bg-white',
            'dark:border-slate-700 dark:bg-slate-900',
            open ? 'translate-x-0' : 'translate-x-full',
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Assistant
              </p>
              <h4 className="text-lg font-semibold text-slate-900 dark:text-white">
                Interpret predictions & troubleshoot
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg border transition',
                'border-slate-200 bg-white text-slate-600 hover:border-rose-300 hover:text-rose-600',
                'dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-rose-600'
              )}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div
            ref={listRef}
            className={cn(
              'mt-4 flex-1 space-y-3 overflow-y-auto rounded-xl border p-3',
              'border-slate-200 bg-slate-50',
              'dark:border-slate-700 dark:bg-slate-800'
            )}
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex flex-col gap-1 rounded-lg px-3 py-2 text-sm shadow-sm',
                  msg.role === 'assistant'
                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200'
                    : 'border border-slate-200 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100'
                )}
              >
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {msg.role}
                </span>
                <p className="whitespace-pre-line leading-relaxed text-slate-700 dark:text-slate-200">
                  {msg.content}
                </p>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Thinking...
              </div>
            )}
          </div>

          <div className="mt-3 space-y-2">
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
                'h-24 w-full rounded-xl border px-3 py-2 text-sm outline-none transition',
                'border-slate-200 bg-white text-slate-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100',
                'dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-emerald-500 dark:focus:ring-emerald-900',
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
                  'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/25 hover:shadow-emerald-500/40'
                )}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ChatWidget
