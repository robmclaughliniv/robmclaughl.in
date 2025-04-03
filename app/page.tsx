'use client';

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Github, Linkedin, Mail, Music } from "lucide-react"
import { Waveform } from "@/components/waveform"
import { HeroBackground } from "@/components/HeroBackground"
import { useEffect } from "react"

export default function Home() {
  // Force reflow to ensure animations restart on mount
  useEffect(() => {
    const screen = document.querySelector('.crt-screen');
    if (screen) {
      // Reset animation by briefly removing class
      screen.classList.remove('crt-screen');
      void screen.offsetWidth;
      screen.classList.add('crt-screen');
    }
  }, []);

  return (
    <main className="crt-flicker relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Hero Background with CRT effect */}
      <HeroBackground 
        videoSrc="/videos/bg-sand.mp4" 
        mobileBackgroundImage="/placeholder.jpg"
        overlayColor="rgba(13, 16, 45, 0.5)"
      >
        {/* Main content container */}
        <div className="relative z-10 flex flex-col items-center justify-center max-w-2xl mx-auto text-center h-full my-auto drop-shadow-2xl">
          {/* Decorative elements */}
          <Waveform className="absolute -bottom-16 -right-16 w-48 h-12 text-pink-500/20 animate-pulse-slow hidden md:block" />

          {/* Header section with pixelated font and neon glow */}
          <header className="mb-8">
            <h1 className="text-flicker text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-pixel tracking-tight mb-4 text-white neon-text leading-normal drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]">
              Rob McLaughlin
            </h1>
            <div className="flex items-center justify-center gap-2 text-zinc-400">
              <Music className="w-4 h-4 text-pink-500" />
              <p className="text-flicker text-lg md:text-xl font-mono drop-shadow-lg">Engineering Manager</p>
              <Music className="w-4 h-4 text-pink-500" />
            </div>
            <div className="mt-4 w-24 h-1 bg-gradient-to-r from-transparent via-pink-500 to-transparent mx-auto drop-shadow-xl"></div>
          </header>

          {/* Social links section with larger icons and enhanced hover effects */}
          <TooltipProvider>
            <nav className="flex items-center justify-center gap-6 mb-12">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="box-flicker w-14 h-14 rounded-full bg-zinc-800/50 text-zinc-300 hover:text-pink-500 hover:bg-zinc-800 transition-all duration-300 icon-glow shadow-lg"
                    aria-label="GitHub"
                    asChild
                  >
                    <a href="https://github.com/robmclaughliniv" target="_blank" rel="noopener noreferrer">
                      <Github className="w-7 h-7" />
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>GitHub</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="box-flicker w-14 h-14 rounded-full bg-zinc-800/50 text-zinc-300 hover:text-pink-500 hover:bg-zinc-800 transition-all duration-300 icon-glow shadow-lg"
                    aria-label="LinkedIn"
                    asChild
                  >
                    <a href="https://linkedin.com/in/robertmclaughliniv" target="_blank" rel="noopener noreferrer">
                      <Linkedin className="w-7 h-7" />
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>LinkedIn</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="box-flicker w-14 h-14 rounded-full bg-zinc-800/50 text-zinc-300 hover:text-pink-500 hover:bg-zinc-800 transition-all duration-300 icon-glow shadow-lg"
                    aria-label="Email"
                    asChild
                  >
                    <a href="mailto:robmclaughliniv@gmail.com">
                      <Mail className="w-7 h-7" />
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Email</p>
                </TooltipContent>
              </Tooltip>
            </nav>
          </TooltipProvider>

          {/* Bio section */}
          <div className="box-flicker bg-zinc-900/50 backdrop-blur-sm p-6 rounded-lg border border-zinc-800 mb-12 max-w-md shadow-xl drop-shadow-[0_5px_15px_rgba(0,0,0,0.7)]">
            <p className="text-zinc-300 leading-relaxed font-medium">
              Engineer, problem-solver, and dad.<br />Based in Austin, TX.
            </p>
          </div>

          {/* Footer */}
          <footer className="text-flicker text-zinc-500 text-sm font-mono mt-12">
            <p>© {new Date().getFullYear()} Rob McLaughlin</p>
          </footer>
        </div>
      </HeroBackground>
    </main>
  )
}

