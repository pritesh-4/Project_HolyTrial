import React from 'react';

interface WebGlFallbackProps {
  progress?: number;
  isEntering?: boolean;
}

export const WebGlFallback: React.FC<WebGlFallbackProps> = ({
  progress = 0.2,
  isEntering = false,
}) => {
  // Master-timeline windows (7.5 s, see CinematicEngine):
  // Gates part 0.8–0.92 (after the lock bolts); the opposition wedge advances
  // 0.433–0.6 and strikes at 0.565–0.615; evidence docks 0.26–0.4.
  // Gate separation factor in the revelation/finale window
  const gateOpenPx = isEntering ? 80 : progress >= 0.8 ? ((progress - 0.8) / 0.12) * 65 : 0;
  // Opposition blade advance through the challenge act
  const bladeT =
    progress >= 0.433 && progress < 0.6 ? (progress - 0.433) / 0.167 : progress >= 0.6 ? 1 : 0;
  const bladeX = 1100 - bladeT * 320;
  const bladeY = 320 + bladeT * 180;
  // Evidence assembly in the evidence act
  const evidenceT =
    progress >= 0.26 && progress < 0.6
      ? Math.min(1, (progress - 0.26) / 0.145)
      : progress >= 0.6
        ? 1
        : 0;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-hidden bg-[#090909] select-none"
      aria-label="Atmospheric Backdrop of Holy Trial"
      role="img"
    >
      {/* Background subterranean depth radial gradient */}
      <div className="absolute inset-0 bg-radial from-[#151413] via-[#090909] to-[#050505] opacity-95" />

      {/* Central Volumetric Light Beam */}
      <div
        className={`absolute top-0 left-1/2 h-full w-80 origin-top -translate-x-1/2 transform bg-gradient-to-b from-[#E8E0D1]/20 via-[#B76548]/10 to-transparent blur-3xl md:w-[480px] ${
          isEntering ? 'scale-125 opacity-80' : ''
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
            <stop offset="0%" stopColor="#090909" />
            <stop offset="85%" stopColor="#151413" />
            <stop offset="100%" stopColor="#292521" />
          </linearGradient>
          <linearGradient id="pillarRightGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#292521" />
            <stop offset="15%" stopColor="#151413" />
            <stop offset="100%" stopColor="#090909" />
          </linearGradient>
          <linearGradient id="daisGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#292521" />
            <stop offset="50%" stopColor="#151413" />
            <stop offset="100%" stopColor="#090909" />
          </linearGradient>
          <linearGradient id="floorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#151413" />
            <stop offset="40%" stopColor="#0D0D0C" />
            <stop offset="100%" stopColor="#050505" />
          </linearGradient>
          <radialGradient id="portalGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F2A16A" stopOpacity="0.5" />
            <stop offset="60%" stopColor="#B76548" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#090909" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Luminous Inner Portal Glow behind Gate */}
        <circle cx="720" cy="400" r={160 + gateOpenPx * 1.5} fill="url(#portalGlow)" />

        {/* Colossal Inner Gates (monoliths parting in Chapter IV) */}
        {/* Left Gate Monolith */}
        <rect
          x={640 - gateOpenPx}
          y="180"
          width="76"
          height="450"
          fill="#100F0E"
          stroke="#B76548"
          strokeOpacity="0.3"
          strokeWidth="1.5"
        />
        {/* Right Gate Monolith */}
        <rect
          x={724 + gateOpenPx}
          y="180"
          width="76"
          height="450"
          fill="#100F0E"
          stroke="#B76548"
          strokeOpacity="0.3"
          strokeWidth="1.5"
        />

        {/* Chamber Floor */}
        <polygon points="0,630 1440,630 1440,900 0,900" fill="url(#floorGrad)" />

        {/* Floor Perspective Copper Lines */}
        <line
          x1="720"
          y1="630"
          x2="120"
          y2="900"
          stroke="#B76548"
          strokeOpacity="0.25"
          strokeWidth="1"
        />
        <line
          x1="720"
          y1="630"
          x2="1320"
          y2="900"
          stroke="#B76548"
          strokeOpacity="0.25"
          strokeWidth="1"
        />
        <line
          x1="720"
          y1="630"
          x2="460"
          y2="900"
          stroke="#B76548"
          strokeOpacity="0.15"
          strokeWidth="1"
        />
        <line
          x1="720"
          y1="630"
          x2="980"
          y2="900"
          stroke="#B76548"
          strokeOpacity="0.15"
          strokeWidth="1"
        />

        {/* Central Megalithic Dais */}
        <polygon
          points="540,660 900,660 960,730 480,730"
          fill="url(#daisGrad)"
          stroke="#B76548"
          strokeOpacity="0.45"
          strokeWidth="1"
        />
        <polygon
          points="580,640 860,640 890,660 550,660"
          fill="#1A1816"
          stroke="#B76548"
          strokeOpacity="0.3"
          strokeWidth="0.8"
        />

        {/* Dais Concentric Inlay Rings */}
        <ellipse
          cx="720"
          cy="685"
          rx="110"
          ry="24"
          stroke="#B76548"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.75"
        />
        <ellipse
          cx="720"
          cy="685"
          rx="55"
          ry="12"
          stroke="#B76548"
          strokeWidth="1.2"
          opacity="0.9"
        />

        {/* Left Basalt Colonnade */}
        <polygon points="0,0 200,0 230,710 0,770" fill="url(#pillarLeftGrad)" />
        <polygon
          points="240,90 350,90 370,650 250,670"
          fill="url(#pillarLeftGrad)"
          opacity="0.85"
        />
        <polygon
          points="380,190 460,190 475,630 390,640"
          fill="url(#pillarLeftGrad)"
          opacity="0.7"
        />

        {/* Right Basalt Colonnade */}
        <polygon points="1240,0 1440,0 1440,770 1210,710" fill="url(#pillarRightGrad)" />
        <polygon
          points="1090,90 1200,90 1190,670 1070,650"
          fill="url(#pillarRightGrad)"
          opacity="0.85"
        />
        <polygon
          points="980,190 1060,190 1050,640 965,630"
          fill="url(#pillarRightGrad)"
          opacity="0.7"
        />

        {/* Evidence Fragments (Evidence Act Docking) */}
        <g opacity={progress >= 0.24 ? 1 : 0.2} className="transition-opacity duration-700">
          {/* Left Evidence Fragment */}
          <polygon
            points={`${640 - (1 - evidenceT) * 180},540 ${655 - (1 - evidenceT) * 180},520 ${665 - (1 - evidenceT) * 180},550 ${650 - (1 - evidenceT) * 180},565`}
            fill="#E8E0D1"
            stroke="#B76548"
            strokeWidth="1"
          />
          {/* Right Evidence Fragment */}
          <polygon
            points={`${800 + (1 - evidenceT) * 180},540 ${815 + (1 - evidenceT) * 180},520 ${825 + (1 - evidenceT) * 180},550 ${810 + (1 - evidenceT) * 180},565`}
            fill="#E8E0D1"
            stroke="#B76548"
            strokeWidth="1"
          />
        </g>

        {/* Adversarial Opposition Blade (Opposition Act Monolith) */}
        {progress >= 0.4133 && (
          <g
            transform={`translate(${bladeX - 720}, ${bladeY - 500})`}
            className="transition-transform duration-500"
          >
            <polygon
              points="720,440 760,540 680,540"
              fill="#E8E0D1"
              stroke="#B76548"
              strokeWidth="1.5"
            />
            {progress >= 0.55 && progress <= 0.615 && (
              <circle
                cx="700"
                cy="510"
                r="16"
                fill="#F2A16A"
                opacity="0.7"
                className="animate-ping"
              />
            )}
          </g>
        )}

        {/* The Claim Relic: Faceted Obsidian & Glowing Ember */}
        <g transform="translate(720, 530)">
          {/* Singularity Glow */}
          <circle cx="0" cy="0" r="30" fill="#F2A16A" opacity="0.35" />
          <circle cx="0" cy="0" r="10" fill="#F2A16A" />
          {/* Faceted Obsidian Core */}
          <polygon
            points="0,-24 22,-8 14,20 -14,20 -22,-8"
            fill="#151413"
            stroke="#B76548"
            strokeWidth="1.5"
          />
          {/* Copper orbital ring */}
          <ellipse cx="0" cy="0" rx="34" ry="12" stroke="#B76548" strokeWidth="1.2" fill="none" />
        </g>
      </svg>

      {/* Atmospheric Vignette Overlay */}
      <div className="pointer-events-none absolute inset-0 bg-radial from-transparent via-[#090909]/60 to-[#050505]" />
    </div>
  );
};
