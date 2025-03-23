export function Waveform({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 20" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M0 10 Q 5 5, 10 10 T 20 10 T 30 10 T 40 10 T 50 10 T 60 10 T 70 10 T 80 10 T 90 10 T 100 10"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.5"
      />
      <path
        d="M0 10 Q 5 15, 10 10 T 20 10 T 30 10 T 40 10 T 50 10 T 60 10 T 70 10 T 80 10 T 90 10 T 100 10"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.5"
      />
      <path
        d="M0 10 Q 5 3, 10 10 T 20 10 T 30 10 T 40 10 T 50 10 T 60 10 T 70 10 T 80 10 T 90 10 T 100 10"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.5"
      />
      <path
        d="M0 10 Q 5 17, 10 10 T 20 10 T 30 10 T 40 10 T 50 10 T 60 10 T 70 10 T 80 10 T 90 10 T 100 10"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.5"
      />
    </svg>
  )
}

