import { useMemo } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '@/store/useAppStore';
import type {
  Annotation,
  TextAnnotation,
  ArrowAnnotation,
  DimensionAnnotation,
  FreehandAnnotation,
} from '@/types';

function getCssFontStyle(fontFamily: string): string {
  switch (fontFamily) {
    case 'monospace':
      return "'SF Mono', 'Menlo', 'Consolas', 'Monaco', monospace";
    case 'serif':
      return "'Georgia', 'Times New Roman', 'SimSun', serif";
    default:
      return "'PingFang SC', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  }
}

function TextAnnotation3D({ annotation }: { annotation: TextAnnotation }) {
  const { position, text, style } = annotation;
  const isSelected = useAppStore(
    (s) => s.selectedAnnotationId === annotation.id
  );
  const isDarkMode = useAppStore((s) => s.isDarkMode);

  const pxFontSize = Math.max(style.fontSize * 5, 10);

  return (
    <group position={[position.x, position.y, position.z]}>
      <Html
        center
        distanceFactor={40}
        zIndexRange={[100, 0]}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        <div
          style={{
            fontFamily: getCssFontStyle(style.fontFamily),
            fontSize: `${pxFontSize}px`,
            fontWeight: 600,
            color: style.color,
            padding: '4px 10px',
            backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.9)',
            borderRadius: '6px',
            border: `2px solid ${isSelected ? '#ffffff' : style.color}`,
            boxShadow: isSelected
              ? `0 0 12px ${style.color}, 0 4px 12px rgba(0,0,0,0.5)`
              : '0 2px 8px rgba(0,0,0,0.4)',
            whiteSpace: 'nowrap',
            display: 'inline-block',
            transform: isSelected ? 'scale(1.1)' : 'scale(1)',
            transition: 'transform 0.15s ease',
          }}
        >
          {text}
        </div>
      </Html>
    </group>
  );
}

function ArrowAnnotation3D({ annotation }: { annotation: ArrowAnnotation }) {
  const { start, end, style } = annotation;
  const isSelected = useAppStore(
    (s) => s.selectedAnnotationId === annotation.id
  );

  const { lineGeometry, coneGeometry, conePosition, coneRotation, length } =
    useMemo(() => {
      const s = new THREE.Vector3(start.x, start.y, start.z);
      const e = new THREE.Vector3(end.x, end.y, end.z);
      const dir = new THREE.Vector3().subVectors(e, s);
      const len = dir.length();
      dir.normalize();

      const points = [s, e];
      const geo = new THREE.BufferGeometry().setFromPoints(points);

      const arrowTipLen = Math.min(Math.max(len * 0.05, style.lineWidth * 3), 5);
      const coneGeo = new THREE.ConeGeometry(
        Math.max(style.lineWidth * 0.8, 0.5),
        arrowTipLen,
        8
      );

      const coneTip = e.clone().sub(dir.clone().multiplyScalar(arrowTipLen * 0.5));

      const quaternion = new THREE.Quaternion();
      quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

      return {
        lineGeometry: geo,
        coneGeometry: coneGeo,
        conePosition: coneTip,
        coneRotation: new THREE.Euler().setFromQuaternion(quaternion),
        length: len,
      };
    }, [start, end, style.lineWidth]);

  return (
    <group>
      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial
          color={style.color}
          linewidth={style.lineWidth}
          depthTest={false}
        />
      </lineSegments>
      <mesh
        geometry={coneGeometry}
        position={conePosition}
        rotation={coneRotation}
      >
        <meshBasicMaterial color={style.color} depthTest={false} />
      </mesh>

      <Html
        position={[
          (start.x + end.x) / 2,
          (start.y + end.y) / 2,
          (start.z + end.z) / 2,
        ]}
        center
        distanceFactor={60}
        zIndexRange={[100, 0]}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        <div
          style={{
            fontFamily: "'PingFang SC', 'Microsoft YaHei', sans-serif",
            fontSize: '12px',
            fontWeight: 600,
            color: style.color,
            padding: '2px 8px',
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            borderRadius: '4px',
            border: `1px solid ${style.color}`,
            whiteSpace: 'nowrap',
          }}
        >
          {length.toFixed(1)} mm
        </div>
      </Html>

      {isSelected && (
        <lineSegments
          geometry={new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(start.x, start.y, start.z),
            new THREE.Vector3(end.x, end.y, end.z),
          ])}
        >
          <lineBasicMaterial
            color="#ffffff"
            linewidth={1}
            transparent
            opacity={0.4}
            depthTest={false}
          />
        </lineSegments>
      )}
    </group>
  );
}

function DimensionAnnotation3D({ annotation }: { annotation: DimensionAnnotation }) {
  const { start, end, offset, style } = annotation;
  const isSelected = useAppStore(
    (s) => s.selectedAnnotationId === annotation.id
  );
  const isDarkMode = useAppStore((s) => s.isDarkMode);

  const { dimLineStart, dimLineEnd, extStart1, extEnd1, extStart2, extEnd2, distance, midPoint } =
    useMemo(() => {
      const s = new THREE.Vector3(start.x, start.y, start.z);
      const e = new THREE.Vector3(end.x, end.y, end.z);
      const dir = new THREE.Vector3().subVectors(e, s);
      const length = dir.length();

      const up = new THREE.Vector3(0, 1, 0);
      let perpendicular = new THREE.Vector3().crossVectors(dir, up);
      if (perpendicular.length() < 0.001) {
        perpendicular = new THREE.Vector3(0, 0, 1);
      }
      perpendicular.normalize();
      const offsetDir = perpendicular.multiplyScalar(offset);

      const dimStart = s.clone().add(offsetDir);
      const dimEnd = e.clone().add(offsetDir);
      const mid = new THREE.Vector3().addVectors(dimStart, dimEnd).multiplyScalar(0.5);

      return {
        dimLineStart: dimStart,
        dimLineEnd: dimEnd,
        extStart1: s,
        extEnd1: dimStart,
        extStart2: e,
        extEnd2: dimEnd,
        distance: length,
        midPoint: mid,
      };
    }, [start, end, offset]);

  const extLine1Geo = useMemo(
    () => new THREE.BufferGeometry().setFromPoints([extStart1, extEnd1]),
    [extStart1, extEnd1]
  );
  const extLine2Geo = useMemo(
    () => new THREE.BufferGeometry().setFromPoints([extStart2, extEnd2]),
    [extStart2, extEnd2]
  );
  const dimLineGeo = useMemo(
    () => new THREE.BufferGeometry().setFromPoints([dimLineStart, dimLineEnd]),
    [dimLineStart, dimLineEnd]
  );

  const dimText = `${distance.toFixed(2)} mm`;

  return (
    <group>
      <lineSegments geometry={extLine1Geo}>
        <lineBasicMaterial color={style.color} depthTest={false} transparent opacity={0.7} />
      </lineSegments>
      <lineSegments geometry={extLine2Geo}>
        <lineBasicMaterial color={style.color} depthTest={false} transparent opacity={0.7} />
      </lineSegments>
      <lineSegments geometry={dimLineGeo}>
        <lineBasicMaterial color={style.color} linewidth={style.lineWidth} depthTest={false} />
      </lineSegments>

      {(() => {
        const dir = new THREE.Vector3().subVectors(dimLineEnd, dimLineStart).normalize();
        const arrowLen = Math.max(style.lineWidth * 2, 1.5);
        const coneGeo = new THREE.ConeGeometry(Math.max(style.lineWidth * 0.6, 0.5), arrowLen, 8);

        const end1 = dimLineStart.clone().add(dir.clone().multiplyScalar(arrowLen * 0.5));
        const end2 = dimLineEnd.clone().sub(dir.clone().multiplyScalar(arrowLen * 0.5));

        const q1 = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().negate());
        const rot1 = new THREE.Euler().setFromQuaternion(q1);

        const q2 = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        const rot2 = new THREE.Euler().setFromQuaternion(q2);

        return (
          <>
            <mesh geometry={coneGeo} position={end1} rotation={rot1}>
              <meshBasicMaterial color={style.color} depthTest={false} />
            </mesh>
            <mesh geometry={coneGeo} position={end2} rotation={rot2}>
              <meshBasicMaterial color={style.color} depthTest={false} />
            </mesh>
          </>
        );
      })()}

      <Html
        position={midPoint}
        center
        distanceFactor={40}
        zIndexRange={[200, 100]}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        <div
          style={{
            fontFamily: "'SF Mono', 'Menlo', 'Consolas', monospace",
            fontSize: `${Math.max(style.fontSize * 5, 12)}px`,
            fontWeight: 700,
            color: style.color,
            padding: '5px 14px',
            backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            borderRadius: '8px',
            border: `2px solid ${style.color}`,
            boxShadow: `0 0 10px ${style.color}66, 0 4px 12px rgba(0,0,0,0.5)`,
            whiteSpace: 'nowrap',
            letterSpacing: '0.5px',
          }}
        >
          {dimText}
        </div>
      </Html>

      {isSelected && (
        <lineSegments
          geometry={new THREE.BufferGeometry().setFromPoints([dimLineStart, dimLineEnd])}
        >
          <lineBasicMaterial color="#ffffff" transparent opacity={0.3} depthTest={false} />
        </lineSegments>
      )}
    </group>
  );
}

function FreehandAnnotation3D({ annotation }: { annotation: FreehandAnnotation }) {
  const { points, style } = annotation;
  const isSelected = useAppStore(
    (s) => s.selectedAnnotationId === annotation.id
  );

  const lineGeometry = useMemo(() => {
    if (points.length < 2) return null;
    const pts = points.map((p) => new THREE.Vector3(p.x, p.y, p.z));
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [points]);

  if (!lineGeometry) return null;

  return (
    <group>
      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial color={style.color} linewidth={style.lineWidth} depthTest={false} />
      </lineSegments>
      {isSelected && (
        <lineSegments geometry={lineGeometry}>
          <lineBasicMaterial
            color="#ffffff"
            linewidth={1}
            transparent
            opacity={0.3}
            depthTest={false}
          />
        </lineSegments>
      )}
    </group>
  );
}

function AnnotationItem({ annotation }: { annotation: Annotation }) {
  switch (annotation.type) {
    case 'text':
      return <TextAnnotation3D annotation={annotation} />;
    case 'arrow':
      return <ArrowAnnotation3D annotation={annotation} />;
    case 'dimension':
      return <DimensionAnnotation3D annotation={annotation} />;
    case 'freehand':
      return <FreehandAnnotation3D annotation={annotation} />;
    default:
      return null;
  }
}

export function Annotations3D() {
  const annotations = useAppStore((s) => s.annotations);

  if (annotations.length === 0) return null;

  return (
    <group renderOrder={999} name="annotations-group">
      {annotations.map((ann) => (
        <AnnotationItem key={ann.id} annotation={ann} />
      ))}
    </group>
  );
}
