import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, ShieldX, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { fetchAccessLogs } from "@/services/deliveryService";

export default function AccessLogs() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["access-logs"],
    queryFn: () => fetchAccessLogs(),
    refetchInterval: 5000,
  });

  const successCount = logs.filter((l) => l.success).length;
  const failCount = logs.filter((l) => !l.success).length;

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Logs de Acesso</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{logs.length}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-primary">{successCount}</p>
          <p className="text-xs text-muted-foreground">Sucesso</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-destructive">{failCount}</p>
          <p className="text-xs text-muted-foreground">Falhas</p>
        </div>
      </div>

      {/* Log List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card h-16 animate-pulse" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <BarChart3 className="h-12 w-12" />
          <p className="text-sm">Nenhum log registrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log, i) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="glass-card flex items-center gap-3 p-4"
            >
              {log.success ? (
                <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />
              ) : (
                <ShieldX className="h-5 w-5 shrink-0 text-destructive" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{log.reason}</p>
                <p className="truncate text-xs text-muted-foreground font-mono">
                  Token: {log.token.slice(0, 12)}...
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {new Date(log.created_at).toLocaleTimeString("pt-BR")}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
