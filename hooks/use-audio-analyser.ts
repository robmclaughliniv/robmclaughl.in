'use client';

import { useRef, useEffect, useCallback } from 'react';

interface UseAudioAnalyserOptions {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isMuted: boolean;
  volume: number;
}

interface UseAudioAnalyserReturn {
  analyserRef: React.RefObject<AnalyserNode | null>;
  resumeAudioContext: () => Promise<void>;
  ensureGraphReady: () => boolean;
  fadeGain: (targetVolume: number, durationSec?: number) => Promise<void>;
}

interface AudioGraph {
  context: AudioContext;
  analyser: AnalyserNode;
  gain: GainNode;
}

type AudioElementWithGraph = HTMLAudioElement & {
  __audioGraph?: AudioGraph;
};

const createAudioGraph = (audio: HTMLAudioElement): AudioGraph | null => {
  const AudioContextClass =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextClass) return null;

  const ctx = new AudioContextClass();
  const source = ctx.createMediaElementSource(audio);
  const analyser = ctx.createAnalyser();
  const gain = ctx.createGain();

  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.65;
  analyser.minDecibels = -80;
  analyser.maxDecibels = -26;

  source.connect(analyser);
  analyser.connect(gain);
  gain.connect(ctx.destination);

  return { context: ctx, analyser, gain };
};

const getOrCreateAudioGraph = (audio: HTMLAudioElement): AudioGraph | null => {
  const el = audio as AudioElementWithGraph;
  if (el.__audioGraph) return el.__audioGraph;

  const graph = createAudioGraph(audio);
  if (graph) el.__audioGraph = graph;
  return graph;
};

export const useAudioAnalyser = ({
  audioRef,
  isMuted,
  volume,
}: UseAudioAnalyserOptions): UseAudioAnalyserReturn => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const ensureGraphReady = useCallback((): boolean => {
    const audio = audioRef.current;
    if (!audio) return false;

    const graph = getOrCreateAudioGraph(audio);
    if (!graph) return false;

    audio.muted = false;
    audioContextRef.current = graph.context;
    analyserRef.current = graph.analyser;
    gainNodeRef.current = graph.gain;
    graph.gain.gain.value = isMuted ? 0 : volume;
    return true;
  }, [audioRef, isMuted, volume]);

  const resumeAudioContext = useCallback(async () => {
    const audio = audioRef.current as AudioElementWithGraph | null;
    const ctx =
      audioContextRef.current ?? audio?.__audioGraph?.context ?? null;

    if (ctx?.state === 'suspended') {
      await ctx.resume();
    }
  }, [audioRef]);

  const fadeGain = useCallback(
    (targetVolume: number, durationSec = 0.3): Promise<void> =>
      new Promise((resolve) => {
        const gain = gainNodeRef.current;
        const ctx = audioContextRef.current;
        if (!gain || !ctx) {
          resolve();
          return;
        }

        const now = ctx.currentTime;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(targetVolume, now + durationSec);
        window.setTimeout(resolve, durationSec * 1000 + 20);
      }),
    []
  );

  useEffect(() => {
    ensureGraphReady();
  }, [ensureGraphReady]);

  return { analyserRef, resumeAudioContext, ensureGraphReady, fadeGain };
};
