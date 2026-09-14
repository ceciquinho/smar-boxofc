import { useState } from "react";
import { BarcodeScanner } from "@capacitor-mlkit/barcode-scanning";
import { useMutation } from "@tanstack/react-query";
import {
  Shield,
  ShieldCheck,
  ShieldX,
  Loader2,
  QrCode,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { validateToken } from "@/services/deliveryService";

import { Button } from "@/components/ui/button";

type BoxState = "idle" | "validating" | "open" | "locked";

export default function BoxSimulator() {
  const [token, setToken] = useState("");
  const [boxState, setBoxState] = useState<BoxState>("idle");
  const [message, setMessage] = useState("");

  // Validação do token
  const validateMutation = useMutation({
    mutationFn: (tokenValue: string) => validateToken(tokenValue),

    onMutate: () => {
      setBoxState("validating");
      setMessage("");
    },

    onSuccess: (result) => {
      if (result.success) {
        setBoxState("open");
        setMessage(result.reason || "Caixa aberta com sucesso!");
      } else {
        setBoxState("locked");
        setMessage(result.reason || "Token inválido");
      }
    },

    onError: () => {
      setBoxState("locked");
      setMessage("Erro de comunicação com o servidor");
    },
  });

  // Reset do simulador
  const reset = () => {
    setBoxState("idle");
    setToken("");
    setMessage("");
  };

  // Scanner QR Code
  const scanQRCode = async () => {
    try {
      // Permissão da câmera
      await BarcodeScanner.requestPermissions();

      // Abrir scanner
      const result = await BarcodeScanner.scan();

      // Verifica se encontrou QR
      if (result.barcodes.length > 0) {
        const scannedToken = result.barcodes[0].rawValue;

        if (!scannedToken) {
          setBoxState("locked");
          setMessage("QR inválido");
          return;
        }

        // Salva token
        setToken(scannedToken);

        // Valida automaticamente
        validateMutation.mutate(scannedToken);
      }
    } catch (error) {
      console.error(error);

      setBoxState("locked");
      setMessage("Erro ao ler QR Code");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">
        Simulador da Caixa IoT
      </h1>

      <p className="text-sm text-muted-foreground">
        Simula o endpoint{" "}
        <code className="rounded bg-secondary px-1.5 py-0.5 text-xs text-primary">
          /box/validate
        </code>{" "}
        da caixa inteligente
      </p>

      {/* Visualização da Caixa */}
      <motion.div
        className={`glass-card flex flex-col items-center gap-6 p-8 transition-all ${
          boxState === "open"
            ? "border-primary/50 glow-green"
            : boxState === "locked"
            ? "border-destructive/50"
            : ""
        }`}
      >
        <AnimatePresence mode="wait">
          {boxState === "idle" && (
            <motion.div
              key="idle"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="flex flex-col items-center gap-3"
            >
              <Shield className="h-20 w-20 text-muted-foreground" />

              <p className="text-sm text-muted-foreground">
                Caixa trancada - aguardando QR Code
              </p>
            </motion.div>
          )}

          {boxState === "validating" && (
            <motion.div
              key="validating"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="flex flex-col items-center gap-3"
            >
              <Loader2 className="h-20 w-20 animate-spin text-warning" />

              <p className="text-sm text-warning">
                Validando token...
              </p>
            </motion.div>
          )}

          {boxState === "open" && (
            <motion.div
              key="open"
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="animate-pulse-green rounded-full p-4">
                <ShieldCheck className="h-20 w-20 text-primary" />
              </div>

              <p className="text-lg font-bold text-primary">
                ✅ CAIXA ABERTA
              </p>

              <p className="text-sm text-muted-foreground">
                {message}
              </p>
            </motion.div>
          )}

          {boxState === "locked" && (
            <motion.div
              key="locked"
              initial={{ x: -10 }}
              animate={{ x: [0, -5, 5, -5, 5, 0] }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center gap-3"
            >
              <ShieldX className="h-20 w-20 text-destructive" />

              <p className="text-lg font-bold text-destructive">
                🔒 ACESSO NEGADO
              </p>

              <p className="text-sm text-muted-foreground">
                {message}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Botão Scanner */}
      {(boxState === "idle" || boxState === "locked") && (
        <div className="glass-card space-y-4 p-6">
          <Button
            className="w-full gap-2"
            onClick={scanQRCode}
            disabled={validateMutation.isPending}
          >
            <QrCode className="h-4 w-4" />

            Escanear QR Code
          </Button>

          {token && (
            <p className="break-all text-center font-mono text-xs text-muted-foreground">
              Token lido: {token}
            </p>
          )}
        </div>
      )}

      {/* Reset */}
      {(boxState === "open" || boxState === "locked") && (
        <Button
          variant="outline"
          className="w-full"
          onClick={reset}
        >
          Resetar Simulador
        </Button>
      )}

      {/* ESP32 Info */}
      <div className="glass-card p-4">
        <p className="text-xs text-muted-foreground">
          💡 <strong>Integração ESP32:</strong> Na produção, o ESP32
          enviará o token escaneado para o endpoint de validação via
          HTTP POST. O microcontrolador controlará o servo motor da
          fechadura baseado na resposta.
        </p>
      </div>
    </div>
  );
}