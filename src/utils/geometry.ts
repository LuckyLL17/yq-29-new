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
  const v0 = { x: vertices[i0 * 3], y: vertices[i0 * 3 + 1], z: vertices[i0 * 3 + 2] };
  const v1 = { x: vertices[i1 * 3], y: vertices[i1 * 3 + 1], z: vertices[i1 * 3 + 2] };
  const v2 = { x: vertices[i2 * 3], y: vertices[i2 * 3 + 1], z: vertices[i2 * 3 + 2] };

  const e1 = subtract(v1, v0);
  const e2 = subtract(v2, v0);
  const n = cross(e1, e2);
  return normalize(n);
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

export function buildBVH(
  vertices: Float32Array,
  indices: Uint32Array | Uint16Array
): {
  triangles: { v0: Vector3; v1: Vector3; v2: Vector3; normal: Vector3 }[];
} {
  const faceCount = indices.length / 3;
  const triangles = [];

  for (let i = 0; i < faceCount; i++) {
    const i0 = indices[i * 3];
    const i1 = indices[i * 3 + 1];
    const i2 = indices[i * 3 + 2];
    const v0 = { x: vertices[i0 * 3], y: vertices[i0 * 3 + 1], z: vertices[i0 * 3 + 2] };
    const v1 = { x: vertices[i1 * 3], y: vertices[i1 * 3 + 1], z: vertices[i1 * 3 + 2] };
    const v2 = { x: vertices[i2 * 3], y: vertices[i2 * 3 + 1], z: vertices[i2 * 3 + 2] };
    const normal = computeFaceNormal(vertices, i0, i1, i2);
    triangles.push({ v0, v1, v2, normal });
  }

  return { triangles };
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
