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
      const details: Array<{
        codigo: string | null
        email: string | null
        status: 'enviado' | 'ignorado' | 'falha'
        motivo: string
      }> = []
      const batchId = crypto.randomUUID().slice(0, 8)
      console.log(`[sus-reminder][${batchId}] lote iniciado por ${caller.id} — ${(targets ?? []).length} alvo(s)`)

      for (const target of targets ?? []) {
        const profile = profileMap.get(target.user_id)
        const label = target.codigo ?? target.user_id
        if (answeredSet.has(target.user_id)) {
          skipped++
          details.push({ codigo: target.codigo, email: profile?.email ?? null, status: 'ignorado', motivo: 'ja_respondeu' })
          console.log(`[sus-reminder][${batchId}] ${label}: ignorado (já respondeu)`)
          continue
        }
        if (!profile?.email || profile.email.endsWith('@example.com')) {
          skipped++
          details.push({ codigo: target.codigo, email: profile?.email ?? null, status: 'ignorado', motivo: 'email_invalido' })
          console.log(`[sus-reminder][${batchId}] ${label}: ignorado (e-mail ausente/inválido)`)
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
          if (res.sent) {
            sent++
            details.push({ codigo: target.codigo, email: profile.email, status: 'enviado', motivo: 'ok' })
            console.log(`[sus-reminder][${batchId}] ${label}: enviado para ${profile.email}`)
          } else {
            skipped++
            details.push({ codigo: target.codigo, email: profile.email, status: 'ignorado', motivo: res.reason })
            console.log(`[sus-reminder][${batchId}] ${label}: ignorado (${res.reason})`)
          }
        } catch (e) {
          const motivo =
            (e as { code?: string })?.code ?? (e as { message?: string })?.message ?? 'erro_desconhecido'
          failures.push(label)
          details.push({ codigo: target.codigo, email: profile.email, status: 'falha', motivo })
          console.error(
            `[sus-reminder][${batchId}] ${label}: FALHA status=${(e as { status?: number })?.status ?? '-'} code=${motivo}`,
            e
          )
        }
      }

      console.log(
        `[sus-reminder][${batchId}] lote concluído — enviados=${sent} ignorados=${skipped} falhas=${failures.length}`
      )
      return json({ bulk: true, sent, skipped, failed: failures.length, details })
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

    const attemptId = crypto.randomUUID().slice(0, 8)
    console.log(
      `[sus-reminder][${attemptId}] individual: aluno=${code.codigo ?? studentId} email=${profile.email} respondeu=${!!sus} solicitado_por=${caller.id}`
    )

    try {
      const result = await sendTemplateEmail('sus-reminder', profile.email, {
        templateData: {
          nome: profile.nome_completo ?? undefined,
          codigo: code.codigo,
          prazo: SUS_DEADLINE_LABEL,
          respondeu: !!sus,
          url: APP_URL,
        },
        // Chave única por tentativa — reaproveitar chave de um envio que falhou gera 409.
        idempotencyKey: `sus-reminder-${studentId}-${Date.now()}-${attemptId}`,
      })

      if (!result.sent) {
        console.log(`[sus-reminder][${attemptId}] não enviado — motivo=${result.reason}`)
        return json({ sent: false, reason: result.reason, attemptId, codigo: code.codigo })
      }
      console.log(`[sus-reminder][${attemptId}] enviado com sucesso`)
      return json({ sent: true, attemptId, codigo: code.codigo })
    } catch (e) {
      const motivo = (e as { code?: string })?.code ?? 'erro_desconhecido'
      const status = (e as { status?: number })?.status
      console.error(
        `[sus-reminder][${attemptId}] FALHA aluno=${code.codigo ?? studentId} status=${status ?? '-'} code=${motivo}`,
        e
      )
      throw e
    }
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
