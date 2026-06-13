import type { ModelData, DrainHoleResult, DrainHole, Vector3, RectangleArrayParams, CircleArrayParams, CollisionCheckResult } from '@/types';
import { getFaceCentroid, computeFaceNormals, distance, normalize, cross, dot, add, scale, subtract } from './geometry';

export function estimateSurfaceArea(model: ModelData): number {
  const { vertices, indices } = model;
  const faceCount = indices.length / 3;
  let totalArea = 0;

  for (let i = 0; i < faceCount; i++) {
    const i0 = indices[i * 3];
    const i1 = indices[i * 3 + 1];
    const i2 = indices[i * 3 + 2];

    const v0 = { x: vertices[i0 * 3], y: vertices[i0 * 3 + 1], z: vertices[i0 * 3 + 2] };
    const v1 = { x: vertices[i1 * 3], y: vertices[i1 * 3 + 1], z: vertices[i1 * 3 + 2] };
    const v2 = { x: vertices[i2 * 3], y: vertices[i2 * 3 + 1], z: vertices[i2 * 3 + 2] };

    const e1 = {
      x: v1.x - v0.x,
      y: v1.y - v0.y,
      z: v1.z - v0.z,
    };
    const e2 = {
      x: v2.x - v0.x,
      y: v2.y - v0.y,
      z: v2.z - v0.z,
    };

    const crossX = e1.y * e2.z - e1.z * e2.y;
    const crossY = e1.z * e2.x - e1.x * e2.z;
    const crossZ = e1.x * e2.y - e1.y * e2.x;
    const area = 0.5 * Math.sqrt(crossX * crossX + crossY * crossY + crossZ * crossZ);

    totalArea += area;
  }

  return totalArea;
}

export function planDrainHoles(
  model: ModelData,
  holeDiameter: number = 2,
  holeSpacing: number = 15,
  holeDepth: number = 5
): DrainHoleResult {
  const { vertices, indices, boundingBox } = model;
  const faceCount = indices.length / 3;
  const faceNormals = computeFaceNormals(vertices, indices);

  const holes: DrainHole[] = [];
  const candidateFaces: { index: number; centroid: Vector3; normal: Vector3; priority: number }[] = [];

  const bottomY = boundingBox.min.y;
  const topY = boundingBox.max.y;
  const heightRange = topY - bottomY;

  for (let i = 0; i < faceCount; i++) {
    const centroid = getFaceCentroid(vertices, indices, i);
    const normal = {
      x: faceNormals[i * 3],
      y: faceNormals[i * 3 + 1],
      z: faceNormals[i * 3 + 2],
    };

    let priority = 0;
    const normalizedY = (centroid.y - bottomY) / heightRange;
    priority += normalizedY * 0.5;

    const normalY = Math.abs(normal.y);
    priority += (1 - normalY) * 0.3;

    if (normal.y < -0.3) {
      priority += 0.4;
    }

    candidateFaces.push({ index: i, centroid, normal, priority });
  }

  candidateFaces.sort((a, b) => b.priority - a.priority);

  let holeId = 0;
  for (const candidate of candidateFaces) {
    let tooClose = false;

    for (const hole of holes) {
      const dist = distance(candidate.centroid, hole.position);
      if (dist < holeSpacing) {
        tooClose = true;
        break;
      }
    }

    if (!tooClose && candidate.normal.y > -0.2) {
      const holeType = candidate.priority > 0.6 ? 'suction' : 'dewatering';
      const adjustedDiameter = holeType === 'suction' ? holeDiameter * 1.2 : holeDiameter;

      holes.push({
        id: `hole-${holeId++}`,
        position: { ...candidate.centroid },
        normal: normalize(candidate.normal),
        diameter: adjustedDiameter,
        type: holeType,
        depth: holeDepth,
      });
    }

    if (holes.length >= 200) break;
  }

  const suctionCount = holes.filter((h) => h.type === 'suction').length;
  const dewateringCount = holes.filter((h) => h.type === 'dewatering').length;

  const totalArea = holes.reduce((sum, hole) => {
    const radius = hole.diameter / 2;
    return sum + Math.PI * radius * radius;
  }, 0);

  const modelSurfaceArea = estimateSurfaceArea(model);
  const recommendedDensity = (totalArea / modelSurfaceArea) * 100;

  return {
    holes,
    totalCount: holes.length,
    totalArea,
    suctionCount,
    dewateringCount,
    recommendedDensity,
  };
}

export function checkHoleCollision(
  hole: Partial<DrainHole> & { position: Vector3; diameter: number; id?: string },
  existingHoles: DrainHole[],
  minSpacing: number
): CollisionCheckResult {
  const collidingHoles: string[] = [];
  let minDist = Infinity;

  for (const existing of existingHoles) {
    if (hole.id && existing.id === hole.id) continue;
    const dist = distance(hole.position, existing.position);
    const minDistRequired = (hole.diameter + existing.diameter) / 2 + minSpacing;
    if (dist < minDistRequired) {
      collidingHoles.push(existing.id);
    }
    if (dist < minDist) {
      minDist = dist;
    }
  }

  return {
    hasCollision: collidingHoles.length > 0,
    collidingHoles,
    minDistance: minDist === Infinity ? 0 : minDist,
  };
}

export function autoAvoidCollision(
  hole: Partial<DrainHole> & { position: Vector3; normal: Vector3; diameter: number; id?: string },
  existingHoles: DrainHole[],
  minSpacing: number,
  maxAttempts: number = 20
): DrainHole | null {
  const otherHoles = hole.id
    ? existingHoles.filter((h) => h.id !== hole.id)
    : existingHoles;
  let result = { ...hole } as DrainHole;
  if (!result.id) {
    result.id = `temp-${Date.now()}`;
  }
  if (!result.type) {
    result.type = 'dewatering';
  }
  if (!result.depth) {
    result.depth = 5;
  }
  const collision = checkHoleCollision(result, otherHoles, minSpacing);

  if (!collision.hasCollision) return result;

  const n = normalize(hole.normal);
  const up = { x: 0, y: 1, z: 0 };
  let tangentX: Vector3;
  let tangentY: Vector3;

  if (Math.abs(dot(n, up)) > 0.9) {
    tangentX = normalize(cross({ x: 1, y: 0, z: 0 }, n));
  } else {
    tangentX = normalize(cross(up, n));
  }
  tangentY = normalize(cross(n, tangentX));

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const angle = (attempt * Math.PI * (1 + Math.sqrt(5))) / 2;
    const radius = (hole.diameter + minSpacing) * attempt * 0.3;

    const offset = add(
      scale(tangentX, Math.cos(angle) * radius),
      scale(tangentY, Math.sin(angle) * radius)
    );

    const newPosition = add(hole.position, offset);
    const movedHole = { ...result, position: newPosition };
    const newCollision = checkHoleCollision(movedHole, otherHoles, minSpacing);

    if (!newCollision.hasCollision) {
      return movedHole;
    }
  }

  return null;
}

function generateRectangleArrayCommon(params: RectangleArrayParams): DrainHole[] {
  const holes: DrainHole[] = [];
  const { center, normal, xCount, yCount, xSpacing, ySpacing, diameter, depth, holeType } = params;

  const n = normalize(normal);
  const up = { x: 0, y: 1, z: 0 };
  let tangentX: Vector3;
  let tangentY: Vector3;

  if (Math.abs(dot(n, up)) > 0.9) {
    tangentX = normalize(cross({ x: 1, y: 0, z: 0 }, n));
  } else {
    tangentX = normalize(cross(up, n));
  }
  tangentY = normalize(cross(n, tangentX));

  const startX = -((xCount - 1) * xSpacing) / 2;
  const startY = -((yCount - 1) * ySpacing) / 2;

  let idCounter = 0;
  for (let i = 0; i < xCount; i++) {
    for (let j = 0; j < yCount; j++) {
      const xOffset = startX + i * xSpacing;
      const yOffset = startY + j * ySpacing;

      const position = add(
        center,
        add(scale(tangentX, xOffset), scale(tangentY, yOffset))
      );

      holes.push({
        id: `array-rect-${Date.now()}-${idCounter++}`,
        position,
        normal: { ...n },
        diameter,
        type: holeType,
        depth,
      });
    }
  }

  return holes;
}

export function generateRectangleArray(params: RectangleArrayParams): DrainHole[] {
  return generateRectangleArrayCommon(params);
}

export function generateCircleArray(params: CircleArrayParams): DrainHole[] {
  const holes: DrainHole[] = [];
  const { center, normal, radius, count, diameter, depth, holeType } = params;

  const n = normalize(normal);
  const up = { x: 0, y: 1, z: 0 };
  let tangentX: Vector3;
  let tangentY: Vector3;

  if (Math.abs(dot(n, up)) > 0.9) {
    tangentX = normalize(cross({ x: 1, y: 0, z: 0 }, n));
  } else {
    tangentX = normalize(cross(up, n));
  }
  tangentY = normalize(cross(n, tangentX));

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const position = add(
      center,
      add(
        scale(tangentX, Math.cos(angle) * radius),
        scale(tangentY, Math.sin(angle) * radius)
      )
    );

    holes.push({
      id: `array-circle-${Date.now()}-${i}`,
      position,
      normal: { ...n },
      diameter,
      type: holeType,
      depth,
    });
  }

  return holes;
}

export function exportToDXF(holes: DrainHole[]): string {
  let dxf = '0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1009\n';
  dxf += '9\n$INSBASE\n10\n0.0\n20\n0.0\n30\n0.0\n';
  dxf += '9\n$EXTMIN\n10\n0.0\n20\n0.0\n30\n0.0\n';
  dxf += '9\n$EXTMAX\n10\n1000.0\n20\n1000.0\n30\n1000.0\n';
  dxf += '0\nENDSEC\n';
  dxf += '0\nSECTION\n2\nTABLES\n';
  dxf += '0\nTABLE\n2\nLTYPE\n70\n1\n';
  dxf += '0\nLTYPE\n2\nCONTINUOUS\n70\n0\n3\nSolid line\n72\n65\n73\n0\n40\n0.0\n';
  dxf += '0\nENDTAB\n';
  dxf += '0\nTABLE\n2\nLAYER\n70\n3\n';
  dxf += '0\nLAYER\n2\nDRAIN_HOLES\n70\n0\n62\n3\n6\nCONTINUOUS\n';
  dxf += '0\nLAYER\n2\nSUCTION_HOLES\n70\n0\n62\n1\n6\nCONTINUOUS\n';
  dxf += '0\nLAYER\n2\nDEWATERING_HOLES\n70\n0\n62\n4\n6\nCONTINUOUS\n';
  dxf += '0\nENDTAB\n';
  dxf += '0\nTABLE\n2\nSTYLE\n70\n0\n';
  dxf += '0\nENDTAB\n';
  dxf += '0\nENDSEC\n';
  dxf += '0\nSECTION\n2\nBLOCKS\n';
  dxf += '0\nBLOCK\n2\n*Model_Space\n70\n0\n10\n0.0\n20\n0.0\n30\n0.0\n';
  dxf += '0\nENDBLK\n';
  dxf += '0\nBLOCK\n2\n*Paper_Space\n70\n0\n10\n0.0\n20\n0.0\n30\n0.0\n';
  dxf += '0\nENDBLK\n';
  dxf += '0\nENDSEC\n';
  dxf += '0\nSECTION\n2\nENTITIES\n';

  holes.forEach((hole, index) => {
    const layer = hole.type === 'suction' ? 'SUCTION_HOLES' : 'DEWATERING_HOLES';
    dxf += '0\nCIRCLE\n';
    dxf += `8\n${layer}\n`;
    dxf += `10\n${hole.position.x.toFixed(6)}\n`;
    dxf += `20\n${hole.position.z.toFixed(6)}\n`;
    dxf += `30\n${hole.position.y.toFixed(6)}\n`;
    dxf += `40\n${(hole.diameter / 2).toFixed(6)}\n`;
    dxf += `62\n${hole.type === 'suction' ? '1' : '4'}\n`;

    dxf += '0\nTEXT\n';
    dxf += `8\nDRAIN_HOLES\n`;
    dxf += `10\n${(hole.position.x + hole.diameter / 2 + 1).toFixed(6)}\n`;
    dxf += `20\n${hole.position.z.toFixed(6)}\n`;
    dxf += `30\n${hole.position.y.toFixed(6)}\n`;
    dxf += `40\n1.5\n`;
    dxf += `1\n${index + 1}\n`;
  });

  dxf += '0\nENDSEC\n';
  dxf += '0\nEOF\n';

  return dxf;
}

export function exportToCoordinates(holes: DrainHole[]): string {
  let content = '# 滤水孔坐标列表\n';
  content += `# 生成时间: ${new Date().toLocaleString()}\n`;
  content += `# 总孔数: ${holes.length}\n`;
  content += `# 吸水孔: ${holes.filter(h => h.type === 'suction').length}\n`;
  content += `# 脱水孔: ${holes.filter(h => h.type === 'dewatering').length}\n`;
  content += '#\n';
  content += '# 格式: 编号, 类型, X(mm), Y(mm), Z(mm), 直径(mm), 深度(mm), 法向X, 法向Y, 法向Z\n';
  content += '#\n';

  holes.forEach((hole, index) => {
    const typeStr = hole.type === 'suction' ? '吸水孔' : '脱水孔';
    content += `${index + 1},${typeStr},`;
    content += `${hole.position.x.toFixed(4)},${hole.position.y.toFixed(4)},${hole.position.z.toFixed(4)},`;
    content += `${hole.diameter.toFixed(4)},${hole.depth.toFixed(4)},`;
    content += `${hole.normal.x.toFixed(6)},${hole.normal.y.toFixed(6)},${hole.normal.z.toFixed(6)}\n`;
  });

  return content;
}

export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function generateSampleModel(): {
  vertices: Float32Array;
  indices: Uint32Array;
} {
  const vertices: number[] = [];
  const indices: number[] = [];

  const width = 100;
  const depth = 80;
  const height = 50;
  const thickness = 2;

  const bottomVerts = [
    [-width / 2, 0, -depth / 2],
    [width / 2, 0, -depth / 2],
    [width / 2, 0, depth / 2],
    [-width / 2, 0, depth / 2],
  ];

  const topVerts = [
    [-width / 2 + thickness, height, -depth / 2 + thickness],
    [width / 2 - thickness, height, -depth / 2 + thickness],
    [width / 2 - thickness, height, depth / 2 - thickness],
    [-width / 2 + thickness, height, depth / 2 - thickness],
  ];

  const midVerts = [
    [-width / 2, height * 0.7, -depth / 2],
    [width / 2, height * 0.7, -depth / 2],
    [width / 2, height * 0.7, depth / 2],
    [-width / 2, height * 0.7, depth / 2],
  ];

  const baseVertexCount = vertices.length / 3;
  for (const v of bottomVerts) {
    vertices.push(v[0], v[1], v[2]);
  }
  for (const v of midVerts) {
    vertices.push(v[0], v[1], v[2]);
  }
  for (const v of topVerts) {
    vertices.push(v[0], v[1], v[2]);
  }

  for (let i = 0; i < 4; i++) {
    const next = (i + 1) % 4;
    indices.push(
      baseVertexCount + i,
      baseVertexCount + next,
      baseVertexCount + 4 + i
    );
    indices.push(
      baseVertexCount + next,
      baseVertexCount + 4 + next,
      baseVertexCount + 4 + i
    );
  }

  for (let i = 0; i < 4; i++) {
    const next = (i + 1) % 4;
    indices.push(
      baseVertexCount + 4 + i,
      baseVertexCount + 4 + next,
      baseVertexCount + 8 + i
    );
    indices.push(
      baseVertexCount + 4 + next,
      baseVertexCount + 8 + next,
      baseVertexCount + 8 + i
    );
  }

  indices.push(
    baseVertexCount + 8,
    baseVertexCount + 9,
    baseVertexCount + 10
  );
  indices.push(
    baseVertexCount + 8,
    baseVertexCount + 10,
    baseVertexCount + 11
  );

  indices.push(
    baseVertexCount,
    baseVertexCount + 3,
    baseVertexCount + 2
  );
  indices.push(
    baseVertexCount,
    baseVertexCount + 2,
    baseVertexCount + 1
  );

  return {
    vertices: new Float32Array(vertices),
    indices: new Uint32Array(indices),
  };
}
