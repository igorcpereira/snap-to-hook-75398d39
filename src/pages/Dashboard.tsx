import { ArrowRight, AlertCircle, Users, Calendar, UserCheck, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import logoJRP from "@/assets/logo-jrp.png";
import { useFichas } from "@/hooks/useFichas";
import { Card } from "@/components/ui/card";

const atividadesDoDia = [
  { id: 1, titulo: "Atendimento - Maria Silva", horario: "09:00", tipo: "cliente", icone: Users },
  { id: 2, titulo: "Reunião geral da equipe", horario: "11:00", tipo: "reuniao", icone: Calendar },
  { id: 3, titulo: "1x1 com liderança", horario: "14:00", tipo: "lideranca", icone: UserCheck },
  { id: 4, titulo: "Atendimento - João Santos", horario: "15:30", tipo: "cliente", icone: Users },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [nomeVendedor, setNomeVendedor] = useState<string>('Vendedor(a)');
  const { data: fichas = [] } = useFichas();
  
  const fichasPendentes = fichas.filter(f => f.status === 'pendente').length;

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('nome')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data?.nome) {
            setNomeVendedor(data.nome);
          }
        });
    }
  }, [user]);

  return <div className="min-h-screen bg-background pb-20 relative">
      <Header title="Início" />
      
      {/* Logo de fundo */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-5 z-0">
        <img 
          src={logoJRP} 
          alt="JRP Logo" 
          className="w-96 h-96 object-contain"
        />
      </div>

      <main className="px-4 py-4 max-w-sm mx-auto space-y-4 relative z-10">
        {/* Welcome Section */}
        <div className="bg-card rounded-xl p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-1">
            Olá, {nomeVendedor}!
          </h2>
          <p className="text-sm text-muted-foreground">
            Pronto para um novo atendimento?
          </p>
        </div>

        {/* Fichas Pendentes Alert */}
        {fichasPendentes > 0 && (
          <Card 
            className="bg-destructive/10 border-destructive/20 p-4 cursor-pointer hover:bg-destructive/15 transition-colors"
            onClick={() => navigate('/pre-cadastro')}
          >
            <div className="flex items-center gap-3">
              <div className="bg-destructive/20 p-2 rounded-full">
                <AlertCircle className="w-5 h-5 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">
                  {fichasPendentes} {fichasPendentes === 1 ? 'Ficha Pendente' : 'Fichas Pendentes'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Aguardando avaliação
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </Card>
        )}

        {/* Atividades do Dia */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground text-sm">Atividades do Dia</h3>
          </div>
          <div className="space-y-3">
            {atividadesDoDia.map((atividade) => (
              <div 
                key={atividade.id} 
                className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="bg-primary/10 p-1.5 rounded-full">
                  <atividade.icone className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {atividade.titulo}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  {atividade.horario}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </main>

      <BottomNav />
    </div>;
};
export default Dashboard;