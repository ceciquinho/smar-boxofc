import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Package, Plus, ScanLine, Search, ShieldCheck } from "lucide-react";
import { fetchDeliveries } from "@/services/deliveryService";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreateDeliveryDialog } from "@/components/CreateDeliveryDialog";
import { useAuth } from "@/hooks/useAuth";
import type { DeliveryStatus } from "@/types/delivery";

const tabs: { label: string; value: DeliveryStatus | "all" }[] = [
  { label: "Todos", value: "all" },
  { label: "Pendente", value: "pending" },
  { label: "Entregue", value: "delivered" },
];

export default function DeliveryList() {
  const { role } = useAuth();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<DeliveryStatus | "all">("all");
  const [showCreate, setShowCreate] = useState(false);
  const currentRole = role ?? "cliente";
  const canCreateDelivery = currentRole === "cliente" || currentRole === "admin";

  const { data: deliveries = [], isLoading } = useQuery({
    queryKey: ["deliveries"],
    queryFn: fetchDeliveries,
  });

  const deliveredCount = deliveries.filter((delivery) => delivery.status === "delivered").length;
  const pendingCount = deliveries.filter((delivery) => delivery.status === "pending").length;

  const pageCopy = {
    cliente: {
      title: "Minhas Entregas",
      description: "Cadastre uma entrega e gere o QR Code que o entregador vai escanear na caixa.",
      search: "Buscar por ID ou destinatario...",
      empty: "Voce ainda nao tem entregas cadastradas",
      create: "Nova entrega",
    },
    entregador: {
      title: "Rota do Entregador",
      description: "Veja as entregas pendentes e escaneie o QR Code no leitor da caixa.",
      search: "Buscar pacote ou destinatario...",
      empty: "Nenhuma entrega disponivel para a rota",
      create: "",
    },
    admin: {
      title: "Painel do Administrador",
      description: "Monitore entregas, QR Codes do entregador e acessos da caixa.",
      search: "Buscar por ID ou destinatario...",
      empty: "Nenhuma entrega registrada",
      create: "Nova entrega",
    },
  }[currentRole];

  const filtered = deliveries.filter((delivery) => {
    const normalizedSearch = search.toLowerCase();
    const matchesSearch =
      delivery.order_id.toLowerCase().includes(normalizedSearch) ||
      delivery.recipient_name.toLowerCase().includes(normalizedSearch);
    const matchesFilter = filter === "all" || delivery.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">{pageCopy.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{pageCopy.description}</p>
        </div>
        {canCreateDelivery ? (
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {pageCopy.create}
          </Button>
        ) : (
          <Button asChild className="gap-2">
            <Link to="/scan">
              <ScanLine className="h-4 w-4" />
              Escanear QR
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-4">
          <p className="text-2xl font-bold text-foreground">{deliveries.length}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-2xl font-bold text-warning">{pendingCount}</p>
          <p className="text-xs text-muted-foreground">Pendentes</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-2xl font-bold text-primary">{deliveredCount}</p>
          <p className="text-xs text-muted-foreground">Entregues</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={pageCopy.search}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="border-border bg-card pl-9"
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
          {currentRole === "admin" ? <ShieldCheck className="h-12 w-12" /> : <Package className="h-12 w-12" />}
          <p className="text-sm">{pageCopy.empty}</p>
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
                  <span className="font-heading text-sm font-semibold text-foreground">#{delivery.order_id}</span>
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
