import { useCallback } from "react";
import confetti from "canvas-confetti";

export const useAchievementAnimation = () => {
  const playAchievementSound = useCallback(() => {
    // Create audio context for achievement sound
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    
    // Create a pleasant achievement sound using oscillators
    const playTone = (frequency: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = "sine";
      
      gainNode.gain.setValueAtTime(0.3, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    const now = audioContext.currentTime;
    // Play a triumphant chord progression
    playTone(523.25, now, 0.15); // C5
    playTone(659.25, now + 0.1, 0.15); // E5
    playTone(783.99, now + 0.2, 0.2); // G5
    playTone(1046.50, now + 0.3, 0.3); // C6
  }, []);

  const triggerConfetti = useCallback(() => {
    // Fire confetti from the left
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 0.1, y: 0.6 },
      colors: ['#FFD700', '#FFA500', '#FF6347', '#32CD32', '#1E90FF'],
    });

    // Fire confetti from the right
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 0.9, y: 0.6 },
      colors: ['#FFD700', '#FFA500', '#FF6347', '#32CD32', '#1E90FF'],
    });

    // Fire confetti from center after a small delay
    setTimeout(() => {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { x: 0.5, y: 0.5 },
        colors: ['#FFD700', '#FFA500', '#FF6347', '#32CD32', '#1E90FF', '#9370DB'],
      });
    }, 200);
  }, []);

  const triggerStarBurst = useCallback(() => {
    const defaults = {
      spread: 360,
      ticks: 100,
      gravity: 0,
      decay: 0.94,
      startVelocity: 30,
      colors: ['#FFD700', '#FFA500', '#FF4500'],
    };

    const shoot = () => {
      confetti({
        ...defaults,
        particleCount: 40,
        scalar: 1.2,
        shapes: ['star'],
      });

      confetti({
        ...defaults,
        particleCount: 25,
        scalar: 0.75,
        shapes: ['circle'],
      });
    };

    setTimeout(shoot, 0);
    setTimeout(shoot, 100);
    setTimeout(shoot, 200);
  }, []);

  const celebrateAchievement = useCallback((type: 'badge' | 'rank' | 'victory' = 'badge') => {
    playAchievementSound();
    
    switch (type) {
      case 'rank':
        triggerStarBurst();
        break;
      case 'victory':
        triggerConfetti();
        setTimeout(triggerStarBurst, 500);
        break;
      case 'badge':
      default:
        triggerConfetti();
        break;
    }
  }, [playAchievementSound, triggerConfetti, triggerStarBurst]);

  return { celebrateAchievement, triggerConfetti, triggerStarBurst, playAchievementSound };
};
