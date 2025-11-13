import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Loader2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

export default function ClienteDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cliente, setCliente] = useState<any>(null);
  const [fichas, setFichas] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
  });

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
        setFormData({
          nome: clienteData.nome || "",
          telefone: clienteData.telefone || "",
        });

        // Buscar fichas do cliente
        const { data: fichasData, error: fichasError } = await supabase
          .from('fichas')
          .select('*')
          .eq('cliente_id', id)
          .order('created_at', { ascending: false });

        if (fichasError) throw fichasError;
        setFichas(fichasData || []);
      } catch (error) {
        console.error("Erro ao carregar dados do cliente:", error);
      } finally {
        setLoading(false);
      }
    };

    loadClienteData();
  }, [id, navigate]);

  const handleSave = async () => {
    if (!id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('clientes')
        .update({
          nome: formData.nome,
          telefone: formData.telefone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      // Recarregar dados do cliente
      const { data: clienteData } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', id)
        .single();

      if (clienteData) {
        setCliente(clienteData);
      }
    } catch (error) {
      console.error("Erro ao atualizar cliente:", error);
    } finally {
      setSaving(false);
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
          <div className="mb-6 flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/clientes')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Detalhes do Cliente</h1>
          </div>

          {/* Informações do Cliente */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <Avatar className="w-20 h-20">
                  <AvatarImage src="" />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {formData.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold mb-1">{cliente?.nome}</h2>
                  <p className="text-sm text-muted-foreground">
                    Cliente desde {cliente?.created_at ? format(new Date(cliente.created_at), "dd/MM/yyyy", { locale: ptBR }) : "N/A"}
                  </p>
                </div>
              </div>

              <Separator className="mb-6" />

              {/* Formulário de Edição */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full"
                >
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </Button>
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
              <div className="space-y-3">
                {fichas.map((ficha) => (
                  <div 
                    key={ficha.id}
                    className="p-4 bg-card rounded-xl border border-border hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => navigate(`/editar-ficha/${ficha.id}`, { state: { cliente_id: id } })}
                  >
                    {/* Header: Status + Código + Chevron */}
                    <div className="flex items-center gap-3 mb-3">
                      {/* Bolinha de status */}
                      <div className={cn(
                        "w-3 h-3 rounded-full flex-shrink-0",
                        ficha.status === "ativa" ? "bg-green-500" : 
                        ficha.status === "pendente" ? "bg-amber-500" : 
                        ficha.status === "erro" ? "bg-red-500" : "bg-gray-500"
                      )} />
                      
                      {/* Código da ficha */}
                      <p className="font-semibold text-base flex-1">
                        #{ficha.codigo_ficha || "Sem código"}
                      </p>
                      
                      {/* Chevron */}
                      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    </div>
                    
                    {/* Tipo + Data + Valor */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        {ficha.tipo || "N/A"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(ficha.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                      {ficha.valor && (
                        <>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs font-medium text-green-600 dark:text-green-400">
                            R$ {parseFloat(ficha.valor).toFixed(2)}
                          </span>
                        </>
                      )}
                    </div>
                    
                    {/* Peças - GRID 2 COLUNAS */}
                    {(ficha.paleto || ficha.calca || ficha.camisa || ficha.sapato) && (
                      <div className="mb-3">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="text-primary text-sm">👔</span>
                          <span className="text-xs font-medium text-muted-foreground">Peças:</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          {ficha.paleto && (
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground/60">•</span>
                              <span>Paletó {ficha.paleto}</span>
                            </div>
                          )}
                          {ficha.calca && (
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground/60">•</span>
                              <span>Calça {ficha.calca}</span>
                            </div>
                          )}
                          {ficha.camisa && (
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground/60">•</span>
                              <span>Camisa {ficha.camisa}</span>
                            </div>
                          )}
                          {ficha.sapato && (
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground/60">•</span>
                              <span>Sapato {ficha.sapato}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Status de pagamento */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className={ficha.pago ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}>
                        {ficha.pago ? "✓" : "○"}
                      </span>
                      <span className={ficha.pago ? "text-green-600 dark:text-green-400 font-medium" : "text-amber-600 dark:text-amber-400"}>
                        {ficha.pago ? "Pago" : "Pagamento Pendente"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
