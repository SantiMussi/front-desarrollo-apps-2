export default function Spinner({ size = "md", className = "" }) {
  /* ── Inline-button spinner (sm): clean ring ──────────────────── */
  if (size === "sm") {
    return (
      <div
        className={`h-4 w-4 rounded-full border-2 border-neutral-200 border-t-[#D63031] animate-spin ${className}`}
        role="status"
        aria-label="Cargando"
      />
    );
  }

  /* ── Page-level spinner (md / lg): morphing ring + pulse ─────── */
  const ringSize = size === "lg" ? 48 : 36;
  const stroke = size === "lg" ? 3.5 : 3;

  return (
    <div className={`relative flex items-center justify-center ${className}`} role="status" aria-label="Cargando">
      <svg
        width={ringSize}
        height={ringSize}
        viewBox="0 0 48 48"
        fill="none"
        style={{ animation: "spinnerRotate 1.8s linear infinite" }}
      >
        {/* Track */}
        <circle cx="24" cy="24" r="20" stroke="#e5e5e5" strokeWidth={stroke} />
        {/* Animated arc */}
        <circle
          cx="24" cy="24" r="20"
          stroke="url(#spinnerGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray="90 126"
          style={{ animation: "spinnerDash 1.8s ease-in-out infinite" }}
        />
        <defs>
          <linearGradient id="spinnerGrad" x1="0" y1="0" x2="48" y2="48">
            <stop offset="0%" stopColor="#0F2C59" />
            <stop offset="100%" stopColor="#D63031" />
          </linearGradient>
        </defs>
      </svg>
      {/* Center pulse dot */}
      <span
        className="absolute rounded-full bg-[#D63031]"
        style={{
          width: size === "lg" ? 6 : 5,
          height: size === "lg" ? 6 : 5,
          animation: "spinnerPulse 1.8s ease-in-out infinite",
        }}
      />

      <style>{`
        @keyframes spinnerRotate {
          100% { transform: rotate(360deg); }
        }
        @keyframes spinnerDash {
          0%   { stroke-dasharray: 10 116; stroke-dashoffset: 0; }
          50%  { stroke-dasharray: 90 36;  stroke-dashoffset: -30; }
          100% { stroke-dasharray: 10 116; stroke-dashoffset: -126; }
        }
        @keyframes spinnerPulse {
          0%, 100% { transform: scale(0.8); opacity: 0.4; }
          50%      { transform: scale(1.3); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
