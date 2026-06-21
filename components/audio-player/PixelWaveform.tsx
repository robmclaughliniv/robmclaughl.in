'use client';

import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface PixelWaveformProps {
  analyserRef: React.RefObject<AnalyserNode | null>;
  isPlaying: boolean;
  barCount?: number;
  className?: string;
}

const ACCENT_COLOR = 'hsl(322 100% 70%)';
const IDLE_BAR_HEIGHT = 2;
const AMPLIFY = 1.2;
const GAMMA = 0.76;

const getLogBinRange = (
  barIndex: number,
  barCount: number,
  bufferLength: number
): { start: number; end: number } => {
  const startRatio = barIndex / barCount;
  const endRatio = (barIndex + 1) / barCount;
  const start = Math.floor(bufferLength * startRatio ** 1.6);
  const end = Math.max(start + 1, Math.floor(bufferLength * endRatio ** 1.6));
  return { start, end: Math.min(end, bufferLength) };
};

const getBarIntensity = (
  dataArray: Uint8Array,
  barIndex: number,
  barCount: number
): number => {
  const { start, end } = getLogBinRange(barIndex, barCount, dataArray.length);
  let peak = 0;

  for (let i = start; i < end; i++) {
    if (dataArray[i] > peak) peak = dataArray[i];
  }

  const normalized = peak / 255;
  return Math.min(1, normalized ** GAMMA * AMPLIFY);
};

export const PixelWaveform = ({
  analyserRef,
  isPlaying,
  barCount = 12,
  className,
}: PixelWaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const drawIdleBars = () => {
      const width = canvas.width;
      const height = canvas.height;
      const gap = 1;
      const barWidth = Math.floor((width - gap * (barCount - 1)) / barCount);

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = ACCENT_COLOR;

      for (let i = 0; i < barCount; i++) {
        const x = i * (barWidth + gap);
        ctx.fillRect(x, height - IDLE_BAR_HEIGHT, barWidth, IDLE_BAR_HEIGHT);
      }
    };

    const drawFrame = () => {
      const analyser = analyserRef.current;
      if (!analyser) {
        drawIdleBars();
        return;
      }

      if (!dataArrayRef.current) {
        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
      }

      const dataArray = dataArrayRef.current;
      analyser.getByteFrequencyData(dataArray);

      const width = canvas.width;
      const height = canvas.height;
      const gap = 1;
      const barWidth = Math.floor((width - gap * (barCount - 1)) / barCount);

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = ACCENT_COLOR;

      for (let i = 0; i < barCount; i++) {
        const intensity = getBarIntensity(dataArray, i, barCount);
        const rawHeight = Math.max(
          IDLE_BAR_HEIGHT,
          IDLE_BAR_HEIGHT + intensity * (height - IDLE_BAR_HEIGHT)
        );
        const barHeight = Math.max(
          IDLE_BAR_HEIGHT,
          Math.round(rawHeight / 2) * 2
        );
        const x = i * (barWidth + gap);
        const y = height - barHeight;

        ctx.fillRect(x, y, barWidth, barHeight);
      }

      animationRef.current = requestAnimationFrame(drawFrame);
    };

    if (isPlaying && !prefersReducedMotion) {
      animationRef.current = requestAnimationFrame(drawFrame);
    } else {
      drawIdleBars();
    }

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [analyserRef, isPlaying, barCount]);

  return (
    <canvas
      ref={canvasRef}
      width={barCount * 4}
      height={16}
      aria-hidden="true"
      className={cn('image-rendering-pixelated', className)}
    />
  );
};
