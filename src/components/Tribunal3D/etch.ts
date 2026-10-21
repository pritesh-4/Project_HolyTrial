/**
 * etch — procedural engraved-line toolkit ("The Trial Awakens" signature).
 *
 * Builds THREE.Line objects meant to read as etched inscriptions on stone:
 * dashed, copper/warm-bone strokes that are *traced* open (drawRange) and
 * then settle back into the material surface (opacity to a resting value).
 * Nothing is allocated per frame — geometry is built once, reveal is driven
 * by drawRange + opacity from the authoritative cinematic progress.
 *
 * Technique lineage: canvas-drawn guide lines & draw-on strokes (Trionn
 * weld lines), selective-line reveals tracing relationships between
 * objects (hybrid 2D/3D approach of My Little Storybook/Ponpon).
 */
import * as THREE from 'three';

/** Progress inside an absolute cinematic window [from, to]; 0 before, 1 after. */
export function windowT(progress: number, from: number, to: number): number {
  if (progress <= from) return 0;
  if (progress >= to) return 1;
  return (progress - from) / (to - from);
}

/** Smoothstep ease. */
export function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

/** Beat window with a slightly smoothed ease. */
export function easedWindow(progress: number, from: number, to: number): number {
  return smooth(windowT(progress, from, to));
}

export interface EtchedLineOptions {
  /** Stroke color (copper by default). */
  color?: string;
  /** Resting opacity once fully traced (0 = folds back into the surface). */
  restOpacity?: number;
  /** Approximate world-space width of the dash pattern. */
  dashSize?: number;
  gapSize?: number;
}

export interface EtchedLine {
  object: THREE.Line;
  material: THREE.LineDashedMaterial;
  /** Number of drawRange segments when fully revealed. */
  totalSegments: number;
  /** Set reveal 0..1 without allocating. */
  setReveal(t: number): void;
  /** Set opacity without allocating. */
  setOpacity(v: number): void;
}

/** Create an etched polyline from world-space points (one draw call). */
export function makeEtchedLine(
  points: THREE.Vector3[],
  options: EtchedLineOptions = {}
): EtchedLine {
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineDashedMaterial({
    color: new THREE.Color(options.color ?? '#B76548'),
    transparent: true,
    opacity: 0,
    dashSize: options.dashSize ?? 0.12,
    gapSize: options.gapSize ?? 0.08,
    depthWrite: false,
  });
  const object = new THREE.Line(geometry, material);
  object.computeLineDistances();
  object.frustumCulled = false;
  object.renderOrder = 2;

  const total = Math.max(1, points.length - 1);

  return {
    object,
    material,
    totalSegments: total,
    setReveal(t: number) {
      geometry.setDrawRange(0, Math.ceil(t * total));
    },
    setOpacity(v: number) {
      material.opacity = v;
    },
  };
}

/** Etched glyph ring engraving — points on a circle with notch marks. */
export function makeGlyphRing(
  center: THREE.Vector3,
  radius: number,
  plane: 'xy' | 'yz' | 'xz',
  options: EtchedLineOptions & { notches?: number; closed?: boolean } = {}
): EtchedLine {
  const pts: THREE.Vector3[] = [];
  const segments = 64;
  const notch = options.notches ?? 5;
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const wobble = 1 + (i % notch === 0 ? 0.08 : 0);
    const r = radius * wobble;
    const [x, y, z] = [Math.cos(a) * r, Math.sin(a) * r, 0];
    if (plane === 'xy') pts.push(new THREE.Vector3(center.x + x, center.y + y, center.z + z));
    else if (plane === 'yz') pts.push(new THREE.Vector3(center.x + z, center.y + x, center.z + y));
    else pts.push(new THREE.Vector3(center.x + x, center.y + z, center.z + y));
  }
  return makeEtchedLine(pts, options);
}

/** Radial glyph strokes fanning from a center (like clock marks). */
export function makeRadialMarks(
  center: THREE.Vector3,
  innerRadius: number,
  outerRadius: number,
  count: number,
  plane: 'xy' | 'yz' | 'xz' = 'xy',
  options: EtchedLineOptions = {}
): EtchedLine[] {
  return Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2 + Math.PI / (count * 2);
    const dir = [Math.cos(a), Math.sin(a)] as const;
    const mk = (r: number): [number, number, number] =>
      plane === 'xy'
        ? [center.x + dir[0] * r, center.y + dir[1] * r, center.z]
        : plane === 'yz'
          ? [center.x + dir[1] * r, center.y + dir[0] * r, center.z]
          : [center.x + dir[0] * r, center.y + dir[1] * r, center.z];
    return makeEtchedLine(
      [new THREE.Vector3(...mk(innerRadius)), new THREE.Vector3(...mk(outerRadius))],
      options
    );
  });
}

/**
 * A jagged procedural crack across a planar face — generated with a seeded
 * pseudo-random walk so the same world yields the same fracture each load.
 */
export function makeCrack(
  origin: THREE.Vector3,
  directionAngle: number,
  length: number,
  segments = 14,
  seed = 7,
  options: EtchedLineOptions = {}
): EtchedLine {
  const pts: THREE.Vector3[] = [origin.clone()];
  let x = origin.x;
  let y = origin.y;
  let z = origin.z;
  let angle = directionAngle;
  let s = seed;
  const step = length / segments;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let i = 0; i < segments; i++) {
    angle += (rand() - 0.5) * 1.1;
    const dx = Math.cos(angle) * step * (0.6 + rand() * 0.8);
    const dy = Math.sin(angle) * step * (0.6 + rand() * 0.8);
    const dz = (rand() - 0.5) * step * 0.25;
    x += dx;
    y += dy;
    z += dz;
    pts.push(new THREE.Vector3(x, y, z));
  }
  return makeEtchedLine(pts, options);
}

/** Many etched strokes drawn as a single LineSegments object (cheap). */
export function makeEtchedSegments(
  segments: Array<[THREE.Vector3, THREE.Vector3]>,
  options: EtchedLineOptions = {}
): EtchedLine {
  const pts: THREE.Vector3[] = segments.flat();
  const geometry = new THREE.BufferGeometry().setFromPoints(pts);
  const material = new THREE.LineDashedMaterial({
    color: new THREE.Color(options.color ?? '#B76548'),
    transparent: true,
    opacity: 0,
    dashSize: options.dashSize ?? 0.1,
    gapSize: options.gapSize ?? 0.06,
    depthWrite: false,
  });
  const object = new THREE.LineSegments(geometry, material);
  object.computeLineDistances();
  object.frustumCulled = false;
  object.renderOrder = 2;
  // Each segment counts as one reveal unit.
  const total = segments.length;

  return {
    object,
    material,
    totalSegments: total,
    setReveal(t: number) {
      // Reveal whole segments in order (pairs of points).
      const visible = Math.floor(t * total) * 2;
      geometry.setDrawRange(0, visible + (t > 0 ? 2 : 0));
    },
    setOpacity(v: number) {
      material.opacity = v;
    },
  };
}
