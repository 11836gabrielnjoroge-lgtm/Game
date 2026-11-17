import * as THREE from 'three';
import { StageId } from './types';

export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 62);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.72)');
  grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.32)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createArenaFloorTexture(stageId: StageId, maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  if (stageId === 'metropolis') {
    ctx.fillStyle = '#1b1e26';
    ctx.fillRect(0, 0, 512, 512);
    // Asphalt speckle & concrete seams
    for (let i = 0; i < 1600; i++) {
      const x = (i * 73) % 512;
      const y = (i * 139) % 512;
      ctx.fillStyle = i % 3 === 0 ? '#272b36' : '#12141a';
      ctx.fillRect(x, y, 3, 3);
    }
    ctx.strokeStyle = '#0d0f14';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, 504, 504);
    ctx.beginPath();
    ctx.moveTo(256, 0);
    ctx.lineTo(256, 512);
    ctx.moveTo(0, 256);
    ctx.lineTo(512, 256);
    ctx.stroke();

    // Subtle amber road markings
    ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
    ctx.fillRect(24, 248, 84, 16);
    ctx.fillRect(148, 248, 84, 16);
    ctx.fillRect(280, 248, 84, 16);
    ctx.fillRect(404, 248, 84, 16);
  } else if (stageId === 'watchtower') {
    ctx.fillStyle = '#141c2b';
    ctx.fillRect(0, 0, 512, 512);
    // Brushed metallic hull plates
    ctx.strokeStyle = '#2b3952';
    ctx.lineWidth = 3;
    for (let x = 0; x <= 512; x += 128) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
    for (let y = 0; y <= 512; y += 128) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }
    // Glowing cyan circuit accents
    ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
    ctx.fillRect(0, 124, 512, 6);
    ctx.fillRect(0, 380, 512, 6);
    ctx.fillStyle = '#334155';
    for (let x = 16; x < 512; x += 128) {
      for (let y = 16; y < 512; y += 128) {
        ctx.fillRect(x, y, 8, 8);
        ctx.fillRect(x + 88, y + 88, 8, 8);
      }
    }
  } else {
    // Citadel Courtyard stone flagstones
    ctx.fillStyle = '#181c24';
    ctx.fillRect(0, 0, 512, 512);
    const rows = 8;
    const h = 512 / rows;
    for (let r = 0; r < rows; r++) {
      const offset = (r % 2) * 64;
      for (let x = -64; x < 512; x += 128) {
        const shade = 24 + ((r * 7 + x) % 14);
        ctx.fillStyle = `rgb(${shade}, ${shade + 4}, ${shade + 12})`;
        ctx.fillRect(x + offset + 3, r * h + 3, 122, h - 6);
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(16, 8);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createEarthTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const oceanGrad = ctx.createLinearGradient(0, 0, 0, 256);
  oceanGrad.addColorStop(0, '#0c2d57');
  oceanGrad.addColorStop(0.5, '#0f4c81');
  oceanGrad.addColorStop(1, '#08203e');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, 512, 256);

  // Stylized continents
  ctx.fillStyle = '#2e6f56';
  const blobs = [
    [90, 95, 55, 34],
    [140, 145, 38, 42],
    [255, 85, 68, 36],
    [285, 135, 42, 46],
    [390, 105, 60, 38],
    [415, 170, 32, 24],
  ];
  for (const [bx, by, rx, ry] of blobs) {
    ctx.beginPath();
    ctx.ellipse(bx, by, rx, ry, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cloud wisps
  ctx.fillStyle = 'rgba(226, 232, 240, 0.38)';
  for (let i = 0; i < 28; i++) {
    const cx = (i * 59) % 512;
    const cy = 24 + ((i * 37) % 200);
    ctx.beginPath();
    ctx.ellipse(cx, cy, 42 + (i % 24), 8, 0.1, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}
