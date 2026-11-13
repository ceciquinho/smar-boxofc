import { Link, useLocation } from "react-router-dom";
import { Package, QrCode, Shield, BarChart3, LogOut, Moon, Sun, ScanLine } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth, type UserInterfaceRole } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const roleLabels: Record<UserInterfaceRole, string> = {
  cliente: "Cliente",
  entregador: "Entregador",
  admin: "Admin",
};

const navItemsByRole: Record<UserInterfaceRole, { to: string; icon: typeof Package; label: string }[]> = {
  cliente: [
    { to: "/", icon: Package, label: "Minhas Entregas" },
    { to: "/generate", icon: QrCode, label: "Novo QR" },
  ],
  entregador: [
    { to: "/", icon: Package, label: "Rota" },
    { to: "/scan", icon: ScanLine, label: "Escanear" },
    { to: "/box", icon: Shield, label: "Caixa" },
  ],
  admin: [
    { to: "/", icon: Package, label: "Entregas" },
    { to: "/generate", icon: QrCode, label: "Gerar QR" },
    { to: "/box", icon: Shield, label: "Caixa IoT" },
    { to: "/logs", icon: BarChart3, label: "Logs" },
  ],
};

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user, role, signOut } = useAuth();
  const currentRole = role ?? "cliente";
  const navItems = navItemsByRole[currentRole];
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

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
            <div className="hidden text-right sm:block">
              <span className="block text-xs text-muted-foreground">{user?.email}</span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-primary">
                {roleLabels[currentRole]}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={() => setTheme(isDark ? "light" : "dark")} aria-label={`Ativar tema ${isDark ? "claro" : "escuro"}`} className="gap-1.5">
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span>Tema {isDark ? "claro" : "escuro"}</span>
            </Button>
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
            const isActive = location.pathname === item.to || (item.to === "/" && location.pathname.startsWith("/delivery"));
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
