"use client";

const TEAL = "#0d9488";

export function BeckerLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Becker"
    >
      {/* "BECKER" wordmark — the "ck" pair is nudged down to hint at a frameshift */}
      <text x="0" y="26" fill="#1e293b" style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1, fontFamily: "system-ui, sans-serif" }}>
        BE
      </text>
      <text x="42" y="30" fill="#1e293b" style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1, fontFamily: "system-ui, sans-serif" }}>
        CK
      </text>
      <text x="82" y="26" fill="#1e293b" style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1, fontFamily: "system-ui, sans-serif" }}>
        ER
      </text>

      {/* Small skip arc over the shifted letters */}
      <path
        d="M38 10 Q60 -2 80 10"
        stroke={TEAL}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <polygon points="78,7 83,10 78,13" fill={TEAL} />
    </svg>
  );
}

export function BeckerLogoMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Becker"
    >
      <rect width="32" height="32" rx="8" fill={TEAL} />
      <text
        x="16"
        y="22"
        textAnchor="middle"
        fill="white"
        style={{ fontSize: 19, fontWeight: 800, fontFamily: "system-ui, sans-serif" }}
      >
        B
      </text>
      <path
        d="M8 26 Q16 21 24 26"
        stroke="white"
        strokeOpacity={0.45}
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
