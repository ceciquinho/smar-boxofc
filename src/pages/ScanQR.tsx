import QRScanner from "@/components/QRScanner";

export default function ScanQR() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        Escanear QR Code
      </h1>

      <QRScanner
        onScan={async (token) => {
          console.log("QR lido:", token);

         const response = await fetch(
  "https://fvlsnesfzxlsxyaygjrh.supabase.co/functions/v1/box-validate",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-box-api-key": "PI_CAIXA_INTELIGENTE/2026"
    },
    body: JSON.stringify({
      token,
      box_id: "BOX-001"
    })
  }
);

          const data = await response.json();

          console.log(data);

          if (data.success) {
            alert("Caixa aberta!");
          } else {
            alert(data.reason);
          }
        }}
      />
    </div>
  );
}