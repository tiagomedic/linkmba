'use client'

import { MBAPromptBox } from '@/components/ui/ai-prompt-box'

interface ChatInputProps {
  onSend: (msg: string) => void
  disabled: boolean
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  return (
    <div className="px-4 pb-5 pt-3 flex-shrink-0 bg-gradient-to-t from-gray-950 via-gray-950 to-transparent">
      <div className="max-w-3xl mx-auto">
        <MBAPromptBox onSend={onSend} disabled={disabled} />
      </div>
    </div>
  )
}
