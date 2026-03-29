import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Github, Linkedin, Mail, Music, FileText } from "lucide-react"
import { Waveform } from "@/components/waveform"
import { HeroBackground } from "@/components/HeroBackground"

export default function Home() {
  return (
    <main id="main-content" className="crt-flicker relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      <HeroBackground 
        videoSrc="/videos/bg-sand.mp4" 
        mobileBackgroundImage="/placeholder.svg"
        overlayColor="rgba(13, 16, 45, 0.5)"
      >
        <div className="relative z-10 flex flex-col items-center justify-center max-w-2xl mx-auto text-center h-full my-auto drop-shadow-2xl">
          <div className="absolute -bottom-16 -right-16 w-48 h-12 animate-pulse-slow hidden md:block" aria-hidden="true">
            <Waveform className="w-full h-full text-accent/20" />
          </div>

          {/* Header section with pixelated font and neon glow */}
          <header className="mb-8">
            <h1 className="text-flicker text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-pixel tracking-tight mb-4 text-white neon-text leading-normal drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]">
              Rob McLaughlin
            </h1>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Music className="size-4 text-accent" aria-hidden="true" />
              <p className="text-flicker text-lg md:text-xl font-mono drop-shadow-lg">Engineering Manager</p>
              <Music className="size-4 text-accent" aria-hidden="true" />
            </div>
            <div className="mt-4 w-24 h-1 bg-gradient-to-r from-transparent via-accent to-transparent mx-auto drop-shadow-xl"></div>
          </header>

          {/* Social links section with larger icons and enhanced hover effects */}
          <TooltipProvider>
            <nav className="flex items-center justify-center gap-6 mb-12">
              <div className="flex flex-col items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="box-flicker size-14 rounded-full bg-secondary/50 text-muted-foreground hover:text-accent hover:bg-secondary transition-colors duration-300 icon-glow shadow-lg"
                      aria-label="GitHub"
                      asChild
                    >
                      <a href="https://github.com/robmclaughliniv" target="_blank" rel="noopener noreferrer">
                        <Github className="size-7" />
                      </a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>GitHub</p>
                  </TooltipContent>
                </Tooltip>
                <span className="text-xs font-mono text-muted-foreground">GitHub</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="box-flicker size-14 rounded-full bg-secondary/50 text-muted-foreground hover:text-accent hover:bg-secondary transition-colors duration-300 icon-glow shadow-lg"
                      aria-label="LinkedIn"
                      asChild
                    >
                      <a href="https://linkedin.com/in/robertmclaughliniv" target="_blank" rel="noopener noreferrer">
                        <Linkedin className="size-7" />
                      </a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>LinkedIn</p>
                  </TooltipContent>
                </Tooltip>
                <span className="text-xs font-mono text-muted-foreground">LinkedIn</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="box-flicker size-14 rounded-full bg-secondary/50 text-muted-foreground hover:text-accent hover:bg-secondary transition-colors duration-300 icon-glow shadow-lg"
                      aria-label="Email"
                      asChild
                    >
                      <a href="mailto:robmclaughliniv@gmail.com">
                        <Mail className="size-7" />
                      </a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Email</p>
                  </TooltipContent>
                </Tooltip>
                <span className="text-xs font-mono text-muted-foreground">Email</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="box-flicker size-14 rounded-full bg-secondary/50 text-muted-foreground hover:text-accent hover:bg-secondary transition-colors duration-300 icon-glow shadow-lg"
                      aria-label="Resume"
                      asChild
                    >
                      <a href="/pdf/resume.pdf" target="_blank" rel="noopener noreferrer">
                        <FileText className="size-7" />
                      </a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Resume</p>
                  </TooltipContent>
                </Tooltip>
                <span className="text-xs font-mono text-muted-foreground">Resume</span>
              </div>
            </nav>
          </TooltipProvider>

          {/* Bio section */}
          <div className="box-flicker bg-card/50 backdrop-blur-sm p-6 rounded-lg border border-border mb-12 max-w-md shadow-xl drop-shadow-[0_5px_15px_rgba(0,0,0,0.7)]">
            <p className="text-muted-foreground leading-relaxed font-medium">
              Engineer, problem-solver, and dad.<br />Based in Austin, TX.
            </p>
          </div>

          {/* Footer */}
          <footer className="text-flicker text-muted-foreground text-sm font-mono mt-12">
            <p>© {new Date().getFullYear()} Rob McLaughlin</p>
          </footer>
        </div>
      </HeroBackground>
    </main>
  )
}

