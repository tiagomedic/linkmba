import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

const anthropic = new Anthropic()
const openai = new OpenAI()

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return new Response('Unauthorized', { status: 401 })

  const { messages } = await request.json()
  const lastMessage = messages[messages.length - 1].content as string

  // 1. Embed the question
  const { data: [{ embedding }] } = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: lastMessage,
  })

  // 2. Find relevant chunks
  const { data: chunks } = await supabase.rpc('match_documents', {
    query_embedding: embedding,
    match_count: 5,
  })

  const context = chunks
    ?.map((c: { metadata: { module?: string }; content: string }) =>
      `[${c.metadata?.module ?? 'MBA'}]\n${c.content}`
    )
    .join('\n\n---\n\n') ?? 'Nenhum material encontrado.'

  // 3. Stream Claude response
  const stream = await anthropic.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: `Você é o assistente do MBA LINK T3. Responda em português com base no material abaixo. Seja direto e cite o módulo quando relevante. Se a resposta não estiver no material, diga claramente.\n\nMATERIAL DO MBA:\n${context}`,
    messages,
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`)
          )
        }
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
