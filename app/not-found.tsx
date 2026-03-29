import Link from "next/link"

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
      <h1 className="text-4xl md:text-6xl font-pixel tracking-tight mb-4 neon-text">
        404
      </h1>
      <p className="text-lg font-mono text-muted-foreground mb-8">
        This page doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded-lg bg-secondary/50 border border-border font-mono text-sm text-muted-foreground hover:text-accent hover:border-accent/50 transition-colors duration-300"
      >
        Go home
      </Link>
    </main>
  )
}
