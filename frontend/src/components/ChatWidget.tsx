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
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-400 px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-emerald-200 transition hover:-translate-y-0.5 hover:shadow-emerald-300"
      >
        <MessageCircle className="h-4 w-4" />
        Assistant
      </button>

      <div
        className={cn(
          'fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-sm transition',
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
        aria-hidden={!open}
        onClick={() => setOpen(false)}
      >
        <div
          className={cn(
            'relative flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white p-4 shadow-2xl transition duration-300 ease-out',
            open ? 'translate-x-0' : 'translate-x-full',
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Assistant
              </p>
            <h4 className="text-lg font-semibold text-slate-900">
              Interpret predictions &amp; troubleshoot
            </h4>
          </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-emerald-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div
            ref={listRef}
            className="mt-4 flex-1 space-y-3 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3"
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex flex-col gap-1 rounded-lg px-3 py-2 text-sm shadow-sm',
                  msg.role === 'assistant'
                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-900'
                    : 'border border-slate-200 bg-white text-slate-900',
                )}
              >
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {msg.role}
                </span>
                <p className="whitespace-pre-line leading-relaxed text-slate-800">
                  {msg.content}
                </p>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-emerald-700">
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
              placeholder="Ask about BAIO, novelty detection, or how to interpret results..."
              className="h-24 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Shift + Enter for new line</span>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading || !input.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-400 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:shadow-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
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
