import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, Image as ImageIcon, X, User, Mic, FileText, Calendar as CalendarIcon2, Shirt, DollarSign, Save, Tag } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { AudioRecorder } from "@/components/AudioRecorder";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useVendedores } from "@/hooks/useVendedores";
import { useAuth } from "@/contexts/AuthContext";

export default function EditarFicha() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { imageFile, isNewFicha, isReprocessing, cliente_id } = location.state || {};
  const { data: vendedores = [], isLoading: isLoadingVendedores } = useVendedores();
  const [loading, setLoading] = useState(false);
  const [isLoadingFicha, setIsLoadingFicha] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState<string | null>(null);
  const [ficha, setFicha] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [wasProcessed, setWasProcessed] = useState(false);
  const [isAudioRecording, setIsAudioRecording] = useState(false);
  const [isAudioProcessing, setIsAudioProcessing] = useState(false);
  const [formData, setFormData] = useState({
    nome_cliente: "",
    telefone_cliente: "",
    codigo_ficha: "",
    tipo: "Aluguel",
    status: "pendente",
    vendedor_responsavel: "",
    data_retirada: undefined as Date | undefined,
    data_devolucao: undefined as Date | undefined,
    data_festa: undefined as Date | undefined,
    valor: "",
    garantia: "",
    paleto: "",
    calca: "",
    camisa: "",
    sapato: "",
    pago: false,
    observacoes_cliente: "",
    tags: [] as string[],
  });

  // Calcular progresso de preenchimento
  const progress = useMemo(() => {
    const campos = [
      formData.nome_cliente,
      formData.telefone_cliente,
      formData.codigo_ficha,
      formData.vendedor_responsavel,
      formData.data_retirada,
      formData.data_devolucao,
      formData.valor,
    ];
    const preenchidos = campos.filter(campo => campo && campo !== "").length;
    return Math.round((preenchidos / campos.length) * 100);
  }, [formData]);


  useEffect(() => {
    const loadFicha = async () => {
      if (!id) {
        navigate("/pre-cadastro");
        return;
      }

      setIsLoadingFicha(true);
      try {
        const { data: fichaData, error } = await supabase
          .from('fichas')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (!fichaData) {
          navigate("/pre-cadastro");
          return;
        }

        setFicha(fichaData);

        // Ativar processamento apenas se não tem codigo_ficha E status é pendente
        if (!fichaData.codigo_ficha && fichaData.status === 'pendente') {
          setIsProcessing(true);
        }

        // Buscar tags do cliente se houver cliente_id
        let clienteTags: string[] = [];
        if (fichaData.cliente_id) {
          try {
            const { data: relacoes, error } = await supabase
              .from('relacao_cliente_tag')
              .select('id_tag, tags(nome)')
              .eq('id_cliente', fichaData.cliente_id);

            if (!error && relacoes) {
              clienteTags = relacoes
                .map(r => (r as any).tags?.nome)
                .filter(Boolean);
            }
          } catch (error) {
            console.error('Erro ao buscar tags:', error);
          }
        }

        // Buscar nome do usuário logado para pré-selecionar
        let vendedorNome = "";
        if (fichaData.vendedor_responsavel) {
          vendedorNome = fichaData.vendedor_responsavel;
        } else if (user?.id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('nome')
            .eq('id', user.id)
            .single();
          
          vendedorNome = profile?.nome || "";
        }

        setFormData(prev => ({
          ...prev,
          nome_cliente: fichaData.nome_cliente || "",
          telefone_cliente: fichaData.telefone_cliente || "",
          codigo_ficha: fichaData.codigo_ficha || "",
          tipo: fichaData.tipo || "Aluguel",
          status: fichaData.status || "pendente",
          vendedor_responsavel: vendedorNome,
          data_retirada: fichaData.data_retirada ? new Date(fichaData.data_retirada) : undefined,
          data_devolucao: fichaData.data_devolucao ? new Date(fichaData.data_devolucao) : undefined,
          data_festa: fichaData.data_festa ? new Date(fichaData.data_festa) : undefined,
          valor: fichaData.valor?.toString() || "",
          garantia: fichaData.garantia?.toString() || "",
          paleto: fichaData.paleto || "",
          calca: fichaData.calca || "",
          camisa: fichaData.camisa || "",
          sapato: fichaData.sapato || "",
          pago: fichaData.pago || false,
          // Preserva observações_cliente se já existir
          observacoes_cliente: prev.observacoes_cliente || fichaData.transcricao_audio || "",
          tags: clienteTags,
        }));
      } catch (error) {
        console.error('Erro ao carregar ficha:', error);
        navigate("/pre-cadastro");
      } finally {
        setIsLoadingFicha(false);
      }
    };

    loadFicha();
  }, [id, navigate, user?.id, isNewFicha]);

  // Subscrição Realtime para updates da ficha
  useEffect(() => {
    if (!id) return;

    console.log('📡 Iniciando subscrição realtime para ficha:', id);
    
    const channel = supabase
      .channel(`ficha-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'fichas',
          filter: `id=eq.${id}`
        },
        (payload) => {
          console.log('🔄 Ficha atualizada via realtime:', payload.new);
          
          // BLOQUEIO: Não atualizar se estiver gravando ou processando áudio
          if (isAudioRecording || isAudioProcessing) {
            console.log('🔒 Update bloqueado: áudio em uso');
            return;
          }
          
          const fichaAtualizada = payload.new;
          const codigoAnterior = ficha?.codigo_ficha; // Valor anterior
          const codigoNovo = fichaAtualizada.codigo_ficha; // Valor novo
          
          // Detectar processamento concluído: codigo_ficha mudou de null/undefined para um valor
          if (!codigoAnterior && codigoNovo) {
            console.log('✅ Processamento detectado: codigo_ficha preenchido');
            setIsProcessing(false);
            setWasProcessed(true);
            
            // Remove a mensagem de sucesso após 5 segundos
            setTimeout(() => {
              setWasProcessed(false);
            }, 5000);
          }
          
          setFicha(fichaAtualizada);
          
          // Atualizar formData apenas com campos do webhook
          setFormData(prev => ({
            ...prev,
            nome_cliente: fichaAtualizada.nome_cliente || prev.nome_cliente,
            telefone_cliente: fichaAtualizada.telefone_cliente || prev.telefone_cliente,
            codigo_ficha: fichaAtualizada.codigo_ficha || prev.codigo_ficha,
            tipo: fichaAtualizada.tipo || prev.tipo,
            status: fichaAtualizada.status || prev.status,
            data_retirada: fichaAtualizada.data_retirada ? new Date(fichaAtualizada.data_retirada) : prev.data_retirada,
            data_devolucao: fichaAtualizada.data_devolucao ? new Date(fichaAtualizada.data_devolucao) : prev.data_devolucao,
            data_festa: fichaAtualizada.data_festa ? new Date(fichaAtualizada.data_festa) : prev.data_festa,
            valor: fichaAtualizada.valor?.toString() || prev.valor,
            garantia: fichaAtualizada.garantia?.toString() || prev.garantia,
            paleto: fichaAtualizada.paleto || prev.paleto,
            calca: fichaAtualizada.calca || prev.calca,
            camisa: fichaAtualizada.camisa || prev.camisa,
            sapato: fichaAtualizada.sapato || prev.sapato,
            pago: fichaAtualizada.pago ?? prev.pago,
            observacoes_cliente: prev.observacoes_cliente || fichaAtualizada.transcricao_audio || "",
          }));
          
          // Detectar erro apenas se status for explicitamente 'erro'
          if (fichaAtualizada.status === 'erro') {
            setIsProcessing(false);
            
            toast({
              title: "Erro ao processar",
              description: "Não foi possível processar a imagem. Você pode preencher manualmente.",
              variant: "destructive"
            });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Desconectando subscrição realtime');
      supabase.removeChannel(channel);
    };
  }, [id, isAudioRecording, isAudioProcessing]);

  const handleTranscription = (text: string) => {
    console.log('Texto recebido da transcrição:', text);
    setFormData(prev => ({ ...prev, observacoes_cliente: text }));
  };

  const handleTagsExtracted = (tags: string[]) => {
    const normalizedTags = tags.map(tag => tag.toLowerCase().trim());

    setFormData(prev => {
      const existingTags = prev.tags.map(tag => tag.toLowerCase());
      const newTags = normalizedTags.filter(tag => !existingTags.includes(tag));

      if (newTags.length > 0) {
        console.log('Adicionando tags:', newTags);
        return { ...prev, tags: [...prev.tags, ...newTags] };
      }
      return prev;
    });
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Validar codigo_ficha único
      if (!formData.codigo_ficha) {
        toast({
          title: "Erro",
          description: "Código da ficha é obrigatório",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      const { data: fichaExistente } = await supabase
        .from('fichas')
        .select('id')
        .eq('codigo_ficha', formData.codigo_ficha)
        .neq('id', id)
        .maybeSingle();

      if (fichaExistente) {
        toast({
          title: "Erro",
          description: "Este código de ficha já existe",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      let clienteId: string | null = null;

      if (formData.telefone_cliente && formData.telefone_cliente.trim() !== '') {
        const telefone = formData.telefone_cliente.trim();

        const { data: clienteExistente, error: searchError } = await supabase
          .from('clientes')
          .select('id')
          .eq('telefone', telefone)
          .maybeSingle();

        if (searchError) {
          console.error('Erro ao buscar cliente:', searchError);
          throw searchError;
        }

        if (clienteExistente) {
          console.log('Cliente encontrado:', clienteExistente.id);
          clienteId = clienteExistente.id;
        } else {
          console.log('Cliente não encontrado. Criando novo cliente...');

          const user = (await supabase.auth.getUser()).data.user;

          const { data: novoCliente, error: insertError } = await supabase
            .from('clientes')
            .insert({
              nome: formData.nome_cliente || 'Cliente sem nome',
              telefone: telefone,
              vendedor_id: user?.id,
            })
            .select('id')
            .single();

          if (insertError) {
            console.error('Erro ao criar cliente:', insertError);
            throw insertError;
          }

          console.log('Novo cliente criado:', novoCliente.id);
          clienteId = novoCliente.id;
        }
      }

      const novoStatus = formData.status === 'pendente' ? 'ativa' : formData.status;

      console.log('Status atual:', formData.status);
      console.log('Novo status:', novoStatus);

      const updateData: any = {
        nome_cliente: formData.nome_cliente || null,
        telefone_cliente: formData.telefone_cliente || null,
        codigo_ficha: formData.codigo_ficha || null,
        tipo: formData.tipo || null,
        vendedor_responsavel: formData.vendedor_responsavel || null,
        data_retirada: formData.data_retirada ? format(formData.data_retirada, "yyyy-MM-dd") : null,
        data_devolucao: formData.data_devolucao ? format(formData.data_devolucao, "yyyy-MM-dd") : null,
        data_festa: formData.data_festa ? format(formData.data_festa, "yyyy-MM-dd") : null,
        valor: formData.valor ? parseFloat(formData.valor.toString()) : null,
        garantia: formData.garantia ? parseFloat(formData.garantia.toString()) : null,
        paleto: formData.paleto || null,
        calca: formData.calca || null,
        camisa: formData.camisa || null,
        sapato: formData.sapato || null,
        pago: formData.pago,
        transcricao_audio: formData.observacoes_cliente || null,
        cliente_id: clienteId,
        status: novoStatus,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("fichas")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      supabase.functions.invoke('notificar-ficha-whatsapp', {
        body: { ficha_id: id }
      }).catch(err => {
        console.error('Erro ao enviar notificação WhatsApp:', err);
      });

      if (clienteId && formData.tags.length > 0) {
        console.log('Salvando tags para cliente:', clienteId);

        const tagIds: string[] = [];

        for (const tagNome of formData.tags) {
          const tagNomeLower = tagNome.toLowerCase().trim();

          const { data: tagExistente, error: searchTagError } = await supabase
            .from('tags')
            .select('id')
            .eq('nome', tagNomeLower)
            .maybeSingle();

          if (searchTagError) {
            console.error('Erro ao buscar tag:', searchTagError);
            continue;
          }

          if (tagExistente) {
            tagIds.push(tagExistente.id);
          } else {
            const { data: novaTag, error: insertTagError } = await supabase
              .from('tags')
              .insert({ nome: tagNomeLower })
              .select('id')
              .single();

            if (insertTagError) {
              console.error('Erro ao criar tag:', insertTagError);
              continue;
            }

            if (novaTag) {
              tagIds.push(novaTag.id);
            }
          }
        }

        await supabase
          .from('relacao_cliente_tag')
          .delete()
          .eq('id_cliente', clienteId);

        if (tagIds.length > 0) {
          const relacoes = tagIds.map(tagId => ({
            id_cliente: clienteId,
            id_tag: tagId
          }));

          const { error: insertRelacoesError } = await supabase
            .from('relacao_cliente_tag')
            .insert(relacoes);

          if (insertRelacoesError) {
            console.error('Erro ao criar relações:', insertRelacoesError);
          }
        }
      }

      if (cliente_id) {
        navigate(`/cliente/${cliente_id}`);
      } else {
        navigate("/pre-cadastro");
      }
    } catch (error) {
      console.error("Erro ao atualizar ficha:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageLoad = () => {
    console.log('✅ Imagem carregada com sucesso:', ficha?.url_bucket);
    setImageLoading(false);
    setImageError(null);
  };

  const handleImageError = () => {
    console.error('❌ Erro ao carregar imagem:', ficha?.url_bucket);
    setImageError('Não foi possível carregar a imagem. Verifique se a URL está correta.');
    setImageLoading(false);
  };

  const handleOpenImageModal = () => {
    console.log('🔍 Tentando carregar imagem:', ficha?.url_bucket);
    setImageLoading(true);
    setImageError(null);
    setShowImageModal(true);
  };

  if (isLoadingFicha) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header title="Carregando..." />
        <main className="flex-1 p-4 pb-20">
          <div className="max-w-4xl mx-auto space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header title="Editar Ficha" />

      <main className="flex-1 p-4 pb-20 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="mb-4 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (cliente_id) {
                  navigate(`/cliente/${cliente_id}`);
                } else {
                  navigate("/pre-cadastro");
                }
              }}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Editar Ficha</h1>
          </div>

          {/* Progress Bar - Minimalista */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 space-y-1.5"
          >
            <div className="flex items-center justify-end">
              <span className="text-xs text-muted-foreground">{progress}%</span>
            </div>
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </motion.div>

          {/* Alertas com efeito shimmer */}
          {isProcessing && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 relative overflow-hidden rounded-xl border border-blue-200/50 bg-gradient-to-r from-blue-50 via-blue-100 to-blue-50 dark:from-blue-950 dark:via-blue-900 dark:to-blue-950 p-4"
            >
              <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <div className="relative flex items-center gap-3">
                <div className="relative">
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                  <div className="absolute inset-0 bg-blue-400 blur-lg opacity-50 animate-glow" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                    Processando dados da ficha...
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Os campos serão preenchidos automaticamente
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {wasProcessed && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/50">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                Dados da ficha processados com sucesso!
              </p>
            </motion.div>
          )}

          {ficha?.status === 'erro' && isNewFicha && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-4 p-4 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950 dark:to-rose-950 border border-red-200 dark:border-red-800 rounded-xl"
            >
              <p className="text-sm font-semibold text-red-900 dark:text-red-100">Erro ao processar imagem</p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">Você pode preencher os campos manualmente ou reenviar a imagem.</p>
            </motion.div>
          )}

          <div className="mb-4 flex gap-2">
            {ficha?.url_bucket && (
              <Button
                type="button"
                onClick={handleOpenImageModal}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <ImageIcon className="h-4 w-4" />
                Ver Ficha Original
              </Button>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={() => ficha?.cliente_id && navigate(`/cliente/${ficha.cliente_id}`)}
                    disabled={!ficha?.cliente_id}
                    className={`${ficha?.url_bucket ? 'flex-1' : 'w-full'} flex items-center justify-center gap-2`}
                  >
                    <User className="h-4 w-4" />
                    Ver Cliente
                  </Button>
                </TooltipTrigger>
                {!ficha?.cliente_id && (
                  <TooltipContent>
                    <p>Cliente será vinculado ao salvar a ficha</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>

          <Accordion type="multiple" defaultValue={["observacoes", "cabecalho", "datas"]} className="space-y-2">
            {/* Observações do Cliente */}
            <AccordionItem value="observacoes" className="border-none">
              <AccordionTrigger className="hover:no-underline px-0 py-2.5 text-sm">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-muted-foreground" />
                  <span>Observações do Cliente</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0 pt-3 pb-4 space-y-3">
                <AudioRecorder
                  onTranscriptionComplete={handleTranscription}
                  onTagsExtracted={handleTagsExtracted}
                  onRecordingStart={() => setIsAudioRecording(true)}
                  onRecordingStop={() => setIsAudioRecording(false)}
                  onProcessingStart={() => setIsAudioProcessing(true)}
                  onProcessingEnd={() => setIsAudioProcessing(false)}
                />
                <Textarea
                  id="observacoes_cliente"
                  name="observacoes_cliente"
                  value={formData.observacoes_cliente}
                  onChange={(e) => setFormData({ ...formData, observacoes_cliente: e.target.value })}
                  placeholder="Observações gerais sobre o atendimento..."
                  className="min-h-[80px] text-sm"
                />
              </AccordionContent>
            </AccordionItem>

            {/* Cabeçalho */}
            <AccordionItem value="cabecalho" className="border-none">
              <AccordionTrigger className="hover:no-underline px-0 py-2.5 text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span>Cabeçalho</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0 pt-3 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome_cliente" className="text-xs font-medium">Nome</Label>
                      <Input
                        id="nome_cliente"
                        name="nome_cliente"
                        value={formData.nome_cliente}
                        onChange={(e) => setFormData({ ...formData, nome_cliente: e.target.value })}
                        placeholder="Nome completo"
                        className="h-8"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telefone_cliente" className="text-xs font-medium">Telefone</Label>
                      <Input
                        id="telefone_cliente"
                        name="telefone_cliente"
                        value={formData.telefone_cliente}
                        onChange={(e) => setFormData({ ...formData, telefone_cliente: e.target.value })}
                        placeholder="(00) 00000-0000"
                        className="h-8"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="vendedor_responsavel" className="text-xs font-medium">Vendedor Responsável</Label>
                      <Select 
                        value={formData.vendedor_responsavel} 
                        onValueChange={(value) => setFormData({ ...formData, vendedor_responsavel: value })}
                        disabled={isLoadingVendedores}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingVendedores ? "Carregando..." : "Selecione um vendedor"} />
                        </SelectTrigger>
                        <SelectContent>
                          {vendedores.map((vendedor) => (
                            <SelectItem key={vendedor.id} value={vendedor.nome || ""}>
                              {vendedor.nome} {vendedor.unidade_nome ? `(${vendedor.unidade_nome})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="codigo_ficha" className="text-xs font-medium">Código da Ficha</Label>
                      <Input
                        id="codigo_ficha"
                        name="codigo_ficha"
                        value={formData.codigo_ficha}
                        onChange={(e) => setFormData({ ...formData, codigo_ficha: e.target.value })}
                        placeholder="Código"
                        className="h-8"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tipo" className="text-xs font-medium">Tipo de Atendimento</Label>
                      <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Aluguel">Aluguel</SelectItem>
                          <SelectItem value="Venda">Venda</SelectItem>
                          <SelectItem value="Ajuste">Ajuste</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-xs font-medium">Status</Label>
                      <Input
                        id="status"
                        name="status"
                        value={formData.status === "pendente" ? "Pendente" : formData.status === "ativa" ? "Ativa" : formData.status === "erro" ? "Erro" : formData.status}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Datas */}
            <AccordionItem value="datas" className="border-none">
              <AccordionTrigger className="hover:no-underline px-0 py-2.5 text-sm">
                <div className="flex items-center gap-2">
                  <CalendarIcon2 className="w-4 h-4 text-muted-foreground" />
                  <span>Datas</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0 pt-3 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Data de Retirada</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.data_retirada && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.data_retirada ? format(formData.data_retirada, "PPP", { locale: ptBR }) : "Selecione"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.data_retirada}
                        onSelect={(date) => setFormData({ ...formData, data_retirada: date })}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Data de Devolução</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.data_devolucao && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.data_devolucao ? format(formData.data_devolucao, "PPP", { locale: ptBR }) : "Selecione"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.data_devolucao}
                        onSelect={(date) => setFormData({ ...formData, data_devolucao: date })}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Data da Festa</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.data_festa && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.data_festa ? format(formData.data_festa, "PPP", { locale: ptBR }) : "Selecione"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.data_festa}
                        onSelect={(date) => setFormData({ ...formData, data_festa: date })}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </AccordionContent>
            </AccordionItem>

            {/* Detalhes do Item */}
            <AccordionItem value="detalhes" className="border-none">
              <AccordionTrigger className="hover:no-underline px-0 py-2.5 text-sm">
                <div className="flex items-center gap-2">
                  <Shirt className="w-4 h-4 text-muted-foreground" />
                  <span>Detalhes do Item</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0 pt-3 pb-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paleto" className="text-xs">Paletó</Label>
                  <Input
                    id="paleto"
                    name="paleto"
                    value={formData.paleto}
                    onChange={(e) => setFormData({ ...formData, paleto: e.target.value })}
                    placeholder="Número"
                    className="h-8"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="calca" className="text-xs">Calça</Label>
                  <Input
                    id="calca"
                    name="calca"
                    value={formData.calca}
                    onChange={(e) => setFormData({ ...formData, calca: e.target.value })}
                    placeholder="Número"
                    className="h-8"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="camisa" className="text-xs">Camisa</Label>
                  <Input
                    id="camisa"
                    name="camisa"
                    value={formData.camisa}
                    onChange={(e) => setFormData({ ...formData, camisa: e.target.value })}
                    placeholder="Número"
                    className="h-8"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sapato" className="text-xs">Sapato</Label>
                  <Input
                    id="sapato"
                    name="sapato"
                    value={formData.sapato}
                    onChange={(e) => setFormData({ ...formData, sapato: e.target.value })}
                    placeholder="Número"
                    className="h-8"
                  />
                </div>
              </div>
            </AccordionContent>
            </AccordionItem>

            {/* Tags */}
            <AccordionItem value="tags" className="border-none">
              <AccordionTrigger className="hover:no-underline px-0 py-2.5 text-sm">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  <span>Tags do Cliente</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0 pt-3 pb-4">
                <div className="flex flex-wrap gap-2">
                {formData.tags.length > 0 ? (
                  formData.tags.map((tag, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Badge variant="secondary" className="flex items-center gap-1 bg-gradient-to-r from-primary/20 to-primary/10 border-primary/30 hover:shadow-md transition-all">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma tag adicionada ainda.</p>
                )}
              </div>
            </AccordionContent>
            </AccordionItem>

            {/* Pagamento */}
            <AccordionItem value="pagamento" className="border-none">
              <AccordionTrigger className="hover:no-underline px-0 py-2.5 text-sm">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <span>Pagamento</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0 pt-3 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valor" className="text-xs">Valor (R$)</Label>
                  <Input
                    id="valor"
                    name="valor"
                    type="number"
                    step="0.01"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                    placeholder="0,00"
                    className="h-8"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="garantia" className="text-xs">Garantia (R$)</Label>
                  <Input
                    id="garantia"
                    name="garantia"
                    type="number"
                    step="0.01"
                    value={formData.garantia}
                    onChange={(e) => setFormData({ ...formData, garantia: e.target.value })}
                    placeholder="0,00"
                    className="h-8"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="pago"
                  checked={formData.pago}
                  onCheckedChange={(checked) => setFormData({ ...formData, pago: checked })}
                />
                <Label htmlFor="pago">Pagamento realizado</Label>
              </div>
            </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Botões de ação */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => navigate("/pre-cadastro")}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="flex-1"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </div>
        </div>
      </main>

      {/* Modal de Imagem */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogTitle className="sr-only">Visualização da Ficha Original</DialogTitle>
          <DialogDescription className="sr-only">
            Imagem digitalizada da ficha de atendimento original
          </DialogDescription>
          <div className="relative w-full h-full flex items-center justify-center">
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            {imageError && (
              <div className="absolute inset-0 flex items-center justify-center bg-background">
                <p className="text-destructive">{imageError}</p>
              </div>
            )}
            {ficha?.url_bucket && (
              <img
                src={ficha.url_bucket}
                alt="Ficha Original"
                className="max-w-full max-h-[80vh] object-contain"
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
