import { Camera, User } from "lucide-react";

interface HeaderProps {
  title: string;
}

const Header = ({ title }: HeaderProps) => {
  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Camera className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        </div>
        <button className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors">
          <User className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
};

export default Header;
