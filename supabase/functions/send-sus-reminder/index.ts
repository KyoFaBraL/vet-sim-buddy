import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const SUS_DEADLINE_LABEL = '28/08/2026'
const APP_URL = 'https://vetbalance.app.br'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    if (!authHeader) return json({ error: 'Não autenticado' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData } = await userClient.auth.getUser()
    const caller = userData?.user
    if (!caller) return json({ error: 'Não autenticado' }, 401)

    const admin = createClient(supabaseUrl, serviceKey)
    const { data: allowed, error: roleError } = await admin.rpc('is_professor_or_admin', {
      _user_id: caller.id,
    })
    if (roleError || !allowed) return json({ error: 'Permissão insuficiente' }, 403)

    const body = await req.json().catch(() => ({}))

    // Envio em lote: todos os alunos UNINASSAU com o SUS pendente.
    if (body?.all_pending === true) {
      const { data: targets, error: targetsError } = await admin
        .from('participant_codes')
        .select('user_id, codigo')
        .eq('instituicao', 'UNINASSAU')
      if (targetsError) throw targetsError

      const ids = (targets ?? []).map((t) => t.user_id)
      const { data: answered } = await admin
        .from('sus_responses')
        .select('user_id')
        .in('user_id', ids)
      const answeredSet = new Set((answered ?? []).map((a) => a.user_id))

      const { data: profiles } = await admin
        .from('profiles')
        .select('id, email, nome_completo')
        .in('id', ids)
      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))

      const today = new Date().toISOString().slice(0, 16)
      // Uma chave nova por tentativa: chaves reutilizadas após falha retornam 409.
      const attemptStamp = crypto.randomUUID().slice(0, 8)
      let sent = 0
      let skipped = 0
      const failures: string[] = []

      for (const target of targets ?? []) {
        if (answeredSet.has(target.user_id)) {
          skipped++
          continue
        }
        const profile = profileMap.get(target.user_id)
        if (!profile?.email || profile.email.endsWith('@example.com')) {
          skipped++
          continue
        }
        try {
          const res = await sendTemplateEmail('sus-reminder', profile.email, {
            templateData: {
              nome: profile.nome_completo ?? undefined,
              codigo: target.codigo,
              prazo: SUS_DEADLINE_LABEL,
              respondeu: false,
              url: APP_URL,
            },
            idempotencyKey: `sus-reminder-${target.user_id}-${today}-${attemptStamp}`,
          })
          if (res.sent) sent++
          else skipped++
        } catch (e) {
          console.error('bulk sus reminder failed for', target.user_id, e)
          failures.push(target.codigo ?? target.user_id)
        }
      }

      return json({ bulk: true, sent, skipped, failed: failures.length })
    }

    const studentId = typeof body?.student_id === 'string' ? body.student_id.trim() : ''
    if (!/^[0-9a-f-]{36}$/i.test(studentId)) return json({ error: 'Aluno inválido' }, 400)


    // Recipient is derived from trusted data only (never from the browser payload).
    const { data: code, error: codeError } = await admin
      .from('participant_codes')
      .select('user_id, codigo, instituicao')
      .eq('user_id', studentId)
      .maybeSingle()
    if (codeError) throw codeError
    if (!code || code.instituicao !== 'UNINASSAU') {
      return json({ error: 'Aluno não pertence à turma UNINASSAU' }, 400)
    }

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('email, nome_completo')
      .eq('id', studentId)
      .maybeSingle()
    if (profileError) throw profileError
    if (!profile?.email) return json({ error: 'Aluno sem e-mail cadastrado' }, 400)

    const { data: sus } = await admin
      .from('sus_responses')
      .select('id')
      .eq('user_id', studentId)
      .maybeSingle()

    const result = await sendTemplateEmail('sus-reminder', profile.email, {
      templateData: {
        nome: profile.nome_completo ?? undefined,
        codigo: code.codigo,
        prazo: SUS_DEADLINE_LABEL,
        respondeu: !!sus,
        url: APP_URL,
      },
      // Chave única por tentativa — reaproveitar chave de um envio que falhou gera 409.
      idempotencyKey: `sus-reminder-${studentId}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    })

    if (!result.sent) {
      return json({ sent: false, reason: result.reason })
    }
    return json({ sent: true })
  } catch (err) {
    console.error('send-sus-reminder error:', err)
    const code = (err as { code?: string })?.code
    const status = (err as { status?: number })?.status
    if (code === 'domain_not_verified' || code === 'emails_disabled') {
      return json({ error: 'E-mail indisponível', reason: code }, 503)
    }
    if (status === 429) {
      const wait = (err as { retryAfterSeconds?: number })?.retryAfterSeconds ?? 60
      return json({ error: 'Limite de envios atingido', reason: 'rate_limited', retryAfterSeconds: wait }, 429)
    }
    return json({ error: 'Não foi possível enviar o lembrete', reason: code ?? 'unknown' }, 500)
  }
})
