import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createDelivery } from "@/services/deliveryService";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateDeliveryDialog({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    recipient_name: "",
    order_id: "",
    recipient_address: "",
    notes: "",
  });

  const mutation = useMutation({
    mutationFn: createDelivery,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      toast.success("Entrega criada com sucesso!");
      onOpenChange(false);
      setForm({ recipient_name: "", order_id: "", recipient_address: "", notes: "" });
    },
    onError: () => toast.error("Erro ao criar entrega"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.recipient_name || !form.order_id) return;
    mutation.mutate(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Nova Entrega</DialogTitle>
        </DialogHeader>
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
            <Label>ID da Entrega *</Label>
            <Input
              value={form.order_id}
              onChange={(e) => setForm((f) => ({ ...f, order_id: e.target.value }))}
              placeholder="Ex: DEL-49210-A"
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-2">
            <Label>Endereço</Label>
            <Input
              value={form.recipient_address}
              onChange={(e) => setForm((f) => ({ ...f, recipient_address: e.target.value }))}
              placeholder="Ex: Rua das Flores, 123"
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Ex: Entregar na porta lateral"
              className="bg-secondary border-border"
            />
          </div>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Criando..." : "Criar Entrega"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
