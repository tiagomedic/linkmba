'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Message from './Message'
import ChatInput from './ChatInput'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Msg = { role: 'user' | 'assistant'; content: string }

const SUGGESTIONS = [
  { text: 'O que são OKRs?', emoji: '🎯' },
  { text: 'Explique o framework T2D3', emoji: '📈' },
  { text: 'Como funciona o SCRUM?', emoji: '🔄' },
  { text: 'Quais são os 5 modelos para $100M?', emoji: '💡' },
]

export default function ChatInterface({ userEmail }: { userEmail: string }) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(content: string) {
    if (!content.trim() || loading) return

    const newMessages: Msg[] = [...messages, { role: 'user', content }]
    setMessages([...newMessages, { role: 'assistant', content: '' }])
    setLoading(true)

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: newMessages }),
    })

    if (!response.ok || !response.body) {
      setLoading(false)
      return
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let accumulated = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const lines = decoder.decode(value).split('\n')
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6)
        if (data === '[DONE]') break
        try {
          const { text } = JSON.parse(data)
          accumulated += text
          setMessages((prev) => {
            const updated = [...prev]
            updated[updated.length - 1] = { role: 'assistant', content: accumulated }
            return updated
          })
        } catch {}
      }
    }

    setLoading(false)
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950">
      {/* Header */}
      <header className="bg-link-blue/95 backdrop-blur border-b border-blue-900/50 px-4 py-3 flex items-center justify-between flex-shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-link-yellow rounded shadow-[0_0_10px_rgba(245,196,0,0.4)]" />
          <span className="font-bold text-white tracking-wide">
            MBA LINK <span className="text-link-yellow">T3</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-blue-200/70 text-xs hidden sm:block">{userEmail}</span>
          <button
            onClick={logout}
            className="text-blue-300 hover:text-white text-sm transition-colors px-2 py-1 rounded hover:bg-white/10"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <AnimatePresence>
          {messages.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center h-full text-center gap-5 pb-16"
            >
              {/* Icon */}
              <div className="w-16 h-16 bg-link-blue rounded-2xl flex items-center justify-center border border-blue-800 shadow-[0_0_24px_rgba(0,48,135,0.4)]">
                <div className="w-8 h-8 bg-link-yellow rounded shadow-[0_0_12px_rgba(245,196,0,0.5)]" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-white">O que você quer aprender?</h1>
                <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
                  Baseado nos materiais das aulas do MBA LINK T3
                </p>
              </div>

              {/* Suggestions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg mt-2">
                {SUGGESTIONS.map((s) => (
                  <motion.button
                    key={s.text}
                    onClick={() => send(s.text)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-3 text-left text-sm text-gray-300 bg-gray-900 hover:bg-gray-800 rounded-xl px-4 py-3 transition-colors border border-gray-800 hover:border-link-yellow/40 group"
                  >
                    <span className="text-base">{s.emoji}</span>
                    <span className="group-hover:text-white transition-colors">{s.text}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map((msg, i) => (
                <Message key={i} role={msg.role} content={msg.content} />
              ))}

              {/* Typing indicator */}
              {loading && messages[messages.length - 1]?.content === '' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <div className="w-7 h-7 rounded-full bg-link-yellow flex-shrink-0 mt-1 shadow-[0_0_12px_rgba(245,196,0,0.3)]" />
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                    {[0, 0.15, 0.3].map((delay, i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 bg-link-yellow rounded-full"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay, ease: 'easeInOut' }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              <div ref={bottomRef} />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <ChatInput onSend={send} disabled={loading} />
    </div>
  )
}
