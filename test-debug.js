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

function computeSectionDebug(vertices, indices, axis, planePos) {
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
  
  console.log('\n  === 相交面详情 ===');
  for (const fi of faceIntersections) {
    console.log(`  面${fi.faceIndex}: edge0=${fi.edge0}, edge1=${fi.edge1}`);
    console.log(`    point0: (${fi.point0.x.toFixed(2)}, ${fi.point0.y.toFixed(2)}, ${fi.point0.z.toFixed(2)})`);
    console.log(`    point1: (${fi.point1.x.toFixed(2)}, ${fi.point1.y.toFixed(2)}, ${fi.point1.z.toFixed(2)})`);
  }
  
  console.log('\n  === 边详情 ===');
  for (const [ek, faces] of edgeToFaces) {
    const pt = edgeToPoint.get(ek);
    console.log(`  边${ek}: 属于${faces.length}个面 [${faces.join(', ')}], 点=(${pt.x.toFixed(2)}, ${pt.y.toFixed(2)}, ${pt.z.toFixed(2)})`);
  }

  const faceMap = new Map();
  for (const fi of faceIntersections) faceMap.set(fi.faceIndex, fi);

  const usedFaces = new Set();
  const usedEdges = new Set();
  const contours = [];

  console.log('\n  === 轮廓构建过程 ===');
  
  for (let startIdx = 0; startIdx < faceIntersections.length; startIdx++) {
    const startFace = faceIntersections[startIdx];
    if (usedFaces.has(startFace.faceIndex)) continue;

    console.log(`\n  从面${startFace.faceIndex}开始构建轮廓`);

    const contour = [];
    let currentFace = startFace;
    let entryEdge = startFace.edge0;
    let exitEdge = startFace.edge1;
    const startEdge = entryEdge;

    console.log(`    startEdge=${startEdge}, entryEdge=${entryEdge}, exitEdge=${exitEdge}`);

    let safety = 0;
    const maxIter = faceIntersections.length * 3 + 100;

    while (safety < maxIter) {
      safety++;

      if (usedFaces.has(currentFace.faceIndex)) {
        console.log(`    面${currentFace.faceIndex}已使用，断开`);
        break;
      }
      usedFaces.add(currentFace.faceIndex);
      usedEdges.add(entryEdge);
      usedEdges.add(exitEdge);

      const pt = edgeToPoint.get(entryEdge);
      if (pt) {
        contour.push({ x: pt.x, y: pt.y, z: pt.z });
        console.log(`    步骤${safety}: 面${currentFace.faceIndex}, 添加点(${pt.x.toFixed(2)}, ${pt.y.toFixed(2)}, ${pt.z.toFixed(2)}) (edge=${entryEdge})`);
      }

      const neighborFaces = edgeToFaces.get(exitEdge) || [];
      let nextFaceIdx = -1;

      for (const fIdx of neighborFaces) {
        if (fIdx !== currentFace.faceIndex && !usedFaces.has(fIdx) && faceMap.has(fIdx)) {
          nextFaceIdx = fIdx;
          break;
        }
      }

      if (nextFaceIdx === -1) {
        console.log(`    通过exitEdge=${exitEdge}未找到下一个面，neighbors=[${neighborFaces.join(', ')}]`);
        break;
      }

      const nextFace = faceMap.get(nextFaceIdx);
      const nextEntry = nextFace.edge0 === exitEdge ? nextFace.edge0 : nextFace.edge1;
      const nextExit = nextFace.edge0 === exitEdge ? nextFace.edge1 : nextFace.edge0;

      console.log(`    下一个面: ${nextFaceIdx}, nextEntry=${nextEntry}, nextExit=${nextExit}`);

      if (exitEdge === startEdge || nextEntry === startEdge) {
        console.log(`    检测到闭合 (exitEdge=${exitEdge}, startEdge=${startEdge})`);
        break;
      }

      currentFace = nextFace;
      entryEdge = nextEntry;
      exitEdge = nextExit;
    }

    console.log(`    轮廓点数: ${contour.length}`);
    if (contour.length >= 3) {
      contours.push(contour);
      console.log(`    轮廓有效，已添加`);
    }
  }

  console.log(`\n  最终轮廓数量: ${contours.length}`);
  for (let i = 0; i < contours.length; i++) {
    console.log(`  轮廓[${i}]: ${contours[i].length} 个点`);
    for (let j = 0; j < contours[i].length; j++) {
      const p = contours[i][j];
      console.log(`    [${j}]: (${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)})`);
    }
  }

  return contours;
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

console.log('=== 调试测试 ===\n');

const { vertices, indices } = createCubeGeometry(10);

console.log('立方体: 边长 10，中心在原点');
console.log('顶点坐标:');
for (let i = 0; i < vertices.length / 3; i++) {
  console.log(`  [${i}]: (${vertices[i*3]}, ${vertices[i*3+1]}, ${vertices[i*3+2]})`);
}
console.log('');

console.log('测试: Y轴中心 (axis=y, position=0)');
const contours = computeSectionDebug(vertices, indices, 'y', 0);

console.log('\n=== 测试结束 ===');
