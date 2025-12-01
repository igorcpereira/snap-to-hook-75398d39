import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Users, Phone, ChevronRight, Search, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import logoJRP from "@/assets/logo-jrp.png";
import { useClientes } from "@/hooks/useClientes";
import { formatarTelefone } from "@/lib/utils";

const Clients = () => {
  const navigate = useNavigate();
  const [termoBusca, setTermoBusca] = useState("");
  const [termoBuscaDebounced, setTermoBuscaDebounced] = useState("");
  
  // Debounce do termo de busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setTermoBuscaDebounced(termoBusca);
    }, 400);
    
    return () => clearTimeout(timer);
  }, [termoBusca]);
  
  const { 
    data, 
    isLoading: loading, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useClientes(termoBuscaDebounced);
  
  const observer = useRef<IntersectionObserver>();
  const lastClientRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleClienteClick = (cliente: any) => {
    navigate(`/cliente/${cliente.id}`);
  };

  // Juntar todas as páginas em uma lista única
  const clientes = useMemo(() => {
    return data?.pages.flatMap(page => page.data) || [];
  }, [data]);

  return (
    <div className="min-h-screen bg-background pb-20 relative">
      <Header title="Clientes" />
      
      {/* Logo de fundo */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-5 z-0">
        <img 
          src={logoJRP} 
          alt="JRP Logo" 
          className="w-96 h-96 object-contain"
        />
      </div>
      
      <main className="px-4 py-6 max-w-md mx-auto relative z-10">
        {/* Campo de busca sempre visível */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por nome, telefone ou ficha..."
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="bg-card rounded-2xl p-12 text-center shadow-sm">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        ) : clientes.length === 0 ? (
          <div className="bg-card rounded-2xl p-12 text-center shadow-sm">
            <p className="text-muted-foreground text-sm">
              {termoBuscaDebounced ? 'Nenhum resultado encontrado.' : 'Nenhum cliente cadastrado'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {clientes.map((cliente, index) => {
              const isLast = index === clientes.length - 1;

              return (
                <Card 
                  key={cliente.id} 
                  ref={isLast ? lastClientRef : undefined}
                  className="hover:shadow-md transition-all cursor-pointer active:scale-95"
                  onClick={() => handleClienteClick(cliente)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {cliente.nome}
                        </p>
                        {cliente.telefone && (
                          <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            <p className="text-xs">{formatarTelefone(cliente.telefone)}</p>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Cadastrado em {new Date(cliente.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {isFetchingNextPage && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Clients;
