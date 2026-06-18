'use client'

import { MBAPromptBox } from '@/components/ui/ai-prompt-box'

interface ChatInputProps {
  onSend: (msg: string) => void
  disabled: boolean
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  return (
    <div className="border-t border-gray-800 px-4 py-4 flex-shrink-0 bg-gray-950">
      <div className="max-w-3xl mx-auto">
        <MBAPromptBox onSend={onSend} disabled={disabled} />
      </div>
    </div>
  )
}
