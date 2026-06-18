'use client'

import { motion } from 'framer-motion'
import React from 'react'

// ---------------------------------------------------------------------------
// Inline markdown renderer — no external deps
// Supports: # ## ### headers, **bold**, *italic*, `inline code`,
//           ```code blocks```, - / * / 1. lists, > blockquotes, --- hr,
//           line breaks preserved.
// ---------------------------------------------------------------------------

type Token =
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'blockquote'; text: string }
  | { type: 'hr' }
  | { type: 'code_block'; lang: string; code: string }
  | { type: 'paragraph'; text: string }

function parseBlocks(raw: string): Token[] {
  const tokens: Token[] = []
  const text = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  const segments: Array<{ kind: 'code'; lang: string; code: string } | { kind: 'text'; text: string }> = []
  const fenceRe = /```([^\n`]*)\n([\s\S]*?)```/g
  let lastIdx = 0
  let m: RegExpExecArray | null
  while ((m = fenceRe.exec(text)) !== null) {
    if (m.index > lastIdx) {
      segments.push({ kind: 'text', text: text.slice(lastIdx, m.index) })
    }
    segments.push({ kind: 'code', lang: m[1], code: m[2].trimEnd() })
    lastIdx = m.index + m[0].length
  }
  if (lastIdx < text.length) {
    segments.push({ kind: 'text', text: text.slice(lastIdx) })
  }

  for (const seg of segments) {
    if (seg.kind === 'code') {
      tokens.push({ type: 'code_block', lang: seg.lang, code: seg.code })
      continue
    }

    const lines = seg.text.split('\n')
    let i = 0
    while (i < lines.length) {
      const line = lines[i]

      if (line.trim() === '') { i++; continue }

      const headingMatch = line.match(/^(#{1,3})\s+(.+)$/)
      if (headingMatch) {
        tokens.push({ type: 'heading', level: headingMatch[1].length as 1 | 2 | 3, text: headingMatch[2] })
        i++; continue
      }

      if (/^---+$/.test(line.trim())) {
        tokens.push({ type: 'hr' })
        i++; continue
      }

      if (/^>\s?/.test(line)) {
        const bqLines: string[] = []
        while (i < lines.length && /^>\s?/.test(lines[i])) {
          bqLines.push(lines[i].replace(/^>\s?/, ''))
          i++
        }
        tokens.push({ type: 'blockquote', text: bqLines.join('\n') })
        continue
      }

      if (/^\s*[-*]\s+/.test(line)) {
        const items: string[] = []
        while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
          items.push(lines[i].replace(/^\s*[-*]\s+/, ''))
          i++
        }
        tokens.push({ type: 'ul', items })
        continue
      }

      if (/^\s*\d+\.\s+/.test(line)) {
        const items: string[] = []
        while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
          items.push(lines[i].replace(/^\s*\d+\.\s+/, ''))
          i++
        }
        tokens.push({ type: 'ol', items })
        continue
      }

      const paraLines: string[] = []
      while (
        i < lines.length &&
        lines[i].trim() !== '' &&
        !/^(#{1,3}\s|---+$|>\s?|[-*]\s|\d+\.\s)/.test(lines[i]) &&
        !/^```/.test(lines[i])
      ) {
        paraLines.push(lines[i])
        i++
      }
      if (paraLines.length > 0) {
        tokens.push({ type: 'paragraph', text: paraLines.join('\n') })
      }
    }
  }

  return tokens
}

function InlineText({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/)
  return (
    <>
      {parts.map((part, idx) => {
        if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
          return (
            <code key={idx} className="bg-gray-800 text-yellow-200 px-1 py-0.5 rounded text-[0.8em] font-mono">
              {part.slice(1, -1)}
            </code>
          )
        }
        const inlineParts = part.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/)
        return (
          <React.Fragment key={idx}>
            {inlineParts.map((ip, j) => {
              if (ip.startsWith('**') && ip.endsWith('**') && ip.length > 4) {
                return <strong key={j} className="font-semibold text-white">{ip.slice(2, -2)}</strong>
              }
              if (ip.startsWith('*') && ip.endsWith('*') && ip.length > 2) {
                return <em key={j} className="italic text-gray-200">{ip.slice(1, -1)}</em>
              }
              const lines = ip.split('\n')
              return (
                <React.Fragment key={j}>
                  {lines.map((l, li) => (
                    <React.Fragment key={li}>
                      {l}
                      {li < lines.length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </React.Fragment>
              )
            })}
          </React.Fragment>
        )
      })}
    </>
  )
}

function MarkdownRenderer({ content }: { content: string }) {
  const tokens = parseBlocks(content)
  return (
    <div className="space-y-2">
      {tokens.map((token, idx) => {
        switch (token.type) {
          case 'heading': {
            const headingClasses: Record<1 | 2 | 3, string> = {
              1: 'text-base font-bold text-link-yellow mt-3 mb-1 leading-snug',
              2: 'text-sm font-bold text-link-yellow mt-2 mb-0.5 leading-snug',
              3: 'text-sm font-semibold text-yellow-300 mt-2 mb-0.5 leading-snug',
            }
            return <p key={idx} className={headingClasses[token.level]}><InlineText text={token.text} /></p>
          }
          case 'ul':
            return (
              <ul key={idx} className="space-y-1 pl-1">
                {token.items.map((item, ii) => (
                  <li key={ii} className="flex gap-2 items-start">
                    <span className="text-link-yellow mt-1 text-[10px] leading-none flex-shrink-0">●</span>
                    <span className="text-gray-100 leading-relaxed"><InlineText text={item} /></span>
                  </li>
                ))}
              </ul>
            )
          case 'ol':
            return (
              <ol key={idx} className="space-y-1 pl-1">
                {token.items.map((item, ii) => (
                  <li key={ii} className="flex gap-2 items-start">
                    <span className="text-link-yellow font-semibold text-xs flex-shrink-0 min-w-[1.1rem]">{ii + 1}.</span>
                    <span className="text-gray-100 leading-relaxed"><InlineText text={item} /></span>
                  </li>
                ))}
              </ol>
            )
          case 'blockquote':
            return (
              <blockquote key={idx} className="border-l-2 border-link-yellow pl-3 text-gray-300 italic text-sm">
                <InlineText text={token.text} />
              </blockquote>
            )
          case 'hr':
            return <hr key={idx} className="border-gray-700 my-2" />
          case 'code_block':
            return (
              <div key={idx} className="rounded-lg bg-gray-950 border border-gray-800 overflow-x-auto my-1">
                {token.lang && (
                  <div className="px-3 py-1 text-[10px] text-gray-500 border-b border-gray-800 font-mono uppercase tracking-wider">{token.lang}</div>
                )}
                <pre className="px-3 py-2 text-xs font-mono text-gray-200 leading-relaxed whitespace-pre">{token.code}</pre>
              </div>
            )
          case 'paragraph':
            return <p key={idx} className="text-gray-100 leading-relaxed"><InlineText text={token.text} /></p>
          default:
            return null
        }
      })}
    </div>
  )
}

function StreamingCursor() {
  return (
    <span className="inline-flex gap-0.5 items-center ml-0.5" aria-label="Escrevendo...">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1 h-1 rounded-full bg-link-yellow inline-block"
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
        />
      ))}
    </span>
  )
}

export default function Message({
  role,
  content,
  isStreaming = false,
}: {
  role: 'user' | 'assistant'
  content: string
  /**
   * Explicitly signals that this assistant message is still being streamed.
   * Pass `true` only for the last assistant message while loading is active.
   * Avoids using a content-length heuristic that would show a cursor for short
   * but complete replies such as "Sim", "OK", or "Não".
   */
  isStreaming?: boolean
}) {
  // Show the animated cursor only when the parent explicitly says so AND the
  // content is still empty (i.e. no tokens have arrived yet).
  const showCursor = role === 'assistant' && isStreaming && content.length === 0

  if (role === 'user') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="flex justify-end gap-2.5 items-end"
      >
        <div className="bg-blue-900/30 border border-blue-800/40 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%] text-sm leading-relaxed shadow-md">
          {content}
        </div>
        <div className="w-7 h-7 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center text-[11px] font-semibold text-gray-300 shadow">
          U
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="flex gap-2.5 items-start"
    >
      <div
        className="w-7 h-7 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center text-[11px] font-bold text-gray-900 shadow-[0_0_12px_rgba(245,196,0,0.35)]"
        style={{ background: '#F5C400' }}
        aria-label="Marco — tutor MBA"
      >
        M
      </div>
      <div className="bg-gray-900/60 border border-gray-800/60 text-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 text-sm max-w-[85%] shadow-md min-w-[4rem]">
        {showCursor ? <StreamingCursor /> : <MarkdownRenderer content={content} />}
      </div>
    </motion.div>
  )
}
