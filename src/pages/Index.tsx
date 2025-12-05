import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Users, Settings, QrCode, Zap } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { WimiraLogo } from "@/components/WimiraLogo";
import { QRScanner } from "@/components/QRScanner";

const Index = () => {
  const [queueCode, setQueueCode] = useState("");
  const navigate = useNavigate();

  const handleJoinQueue = (e: React.FormEvent) => {
    e.preventDefault();
    if (queueCode.trim()) {
      navigate(`/queue/${queueCode.trim().toUpperCase()}`);
    }
  };

  const handleQRScan = (code: string) => {
    navigate(`/queue/${code}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          {/* Logo & Title */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="flex justify-center mb-6">
              <WimiraLogo size="xl" />
            </div>
          </div>

          {/* Join Queue Form */}
          <div className="card-gradient rounded-3xl border border-border/50 p-8 shadow-2xl animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <h2 className="text-xl font-semibold text-foreground mb-6 text-center">
              Join a Queue
            </h2>
            
            {/* QR Scanner */}
            <div className="mb-4">
              <QRScanner onScan={handleQRScan} />
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or enter manually</span>
              </div>
            </div>
            
            <form onSubmit={handleJoinQueue} className="space-y-4">
              <div>
                <Input
                  placeholder="Enter business code (e.g., CAFE-1)"
                  value={queueCode}
                  onChange={(e) => setQueueCode(e.target.value.toUpperCase())}
                  className="text-center text-lg font-mono h-14"
                />
              </div>
              <Button
                type="submit"
                variant="gradient"
                size="xl"
                className="w-full"
                disabled={!queueCode.trim()}
              >
                Join Queue
                <ArrowRight className="w-5 h-5" />
              </Button>
            </form>
          </div>

          {/* Owner CTA */}
          <div className="mt-8 text-center animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <p className="text-muted-foreground mb-4">
              Own a business? Manage your own queue
            </p>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate("/auth")}
            >
              <Settings className="w-4 h-4" />
              Owner Dashboard
            </Button>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="py-16 px-4 border-t border-border/50">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-foreground text-center mb-12 animate-fade-in">
            Why Wimira?
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<QrCode className="w-6 h-6" />}
              title="QR Code Sharing"
              description="Generate QR codes for easy customer access to your queue"
              delay="0.3s"
            />
            <FeatureCard
              icon={<Zap className="w-6 h-6" />}
              title="Real-Time Updates"
              description="Live updates for both customers and queue owners"
              delay="0.4s"
            />
            <FeatureCard
              icon={<Users className="w-6 h-6" />}
              title="Multi-Counter"
              description="Support multiple service counters with smart assignment"
              delay="0.5s"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-4 border-t border-border/50 text-center">
        <p className="text-sm text-muted-foreground">
          © 2024 Wimira Token Management System
        </p>
      </footer>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: string;
}

const FeatureCard = ({ icon, title, description, delay }: FeatureCardProps) => (
  <div 
    className="card-gradient rounded-2xl border border-border/50 p-6 text-center animate-fade-in"
    style={{ animationDelay: delay }}
  >
    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-4 text-primary">
      {icon}
    </div>
    <h4 className="font-semibold text-foreground mb-2">{title}</h4>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

export default Index;
