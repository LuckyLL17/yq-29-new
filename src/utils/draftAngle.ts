import type { ModelData, DraftAngleResult, Vector3, UndercutRegion, RepairSuggestion } from '@/types';
import { normalize, dot, computeFaceNormals, getFaceCentroid, computeBoundingBox, distance, subtract, length } from './geometry';

export function analyzeDraftAngles(
  model: ModelData,
  draftDirection: Vector3,
  threshold: number
): DraftAngleResult {
  const { vertices, indices } = model;
  const faceCount = indices.length / 3;
  const faceAngles = new Float32Array(faceCount);

  const faceNormals = computeFaceNormals(vertices, indices);
  const draftDir = normalize(draftDirection);

  let minAngle = 90;
  let maxAngle = 0;
  let totalAngle = 0;
  let undercutCount = 0;
  const undercutFaceIndices: number[] = [];

  for (let i = 0; i < faceCount; i++) {
    const nx = faceNormals[i * 3];
    const ny = faceNormals[i * 3 + 1];
    const nz = faceNormals[i * 3 + 2];

    const dotProduct = nx * draftDir.x + ny * draftDir.y + nz * draftDir.z;
    const clampedDot = Math.max(-1, Math.min(1, dotProduct));
    let angle = (Math.acos(clampedDot) * 180) / Math.PI;

    angle = 90 - angle;
    if (angle < 0) angle = 0;

    faceAngles[i] = angle;

    if (angle < minAngle) minAngle = angle;
    if (angle > maxAngle) maxAngle = angle;
    totalAngle += angle;

    if (angle < threshold) {
      undercutCount++;
      undercutFaceIndices.push(i);
    }
  }

  const avgAngle = totalAngle / faceCount;
  const angleDistribution = computeAngleDistribution(faceAngles, threshold);
  
  const undercutRegions = findConnectedUndercutRegions(
    vertices,
    indices,
    faceAngles,
    undercutFaceIndices,
    threshold
  );

  const repairSuggestions = generateRepairSuggestions(undercutRegions, threshold);

  return {
    faceAngles,
    minAngle,
    maxAngle,
    avgAngle,
    undercutFaceCount: undercutCount,
    draftDirection: draftDir,
    threshold,
    angleDistribution,
    undercutRegions,
    repairSuggestions,
  };
}

function findConnectedUndercutRegions(
  vertices: Float32Array,
  indices: Uint32Array | Uint16Array,
  faceAngles: Float32Array,
  undercutFaceIndices: number[],
  threshold: number
): UndercutRegion[] {
  if (undercutFaceIndices.length === 0) return [];

  const faceCount = indices.length / 3;
  
  const vertexToFaces = new Map<number, number[]>();
  for (let i = 0; i < faceCount; i++) {
    const i0 = indices[i * 3];
    const i1 = indices[i * 3 + 1];
    const i2 = indices[i * 3 + 2];
    
    for (const vi of [i0, i1, i2]) {
      if (!vertexToFaces.has(vi)) {
        vertexToFaces.set(vi, []);
      }
      vertexToFaces.get(vi)!.push(i);
    }
  }

  const visited = new Set<number>();
  const regions: Omit<UndercutRegion, 'id'>[] = [];

  for (const startFace of undercutFaceIndices) {
    if (visited.has(startFace)) continue;

    const queue: number[] = [startFace];
    visited.add(startFace);
    const regionFaces: number[] = [];
    const regionVertices = new Set<number>();

    while (queue.length > 0) {
      const currentFace = queue.shift()!;
      regionFaces.push(currentFace);

      const i0 = indices[currentFace * 3];
      const i1 = indices[currentFace * 3 + 1];
      const i2 = indices[currentFace * 3 + 2];
      
      for (const vi of [i0, i1, i2]) {
        regionVertices.add(vi);
        const neighborFaces = vertexToFaces.get(vi) || [];
        for (const neighborFace of neighborFaces) {
          if (!visited.has(neighborFace) && faceAngles[neighborFace] < threshold) {
            visited.add(neighborFace);
            queue.push(neighborFace);
          }
        }
      }
    }

    const region = computeRegionMetrics(vertices, indices, faceAngles, regionFaces, regionVertices);
    regions.push(region);
  }

  regions.sort((a, b) => b.area - a.area);

  return regions.map((region, index) => ({
    ...region,
    id: `undercut_${index + 1}`,
  }));
}

function computeRegionMetrics(
  vertices: Float32Array,
  indices: Uint32Array | Uint16Array,
  faceAngles: Float32Array,
  faceIndices: number[],
  vertexIndices: Set<number>
): Omit<UndercutRegion, 'id'> {
  const regionVertices = new Float32Array(vertexIndices.size * 3);
  let idx = 0;
  for (const vi of vertexIndices) {
    regionVertices[idx * 3] = vertices[vi * 3];
    regionVertices[idx * 3 + 1] = vertices[vi * 3 + 1];
    regionVertices[idx * 3 + 2] = vertices[vi * 3 + 2];
    idx++;
  }
  const boundingBox = computeBoundingBox(regionVertices);

  let totalArea = 0;
  let minAngle = Infinity;
  let maxAngle = -Infinity;
  let totalAngle = 0;
  let centroidSum = { x: 0, y: 0, z: 0 };

  for (const faceIdx of faceIndices) {
    const angle = faceAngles[faceIdx];
    minAngle = Math.min(minAngle, angle);
    maxAngle = Math.max(maxAngle, angle);
    totalAngle += angle;

    const i0 = indices[faceIdx * 3];
    const i1 = indices[faceIdx * 3 + 1];
    const i2 = indices[faceIdx * 3 + 2];
    
    const v0 = { x: vertices[i0 * 3], y: vertices[i0 * 3 + 1], z: vertices[i0 * 3 + 2] };
    const v1 = { x: vertices[i1 * 3], y: vertices[i1 * 3 + 1], z: vertices[i1 * 3 + 2] };
    const v2 = { x: vertices[i2 * 3], y: vertices[i2 * 3 + 1], z: vertices[i2 * 3 + 2] };
    
    const e1 = subtract(v1, v0);
    const e2 = subtract(v2, v0);
    const cross = {
      x: e1.y * e2.z - e1.z * e2.y,
      y: e1.z * e2.x - e1.x * e2.z,
      z: e1.x * e2.y - e1.y * e2.x,
    };
    const faceArea = length(cross) / 2;
    totalArea += faceArea;

    const centroid = getFaceCentroid(vertices, indices, faceIdx);
    centroidSum.x += centroid.x * faceArea;
    centroidSum.y += centroid.y * faceArea;
    centroidSum.z += centroid.z * faceArea;
  }

  const centroid = {
    x: centroidSum.x / totalArea,
    y: centroidSum.y / totalArea,
    z: centroidSum.z / totalArea,
  };

  const width = boundingBox.size.x;
  const height = boundingBox.size.y;
  const depth = boundingBox.size.z;
  const maxExtent = Math.max(width, height, depth);

  const avgAngle = totalAngle / faceIndices.length;
  
  let severity: 'critical' | 'high' | 'medium' | 'low';
  if (avgAngle < 1) severity = 'critical';
  else if (avgAngle < 2) severity = 'high';
  else if (avgAngle < 3.5) severity = 'medium';
  else severity = 'low';

  return {
    faceIndices,
    vertexIndices,
    boundingBox,
    centroid,
    area: totalArea,
    minAngle,
    maxAngle,
    avgAngle,
    dimensions: { width, height, depth, maxExtent },
    severity,
  };
}

function generateRepairSuggestions(
  regions: UndercutRegion[],
  threshold: number
): RepairSuggestion[] {
  const suggestions: RepairSuggestion[] = [];
  let suggestionId = 0;

  for (const region of regions) {
    const targetAngle = threshold + 2;
    
    if (region.severity === 'critical' || region.severity === 'high') {
      suggestions.push({
        id: `suggestion_${++suggestionId}`,
        regionId: region.id,
        type: 'add_draft',
        title: '增加脱模斜度',
        description: `该区域平均脱模角仅为 ${region.avgAngle.toFixed(1)}°，严重影响脱模。建议在该区域的侧壁增加 ${targetAngle}° 的脱模斜度。`,
        estimatedImprovement: `脱模角可提升至约 ${targetAngle}°`,
        difficulty: region.area > 500 ? 'hard' : 'medium',
        targetAngle,
      });
    }

    if (region.dimensions.maxExtent > 30 && region.avgAngle < threshold) {
      suggestions.push({
        id: `suggestion_${++suggestionId}`,
        regionId: region.id,
        type: 'fillet',
        title: '增加圆角过渡',
        description: `该倒扣区域范围较大 (${region.dimensions.maxExtent.toFixed(1)}mm)，建议在转角处添加 R${Math.min(region.dimensions.maxExtent * 0.1, 5).toFixed(1)}mm 的圆角，减小应力集中同时改善脱模条件。`,
        estimatedImprovement: '脱模阻力降低约30%',
        difficulty: 'medium',
      });
    }

    if (region.severity === 'low' && region.area < 100) {
      suggestions.push({
        id: `suggestion_${++suggestionId}`,
        regionId: region.id,
        type: 'chamfer',
        title: '添加倒角',
        description: `该小区域 (${region.area.toFixed(1)}mm²) 脱模角略低于阈值，建议添加 ${Math.min(region.dimensions.maxExtent * 0.15, 3).toFixed(1)}mm 的45°倒角即可解决。`,
        estimatedImprovement: `可提供 ${threshold}° 有效脱模角`,
        difficulty: 'easy',
      });
    }

    if (region.severity === 'critical' && region.area > 1000) {
      suggestions.push({
        id: `suggestion_${++suggestionId}`,
        regionId: region.id,
        type: 'redesign',
        title: '重新设计该区域',
        description: `该大面积区域 (${region.area.toFixed(1)}mm²) 存在严重倒扣，建议重新评估产品结构设计，考虑调整分型面或优化产品形状。`,
        estimatedImprovement: '从根本上消除倒扣问题',
        difficulty: 'hard',
      });
    }

    if (region.dimensions.depth > 20 && region.severity !== 'low') {
      suggestions.push({
        id: `suggestion_${++suggestionId}`,
        regionId: region.id,
        type: 'split',
        title: '考虑滑块/抽芯结构',
        description: `该倒扣深度较大 (${region.dimensions.depth.toFixed(1)}mm)，如果无法修改产品形状，建议设计侧向滑块或抽芯机构来实现脱模。`,
        estimatedImprovement: '无需修改产品即可脱模',
        difficulty: 'hard',
      });
    }
  }

  return suggestions;
}

function computeAngleDistribution(
  faceAngles: Float32Array,
  threshold: number
): { range: string; count: number; percentage: number }[] {
  const ranges = [
    { min: 0, max: threshold, label: `< ${threshold}° (倒扣)` },
    { min: threshold, max: threshold + 2, label: `${threshold}-${threshold + 2}°` },
    { min: threshold + 2, max: threshold + 5, label: `${threshold + 2}-${threshold + 5}°` },
    { min: threshold + 5, max: threshold + 10, label: `${threshold + 5}-${threshold + 10}°` },
    { min: threshold + 10, max: 90, label: `> ${threshold + 10}°` },
  ];

  const counts = new Array(ranges.length).fill(0);
  const total = faceAngles.length;

  for (let i = 0; i < faceAngles.length; i++) {
    const angle = faceAngles[i];
    for (let j = 0; j < ranges.length; j++) {
      if (angle >= ranges[j].min && angle < ranges[j].max) {
        counts[j]++;
        break;
      }
    }
    if (angle >= ranges[ranges.length - 1].min) {
      counts[ranges.length - 1]++;
    }
  }

  return ranges.map((range, i) => ({
    range: range.label,
    count: counts[i],
    percentage: total > 0 ? (counts[i] / total) * 100 : 0,
  }));
}

export function getDraftAngleColor(
  angle: number,
  threshold: number
): { r: number; g: number; b: number } {
  if (angle < threshold) {
    const t = angle / threshold;
    return {
      r: 1,
      g: 0.3 + t * 0.3,
      b: 0.1,
    };
  }

  const maxAngle = 45;
  const normalizedAngle = Math.min((angle - threshold) / (maxAngle - threshold), 1);

  const hue = 120 + normalizedAngle * 60;
  return hslToRgb(hue / 360, 0.8, 0.5);
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

export function createDraftAngleVertexColors(
  model: ModelData,
  draftResult: DraftAngleResult
): Float32Array {
  const { vertices, indices } = model;
  const vertexCount = vertices.length / 3;
  const colors = new Float32Array(vertexCount * 3);
  const vertexAngleSum = new Float32Array(vertexCount);
  const vertexFaceCount = new Uint32Array(vertexCount);

  const faceCount = indices.length / 3;
  for (let i = 0; i < faceCount; i++) {
    const i0 = indices[i * 3];
    const i1 = indices[i * 3 + 1];
    const i2 = indices[i * 3 + 2];
    const angle = draftResult.faceAngles[i];

    vertexAngleSum[i0] += angle;
    vertexAngleSum[i1] += angle;
    vertexAngleSum[i2] += angle;
    vertexFaceCount[i0]++;
    vertexFaceCount[i1]++;
    vertexFaceCount[i2]++;
  }

  for (let i = 0; i < vertexCount; i++) {
    const avgAngle = vertexFaceCount[i] > 0 ? vertexAngleSum[i] / vertexFaceCount[i] : 0;
    const color = getDraftAngleColor(avgAngle, draftResult.threshold);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  return colors;
}

export function createUndercutRegionGeometry(
  vertices: Float32Array,
  indices: Uint32Array | Uint16Array,
  region: UndercutRegion
): { positions: Float32Array; normals: Float32Array } {
  const faceCount = region.faceIndices.length;
  const positions = new Float32Array(faceCount * 3 * 3);
  const normals = new Float32Array(faceCount * 3 * 3);

  for (let i = 0; i < faceCount; i++) {
    const faceIdx = region.faceIndices[i];
    const i0 = indices[faceIdx * 3];
    const i1 = indices[faceIdx * 3 + 1];
    const i2 = indices[faceIdx * 3 + 2];

    const v0 = { x: vertices[i0 * 3], y: vertices[i0 * 3 + 1], z: vertices[i0 * 3 + 2] };
    const v1 = { x: vertices[i1 * 3], y: vertices[i1 * 3 + 1], z: vertices[i1 * 3 + 2] };
    const v2 = { x: vertices[i2 * 3], y: vertices[i2 * 3 + 1], z: vertices[i2 * 3 + 2] };

    positions[i * 9] = v0.x;
    positions[i * 9 + 1] = v0.y;
    positions[i * 9 + 2] = v0.z;
    positions[i * 9 + 3] = v1.x;
    positions[i * 9 + 4] = v1.y;
    positions[i * 9 + 5] = v1.z;
    positions[i * 9 + 6] = v2.x;
    positions[i * 9 + 7] = v2.y;
    positions[i * 9 + 8] = v2.z;

    const e1 = subtract(v1, v0);
    const e2 = subtract(v2, v0);
    const normal = normalize({
      x: e1.y * e2.z - e1.z * e2.y,
      y: e1.z * e2.x - e1.x * e2.z,
      z: e1.x * e2.y - e1.y * e2.x,
    });

    for (let j = 0; j < 3; j++) {
      normals[i * 9 + j * 3] = normal.x;
      normals[i * 9 + j * 3 + 1] = normal.y;
      normals[i * 9 + j * 3 + 2] = normal.z;
    }
  }

  return { positions, normals };
}
