import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImportRow {
  telefone: string | null;
  item: string | null;
  noivo: string | null;
}

interface ProcessStats {
  totalProcessados: number;
  clientesEncontrados: number;
  relacoesCreatedItem: number;
  relacoesCreatedNoivo: number;
  erros: number;
  detalhesErros: string[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Iniciando processamento de tags para clientes...');

    // Mapa de tags (normalizado → ID)
    const tagMap: Record<string, string> = {
      'ajuste': '7d2835fe-bb6a-45bb-bf51-47a2545d55b0',
      'aluguel': '1c804884-a86f-45b4-9c39-664b4804e422',
      'alugeul': '1c804884-a86f-45b4-9c39-664b4804e422', // typo → aluguel
      'calça': '67ca971c-56e5-44e1-a9f8-c5e110f1dcfe',
      'camisa': 'd2772298-0a59-4aa9-ba1e-38c0958ccecf',
      'colete': '84b9647b-7df3-4a3d-9af1-0a5e97cfd7d0',
      'confecção': '087883fa-f096-4c6d-a494-73e7f2fc6420',
      'terno': '6d485ecf-8e85-4bc2-ad14-3bb21a5f16a4',
      'venda': '5f73eda7-f313-4ebc-8fde-070dc232bb70',
      'noivo': '97b0b06e-73d7-49af-967a-3e0c2e067eb2'
    };

    // Buscar todos os clientes e criar mapa telefone → ID
    console.log('Buscando clientes...');
    const { data: clientes, error: clientesError } = await supabase
      .from('clientes')
      .select('id, telefone');

    if (clientesError) {
      throw new Error(`Erro ao buscar clientes: ${clientesError.message}`);
    }

    console.log(`Total de clientes encontrados: ${clientes?.length || 0}`);

    // Criar mapa de telefone normalizado → cliente ID
    const clienteMap = new Map<string, string>();
    clientes?.forEach(cliente => {
      if (cliente.telefone) {
        // Normalizar telefone: remover 55, +, espaços, hífens
        const telNormalizado = cliente.telefone
          .replace(/^\+?55/, '')
          .replace(/[\s\-()]/g, '')
          .trim();
        clienteMap.set(telNormalizado, cliente.id);
      }
    });

    console.log(`Mapa de clientes criado com ${clienteMap.size} entradas`);

    // Buscar todos os registros de clientes_import
    console.log('Buscando registros de import...');
    const { data: imports, error: importsError } = await supabase
      .from('clientes_import')
      .select('telefone, item, noivo');

    if (importsError) {
      throw new Error(`Erro ao buscar imports: ${importsError.message}`);
    }

    console.log(`Total de registros de import: ${imports?.length || 0}`);

    // Buscar relações existentes para evitar duplicatas
    const { data: relacoesExistentes, error: relacoesError } = await supabase
      .from('relacao_cliente_tag')
      .select('id_cliente, id_tag');

    if (relacoesError) {
      throw new Error(`Erro ao buscar relações existentes: ${relacoesError.message}`);
    }

    // Criar set de relações existentes
    const relacoesSet = new Set<string>();
    relacoesExistentes?.forEach(rel => {
      relacoesSet.add(`${rel.id_cliente}-${rel.id_tag}`);
    });

    console.log(`Total de relações existentes: ${relacoesSet.size}`);

    // Processar cada registro de import
    const stats: ProcessStats = {
      totalProcessados: 0,
      clientesEncontrados: 0,
      relacoesCreatedItem: 0,
      relacoesCreatedNoivo: 0,
      erros: 0,
      detalhesErros: []
    };

    const relacoesParaInserir: Array<{ id_cliente: string; id_tag: string }> = [];

    for (const importRow of imports || []) {
      stats.totalProcessados++;

      if (!importRow.telefone) {
        continue;
      }

      // Normalizar telefone do import
      const telNormalizado = importRow.telefone
        .replace(/^\+?55/, '')
        .replace(/[\s\-()]/g, '')
        .trim();

      // Buscar cliente correspondente
      const clienteId = clienteMap.get(telNormalizado);

      if (!clienteId) {
        continue; // Cliente não encontrado
      }

      stats.clientesEncontrados++;

      // Processar tag do item
      if (importRow.item) {
        const itemNormalizado = importRow.item.toLowerCase().trim();
        const tagId = tagMap[itemNormalizado];

        if (tagId) {
          const relacaoKey = `${clienteId}-${tagId}`;
          if (!relacoesSet.has(relacaoKey)) {
            relacoesParaInserir.push({
              id_cliente: clienteId,
              id_tag: tagId
            });
            relacoesSet.add(relacaoKey); // Adicionar ao set para evitar duplicatas no mesmo batch
            stats.relacoesCreatedItem++;
          }
        } else {
          stats.detalhesErros.push(`Item não mapeado: ${importRow.item}`);
        }
      }

      // Processar tag de noivo
      if (importRow.noivo && importRow.noivo.toLowerCase() === 'sim') {
        const noivoTagId = tagMap['noivo'];
        const relacaoKey = `${clienteId}-${noivoTagId}`;
        if (!relacoesSet.has(relacaoKey)) {
          relacoesParaInserir.push({
            id_cliente: clienteId,
            id_tag: noivoTagId
          });
          relacoesSet.add(relacaoKey);
          stats.relacoesCreatedNoivo++;
        }
      }
    }

    // Inserir todas as relações em batch
    if (relacoesParaInserir.length > 0) {
      console.log(`Inserindo ${relacoesParaInserir.length} novas relações...`);
      
      // Inserir em lotes de 500 para evitar problemas com muitos dados
      const batchSize = 500;
      for (let i = 0; i < relacoesParaInserir.length; i += batchSize) {
        const batch = relacoesParaInserir.slice(i, i + batchSize);
        const { error: insertError } = await supabase
          .from('relacao_cliente_tag')
          .insert(batch);

        if (insertError) {
          console.error(`Erro ao inserir batch ${i / batchSize + 1}:`, insertError);
          stats.erros++;
          stats.detalhesErros.push(`Erro no batch ${i / batchSize + 1}: ${insertError.message}`);
        } else {
          console.log(`Batch ${i / batchSize + 1} inserido com sucesso (${batch.length} registros)`);
        }
      }
    }

    console.log('Processamento concluído!');
    console.log('Estatísticas:', stats);

    return new Response(
      JSON.stringify({
        success: true,
        stats
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Erro no processamento:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
