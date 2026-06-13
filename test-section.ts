import * as THREE from 'three';
import { computeSection, getPlaneBounds } from '../src/utils/section';
import { geometryToModelData } from '../src/utils/geometry';

function runTest() {
  console.log('=== 截面计算测试 ===\n');

  const boxGeo = new THREE.BoxGeometry(10, 10, 10);
  boxGeo.computeVertexNormals();
  const model = geometryToModelData(boxGeo, 'test-box');

  console.log('模型信息:');
  console.log('  顶点数:', model.vertexCount);
  console.log('  面数:', model.faceCount);
  console.log('  boundingBox:', JSON.stringify(model.boundingBox));
  console.log('');

  const testCases = [
    { axis: 'y' as const, position: 0, desc: 'Y轴中心' },
    { axis: 'y' as const, position: 2, desc: 'Y轴偏移+2' },
    { axis: 'x' as const, position: 0, desc: 'X轴中心' },
    { axis: 'z' as const, position: 0, desc: 'Z轴中心' },
  ];

  for (const tc of testCases) {
    console.log(`测试: ${tc.desc} (axis=${tc.axis}, position=${tc.position})`);

    const bounds = getPlaneBounds(model, tc.axis);
    console.log(`  平面范围: min=${bounds.min.toFixed(2)}, max=${bounds.max.toFixed(2)}`);

    const result = computeSection(
      model,
      { axis: tc.axis, position: tc.position, visible: true },
      50
    );

    console.log(`  轮廓数量: ${result.contourPoints.length}`);
    console.log(`  截面积: ${result.area.toFixed(4)}`);
    console.log(`  周长: ${result.perimeter.toFixed(4)}`);

    for (let i = 0; i < result.contourPoints.length; i++) {
      const contour = result.contourPoints[i];
      console.log(`  轮廓[${i}]: ${contour.length} 个点`);
      if (contour.length > 0) {
        console.log(`    第一个点: (${contour[0].x.toFixed(2)}, ${contour[0].y.toFixed(2)}, ${contour[0].z.toFixed(2)})`);
        if (contour.length > 1) {
          console.log(`    第二个点: (${contour[1].x.toFixed(2)}, ${contour[1].y.toFixed(2)}, ${contour[1].z.toFixed(2)})`);
        }
      }
    }

    const expectedArea = 10 * 10; // 10x10 正方形
    const expectedPerimeter = 10 * 4; // 10*4
    console.log(`  预期面积: ${expectedArea} (10x10正方形)`);
    console.log(`  预期周长: ${expectedPerimeter}`);
    console.log(`  面积误差: ${Math.abs(result.area - expectedArea).toFixed(4)}`);
    console.log(`  周长误差: ${Math.abs(result.perimeter - expectedPerimeter).toFixed(4)}`);
    console.log('');
  }

  console.log('=== 边界情况测试 ===\n');

  const edgeCases = [
    { axis: 'y' as const, position: 5, desc: 'Y轴顶部（正好在顶面）' },
    { axis: 'y' as const, position: -5, desc: 'Y轴底部（正好在底面）' },
    { axis: 'y' as const, position: 5.1, desc: 'Y轴顶部外侧' },
    { axis: 'y' as const, position: -5.1, desc: 'Y轴底部外侧' },
  ];

  for (const tc of edgeCases) {
    console.log(`测试: ${tc.desc} (axis=${tc.axis}, position=${tc.position})`);
    const result = computeSection(
      model,
      { axis: tc.axis, position: tc.position, visible: true },
      50
    );
    console.log(`  轮廓数量: ${result.contourPoints.length}`);
    console.log(`  截面积: ${result.area.toFixed(4)}`);
    console.log(`  周长: ${result.perimeter.toFixed(4)}`);
    console.log('');
  }

  console.log('=== 测试结束 ===');
}

runTest();
