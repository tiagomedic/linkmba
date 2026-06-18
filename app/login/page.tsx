'use client'

import { useState, useRef, FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErrorMessage('')

    if (!email.endsWith('@aluno.lsb.com.br')) {
      setState('error')
      setErrorMessage('Use seu email de aluno @aluno.lsb.com.br')
      return
    }

    setState('loading')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin + '/chat',
      },
    })

    if (error) {
      const PT_ERRORS: Record<string, string> = {
        'Email rate limit exceeded': 'Limite de emails atingido — aguarde alguns minutos',
        'Email link is invalid or has expired': 'Link inválido ou expirado — solicite um novo',
        'For security purposes, you can only request this after': 'Por segurança, aguarde alguns segundos antes de tentar novamente',
        'Signups not allowed for this instance': 'Cadastro não permitido — use seu email institucional',
        'Unable to validate email address: invalid format': 'Formato de email inválido',
      }
      setState('error')
      const matchedKey = Object.keys(PT_ERRORS).find((key) =>
        error.message.includes(key)
      )
      setErrorMessage(matchedKey ? PT_ERRORS[matchedKey] : error.message)
      return
    }

    setState('success')
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #070b14 0%, #0c1628 50%, #070b14 100%)',
      }}
    >
      {/* Blue glow top-right */}
      <div
        className="pointer-events-none absolute"
        style={{
          top: '-120px',
          right: '-120px',
          width: '480px',
          height: '480px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      {/* Yellow glow bottom-left */}
      <div
        className="pointer-events-none absolute"
        style={{
          bottom: '-100px',
          left: '-100px',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(250,204,21,0.12) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo + header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-3 mb-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: '#facc15' }}
            >
              <span className="text-gray-950 font-black text-base leading-none">L</span>
            </div>
            <span className="text-sm font-semibold text-gray-300 tracking-wide">
              Link School of Business
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">
            MBA LINK <span style={{ color: '#facc15' }}>T3</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">Acesse com seu email de aluno</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-6 border"
          style={{
            background: 'rgba(12, 22, 40, 0.85)',
            borderColor: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {state === 'success' ? (
            <div className="text-center py-4 space-y-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
                style={{ background: 'rgba(34,197,94,0.15)', border: '1.5px solid rgba(34,197,94,0.4)' }}
              >
                <svg
                  className="w-6 h-6"
                  style={{ color: '#22c55e' }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold text-base">Verifique seu email</p>
                <p className="text-gray-400 text-sm mt-1">
                  Enviamos o link de acesso para
                </p>
                <p className="text-sm mt-0.5" style={{ color: '#facc15' }}>{email}</p>
              </div>
              <p className="text-gray-500 text-xs">
                Clique no link do email para entrar. Verifique também sua pasta de spam.
              </p>
              <button
                type="button"
                onClick={() => { setState('idle'); setEmail('') }}
                className="text-sm text-gray-400 hover:text-white transition-colors underline underline-offset-2"
              >
                Usar outro email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Email institucional
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (state === 'error') setState('idle')
                  }}
                  placeholder="nome@aluno.lsb.com.br"
                  required
                  autoComplete="email"
                  className="w-full rounded-lg px-4 py-3 text-white text-sm placeholder-gray-600 transition-all outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: state === 'error'
                      ? '1.5px solid rgba(239,68,68,0.7)'
                      : '1.5px solid rgba(255,255,255,0.1)',
                    boxShadow: state === 'error'
                      ? '0 0 0 3px rgba(239,68,68,0.08)'
                      : undefined,
                  }}
                  onFocus={(e) => {
                    if (state !== 'error') {
                      e.currentTarget.style.border = '1.5px solid rgba(250,204,21,0.6)'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(250,204,21,0.08)'
                    }
                  }}
                  onBlur={(e) => {
                    if (state !== 'error') {
                      e.currentTarget.style.border = '1.5px solid rgba(255,255,255,0.1)'
                      e.currentTarget.style.boxShadow = ''
                    }
                  }}
                />
              </div>

              {state === 'error' && errorMessage && (
                <div
                  className="flex items-start gap-2 rounded-lg px-3 py-2.5"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}
                >
                  <svg
                    className="w-4 h-4 flex-shrink-0 mt-0.5"
                    style={{ color: '#ef4444' }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  <p className="text-xs" style={{ color: '#f87171' }}>{errorMessage}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={state === 'loading' || !email}
                className="w-full font-bold py-3 rounded-lg transition-all text-sm flex items-center justify-center gap-2"
                style={{
                  background: state === 'loading' || !email ? 'rgba(250,204,21,0.5)' : '#facc15',
                  color: '#111827',
                  cursor: state === 'loading' || !email ? 'not-allowed' : 'pointer',
                }}
              >
                {state === 'loading' ? (
                  <>
                    <svg
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    Enviando link...
                  </>
                ) : (
                  'Entrar'
                )}
              </button>

              <p className="text-center text-xs text-gray-500">
                Você receberá um link mágico de acesso
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
