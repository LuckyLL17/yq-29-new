const EPS = 1e-6;
const POINT_KEY_EPS = 1e-4;

function pointKey(p) {
  return `${p.x.toFixed(4)},${p.y.toFixed(4)},${p.z.toFixed(4)}`;
}

function getCoord(v, axis) {
  switch (axis) {
    case 'x': return v.x;
    case 'y': return v.y;
    case 'z': return v.z;
    default: return v.y;
  }
}

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function computeSection(vertices, indices, axis, planePos) {
  const faceCount = indices.length / 3;
  const segments = [];
  
  const pointToSegments = new Map();
  
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

    const addCrossing = (va, vb, da, db, onA, onB) => {
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

    const unique = [];
    const seen = new Set();
    for (const p of crossings) {
      const key = pointKey(p);
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(p);
      }
    }

    if (unique.length >= 2) {
      const seg = {
        faceIndex: i,
        p0: unique[0],
        p1: unique[1],
        key0: pointKey(unique[0]),
        key1: pointKey(unique[1]),
      };
      segments.push(seg);
      
      if (!pointToSegments.has(seg.key0)) pointToSegments.set(seg.key0, []);
      pointToSegments.get(seg.key0).push(seg);
      
      if (!pointToSegments.has(seg.key1)) pointToSegments.set(seg.key1, []);
      pointToSegments.get(seg.key1).push(seg);
    }
  }

  console.log(`  相交线段数量: ${segments.length}`);
  console.log(`  唯一交点数量: ${pointToSegments.size}`);

  const usedSegments = new Set();
  const contours = [];

  for (let i = 0; i < segments.length; i++) {
    if (usedSegments.has(i)) continue;

    const contour = [];
    const startSeg = segments[i];
    let currentSeg = startSeg;
    let currentPointKey = startSeg.key0;
    let otherPointKey = startSeg.key1;
    
    const startPointKey = currentPointKey;

    let safety = 0;
    const maxIter = segments.length * 2 + 100;

    while (safety < maxIter) {
      safety++;
      
      if (usedSegments.has(currentSeg.faceIndex)) {
        break;
      }
      usedSegments.add(currentSeg.faceIndex);

      const pt = currentPointKey === currentSeg.key0 ? currentSeg.p0 : currentSeg.p1;
      contour.push({ x: pt.x, y: pt.y, z: pt.z });

      const nextSegs = pointToSegments.get(otherPointKey) || [];
      let nextSeg = null;
      
      for (const s of nextSegs) {
        if (s.faceIndex !== currentSeg.faceIndex && !usedSegments.has(s.faceIndex)) {
          nextSeg = s;
          break;
        }
      }

      if (!nextSeg) {
        break;
      }

      const nextCurrentKey = otherPointKey;
      const nextOtherKey = nextSeg.key0 === otherPointKey ? nextSeg.key1 : nextSeg.key0;

      if (nextOtherKey === startPointKey || nextCurrentKey === startPointKey) {
        const lastPt = nextCurrentKey === nextSeg.key0 ? nextSeg.p0 : nextSeg.p1;
        contour.push({ x: lastPt.x, y: lastPt.y, z: lastPt.z });
        usedSegments.add(nextSeg.faceIndex);
        break;
      }

      currentSeg = nextSeg;
      currentPointKey = nextCurrentKey;
      otherPointKey = nextOtherKey;
    }

    if (contour.length >= 3) {
      contours.push(contour);
    }
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

console.log('=== 新算法测试 ===\n');

const { vertices, indices } = createCubeGeometry(10);

console.log('立方体: 边长 10，中心在原点');
console.log(`顶点数: ${vertices.length / 3}`);
console.log(`面数: ${indices.length / 3}`);
console.log('');

const testCases = [
  { axis: 'y', position: 0, desc: 'Y轴中心', expectedArea: 100, expectedPerim: 40 },
  { axis: 'y', position: 2, desc: 'Y轴偏移+2', expectedArea: 100, expectedPerim: 40 },
  { axis: 'x', position: 0, desc: 'X轴中心', expectedArea: 100, expectedPerim: 40 },
  { axis: 'z', position: 0, desc: 'Z轴中心', expectedArea: 100, expectedPerim: 40 },
];

for (const tc of testCases) {
  console.log(`测试: ${tc.desc} (axis=${tc.axis}, position=${tc.position})`);
  const contours = computeSection(vertices, indices, tc.axis, tc.position);
  const area = computeArea(contours, tc.axis);
  const perimeter = computePerimeter(contours);
  console.log(`  轮廓数量: ${contours.length}`);
  console.log(`  截面积: ${area.toFixed(4)} (预期: ${tc.expectedArea})`);
  console.log(`  周长: ${perimeter.toFixed(4)} (预期: ${tc.expectedPerim})`);
  console.log(`  面积误差: ${Math.abs(area - tc.expectedArea).toFixed(6)}`);
  console.log(`  周长误差: ${Math.abs(perimeter - tc.expectedPerim).toFixed(6)}`);
  
  if (contours.length > 0) {
    console.log(`  轮廓[0]点数: ${contours[0].length}`);
    for (let i = 0; i < Math.min(contours[0].length, 6); i++) {
      const p = contours[0][i];
      console.log(`    [${i}]: (${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)})`);
    }
  }
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
  const contours = computeSection(vertices, indices, tc.axis, tc.position);
  const area = computeArea(contours, tc.axis);
  const perimeter = computePerimeter(contours);
  console.log(`  轮廓数量: ${contours.length}`);
  console.log(`  截面积: ${area.toFixed(4)}`);
  console.log(`  周长: ${perimeter.toFixed(4)}`);
  console.log('');
}

console.log('=== 测试结束 ===');
