'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface HeroBackgroundProps {
  className?: string;
  children?: React.ReactNode;
  mobileBackgroundImage?: string;
  videoSrc?: string;
  videoWebmSrc?: string;
  overlayColor?: string;
  disableEffects?: boolean;
}

export function HeroBackground({ 
  className, 
  children, 
  mobileBackgroundImage = '/placeholder.svg',
  videoSrc = '/videos/bg-sand.mp4',
  videoWebmSrc,
  overlayColor = 'rgba(173,216,230,0.25)',
  disableEffects = false
}: HeroBackgroundProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isInViewport, setIsInViewport] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [hasVideoError, setHasVideoError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleVideoLoaded = useCallback(() => {
    setIsVideoLoaded(true);
    
    if (videoRef.current && isInViewport) {
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().catch(() => {});
        }
      }, 300);
    }
  }, [isInViewport]);

  const handleVideoError = useCallback(() => {
    setHasVideoError(true);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          setIsInViewport(true);
        } else {
          setIsInViewport(false);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);

    // Restart CRT scanline animation on mount
    el.classList.remove('crt-screen');
    void el.offsetWidth;
    el.classList.add('crt-screen');

    return () => observer.unobserve(el);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!videoRef.current || hasVideoError) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (isInViewport && !prefersReducedMotion) {
      if (isVideoLoaded) {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {});
        }
      }
    } else if (videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
    }
  }, [isInViewport, isVideoLoaded, hasVideoError]);

  const handleMouseEnter = useCallback(() => {
    if (videoRef.current && !disableEffects) {
      videoRef.current.style.filter = 'brightness(1.1) contrast(1.05)';
    }
  }, [disableEffects]);

  const handleMouseLeave = useCallback(() => {
    if (videoRef.current && !disableEffects) {
      videoRef.current.style.filter = 'brightness(1) contrast(1)';
    }
  }, [disableEffects]);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 w-full h-screen overflow-hidden crt-screen"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-testid="hero-background"
      role="presentation"
    >
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat md:hidden" 
        style={{ 
          backgroundImage: `url(${mobileBackgroundImage})`,
          display: hasVideoError ? 'block' : undefined
        }}
        role="img"
        aria-label="Background image"
      />

      {!hasVideoError && (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover hidden md:block transition-[filter] duration-700 ease-in-out"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onLoadedData={handleVideoLoaded}
          onError={handleVideoError}
          aria-hidden="true"
        >
          {videoWebmSrc && <source src={videoWebmSrc} type="video/webm" />}
          <source src={videoSrc} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}

      {!disableEffects && (
        <>
          <div 
            className={cn(
              "absolute inset-0 z-[1] transition-opacity duration-1000 ease-in-out",
              isVisible ? "opacity-100" : "opacity-0"
            )}
            style={{ backgroundColor: overlayColor }}
          />
          
          <div 
            className={cn(
              "absolute inset-0 z-[2] opacity-0 transition-opacity duration-1500 ease-in-out",
              isVisible ? "opacity-10" : "opacity-0"
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
              "absolute inset-0 z-[3] pointer-events-none",
              isVisible ? "opacity-100" : "opacity-0"
            )}
            style={{
              boxShadow: "0 0 150px rgba(0, 0, 0, .01) inset",
              transitionDelay: '400ms',
            }}
            aria-hidden="true"
          />
        </>
      )}
      
      <div className={cn("relative z-50 w-full h-full flex items-center justify-center", className)}>
        {children}
      </div>
    </div>
  );
}