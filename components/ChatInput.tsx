'use client'

import { useState, useRef } from 'react'

export default function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (msg: string) => void
  disabled: boolean
}) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function submit() {
    if (!value.trim() || disabled) return
    onSend(value.trim())
    setValue('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  function handleInput() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }

  return (
    <div className="border-t border-gray-800 px-4 py-4 flex-shrink-0 bg-gray-950">
      <div className="max-w-3xl mx-auto flex gap-3 items-end bg-gray-900 border border-gray-700 focus-within:border-link-yellow rounded-xl p-3 transition-colors">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="Pergunte sobre o material do MBA..."
          rows={1}
          disabled={disabled}
          className="flex-1 bg-transparent text-white placeholder-gray-500 resize-none focus:outline-none text-sm leading-relaxed disabled:opacity-50"
        />
        <button
          onClick={submit}
          disabled={disabled || !value.trim()}
          className="bg-link-yellow text-gray-950 rounded-lg p-2 hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <p className="text-center text-xs text-gray-600 mt-2">
        Enter para enviar · Shift+Enter para nova linha
      </p>
    </div>
  )
}
