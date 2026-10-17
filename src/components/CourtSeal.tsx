import React from 'react';

interface CourtSealProps {
  size?: number;
  className?: string;
  pulsing?: boolean;
}

export const CourtSeal: React.FC<CourtSealProps> = ({
  size = 64,
  className = '',
  pulsing = true,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none ${pulsing ? 'animate-gold-pulse' : ''} ${className}`}
      aria-label="Seal of the Obsidian Tribunal"
      role="img"
    >
      <defs>
        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#DFCA9B" />
          <stop offset="50%" stopColor="#B9975B" />
          <stop offset="100%" stopColor="#7A633A" />
        </linearGradient>
        <radialGradient id="sealCenterGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#B9975B" stopOpacity="0.3" />
          <stop offset="70%" stopColor="#0C0D11" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#0C0D11" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Central ambient glow */}
      <circle cx="60" cy="60" r="54" fill="url(#sealCenterGlow)" />

      {/* Outer Runic / Stele Ring */}
      <circle
        cx="60"
        cy="60"
        r="54"
        stroke="url(#goldGradient)"
        strokeWidth="1.5"
        strokeDasharray="3 3"
        opacity="0.8"
      />
      <circle cx="60" cy="60" r="49" stroke="url(#goldGradient)" strokeWidth="0.8" opacity="0.5" />

      {/* Cardinal Alignment Ticks */}
      <line x1="60" y1="3" x2="60" y2="9" stroke="url(#goldGradient)" strokeWidth="1.5" />
      <line x1="60" y1="111" x2="60" y2="117" stroke="url(#goldGradient)" strokeWidth="1.5" />
      <line x1="3" y1="60" x2="9" y2="60" stroke="url(#goldGradient)" strokeWidth="1.5" />
      <line x1="111" y1="60" x2="117" y2="60" stroke="url(#goldGradient)" strokeWidth="1.5" />

      {/* Interlocking Triangles (Sacred Balance Geometry) */}
      {/* Downward triangle (Inquiry) */}
      <polygon
        points="60,18 96,82 24,82"
        stroke="url(#goldGradient)"
        strokeWidth="1.2"
        fill="rgba(185, 151, 91, 0.04)"
      />
      {/* Upward triangle (Reasoning) */}
      <polygon
        points="60,102 24,38 96,38"
        stroke="url(#goldGradient)"
        strokeWidth="1.2"
        fill="rgba(185, 151, 91, 0.04)"
      />

      {/* Central Scales of Scrutiny */}
      {/* Central Pillar */}
      <line x1="60" y1="44" x2="60" y2="76" stroke="url(#goldGradient)" strokeWidth="1.8" />
      {/* Fulcrum Point */}
      <circle cx="60" cy="46" r="3" fill="url(#goldGradient)" />
      {/* Horizontal Balance Beam */}
      <line x1="42" y1="51" x2="78" y2="51" stroke="url(#goldGradient)" strokeWidth="1.4" />
      {/* Left Pan (Prosecution / Challenge) */}
      <line x1="44" y1="51" x2="38" y2="64" stroke="#B85C6C" strokeWidth="0.8" opacity="0.8" />
      <line x1="44" y1="51" x2="50" y2="64" stroke="#B85C6C" strokeWidth="0.8" opacity="0.8" />
      <path d="M36 64 C36 67, 52 67, 52 64 Z" fill="none" stroke="#B85C6C" strokeWidth="1.2" />

      {/* Right Pan (Defense / Corroboration) */}
      <line x1="76" y1="51" x2="70" y2="64" stroke="#5FBAA7" strokeWidth="0.8" opacity="0.8" />
      <line x1="76" y1="51" x2="82" y2="64" stroke="#5FBAA7" strokeWidth="0.8" opacity="0.8" />
      <path d="M68 64 C68 67, 84 67, 84 64 Z" fill="none" stroke="#5FBAA7" strokeWidth="1.2" />

      {/* Central Eye / Singularity of Verdict */}
      <circle cx="60" cy="62" r="2" fill="#E8E0D2" />
      <circle
        cx="60"
        cy="62"
        r="5"
        stroke="url(#goldGradient)"
        strokeWidth="0.6"
        strokeDasharray="1 1"
      />
    </svg>
  );
};
