import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Phone, Calendar, DollarSign, Loader2, Tag as TagIcon, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

export default function ClienteDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [cliente, setCliente] = useState<any>(null);
  const [fichas, setFichas] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);

  useEffect(() => {
    const loadClienteData = async () => {
      if (!id) {
        navigate("/clientes");
        return;
      }

      setLoading(true);
      try {
        // Buscar dados do cliente
        const { data: clienteData, error: clienteError } = await supabase
          .from('clientes')
          .select('*')
          .eq('id', id)
          .single();

        if (clienteError) throw clienteError;
        if (!clienteData) {
          navigate("/clientes");
          return;
        }

        setCliente(clienteData);

        // Buscar fichas do cliente
        const { data: fichasData, error: fichasError } = await supabase
          .from('fichas')
          .select('*')
          .eq('cliente_id', id)
          .order('created_at', { ascending: false });

        if (fichasError) throw fichasError;
        setFichas(fichasData || []);

        // Buscar tags do cliente
        const { data: tagsData, error: tagsError } = await supabase
          .from('relacao_cliente_tag')
          .select(`
            id_tag,
            tags (
              id,
              nome,
              cor
            )
          `)
          .eq('id_cliente', id);

        if (tagsError) throw tagsError;
        setTags(tagsData?.map((r: any) => r.tags).filter(Boolean) || []);
      } catch (error) {
        console.error("Erro ao carregar dados do cliente:", error);
      } finally {
        setLoading(false);
      }
    };

    loadClienteData();
  }, [id, navigate]);

  const getTipoColor = (tipo?: string) => {
    if (!tipo) return "bg-muted text-muted-foreground";
    
    switch (tipo.toLowerCase()) {
      case "aluguel":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
      case "venda":
        return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "ajuste":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "pendente":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400";
      case "ativa":
        return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "erro":
        return "bg-red-500/10 text-red-700 dark:text-red-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header title="Carregando..." />
        <main className="flex-1 p-4 pb-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header title="Detalhes do Cliente" />

      <main className="flex-1 p-4 pb-20">
        <div className="max-w-4xl mx-auto">
          {/* Cabeçalho com botão voltar */}
          <div className="mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/clientes')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>

          {/* Informações do Cliente - Compacto */}
          <Card className="mb-4">
            <CardContent className="p-4 space-y-3">
              {/* Nome do Cliente */}
              <div>
                <h1 className="text-xl font-semibold">{cliente?.nome}</h1>
              </div>

              {/* Info básica */}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Cliente desde:</span>
                <span className="font-medium">
                  {cliente?.created_at ? format(new Date(cliente.created_at), "dd/MM/yyyy", { locale: ptBR }) : "N/A"}
                </span>
              </div>

              {/* Tags */}
              {tags && tags.length > 0 && (
                <div className="flex items-start gap-2">
                  <TagIcon className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <Badge 
                        key={tag?.id} 
                        style={{ 
                          backgroundColor: tag?.cor ? `${tag.cor}20` : '#3B82F620', 
                          color: tag?.cor || '#3B82F6'
                        }}
                        className="text-xs border-0"
                      >
                        {tag?.nome}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Informações adicionais - Apenas leitura */}
              <div className="space-y-2">
                {cliente?.telefone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Telefone:</span>
                    <span className="font-medium">{cliente.telefone}</span>
                  </div>
                )}

                {cliente?.ltv && (
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">LTV:</span>
                    <span className="font-medium">R$ {parseFloat(cliente.ltv).toFixed(2)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Histórico de Fichas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Histórico de Fichas</h3>
            
            {fichas.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">Nenhuma ficha encontrada para este cliente.</p>
                </CardContent>
              </Card>
            ) : (
              fichas.map((ficha) => (
                <Card 
                  key={ficha.id} 
                  className="overflow-hidden cursor-pointer hover:shadow-md transition-all"
                  onClick={() => navigate(`/editar-ficha/${ficha.id}`, { state: { cliente_id: id } })}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Header com Código e Tipo */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-sm">
                            #{ficha.codigo_ficha || "Sem código"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Criado em {format(new Date(ficha.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1.5 items-end">
                          <Badge className={getTipoColor(ficha.tipo)}>
                            {ficha.tipo || "N/A"}
                          </Badge>
                          <Badge className={getStatusColor(ficha.status)}>
                            {ficha.status === "pendente" ? "Pendente" : ficha.status === "ativa" ? "Ativa" : "Erro"}
                          </Badge>
                        </div>
                      </div>

                      <Separator />

                      {/* Datas */}
                      {(ficha.data_retirada || ficha.data_devolucao || ficha.data_festa) && (
                        <div className="space-y-1.5">
                          {ficha.data_retirada && (
                            <div className="flex items-center gap-2 text-xs">
                              <Calendar className="w-3 h-3 text-muted-foreground" />
                              <span className="text-muted-foreground">Retirada:</span>
                              <span className="font-medium">{format(new Date(ficha.data_retirada), "dd/MM/yyyy", { locale: ptBR })}</span>
                            </div>
                          )}
                          {ficha.data_devolucao && (
                            <div className="flex items-center gap-2 text-xs">
                              <Calendar className="w-3 h-3 text-muted-foreground" />
                              <span className="text-muted-foreground">Devolução:</span>
                              <span className="font-medium">{format(new Date(ficha.data_devolucao), "dd/MM/yyyy", { locale: ptBR })}</span>
                            </div>
                          )}
                          {ficha.data_festa && (
                            <div className="flex items-center gap-2 text-xs">
                              <Calendar className="w-3 h-3 text-muted-foreground" />
                              <span className="text-muted-foreground">Festa:</span>
                              <span className="font-medium">{format(new Date(ficha.data_festa), "dd/MM/yyyy", { locale: ptBR })}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Valores */}
                      {(ficha.valor || ficha.garantia) && (
                        <>
                          <Separator />
                          <div className="space-y-1.5">
                            {ficha.valor && (
                              <div className="flex items-center gap-2 text-xs">
                                <DollarSign className="w-3 h-3 text-muted-foreground" />
                                <span className="text-muted-foreground">Valor:</span>
                                <span className="font-medium">R$ {parseFloat(ficha.valor).toFixed(2)}</span>
                              </div>
                            )}
                            {ficha.garantia && (
                              <div className="flex items-center gap-2 text-xs">
                                <DollarSign className="w-3 h-3 text-muted-foreground" />
                                <span className="text-muted-foreground">Garantia:</span>
                                <span className="font-medium">R$ {parseFloat(ficha.garantia).toFixed(2)}</span>
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {/* Peças */}
                      {(ficha.paleto || ficha.calca || ficha.camisa || ficha.sapato) && (
                        <>
                          <Separator />
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Peças:</p>
                            <div className="grid grid-cols-2 gap-1.5 text-xs">
                              {ficha.paleto && (
                                <div className="truncate">
                                  <span className="text-muted-foreground">Paletó:</span> {ficha.paleto}
                                </div>
                              )}
                              {ficha.calca && (
                                <div className="truncate">
                                  <span className="text-muted-foreground">Calça:</span> {ficha.calca}
                                </div>
                              )}
                              {ficha.camisa && (
                                <div className="truncate">
                                  <span className="text-muted-foreground">Camisa:</span> {ficha.camisa}
                                </div>
                              )}
                              {ficha.sapato && (
                                <div className="truncate">
                                  <span className="text-muted-foreground">Sapato:</span> {ficha.sapato}
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}

                      {/* Status de Pagamento */}
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-muted-foreground">Pagamento:</span>
                        <Badge variant={ficha.pago ? "default" : "secondary"}>
                          {ficha.pago ? "Pago" : "Pendente"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
