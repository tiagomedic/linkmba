import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI()

function chunkMarkdown(text: string, maxSize = 600): string[] {
  const sections = text.split(/\n(?=#{1,3} )/)
  const chunks: string[] = []

  for (const section of sections) {
    if (section.trim().length < 50) continue

    if (section.length <= maxSize) {
      chunks.push(section.trim())
      continue
    }

    // Split long sections by paragraph
    const paragraphs = section.split('\n\n')
    let current = ''
    for (const p of paragraphs) {
      if (current.length + p.length > maxSize && current) {
        chunks.push(current.trim())
        current = p
      } else {
        current += (current ? '\n\n' : '') + p
      }
    }
    if (current.trim()) chunks.push(current.trim())
  }

  return chunks
}

async function ingestFile(filePath: string) {
  const filename = path.basename(filePath)
  const module = filename.replace('.md', '')
  const text = fs.readFileSync(filePath, 'utf-8')
  const chunks = chunkMarkdown(text)

  console.log(`\n📄 ${filename} — ${chunks.length} chunks`)

  for (let i = 0; i < chunks.length; i++) {
    const { data } = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: chunks[i],
    })

    await supabase.from('documents').insert({
      content: chunks[i],
      embedding: data[0].embedding,
      metadata: { module, file: filename, chunk_index: i },
    })

    process.stdout.write(`  ${i + 1}/${chunks.length}\r`)
  }

  console.log(`  ✓ concluído`)
}

async function main() {
  const dir = process.argv[2]
  if (!dir) {
    console.error('Uso: npm run ingest <pasta-com-arquivos-md>')
    process.exit(1)
  }

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'))
  if (!files.length) {
    console.error('Nenhum .md encontrado na pasta')
    process.exit(1)
  }

  console.log(`Iniciando ingestão de ${files.length} arquivo(s)...`)
  for (const file of files) {
    await ingestFile(path.join(dir, file))
  }
  console.log('\n✅ Ingestão concluída!')
}

main().catch(console.error)
