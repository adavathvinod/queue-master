import { useState, useEffect, useCallback } from "react";

interface StoredToken {
  tokenNumber: number;
  queueId: string;
  timestamp: number;
}

const STORAGE_KEY_PREFIX = "wimira_token_";

export const useTokenPersistence = (queueId?: string) => {
  const [storedToken, setStoredToken] = useState<number | null>(null);

  // Get storage key for this queue
  const getStorageKey = useCallback(() => {
    return `${STORAGE_KEY_PREFIX}${queueId}`;
  }, [queueId]);

  // Load stored token on mount
  useEffect(() => {
    if (!queueId) return;

    try {
      const stored = localStorage.getItem(getStorageKey());
      if (stored) {
        const parsed: StoredToken = JSON.parse(stored);
        // Check if stored for same queue
        if (parsed.queueId === queueId) {
          setStoredToken(parsed.tokenNumber);
        }
      }
    } catch (error) {
      console.error("Error loading stored token:", error);
    }
  }, [queueId, getStorageKey]);

  // Save token to storage
  const saveToken = useCallback((tokenNumber: number) => {
    if (!queueId) return;

    try {
      const data: StoredToken = {
        tokenNumber,
        queueId,
        timestamp: Date.now(),
      };
      localStorage.setItem(getStorageKey(), JSON.stringify(data));
      setStoredToken(tokenNumber);
    } catch (error) {
      console.error("Error saving token:", error);
    }
  }, [queueId, getStorageKey]);

  // Clear stored token
  const clearToken = useCallback(() => {
    if (!queueId) return;

    try {
      localStorage.removeItem(getStorageKey());
      setStoredToken(null);
    } catch (error) {
      console.error("Error clearing token:", error);
    }
  }, [queueId, getStorageKey]);

  // Check if device already has an active token
  const hasActiveToken = useCallback(() => {
    return storedToken !== null;
  }, [storedToken]);

  return {
    storedToken,
    saveToken,
    clearToken,
    hasActiveToken,
  };
};

export default useTokenPersistence;
