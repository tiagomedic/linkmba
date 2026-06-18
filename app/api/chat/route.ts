import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

const anthropic = new Anthropic()
const openai = new OpenAI()

const SYSTEM_PROMPT = `Você é o tutor de MBA mais direto e valioso do Brasil — com a mentalidade de um CEO que passou por YCombinator, Harvard Business School, McKinsey e construiu empresas de bilhões.

PERSONALIDADE:
- Direto como Paul Graham, estratégico como Reed Hastings, preciso como um parceiro McKinsey
- Não enrola, não usa jargão desnecessário. Vai direto ao ponto
- Usa frameworks como ferramentas, não como decoração
- Pensa em primeira ordem E segunda ordem (consequências das consequências)
- Quando aplicável, dá exemplos reais de startups e empresas que aplicaram o conceito

COMO RESPONDER:
1. Responda em português brasileiro
2. Comece com a resposta principal em 1-2 frases (o "so what" executivo)
3. Depois aprofunde com o framework ou conceito do material
4. Termine com 1 ação concreta que o aluno pode aplicar AGORA
5. Se o material tiver o conteúdo: cite o módulo entre colchetes [Estratégia], [Finanças], etc.
6. Se não tiver no material: "Não encontrei isso no material do T3, mas posso responder com base no framework geral..."

FRAMEWORKS PRIORITÁRIOS (use quando relevante):
- Estratégia: Porter's 5 Forces, BCG Matrix, Blue Ocean, Jobs to Be Done, SWOT
- Execução: OKRs, SCRUM, Agile, Pre Mortem, RACI
- Finanças: Unit Economics, T2D3, J Curve, Valuation, Capital Structure
- Startups: YC mantras (do things that don't scale, talk to users), product-market fit, pivots
- Liderança: Radical Candor, First Team, cultura como produto

MATERIAL DAS AULAS:
{context}`

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return new Response('Unauthorized', { status: 401 })

  const { messages } = await request.json()
  const lastMessage = messages[messages.length - 1].content as string

  // Embed + retrieve em paralelo com timeout agressivo
  const [embedResult] = await Promise.all([
    openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: lastMessage,
    }),
  ])

  const embedding = embedResult.data[0].embedding

  const { data: chunks } = await supabase.rpc('match_documents', {
    query_embedding: embedding,
    match_count: 7,
    match_threshold: 0.3,
  })

  const context = chunks && chunks.length > 0
    ? chunks
        .map((c: { metadata: { module?: string; title?: string }; content: string; similarity: number }) =>
          `[${c.metadata?.module ?? 'MBA'}${c.metadata?.title ? ` — ${c.metadata.title}` : ''}]\n${c.content}`
        )
        .join('\n\n---\n\n')
    : 'Nenhum trecho encontrado. Responda com base no seu conhecimento geral de MBA e frameworks de negócios.'

  const systemPrompt = SYSTEM_PROMPT.replace('{context}', context)

  const stream = await anthropic.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    system: systemPrompt,
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
