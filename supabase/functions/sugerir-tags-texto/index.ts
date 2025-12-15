import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { texto } = await req.json();
    
    if (!texto || texto.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Texto é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📝 Texto recebido:', texto.substring(0, 100) + '...');

    const webhookUrl = Deno.env.get('WEBHOOK_SUGERIR_TAGS');
    if (!webhookUrl) {
      console.error('❌ WEBHOOK_SUGERIR_TAGS não configurado');
      return new Response(
        JSON.stringify({ error: 'Webhook não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🚀 Enviando para webhook:', webhookUrl);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: texto,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro do webhook:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Erro ao processar texto' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('✅ Resposta do webhook:', JSON.stringify(data));

    // Extrair tags da resposta (mesmo formato do transcrever-audio)
    let tags: string[] = [];
    let text = '';

    if (Array.isArray(data)) {
      // Resposta é array: [{ text, tags }]
      if (data.length > 0 && data[0].tags) {
        tags = data[0].tags;
        text = data[0].text || '';
      }
    } else if (data.tags) {
      // Resposta é objeto: { text, tags }
      tags = data.tags;
      text = data.text || '';
    }

    console.log('🏷️ Tags extraídas:', tags);

    return new Response(
      JSON.stringify({ text, tags }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro na função:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
