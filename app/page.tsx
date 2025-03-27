import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Github, Linkedin, Mail, Music } from "lucide-react"
import { CoffeeCup } from "@/components/coffee-cup"
import { Waveform } from "@/components/waveform"
import { HeroBackground } from "@/components/HeroBackground"

export default function Home() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Hero Background */}
      <HeroBackground 
        videoSrc="/videos/bg-sand.mp4" 
        mobileBackgroundImage="/placeholder.jpg"
        overlayColor="rgba(13, 16, 45, 0.5)"
      >
        {/* Main content container */}
        <div className="relative z-10 flex flex-col items-center justify-center max-w-2xl mx-auto text-center">
          {/* Decorative elements */}
          <CoffeeCup className="absolute -top-16 -left-16 w-32 h-32 text-pink-500/20 rotate-12 animate-pulse-slow hidden md:block" />
          <Waveform className="absolute -bottom-16 -right-16 w-48 h-12 text-pink-500/20 animate-pulse-slow hidden md:block" />

          {/* Header section with pixelated font and neon glow */}
          <header className="mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-pixel tracking-tight mb-4 text-white neon-text leading-normal">
              Rob McLaughlin
            </h1>
            <div className="flex items-center justify-center gap-2 text-zinc-400">
              <Music className="w-4 h-4 text-pink-500" />
              <p className="text-lg md:text-xl font-mono">Engineering Manager</p>
              <Music className="w-4 h-4 text-pink-500" />
            </div>
            <div className="mt-4 w-24 h-1 bg-gradient-to-r from-transparent via-pink-500 to-transparent mx-auto"></div>
          </header>

          {/* Social links section with larger icons and enhanced hover effects */}
          <TooltipProvider>
            <nav className="flex items-center justify-center gap-6 mb-12">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-14 h-14 rounded-full bg-zinc-800/50 text-zinc-300 hover:text-pink-500 hover:bg-zinc-800 transition-all duration-300 icon-glow"
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
                    className="w-14 h-14 rounded-full bg-zinc-800/50 text-zinc-300 hover:text-pink-500 hover:bg-zinc-800 transition-all duration-300 icon-glow"
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
                    className="w-14 h-14 rounded-full bg-zinc-800/50 text-zinc-300 hover:text-pink-500 hover:bg-zinc-800 transition-all duration-300 icon-glow"
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
          <div className="bg-zinc-900/50 backdrop-blur-sm p-6 rounded-lg border border-zinc-800 mb-12 max-w-md">
            <p className="text-zinc-300 leading-relaxed">
              Engineer, problem-solver, and dad.<br />Based in Austin,TX.
            </p>
          </div>

          {/* Footer */}
          <footer className="text-zinc-500 text-sm font-mono mt-auto fixed bottom-10">
            <p>© {new Date().getFullYear()} Rob McLaughlin</p>
          </footer>
        </div>
      </HeroBackground>
    </main>
  )
}

