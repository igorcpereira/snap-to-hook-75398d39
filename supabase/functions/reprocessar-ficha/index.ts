import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function capitalizarNome(nome?: string): string {
  if (!nome) return "";
  return nome.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { ficha_id } = await req.json()

    if (!ficha_id) {
      throw new Error('ficha_id é obrigatório')
    }

    console.log('Reprocessando ficha:', ficha_id)

    // Buscar a ficha para pegar url_bucket
    const { data: ficha, error: fichaError } = await supabaseClient
      .from('fichas')
      .select('url_bucket')
      .eq('id', ficha_id)
      .single()

    if (fichaError || !ficha?.url_bucket) {
      throw new Error('Ficha não encontrada ou sem imagem')
    }

    // Baixar imagem do bucket
    const { data: fileData, error: downloadError } = await supabaseClient.storage
      .from('fichas')
      .download(ficha.url_bucket)

    if (downloadError || !fileData) {
      throw new Error('Erro ao baixar imagem do storage')
    }

    // Buscar webhook
    const { data: webhooks, error: webhookError } = await supabaseClient
      .from('webhooks')
      .select('webhook')
      .eq('nome', 'nova-ficha')
      .single()

    if (webhookError || !webhooks) {
      console.error('Erro ao buscar webhook:', webhookError)
      await supabaseClient.from('fichas').update({ status: 'erro' }).eq('id', ficha_id)
      throw new Error('Webhook não encontrado')
    }

    // Retorna imediatamente e processa em background
    const backgroundProcess = async () => {
      try {
        const webhookFormData = new FormData()
        const file = new File([fileData], ficha.url_bucket!, { type: 'image/jpeg' })
        webhookFormData.append('image', file)
        webhookFormData.append('ficha_id', ficha_id)

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 120000)

        const webhookResponse = await fetch(webhooks.webhook, {
          method: 'POST',
          body: webhookFormData,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!webhookResponse.ok) {
          throw new Error(`Webhook retornou status ${webhookResponse.status}`)
        }

        const webhookData = await webhookResponse.json()
        const resultado = Array.isArray(webhookData) ? webhookData[0] : webhookData

        if (resultado.sucesso === true) {
          const updateData: any = { updated_at: new Date().toISOString() }

          if (resultado.numero_ficha) updateData.codigo_ficha = resultado.numero_ficha
          if (resultado.cliente_nome) updateData.nome_cliente = capitalizarNome(resultado.cliente_nome)
          if (resultado.cliente_telefone) updateData.telefone_cliente = resultado.cliente_telefone
          if (resultado.tipo) {
            const t = resultado.tipo.toLowerCase()
            updateData.tipo = t.charAt(0).toUpperCase() + t.slice(1)
          }
          if (resultado.data_retirada) updateData.data_retirada = resultado.data_retirada
          if (resultado.data_devolucao) updateData.data_devolucao = resultado.data_devolucao
          if (resultado.data_evento) updateData.data_festa = resultado.data_evento
          if (resultado.paleto?.descricao) updateData.paleto = capitalizarNome(resultado.paleto.descricao)
          if (resultado.calca?.descricao) updateData.calca = capitalizarNome(resultado.calca.descricao)
          if (resultado.camisa?.descricao) updateData.camisa = capitalizarNome(resultado.camisa.descricao)
          if (resultado.rodape?.sapato) updateData.sapato = resultado.rodape.sapato
          if (resultado.rodape?.valor) {
            const v = parseFloat(resultado.rodape.valor)
            if (!isNaN(v)) updateData.valor = v
          }
          if (resultado.rodape?.garantia) {
            const g = parseFloat(resultado.rodape.garantia)
            if (!isNaN(g)) updateData.garantia = g
          }
          if (resultado.pago !== null && resultado.pago !== undefined) updateData.pago = resultado.pago === true
          if (resultado.paleto?.valor) { const v = parseFloat(resultado.paleto.valor); if (!isNaN(v)) updateData.valor_paleto = v }
          if (resultado.calca?.valor) { const v = parseFloat(resultado.calca.valor); if (!isNaN(v)) updateData.valor_calca = v }
          if (resultado.camisa?.valor) { const v = parseFloat(resultado.camisa.valor); if (!isNaN(v)) updateData.valor_camisa = v }

          const temDadosEssenciais = updateData.codigo_ficha || updateData.nome_cliente
          if (!temDadosEssenciais) {
            await supabaseClient.from('fichas').update({ status: 'erro' }).eq('id', ficha_id)
            return
          }

          updateData.status = 'pendente'
          await supabaseClient.from('fichas').update(updateData).eq('id', ficha_id)
          console.log('Ficha reprocessada com sucesso:', ficha_id)
        } else {
          await supabaseClient.from('fichas').update({ status: 'erro' }).eq('id', ficha_id)
        }
      } catch (err) {
        console.error('Erro no reprocessamento background:', err)
        await supabaseClient.from('fichas').update({ status: 'erro' }).eq('id', ficha_id)
      }
    }

    backgroundProcess().catch(err => console.error('Erro background:', err))

    return new Response(
      JSON.stringify({ success: true, message: 'Reprocessamento iniciado' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Erro:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})