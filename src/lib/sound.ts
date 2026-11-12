/**
 * Web Audio API synthesized sounds for POS actions.
 * Zero external asset dependencies, zero network latency, 100% offline capable.
 */

export function playSuccessChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    const playTone = (freq: number, start: number, duration: number, gainVal = 0.15) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(gainVal, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };

    // Authentic 3-note ascending chime (C5 -> E5 -> G5) - classic "ting-ting" sound
    playTone(523.25, now, 0.18, 0.15);
    playTone(659.25, now + 0.12, 0.22, 0.18);
    playTone(783.99, now + 0.25, 0.45, 0.22);
  } catch (e) {
    // Graceful fallback if autoplay policy or browser audio is disabled
    console.debug('Audio chime playback omitted:', e);
  }
}

/**
 * Speaks a Vietnamese voice notification like a store Soundbox ("Loa thần tài")
 * when a bank transfer is automatically confirmed.
 */
export function speakPaymentReceived(amount: number) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const formattedAmount = Math.round(amount).toLocaleString('vi-VN');
    const utterance = new SpeechSynthesisUtterance(
      `Đã nhận chuyển khoản ${formattedAmount} đồng`
    );
    utterance.lang = 'vi-VN';
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find((v) => v.lang.toLowerCase().includes('vi'));
    if (viVoice) {
      utterance.voice = viVoice;
    }
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.debug('Speech synthesis omitted:', e);
  }
}

