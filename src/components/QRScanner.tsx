import { useState, useCallback } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";

interface QRScannerProps {
  onScan: (code: string) => void;
}

export const QRScanner = ({ onScan }: QRScannerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScan = useCallback((result: any) => {
    if (result && result[0]?.rawValue) {
      const scannedValue = result[0].rawValue;
      // Extract queue code from URL or use raw value
      let queueCode = scannedValue;
      
      // Check if it's a URL containing /queue/
      const urlMatch = scannedValue.match(/\/queue\/([A-Za-z0-9-]+)/);
      if (urlMatch) {
        queueCode = urlMatch[1];
      }
      
      setIsOpen(false);
      onScan(queueCode.toUpperCase());
    }
  }, [onScan]);

  const handleError = (err: any) => {
    console.error("QR Scanner error:", err);
    setError("Camera access denied. Please enable camera permissions.");
  };

  return (
    <>
      <Button
        variant="outline"
        size="lg"
        onClick={() => {
          setError(null);
          setIsOpen(true);
        }}
        className="w-full gap-2"
      >
        <Camera className="w-5 h-5" />
        Scan Business Code
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Scan QR Code</DialogTitle>
          </DialogHeader>
          
          <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-secondary">
            {error ? (
              <div className="flex h-full items-center justify-center p-4 text-center">
                <p className="text-destructive">{error}</p>
              </div>
            ) : (
              <Scanner
                onScan={handleScan}
                onError={handleError}
                constraints={{ facingMode: "environment" }}
                styles={{
                  container: { width: "100%", height: "100%" },
                  video: { width: "100%", height: "100%", objectFit: "cover" },
                }}
              />
            )}
          </div>
          
          <p className="text-center text-sm text-muted-foreground">
            Point your camera at the business QR code
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default QRScanner;
