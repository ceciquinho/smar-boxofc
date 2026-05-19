import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus, Search, Package } from "lucide-react";
import { motion } from "framer-motion";
import { fetchDeliveries } from "@/services/deliveryService";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import type { DeliveryStatus } from "@/types/delivery";
import { CreateDeliveryDialog } from "@/components/CreateDeliveryDialog";
import { supabase } from "@/integrations/supabase/client";

const tabs: { label: string; value: DeliveryStatus | "all" }[] = [
  { label: "Todos", value: "all" },
  { label: "Pendente", value: "pending" },
  { label: "Entregue", value: "delivered" },
];

export default function DeliveryList() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<DeliveryStatus | "all">("all");
  const [showCreate, setShowCreate] = useState(false);

  const { data: deliveries = [], isLoading } = useQuery({
    queryKey: ["deliveries"],
    queryFn: fetchDeliveries,
  });

  // Realtime: refetch whenever deliveries change in the DB
  useEffect(() => {
    const channel = supabase
      .channel("deliveries-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "deliveries" }, () => {
        queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const filtered = deliveries.filter((d) => {
    const matchesSearch =
      d.order_id.toLowerCase().includes(search.toLowerCase()) ||
      d.recipient_name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || d.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">QR Codes de Entrega</h1>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por ID ou destinatário..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-card border-border"
        />
      </div>

      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              filter === tab.value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {tab.label}
            {tab.value === "all" && (
              <span className="ml-1.5 rounded-full bg-background/20 px-1.5 py-0.5 text-[10px]">
                {deliveries.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card h-32 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <Package className="h-12 w-12" />
          <p className="text-sm">Nenhuma entrega encontrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((delivery, i) => (
            <motion.div
              key={delivery.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={`/delivery/${delivery.id}`}
                className="glass-card block p-4 transition-all hover:border-primary/30 hover:glow-green"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-heading text-sm font-semibold text-foreground">
                    #{delivery.order_id}
                  </span>
                  <StatusBadge status={delivery.status} />
                </div>
                <p className="text-sm text-muted-foreground">{delivery.recipient_name}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {new Date(delivery.created_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      <CreateDeliveryDialog open={showCreate} onOpenChange={setShowCreate} />
    </div>
  );
}
