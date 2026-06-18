import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

const anthropic = new Anthropic()
const openai = new OpenAI()

interface MessageParam {
  role: 'user' | 'assistant'
  content: string
}

interface DocumentChunk {
  id: string
  content: string
  metadata: {
    module?: string
    title?: string
    file?: string
    chunk_index?: number
  }
  similarity: number
}

const ALLOWED_EMAIL_DOMAIN = '@aluno.lsb.com.br'
const MAX_MESSAGES = 50
const MAX_CONTENT_LENGTH = 8000
const MATCH_COUNT = 15
const MATCH_THRESHOLD = 0.25
const SIMILARITY_FLOOR = 0.40
const TOP_K_CHUNKS = 8
const MULTI_TURN_LOOKBACK = 3

const SYSTEM_PROMPT = `Você é Marco, tutor sênior do MBA LINK T3 — ex-sócio McKinsey, fundador de duas startups de sucesso e professor convidado de Harvard Business School.

Seu trabalho é transformar conceitos de MBA em vantagem competitiva real para alunos brasileiros. Você não é professor. Você é o sócio sênior que fala a verdade na cara dura.

IDENTIDADE E VOZ:
- Direto como Paul Graham: sem aquecimento, vai ao ponto na primeira frase
- Preciso como um parceiro McKinsey: usa o framework certo, não o mais famoso
- Estratégico como Reid Hoffman: enxerga 2ª e 3ª ordem das consequências
- Honesto: quando o material não cobre o tema, diz isso sem cerimônia e entrega valor mesmo assim
- Tom: inteligência executiva. CEO conversando com um MBA promissor — sem bajulação, sem condescendência, sem emojis

FORMATO OBRIGATÓRIO (siga sempre esta estrutura exata):

1. DIAGNÓSTICO DIRETO — 1 a 2 frases. O "so what" executivo. A conclusão ANTES da explicação.
2. FRAMEWORK / CONCEITO — Aprofunde com o conceito ou framework relevante. Se o material da aula cobrir o tema, cite a fonte no início do parágrafo: [NomeDoMódulo — Título]. Se NÃO cobrir, escreva em itálico: *(Fora do material T3 — framework geral)* e continue respondendo com valor.
3. Ação: uma ação específica e mensurável que o aluno pode executar hoje ou esta semana.

REGRAS DE FORMATAÇÃO:
- Texto corrido com parágrafos curtos. Use **negrito** apenas para termos-chave, não como decoração
- Listas apenas quando há 3 ou mais itens genuinamente paralelos
- Nunca use headers (##, ###) — a estrutura já é clara pelo conteúdo
- Máximo 350 palavras. Se precisar de mais, pergunte se o aluno quer aprofundar
- NUNCA comece com "Ótima pergunta", "Claro!", "Certamente" ou qualquer validação vazia

ANTI-PADRÕES PROIBIDOS:
- "Depende do contexto" sem especificar do quê depende e por quê
- Listas com 8+ itens que parecem slides de consultoria
- Explicar o que você vai fazer antes de fazer
- Hedges sem valor: "pode ser que", "talvez", "em alguns casos"
- Repetir a pergunta do aluno de volta

PREFIXOS INJETADOS PELA UI — interprete assim:
- "[Módulos] pergunta" → o aluno quer saber de qual módulo/aula aquele conceito vem. Priorize citar a fonte do material com [Módulo — Título].
- "[Resumo] pergunta" → o aluno quer resumo denso. Estruture como: conceito central → 3 pontos críticos → aplicação prática. Sempre termine com "Ação:".

FRAMEWORKS — USE O CERTO, NÃO O MAIS FAMOSO:
- Posicionamento: Porter's 5 Forces, Blue Ocean, Jobs to Be Done
- Execução: OKRs, RACI, Pre Mortem, SCRUM
- Finanças e crescimento: Unit Economics, T2D3, J Curve, Valuation, CAC/LTV
- Startups e produto: YC mantras (talk to users, do things that don't scale), PMF, pivots
- Liderança: Radical Candor, First Team, cultura como produto

CONTEXTO DE CONTINUAÇÃO:
- Se a pergunta atual for desdobramento de uma anterior, conecte explicitamente: "Seguindo o que discutimos sobre X..."
- Se a pergunta for ambígua, faça UMA pergunta de clarificação — nunca duas

MATERIAL DAS AULAS (recuperado semanticamente — use como fonte primária):
{context}`

function stripModePrefix(text: string): string {
  return text
    .replace(/^\[Módulos\]\s*/i, '')
    .replace(/^\[Resumo\]\s*/i, '')
    .trim()
}

function buildMultiTurnQuery(messages: MessageParam[]): string {
  const userMessages = messages
    .filter((m) => m.role === 'user')
    .slice(-MULTI_TURN_LOOKBACK)
    .map((m) => stripModePrefix(m.content))
  return userMessages.join(' | ')
}

function deduplicateChunks(chunks: DocumentChunk[]): DocumentChunk[] {
  const seen = new Set<string>()
  const result: DocumentChunk[] = []
  for (const chunk of chunks) {
    const key =
      chunk.metadata?.file && chunk.metadata?.chunk_index != null
        ? `${chunk.metadata.file}::${chunk.metadata.chunk_index}`
        : chunk.content.slice(0, 120)
    if (!seen.has(key)) {
      seen.add(key)
      result.push(chunk)
    }
  }
  return result
}

function assembleContext(chunks: DocumentChunk[]): string {
  if (chunks.length === 0) {
    return 'Nenhum trecho relevante encontrado no material T3. Responda com base em frameworks gerais de MBA e sinalize que está fora do material.'
  }

  const byModule = new Map<string, DocumentChunk[]>()
  for (const chunk of chunks) {
    const module = chunk.metadata?.module ?? 'MBA LINK T3'
    if (!byModule.has(module)) byModule.set(module, [])
    byModule.get(module)!.push(chunk)
  }

  const sections: string[] = []
  for (const [module, moduleChunks] of byModule) {
    const texts = moduleChunks.map((c) => {
      const title = c.metadata?.title ? ` — ${c.metadata.title}` : ''
      return `[${module}${title}]\n${c.content}`
    })
    sections.push(texts.join('\n\n'))
  }

  return sections.join('\n\n---\n\n')
}

function sanitizeMessages(raw: unknown): MessageParam[] {
  if (!Array.isArray(raw)) throw new Error('messages must be an array')
  if (raw.length === 0) throw new Error('messages array is empty')
  if (raw.length > MAX_MESSAGES) throw new Error(`messages array exceeds maximum of ${MAX_MESSAGES}`)

  return raw.map((item, i) => {
    if (typeof item !== 'object' || item === null)
      throw new Error(`messages[${i}] is not an object`)
    const obj = item as Record<string, unknown>
    if (obj.role !== 'user' && obj.role !== 'assistant')
      throw new Error(`messages[${i}].role must be 'user' or 'assistant', got '${obj.role}'`)
    if (typeof obj.content !== 'string')
      throw new Error(`messages[${i}].content must be a string`)
    if (obj.content.length > MAX_CONTENT_LENGTH)
      throw new Error(`messages[${i}].content exceeds ${MAX_CONTENT_LENGTH} characters`)
    return { role: obj.role, content: obj.content }
  })
}

export async function POST(request: Request): Promise<Response> {
  let supabase: Awaited<ReturnType<typeof createClient>>
  try {
    supabase = await createClient()
  } catch {
    return new Response(JSON.stringify({ error: 'Erro ao inicializar cliente de banco de dados' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Não autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!user.email?.endsWith(ALLOWED_EMAIL_DOMAIN)) {
    // Do NOT call supabase.auth.signOut() here: server-side Supabase clients have
    // no access to the browser's cookie jar, so the call cannot reliably invalidate
    // the session and may silently terminate unrelated sessions in shared contexts.
    // The client should handle sign-out on receiving this 403 response.
    return new Response(JSON.stringify({ error: 'Acesso restrito a alunos do MBA LINK T3' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let messages: MessageParam[]
  try {
    const body: unknown = await request.json()
    const raw = (body as Record<string, unknown>)?.messages
    messages = sanitizeMessages(raw)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Requisição inválida'
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const queryText = buildMultiTurnQuery(messages)

  let embedding: number[]
  try {
    const embedResult = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: queryText,
    })
    embedding = embedResult.data[0].embedding
  } catch (err) {
    console.error('[chat/route] OpenAI embedding error:', err)
    return new Response(
      JSON.stringify({ error: 'Erro ao processar sua pergunta. Tente novamente.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  let rawChunks: DocumentChunk[] = []
  try {
    const { data, error: rpcError } = await supabase.rpc('match_documents', {
      query_embedding: embedding,
      match_count: MATCH_COUNT,
      match_threshold: MATCH_THRESHOLD,
    })
    if (rpcError) {
      console.error('[chat/route] Supabase RPC error:', rpcError)
    } else if (Array.isArray(data)) {
      rawChunks = data as DocumentChunk[]
    }
  } catch (err) {
    console.error('[chat/route] Supabase RPC exception:', err)
  }

  const filteredChunks = rawChunks
    .filter((c) => typeof c.similarity === 'number' && c.similarity >= SIMILARITY_FLOOR)
    .sort((a, b) => b.similarity - a.similarity)

  const dedupedChunks = deduplicateChunks(filteredChunks).slice(0, TOP_K_CHUNKS)

  if (dedupedChunks.length > 0) {
    console.log(
      '[chat/route] Retrieved chunks:',
      dedupedChunks.map((c) => ({
        module: c.metadata?.module,
        title: c.metadata?.title,
        similarity: c.similarity.toFixed(3),
      }))
    )
  } else {
    console.log('[chat/route] No chunks above similarity floor for query:', queryText.slice(0, 100))
  }

  const context = assembleContext(dedupedChunks)
  const systemPrompt = SYSTEM_PROMPT.replace('{context}', context)

  const safeMessages: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }))

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      try {
        // anthropic.messages.stream() returns a MessageStream synchronously — no await.
        // Using 'claude-haiku-4-5' (the correct alias; 'claude-haiku-4-5-20251001' does
        // not exist in the Anthropic API and would return a 4xx on every request).
        const stream = anthropic.messages.stream({
          model: 'claude-haiku-4-5',
          max_tokens: 1500,
          system: systemPrompt,
          messages: safeMessages,
        })

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
      } catch (err) {
        console.error('[chat/route] Streaming error:', err)
        // Enqueue an SSE error payload so clients that parse SSE frames see the error,
        // then signal a ReadableStream error so clients listening on the stream's error
        // event (rather than parsing SSE payloads) are also notified. Do NOT call
        // controller.close() after controller.error() — error() already closes the stream.
        try {
          const errPayload = JSON.stringify({ error: 'Erro durante a geração da resposta' })
          controller.enqueue(encoder.encode(`data: ${errPayload}\n\n`))
        } catch {
          // controller may already be in a closing state; ignore secondary enqueue errors
        }
        controller.error(err)
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
