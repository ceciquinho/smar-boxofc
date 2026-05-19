import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { Package, QrCode } from "lucide-react";
import { motion } from "framer-motion";
import { fetchDeliveries, generateToken } from "@/services/deliveryService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createDelivery } from "@/services/deliveryService";
import { toast } from "sonner";

export default function GenerateQR() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ recipient_name: "", order_id: "", notes: "" });
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [deliveryOrderId, setDeliveryOrderId] = useState("");

  const createAndGenerate = useMutation({
    mutationFn: async () => {
      const orderId = form.order_id || `DEL-${Date.now().toString(36).toUpperCase()}`;
      const delivery = await createDelivery({
        ...form,
        order_id: orderId,
      });
      const token = await generateToken(delivery.id);
      return { token, orderId };
    },
    onSuccess: ({ token, orderId }) => {
      setGeneratedToken(token.token);
      setDeliveryOrderId(orderId);
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      toast.success("QR Code gerado com sucesso!");
    },
    onError: () => toast.error("Erro ao gerar. Verifique se o ID é único."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.recipient_name) return;
    createAndGenerate.mutate();
  };

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Gerar Etiqueta de Pacote</h1>

      <div className="glass-card p-6">
        <h2 className="mb-4 font-heading text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Detalhes do Pacote
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome do Destinatário *</Label>
            <Input
              value={form.recipient_name}
              onChange={(e) => setForm((f) => ({ ...f, recipient_name: e.target.value }))}
              placeholder="Ex: Jane Doe"
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-2">
            <Label>ID da Entrega</Label>
            <Input
              value={form.order_id}
              onChange={(e) => setForm((f) => ({ ...f, order_id: e.target.value }))}
              placeholder="Ex: A1B2C3D4E5 - escaneie ou digite"
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-2">
            <Label>Notas Opcionais</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Ex: Entregar na porta lateral..."
              className="bg-secondary border-border"
            />
          </div>
          <Button type="submit" className="w-full gap-2" disabled={createAndGenerate.isPending}>
            <QrCode className="h-4 w-4" />
            {createAndGenerate.isPending ? "Gerando..." : "Gerar QR Code"}
          </Button>
        </form>
      </div>

      {generatedToken && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card glow-green p-6"
        >
          <p className="mb-2 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Imprima este código e anexe ao pacote
          </p>
          <p className="mb-4 text-center text-xs text-muted-foreground">
            ID DA ENTREGA: {deliveryOrderId}
          </p>
          <div className="flex justify-center">
            <div className="rounded-xl bg-foreground p-4">
              <QRCodeSVG value={generatedToken} size={200} bgColor="hsl(150, 10%, 92%)" fgColor="hsl(200, 15%, 8%)" level="H" />
            </div>
          </div>
          <div className="mt-4 flex justify-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <Package className="h-4 w-4" /> Download QR
            </Button>
            <Button size="sm" className="gap-2" onClick={() => window.print()}>
              🖨️ Imprimir Etiqueta
            </Button>
          </div>
          <p className="mt-4 text-center text-[10px] text-muted-foreground">
            Nota: Este código é único e válido para uma única entrega.
          </p>
        </motion.div>
      )}
    </div>
  );
}
