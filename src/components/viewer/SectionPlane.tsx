import { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '@/store/useAppStore';
import type { SectionAxis } from '@/types';

interface SectionPlaneProps {
  modelSize: { x: number; y: number; z: number };
  modelCenter: { x: number; y: number; z: number };
}

export function SectionPlane({ modelSize, modelCenter }: SectionPlaneProps) {
  const sectionPlane = useAppStore((state) => state.sectionPlane);
  const setSectionPosition = useAppStore((state) => state.setSectionPosition);
  const transformRef = useRef<any>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera, gl } = useThree();

  const planeSize = Math.max(modelSize.x, modelSize.y, modelSize.z) * 1.5;
  const CLIP_OFFSET = 0.05;

  const getPlaneRotation = (axis: SectionAxis): [number, number, number] => {
    switch (axis) {
      case 'x':
        return [0, Math.PI / 2, 0];
      case 'y':
        return [0, 0, 0];
      case 'z':
        return [Math.PI / 2, 0, 0];
      default:
        return [0, 0, 0];
    }
  };

  const getPlanePosition = (): [number, number, number] => {
    const pos = sectionPlane.position;
    const offset = CLIP_OFFSET;
    switch (sectionPlane.axis) {
      case 'x':
        return [pos + offset, modelCenter.y, modelCenter.z];
      case 'y':
        return [modelCenter.x, pos + offset, modelCenter.z];
      case 'z':
        return [modelCenter.x, modelCenter.y, pos + offset];
      default:
        return [modelCenter.x, pos + offset, modelCenter.z];
    }
  };

  useEffect(() => {
    if (transformRef.current) {
      const controls = transformRef.current;

      const handleChange = () => {
        if (!meshRef.current) return;
        const pos = meshRef.current.position;
        let newValue = 0;
        switch (sectionPlane.axis) {
          case 'x':
            newValue = pos.x - CLIP_OFFSET;
            break;
          case 'y':
            newValue = pos.y - CLIP_OFFSET;
            break;
          case 'z':
            newValue = pos.z - CLIP_OFFSET;
            break;
        }
        setSectionPosition(newValue);
      };

      controls.addEventListener('objectChange', handleChange);
      return () => {
        controls.removeEventListener('objectChange', handleChange);
      };
    }
  }, [sectionPlane.axis, setSectionPosition]);

  if (!sectionPlane.visible) return null;

  return (
    <group>
      <TransformControls
        ref={transformRef}
        mode="translate"
        showX={sectionPlane.axis === 'x'}
        showY={sectionPlane.axis === 'y'}
        showZ={sectionPlane.axis === 'z'}
        size={1}
      >
        <mesh ref={meshRef} position={getPlanePosition()} rotation={getPlaneRotation(sectionPlane.axis)}>
          <planeGeometry args={[planeSize, planeSize]} />
          <meshBasicMaterial
            color="#06b6d4"
            transparent
            opacity={0.15}
            side={THREE.DoubleSide}
            depthWrite={false}
            clippingPlanes={[]}
          />
        </mesh>
      </TransformControls>

      <mesh position={getPlanePosition()} rotation={getPlaneRotation(sectionPlane.axis)}>
        <ringGeometry args={[planeSize * 0.45, planeSize * 0.5, 64]} />
        <meshBasicMaterial
          color="#06b6d4"
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
          clippingPlanes={[]}
        />
      </mesh>
    </group>
  );
}
