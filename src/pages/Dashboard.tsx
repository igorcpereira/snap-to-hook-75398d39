import { Camera, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title="Dashboard" />
      
      <main className="px-4 py-6 max-w-md mx-auto space-y-6">
        {/* Welcome Section */}
        <div className="bg-card rounded-2xl p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Bem-vindo(a), Vendedor(a)!
          </h2>
          <p className="text-muted-foreground">
            Pronto para começar um novo atendimento?
          </p>
        </div>

        {/* Main Action Card */}
        <button
          onClick={() => navigate("/novo")}
          className="w-full bg-gradient-to-br from-primary to-primary/90 rounded-2xl p-6 shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <Camera className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-lg font-semibold text-white mb-1">
                Novo Pré-Cadastro
              </h3>
              <p className="text-sm text-white/90 flex items-center gap-2">
                Capture a ficha de atendimento para iniciar
                <ArrowRight className="w-4 h-4" />
              </p>
            </div>
          </div>
        </button>

        {/* Recent Pre-Registrations */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">
            Pré-Cadastros Recentes
          </h3>
          
          <div className="bg-card rounded-2xl p-8 text-center shadow-sm">
            <p className="text-muted-foreground mb-4">
              Nenhum cliente cadastrado ainda.
            </p>
            <Button 
              variant="secondary"
              onClick={() => navigate("/novo")}
              className="bg-gradient-to-r from-secondary to-secondary/90"
            >
              Comece um novo pré-cadastro!
            </Button>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Dashboard;
