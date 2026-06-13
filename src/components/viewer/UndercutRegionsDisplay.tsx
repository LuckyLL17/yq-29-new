import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { UndercutRegion } from '@/types';
import { createUndercutRegionGeometry } from '@/utils/draftAngle';

interface UndercutRegionsDisplayProps {
  regions: UndercutRegion[];
  selectedRegionId: string | null;
  vertices: Float32Array;
  indices: Uint32Array | Uint16Array;
  onRegionClick?: (regionId: string) => void;
}

const severityColors: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

function RegionMesh({
  region,
  isSelected,
  vertices,
  indices,
  onClick,
}: {
  region: UndercutRegion;
  isSelected: boolean;
  vertices: Float32Array;
  indices: Uint32Array | Uint16Array;
  onClick?: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const edgesRef = useRef<THREE.LineSegments>(null);
  const pulseRef = useRef(0);

  const geometry = useMemo(() => {
    const { positions, normals } = createUndercutRegionGeometry(vertices, indices, region);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    return geo;
  }, [vertices, indices, region]);

  const edgesGeometry = useMemo(() => {
    return new THREE.EdgesGeometry(geometry, 20);
  }, [geometry]);

  const color = useMemo(() => {
    return new THREE.Color(severityColors[region.severity] || '#ef4444');
  }, [region.severity]);

  useFrame((_, delta) => {
    if (isSelected && meshRef.current) {
      pulseRef.current += delta * 3;
      const pulse = (Math.sin(pulseRef.current) + 1) / 2;
      const scale = 1 + pulse * 0.02;
      meshRef.current.scale.setScalar(scale);
      
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      if (material.emissive) {
        material.emissiveIntensity = 0.3 + pulse * 0.7;
      }
    }
  });

  return (
    <group>
      <mesh
        ref={meshRef}
        geometry={geometry}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
        }}
      >
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSelected ? 0.5 : 0.2}
          transparent
          opacity={isSelected ? 0.9 : 0.7}
          side={THREE.DoubleSide}
          depthTest={true}
          polygonOffset
          polygonOffsetFactor={-1}
        />
      </mesh>

      <lineSegments ref={edgesRef} geometry={edgesGeometry}>
        <lineBasicMaterial
          color={isSelected ? '#ffffff' : color}
          transparent
          opacity={isSelected ? 1 : 0.8}
          linewidth={isSelected ? 2 : 1}
        />
      </lineSegments>

      {isSelected && (
        <Html
          position={[region.centroid.x, region.centroid.y + region.boundingBox.size.y / 2 + 5, region.centroid.z]}
          center
          distanceFactor={100}
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.95)',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              border: '2px solid rgba(255,255,255,0.4)',
            }}
          >
            {region.id.toUpperCase()} | {region.avgAngle.toFixed(1)}°
          </div>
        </Html>
      )}
    </group>
  );
}

export function UndercutRegionsDisplay({
  regions,
  selectedRegionId,
  vertices,
  indices,
  onRegionClick,
}: UndercutRegionsDisplayProps) {
  return (
    <group>
      {regions.map((region) => (
        <RegionMesh
          key={region.id}
          region={region}
          isSelected={selectedRegionId === region.id}
          vertices={vertices}
          indices={indices}
          onClick={() => onRegionClick?.(region.id)}
        />
      ))}
    </group>
  );
}
