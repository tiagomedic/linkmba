'use client'

import React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { ArrowUp, Square, BookOpen, Layers, Lightbulb } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const cn = (...classes: (string | undefined | null | false)[]) =>
  classes.filter(Boolean).join(' ')

// ── Tooltip ──────────────────────────────────────────────────────────────────
const TooltipProvider = TooltipPrimitive.Provider
const Tooltip = TooltipPrimitive.Root
const TooltipTrigger = TooltipPrimitive.Trigger
const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      'z-50 overflow-hidden rounded-lg border border-gray-700 bg-gray-900 px-3 py-1.5 text-xs text-white shadow-lg',
      'animate-in fade-in-0 zoom-in-95',
      className
    )}
    {...props}
  />
))
TooltipContent.displayName = 'TooltipContent'

// ── Divider ───────────────────────────────────────────────────────────────────
const Divider = () => (
  <div className="h-5 w-px bg-gray-700/60 mx-0.5 flex-shrink-0" />
)

// ── Main Component ────────────────────────────────────────────────────────────
interface MBAPromptBoxProps {
  onSend: (message: string) => void
  disabled?: boolean
  placeholder?: string
}

export const MBAPromptBox = React.forwardRef<HTMLDivElement, MBAPromptBoxProps>(
  ({ onSend, disabled = false, placeholder = 'Pergunte sobre o material do MBA...' }, ref) => {
    const [input, setInput] = React.useState('')
    const [activeMode, setActiveMode] = React.useState<'none' | 'modulos' | 'resumo'>('none')
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)
    const hasContent = input.trim().length > 0

    // Auto-resize textarea
    React.useEffect(() => {
      const el = textareaRef.current
      if (!el) return
      el.style.height = 'auto'
      el.style.height = `${Math.min(el.scrollHeight, 200)}px`
    }, [input])

    const handleSubmit = () => {
      if (!hasContent || disabled) return
      const prefix = activeMode === 'modulos' ? '[Módulos] ' : activeMode === 'resumo' ? '[Resumo] ' : ''
      onSend(prefix + input.trim())
      setInput('')
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
    }

    const toggleMode = (mode: 'modulos' | 'resumo') => {
      setActiveMode((prev) => (prev === mode ? 'none' : mode))
    }

    const modePlaceholders = {
      none: placeholder,
      modulos: 'Filtre por módulo...',
      resumo: 'Peça um resumo do conteúdo...',
    }

    return (
      <TooltipProvider>
        <div
          ref={ref}
          className={cn(
            'w-full rounded-3xl border p-2',
            'bg-[#12131a] border-gray-700/60',
            'shadow-[0_8px_32px_rgba(0,0,0,0.5)]',
            'transition-all duration-300',
            !disabled && 'focus-within:border-link-yellow/50 focus-within:shadow-[0_8px_40px_rgba(245,196,0,0.08)]'
          )}
        >
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={modePlaceholders[activeMode]}
            rows={1}
            className={cn(
              'w-full bg-transparent px-3 pt-2.5 pb-1 text-sm text-gray-100',
              'placeholder:text-gray-600 focus:outline-none resize-none',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              '[&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-700'
            )}
          />

          {/* Bottom bar */}
          <div className="flex items-center justify-between px-1 pt-1 pb-0.5">
            {/* Left: mode toggles */}
            <div className="flex items-center gap-0.5">

              {/* Módulos */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => toggleMode('modulos')}
                    disabled={disabled}
                    className={cn(
                      'flex items-center gap-1.5 h-8 px-2.5 rounded-full text-xs font-medium border transition-all duration-200',
                      activeMode === 'modulos'
                        ? 'bg-link-yellow/15 border-link-yellow text-link-yellow'
                        : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
                    )}
                  >
                    <motion.div
                      animate={{ rotate: activeMode === 'modulos' ? 360 : 0 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    >
                      <Layers className="w-3.5 h-3.5" />
                    </motion.div>
                    <AnimatePresence>
                      {activeMode === 'modulos' && (
                        <motion.span
                          initial={{ width: 0, opacity: 0 }}
                          animate={{ width: 'auto', opacity: 1 }}
                          exit={{ width: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="overflow-hidden whitespace-nowrap"
                        >
                          Módulos
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                </TooltipTrigger>
                <TooltipContent>Filtrar por módulo</TooltipContent>
              </Tooltip>

              <Divider />

              {/* Resumo */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => toggleMode('resumo')}
                    disabled={disabled}
                    className={cn(
                      'flex items-center gap-1.5 h-8 px-2.5 rounded-full text-xs font-medium border transition-all duration-200',
                      activeMode === 'resumo'
                        ? 'bg-link-blue/20 border-blue-500 text-blue-400'
                        : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
                    )}
                  >
                    <motion.div
                      animate={{ rotate: activeMode === 'resumo' ? 360 : 0 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                    </motion.div>
                    <AnimatePresence>
                      {activeMode === 'resumo' && (
                        <motion.span
                          initial={{ width: 0, opacity: 0 }}
                          animate={{ width: 'auto', opacity: 1 }}
                          exit={{ width: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="overflow-hidden whitespace-nowrap"
                        >
                          Resumo
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                </TooltipTrigger>
                <TooltipContent>Pedir resumo do conteúdo</TooltipContent>
              </Tooltip>

              <Divider />

              {/* Dica */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    disabled
                    className="flex items-center gap-1.5 h-8 px-2.5 rounded-full text-xs border border-transparent text-gray-600 cursor-default"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Baseado nos materiais do MBA</TooltipContent>
              </Tooltip>
            </div>

            {/* Right: send button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  onClick={handleSubmit}
                  disabled={(!hasContent && !disabled) || (disabled && !hasContent)}
                  whileTap={{ scale: 0.88 }}
                  className={cn(
                    'h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0',
                    'transition-all duration-200',
                    hasContent && !disabled
                      ? 'bg-link-yellow text-gray-950 shadow-[0_0_12px_rgba(245,196,0,0.35)] hover:brightness-110'
                      : disabled
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  )}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {disabled ? (
                      <motion.span
                        key="stop"
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 90 }}
                        transition={{ duration: 0.15 }}
                      >
                        <Square className="h-3 w-3 fill-current" />
                      </motion.span>
                    ) : (
                      <motion.span
                        key="send"
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 90 }}
                        transition={{ duration: 0.15 }}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {disabled ? 'Gerando...' : hasContent ? 'Enviar (Enter)' : 'Digite algo'}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>
    )
  }
)
MBAPromptBox.displayName = 'MBAPromptBox'
