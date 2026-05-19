import { Link, useLocation } from "react-router-dom";
import { Package, QrCode, Shield, BarChart3, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/", icon: Package, label: "Entregas" },
  { to: "/generate", icon: QrCode, label: "Gerar QR" },
  { to: "/box", icon: Shield, label: "Caixa IoT" },
  { to: "/logs", icon: BarChart3, label: "Logs" },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user, signOut } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-14 items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Package className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-heading text-lg font-bold tracking-tight">Smart Delivery Box</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground sm:inline">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={signOut} className="gap-1.5">
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container flex-1 py-6">{children}</main>

      {/* Bottom Navigation */}
      <nav className="sticky bottom-0 border-t border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-1 rounded-lg px-3 py-2 text-xs transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
