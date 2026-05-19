import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, RefreshCw, Clock, Download } from "lucide-react";
import { motion } from "framer-motion";
import { fetchDelivery, fetchActiveToken, generateToken } from "@/services/deliveryService";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useEffect, useState } from "react";

export default function DeliveryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [timeLeft, setTimeLeft] = useState<string>("");

  const { data: delivery, isLoading } = useQuery({
    queryKey: ["delivery", id],
    queryFn: () => fetchDelivery(id!),
    enabled: !!id,
    refetchInterval: 3000,
  });

  const { data: token } = useQuery({
    queryKey: ["token", id],
    queryFn: () => fetchActiveToken(id!),
    enabled: !!id,
    refetchInterval: 5000,
  });

  const generateMutation = useMutation({
    mutationFn: () => generateToken(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["token", id] });
      toast.success("QR Code gerado com sucesso!");
    },
    onError: () => toast.error("Erro ao gerar QR Code"),
  });

  // Countdown timer
  useEffect(() => {
    if (!token) { setTimeLeft(""); return; }
    const interval = setInterval(() => {
      const remaining = new Date(token.expires_at).getTime() - Date.now();
      if (remaining <= 0) {
        setTimeLeft("Expirado");
        queryClient.invalidateQueries({ queryKey: ["token", id] });
      } else {
        const min = Math.floor(remaining / 60000);
        const sec = Math.floor((remaining % 60000) / 1000);
        setTimeLeft(`${min}:${sec.toString().padStart(2, "0")}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [token, id, queryClient]);

  if (isLoading) return <div className="flex items-center justify-center py-20"><RefreshCw className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!delivery) return <p className="py-20 text-center text-muted-foreground">Entrega não encontrada</p>;

  const handleDownloadQR = () => {
    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, 512, 512);
      const a = document.createElement("a");
      a.download = `qr-${delivery.order_id}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-heading text-xl font-bold">Detalhes da Entrega</h1>
      </div>

      {/* QR Code Section */}
      <div className="glass-card glow-green p-6">
        <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Código de Entrega Escaneável
        </p>
        {token && timeLeft !== "Expirado" ? (
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-xl bg-foreground p-4">
              <QRCodeSVG
                id="qr-code-svg"
                value={token.token}
                size={200}
                bgColor="hsl(150, 10%, 92%)"
                fgColor="hsl(200, 15%, 8%)"
                level="H"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-warning">
              <Clock className="h-4 w-4" />
              <span>Expira em {timeLeft}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDownloadQR} className="gap-2">
                <Download className="h-4 w-4" /> Download QR
              </Button>
              <Button size="sm" onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending} className="gap-2">
                <RefreshCw className={`h-4 w-4 ${generateMutation.isPending ? "animate-spin" : ""}`} />
                Regenerar
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-8">
            <p className="text-sm text-muted-foreground">Nenhum QR Code ativo</p>
            <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending} className="gap-2">
              <QRCodeSVG value="placeholder" size={16} className="opacity-80" />
              Gerar QR Code
            </Button>
          </div>
        )}
      </div>

      {/* Delivery Info */}
      <div className="glass-card space-y-4 p-6">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Informações da Entrega
        </h2>
        <InfoRow label="ID da Entrega" value={delivery.order_id} />
        <InfoRow label="Destinatário" value={delivery.recipient_name} />
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status</span>
          <StatusBadge status={delivery.status} />
        </div>
        {delivery.recipient_address && <InfoRow label="Endereço" value={delivery.recipient_address} />}
        {delivery.notes && <InfoRow label="Notas" value={delivery.notes} />}
        <InfoRow
          label="Criado em"
          value={new Date(delivery.created_at).toLocaleString("pt-BR")}
        />
        {delivery.delivered_at && (
          <InfoRow
            label="Entregue em"
            value={new Date(delivery.delivered_at).toLocaleString("pt-BR")}
          />
        )}
      </div>
    </motion.div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
