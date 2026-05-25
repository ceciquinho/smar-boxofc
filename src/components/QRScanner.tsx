import { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

interface Props {
  onScan: (token: string) => void;
}

export default function QRScanner({ onScan }: Props) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: 250,
      },
      false
    );

    scanner.render(
      (decodedText) => {
        onScan(decodedText);
        scanner.clear();
      },
      (error) => {
        console.log(error);
      }
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, []);

  return <div id="reader" className="w-full" />;
}