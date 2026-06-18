'use client'

import React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { ArrowUp, Square } from 'lucide-react'
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
      'z-50 overflow-hidden rounded-md border border-gray-700 bg-gray-900 px-3 py-1.5 text-xs text-white shadow-md animate-in fade-in-0 zoom-in-95',
      className
    )}
    {...props}
  />
))
TooltipContent.displayName = 'TooltipContent'

// ── Context ───────────────────────────────────────────────────────────────────
interface PromptInputContextType {
  isLoading: boolean
  value: string
  setValue: (value: string) => void
  maxHeight: number | string
  onSubmit?: () => void
  disabled?: boolean
}
const PromptInputContext = React.createContext<PromptInputContextType>({
  isLoading: false,
  value: '',
  setValue: () => {},
  maxHeight: 240,
})
const usePromptInput = () => React.useContext(PromptInputContext)

// ── Textarea ──────────────────────────────────────────────────────────────────
const PromptTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { disableAutosize?: boolean }
>(({ className, onKeyDown, disableAutosize, ...props }, _ref) => {
  const { value, setValue, maxHeight, onSubmit, disabled } = usePromptInput()
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  React.useEffect(() => {
    if (disableAutosize || !textareaRef.current) return
    textareaRef.current.style.height = 'auto'
    const scrollH = textareaRef.current.scrollHeight
    textareaRef.current.style.height =
      typeof maxHeight === 'number'
        ? `${Math.min(scrollH, maxHeight)}px`
        : `min(${scrollH}px, ${maxHeight})`
  }, [value, maxHeight, disableAutosize])

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          onSubmit?.()
        }
        onKeyDown?.(e)
      }}
      disabled={disabled}
      rows={1}
      className={cn(
        'w-full bg-transparent px-3 py-2.5 text-sm text-gray-100 placeholder:text-gray-500',
        'focus-visible:outline-none resize-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        '[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-700',
        className
      )}
      {...props}
    />
  )
})
PromptTextarea.displayName = 'PromptTextarea'

// ── Main export ───────────────────────────────────────────────────────────────
interface MBAPromptBoxProps {
  onSend: (message: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

export const MBAPromptBox = React.forwardRef<HTMLDivElement, MBAPromptBoxProps>(
  ({ onSend, disabled = false, placeholder = 'Pergunte sobre o material do MBA...', className }, ref) => {
    const [input, setInput] = React.useState('')
    const hasContent = input.trim().length > 0

    const handleSubmit = () => {
      if (!hasContent || disabled) return
      onSend(input.trim())
      setInput('')
    }

    return (
      <TooltipProvider>
        <PromptInputContext.Provider
          value={{
            isLoading: disabled,
            value: input,
            setValue: setInput,
            maxHeight: 200,
            onSubmit: handleSubmit,
            disabled,
          }}
        >
          <div
            ref={ref}
            className={cn(
              'rounded-2xl border bg-gray-900 p-2 shadow-[0_8px_30px_rgba(0,0,0,0.4)] transition-all duration-300',
              'border-gray-700 focus-within:border-link-yellow/60',
              disabled && 'opacity-70',
              className
            )}
          >
            <PromptTextarea placeholder={placeholder} />

            {/* Actions row */}
            <div className="flex items-center justify-between pt-1 px-1">
              {/* Left: hint */}
              <span className="text-[11px] text-gray-600 select-none hidden sm:block">
                Enter para enviar · Shift+Enter nova linha
              </span>

              {/* Right: send button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    onClick={handleSubmit}
                    disabled={!hasContent || disabled}
                    whileTap={{ scale: 0.92 }}
                    className={cn(
                      'ml-auto h-8 w-8 rounded-full flex items-center justify-center transition-all duration-200',
                      hasContent && !disabled
                        ? 'bg-link-yellow text-gray-950 shadow-md hover:brightness-110'
                        : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    )}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {disabled ? (
                        <motion.span
                          key="stop"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          <Square className="h-3.5 w-3.5 fill-current" />
                        </motion.span>
                      ) : (
                        <motion.span
                          key="send"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {disabled ? 'Gerando...' : hasContent ? 'Enviar' : 'Digite algo'}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </PromptInputContext.Provider>
      </TooltipProvider>
    )
  }
)
MBAPromptBox.displayName = 'MBAPromptBox'
