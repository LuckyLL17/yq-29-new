import { useMemo } from 'react';
import * as THREE from 'three';
import type { SectionResult } from '@/types';

interface SectionContourProps {
  result: SectionResult | null;
}

const CLIP_OFFSET = 0.1;

export function SectionContour({ result }: SectionContourProps) {
  const lineObjects = useMemo(() => {
    if (!result || result.contourPoints.length === 0) return [];

    const objects: (THREE.Line | THREE.LineSegments)[] = [];
    const axis = result.plane.axis;

    for (const contour of result.contourPoints) {
      if (contour.length < 2) continue;

      const positions = new Float32Array((contour.length + 1) * 3);

      for (let i = 0; i < contour.length; i++) {
        positions[i * 3] = contour[i].x;
        positions[i * 3 + 1] = contour[i].y;
        positions[i * 3 + 2] = contour[i].z;

        switch (axis) {
          case 'x':
            positions[i * 3] += CLIP_OFFSET;
            break;
          case 'y':
            positions[i * 3 + 1] += CLIP_OFFSET;
            break;
          case 'z':
            positions[i * 3 + 2] += CLIP_OFFSET;
            break;
        }
      }

      positions[contour.length * 3] = positions[0];
      positions[contour.length * 3 + 1] = positions[1];
      positions[contour.length * 3 + 2] = positions[2];

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x00e5ff,
        transparent: true,
        opacity: 1,
        linewidth: 2,
        clippingPlanes: [],
      });
      const line = new THREE.Line(geometry, lineMaterial);
      line.renderOrder = 999;
      objects.push(line);
    }

    return objects;
  }, [result]);

  const capObjects = useMemo(() => {
    if (!result || result.contourPoints.length === 0) return null;

    const axis = result.plane.axis;
    const objects: THREE.Mesh[] = [];

    try {
      for (let ci = 0; ci < result.contourPoints.length; ci++) {
        const contour = result.contourPoints[ci];
        if (!contour || contour.length < 3) continue;

        const shape = new THREE.Shape();
        const points2D: { x: number; y: number }[] = [];

        for (let i = 0; i < contour.length; i++) {
          let px: number, py: number;
          switch (axis) {
            case 'x':
              px = contour[i].y;
              py = contour[i].z;
              break;
            case 'y':
              px = contour[i].x;
              py = contour[i].z;
              break;
            case 'z':
              px = contour[i].x;
              py = contour[i].y;
              break;
            default:
              px = contour[i].x;
              py = contour[i].z;
          }
          points2D.push({ x: px, y: py });
        }

        const signedArea = computeSignedArea(points2D);
        if (signedArea < 0) {
          points2D.reverse();
        }

        shape.moveTo(points2D[0].x, points2D[0].y);
        for (let i = 1; i < points2D.length; i++) {
          shape.lineTo(points2D[i].x, points2D[i].y);
        }
        shape.closePath();

        const geometry = new THREE.ShapeGeometry(shape);
        const posAttr = geometry.attributes.position;
        const positions = posAttr.array as Float32Array;

        const planePos = result.plane.position + CLIP_OFFSET;

        for (let i = 0; i < positions.length / 3; i++) {
          const sx = positions[i * 3];
          const sy = positions[i * 3 + 1];

          switch (axis) {
            case 'x':
              positions[i * 3] = planePos;
              positions[i * 3 + 1] = sx;
              positions[i * 3 + 2] = sy;
              break;
            case 'y':
              positions[i * 3] = sx;
              positions[i * 3 + 1] = planePos;
              positions[i * 3 + 2] = sy;
              break;
            case 'z':
              positions[i * 3] = sx;
              positions[i * 3 + 1] = sy;
              positions[i * 3 + 2] = planePos;
              break;
          }
        }

        geometry.computeVertexNormals();
        geometry.attributes.position.needsUpdate = true;

        const capMaterial = new THREE.MeshStandardMaterial({
          color: 0x7ec8e3,
          metalness: 0.1,
          roughness: 0.5,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9,
          clippingPlanes: [],
        });
        const capMesh = new THREE.Mesh(geometry, capMaterial);
        capMesh.renderOrder = 100;
        objects.push(capMesh);

        const edgeGeometry = new THREE.EdgesGeometry(geometry, 1);
        const edgeMaterial = new THREE.LineBasicMaterial({
          color: 0x00e5ff,
          transparent: true,
          opacity: 0.8,
          linewidth: 2,
          clippingPlanes: [],
        });
        const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
        edges.renderOrder = 998;
        objects.push(edges as any);
      }

      return objects.length > 0 ? objects : null;
    } catch (e) {
      return null;
    }
  }, [result]);

  if (!result) return null;

  return (
    <group>
      {capObjects && capObjects.map((obj, index) => (
        <primitive key={`cap-${index}`} object={obj} />
      ))}

      {lineObjects.map((obj, index) => (
        <primitive key={`line-${index}`} object={obj} />
      ))}
    </group>
  );
}

function computeSignedArea(points: { x: number; y: number }[]): number {
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    area += p1.x * p2.y - p2.x * p1.y;
  }
  return area / 2;
}
