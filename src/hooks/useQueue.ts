import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface QueueInstance {
  id: string;
  owner_id: string;
  queue_code: string;
  business_name: string;
  system_status: boolean;
  current_serving: number;
  next_token: number;
  strict_missed_policy: boolean;
  multi_counter_enabled: boolean;
  ewt_enabled: boolean;
  capacity_enabled: boolean;
  daily_capacity: number | null;
  average_service_time_seconds: number | null;
  last_reset_date: string;
  created_at: string;
  updated_at: string;
  industry_type: string;
  audio_enabled: boolean;
  requeue_enabled: boolean;
}

export const useQueue = (queueId?: string) => {
  const [queue, setQueue] = useState<QueueInstance | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchQueue = useCallback(async () => {
    if (!queueId) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("queue_instances")
      .select("*")
      .eq("id", queueId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching queue:", error);
      toast.error("Failed to load queue");
    } else {
      setQueue(data as QueueInstance);
    }
    setLoading(false);
  }, [queueId]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Real-time subscription
  useEffect(() => {
    if (!queueId) return;

    const channel = supabase
      .channel(`queue-${queueId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "queue_instances",
          filter: `id=eq.${queueId}`,
        },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            setQueue(payload.new as QueueInstance);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queueId]);

  const updateQueue = async (updates: Partial<QueueInstance>) => {
    if (!queueId) return;

    const { error } = await supabase
      .from("queue_instances")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", queueId);

    if (error) {
      console.error("Error updating queue:", error);
      toast.error("Failed to update queue");
    }
  };

  const incrementServing = async () => {
    if (!queue) return;

    const newServing = queue.current_serving + 1;
    
    // If strict policy is enabled, mark missed tokens as expired
    if (queue.strict_missed_policy) {
      await supabase
        .from("tokens")
        .update({ status: "missed" })
        .eq("queue_id", queueId)
        .lt("token_number", newServing)
        .eq("status", "active");
    }

    // Mark current token as served
    await supabase
      .from("tokens")
      .update({ status: "served" })
      .eq("queue_id", queueId)
      .eq("token_number", newServing);

    await updateQueue({ current_serving: newServing });
    toast.success(`Now serving: ${newServing}`);
  };

  const toggleSystemStatus = async (status: boolean) => {
    await updateQueue({ system_status: status });
    toast.success(status ? "Queue is now OPEN" : "Queue is now CLOSED");
  };

  const requeueToken = async (tokenNumber: number, strictMissedPolicy: boolean) => {
    if (!queue) return false;

    // Check if token exists
    const { data: existingToken } = await supabase
      .from("tokens")
      .select("*")
      .eq("queue_id", queueId)
      .eq("token_number", tokenNumber)
      .maybeSingle();

    if (!existingToken) {
      toast.error("Token not found");
      return false;
    }

    // Strict rule: Cannot requeue missed/expired tokens
    if (strictMissedPolicy && (existingToken.status === "missed" || existingToken.status === "expired")) {
      toast.error("Cannot re-queue missed/expired tokens. Customer must generate a new token.");
      return false;
    }

    // Reactivate the token
    const { error } = await supabase
      .from("tokens")
      .update({ status: "active" })
      .eq("queue_id", queueId)
      .eq("token_number", tokenNumber);

    if (error) {
      console.error("Error re-queuing token:", error);
      toast.error("Failed to re-queue token");
      return false;
    }

    toast.success(`Token ${tokenNumber} has been re-queued`);
    return true;
  };

  // Issue paper token for non-digital users
  const issuePaperToken = async () => {
    if (!queue) return null;

    const tokenNumber = queue.next_token;

    // Insert token with "paper" status
    const { error: tokenError } = await supabase.from("tokens").insert({
      queue_id: queue.id,
      token_number: tokenNumber,
      session_id: `paper-${Date.now()}`,
      status: "active",
    });

    if (tokenError) {
      console.error("Error issuing paper token:", tokenError);
      toast.error("Failed to issue paper token");
      return null;
    }

    // Increment next_token
    const { error: updateError } = await supabase
      .from("queue_instances")
      .update({ next_token: tokenNumber + 1 })
      .eq("id", queue.id);

    if (updateError) {
      console.error("Error updating next token:", updateError);
    }

    toast.success(`Paper token issued: ${tokenNumber}`);
    return tokenNumber;
  };

  // Manual counter reset
  const resetCounters = async () => {
    if (!queue) return false;

    // Reset current_serving and next_token
    const { error } = await supabase
      .from("queue_instances")
      .update({ 
        current_serving: 0, 
        next_token: 1,
        updated_at: new Date().toISOString()
      })
      .eq("id", queueId);

    if (error) {
      console.error("Error resetting counters:", error);
      toast.error("Failed to reset counters");
      return false;
    }

    // Mark all active tokens as expired
    await supabase
      .from("tokens")
      .update({ status: "expired" })
      .eq("queue_id", queueId)
      .eq("status", "active");

    toast.success("Queue counters reset to 0");
    return true;
  };

  return {
    queue,
    loading,
    updateQueue,
    incrementServing,
    toggleSystemStatus,
    requeueToken,
    issuePaperToken,
    resetCounters,
    refetch: fetchQueue,
  };
};

export const useQueueByCode = (queueCode?: string) => {
  const [queue, setQueue] = useState<QueueInstance | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchQueue = useCallback(async () => {
    if (!queueCode) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("queue_instances")
      .select("*")
      .eq("queue_code", queueCode.toUpperCase())
      .maybeSingle();

    if (error) {
      console.error("Error fetching queue:", error);
    }
    setQueue(data as QueueInstance);
    setLoading(false);
  }, [queueCode]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Real-time subscription
  useEffect(() => {
    if (!queue?.id) return;

    const channel = supabase
      .channel(`queue-code-${queue.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "queue_instances",
          filter: `id=eq.${queue.id}`,
        },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            setQueue(payload.new as QueueInstance);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queue?.id]);

  const generateToken = async (sessionId: string) => {
    if (!queue) return null;

    // Check capacity
    if (queue.capacity_enabled && queue.daily_capacity) {
      const tokensToday = queue.next_token - 1;
      if (tokensToday >= queue.daily_capacity) {
        toast.error("Daily capacity reached. Token generation closed.");
        return null;
      }
    }

    if (!queue.system_status) {
      toast.error("Queue is currently closed");
      return null;
    }

    const tokenNumber = queue.next_token;

    // Insert token
    const { error: tokenError } = await supabase.from("tokens").insert({
      queue_id: queue.id,
      token_number: tokenNumber,
      session_id: sessionId,
    });

    if (tokenError) {
      console.error("Error creating token:", tokenError);
      toast.error("Failed to generate token");
      return null;
    }

    // Increment next_token
    const { error: updateError } = await supabase
      .from("queue_instances")
      .update({ next_token: tokenNumber + 1 })
      .eq("id", queue.id);

    if (updateError) {
      console.error("Error updating next token:", updateError);
    }

    toast.success(`Your token: ${tokenNumber}`);
    return tokenNumber;
  };

  return {
    queue,
    loading,
    generateToken,
    refetch: fetchQueue,
  };
};

export const useOwnerQueues = (userId?: string) => {
  const [queues, setQueues] = useState<QueueInstance[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueues = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("queue_instances")
      .select("*")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching queues:", error);
    } else {
      setQueues((data || []) as QueueInstance[]);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchQueues();
  }, [fetchQueues]);

  const createQueue = async (businessName: string, queueCode: string, industryType: string) => {
    if (!userId) return null;

    const { data, error } = await supabase
      .from("queue_instances")
      .insert({
        owner_id: userId,
        business_name: businessName,
        queue_code: queueCode.toUpperCase(),
        industry_type: industryType,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        toast.error("Queue code already exists. Please choose another.");
      } else {
        toast.error("Failed to create queue");
      }
      return null;
    }

    setQueues((prev) => [data as QueueInstance, ...prev]);
    toast.success("Queue created successfully!");
    return data as QueueInstance;
  };

  const deleteQueue = async (queueId: string) => {
    // Delete all related tokens first
    await supabase
      .from("tokens")
      .delete()
      .eq("queue_id", queueId);

    // Delete all related counters
    await supabase
      .from("counters")
      .delete()
      .eq("queue_id", queueId);

    // Delete the queue
    const { error } = await supabase
      .from("queue_instances")
      .delete()
      .eq("id", queueId);

    if (error) {
      console.error("Error deleting queue:", error);
      toast.error("Failed to delete queue");
      return false;
    }

    setQueues((prev) => prev.filter((q) => q.id !== queueId));
    toast.success("Queue deleted successfully");
    return true;
  };

  return { queues, loading, createQueue, deleteQueue, refetch: fetchQueues };
};
