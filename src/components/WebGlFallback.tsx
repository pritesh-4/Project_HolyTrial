import React from 'react';

interface WebGlFallbackProps {
  isEntering?: boolean;
}

export const WebGlFallback: React.FC<WebGlFallbackProps> = ({ isEntering = false }) => {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-hidden bg-[#0C0D11] select-none"
      aria-label="2D Atmospheric Backdrop of the Obsidian Tribunal"
      role="img"
    >
      {/* Background subterranean depth gradient */}
      <div className="absolute inset-0 bg-radial from-[#181B26] via-[#0E1017] to-[#0A0B0F] opacity-90" />

      {/* Central Volumetric Light Beam */}
      <div
        className={`absolute top-0 left-1/2 h-full w-72 origin-top -translate-x-1/2 transform bg-gradient-to-b from-[#B9975B]/25 via-[#B9975B]/10 to-transparent blur-2xl transition-transform duration-1000 md:w-96 ${
          isEntering ? 'scale-125 opacity-70' : 'animate-shaft-drift'
        }`}
      />

      {/* SVG Architectural Silhouettes */}
      <svg
        className={`absolute inset-0 h-full w-full object-cover transition-transform duration-1000 ease-out ${
          isEntering ? '-translate-y-6 scale-110' : 'scale-100'
        }`}
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1440 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="pillarLeftGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#08090C" />
            <stop offset="85%" stopColor="#161822" />
            <stop offset="100%" stopColor="#252834" />
          </linearGradient>
          <linearGradient id="pillarRightGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#252834" />
            <stop offset="15%" stopColor="#161822" />
            <stop offset="100%" stopColor="#08090C" />
          </linearGradient>
          <linearGradient id="daisGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#252834" />
            <stop offset="50%" stopColor="#171922" />
            <stop offset="100%" stopColor="#0D0E13" />
          </linearGradient>
          <linearGradient id="floorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#181A22" />
            <stop offset="40%" stopColor="#0D0E13" />
            <stop offset="100%" stopColor="#060709" />
          </linearGradient>
        </defs>

        {/* Far Background Monolith */}
        <rect
          x="640"
          y="160"
          width="160"
          height="480"
          fill="#0C0D12"
          stroke="#B9975B"
          strokeOpacity="0.3"
          strokeWidth="1"
        />
        <line
          x1="720"
          y1="180"
          x2="720"
          y2="620"
          stroke="#B9975B"
          strokeOpacity="0.4"
          strokeWidth="1.5"
        />

        {/* Chamber Floor */}
        <polygon points="0,640 1440,640 1440,900 0,900" fill="url(#floorGrad)" />

        {/* Floor Inlay Perspective Lines */}
        <line
          x1="720"
          y1="640"
          x2="100"
          y2="900"
          stroke="#B9975B"
          strokeOpacity="0.2"
          strokeWidth="1"
        />
        <line
          x1="720"
          y1="640"
          x2="1340"
          y2="900"
          stroke="#B9975B"
          strokeOpacity="0.2"
          strokeWidth="1"
        />
        <line
          x1="720"
          y1="640"
          x2="480"
          y2="900"
          stroke="#B9975B"
          strokeOpacity="0.15"
          strokeWidth="1"
        />
        <line
          x1="720"
          y1="640"
          x2="960"
          y2="900"
          stroke="#B9975B"
          strokeOpacity="0.15"
          strokeWidth="1"
        />

        {/* Central Judicial Dais */}
        <polygon
          points="560,670 880,670 940,730 500,730"
          fill="url(#daisGrad)"
          stroke="#B9975B"
          strokeOpacity="0.5"
          strokeWidth="1"
        />
        <polygon
          points="590,650 850,650 890,670 550,670"
          fill="#1C1E28"
          stroke="#B9975B"
          strokeOpacity="0.4"
          strokeWidth="0.8"
        />

        {/* Dais Sacred Inlay Ring */}
        <ellipse
          cx="720"
          cy="695"
          rx="100"
          ry="24"
          stroke="#B9975B"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.7"
        />
        <ellipse
          cx="720"
          cy="695"
          rx="50"
          ry="12"
          stroke="#B9975B"
          strokeWidth="1.2"
          opacity="0.9"
        />

        {/* Left Colonnade (Foreground & Midground Pillars) */}
        <polygon points="0,0 220,0 250,720 0,780" fill="url(#pillarLeftGrad)" />
        <polygon
          points="260,100 370,100 390,660 270,680"
          fill="url(#pillarLeftGrad)"
          opacity="0.85"
        />
        <polygon
          points="400,200 480,200 495,640 410,650"
          fill="url(#pillarLeftGrad)"
          opacity="0.7"
        />

        {/* Right Colonnade (Foreground & Midground Pillars) */}
        <polygon points="1220,0 1440,0 1440,780 1190,720" fill="url(#pillarRightGrad)" />
        <polygon
          points="1070,100 1180,100 1170,680 1050,660"
          fill="url(#pillarRightGrad)"
          opacity="0.85"
        />
        <polygon
          points="960,200 1040,200 1030,650 945,640"
          fill="url(#pillarRightGrad)"
          opacity="0.7"
        />
      </svg>

      {/* Atmospheric Vignette Overlay */}
      <div className="pointer-events-none absolute inset-0 bg-radial from-transparent via-[#0C0D11]/60 to-[#0A0B0E]" />
    </div>
  );
};
