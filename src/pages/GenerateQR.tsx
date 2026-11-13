import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { Download, QrCode, Truck } from "lucide-react";
import { motion } from "framer-motion";
import { createDelivery, generateToken } from "@/services/deliveryService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
      toast.success("QR do entregador gerado com sucesso!");
    },
    onError: () => toast.error("Erro ao gerar. Verifique se o ID e unico."),
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.recipient_name) return;
    createAndGenerate.mutate();
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById("generated-delivery-qr");
    if (!svg || !deliveryOrderId) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, 512, 512);
      const a = document.createElement("a");
      a.download = `qr-entregador-${deliveryOrderId}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Gerar QR do Entregador</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Este QR acompanha o entregador e libera a caixa quando for escaneado no leitor.
        </p>
      </div>

      <div className="glass-card p-6">
        <h2 className="mb-4 font-heading text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Dados da entrega
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome do destinatario *</Label>
            <Input
              value={form.recipient_name}
              onChange={(event) => setForm((current) => ({ ...current, recipient_name: event.target.value }))}
              placeholder="Ex: Maria Silva"
              className="border-border bg-secondary"
            />
          </div>
          <div className="space-y-2">
            <Label>ID da entrega</Label>
            <Input
              value={form.order_id}
              onChange={(event) => setForm((current) => ({ ...current, order_id: event.target.value }))}
              placeholder="Ex: A1B2C3D4E5"
              className="border-border bg-secondary"
            />
          </div>
          <div className="space-y-2">
            <Label>Notas para o entregador</Label>
            <Textarea
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Ex: Usar a caixa BOX-001 na portaria..."
              className="border-border bg-secondary"
            />
          </div>
          <Button type="submit" className="w-full gap-2" disabled={createAndGenerate.isPending}>
            <QrCode className="h-4 w-4" />
            {createAndGenerate.isPending ? "Gerando..." : "Gerar QR para o entregador"}
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
            QR para escanear na caixa
          </p>
          <p className="mb-4 text-center text-xs text-muted-foreground">ID DA ENTREGA: {deliveryOrderId}</p>
          <div className="flex justify-center">
            <div className="rounded-xl bg-foreground p-4">
              <QRCodeSVG
                id="generated-delivery-qr"
                value={generatedToken}
                size={200}
                bgColor="hsl(150, 10%, 92%)"
                fgColor="hsl(200, 15%, 8%)"
                level="H"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-center gap-3">
            <Button variant="outline" size="sm" className="gap-2" onClick={handleDownloadQR}>
              <Download className="h-4 w-4" /> Download QR
            </Button>
            <Button size="sm" className="gap-2" onClick={() => window.print()}>
              <Truck className="h-4 w-4" /> Imprimir para o entregador
            </Button>
          </div>
          <p className="mt-4 text-center text-[10px] text-muted-foreground">
            Entregue este QR ao entregador. Ao chegar, ele deve apresentar o codigo no scanner da caixa.
          </p>
        </motion.div>
      )}
    </div>
  );
}
