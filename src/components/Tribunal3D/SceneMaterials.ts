// Canonical PBR Materials and Procedural Texture Generators
// Palette: Obsidian, Warm Bone, Oxidized Copper, Ember, Weathered Stone, Basalt Void

import * as THREE from 'three';

// Generate procedural stone noise texture for roughness & micro-surface variation
function createStoneNoiseTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    // Multi-octave pseudo-random speckle
    const noise = (Math.random() - 0.5) * 55;
    const val = Math.min(255, Math.max(0, 128 + noise));
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
    data[i + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

// Generate copper weathering & engraving bump texture
function createCopperBumpTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  // Subtle inscribed geometric lines
  ctx.strokeStyle = '#303030';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, size / 2);
  ctx.lineTo(size, size / 2);
  ctx.moveTo(size / 2, 0);
  ctx.lineTo(size / 2, size);
  ctx.arc(size / 2, size / 2, size / 3, 0, Math.PI * 2);
  ctx.stroke();

  // Weathering stipples
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 2 + 0.5;
    ctx.fillStyle = Math.random() > 0.5 ? '#a0a0a0' : '#505050';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export const canonicalColors = {
  basaltVoid: '#090909',
  obsidian: '#151413',
  weatheredStone: '#292521',
  warmBone: '#E8E0D1',
  oxidizedCopper: '#B76548',
  ember: '#F2A16A',
  ash: '#9C948A',
};

export function createTribunalMaterials() {
  const stoneNoise = createStoneNoiseTexture();
  const copperBump = createCopperBumpTexture();

  // Polished Volcanic Obsidian (deep black, subtle gloss reflection, fine surface variation)
  const obsidianPolished = new THREE.MeshStandardMaterial({
    color: new THREE.Color(canonicalColors.obsidian),
    roughness: 0.18,
    metalness: 0.85,
    roughnessMap: stoneNoise,
  });

  // Rough Blackstone / Weathered Basalt (for monolithic columns & dais steps)
  const basaltRough = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#100F0E'),
    roughness: 0.88,
    metalness: 0.15,
    roughnessMap: stoneNoise,
    bumpMap: stoneNoise,
    bumpScale: 0.04,
    flatShading: true,
  });

  // Weathered Stone (mid-tone architectural stone)
  const weatheredStone = new THREE.MeshStandardMaterial({
    color: new THREE.Color(canonicalColors.weatheredStone),
    roughness: 0.75,
    metalness: 0.2,
    roughnessMap: stoneNoise,
  });

  // Oxidized Copper (burnished copper with fine patina and warm undertone)
  const oxidizedCopper = new THREE.MeshStandardMaterial({
    color: new THREE.Color(canonicalColors.oxidizedCopper),
    roughness: 0.42,
    metalness: 0.78,
    bumpMap: copperBump,
    bumpScale: 0.02,
  });

  // Warm Bone (pale calcified stone for evidence and opposition geometry)
  const warmBone = new THREE.MeshStandardMaterial({
    color: new THREE.Color(canonicalColors.warmBone),
    roughness: 0.62,
    metalness: 0.1,
    roughnessMap: stoneNoise,
  });

  // Emissive Ember (for the central claim spark and impact fractures)
  const emberEmissive = new THREE.MeshStandardMaterial({
    color: new THREE.Color(canonicalColors.ember),
    emissive: new THREE.Color(canonicalColors.ember),
    emissiveIntensity: 2.2,
    roughness: 0.3,
    metalness: 0.1,
  });

  return {
    obsidianPolished,
    basaltRough,
    weatheredStone,
    oxidizedCopper,
    warmBone,
    emberEmissive,
    stoneNoise,
    copperBump,
  };
}
