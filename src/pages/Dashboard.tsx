import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useOwnerQueues, QueueInstance } from "@/hooks/useQueue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Plus, 
  LogOut, 
  Settings, 
  Ticket, 
  Users,
  ChevronRight,
  Power,
  PowerOff
} from "lucide-react";

const Dashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { queues, loading: queuesLoading, createQueue } = useOwnerQueues(user?.id);
  const [isCreating, setIsCreating] = useState(false);
  const [newBusinessName, setNewBusinessName] = useState("");
  const [newQueueCode, setNewQueueCode] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleCreateQueue = async () => {
    if (!newBusinessName.trim() || !newQueueCode.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!/^[A-Za-z0-9-]+$/.test(newQueueCode)) {
      toast.error("Queue code can only contain letters, numbers, and hyphens");
      return;
    }

    setIsCreating(true);
    const result = await createQueue(newBusinessName, newQueueCode);
    setIsCreating(false);

    if (result) {
      setDialogOpen(false);
      setNewBusinessName("");
      setNewQueueCode("");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading || queuesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-8 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Ticket className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">QueueFlow</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="w-5 h-5" />
          </Button>
        </header>

        {/* Create Queue Button */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gradient" size="lg" className="mb-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <Plus className="w-5 h-5" />
              Create New Queue
            </Button>
          </DialogTrigger>
          <DialogContent className="card-gradient border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Create New Queue</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="business-name">Business Name</Label>
                <Input
                  id="business-name"
                  placeholder="My Restaurant"
                  value={newBusinessName}
                  onChange={(e) => setNewBusinessName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="queue-code">Queue Code</Label>
                <Input
                  id="queue-code"
                  placeholder="MY-RESTAURANT-1"
                  value={newQueueCode}
                  onChange={(e) => setNewQueueCode(e.target.value.toUpperCase())}
                />
                <p className="text-xs text-muted-foreground">
                  Customers will use this code to join your queue
                </p>
              </div>
              <Button
                variant="gradient"
                className="w-full"
                onClick={handleCreateQueue}
                disabled={isCreating}
              >
                {isCreating ? "Creating..." : "Create Queue"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Queues Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {queues.length === 0 ? (
            <div className="col-span-full text-center py-16 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No queues yet</h3>
              <p className="text-muted-foreground">Create your first queue to get started</p>
            </div>
          ) : (
            queues.map((queue, index) => (
              <QueueCard 
                key={queue.id} 
                queue={queue} 
                onClick={() => navigate(`/manage/${queue.id}`)}
                style={{ animationDelay: `${0.1 * (index + 1)}s` }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

interface QueueCardProps {
  queue: QueueInstance;
  onClick: () => void;
  style?: React.CSSProperties;
}

const QueueCard = ({ queue, onClick, style }: QueueCardProps) => {
  return (
    <button
      onClick={onClick}
      className="card-gradient rounded-2xl border border-border/50 p-6 text-left hover:border-primary/50 transition-all duration-300 hover:shadow-lg group animate-fade-in"
      style={style}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          {queue.system_status ? (
            <Power className="w-5 h-5 text-success" />
          ) : (
            <PowerOff className="w-5 h-5 text-muted-foreground" />
          )}
          <span className={`text-sm font-medium ${queue.system_status ? "text-success" : "text-muted-foreground"}`}>
            {queue.system_status ? "OPEN" : "CLOSED"}
          </span>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-1">{queue.business_name}</h3>
      <p className="text-sm font-mono text-primary mb-4">{queue.queue_code}</p>

      <div className="flex items-center gap-6 text-sm">
        <div>
          <span className="text-muted-foreground">Serving</span>
          <p className="font-bold text-foreground text-lg">{queue.current_serving}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Next Token</span>
          <p className="font-bold text-foreground text-lg">{queue.next_token}</p>
        </div>
      </div>
    </button>
  );
};

export default Dashboard;
