import type {
  ModelData,
  SectionResult,
  SectionPlane,
  SectionContourPoint,
  SectionThicknessSample,
  Vector3,
} from '@/types';
import {
  computeFaceNormals,
  buildBVH,
  rayTriangleIntersect,
} from './geometry';

const EPS = 1e-8;
const POINT_KEY_PRECISION = 4;

interface Segment {
  faceIndex: number;
  p0: Vector3;
  p1: Vector3;
  key0: string;
  key1: string;
}

function pointKey(p: Vector3): string {
  return `${p.x.toFixed(POINT_KEY_PRECISION)},${p.y.toFixed(POINT_KEY_PRECISION)},${p.z.toFixed(POINT_KEY_PRECISION)}`;
}

function dedupePoints(arr: Vector3[]): Vector3[] {
  const seen = new Set<string>();
  const result: Vector3[] = [];
  for (const p of arr) {
    const key = pointKey(p);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(p);
    }
  }
  return result;
}

function getCoord(v: Vector3, axis: string): number {
  switch (axis) {
    case 'x': return v.x;
    case 'y': return v.y;
    case 'z': return v.z;
    default: return v.y;
  }
}

export function computeSection(
  model: ModelData,
  plane: SectionPlane,
  thicknessResolution: number = 50
): SectionResult {
  const { vertices, indices } = model;
  const faceCount = indices.length / 3;
  const axis = plane.axis;
  const planePos = plane.position;

  const segments: Segment[] = [];
  const pointToSegments = new Map<string, number[]>();

  for (let i = 0; i < faceCount; i++) {
    const i0 = indices[i * 3];
    const i1 = indices[i * 3 + 1];
    const i2 = indices[i * 3 + 2];

    const v0 = {
      x: vertices[i0 * 3],
      y: vertices[i0 * 3 + 1],
      z: vertices[i0 * 3 + 2],
    };
    const v1 = {
      x: vertices[i1 * 3],
      y: vertices[i1 * 3 + 1],
      z: vertices[i1 * 3 + 2],
    };
    const v2 = {
      x: vertices[i2 * 3],
      y: vertices[i2 * 3 + 1],
      z: vertices[i2 * 3 + 2],
    };

    const d0 = getCoord(v0, axis) - planePos;
    const d1 = getCoord(v1, axis) - planePos;
    const d2 = getCoord(v2, axis) - planePos;

    const onPlane0 = Math.abs(d0) < EPS;
    const onPlane1 = Math.abs(d1) < EPS;
    const onPlane2 = Math.abs(d2) < EPS;
    const onPlaneCount = (onPlane0 ? 1 : 0) + (onPlane1 ? 1 : 0) + (onPlane2 ? 1 : 0);

    if (onPlaneCount === 3) continue;

    const crossings: Vector3[] = [];

    const addCrossing = (
      va: Vector3, vb: Vector3,
      da: number, db: number,
      onA: boolean, onB: boolean
    ) => {
      if (onA && onB) return;

      if (onA || onB) {
        const pt = onA ? { ...va } : { ...vb };
        crossings.push(pt);
        return;
      }

      const sameSide = (da > 0 && db > 0) || (da < 0 && db < 0);
      if (sameSide) return;

      const t = Math.abs(da) / (Math.abs(da) + Math.abs(db));
      const pt = {
        x: va.x + (vb.x - va.x) * t,
        y: va.y + (vb.y - va.y) * t,
        z: va.z + (vb.z - va.z) * t,
      };
      crossings.push(pt);
    };

    addCrossing(v0, v1, d0, d1, onPlane0, onPlane1);
    addCrossing(v1, v2, d1, d2, onPlane1, onPlane2);
    addCrossing(v2, v0, d2, d0, onPlane2, onPlane0);

    const unique = dedupePoints(crossings);

    if (unique.length >= 2) {
      const seg: Segment = {
        faceIndex: i,
        p0: unique[0],
        p1: unique[1],
        key0: pointKey(unique[0]),
        key1: pointKey(unique[1]),
      };
      segments.push(seg);

      const segIdx = segments.length - 1;
      if (!pointToSegments.has(seg.key0)) pointToSegments.set(seg.key0, []);
      pointToSegments.get(seg.key0)!.push(segIdx);

      if (!pointToSegments.has(seg.key1)) pointToSegments.set(seg.key1, []);
      pointToSegments.get(seg.key1)!.push(segIdx);
    }
  }

  const contours = buildContoursFromSegments(segments, pointToSegments);
  const area = computeArea(contours, axis);
  const perimeter = computePerimeter(contours);

  const thicknessSamples = computeSectionThickness(
    model, plane, contours, thicknessResolution
  );

  let minT = Infinity, maxT = 0, sumT = 0, countT = 0;
  for (const s of thicknessSamples) {
    if (s.thickness > 0 && s.thickness < 1000) {
      minT = Math.min(minT, s.thickness);
      maxT = Math.max(maxT, s.thickness);
      sumT += s.thickness;
      countT++;
    }
  }

  return {
    contourPoints: contours,
    area,
    perimeter,
    thicknessSamples,
    minThickness: isFinite(minT) && countT > 0 ? minT : 0,
    maxThickness: countT > 0 ? maxT : 0,
    avgThickness: countT > 0 ? sumT / countT : 0,
    thicknessDistribution: computeThicknessDistribution(
      thicknessSamples.filter(s => s.thickness > 0 && s.thickness < 1000),
      minT, maxT
    ),
    plane,
  };
}

function buildContoursFromSegments(
  segments: Segment[],
  pointToSegments: Map<string, number[]>
): SectionContourPoint[][] {
  if (segments.length === 0) return [];

  const usedSegments = new Set<number>();
  const contours: SectionContourPoint[][] = [];

  for (let i = 0; i < segments.length; i++) {
    if (usedSegments.has(i)) continue;

    const contour: SectionContourPoint[] = [];
    const startSeg = segments[i];
    let currentSegIdx = i;
    let currentPointKey = startSeg.key0;
    let otherPointKey = startSeg.key1;
    const startPointKey = currentPointKey;

    let safety = 0;
    const maxIter = segments.length * 2 + 100;

    while (safety < maxIter) {
      safety++;

      if (usedSegments.has(currentSegIdx)) {
        break;
      }
      usedSegments.add(currentSegIdx);

      const currentSeg = segments[currentSegIdx];
      const pt = currentPointKey === currentSeg.key0 ? currentSeg.p0 : currentSeg.p1;
      contour.push({ x: pt.x, y: pt.y, z: pt.z });

      const nextSegIdxs = pointToSegments.get(otherPointKey) || [];
      let nextSegIdx = -1;

      for (const sIdx of nextSegIdxs) {
        if (sIdx !== currentSegIdx && !usedSegments.has(sIdx)) {
          nextSegIdx = sIdx;
          break;
        }
      }

      if (nextSegIdx === -1) {
        break;
      }

      const nextSeg = segments[nextSegIdx];
      const nextCurrentKey = otherPointKey;
      const nextOtherKey = nextSeg.key0 === otherPointKey ? nextSeg.key1 : nextSeg.key0;

      if (nextOtherKey === startPointKey || nextCurrentKey === startPointKey) {
        const lastPt = nextCurrentKey === nextSeg.key0 ? nextSeg.p0 : nextSeg.p1;
        contour.push({ x: lastPt.x, y: lastPt.y, z: lastPt.z });
        usedSegments.add(nextSegIdx);
        break;
      }

      currentSegIdx = nextSegIdx;
      currentPointKey = nextCurrentKey;
      otherPointKey = nextOtherKey;
    }

    if (contour.length >= 3) {
      contours.push(contour);
    }
  }

  return contours;
}

function distance(a: Vector3, b: Vector3): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function project2D(p: SectionContourPoint, axis: string): { x: number; y: number } {
  switch (axis) {
    case 'x': return { x: p.y, y: p.z };
    case 'y': return { x: p.x, y: p.z };
    case 'z': return { x: p.x, y: p.y };
    default: return { x: p.x, y: p.z };
  }
}

function computeArea(contours: SectionContourPoint[][], axis: string): number {
  let total = 0;
  for (const c of contours) {
    if (c.length < 3) continue;
    let a = 0;
    const n = c.length;
    for (let i = 0; i < n; i++) {
      const p1 = project2D(c[i], axis);
      const p2 = project2D(c[(i + 1) % n], axis);
      a += p1.x * p2.y - p2.x * p1.y;
    }
    total += Math.abs(a) / 2;
  }
  return total;
}

function computePerimeter(contours: SectionContourPoint[][]): number {
  let total = 0;
  for (const c of contours) {
    if (c.length < 2) continue;
    const n = c.length;
    for (let i = 0; i < n; i++) {
      total += distance(c[i], c[(i + 1) % n]);
    }
  }
  return total;
}

function computeSectionThickness(
  model: ModelData,
  plane: SectionPlane,
  contours: SectionContourPoint[][],
  resolution: number
): SectionThicknessSample[] {
  if (contours.length === 0) return [];

  const samples: SectionThicknessSample[] = [];
  const bvh = buildBVH(model.vertices, model.indices);
  const normal = getNormal(plane.axis);

  for (const contour of contours) {
    if (contour.length < 2) continue;
    const len = contourLength(contour);
    if (len <= 0) continue;

    const step = len / resolution;
    for (let i = 0; i <= resolution; i++) {
      const dist = Math.min(i * step, len * 0.999);
      const pt = pointAtDistance(contour, dist);
      if (!pt) continue;

      const t = raycastThickness(pt, normal, bvh.triangles);
      if (t > 0 && t < 1000) {
        samples.push({ position: dist, thickness: t, normal });
      }
    }
  }

  return samples;
}

function getNormal(axis: string): Vector3 {
  switch (axis) {
    case 'x': return { x: 1, y: 0, z: 0 };
    case 'y': return { x: 0, y: 1, z: 0 };
    case 'z': return { x: 0, y: 0, z: 1 };
    default: return { x: 0, y: 1, z: 0 };
  }
}

function contourLength(c: SectionContourPoint[]): number {
  let len = 0;
  for (let i = 0; i < c.length - 1; i++) {
    len += distance(c[i], c[i + 1]);
  }
  return len;
}

function pointAtDistance(
  contour: SectionContourPoint[],
  target: number
): SectionContourPoint | null {
  if (contour.length < 2) return null;
  let acc = 0;
  for (let i = 0; i < contour.length - 1; i++) {
    const segLen = distance(contour[i], contour[i + 1]);
    if (acc + segLen >= target) {
      const t = segLen > 0 ? (target - acc) / segLen : 0;
      return {
        x: contour[i].x + (contour[i + 1].x - contour[i].x) * t,
        y: contour[i].y + (contour[i + 1].y - contour[i].y) * t,
        z: contour[i].z + (contour[i + 1].z - contour[i].z) * t,
      };
    }
    acc += segLen;
  }
  return contour[contour.length - 1];
}

function raycastThickness(
  point: Vector3,
  planeNormal: Vector3,
  triangles: { v0: Vector3; v1: Vector3; v2: Vector3; normal: Vector3 }[]
): number {
  const dir = { x: -planeNormal.x, y: -planeNormal.y, z: -planeNormal.z };
  const origin = {
    x: point.x + planeNormal.x * 0.01,
    y: point.y + planeNormal.y * 0.01,
    z: point.z + planeNormal.z * 0.01,
  };

  let minT = Infinity;
  for (const tri of triangles) {
    const r = rayTriangleIntersect(origin, dir, tri.v0, tri.v1, tri.v2);
    if (r.hit && r.t > 0.001 && r.t < minT) {
      minT = r.t;
    }
  }
  return isFinite(minT) ? minT : -1;
}

function computeThicknessDistribution(
  samples: SectionThicknessSample[],
  minT: number,
  maxT: number
): { range: string; count: number; percentage: number }[] {
  if (samples.length === 0 || maxT <= minT) return [];

  const bins = 8;
  const range = maxT - minT;
  const binSize = range / bins;
  const counts = new Array(bins).fill(0);

  for (const s of samples) {
    let idx = Math.floor((s.thickness - minT) / binSize);
    if (idx >= bins) idx = bins - 1;
    if (idx < 0) idx = 0;
    counts[idx]++;
  }

  const total = samples.length;
  return counts.map((count, i) => ({
    range: `${(minT + i * binSize).toFixed(2)}-${(minT + (i + 1) * binSize).toFixed(2)}mm`,
    count,
    percentage: total > 0 ? (count / total) * 100 : 0,
  }));
}

export function getPlaneBounds(
  model: ModelData,
  axis: string
): { min: number; max: number } {
  const bb = model.boundingBox;
  switch (axis) {
    case 'x': return { min: bb.min.x, max: bb.max.x };
    case 'y': return { min: bb.min.y, max: bb.max.y };
    case 'z': return { min: bb.min.z, max: bb.max.z };
    default: return { min: bb.min.y, max: bb.max.y };
  }
}
