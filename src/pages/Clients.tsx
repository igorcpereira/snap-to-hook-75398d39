import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Users, Phone, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import logoJRP from "@/assets/logo-jrp.png";
import { useClientes } from "@/hooks/useClientes";
import { formatarTelefone } from "@/lib/utils";

const Clients = () => {
  const navigate = useNavigate();
  const { data: clientes = [], isLoading: loading } = useClientes();
  const [filtroNome, setFiltroNome] = useState("");

  // Filtrar clientes por nome
  const clientesFiltrados = clientes.filter(cliente => 
    cliente.nome.toLowerCase().includes(filtroNome.toLowerCase())
  );

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
        {loading ? (
          <div className="bg-card rounded-2xl p-12 text-center shadow-sm">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        ) : clientes.length === 0 ? (
          <div className="bg-card rounded-2xl p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-accent mx-auto mb-4 flex items-center justify-center">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Nenhum cliente cadastrado
            </h2>
            <p className="text-muted-foreground text-sm">
              Os clientes aparecerão aqui após o primeiro cadastro.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Campo de filtro */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Filtrar por nome..."
                value={filtroNome}
                onChange={(e) => setFiltroNome(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Lista de clientes filtrados */}
            {clientesFiltrados.length === 0 ? (
              <div className="bg-card rounded-2xl p-12 text-center shadow-sm">
                <p className="text-muted-foreground text-sm">
                  Nenhum cliente encontrado com esse nome.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {clientesFiltrados.map((cliente) => (
                  <div 
                    key={cliente.id}
                    className="flex items-center gap-4 p-4 bg-card rounded-xl hover:bg-accent/50 active:bg-accent transition-all cursor-pointer border border-border shadow-sm hover:shadow-md"
                    onClick={() => navigate(`/cliente/${cliente.id}`)}
                  >
                    {/* Avatar com iniciais */}
                    <Avatar className="h-12 w-12 border-2 border-primary/20">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-semibold text-sm">
                        {cliente.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Info principal */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-base truncate">{cliente.nome}</p>
                      {cliente.telefone && (
                        <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
                          <Phone className="w-3 h-3" />
                          <p className="text-xs">{formatarTelefone(cliente.telefone)}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Indicador visual */}
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  </div>
                ))}
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
