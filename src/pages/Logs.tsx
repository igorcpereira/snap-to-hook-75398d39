import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Loader2, Clock, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LogProcesso {
  ficha_id: string;
  edge_function_inicio: string | null;
  ficha_criada: string | null;
  upload_concluido: string | null;
  webhook_enviado: string | null;
  webhook_extract: string | null;
  webhook_bucket: string | null;
  webhook_atualiza: string | null;
  webhook_gpt: string | null;
  webhook_parser_dados: string | null;
  webhook_resposta: string | null;
  ficha_processada: string | null;
  sucesso: boolean;
  created_at: string;
}

const ETAPAS = [
  { de: 'edge_function_inicio', ate: 'ficha_criada', nome: 'Criar Ficha' },
  { de: 'ficha_criada', ate: 'upload_concluido', nome: 'Upload Imagem' },
  { de: 'upload_concluido', ate: 'webhook_enviado', nome: 'Enviar Webhook' },
  { de: 'webhook_enviado', ate: 'webhook_extract', nome: 'Extração' },
  { de: 'webhook_extract', ate: 'webhook_bucket', nome: 'Bucket' },
  { de: 'webhook_bucket', ate: 'webhook_atualiza', nome: 'Atualização' },
  { de: 'webhook_atualiza', ate: 'webhook_gpt', nome: 'GPT' },
  { de: 'webhook_gpt', ate: 'webhook_parser_dados', nome: 'Parser' },
  { de: 'webhook_parser_dados', ate: 'webhook_resposta', nome: 'Retorno' },
  { de: 'webhook_resposta', ate: 'ficha_processada', nome: 'Salvar Dados' },
];

const CORES = [
  'hsl(200, 25%, 29%)',
  'hsl(200, 18%, 46%)',
  'hsl(20, 21%, 46%)',
  'hsl(11, 47%, 30%)',
  'hsl(180, 30%, 40%)',
  'hsl(240, 20%, 50%)',
  'hsl(30, 40%, 45%)',
  'hsl(160, 25%, 40%)',
  'hsl(280, 20%, 45%)',
  'hsl(350, 30%, 45%)',
];

function diffMs(inicio: string | null, fim: string | null): number | null {
  if (!inicio || !fim) return null;
  return new Date(fim).getTime() - new Date(inicio).getTime();
}

function formatMs(ms: number | null): string {
  if (ms === null) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function tempoTotal(log: LogProcesso): number | null {
  return diffMs(log.edge_function_inicio, log.ficha_processada);
}

const Logs = () => {
  const { user } = useAuth();

  const { data: logs, isLoading } = useQuery({
    queryKey: ['logs-processo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('log_processo_ficha')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as LogProcesso[];
    },
    enabled: !!user,
  });

  // Calcular médias por etapa
  const mediasEtapas = ETAPAS.map((etapa, i) => {
    const tempos = (logs || [])
      .map(log => diffMs(log[etapa.de as keyof LogProcesso] as string, log[etapa.ate as keyof LogProcesso] as string))
      .filter((t): t is number => t !== null);
    const media = tempos.length > 0 ? tempos.reduce((a, b) => a + b, 0) / tempos.length : 0;
    return { nome: etapa.nome, media: Math.round(media), cor: CORES[i] };
  });

  // Stats gerais
  const totalLogs = logs?.length || 0;
  const sucessos = logs?.filter(l => l.sucesso).length || 0;
  const temposTotal = (logs || []).map(tempoTotal).filter((t): t is number => t !== null);
  const mediaTotal = temposTotal.length > 0 ? temposTotal.reduce((a, b) => a + b, 0) / temposTotal.length : 0;
  const menorTempo = temposTotal.length > 0 ? Math.min(...temposTotal) : 0;

  // Dados para pie chart de sucesso
  const pieData = [
    { name: 'Sucesso', value: sucessos },
    { name: 'Erro', value: totalLogs - sucessos },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title="Logs" />
      <main className="p-4 space-y-4 max-w-lg mx-auto">
        <h1 className="text-xl font-bold text-foreground">Logs de Processamento</h1>
        <p className="text-sm text-muted-foreground">Relatório de tempos das últimas {totalLogs} fichas</p>

        {/* Cards resumo */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Tempo Médio</p>
                <p className="text-lg font-bold text-foreground">{formatMs(mediaTotal)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Zap className="w-5 h-5 text-accent" />
              <div>
                <p className="text-xs text-muted-foreground">Mais Rápido</p>
                <p className="text-lg font-bold text-foreground">{formatMs(menorTempo)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Sucesso</p>
                <p className="text-lg font-bold text-foreground">{sucessos}/{totalLogs}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-xs text-muted-foreground">Erros</p>
                <p className="text-lg font-bold text-foreground">{totalLogs - sucessos}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de barras - média por etapa */}
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Tempo Médio por Etapa (ms)</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mediasEtapas} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis dataKey="nome" type="category" width={70} tick={{ fontSize: 10, fill: 'hsl(var(--foreground))' }} />
                  <Tooltip
                    formatter={(value: number) => [`${value}ms`, 'Média']}
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="media" radius={[0, 4, 4, 0]}>
                    {mediasEtapas.map((entry, index) => (
                      <Cell key={index} fill={entry.cor} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pie chart sucesso/erro */}
        {totalLogs > 0 && (
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base">Taxa de Sucesso</CardTitle>
            </CardHeader>
            <CardContent className="p-2 flex justify-center">
              <div className="h-48 w-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>
                      <Cell fill="hsl(160, 40%, 40%)" />
                      <Cell fill="hsl(0, 50%, 50%)" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabela detalhada */}
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Detalhes por Ficha</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs whitespace-nowrap">Data</TableHead>
                    <TableHead className="text-xs whitespace-nowrap">Total</TableHead>
                    {ETAPAS.map(e => (
                      <TableHead key={e.nome} className="text-xs whitespace-nowrap">{e.nome}</TableHead>
                    ))}
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(logs || []).map(log => (
                    <TableRow key={log.ficha_id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {format(new Date(log.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-xs font-medium whitespace-nowrap">
                        {formatMs(tempoTotal(log))}
                      </TableCell>
                      {ETAPAS.map(etapa => (
                        <TableCell key={etapa.nome} className="text-xs whitespace-nowrap">
                          {formatMs(diffMs(
                            log[etapa.de as keyof LogProcesso] as string,
                            log[etapa.ate as keyof LogProcesso] as string
                          ))}
                        </TableCell>
                      ))}
                      <TableCell className="text-xs">
                        {log.sucesso ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
      <BottomNav />
    </div>
  );
};

export default Logs;
