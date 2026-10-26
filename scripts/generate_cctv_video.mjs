import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const emptyImg = path.resolve('public/cinematic/cctv_archive_empty.jpg');
const silImg = path.resolve('public/cinematic/cctv_archive_silhouette.jpg');
const outMp4 = path.resolve('public/cinematic/cctv_surveillance_archive.mp4');
const outWebm = path.resolve('public/cinematic/cctv_surveillance_archive.webm');

console.log('Generating authentic CCTV surveillance footage using ffmpeg...');

// We create a 20-second video at 24fps (480 frames):
// 0.0s - 5.0s (120 frames): empty archive aisle (21:13:58 - 21:14:02)
// 5.0s - 20.0s (360 frames): anomaly revealed - human silhouette in corridor doorway (21:14:03 - 21:14:18)
// With realistic VHS tape grain, subtle sensor noise, and glitch at the transition.

const filterComplex = `
[0:v]scale=1376:768,format=yuv420p,loop=loop=120:size=1:start=0,trim=duration=5,fps=24[v0];
[1:v]scale=1376:768,format=yuv420p,loop=loop=360:size=1:start=0,trim=duration=15,fps=24[v1];
[v0][v1]concat=n=2:v=1:a=0[vbase];
[vbase]noise=alls=10:allf=t+u,eq=contrast=1.08:brightness=-0.02:saturation=0.85[vout]
`.trim().replace(/\n/g, '');

const cmdMp4 = `ffmpeg -y -loop 1 -i "${emptyImg}" -loop 1 -i "${silImg}" -filter_complex "${filterComplex}" -map "[vout]" -c:v libx264 -preset fast -crf 22 -pix_fmt yuv420p -movflags +faststart -t 20 "${outMp4}"`;

console.log('Encoding MP4...');
execSync(cmdMp4, { stdio: 'inherit' });

console.log('Encoding WebM...');
const cmdWebm = `ffmpeg -y -i "${outMp4}" -c:v libvpx-vp9 -b:v 1M -crf 30 -pix_fmt yuv420p "${outWebm}"`;
try {
  execSync(cmdWebm, { stdio: 'inherit' });
  console.log('WebM generated successfully.');
} catch (e) {
  console.log('WebM encoding failed or skipped, MP4 is ready.');
}

console.log('Video generation complete!');
console.log('MP4 exists:', fs.existsSync(outMp4), 'Size:', fs.statSync(outMp4).size, 'bytes');
