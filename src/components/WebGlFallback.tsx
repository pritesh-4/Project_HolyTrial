import React from 'react';

interface WebGlFallbackProps {
  progress?: number;
  isEntering?: boolean;
}

export const WebGlFallback: React.FC<WebGlFallbackProps> = ({
  progress = 0.2,
  isEntering = false,
}) => {
  // Gate separation factor in the revelation/finale window
  const gateOpenPx = isEntering ? 90 : progress >= 0.76 ? ((progress - 0.76) / 0.18) * 70 : 0;
  const deskLightOpacity = progress > 0.03 ? 1 : 0.2;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-hidden bg-[#111315] select-none"
      aria-label="Atmospheric Backdrop of Holy Trial — The Room Was Never Empty"
      role="img"
    >
      {/* Background judicial depth gradient */}
      <div className="absolute inset-0 bg-radial from-[#292E30] via-[#181B1D] to-[#111315] opacity-95" />

      {/* Central Volumetric Light Beam */}
      <div
        className={`via-[#C6A16B]/05 absolute top-0 left-1/2 h-full w-80 origin-top -translate-x-1/2 transform bg-gradient-to-b from-[#C6A16B]/20 to-transparent blur-3xl transition-all duration-1000 md:w-[480px] ${
          isEntering ? 'scale-125 opacity-90' : 'opacity-60'
        }`}
      />

      {/* Authored SVG Architectural Chamber */}
      <svg
        className={`absolute inset-0 h-full w-full object-cover transition-transform duration-1000 ease-out ${
          isEntering ? '-translate-y-8 scale-110' : 'scale-100'
        }`}
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1440 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="pillarLeftGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#111315" />
            <stop offset="85%" stopColor="#181B1D" />
            <stop offset="100%" stopColor="#292E30" />
          </linearGradient>
          <linearGradient id="pillarRightGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#292E30" />
            <stop offset="15%" stopColor="#181B1D" />
            <stop offset="100%" stopColor="#111315" />
          </linearGradient>
          <linearGradient id="daisGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#292E30" />
            <stop offset="50%" stopColor="#181B1D" />
            <stop offset="100%" stopColor="#111315" />
          </linearGradient>
          <linearGradient id="floorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#181B1D" />
            <stop offset="40%" stopColor="#141618" />
            <stop offset="100%" stopColor="#0B0D0E" />
          </linearGradient>
          <radialGradient id="portalGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#C6A16B" stopOpacity="0.45" />
            <stop offset="60%" stopColor="#555859" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#111315" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Luminous Inner Portal Glow behind Gate */}
        <circle cx="720" cy="400" r={160 + gateOpenPx * 1.5} fill="url(#portalGlow)" />

        {/* Colossal Inner Tribunal Gates */}
        {/* Left Gate Monolith */}
        <rect
          x={640 - gateOpenPx}
          y="180"
          width="76"
          height="450"
          fill="#141618"
          stroke="#C6A16B"
          strokeOpacity="0.35"
          strokeWidth="1.5"
        />
        {/* Right Gate Monolith */}
        <rect
          x={724 + gateOpenPx}
          y="180"
          width="76"
          height="450"
          fill="#141618"
          stroke="#C6A16B"
          strokeOpacity="0.35"
          strokeWidth="1.5"
        />

        {/* Chamber Floor */}
        <polygon points="0,630 1440,630 1440,900 0,900" fill="url(#floorGrad)" />

        {/* Slate Floor Grid Lines */}
        <line
          x1="720"
          y1="630"
          x2="120"
          y2="900"
          stroke="#555859"
          strokeOpacity="0.3"
          strokeWidth="1"
        />
        <line
          x1="720"
          y1="630"
          x2="1320"
          y2="900"
          stroke="#555859"
          strokeOpacity="0.3"
          strokeWidth="1"
        />
        <line
          x1="720"
          y1="630"
          x2="520"
          y2="900"
          stroke="#555859"
          strokeOpacity="0.2"
          strokeWidth="1"
        />
        <line
          x1="720"
          y1="630"
          x2="920"
          y2="900"
          stroke="#555859"
          strokeOpacity="0.2"
          strokeWidth="1"
        />

        {/* Central Long Hearing Table Dais */}
        <polygon
          points="540,680 900,680 950,770 490,770"
          fill="url(#daisGrad)"
          stroke="#555859"
          strokeOpacity="0.4"
          strokeWidth="1"
        />

        {/* Practical Lamp Glow on Table */}
        <ellipse
          cx="720"
          cy="725"
          rx="140"
          ry="35"
          fill="#C6A16B"
          fillOpacity={0.18 * deskLightOpacity}
        />

        {/* Case File on Left of Table */}
        <rect
          x="560"
          y="710"
          width="60"
          height="40"
          fill="#E5DED0"
          fillOpacity={0.85}
          stroke="#782F37"
          strokeWidth="1"
          transform="rotate(-5 590 730)"
        />

        {/* CCTV Monitor in Center */}
        <rect
          x="700"
          y="695"
          width="45"
          height="38"
          fill="#111315"
          stroke="#555859"
          strokeWidth="1.5"
        />
        <rect
          x="704"
          y="699"
          width="37"
          height="30"
          fill="#292E30"
          stroke="#C6A16B"
          strokeOpacity="0.6"
          strokeWidth="0.5"
        />

        {/* Access Record on Right */}
        <rect
          x="780"
          y="715"
          width="50"
          height="28"
          fill="#E5DED0"
          fillOpacity={0.8}
          stroke="#782F37"
          strokeWidth="1"
          transform="rotate(4 805 729)"
        />

        {/* Oxblood stamp dot on record */}
        <circle cx="818" cy="728" r="4" fill="#782F37" />

        {/* Acoustic Lateral Wall Pillars */}
        <rect x="0" y="0" width="160" height="630" fill="url(#pillarLeftGrad)" />
        <rect x="1280" y="0" width="160" height="630" fill="url(#pillarRightGrad)" />

        {/* Ceiling Baffles */}
        <line x1="0" y1="180" x2="1440" y2="180" stroke="#292E30" strokeWidth="1" opacity="0.6" />
        <line x1="0" y1="120" x2="1440" y2="120" stroke="#292E30" strokeWidth="1" opacity="0.4" />
      </svg>
    </div>
  );
};
