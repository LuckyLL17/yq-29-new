import * as THREE from 'three';
import type { Vector3, BoundingBox, ModelData } from '@/types';

export function vec3ToThree(v: Vector3): THREE.Vector3 {
  return new THREE.Vector3(v.x, v.y, v.z);
}

export function threeToVec3(v: THREE.Vector3): Vector3 {
  return { x: v.x, y: v.y, z: v.z };
}

export function normalize(v: Vector3): Vector3 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  if (len === 0) return { x: 0, y: 0, z: 0 };
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

export function dot(a: Vector3, b: Vector3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function cross(a: Vector3, b: Vector3): Vector3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

export function subtract(a: Vector3, b: Vector3): Vector3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function add(a: Vector3, b: Vector3): Vector3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function scale(v: Vector3, s: number): Vector3 {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

export function length(v: Vector3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

export function distance(a: Vector3, b: Vector3): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function distanceSq(a: Vector3, b: Vector3): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return dx * dx + dy * dy + dz * dz;
}

export function angleBetween(a: Vector3, b: Vector3): number {
  const dotProduct = dot(a, b);
  const lenA = length(a);
  const lenB = length(b);
  if (lenA === 0 || lenB === 0) return 0;
  const cos = Math.max(-1, Math.min(1, dotProduct / (lenA * lenB)));
  return (Math.acos(cos) * 180) / Math.PI;
}

export function computeBoundingBox(
  vertices: Float32Array
): BoundingBox {
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i];
    const y = vertices[i + 1];
    const z = vertices[i + 2];
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    minZ = Math.min(minZ, z);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    maxZ = Math.max(maxZ, z);
  }

  return {
    min: { x: minX, y: minY, z: minZ },
    max: { x: maxX, y: maxY, z: maxZ },
    center: {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
      z: (minZ + maxZ) / 2,
    },
    size: {
      x: maxX - minX,
      y: maxY - minY,
      z: maxZ - minZ,
    },
  };
}

export function computeFaceNormal(
  vertices: Float32Array,
  i0: number,
  i1: number,
  i2: number
): Vector3 {
  const v0x = vertices[i0 * 3], v0y = vertices[i0 * 3 + 1], v0z = vertices[i0 * 3 + 2];
  const v1x = vertices[i1 * 3], v1y = vertices[i1 * 3 + 1], v1z = vertices[i1 * 3 + 2];
  const v2x = vertices[i2 * 3], v2y = vertices[i2 * 3 + 1], v2z = vertices[i2 * 3 + 2];

  const e1x = v1x - v0x, e1y = v1y - v0y, e1z = v1z - v0z;
  const e2x = v2x - v0x, e2y = v2y - v0y, e2z = v2z - v0z;

  const nx = e1y * e2z - e1z * e2y;
  const ny = e1z * e2x - e1x * e2z;
  const nz = e1x * e2y - e1y * e2x;

  const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
  if (len === 0) return { x: 0, y: 0, z: 0 };
  return { x: nx / len, y: ny / len, z: nz / len };
}

export function computeFaceNormals(
  vertices: Float32Array,
  indices: Uint32Array | Uint16Array
): Float32Array {
  const faceCount = indices.length / 3;
  const normals = new Float32Array(faceCount * 3);

  for (let i = 0; i < faceCount; i++) {
    const i0 = indices[i * 3];
    const i1 = indices[i * 3 + 1];
    const i2 = indices[i * 3 + 2];
    const n = computeFaceNormal(vertices, i0, i1, i2);
    normals[i * 3] = n.x;
    normals[i * 3 + 1] = n.y;
    normals[i * 3 + 2] = n.z;
  }

  return normals;
}

export function getFaceCentroid(
  vertices: Float32Array,
  indices: Uint32Array | Uint16Array,
  faceIndex: number
): Vector3 {
  const i0 = indices[faceIndex * 3];
  const i1 = indices[faceIndex * 3 + 1];
  const i2 = indices[faceIndex * 3 + 2];

  return {
    x: (vertices[i0 * 3] + vertices[i1 * 3] + vertices[i2 * 3]) / 3,
    y: (vertices[i0 * 3 + 1] + vertices[i1 * 3 + 1] + vertices[i2 * 3 + 1]) / 3,
    z: (vertices[i0 * 3 + 2] + vertices[i1 * 3 + 2] + vertices[i2 * 3 + 2]) / 3,
  };
}

interface Triangle {
  v0: Vector3;
  v1: Vector3;
  v2: Vector3;
  normal: Vector3;
  centroid: Vector3;
  minX: number; minY: number; minZ: number;
  maxX: number; maxY: number; maxZ: number;
}

interface BVHNode {
  minX: number; minY: number; minZ: number;
  maxX: number; maxY: number; maxZ: number;
  left?: BVHNode;
  right?: BVHNode;
  triangles?: Triangle[];
  triCount: number;
}

function computeTriangles(
  vertices: Float32Array,
  indices: Uint32Array | Uint16Array
): Triangle[] {
  const faceCount = indices.length / 3;
  const triangles: Triangle[] = new Array(faceCount);

  for (let i = 0; i < faceCount; i++) {
    const i0 = indices[i * 3];
    const i1 = indices[i * 3 + 1];
    const i2 = indices[i * 3 + 2];

    const v0 = { x: vertices[i0 * 3], y: vertices[i0 * 3 + 1], z: vertices[i0 * 3 + 2] };
    const v1 = { x: vertices[i1 * 3], y: vertices[i1 * 3 + 1], z: vertices[i1 * 3 + 2] };
    const v2 = { x: vertices[i2 * 3], y: vertices[i2 * 3 + 1], z: vertices[i2 * 3 + 2] };

    const minX = Math.min(v0.x, v1.x, v2.x);
    const minY = Math.min(v0.y, v1.y, v2.y);
    const minZ = Math.min(v0.z, v1.z, v2.z);
    const maxX = Math.max(v0.x, v1.x, v2.x);
    const maxY = Math.max(v0.y, v1.y, v2.y);
    const maxZ = Math.max(v0.z, v1.z, v2.z);

    const e1x = v1.x - v0.x, e1y = v1.y - v0.y, e1z = v1.z - v0.z;
    const e2x = v2.x - v0.x, e2y = v2.y - v0.y, e2z = v2.z - v0.z;
    const nx = e1y * e2z - e1z * e2y;
    const ny = e1z * e2x - e1x * e2z;
    const nz = e1x * e2y - e1y * e2x;
    const nlen = Math.sqrt(nx * nx + ny * ny + nz * nz);
    const normal = nlen > 0
      ? { x: nx / nlen, y: ny / nlen, z: nz / nlen }
      : { x: 0, y: 0, z: 0 };

    const centroid = {
      x: (v0.x + v1.x + v2.x) / 3,
      y: (v0.y + v1.y + v2.y) / 3,
      z: (v0.z + v1.z + v2.z) / 3,
    };

    triangles[i] = { v0, v1, v2, normal, centroid, minX, minY, minZ, maxX, maxY, maxZ };
  }

  return triangles;
}

function computeNodeBounds(triangles: Triangle[]): { minX: number; minY: number; minZ: number; maxX: number; maxY: number; maxZ: number } {
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (const t of triangles) {
    if (t.minX < minX) minX = t.minX;
    if (t.minY < minY) minY = t.minY;
    if (t.minZ < minZ) minZ = t.minZ;
    if (t.maxX > maxX) maxX = t.maxX;
    if (t.maxY > maxY) maxY = t.maxY;
    if (t.maxZ > maxZ) maxZ = t.maxZ;
  }

  return { minX, minY, minZ, maxX, maxY, maxZ };
}

function surfaceArea(minX: number, minY: number, minZ: number, maxX: number, maxY: number, maxZ: number): number {
  const dx = maxX - minX;
  const dy = maxY - minY;
  const dz = maxZ - minZ;
  return 2 * (dx * dy + dy * dz + dz * dx);
}

function buildBVHNode(triangles: Triangle[], depth: number = 0, maxDepth: number = 32, minLeafSize: number = 4): BVHNode {
  const bounds = computeNodeBounds(triangles);
  const triCount = triangles.length;

  if (triCount <= minLeafSize || depth >= maxDepth) {
    return {
      ...bounds,
      triangles,
      triCount,
    };
  }

  const dx = bounds.maxX - bounds.minX;
  const dy = bounds.maxY - bounds.minY;
  const dz = bounds.maxZ - bounds.minZ;

  let axis: 'x' | 'y' | 'z';
  if (dx >= dy && dx >= dz) axis = 'x';
  else if (dy >= dx && dy >= dz) axis = 'y';
  else axis = 'z';

  const sahX = evaluateSAH(triangles, 'x', bounds);
  const sahY = evaluateSAH(triangles, 'y', bounds);
  const sahZ = evaluateSAH(triangles, 'z', bounds);

  let bestSAH = sahX;
  axis = 'x';
  if (sahY < bestSAH) { bestSAH = sahY; axis = 'y'; }
  if (sahZ < bestSAH) { bestSAH = sahZ; axis = 'z'; }

  const parentSA = surfaceArea(bounds.minX, bounds.minY, bounds.minZ, bounds.maxX, bounds.maxY, bounds.maxZ);
  const noSplitCost = triCount * parentSA;

  if (bestSAH >= noSplitCost) {
    return { ...bounds, triangles, triCount };
  }

  const sorted = [...triangles].sort((a, b) => {
    const av = a.centroid[axis];
    const bv = b.centroid[axis];
    return av - bv;
  });

  const mid = Math.floor(sorted.length / 2);
  const leftTris = sorted.slice(0, mid);
  const rightTris = sorted.slice(mid);

  const left = buildBVHNode(leftTris, depth + 1, maxDepth, minLeafSize);
  const right = buildBVHNode(rightTris, depth + 1, maxDepth, minLeafSize);

  return {
    ...bounds,
    left,
    right,
    triCount,
  };
}

function evaluateSAH(triangles: Triangle[], axis: 'x' | 'y' | 'z', bounds: { minX: number; minY: number; minZ: number; maxX: number; maxY: number; maxZ: number }): number {
  const sorted = [...triangles].sort((a, b) => a.centroid[axis] - b.centroid[axis]);
  const n = sorted.length;

  const leftAreas = new Float64Array(n + 1);
  const rightAreas = new Float64Array(n + 1);
  const leftCounts = new Uint32Array(n + 1);
  const rightCounts = new Uint32Array(n + 1);

  let lminX = Infinity, lminY = Infinity, lminZ = Infinity;
  let lmaxX = -Infinity, lmaxY = -Infinity, lmaxZ = -Infinity;
  for (let i = 0; i < n; i++) {
    const t = sorted[i];
    lminX = Math.min(lminX, t.minX);
    lminY = Math.min(lminY, t.minY);
    lminZ = Math.min(lminZ, t.minZ);
    lmaxX = Math.max(lmaxX, t.maxX);
    lmaxY = Math.max(lmaxY, t.maxY);
    lmaxZ = Math.max(lmaxZ, t.maxZ);
    leftAreas[i + 1] = surfaceArea(lminX, lminY, lminZ, lmaxX, lmaxY, lmaxZ);
    leftCounts[i + 1] = i + 1;
  }

  let rminX = Infinity, rminY = Infinity, rminZ = Infinity;
  let rmaxX = -Infinity, rmaxY = -Infinity, rmaxZ = -Infinity;
  for (let i = n - 1; i >= 0; i--) {
    const t = sorted[i];
    rminX = Math.min(rminX, t.minX);
    rminY = Math.min(rminY, t.minY);
    rminZ = Math.min(rminZ, t.minZ);
    rmaxX = Math.max(rmaxX, t.maxX);
    rmaxY = Math.max(rmaxY, t.maxY);
    rmaxZ = Math.max(rmaxZ, t.maxZ);
    rightAreas[i] = surfaceArea(rminX, rminY, rminZ, rmaxX, rmaxY, rmaxZ);
    rightCounts[i] = n - i;
  }

  let bestCost = Infinity;
  for (let i = 1; i < n; i++) {
    const cost = leftCounts[i] * leftAreas[i] + rightCounts[i] * rightAreas[i];
    if (cost < bestCost) bestCost = cost;
  }

  return bestCost;
}

export interface BVH {
  root: BVHNode;
  triangles: Triangle[];
}

export function buildBVH(
  vertices: Float32Array,
  indices: Uint32Array | Uint16Array
): BVH {
  const triangles = computeTriangles(vertices, indices);
  const root = buildBVHNode(triangles, 0, 32, 4);
  return { root, triangles };
}

export function rayTriangleIntersect(
  origin: Vector3,
  direction: Vector3,
  v0: Vector3,
  v1: Vector3,
  v2: Vector3
): { hit: boolean; t: number; point: Vector3 } {
  const EPSILON = 1e-6;
  const edge1 = subtract(v1, v0);
  const edge2 = subtract(v2, v0);
  const h = cross(direction, edge2);
  const a = dot(edge1, h);

  if (Math.abs(a) < EPSILON) {
    return { hit: false, t: 0, point: { x: 0, y: 0, z: 0 } };
  }

  const f = 1 / a;
  const s = subtract(origin, v0);
  const u = f * dot(s, h);

  if (u < 0 || u > 1) {
    return { hit: false, t: 0, point: { x: 0, y: 0, z: 0 } };
  }

  const q = cross(s, edge1);
  const v = f * dot(direction, q);

  if (v < 0 || u + v > 1) {
    return { hit: false, t: 0, point: { x: 0, y: 0, z: 0 } };
  }

  const t = f * dot(edge2, q);

  if (t > EPSILON) {
    const point = add(origin, scale(direction, t));
    return { hit: true, t, point };
  }

  return { hit: false, t: 0, point: { x: 0, y: 0, z: 0 } };
}

function rayBoxIntersect(
  origin: Vector3,
  invDir: Vector3,
  minX: number, minY: number, minZ: number,
  maxX: number, maxY: number, maxZ: number
): { hit: boolean; tMin: number; tMax: number } {
  let tmin = (minX - origin.x) * invDir.x;
  let tmax = (maxX - origin.x) * invDir.x;
  if (tmin > tmax) { const tmp = tmin; tmin = tmax; tmax = tmp; }

  let tymin = (minY - origin.y) * invDir.y;
  let tymax = (maxY - origin.y) * invDir.y;
  if (tymin > tymax) { const tmp = tymin; tymin = tymax; tymax = tmp; }

  if (tmin > tymax || tymin > tmax) return { hit: false, tMin: 0, tMax: 0 };
  if (tymin > tmin) tmin = tymin;
  if (tymax < tmax) tmax = tymax;

  let tzmin = (minZ - origin.z) * invDir.z;
  let tzmax = (maxZ - origin.z) * invDir.z;
  if (tzmin > tzmax) { const tmp = tzmin; tzmin = tzmax; tzmax = tmp; }

  if (tmin > tzmax || tzmin > tmax) return { hit: false, tMin: 0, tMax: 0 };
  if (tzmin > tmin) tmin = tzmin;
  if (tzmax < tmax) tmax = tzmax;

  return { hit: true, tMin: tmin, tMax: tmax };
}

export function raycastBVH(
  origin: Vector3,
  direction: Vector3,
  bvh: BVH,
  maxDist: number = Infinity
): { hit: boolean; t: number; point: Vector3; triangle?: Triangle } {
  const invDir = {
    x: 1 / direction.x,
    y: 1 / direction.y,
    z: 1 / direction.z,
  };

  let closestT = maxDist;
  let closestPoint: Vector3 | null = null;
  let closestTri: Triangle | null = null;

  const stack: BVHNode[] = [bvh.root];

  while (stack.length > 0) {
    const node = stack.pop()!;

    const boxHit = rayBoxIntersect(origin, invDir, node.minX, node.minY, node.minZ, node.maxX, node.maxY, node.maxZ);
    if (!boxHit.hit || boxHit.tMin > closestT) {
      continue;
    }

    if (node.triangles) {
      for (const tri of node.triangles) {
        const result = rayTriangleIntersect(origin, direction, tri.v0, tri.v1, tri.v2);
        if (result.hit && result.t < closestT && result.t > 0.001) {
          closestT = result.t;
          closestPoint = result.point;
          closestTri = tri;
        }
      }
    } else {
      if (node.left && node.right) {
        const leftHit = rayBoxIntersect(origin, invDir, node.left.minX, node.left.minY, node.left.minZ, node.left.maxX, node.left.maxY, node.left.maxZ);
        const rightHit = rayBoxIntersect(origin, invDir, node.right.minX, node.right.minY, node.right.minZ, node.right.maxX, node.right.maxY, node.right.maxZ);

        if (leftHit.hit && rightHit.hit) {
          if (leftHit.tMin < rightHit.tMin) {
            stack.push(node.right);
            stack.push(node.left);
          } else {
            stack.push(node.left);
            stack.push(node.right);
          }
        } else if (leftHit.hit) {
          stack.push(node.left);
        } else if (rightHit.hit) {
          stack.push(node.right);
        }
      } else if (node.left) {
        stack.push(node.left);
      } else if (node.right) {
        stack.push(node.right);
      }
    }
  }

  if (closestPoint) {
    return { hit: true, t: closestT, point: closestPoint, triangle: closestTri || undefined };
  }

  return { hit: false, t: 0, point: { x: 0, y: 0, z: 0 } };
}

function closestPointOnTriangle(
  point: Vector3,
  v0: Vector3,
  v1: Vector3,
  v2: Vector3
): Vector3 {
  const edge0 = { x: v1.x - v0.x, y: v1.y - v0.y, z: v1.z - v0.z };
  const edge1 = { x: v2.x - v0.x, y: v2.y - v0.y, z: v2.z - v0.z };
  const v0p = { x: point.x - v0.x, y: point.y - v0.y, z: point.z - v0.z };

  const d00 = edge0.x * edge0.x + edge0.y * edge0.y + edge0.z * edge0.z;
  const d01 = edge0.x * edge1.x + edge0.y * edge1.y + edge0.z * edge1.z;
  const d11 = edge1.x * edge1.x + edge1.y * edge1.y + edge1.z * edge1.z;
  const d20 = v0p.x * edge0.x + v0p.y * edge0.y + v0p.z * edge0.z;
  const d21 = v0p.x * edge1.x + v0p.y * edge1.y + v0p.z * edge1.z;

  const denom = d00 * d11 - d01 * d01;
  let s = (d01 * d21 - d11 * d20) / denom;
  let t = (d01 * d20 - d00 * d21) / denom;

  if (s < 0 || t < 0 || s + t > 1) {
    const edge0LenSq = d00;
    const edge1LenSq = d11;
    const edge2 = { x: v2.x - v1.x, y: v2.y - v1.y, z: v2.z - v1.z };
    const edge2LenSq = edge2.x * edge2.x + edge2.y * edge2.y + edge2.z * edge2.z;

    const proj0 = Math.max(0, Math.min(1, d20 / edge0LenSq));
    const p0 = {
      x: v0.x + edge0.x * proj0,
      y: v0.y + edge0.y * proj0,
      z: v0.z + edge0.z * proj0,
    };
    const d0 = (point.x - p0.x) ** 2 + (point.y - p0.y) ** 2 + (point.z - p0.z) ** 2;

    const v1p = { x: point.x - v1.x, y: point.y - v1.y, z: point.z - v1.z };
    const proj1 = Math.max(0, Math.min(1, (v1p.x * edge2.x + v1p.y * edge2.y + v1p.z * edge2.z) / edge2LenSq));
    const p1 = {
      x: v1.x + edge2.x * proj1,
      y: v1.y + edge2.y * proj1,
      z: v1.z + edge2.z * proj1,
    };
    const d1 = (point.x - p1.x) ** 2 + (point.y - p1.y) ** 2 + (point.z - p1.z) ** 2;

    const proj2 = Math.max(0, Math.min(1, d21 / edge1LenSq));
    const p2 = {
      x: v0.x + edge1.x * proj2,
      y: v0.y + edge1.y * proj2,
      z: v0.z + edge1.z * proj2,
    };
    const d2 = (point.x - p2.x) ** 2 + (point.y - p2.y) ** 2 + (point.z - p2.z) ** 2;

    if (d0 <= d1 && d0 <= d2) return p0;
    if (d1 <= d2) return p1;
    return p2;
  }

  return {
    x: v0.x + edge0.x * s + edge1.x * t,
    y: v0.y + edge0.y * s + edge1.y * t,
    z: v0.z + edge0.z * s + edge1.z * t,
  };
}

function pointBoxDistanceSq(
  point: Vector3,
  minX: number, minY: number, minZ: number,
  maxX: number, maxY: number, maxZ: number
): number {
  let dx = 0, dy = 0, dz = 0;
  if (point.x < minX) dx = minX - point.x;
  else if (point.x > maxX) dx = point.x - maxX;
  if (point.y < minY) dy = minY - point.y;
  else if (point.y > maxY) dy = point.y - maxY;
  if (point.z < minZ) dz = minZ - point.z;
  else if (point.z > maxZ) dz = point.z - maxZ;
  return dx * dx + dy * dy + dz * dz;
}

export function closestPointBVH(
  point: Vector3,
  bvh: BVH
): { distance: number; closestPoint: Vector3; triangle?: Triangle } {
  let bestDistSq = Infinity;
  let bestPoint: Vector3 | null = null;
  let bestTri: Triangle | null = null;

  const stack: BVHNode[] = [bvh.root];

  while (stack.length > 0) {
    const node = stack.pop()!;

    const boxDistSq = pointBoxDistanceSq(point, node.minX, node.minY, node.minZ, node.maxX, node.maxY, node.maxZ);
    if (boxDistSq >= bestDistSq) {
      continue;
    }

    if (node.triangles) {
      for (const tri of node.triangles) {
        const cp = closestPointOnTriangle(point, tri.v0, tri.v1, tri.v2);
        const distSq = (point.x - cp.x) ** 2 + (point.y - cp.y) ** 2 + (point.z - cp.z) ** 2;
        if (distSq < bestDistSq) {
          bestDistSq = distSq;
          bestPoint = cp;
          bestTri = tri;
        }
      }
    } else {
      if (node.left && node.right) {
        const leftDist = pointBoxDistanceSq(point, node.left.minX, node.left.minY, node.left.minZ, node.left.maxX, node.left.maxY, node.left.maxZ);
        const rightDist = pointBoxDistanceSq(point, node.right.minX, node.right.minY, node.right.minZ, node.right.maxX, node.right.maxY, node.right.maxZ);

        if (leftDist < rightDist) {
          stack.push(node.right);
          stack.push(node.left);
        } else {
          stack.push(node.left);
          stack.push(node.right);
        }
      } else if (node.left) {
        stack.push(node.left);
      } else if (node.right) {
        stack.push(node.right);
      }
    }
  }

  return {
    distance: Math.sqrt(bestDistSq),
    closestPoint: bestPoint || { x: 0, y: 0, z: 0 },
    triangle: bestTri || undefined,
  };
}

export function geometryToModelData(
  geometry: THREE.BufferGeometry,
  name: string = 'model'
): ModelData {
  const positionAttr = geometry.attributes.position;
  const vertices = new Float32Array(positionAttr.array);

  let indices: Uint32Array | Uint16Array;
  if (geometry.index) {
    indices = new Uint32Array(geometry.index.array);
  } else {
    indices = new Uint32Array(vertices.length / 3);
    for (let i = 0; i < indices.length; i++) {
      indices[i] = i;
    }
  }

  const normals = computeFaceNormals(vertices, indices);
  const boundingBox = computeBoundingBox(vertices);

  geometry.computeVertexNormals();

  return {
    id: Math.random().toString(36).substr(2, 9),
    name,
    vertices,
    indices,
    normals,
    boundingBox,
    faceCount: indices.length / 3,
    vertexCount: vertices.length / 3,
  };
}
