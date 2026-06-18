'use client'

import { useRef, useCallback, useEffect, useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ArrowUp, Square } from 'lucide-react'

// ── Auto-resize hook ──────────────────────────────────────────────────────────

interface AutoResizeProps {
  minHeight: number
  maxHeight?: number
}

function useAutoResizeTextarea({ minHeight, maxHeight }: AutoResizeProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current
      if (!textarea) return
      if (reset) {
        textarea.style.height = `${minHeight}px`
        return
      }
      textarea.style.height = `${minHeight}px`
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight ?? Infinity)
      )
      textarea.style.height = `${newHeight}px`
    },
    [minHeight, maxHeight]
  )

  useEffect(() => {
    if (textareaRef.current) textareaRef.current.style.height = `${minHeight}px`
  }, [minHeight])

  return { textareaRef, adjustHeight }
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface MBAPromptBoxProps {
  /** Called when the user submits a message. */
  onSend: (content?: string) => void
  /** Called when the user clicks the Stop button during streaming. */
  onStop?: () => void
  /** Disables the send button (but shows the stop button when streaming). */
  disabled?: boolean
}

// ── MBAPromptBox ──────────────────────────────────────────────────────────────
//
// Compact prompt box used in the chat-state view (after messages exist).
// Renders a self-contained textarea + send/stop button row.
// When `disabled` is true and `onStop` is provided, the send button is replaced
// by a Stop button so the user can abort the in-flight streaming response.

export function MBAPromptBox({ onSend, onStop, disabled }: MBAPromptBoxProps) {
  const [value, setValue] = useState('')
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 52,
    maxHeight: 160,
  })

  const hasContent = value.trim().length > 0
  const isStreaming = !!disabled && !!onStop

  const handleSend = useCallback(() => {
    if (!hasContent || disabled) return
    const text = value
    setValue('')
    adjustHeight(true)
    onSend(text)
  }, [hasContent, disabled, value, onSend, adjustHeight])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      className={cn(
        'relative rounded-2xl border transition-all duration-200',
        'bg-gray-900/80 backdrop-blur-xl',
        'border-gray-700/60 shadow-[0_4px_24px_rgba(0,0,0,0.5)]',
        'focus-within:border-link-yellow/30 focus-within:shadow-[0_0_20px_rgba(245,196,0,0.06),0_4px_24px_rgba(0,0,0,0.5)]'
      )}
    >
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          adjustHeight()
        }}
        onKeyDown={handleKeyDown}
        placeholder="Pergunte sobre frameworks, cases ou conceitos do MBA..."
        disabled={isStreaming}
        className={cn(
          'w-full px-4 py-4 resize-none border-none min-h-[52px]',
          'bg-transparent text-white text-sm leading-relaxed',
          'focus-visible:ring-0 focus-visible:ring-offset-0',
          'placeholder:text-neutral-600'
        )}
        style={{ overflow: 'hidden' }}
      />

      {/* Footer bar */}
      <div className="flex items-center justify-between px-3.5 pb-3.5">
        <span className="text-[11px] text-neutral-700 hidden sm:block select-none">
          Enter para enviar · Shift+Enter nova linha
        </span>

        {isStreaming ? (
          // Stop button — visible during active streaming
          <Button
            onClick={onStop}
            className={cn(
              'ml-auto h-8 w-8 rounded-full p-0 transition-all duration-200',
              'bg-white/10 text-white hover:bg-red-500/80 hover:text-white',
              'shadow-[0_0_10px_rgba(255,255,255,0.08)]'
            )}
            aria-label="Parar geração"
          >
            <Square className="w-3.5 h-3.5" />
          </Button>
        ) : (
          // Send button — visible when not streaming
          <Button
            onClick={handleSend}
            disabled={!hasContent || !!disabled}
            className={cn(
              'ml-auto h-8 w-8 rounded-full p-0 transition-all duration-200',
              hasContent && !disabled
                ? 'bg-link-yellow text-gray-950 hover:brightness-110 shadow-[0_0_14px_rgba(245,196,0,0.45)]'
                : 'bg-white/5 text-white/20 cursor-not-allowed'
            )}
            aria-label="Enviar mensagem"
          >
            <ArrowUp className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
