import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueueByCode } from "@/hooks/useQueue";
import { useNextInLineAlert } from "@/hooks/useVibration";
import { useTokenPersistence } from "@/hooks/useTokenPersistence";
import { supabase } from "@/integrations/supabase/client";
import OdometerDisplay from "@/components/OdometerDisplay";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { WimiraLogo } from "@/components/WimiraLogo";
import { toast } from "sonner";
import { ArrowLeft, Ticket, Clock, Users, AlertCircle, CheckCircle2, XCircle, Bell } from "lucide-react";

const PublicQueue = () => {
  const { queueCode } = useParams<{ queueCode: string }>();
  const { queue, loading, generateToken } = useQueueByCode(queueCode);
  const [myToken, setMyToken] = useState<number | null>(null);
  const [tokenStatus, setTokenStatus] = useState<string>("active");
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const navigate = useNavigate();

  // Token persistence
  const { storedToken, saveToken, clearToken } = useTokenPersistence(queue?.id);

  // Vibration alert for next in line
  useNextInLineAlert(
    myToken,
    queue?.current_serving || 0,
    tokenStatus === "active"
  );

  // Load persisted token from localStorage
  useEffect(() => {
    if (!queue || myToken !== null) return;

    if (storedToken) {
      // Verify token still exists and is active
      const verifyToken = async () => {
        const { data } = await supabase
          .from("tokens")
          .select("token_number, status")
          .eq("queue_id", queue.id)
          .eq("token_number", storedToken)
          .maybeSingle();

        if (data) {
          setMyToken(data.token_number);
          setTokenStatus(data.status);
        } else {
          // Token no longer exists, clear storage
          clearToken();
        }
      };
      verifyToken();
    }
  }, [queue, storedToken, myToken, clearToken]);

  // Check for existing token in this session (fallback)
  useEffect(() => {
    if (!queue || myToken !== null) return;

    const checkExistingToken = async () => {
      const { data } = await supabase
        .from("tokens")
        .select("token_number, status")
        .eq("queue_id", queue.id)
        .eq("session_id", sessionId)
        .maybeSingle();

      if (data) {
        setMyToken(data.token_number);
        setTokenStatus(data.status);
        // Also save to localStorage for persistence
        saveToken(data.token_number);
      }
    };

    checkExistingToken();
  }, [queue, sessionId, myToken, saveToken]);

  // Subscribe to token status updates
  useEffect(() => {
    if (!queue || !myToken) return;

    const channel = supabase
      .channel(`token-${queue.id}-${myToken}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tokens",
          filter: `queue_id=eq.${queue.id}`,
        },
        (payload) => {
          const updated = payload.new as { token_number: number; status: string };
          if (updated.token_number === myToken) {
            setTokenStatus(updated.status);
            // Clear from storage if token is completed/missed/expired
            if (["served", "missed", "expired"].includes(updated.status)) {
              clearToken();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queue, myToken, clearToken]);

  const handleGenerateToken = async () => {
    // One token limit per device check
    if (myToken && tokenStatus === "active") {
      toast.error("You already have an active token");
      return;
    }

    setIsGenerating(true);
    const token = await generateToken(sessionId);
    if (token) {
      setMyToken(token);
      setTokenStatus("active");
      // Save to localStorage for persistence
      saveToken(token);
    }
    setIsGenerating(false);
  };

  // Check if user can generate new token
  const canGenerateNewToken = () => {
    if (!myToken) return true;
    // Can only generate new token if previous was served/missed/expired
    return ["served", "missed", "expired"].includes(tokenStatus);
  };

  const handleGenerateNewToken = async () => {
    // Clear previous token state completely
    clearToken();
    setMyToken(null);
    setTokenStatus("active");
    
    setIsGenerating(true);
    // Use a fresh session ID to ensure we get a new token via unconditional +1 increment
    const newSessionId = crypto.randomUUID();
    const token = await generateToken(newSessionId);
    if (token) {
      setMyToken(token);
      setTokenStatus("active");
      saveToken(token);
    }
    setIsGenerating(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading queue...</div>
      </div>
    );
  }

  if (!queue) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-destructive/20 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Queue Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The queue code "{queueCode}" doesn't exist.
          </p>
          <Button variant="outline" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const peopleAhead = myToken ? Math.max(0, myToken - queue.current_serving - 1) : 0;
  const isNextInLine = myToken !== null && myToken === queue.current_serving + 1;
  const estimatedWaitMinutes = queue.ewt_enabled && queue.average_service_time_seconds
    ? Math.round((peopleAhead * queue.average_service_time_seconds) / 60)
    : null;

  const tokensRemaining = queue.capacity_enabled && queue.daily_capacity
    ? Math.max(0, queue.daily_capacity - (queue.next_token - 1))
    : null;

  const isMyTurn = myToken !== null && myToken === queue.current_serving;
  const isMissedOrExpired = tokenStatus === "missed" || tokenStatus === "expired";
  const isServed = tokenStatus === "served";

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="max-w-lg mx-auto">
        {/* Header */}
        <header className="flex items-center gap-4 mb-8 animate-fade-in">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-1">Welcome to</p>
            <h1 className="text-xl font-bold text-foreground">{queue.business_name}'s Queue</h1>
            <p className="text-sm font-mono text-primary">{queue.queue_code}</p>
          </div>
          <WimiraLogo size="sm" showText={false} />
        </header>

        {/* Queue Status */}
        <div className={`rounded-2xl p-4 mb-6 flex items-center gap-3 animate-fade-in ${
          queue.system_status 
            ? "bg-success/10 border border-success/30" 
            : "bg-destructive/10 border border-destructive/30"
        }`} style={{ animationDelay: "0.1s" }}>
          <div className={`w-3 h-3 rounded-full ${queue.system_status ? "bg-success animate-pulse" : "bg-destructive"}`} />
          <span className={`font-medium ${queue.system_status ? "text-success" : "text-destructive"}`}>
            {queue.system_status ? "Queue is OPEN" : "Queue is CLOSED"}
          </span>
        </div>

        {/* Now Serving Display */}
        <div className="card-gradient rounded-2xl border border-border/50 p-8 mb-6 animate-fade-in" style={{ animationDelay: "0.15s" }}>
          <OdometerDisplay
            value={queue.current_serving}
            label="Now Serving"
            size="lg"
          />
        </div>

        {/* My Token Card */}
        {myToken !== null && (
          <div 
            className={`card-gradient rounded-2xl border-2 p-6 mb-6 animate-fade-in ${
              isMyTurn 
                ? "border-success bg-success/5 animate-pulse-glow" 
                : isNextInLine
                  ? "border-accent bg-accent/5"
                  : isMissedOrExpired
                    ? "border-destructive bg-destructive/5"
                    : isServed
                      ? "border-muted bg-muted/5"
                      : "border-primary/50"
            }`}
            style={{ animationDelay: "0.2s" }}
          >
            <div className="text-center">
              {isMyTurn && (
                <div className="flex items-center justify-center gap-2 mb-4">
                  <CheckCircle2 className="w-6 h-6 text-success" />
                  <span className="text-lg font-bold text-success">IT'S YOUR TURN!</span>
                </div>
              )}

              {isNextInLine && !isMyTurn && (
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Bell className="w-6 h-6 text-accent animate-bounce" />
                  <span className="text-lg font-bold text-accent">YOU'RE NEXT!</span>
                </div>
              )}
              
              {isMissedOrExpired && (
                <div className="flex items-center justify-center gap-2 mb-4">
                  <XCircle className="w-6 h-6 text-destructive" />
                  <span className="text-lg font-bold text-destructive">
                    {tokenStatus === "missed" ? "You missed your turn" : "Token expired"}
                  </span>
                </div>
              )}

              {isServed && (
                <div className="flex items-center justify-center gap-2 mb-4">
                  <CheckCircle2 className="w-6 h-6 text-muted-foreground" />
                  <span className="text-lg font-medium text-muted-foreground">Served</span>
                </div>
              )}

              <p className="text-sm text-muted-foreground mb-2">Your Token</p>
              <p className="text-6xl font-mono font-bold text-primary mb-4">{myToken}</p>

              {!isMyTurn && !isMissedOrExpired && !isServed && (
                <div className="flex items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {peopleAhead === 0 ? "You're next!" : `${peopleAhead} ahead`}
                    </span>
                  </div>
                  {estimatedWaitMinutes !== null && peopleAhead > 0 && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">~{estimatedWaitMinutes} min</span>
                    </div>
                  )}
                </div>
              )}

              {/* Get new token button for missed/expired/served tokens */}
              {(isMissedOrExpired || isServed) && queue.system_status && (
                <Button
                  variant="gradient"
                  className="mt-4"
                  onClick={handleGenerateNewToken}
                  disabled={isGenerating}
                >
                  {isGenerating ? "Generating..." : "Get New Token"}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Generate Token Button */}
        {myToken === null && (
          <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
            {queue.system_status ? (
              <>
                {tokensRemaining !== null && tokensRemaining <= 0 ? (
                  <div className="text-center p-6 card-gradient rounded-2xl border border-border/50">
                    <AlertCircle className="w-12 h-12 text-accent mx-auto mb-3" />
                    <p className="text-lg font-semibold text-foreground">Daily Capacity Reached</p>
                    <p className="text-sm text-muted-foreground mt-2">Token generation is closed for today.</p>
                  </div>
                ) : (
                  <Button
                    variant="gradient"
                    size="xl"
                    className="w-full"
                    onClick={handleGenerateToken}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      "Generating..."
                    ) : (
                      <>
                        <Ticket className="w-5 h-5" />
                        Get Your Token
                      </>
                    )}
                  </Button>
                )}
                
                {tokensRemaining !== null && tokensRemaining > 0 && (
                  <p className="text-center text-sm text-muted-foreground mt-4">
                    {tokensRemaining} tokens remaining today
                  </p>
                )}
              </>
            ) : (
              <div className="text-center p-6 card-gradient rounded-2xl border border-border/50">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-lg font-semibold text-foreground">Queue is Currently Closed</p>
                <p className="text-sm text-muted-foreground mt-2">Please check back later when the queue opens.</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            Powered by <span className="text-primary font-medium cursor-pointer" onClick={() => navigate("/")}>Wimira</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicQueue;
