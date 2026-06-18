'use client'

import { useState, useRef, useEffect } from 'react'
import Message from './Message'
import ChatInput from './ChatInput'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Msg = { role: 'user' | 'assistant'; content: string }

const SUGGESTIONS = [
  'O que são OKRs?',
  'Explique o framework T2D3',
  'Como funciona o SCRUM?',
  'Quais são os 5 modelos para $100M?',
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
          setMessages(prev => {
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
      <header className="bg-link-blue border-b border-blue-900 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-link-yellow rounded" />
          <span className="font-bold text-white text-lg">
            MBA LINK <span className="text-link-yellow">T3</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-blue-200 text-sm hidden sm:block">{userEmail}</span>
          <button
            onClick={logout}
            className="text-blue-300 hover:text-white text-sm transition"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 pb-16">
            <div className="w-16 h-16 bg-link-blue rounded-2xl flex items-center justify-center border border-blue-800">
              <div className="w-8 h-8 bg-link-yellow rounded" />
            </div>
            <h1 className="text-2xl font-bold text-white">O que você quer aprender hoje?</h1>
            <p className="text-gray-400 text-sm max-w-sm">
              Pergunte qualquer coisa sobre o material do MBA. Baseado nas aulas do LINK T3.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 w-full max-w-lg">
              {SUGGESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="text-left text-sm text-gray-300 bg-gray-900 hover:bg-gray-800 rounded-xl px-4 py-3 transition border border-gray-800 hover:border-link-yellow"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((msg, i) => (
              <Message key={i} role={msg.role} content={msg.content} />
            ))}
            {loading && messages[messages.length - 1]?.content === '' && (
              <div className="flex gap-1.5 px-4 py-2">
                {[0, 150, 300].map(delay => (
                  <div
                    key={delay}
                    className="w-2 h-2 bg-link-yellow rounded-full animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={send} disabled={loading} />
    </div>
  )
}
