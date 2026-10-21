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
      className={`select-none ${pulsing ? 'animate-ember-pulse' : ''} ${className}`}
      aria-label="Seal of the Obsidian Tribunal"
      role="img"
    >
      <defs>
        <linearGradient id="copperGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E8E0D1" />
          <stop offset="45%" stopColor="#B76548" />
          <stop offset="100%" stopColor="#733C2A" />
        </linearGradient>
        <radialGradient id="sealCenterGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F2A16A" stopOpacity="0.35" />
          <stop offset="60%" stopColor="#B76548" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#090909" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Central ambient ember glow */}
      <circle cx="60" cy="60" r="54" fill="url(#sealCenterGlow)" />

      {/* Outer Runic / Stele Ring */}
      <circle
        cx="60"
        cy="60"
        r="54"
        stroke="url(#copperGradient)"
        strokeWidth="1.5"
        strokeDasharray="3 3"
        opacity="0.85"
      />
      <circle
        cx="60"
        cy="60"
        r="49"
        stroke="url(#copperGradient)"
        strokeWidth="0.8"
        opacity="0.5"
      />

      {/* Cardinal Alignment Ticks */}
      <line x1="60" y1="3" x2="60" y2="9" stroke="url(#copperGradient)" strokeWidth="1.5" />
      <line x1="60" y1="111" x2="60" y2="117" stroke="url(#copperGradient)" strokeWidth="1.5" />
      <line x1="3" y1="60" x2="9" y2="60" stroke="url(#copperGradient)" strokeWidth="1.5" />
      <line x1="111" y1="60" x2="117" y2="60" stroke="url(#copperGradient)" strokeWidth="1.5" />

      {/* Interlocking Triangles (Sacred Balance Geometry) */}
      {/* Downward triangle (Inquiry) */}
      <polygon
        points="60,18 96,82 24,82"
        stroke="url(#copperGradient)"
        strokeWidth="1.2"
        fill="rgba(183, 101, 72, 0.05)"
      />
      {/* Upward triangle (Reasoning) */}
      <polygon
        points="60,102 24,38 96,38"
        stroke="url(#copperGradient)"
        strokeWidth="1.2"
        fill="rgba(183, 101, 72, 0.05)"
      />

      {/* Central Scales of Scrutiny */}
      {/* Central Pillar */}
      <line x1="60" y1="44" x2="60" y2="76" stroke="url(#copperGradient)" strokeWidth="1.8" />
      {/* Fulcrum Point */}
      <circle cx="60" cy="46" r="3" fill="url(#copperGradient)" />
      {/* Horizontal Balance Beam */}
      <line x1="42" y1="51" x2="78" y2="51" stroke="url(#copperGradient)" strokeWidth="1.4" />
      {/* Left Pan (Challenge) */}
      <line x1="44" y1="51" x2="38" y2="64" stroke="#B85C6C" strokeWidth="0.8" opacity="0.8" />
      <line x1="44" y1="51" x2="50" y2="64" stroke="#B85C6C" strokeWidth="0.8" opacity="0.8" />
      <path d="M36 64 C36 67, 52 67, 52 64 Z" fill="none" stroke="#B85C6C" strokeWidth="1.2" />

      {/* Right Pan (Corroboration) */}
      <line x1="76" y1="51" x2="70" y2="64" stroke="#5FBAA7" strokeWidth="0.8" opacity="0.8" />
      <line x1="76" y1="51" x2="82" y2="64" stroke="#5FBAA7" strokeWidth="0.8" opacity="0.8" />
      <path d="M68 64 C68 67, 84 67, 84 64 Z" fill="none" stroke="#5FBAA7" strokeWidth="1.2" />

      {/* Central Singularity of Verdict */}
      <circle cx="60" cy="62" r="2.2" fill="#F2A16A" />
      <circle
        cx="60"
        cy="62"
        r="5.5"
        stroke="url(#copperGradient)"
        strokeWidth="0.6"
        strokeDasharray="1 1"
      />
    </svg>
  );
};
