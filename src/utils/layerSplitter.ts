import type {
  ModelData,
  ModelLayer,
  ModelLayerGeometry,
  LayerSplitStrategy,
  LayerSplitAxis,
  BoundingBox,
  Vector3,
} from '@/types';
import { computeFaceNormals } from './geometry';

const DEFAULT_PALETTE = [
  '#6b8e9e',
  '#e07a5f',
  '#81b29a',
  '#f2cc8f',
  '#3d405b',
  '#e07a9a',
  '#56a3a6',
  '#c8b6ff',
  '#f0a88a',
  '#45b7d1',
  '#96ceb4',
  '#ffeaa7',
];

function getAxisIndex(axis: LayerSplitAxis): number {
  switch (axis) {
    case 'x':
      return 0;
    case 'y':
      return 1;
    case 'z':
      return 2;
  }
}

function computeGeometryBounds(
  vertices: Float32Array,
  axis: LayerSplitAxis
): { min: number; max: number } {
  const idx = getAxisIndex(axis);
  let min = Infinity;
  let max = -Infinity;
  for (let i = idx; i < vertices.length; i += 3) {
    const v = vertices[i];
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return { min, max };
}

function computeFaceCentroid(
  vertices: Float32Array,
  i0: number,
  i1: number,
  i2: number
): Vector3 {
  return {
    x: (vertices[i0 * 3] + vertices[i1 * 3] + vertices[i2 * 3]) / 3,
    y: (vertices[i0 * 3 + 1] + vertices[i1 * 3 + 1] + vertices[i2 * 3 + 1]) / 3,
    z: (vertices[i0 * 3 + 2] + vertices[i1 * 3 + 2] + vertices[i2 * 3 + 2]) / 3,
  };
}

function computeBoundingBox(geometry: ModelLayerGeometry): BoundingBox {
  const vertices = geometry.vertices;
  let minX = Infinity,
    minY = Infinity,
    minZ = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity,
    maxZ = -Infinity;

  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i];
    const y = vertices[i + 1];
    const z = vertices[i + 2];
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (z < minZ) minZ = z;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
    if (z > maxZ) maxZ = z;
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

function buildGeometryFromFaces(
  originalVertices: Float32Array,
  originalNormals: Float32Array | null,
  faceIndices: number[],
  indices: Uint32Array | Uint16Array
): ModelLayerGeometry {
  const faceCount = faceIndices.length;
  const vertexCount = faceCount * 3;

  const newVertices = new Float32Array(vertexCount * 3);
  const newNormals = new Float32Array(vertexCount * 3);
  const newIndices = new Uint32Array(vertexCount);

  for (let f = 0; f < faceCount; f++) {
    const faceIdx = faceIndices[f];
    const i0 = indices[faceIdx * 3];
    const i1 = indices[faceIdx * 3 + 1];
    const i2 = indices[faceIdx * 3 + 2];

    const dstBase = f * 3;

    newVertices[dstBase * 3] = originalVertices[i0 * 3];
    newVertices[dstBase * 3 + 1] = originalVertices[i0 * 3 + 1];
    newVertices[dstBase * 3 + 2] = originalVertices[i0 * 3 + 2];

    newVertices[(dstBase + 1) * 3] = originalVertices[i1 * 3];
    newVertices[(dstBase + 1) * 3 + 1] = originalVertices[i1 * 3 + 1];
    newVertices[(dstBase + 1) * 3 + 2] = originalVertices[i1 * 3 + 2];

    newVertices[(dstBase + 2) * 3] = originalVertices[i2 * 3];
    newVertices[(dstBase + 2) * 3 + 1] = originalVertices[i2 * 3 + 1];
    newVertices[(dstBase + 2) * 3 + 2] = originalVertices[i2 * 3 + 2];

    if (originalNormals && originalNormals.length > 0) {
      newNormals[dstBase * 3] = originalNormals[i0 * 3];
      newNormals[dstBase * 3 + 1] = originalNormals[i0 * 3 + 1];
      newNormals[dstBase * 3 + 2] = originalNormals[i0 * 3 + 2];

      newNormals[(dstBase + 1) * 3] = originalNormals[i1 * 3];
      newNormals[(dstBase + 1) * 3 + 1] = originalNormals[i1 * 3 + 1];
      newNormals[(dstBase + 1) * 3 + 2] = originalNormals[i1 * 3 + 2];

      newNormals[(dstBase + 2) * 3] = originalNormals[i2 * 3];
      newNormals[(dstBase + 2) * 3 + 1] = originalNormals[i2 * 3 + 1];
      newNormals[(dstBase + 2) * 3 + 2] = originalNormals[i2 * 3 + 2];
    }

    newIndices[dstBase] = dstBase;
    newIndices[dstBase + 1] = dstBase + 1;
    newIndices[dstBase + 2] = dstBase + 2;
  }

  let computedNormals = newNormals;
  if (!originalNormals || originalNormals.length === 0) {
    computedNormals = computeVertexNormals(newVertices, newIndices, faceCount);
  }

  return {
    vertices: newVertices,
    indices: newIndices,
    normals: computedNormals,
    faceCount,
    vertexCount,
  };
}

function computeVertexNormals(
  vertices: Float32Array,
  indices: Uint32Array | Uint16Array,
  faceCount: number
): Float32Array {
  const vertexCount = vertices.length / 3;
  const normals = new Float32Array(vertexCount * 3);
  const faceNormalCount = new Uint32Array(vertexCount);

  for (let fi = 0; fi < faceCount; fi++) {
    const i0 = indices[fi * 3];
    const i1 = indices[fi * 3 + 1];
    const i2 = indices[fi * 3 + 2];

    const ax = vertices[i1 * 3] - vertices[i0 * 3];
    const ay = vertices[i1 * 3 + 1] - vertices[i0 * 3 + 1];
    const az = vertices[i1 * 3 + 2] - vertices[i0 * 3 + 2];

    const bx = vertices[i2 * 3] - vertices[i0 * 3];
    const by = vertices[i2 * 3 + 1] - vertices[i0 * 3 + 1];
    const bz = vertices[i2 * 3 + 2] - vertices[i0 * 3 + 2];

    const nx = ay * bz - az * by;
    const ny = az * bx - ax * bz;
    const nz = ax * by - ay * bx;

    const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
    const invLen = len > 0 ? 1 / len : 0;
    const fnx = nx * invLen;
    const fny = ny * invLen;
    const fnz = nz * invLen;

    normals[i0 * 3] += fnx;
    normals[i0 * 3 + 1] += fny;
    normals[i0 * 3 + 2] += fnz;
    faceNormalCount[i0]++;

    normals[i1 * 3] += fnx;
    normals[i1 * 3 + 1] += fny;
    normals[i1 * 3 + 2] += fnz;
    faceNormalCount[i1]++;

    normals[i2 * 3] += fnx;
    normals[i2 * 3 + 1] += fny;
    normals[i2 * 3 + 2] += fnz;
    faceNormalCount[i2]++;
  }

  for (let vi = 0; vi < vertexCount; vi++) {
    const count = faceNormalCount[vi];
    if (count > 0) {
      const invCount = 1 / count;
      const nx = normals[vi * 3] * invCount;
      const ny = normals[vi * 3 + 1] * invCount;
      const nz = normals[vi * 3 + 2] * invCount;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      const invLen = len > 0 ? 1 / len : 0;
      normals[vi * 3] = nx * invLen;
      normals[vi * 3 + 1] = ny * invLen;
      normals[vi * 3 + 2] = nz * invLen;
    }
  }

  return normals;
}

export function splitModelByAxis(
  model: ModelData,
  axis: LayerSplitAxis,
  count: number
): ModelLayer[] {
  if (count <= 0) {
    throw new Error('Layer count must be positive');
  }

  const bounds = computeGeometryBounds(model.vertices, axis);
  const range = bounds.max - bounds.min;
  if (range <= 0) {
    return [
      createSingleLayer(model, 0, '完整模型', DEFAULT_PALETTE[0]),
    ];
  }

  const layerSize = range / count;
  const axisIdx = getAxisIndex(axis);
  const totalFaceCount = model.faceCount;

  const layerFaces: number[][] = Array.from({ length: count }, () => []);

  const indices = model.indices;
  for (let fi = 0; fi < totalFaceCount; fi++) {
    const i0 = indices[fi * 3];
    const i1 = indices[fi * 3 + 1];
    const i2 = indices[fi * 3 + 2];
    const centroid = computeFaceCentroid(model.vertices, i0, i1, i2);
    const coords = [centroid.x, centroid.y, centroid.z];
    const v = coords[axisIdx];

    let layerIdx = Math.floor((v - bounds.min) / layerSize);
    if (layerIdx >= count) layerIdx = count - 1;
    if (layerIdx < 0) layerIdx = 0;

    layerFaces[layerIdx].push(fi);
  }

  const layers: ModelLayer[] = [];
  for (let i = 0; i < count; i++) {
    if (layerFaces[i].length === 0) continue;

    const geometry = buildGeometryFromFaces(
      model.vertices,
      model.normals,
      layerFaces[i],
      indices
    );
    const bbox = computeBoundingBox(geometry);

    layers.push({
      id: `layer_${Date.now()}_${i}`,
      name: generateLayerName(axis, i, count, bounds, layerSize),
      index: i,
      geometry,
      color: DEFAULT_PALETTE[i % DEFAULT_PALETTE.length],
      opacity: 1,
      visible: true,
      explosionOffset: { x: 0, y: 0, z: 0 },
      boundingBox: bbox,
    });
  }

  return layers;
}

export function splitModelByBoundaries(
  model: ModelData,
  axis: LayerSplitAxis,
  boundaries: number[]
): ModelLayer[] {
  const sortedBounds = [...boundaries].sort((a, b) => a - b);
  const bounds = computeGeometryBounds(model.vertices, axis);
  const fullBoundaries = [bounds.min - 0.001, ...sortedBounds, bounds.max + 0.001];

  const layerCount = fullBoundaries.length - 1;
  const axisIdx = getAxisIndex(axis);
  const layerFaces: number[][] = Array.from({ length: layerCount }, () => []);

  const indices = model.indices;
  for (let fi = 0; fi < model.faceCount; fi++) {
    const i0 = indices[fi * 3];
    const i1 = indices[fi * 3 + 1];
    const i2 = indices[fi * 3 + 2];
    const centroid = computeFaceCentroid(model.vertices, i0, i1, i2);
    const coords = [centroid.x, centroid.y, centroid.z];
    const v = coords[axisIdx];

    let layerIdx = 0;
    for (let j = 0; j < fullBoundaries.length - 1; j++) {
      if (v >= fullBoundaries[j] && v < fullBoundaries[j + 1]) {
        layerIdx = j;
        break;
      }
    }
    layerFaces[layerIdx].push(fi);
  }

  const layers: ModelLayer[] = [];
  for (let i = 0; i < layerCount; i++) {
    if (layerFaces[i].length === 0) continue;

    const geometry = buildGeometryFromFaces(
      model.vertices,
      model.normals,
      layerFaces[i],
      indices
    );
    const bbox = computeBoundingBox(geometry);

    layers.push({
      id: `layer_${Date.now()}_${i}`,
      name: `图层 ${i + 1} (${fullBoundaries[i].toFixed(1)} ~ ${fullBoundaries[i + 1].toFixed(1)} mm)`,
      index: i,
      geometry,
      color: DEFAULT_PALETTE[i % DEFAULT_PALETTE.length],
      opacity: 1,
      visible: true,
      explosionOffset: { x: 0, y: 0, z: 0 },
      boundingBox: bbox,
    });
  }

  return layers;
}

export function splitModel(
  model: ModelData,
  strategy: LayerSplitStrategy
): ModelLayer[] {
  if (strategy.type === 'axis') {
    return splitModelByAxis(model, strategy.axis, strategy.count);
  } else {
    return splitModelByBoundaries(model, strategy.axis, strategy.boundaries);
  }
}

function createSingleLayer(
  model: ModelData,
  index: number,
  name: string,
  color: string
): ModelLayer {
  const geometry: ModelLayerGeometry = {
    vertices: new Float32Array(model.vertices),
    indices: new Uint32Array(model.indices),
    normals: new Float32Array(model.normals),
    faceCount: model.faceCount,
    vertexCount: model.vertexCount,
  };

  return {
    id: `layer_${Date.now()}_${index}`,
    name,
    index,
    geometry,
    color,
    opacity: 1,
    visible: true,
    explosionOffset: { x: 0, y: 0, z: 0 },
    boundingBox: model.boundingBox,
  };
}

function generateLayerName(
  axis: LayerSplitAxis,
  index: number,
  count: number,
  bounds: { min: number; max: number },
  layerSize: number
): string {
  const start = bounds.min + index * layerSize;
  const end = bounds.min + (index + 1) * layerSize;
  const axisLabel = axis === 'x' ? 'X' : axis === 'y' ? 'Y' : 'Z';
  return `${axisLabel}层 ${index + 1}/${count} (${start.toFixed(1)}~${end.toFixed(1)}mm)`;
}
