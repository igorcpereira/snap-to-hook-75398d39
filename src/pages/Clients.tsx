import { useState, useEffect } from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Users, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

const Clients = () => {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const user = (await supabase.auth.getUser()).data.user;
        
        const { data, error } = await supabase
          .from('clientes')
          .select('*')
          .eq('vendedor_id', user?.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setClientes(data || []);
      } catch (error) {
        console.error('Erro ao buscar clientes:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchClientes();
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title="Clientes" />
      
      <main className="px-4 py-6 max-w-md mx-auto">
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
          <div className="space-y-3">
            {clientes.map((cliente) => (
              <Card key={cliente.id} className="hover:shadow-md transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {cliente.nome}
                      </p>
                      {cliente.telefone && (
                        <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          <p className="text-xs">{cliente.telefone}</p>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Cadastrado em {new Date(cliente.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Clients;
