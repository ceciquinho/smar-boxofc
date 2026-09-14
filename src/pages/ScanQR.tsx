import { toast } from "sonner";
import QRScanner from "@/components/QRScanner";
import { validateToken } from "@/services/deliveryService";

export default function ScanQR() {
  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Escanear QR Code</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A leitura valida o token na API PHP e abre a caixa quando o QR estiver ativo.
        </p>
      </div>

      <QRScanner
        onScan={async (token) => {
          try {
            const data = await validateToken(token);
            if (data.success) {
              toast.success("Caixa aberta!");
            } else {
              toast.error(data.reason);
            }
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Erro ao validar QR Code");
          }
        }}
      />
    </div>
  );
}
