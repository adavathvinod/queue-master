import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQueue } from "@/hooks/useQueue";
import { useAudioAnnouncement } from "@/hooks/useAudioAnnouncement";
import OdometerDisplay from "@/components/OdometerDisplay";
import StatusToggle from "@/components/StatusToggle";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import SwipeNextButton from "@/components/SwipeNextButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { WimiraLogo } from "@/components/WimiraLogo";
import { getIndustryLabel } from "@/components/IndustrySelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, Settings, RotateCcw } from "lucide-react";

const ManageQueue = () => {
  const { queueId } = useParams<{ queueId: string }>();
  const { user, loading: authLoading } = useAuth();
  const { queue, loading: queueLoading, updateQueue, incrementServing, toggleSystemStatus, requeueToken } = useQueue(queueId);
  const { playAnnouncement } = useAudioAnnouncement();
  const navigate = useNavigate();
  
  const [requeueTokenNumber, setRequeueTokenNumber] = useState("");
  const [requeueDialogOpen, setRequeueDialogOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!queueLoading && queue && queue.owner_id !== user?.id) {
      navigate("/dashboard");
    }
  }, [queue, user, queueLoading, navigate]);

  const handleIncrementServing = async () => {
    await incrementServing();
    if (queue?.audio_enabled) {
      playAnnouncement();
    }
  };

  const handleRequeue = async () => {
    const tokenNum = parseInt(requeueTokenNumber);
    if (isNaN(tokenNum) || tokenNum <= 0) {
      toast.error("Please enter a valid token number");
      return;
    }
    
    const success = await requeueToken(tokenNum);
    if (success) {
      setRequeueDialogOpen(false);
      setRequeueTokenNumber("");
    }
  };

  if (authLoading || queueLoading || !queue) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const tokensRemaining = queue.capacity_enabled && queue.daily_capacity
    ? Math.max(0, queue.daily_capacity - (queue.next_token - 1))
    : null;

  const peopleWaiting = queue.next_token - queue.current_serving - 1;

  const estimatedWaitMinutes = queue.ewt_enabled && queue.average_service_time_seconds
    ? Math.round((peopleWaiting * queue.average_service_time_seconds) / 60)
    : null;

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="flex items-center gap-4 mb-8 animate-fade-in">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{queue.business_name}</h1>
            <div className="flex items-center gap-2">
              <p className="text-sm font-mono text-primary">{queue.queue_code}</p>
              <span className="text-muted-foreground">•</span>
              <p className="text-sm text-muted-foreground">{getIndustryLabel(queue.industry_type)}</p>
            </div>
          </div>
          <WimiraLogo size="sm" showText={false} />
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column - Main Controls */}
          <div className="space-y-6">
            {/* System Status */}
            <div className="card-gradient rounded-2xl border border-border/50 p-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <StatusToggle
                label="System Status"
                description={queue.system_status ? "Queue is accepting tokens" : "Queue is closed"}
                checked={queue.system_status}
                onCheckedChange={toggleSystemStatus}
                variant="success"
              />
            </div>

            {/* Current Serving Display */}
            <div className="card-gradient rounded-2xl border border-border/50 p-8 animate-fade-in" style={{ animationDelay: "0.15s" }}>
              <OdometerDisplay
                value={queue.current_serving}
                label="Now Serving"
                size="xl"
              />
              
              {/* Stats Row */}
              <div className="flex justify-center gap-8 mt-6 text-sm">
                <div className="text-center">
                  <span className="text-muted-foreground">Waiting</span>
                  <p className="text-xl font-bold text-foreground">{Math.max(0, peopleWaiting)}</p>
                </div>
                <div className="text-center">
                  <span className="text-muted-foreground">Next Token</span>
                  <p className="text-xl font-bold text-primary">{queue.next_token}</p>
                </div>
                {tokensRemaining !== null && (
                  <div className="text-center">
                    <span className="text-muted-foreground">Remaining</span>
                    <p className="text-xl font-bold text-accent">{tokensRemaining}</p>
                  </div>
                )}
              </div>

              {estimatedWaitMinutes !== null && peopleWaiting > 0 && (
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Estimated wait: ~{estimatedWaitMinutes} min
                </p>
              )}
            </div>

            {/* Swipe to Next */}
            <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <SwipeNextButton
                onSwipe={handleIncrementServing}
                disabled={!queue.system_status}
                label={queue.system_status ? "Swipe to serve next" : "Open queue to serve"}
              />
            </div>

            {/* Re-queue Button (when enabled) */}
            {queue.requeue_enabled && (
              <Dialog open={requeueDialogOpen} onOpenChange={setRequeueDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full gap-2 animate-fade-in" style={{ animationDelay: "0.25s" }}>
                    <RotateCcw className="w-4 h-4" />
                    Re-Queue Token
                  </Button>
                </DialogTrigger>
                <DialogContent className="card-gradient border-border">
                  <DialogHeader>
                    <DialogTitle className="text-foreground">Re-Queue Token</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <p className="text-sm text-muted-foreground">
                      Enter the token number to place it back into the queue. It will be served immediately after the current number.
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="requeue-token">Token Number</Label>
                      <Input
                        id="requeue-token"
                        type="number"
                        min="1"
                        placeholder="Enter token number"
                        value={requeueTokenNumber}
                        onChange={(e) => setRequeueTokenNumber(e.target.value)}
                      />
                    </div>
                    <Button
                      variant="gradient"
                      className="w-full"
                      onClick={handleRequeue}
                    >
                      Re-Queue Token
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Right Column - Settings & QR */}
          <div className="space-y-6">
            {/* QR Code */}
            <div className="animate-fade-in" style={{ animationDelay: "0.25s" }}>
              <QRCodeDisplay
                queueCode={queue.queue_code}
                businessName={queue.business_name}
              />
            </div>

            {/* Policy Toggles */}
            <div className="card-gradient rounded-2xl border border-border/50 p-6 space-y-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Queue Settings
              </h3>

              <StatusToggle
                label="Strict Missed Token Policy"
                description="Invalidate tokens when queue passes them"
                checked={queue.strict_missed_policy}
                onCheckedChange={(checked) => updateQueue({ strict_missed_policy: checked })}
                variant="warning"
              />

              <StatusToggle
                label="Estimated Wait Time"
                description="Show wait time estimates to customers"
                checked={queue.ewt_enabled}
                onCheckedChange={(checked) => updateQueue({ ewt_enabled: checked })}
              />

              <StatusToggle
                label="Daily Capacity Limit"
                description="Limit tokens per day"
                checked={queue.capacity_enabled}
                onCheckedChange={(checked) => updateQueue({ capacity_enabled: checked })}
              />

              {queue.capacity_enabled && (
                <div className="pt-2 space-y-2">
                  <Label htmlFor="capacity" className="text-sm text-muted-foreground">
                    Max Tokens Per Day
                  </Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    value={queue.daily_capacity || 100}
                    onChange={(e) => updateQueue({ daily_capacity: parseInt(e.target.value) || 100 })}
                    className="w-32"
                  />
                </div>
              )}

              <StatusToggle
                label="Multi-Counter Support"
                description="Enable multiple service counters"
                checked={queue.multi_counter_enabled}
                onCheckedChange={(checked) => updateQueue({ multi_counter_enabled: checked })}
              />

              <StatusToggle
                label="Audio Announcements"
                description="Play sound when calling next token"
                checked={queue.audio_enabled}
                onCheckedChange={(checked) => updateQueue({ audio_enabled: checked })}
              />

              <StatusToggle
                label="Manual Service Control"
                description="Enable re-queue token functionality"
                checked={queue.requeue_enabled}
                onCheckedChange={(checked) => updateQueue({ requeue_enabled: checked })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageQueue;
