import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Ticket, ArrowRight, Users, Settings, QrCode, Zap } from "lucide-react";

const Index = () => {
  const [queueCode, setQueueCode] = useState("");
  const navigate = useNavigate();

  const handleJoinQueue = (e: React.FormEvent) => {
    e.preventDefault();
    if (queueCode.trim()) {
      navigate(`/queue/${queueCode.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          {/* Logo & Title */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="w-20 h-20 rounded-3xl bg-primary/20 flex items-center justify-center mx-auto mb-6 glow-primary">
              <Ticket className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">
              Queue<span className="text-primary">Flow</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Universal Virtual Queue Management
            </p>
          </div>

          {/* Join Queue Form */}
          <div className="card-gradient rounded-3xl border border-border/50 p-8 shadow-2xl animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <h2 className="text-xl font-semibold text-foreground mb-6 text-center">
              Join a Queue
            </h2>
            
            <form onSubmit={handleJoinQueue} className="space-y-4">
              <div>
                <Input
                  placeholder="Enter queue code (e.g., CAFE-1)"
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
            Why QueueFlow?
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
          © 2024 QueueFlow. Universal Queue Management System.
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
