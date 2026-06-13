const EPS = 1e-8;

function edgeKey(a, b) {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

function getCoord(v, axis) {
  switch (axis) {
    case 'x': return v.x;
    case 'y': return v.y;
    case 'z': return v.z;
    default: return v.y;
  }
}

function dedupePoints(arr) {
  const seen = new Set();
  const result = [];
  for (const item of arr) {
    const key = `${item.point.x.toFixed(6)},${item.point.y.toFixed(6)},${item.point.z.toFixed(6)}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}

function computeSectionSimple(vertices, indices, axis, planePos) {
  const faceCount = indices.length / 3;
  const edgeToFaces = new Map();
  const edgeToPoint = new Map();
  const faceIntersections = [];

  for (let i = 0; i < faceCount; i++) {
    const i0 = indices[i * 3];
    const i1 = indices[i * 3 + 1];
    const i2 = indices[i * 3 + 2];

    const v0 = { x: vertices[i0 * 3], y: vertices[i0 * 3 + 1], z: vertices[i0 * 3 + 2] };
    const v1 = { x: vertices[i1 * 3], y: vertices[i1 * 3 + 1], z: vertices[i1 * 3 + 2] };
    const v2 = { x: vertices[i2 * 3], y: vertices[i2 * 3 + 1], z: vertices[i2 * 3 + 2] };

    const d0 = getCoord(v0, axis) - planePos;
    const d1 = getCoord(v1, axis) - planePos;
    const d2 = getCoord(v2, axis) - planePos;

    const onPlane0 = Math.abs(d0) < EPS;
    const onPlane1 = Math.abs(d1) < EPS;
    const onPlane2 = Math.abs(d2) < EPS;
    const onPlaneCount = (onPlane0 ? 1 : 0) + (onPlane1 ? 1 : 0) + (onPlane2 ? 1 : 0);

    if (onPlaneCount === 3) continue;

    const crossings = [];

    const addCrossing = (va, vb, da, db, ea, eb, onA, onB) => {
      const ek = edgeKey(ea, eb);
      if (onA && onB) return;
      if (onA || onB) {
        const pt = onA ? { ...va } : { ...vb };
        if (!edgeToPoint.has(ek)) edgeToPoint.set(ek, pt);
        crossings.push({ edgeKey: ek, point: pt });
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
      if (!edgeToPoint.has(ek)) edgeToPoint.set(ek, pt);
      crossings.push({ edgeKey: ek, point: pt });
    };

    addCrossing(v0, v1, d0, d1, i0, i1, onPlane0, onPlane1);
    addCrossing(v1, v2, d1, d2, i1, i2, onPlane1, onPlane2);
    addCrossing(v2, v0, d2, d0, i2, i0, onPlane2, onPlane0);

    const unique = dedupePoints(crossings);

    if (unique.length >= 2) {
      const fi = {
        faceIndex: i,
        edge0: unique[0].edgeKey,
        edge1: unique[1].edgeKey,
        point0: unique[0].point,
        point1: unique[1].point,
      };
      faceIntersections.push(fi);
      for (const c of unique) {
        if (!edgeToFaces.has(c.edgeKey)) edgeToFaces.set(c.edgeKey, []);
        edgeToFaces.get(c.edgeKey).push(i);
      }
    }
  }

  console.log(`  相交面数量: ${faceIntersections.length}`);
  console.log(`  边数量: ${edgeToFaces.size}`);

  const faceMap = new Map();
  for (const fi of faceIntersections) faceMap.set(fi.faceIndex, fi);

  const usedFaces = new Set();
  const contours = [];

  for (const startFace of faceIntersections) {
    if (usedFaces.has(startFace.faceIndex)) continue;

    const contour = [];
    let currentFace = startFace;
    let entryEdge = startFace.edge0;
    let exitEdge = startFace.edge1;
    const startEdge = entryEdge;

    let safety = 0;
    const maxIter = faceIntersections.length * 3 + 100;

    while (safety < maxIter) {
      safety++;

      if (usedFaces.has(currentFace.faceIndex)) break;
      usedFaces.add(currentFace.faceIndex);

      const pt = edgeToPoint.get(entryEdge);
      if (pt) contour.push({ x: pt.x, y: pt.y, z: pt.z });

      const neighborFaces = edgeToFaces.get(exitEdge) || [];
      let nextFaceIdx = -1;

      for (const fIdx of neighborFaces) {
        if (fIdx !== currentFace.faceIndex && !usedFaces.has(fIdx) && faceMap.has(fIdx)) {
          nextFaceIdx = fIdx;
          break;
        }
      }

      if (nextFaceIdx === -1) break;

      const nextFace = faceMap.get(nextFaceIdx);
      const nextEntry = nextFace.edge0 === exitEdge ? nextFace.edge0 : nextFace.edge1;
      const nextExit = nextFace.edge0 === exitEdge ? nextFace.edge1 : nextFace.edge0;

      if (exitEdge === startEdge || nextEntry === startEdge) break;

      currentFace = nextFace;
      entryEdge = nextEntry;
      exitEdge = nextExit;
    }

    if (contour.length >= 3) contours.push(contour);
  }

  console.log(`  轮廓数量: ${contours.length}`);
  for (let i = 0; i < contours.length; i++) {
    console.log(`  轮廓[${i}]: ${contours[i].length} 个点`);
  }

  return contours;
}

function project2D(p, axis) {
  switch (axis) {
    case 'x': return { x: p.y, y: p.z };
    case 'y': return { x: p.x, y: p.z };
    case 'z': return { x: p.x, y: p.y };
    default: return { x: p.x, y: p.z };
  }
}

function computeArea(contours, axis) {
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

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function computePerimeter(contours) {
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

function createCubeGeometry(size) {
  const s = size / 2;
  const vertices = new Float32Array([
    -s, -s,  s,   s, -s,  s,   s,  s,  s,  -s,  s,  s,
    -s, -s, -s,  -s,  s, -s,   s,  s, -s,   s, -s, -s,
    -s,  s, -s,  -s,  s,  s,   s,  s,  s,   s,  s, -s,
    -s, -s, -s,   s, -s, -s,   s, -s,  s,  -s, -s,  s,
     s, -s, -s,   s,  s, -s,   s,  s,  s,   s, -s,  s,
    -s, -s, -s,  -s, -s,  s,  -s,  s,  s,  -s,  s, -s,
  ]);
  const indices = new Uint32Array([
     0, 1, 2,  0, 2, 3,
     4, 5, 6,  4, 6, 7,
     8, 9, 10,  8, 10, 11,
    12, 13, 14, 12, 14, 15,
    16, 17, 18, 16, 18, 19,
    20, 21, 22, 20, 22, 23,
  ]);
  return { vertices, indices };
}

console.log('=== 截面计算测试 ===\n');

const { vertices, indices } = createCubeGeometry(10);

console.log('立方体: 边长 10，中心在原点');
console.log(`顶点数: ${vertices.length / 3}`);
console.log(`面数: ${indices.length / 3}`);
console.log('');

const testCases = [
  { axis: 'y', position: 0, desc: 'Y轴中心' },
  { axis: 'y', position: 2, desc: 'Y轴偏移+2' },
  { axis: 'x', position: 0, desc: 'X轴中心' },
  { axis: 'z', position: 0, desc: 'Z轴中心' },
];

for (const tc of testCases) {
  console.log(`测试: ${tc.desc} (axis=${tc.axis}, position=${tc.position})`);
  const contours = computeSectionSimple(vertices, indices, tc.axis, tc.position);
  const area = computeArea(contours, tc.axis);
  const perimeter = computePerimeter(contours);
  console.log(`  截面积: ${area.toFixed(4)} (预期: 100)`);
  console.log(`  周长: ${perimeter.toFixed(4)} (预期: 40)`);
  console.log(`  面积误差: ${Math.abs(area - 100).toFixed(4)}`);
  console.log(`  周长误差: ${Math.abs(perimeter - 40).toFixed(4)}`);
  console.log('');
}

console.log('=== 边界情况测试 ===\n');

const edgeCases = [
  { axis: 'y', position: 5, desc: 'Y轴顶部（正好在顶面）' },
  { axis: 'y', position: -5, desc: 'Y轴底部（正好在底面）' },
  { axis: 'y', position: 5.1, desc: 'Y轴顶部外侧' },
  { axis: 'y', position: -5.1, desc: 'Y轴底部外侧' },
];

for (const tc of edgeCases) {
  console.log(`测试: ${tc.desc} (axis=${tc.axis}, position=${tc.position})`);
  const contours = computeSectionSimple(vertices, indices, tc.axis, tc.position);
  const area = computeArea(contours, tc.axis);
  const perimeter = computePerimeter(contours);
  console.log(`  轮廓数量: ${contours.length}`);
  console.log(`  截面积: ${area.toFixed(4)}`);
  console.log(`  周长: ${perimeter.toFixed(4)}`);
  console.log('');
}

console.log('=== 测试结束 ===');
