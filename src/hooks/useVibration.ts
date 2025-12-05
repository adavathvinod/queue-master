import { useEffect, useRef, useCallback } from "react";

export const useVibration = () => {
  const hasVibratedRef = useRef(false);

  const vibrate = useCallback((duration: number = 5000) => {
    if (hasVibratedRef.current) return;
    
    if ("vibrate" in navigator) {
      // Vibration pattern: vibrate-pause-vibrate for 5 seconds total
      const pattern = [500, 200, 500, 200, 500, 200, 500, 200, 500, 200, 500];
      navigator.vibrate(pattern);
      hasVibratedRef.current = true;
    }
  }, []);

  const reset = useCallback(() => {
    hasVibratedRef.current = false;
  }, []);

  return { vibrate, reset, hasVibrated: hasVibratedRef.current };
};

export const useNextInLineAlert = (
  myToken: number | null,
  currentServing: number,
  isActive: boolean
) => {
  const { vibrate, reset } = useVibration();
  const hasAlertedRef = useRef(false);

  useEffect(() => {
    if (!isActive || myToken === null) {
      hasAlertedRef.current = false;
      reset();
      return;
    }

    // Check if user is next in line (their token is currentServing + 1)
    const isNextInLine = myToken === currentServing + 1;

    if (isNextInLine && !hasAlertedRef.current) {
      vibrate(5000);
      hasAlertedRef.current = true;
    }

    // Reset if they've been served or passed
    if (myToken <= currentServing) {
      hasAlertedRef.current = false;
    }
  }, [myToken, currentServing, isActive, vibrate, reset]);
};

export default useVibration;
