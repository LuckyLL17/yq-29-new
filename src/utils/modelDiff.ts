import * as THREE from 'three';
import type { ModelData, ModelDiffResult } from '@/types';

function buildBVH(geometry: THREE.BufferGeometry) {
  const vertices = geometry.attributes.position.array as Float32Array;
  const indices = geometry.index?.array as Uint32Array | Uint16Array | undefined;
  
  const triangles: {
    minX: number; minY: number; minZ: number;
    maxX: number; maxY: number; maxZ: number;
    v0: THREE.Vector3; v1: THREE.Vector3; v2: THREE.Vector3;
  }[] = [];
  
  if (indices) {
    for (let i = 0; i < indices.length; i += 3) {
      const i0 = indices[i] * 3;
      const i1 = indices[i + 1] * 3;
      const i2 = indices[i + 2] * 3;
      
      const v0 = new THREE.Vector3(vertices[i0], vertices[i0 + 1], vertices[i0 + 2]);
      const v1 = new THREE.Vector3(vertices[i1], vertices[i1 + 1], vertices[i1 + 2]);
      const v2 = new THREE.Vector3(vertices[i2], vertices[i2 + 1], vertices[i2 + 2]);
      
      const minX = Math.min(v0.x, v1.x, v2.x);
      const minY = Math.min(v0.y, v1.y, v2.y);
      const minZ = Math.min(v0.z, v1.z, v2.z);
      const maxX = Math.max(v0.x, v1.x, v2.x);
      const maxY = Math.max(v0.y, v1.y, v2.y);
      const maxZ = Math.max(v0.z, v1.z, v2.z);
      
      triangles.push({ minX, minY, minZ, maxX, maxY, maxZ, v0, v1, v2 });
    }
  } else {
    for (let i = 0; i < vertices.length; i += 9) {
      const v0 = new THREE.Vector3(vertices[i], vertices[i + 1], vertices[i + 2]);
      const v1 = new THREE.Vector3(vertices[i + 3], vertices[i + 4], vertices[i + 5]);
      const v2 = new THREE.Vector3(vertices[i + 6], vertices[i + 7], vertices[i + 8]);
      
      const minX = Math.min(v0.x, v1.x, v2.x);
      const minY = Math.min(v0.y, v1.y, v2.y);
      const minZ = Math.min(v0.z, v1.z, v2.z);
      const maxX = Math.max(v0.x, v1.x, v2.x);
      const maxY = Math.max(v0.y, v1.y, v2.y);
      const maxZ = Math.max(v0.z, v1.z, v2.z);
      
      triangles.push({ minX, minY, minZ, maxX, maxY, maxZ, v0, v1, v2 });
    }
  }
  
  const centerX = triangles.reduce((sum, t) => sum + (t.minX + t.maxX) / 2, 0) / triangles.length;
  const centerY = triangles.reduce((sum, t) => sum + (t.minY + t.maxY) / 2, 0) / triangles.length;
  const centerZ = triangles.reduce((sum, t) => sum + (t.minZ + t.maxZ) / 2, 0) / triangles.length;
  
  const sortedX = [...triangles].sort((a, b) => (a.minX + a.maxX) / 2 - (b.minX + b.maxX) / 2);
  const sortedY = [...triangles].sort((a, b) => (a.minY + a.maxY) / 2 - (b.minY + b.maxY) / 2);
  const sortedZ = [...triangles].sort((a, b) => (a.minZ + a.maxZ) / 2 - (b.minZ + b.maxZ) / 2);
  
  return { triangles, sortedX, sortedY, sortedZ, centerX, centerY, centerZ };
}

function closestPointOnTriangle(point: THREE.Vector3, v0: THREE.Vector3, v1: THREE.Vector3, v2: THREE.Vector3): THREE.Vector3 {
  const edge0 = new THREE.Vector3().subVectors(v1, v0);
  const edge1 = new THREE.Vector3().subVectors(v2, v0);
  const v0p = new THREE.Vector3().subVectors(point, v0);
  
  const d00 = edge0.dot(edge0);
  const d01 = edge0.dot(edge1);
  const d11 = edge1.dot(edge1);
  const d20 = v0p.dot(edge0);
  const d21 = v0p.dot(edge1);
  
  const denom = d00 * d11 - d01 * d01;
  let s = (d01 * d21 - d11 * d20) / denom;
  let t = (d01 * d20 - d00 * d21) / denom;
  
  if (s < 0 || t < 0 || s + t > 1) {
    const edge0Len = edge0.length();
    const edge1Len = edge1.length();
    const edge2 = new THREE.Vector3().subVectors(v2, v1);
    const edge2Len = edge2.length();
    
    const proj0 = Math.max(0, Math.min(1, v0p.dot(edge0) / (edge0Len * edge0Len)));
    const proj1 = Math.max(0, Math.min(1, new THREE.Vector3().subVectors(point, v1).dot(edge2) / (edge2Len * edge2Len)));
    const proj2 = Math.max(0, Math.min(1, v0p.dot(edge1) / (edge1Len * edge1Len)));
    
    const p0 = new THREE.Vector3().copy(v0).add(edge0.multiplyScalar(proj0));
    const p1 = new THREE.Vector3().copy(v1).add(edge2.multiplyScalar(proj1));
    const p2 = new THREE.Vector3().copy(v0).add(edge1.multiplyScalar(proj2));
    
    const d0 = point.distanceTo(p0);
    const d1 = point.distanceTo(p1);
    const d2 = point.distanceTo(p2);
    
    if (d0 <= d1 && d0 <= d2) return p0;
    if (d1 <= d2) return p1;
    return p2;
  }
  
  return new THREE.Vector3().copy(v0).add(edge0.multiplyScalar(s)).add(edge1.multiplyScalar(t));
}

function pointToMeshDistance(point: THREE.Vector3, bvh: ReturnType<typeof buildBVH>): { distance: number; closestPoint: THREE.Vector3 } {
  let minDist = Infinity;
  let closestPoint = new THREE.Vector3();
  
  const triangles = bvh.triangles;
  
  for (let i = 0; i < triangles.length; i++) {
    const tri = triangles[i];
    
    if (point.x < tri.minX - minDist) continue;
    if (point.x > tri.maxX + minDist) continue;
    if (point.y < tri.minY - minDist) continue;
    if (point.y > tri.maxY + minDist) continue;
    if (point.z < tri.minZ - minDist) continue;
    if (point.z > tri.maxZ + minDist) continue;
    
    const closest = closestPointOnTriangle(point, tri.v0, tri.v1, tri.v2);
    const dist = point.distanceTo(closest);
    
    if (dist < minDist) {
      minDist = dist;
      closestPoint = closest;
    }
  }
  
  return { distance: minDist, closestPoint };
}

function computeSignedDistance(
  point: THREE.Vector3,
  closestPoint: THREE.Vector3,
  geometry: THREE.BufferGeometry
): number {
  const raycaster = new THREE.Raycaster();
  const direction = new THREE.Vector3(1, 0, 0);
  raycaster.set(point, direction);
  
  const mesh = new THREE.Mesh(geometry);
  const intersects = raycaster.intersectObject(mesh);
  
  const dist = point.distanceTo(closestPoint);
  
  if (intersects.length % 2 === 0) {
    return dist;
  } else {
    return -dist;
  }
}

export function computeModelDiff(
  model1: ModelData,
  model2: ModelData
): ModelDiffResult {
  const geo1 = new THREE.BufferGeometry();
  geo1.setAttribute('position', new THREE.BufferAttribute(model1.vertices, 3));
  geo1.setIndex(new THREE.BufferAttribute(model1.indices, 1));
  
  const geo2 = new THREE.BufferGeometry();
  geo2.setAttribute('position', new THREE.BufferAttribute(model2.vertices, 3));
  geo2.setIndex(new THREE.BufferAttribute(model2.indices, 1));
  
  const bvh2 = buildBVH(geo2);
  
  const vertexCount = model1.vertexCount;
  const vertexDistances = new Float32Array(vertexCount);
  
  let minDistance = Infinity;
  let maxDistance = -Infinity;
  let sumDistance = 0;
  let positiveCount = 0;
  let negativeCount = 0;
  let zeroCount = 0;
  
  for (let i = 0; i < vertexCount; i++) {
    const x = model1.vertices[i * 3];
    const y = model1.vertices[i * 3 + 1];
    const z = model1.vertices[i * 3 + 2];
    
    const point = new THREE.Vector3(x, y, z);
    const { distance, closestPoint } = pointToMeshDistance(point, bvh2);
    
    const signedDist = computeSignedDistance(point, closestPoint, geo2);
    vertexDistances[i] = signedDist;
    
    if (signedDist > 0.001) {
      positiveCount++;
    } else if (signedDist < -0.001) {
      negativeCount++;
    } else {
      zeroCount++;
    }
    
    if (signedDist < minDistance) minDistance = signedDist;
    if (signedDist > maxDistance) maxDistance = signedDist;
    sumDistance += Math.abs(signedDist);
  }
  
  const avgDistance = sumDistance / vertexCount;
  
  const distanceDistribution = computeDistanceDistribution(vertexDistances, minDistance, maxDistance);
  
  return {
    vertexDistances,
    minDistance,
    maxDistance,
    avgDistance,
    positiveCount,
    negativeCount,
    zeroCount,
    distanceDistribution,
  };
}

function computeDistanceDistribution(
  distances: Float32Array,
  minDist: number,
  maxDist: number
): { range: string; count: number; percentage: number }[] {
  const bins = 10;
  const range = maxDist - minDist;
  const binSize = range / bins;
  
  const counts = new Array(bins).fill(0);
  
  for (let i = 0; i < distances.length; i++) {
    let binIndex = Math.floor((distances[i] - minDist) / binSize);
    if (binIndex >= bins) binIndex = bins - 1;
    if (binIndex < 0) binIndex = 0;
    counts[binIndex]++;
  }
  
  const distribution: { range: string; count: number; percentage: number }[] = [];
  for (let i = 0; i < bins; i++) {
    const binMin = minDist + i * binSize;
    const binMax = minDist + (i + 1) * binSize;
    distribution.push({
      range: `${binMin.toFixed(2)} ~ ${binMax.toFixed(2)}`,
      count: counts[i],
      percentage: (counts[i] / distances.length) * 100,
    });
  }
  
  return distribution;
}

export function createDiffVertexColors(
  model: ModelData,
  diffResult: ModelDiffResult
): Float32Array {
  const colors = new Float32Array(model.vertexCount * 3);
  
  const { vertexDistances, minDistance, maxDistance } = diffResult;
  
  const maxAbsDist = Math.max(Math.abs(minDistance), Math.abs(maxDistance));
  
  for (let i = 0; i < model.vertexCount; i++) {
    const distance = vertexDistances[i];
    const normalized = distance / maxAbsDist;
    
    let r, g, b;
    
    if (distance > 0.001) {
      const t = Math.min(1, distance / maxAbsDist);
      r = t;
      g = 0.2 + 0.3 * (1 - t);
      b = 0.2;
    } else if (distance < -0.001) {
      const t = Math.min(1, Math.abs(distance) / maxAbsDist);
      r = 0.2;
      g = 0.3 + 0.3 * (1 - t);
      b = t;
    } else {
      r = 0.5;
      g = 0.5;
      b = 0.5;
    }
    
    colors[i * 3] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;
  }
  
  return colors;
}
