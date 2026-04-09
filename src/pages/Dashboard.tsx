import { ExternalLink } from "lucide-react";
import logoJRP from "@/assets/logo-jrp.png";

const V2_URL = "https://vendedorpamplona.kadincrm.com.br/";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Logo de fundo */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-5 z-0">
        <img src={logoJRP} alt="JRP Logo" className="w-96 h-96 object-contain" />
      </div>

      <div className="relative z-10 w-full max-w-sm space-y-8 text-center">
        {/* Logo */}
        <img src={logoJRP} alt="Flavio Pamplona Alfaiataria" className="w-24 h-24 object-contain mx-auto" />

        {/* Título */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Sistema atualizado!
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Estamos usando uma nova versão do sistema de vendas.
            Clique no botão abaixo para continuar trabalhando.
          </p>
        </div>

        {/* Botão principal */}
        <a
          href={V2_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground font-semibold py-4 px-6 rounded-xl shadow-md hover:opacity-90 active:scale-95 transition-all text-base"
        >
          Acessar nova versão
          <ExternalLink className="w-5 h-5" />
        </a>

        <p className="text-xs text-muted-foreground">
          {V2_URL}
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
