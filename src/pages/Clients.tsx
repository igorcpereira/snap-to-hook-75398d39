import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Users } from "lucide-react";

const Clients = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title="Clientes" />
      
      <main className="px-4 py-6 max-w-md mx-auto">
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
      </main>

      <BottomNav />
    </div>
  );
};

export default Clients;
