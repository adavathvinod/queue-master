import { QRCodeSVG } from "qrcode.react";
import { Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface QRCodeDisplayProps {
  queueCode: string;
  businessName: string;
}

const QRCodeDisplay = ({ queueCode, businessName }: QRCodeDisplayProps) => {
  const queueUrl = `${window.location.origin}/queue/${queueCode}`;

  const handleDownload = () => {
    const svg = document.getElementById("queue-qr-code");
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `${queueCode}-qr.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
        toast.success("QR Code downloaded!");
      };
      img.src = "data:image/svg+xml;base64," + btoa(svgData);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Join ${businessName} Queue`,
          text: `Use code "${queueCode}" to join the queue`,
          url: queueUrl,
        });
      } else {
        await navigator.clipboard.writeText(queueUrl);
        toast.success("Link copied to clipboard!");
      }
    } catch (error) {
      toast.error("Failed to share");
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 card-gradient rounded-2xl border border-border/50">
      <h3 className="text-lg font-semibold text-foreground">Share Your Queue</h3>
      
      <div className="p-4 bg-foreground rounded-xl">
        <QRCodeSVG
          id="queue-qr-code"
          value={queueUrl}
          size={180}
          level="H"
          includeMargin={false}
          bgColor="#ffffff"
          fgColor="#0a0a0f"
        />
      </div>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">Queue Code</p>
        <p className="text-2xl font-mono font-bold text-primary">{queueCode}</p>
      </div>

      <div className="flex gap-2 w-full">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          className="flex-1"
        >
          <Download className="w-4 h-4" />
          Download
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          className="flex-1"
        >
          <Share2 className="w-4 h-4" />
          Share
        </Button>
      </div>
    </div>
  );
};

export default QRCodeDisplay;
