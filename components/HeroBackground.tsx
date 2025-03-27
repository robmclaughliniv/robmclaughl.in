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
  mobileBackgroundImage = '/placeholder.jpg',
  videoSrc = '/videos/bg-sand.mp4',
  videoWebmSrc,
  overlayColor = 'rgba(173,216,230,0.25)',
  disableEffects = false
}: HeroBackgroundProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isInViewport, setIsInViewport] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [hasVideoError, setHasVideoError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Handle video loaded
  const handleVideoLoaded = useCallback(() => {
    console.log('Video data loaded');
    setIsVideoLoaded(true);
    
    // Force play if in viewport
    if (videoRef.current && isInViewport) {
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().catch(err => {
            console.warn('Delayed video play error:', err);
          });
        }
      }, 300);
    }
  }, [isInViewport]);

  // Handle video error
  const handleVideoError = useCallback(() => {
    setHasVideoError(true);
    console.warn('Video failed to load. Falling back to static image.');
  }, []);

  // Set up Intersection Observer to detect when component enters/exits viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Handle visibility for animation and play/pause
        if (entry.isIntersecting) {
          setIsVisible(true);
          setIsInViewport(true);
        } else {
          setIsInViewport(false);
        }
      },
      {
        threshold: 0.1, // Trigger when at least 10% of the element is visible
        rootMargin: '0px' // Consider viewport boundaries
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  // Play/pause video based on viewport visibility and reduced motion preference
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!videoRef.current || hasVideoError) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (isInViewport && !prefersReducedMotion) {
      // Force play when video is loaded and in viewport
      if (isVideoLoaded) {
        console.log('Attempting to play video...');
        // Use a try/catch because browsers might block play()
        const playPromise = videoRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.warn("Error playing video:", error);
            // Don't set error state as this might be an autoplay policy issue
          });
        }
      }
    } else {
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
      }
    }
  }, [isInViewport, isVideoLoaded, hasVideoError]);
  
  // Debug log when video loads
  useEffect(() => {
    if (isVideoLoaded) {
      console.log('Video loaded successfully');
    }
  }, [isVideoLoaded]);

  // Handle hover effect
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  // Apply filter transition on video element when hovered
  useEffect(() => {
    if (videoRef.current && !disableEffects) {
      if (isHovered) {
        videoRef.current.style.filter = 'brightness(1.1) contrast(1.05)';
      } else {
        videoRef.current.style.filter = 'brightness(1) contrast(1)';
      }
    }
  }, [isHovered, disableEffects]);

  // Main background - render different elements based on state
  const renderBackground = () => {
    // Always render mobile background
    return (
      <>
        {/* Mobile background image or video fallback */}
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat md:hidden" 
          style={{ 
            backgroundImage: `url(${mobileBackgroundImage})`,
            display: hasVideoError ? 'block' : undefined
          }}
          role="img"
          aria-label="Background image"
        />
        
        {/* Video background (hidden on mobile or if error) */}
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
            {/* Fallback message only shown if browser doesn't support video */}
            Your browser does not support the video tag.
          </video>
        )}
      </>
    );
  };

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 w-full h-screen overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-testid="hero-background"
      role="presentation"
    >
      {renderBackground()}
      
      {/* Skip effects if disabled */}
      {!disableEffects && (
        <>
          {/* Light blue overlay */}
          <div 
            className={cn(
              "absolute inset-0 z-[1] transition-opacity duration-1000 ease-in-out",
              isVisible ? "opacity-100" : "opacity-0"
            )}
            style={{ backgroundColor: overlayColor }}
          />
          
          {/* Noise texture overlay */}
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
          
          {/* CRT scanline effect */}
          <div 
            className={cn(
              "absolute inset-0 z-[3] pointer-events-none transition-opacity duration-2000 ease-in-out",
              isVisible ? "opacity-100" : "opacity-0"
            )}
            style={{
              backgroundImage: 'linear-gradient(transparent 50%, rgba(0, 0, 0, 0.05) 50%)',
              backgroundSize: '100% 4px',
              transitionDelay: '400ms',
            }}
            aria-hidden="true"
          />
        </>
      )}
      
      {/* Content container */}
      <div className={cn("relative z-10 w-full h-full flex items-center justify-center", className)}>
        {children}
      </div>
    </div>
  );
}