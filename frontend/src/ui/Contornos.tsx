/** Curvas de nivel decorativas: el motivo gráfico de la marca. */
export function Contornos({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 600 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      fill="none"
      stroke="var(--color-salvia)"
      strokeOpacity={0.22}
      strokeWidth={1}
    >
      <path d="M-40 700c80-160 220-260 380-280s240 70 220 170-160 170-330 170-330 80-270-60Z" />
      <path d="M20 690c60-120 170-200 300-214s184 56 168 130-122 130-254 130-262 60-214-46Z" />
      <path d="M80 680c42-84 120-140 220-150s128 38 116 90-84 90-176 90-184 42-160-30Z" />
      <path d="M140 670c26-50 70-84 132-90s78 24 70 54-50 54-106 54-114 26-96-18Z" />
      <path d="M-60 260c120-120 300-170 460-140s220 120 170 190" />
      <path d="M-20 230c110-92 270-128 410-104s190 96 148 152" />
      <path d="M20 200c96-66 236-92 356-74s160 74 126 116" />
    </svg>
  );
}
