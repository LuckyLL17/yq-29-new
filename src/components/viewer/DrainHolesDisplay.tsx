import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { DrainHole } from '@/types';
import { useAppStore } from '@/store/useAppStore';

interface DrainHolesDisplayProps {
  holes: DrainHole[];
}

function DrainHoleMesh({ hole }: { hole: DrainHole }) {
  const selectedHoleId = useAppStore((state) => state.selectedHoleId);
  const setSelectedHoleId = useAppStore((state) => state.setSelectedHoleId);
  const holeEditMode = useAppStore((state) => state.holeEditMode);
  const removeDrainHole = useAppStore((state) => state.removeDrainHole);
  const meshRef = useRef<THREE.Mesh>(null);
  const isSelected = selectedHoleId === hole.id;

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (holeEditMode === 'delete') {
      removeDrainHole(hole.id);
    } else {
      setSelectedHoleId(selectedHoleId === hole.id ? null : hole.id);
    }
  };

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    document.body.style.cursor =
      holeEditMode === 'delete' ? 'not-allowed' : 'pointer';
  };

  const handlePointerOut = () => {
    document.body.style.cursor = 'default';
  };

  const radius = hole.diameter / 2;
  const depth = hole.depth;

  const { position, quaternion, ringPosition } = useMemo(() => {
    const normal = new THREE.Vector3(hole.normal.x, hole.normal.y, hole.normal.z);
    const up = new THREE.Vector3(0, 1, 0);
    const q = new THREE.Quaternion().setFromUnitVectors(up, normal);
    
    const pos = new THREE.Vector3(hole.position.x, hole.position.y, hole.position.z);
    const offset = normal.clone().multiplyScalar(depth / 2);
    const meshPos = pos.clone().add(offset);
    
    const ringOffset = normal.clone().multiplyScalar(0.1);
    const ringPos = pos.clone().add(ringOffset);
    
    return {
      position: meshPos,
      quaternion: q,
      ringPosition: ringPos,
    };
  }, [hole.position, hole.normal, depth]);

  const color = hole.type === 'suction' ? '#ff6b35' : '#06b6d4';
  const emissive = isSelected
    ? hole.type === 'suction'
      ? '#ff8c00'
      : '#00ffff'
    : hole.type === 'suction'
    ? '#ff4500'
    : '#0891b2';

  return (
    <group>
      <mesh
        ref={meshRef}
        position={position}
        quaternion={quaternion}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <cylinderGeometry args={[radius, radius, depth, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={isSelected ? 0.8 : 0.3}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>
      {isSelected && (
        <mesh position={ringPosition} quaternion={quaternion}>
          <ringGeometry args={[radius * 1.3, radius * 1.6, 32]} />
          <meshBasicMaterial
            color="#ffff00"
            side={THREE.DoubleSide}
            transparent
            opacity={0.9}
          />
        </mesh>
      )}
    </group>
  );
}

export function DrainHolesDisplay({ holes }: DrainHolesDisplayProps) {
  return (
    <group>
      {holes.map((hole) => (
        <DrainHoleMesh key={hole.id} hole={hole} />
      ))}
    </group>
  );
}
