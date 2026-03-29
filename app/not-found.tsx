import Link from "next/link"

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-100">
      <h1 className="text-4xl md:text-6xl font-pixel tracking-tight mb-4 neon-text">
        404
      </h1>
      <p className="text-lg font-mono text-zinc-400 mb-8">
        This page doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded-lg bg-zinc-800/50 border border-zinc-700 font-mono text-sm text-zinc-300 hover:text-pink-500 hover:border-pink-500/50 transition-colors duration-300"
      >
        Go home
      </Link>
    </main>
  )
}
