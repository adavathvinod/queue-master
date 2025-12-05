import { useCallback, useRef } from "react";

export const useAudioAnnouncement = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const playAnnouncement = useCallback(() => {
    // Create audio context if not exists
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = audioContextRef.current;
    
    // Create a pleasant chime sound
    const playTone = (frequency: number, startTime: number, duration: number) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = "sine";
      
      gainNode.gain.setValueAtTime(0.3, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    
    // Play a pleasant ascending chime (C5 - E5 - G5)
    playTone(523.25, now, 0.3);        // C5
    playTone(659.25, now + 0.15, 0.3); // E5
    playTone(783.99, now + 0.3, 0.4);  // G5

  }, []);

  return { playAnnouncement };
};

export default useAudioAnnouncement;
