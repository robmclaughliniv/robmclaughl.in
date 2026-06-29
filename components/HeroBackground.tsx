'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useSyncedBackgrounds } from '@/hooks/use-synced-backgrounds';

interface HeroBackgroundProps {
  className?: string;
  children?: React.ReactNode;
  mobileBackgroundImage?: string;
  videoSrc?: string;
  videoWebmSrc?: string;
  overlayColor?: string;
  syncWithAudio?: boolean;
}

interface HeroBackgroundInnerProps extends Omit<HeroBackgroundProps, 'syncWithAudio'> {
  activeVideoSrc: string;
  activeMobileVideoSrc?: string | null;
  activeMobilePosterSrc?: string;
  activeMobileImageSrc?: string;
}

const HeroBackgroundInner = ({
  className,
  children,
  mobileBackgroundImage = '/placeholder.svg',
  activeVideoSrc,
  activeMobileVideoSrc,
  activeMobilePosterSrc,
  activeMobileImageSrc,
  videoWebmSrc,
  overlayColor = 'rgba(173,216,230,0.25)',
}: HeroBackgroundInnerProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasDesktopVideoError, setHasDesktopVideoError] = useState(false);
  const [hasMobileVideoError, setHasMobileVideoError] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isPoweringOn, setIsPoweringOn] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const desktopVideoRef = useRef<HTMLVideoElement>(null);
  const mobileVideoRef = useRef<HTMLVideoElement>(null);

  const resolvedMobileImage = activeMobileImageSrc ?? mobileBackgroundImage;
  const resolvedMobilePoster = activeMobilePosterSrc ?? resolvedMobileImage;

  const showMobileVideo =
    Boolean(activeMobileVideoSrc) && !hasMobileVideoError && !prefersReducedMotion;

  const tryPlayVideo = useCallback((video: HTMLVideoElement | null) => {
    if (!video) return;
    if (document.hidden) return;
    if (prefersReducedMotion) return;

    if (video.paused) {
      video.play().catch(() => {});
    }
  }, [prefersReducedMotion]);

  const tryPlayAllVideos = useCallback(() => {
    tryPlayVideo(desktopVideoRef.current);
    tryPlayVideo(mobileVideoRef.current);
  }, [tryPlayVideo]);

  const handleDesktopVideoLoaded = useCallback(() => {
    tryPlayVideo(desktopVideoRef.current);
  }, [tryPlayVideo]);

  const handleMobileVideoLoaded = useCallback(() => {
    tryPlayVideo(mobileVideoRef.current);
  }, [tryPlayVideo]);

  const handleDesktopVideoError = useCallback(() => {
    setHasDesktopVideoError(true);
  }, []);

  const handleMobileVideoError = useCallback(() => {
    setHasMobileVideoError(true);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    setIsVisible(true);

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setPrefersReducedMotion(reducedMotion);

    if (reducedMotion) {
      setIsPoweringOn(false);
    }

    el.classList.remove('crt-screen');
    void el.offsetWidth;
    el.classList.add('crt-screen');
  }, []);

  const handlePowerOnEnd = useCallback(() => {
    setIsPoweringOn(false);
  }, []);

  useEffect(() => {
    setHasDesktopVideoError(false);
  }, [activeVideoSrc]);

  useEffect(() => {
    setHasMobileVideoError(false);
  }, [activeMobileVideoSrc]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        desktopVideoRef.current?.pause();
        mobileVideoRef.current?.pause();
      } else {
        tryPlayAllVideos();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [tryPlayAllVideos]);

  const handleMouseEnter = useCallback(() => {
    if (desktopVideoRef.current) {
      desktopVideoRef.current.style.filter = 'brightness(1.1) contrast(1.05)';
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (desktopVideoRef.current) {
      desktopVideoRef.current.style.filter = 'brightness(1) contrast(1)';
    }
  }, []);

  const showStaticOnMobile = !showMobileVideo;
  const showStaticOnDesktop = hasDesktopVideoError;

  const staticBackgroundClass = cn(
    'absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat transition-opacity duration-700 ease-in-out',
    showStaticOnMobile && showStaticOnDesktop
      ? 'block'
      : showStaticOnMobile
        ? 'block md:hidden'
        : showStaticOnDesktop
          ? 'hidden md:block'
          : 'hidden'
  );

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-screen overflow-hidden crt-screen"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-testid="hero-background"
      role="presentation"
    >
      <div className="crt-jitter absolute inset-0 w-full h-full" aria-hidden="true">
        <div
          className={staticBackgroundClass}
          style={{
            backgroundImage: `url(${showStaticOnMobile ? resolvedMobileImage : resolvedMobilePoster})`,
          }}
          role="img"
          aria-label="Background image"
        />

        {showMobileVideo && activeMobileVideoSrc && (
          <video
            key={activeMobileVideoSrc}
            ref={mobileVideoRef}
            className="absolute inset-0 w-full h-full object-cover block md:hidden transition-[filter] duration-700 ease-in-out"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={resolvedMobilePoster}
            onLoadedData={handleMobileVideoLoaded}
            onError={handleMobileVideoError}
            aria-hidden="true"
          >
            <source src={activeMobileVideoSrc} type="video/mp4" />
          </video>
        )}

        {!hasDesktopVideoError && (
          <video
            key={activeVideoSrc}
            ref={desktopVideoRef}
            className="absolute inset-0 w-full h-full object-cover hidden md:block transition-[filter] duration-700 ease-in-out"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            onLoadedData={handleDesktopVideoLoaded}
            onError={handleDesktopVideoError}
            aria-hidden="true"
          >
            {videoWebmSrc && <source src={videoWebmSrc} type="video/webm" />}
            <source src={activeVideoSrc} type="video/mp4" />
          </video>
        )}
      </div>

      <div
        className={cn(
          'absolute inset-0 z-[1] transition-opacity duration-1000 ease-in-out',
          isVisible ? 'opacity-100' : 'opacity-0'
        )}
        style={{ backgroundColor: overlayColor }}
      />

      <div
        className={cn(
          'absolute inset-0 z-[2] opacity-0 transition-opacity duration-1500 ease-in-out',
          isVisible ? 'opacity-10' : 'opacity-0'
        )}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          transitionDelay: '200ms',
        }}
        aria-hidden="true"
      />

      <div
        className={cn(
          'absolute inset-0 z-[3] pointer-events-none',
          isVisible ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          boxShadow: '0 0 150px rgba(0, 0, 0, .01) inset',
          transitionDelay: '400ms',
        }}
        aria-hidden="true"
      />

      <div className="crt-vignette" aria-hidden="true" />

      <div className="crt-glass" aria-hidden="true" />

      <div className="crt-static-bar" aria-hidden="true" />

      {isPoweringOn && (
        <div
          className="crt-power-on"
          aria-hidden="true"
          onAnimationEnd={handlePowerOnEnd}
        />
      )}

      <div className={cn('relative z-50 w-full h-full flex items-center justify-center', className)}>
        {children}
      </div>
    </div>
  );
};

const SyncedHeroBackground = (props: Omit<HeroBackgroundProps, 'syncWithAudio' | 'videoSrc'>) => {
  const { videoSrc, mobileVideoSrc, mobilePosterSrc, mobileImageSrc } = useSyncedBackgrounds();

  return (
    <HeroBackgroundInner
      {...props}
      activeVideoSrc={videoSrc}
      activeMobileVideoSrc={mobileVideoSrc}
      activeMobilePosterSrc={mobilePosterSrc}
      activeMobileImageSrc={mobileImageSrc}
    />
  );
};

export function HeroBackground({
  syncWithAudio = false,
  videoSrc = '/videos/bg-sand.mp4',
  ...props
}: HeroBackgroundProps) {
  if (syncWithAudio) {
    return <SyncedHeroBackground {...props} />;
  }

  return <HeroBackgroundInner {...props} activeVideoSrc={videoSrc} />;
}
