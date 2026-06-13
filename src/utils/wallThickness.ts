import type {
  ModelData,
  WallThicknessResult,
  WallThicknessSample,
  Vector3,
  ThicknessColorScheme,
} from '@/types';
import {
  normalize,
  scale,
  add,
  getFaceCentroid,
  computeFaceNormals,
  buildBVH,
  raycastBVH,
} from './geometry';

export function analyzeWallThickness(
  model: ModelData,
  sampleCount: number = 500
): WallThicknessResult {
  const { vertices, indices } = model;
  const faceCount = indices.length / 3;

  const samples: WallThicknessSample[] = [];
  const bvh = buildBVH(vertices, indices);
  const faceNormals = computeFaceNormals(vertices, indices);

  const step = Math.max(1, Math.floor(faceCount / sampleCount));
  const actualSamples = Math.min(sampleCount, faceCount);

  let minThickness = Infinity;
  let maxThickness = 0;
  let totalThickness = 0;

  for (let i = 0; i < actualSamples; i++) {
    const faceIndex = i * step;
    if (faceIndex >= faceCount) break;

    const centroid = getFaceCentroid(vertices, indices, faceIndex);
    const nx = faceNormals[faceIndex * 3];
    const ny = faceNormals[faceIndex * 3 + 1];
    const nz = faceNormals[faceIndex * 3 + 2];

    const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz);
    if (nLen === 0) continue;

    const dirX = -nx / nLen;
    const dirY = -ny / nLen;
    const dirZ = -nz / nLen;

    const rayOrigin = {
      x: centroid.x - dirX * 0.01,
      y: centroid.y - dirY * 0.01,
      z: centroid.z - dirZ * 0.01,
    };
    const rayDir = { x: dirX, y: dirY, z: dirZ };

    const result = raycastBVH(rayOrigin, rayDir, bvh, 100);

    if (result.hit && result.t > 0.001 && result.t < 100) {
      samples.push({
        x: centroid.x,
        y: centroid.y,
        z: centroid.z,
        thickness: result.t,
      });

      if (result.t < minThickness) minThickness = result.t;
      if (result.t > maxThickness) maxThickness = result.t;
      totalThickness += result.t;
    }
  }

  const avgThickness = samples.length > 0 ? totalThickness / samples.length : 0;
  const thicknessDistribution = computeThicknessDistribution(
    samples,
    minThickness,
    maxThickness
  );

  return {
    samples,
    minThickness: isFinite(minThickness) ? minThickness : 0,
    maxThickness,
    avgThickness,
    thicknessDistribution,
    sampleCount: samples.length,
  };
}

function computeThicknessDistribution(
  samples: WallThicknessSample[],
  minThickness: number,
  maxThickness: number
): { range: string; count: number; percentage: number }[] {
  if (samples.length === 0 || maxThickness === minThickness) {
    return [];
  }

  const binCount = 8;
  const range = maxThickness - minThickness;
  const binSize = range / binCount;
  const counts = new Array(binCount).fill(0);

  for (const sample of samples) {
    let binIndex = Math.floor((sample.thickness - minThickness) / binSize);
    if (binIndex >= binCount) binIndex = binCount - 1;
    if (binIndex < 0) binIndex = 0;
    counts[binIndex]++;
  }

  const total = samples.length;
  return counts.map((count, i) => {
    const start = (minThickness + i * binSize).toFixed(2);
    const end = (minThickness + (i + 1) * binSize).toFixed(2);
    return {
      range: `${start}-${end}mm`,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    };
  });
}

export function getThicknessColor(
  thickness: number,
  minThickness: number,
  maxThickness: number,
  scheme: ThicknessColorScheme = 'rainbow'
): { r: number; g: number; b: number } {
  if (maxThickness === minThickness) {
    return { r: 0.5, g: 0.5, b: 0.5 };
  }

  const t = Math.max(0, Math.min(1, (thickness - minThickness) / (maxThickness - minThickness)));

  switch (scheme) {
    case 'rainbow':
      return getRainbowColor(t);
    case 'coolwarm':
      return getCoolWarmColor(t);
    case 'grayscale':
      return getGrayscaleColor(t);
    default:
      return getRainbowColor(t);
  }
}

function getRainbowColor(t: number): { r: number; g: number; b: number } {
  const hue = (1 - t) * 240;
  return hslToRgb(hue / 360, 0.9, 0.5);
}

function getCoolWarmColor(t: number): { r: number; g: number; b: number } {
  const cool = { r: 0.11, g: 0.42, b: 0.88 };
  const warm = { r: 0.92, g: 0.26, b: 0.21 };
  const mid = { r: 0.95, g: 0.95, b: 0.95 };

  if (t < 0.5) {
    const k = t * 2;
    return {
      r: cool.r + (mid.r - cool.r) * k,
      g: cool.g + (mid.g - cool.g) * k,
      b: cool.b + (mid.b - cool.b) * k,
    };
  } else {
    const k = (t - 0.5) * 2;
    return {
      r: mid.r + (warm.r - mid.r) * k,
      g: mid.g + (warm.g - mid.g) * k,
      b: mid.b + (warm.b - mid.b) * k,
    };
  }
}

function getGrayscaleColor(t: number): { r: number; g: number; b: number } {
  const v = 0.15 + t * 0.8;
  return { r: v, g: v, b: v };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return { r, g, b };
}

export function getThicknessColorStops(scheme: ThicknessColorScheme = 'rainbow'): string[] {
  const stops: string[] = [];
  const steps = 9;
  for (let i = 0; i < steps; i++) {
    const t = 1 - i / (steps - 1);
    const c = getThicknessColor(t, 0, 1, scheme);
    const r = Math.round(c.r * 255);
    const g = Math.round(c.g * 255);
    const b = Math.round(c.b * 255);
    stops.push(`rgb(${r}, ${g}, ${b})`);
  }
  return stops;
}

export function createThicknessVertexColors(
  model: { vertices: Float32Array; indices: Uint32Array | Uint16Array },
  result: WallThicknessResult,
  scheme: ThicknessColorScheme = 'rainbow'
): Float32Array {
  const { vertices } = model;
  const vertexCount = vertices.length / 3;
  const colors = new Float32Array(vertexCount * 3);

  const vertexThickness = new Float32Array(vertexCount);
  const vertexWeight = new Float32Array(vertexCount);

  for (const sample of result.samples) {
    let nearestIdx = -1;
    let nearestDist = Infinity;

    for (let i = 0; i < vertexCount; i++) {
      const dx = vertices[i * 3] - sample.x;
      const dy = vertices[i * 3 + 1] - sample.y;
      const dz = vertices[i * 3 + 2] - sample.z;
      const d = dx * dx + dy * dy + dz * dz;
      if (d < nearestDist) {
        nearestDist = d;
        nearestIdx = i;
      }
    }

    if (nearestIdx >= 0) {
      vertexThickness[nearestIdx] += sample.thickness;
      vertexWeight[nearestIdx] += 1;
    }
  }

  for (let i = 0; i < vertexCount; i++) {
    let thickness: number;
    if (vertexWeight[i] > 0) {
      thickness = vertexThickness[i] / vertexWeight[i];
    } else {
      let nearestDist = Infinity;
      thickness = result.avgThickness;
      for (const sample of result.samples) {
        const dx = vertices[i * 3] - sample.x;
        const dy = vertices[i * 3 + 1] - sample.y;
        const dz = vertices[i * 3 + 2] - sample.z;
        const d = dx * dx + dy * dy + dz * dz;
        if (d < nearestDist) {
          nearestDist = d;
          thickness = sample.thickness;
        }
      }
    }

    const c = getThicknessColor(thickness, result.minThickness, result.maxThickness, scheme);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  return colors;
}
