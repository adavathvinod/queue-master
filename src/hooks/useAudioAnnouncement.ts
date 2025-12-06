import { useCallback, useRef } from "react";

export const useAudioAnnouncement = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);

  const playAnnouncement = useCallback((currentServing: number) => {
    // Play chime sound first
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = audioContextRef.current;
    
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

    // Dynamic TTS announcement after chime
    setTimeout(() => {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(`Now serving number ${currentServing}`);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;
        speechSynthRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      }
    }, 600);

  }, []);

  return { playAnnouncement };
};

export default useAudioAnnouncement;
