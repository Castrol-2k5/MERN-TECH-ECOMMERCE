import { useRef, useCallback, useMemo } from 'react';

export const usePosAudio = () => {
  const audioCtxRef = useRef(null);

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  }, []);

  const playSuccess = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } catch {
      // Audio not permitted or not supported
    }
  }, [getAudioContext]);

  const playError = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const playBeep = (startTime) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(280, startTime);

        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.12);
      };

      playBeep(ctx.currentTime);
      playBeep(ctx.currentTime + 0.16);
    } catch {
      // Audio not permitted
    }
  }, [getAudioContext]);

  return useMemo(
    () => ({
      playSuccess,
      playError,
      playSuccessBeep: playSuccess,
      playErrorBeep: playError
    }),
    [playSuccess, playError]
  );
};

export default usePosAudio;
