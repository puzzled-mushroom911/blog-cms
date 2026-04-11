import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const model = new Supabase.ai.Session('gte-small')

interface WebhookPayload {
  type: 'INSERT'
  table: string
  record: {
    id: string
    block_type: string
    original_text: string
    edited_text: string
    context: string
  }
}

Deno.serve(async (req) => {
  const payload: WebhookPayload = await req.json()
  const { id, block_type, original_text, edited_text, context } = payload.record

  // Format the text for embedding — includes topic context + the correction
  const content = [
    context ? `Post: ${context}` : '',
    `Block type: ${block_type}`,
    `Original: ${original_text}`,
    `Edited to: ${edited_text}`,
  ].filter(Boolean).join('\n')

  // Generate embedding using gte-small (runs natively, no API key)
  const embedding = await model.run(content, {
    mean_pool: true,
    normalize: true,
  })

  // Store in feedback_embeddings
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { error } = await supabase
    .from('feedback_embeddings')
    .insert({
      feedback_id: id,
      content,
      embedding: JSON.stringify(embedding),
    })

  if (error) {
    console.error('Failed to store embedding:', error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 })
})
