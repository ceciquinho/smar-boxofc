import { Badge } from "@/components/ui/badge";
import type { DeliveryStatus } from "@/types/delivery";

const statusConfig: Record<DeliveryStatus, { label: string; className: string }> = {
  pending: { label: "Pendente", className: "bg-warning/20 text-warning border-warning/30" },
  in_transit: { label: "Em Trânsito", className: "bg-info/20 text-info border-info/30" },
  ready_for_pickup: { label: "Pronto p/ Coleta", className: "bg-primary/20 text-primary border-primary/30" },
  delivered: { label: "Entregue", className: "bg-primary/20 text-primary border-primary/30" },
  failed: { label: "Falhou", className: "bg-destructive/20 text-destructive border-destructive/30" },
};

export function StatusBadge({ status }: { status: DeliveryStatus }) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={`${config.className} font-medium text-xs uppercase tracking-wider`}>
      <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current" />
      {config.label}
    </Badge>
  );
}
