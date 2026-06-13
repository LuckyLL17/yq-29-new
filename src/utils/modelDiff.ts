import type { ModelData, ModelDiffResult, Vector3 } from '@/types';
import { buildBVH, closestPointBVH, raycastBVH } from './geometry';

export function computeModelDiff(
  model1: ModelData,
  model2: ModelData
): ModelDiffResult {
  const bvh2 = buildBVH(model2.vertices, model2.indices);

  const vertexCount = model1.vertexCount;
  const vertexDistances = new Float32Array(vertexCount);

  let minDistance = Infinity;
  let maxDistance = -Infinity;
  let sumDistance = 0;
  let positiveCount = 0;
  let negativeCount = 0;
  let zeroCount = 0;

  const rayDir: Vector3 = { x: 1, y: 0, z: 0 };

  for (let i = 0; i < vertexCount; i++) {
    const x = model1.vertices[i * 3];
    const y = model1.vertices[i * 3 + 1];
    const z = model1.vertices[i * 3 + 2];

    const point = { x, y, z };
    const { distance, closestPoint } = closestPointBVH(point, bvh2);

    const signedDist = computeSignedDistance(point, closestPoint, bvh2, rayDir);
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

function computeSignedDistance(
  point: Vector3,
  closestPoint: Vector3,
  bvh: ReturnType<typeof buildBVH>,
  rayDir: Vector3
): number {
  const rayOrigin = {
    x: point.x + rayDir.x * 0.001,
    y: point.y + rayDir.y * 0.001,
    z: point.z + rayDir.z * 0.001,
  };

  const result = raycastBVH(rayOrigin, rayDir, bvh);

  const dist = Math.sqrt(
    (point.x - closestPoint.x) ** 2 +
    (point.y - closestPoint.y) ** 2 +
    (point.z - closestPoint.z) ** 2
  );

  let hitCount = 0;
  if (result.hit) {
    hitCount = 1;
    let curPos = {
      x: result.point.x + rayDir.x * 0.001,
      y: result.point.y + rayDir.y * 0.001,
      z: result.point.z + rayDir.z * 0.001,
    };
    for (let i = 0; i < 50; i++) {
      const nextHit = raycastBVH(curPos, rayDir, bvh);
      if (!nextHit.hit) break;
      hitCount++;
      curPos = {
        x: nextHit.point.x + rayDir.x * 0.001,
        y: nextHit.point.y + rayDir.y * 0.001,
        z: nextHit.point.z + rayDir.z * 0.001,
      };
    }
  }

  if (hitCount % 2 === 0) {
    return dist;
  } else {
    return -dist;
  }
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
