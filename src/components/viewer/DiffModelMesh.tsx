import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '@/store/useAppStore';
import { createDiffVertexColors } from '@/utils/modelDiff';
import type { ModelData, ModelDiffResult, ModelLayer } from '@/types';

interface DiffModelMeshProps {
  model: ModelData;
  diffResult: ModelDiffResult;
  position?: [number, number, number];
  layers?: ModelLayer[];
}

function DiffLayerMesh({
  layer,
  diffResult,
  position,
}: {
  layer: ModelLayer;
  diffResult: ModelDiffResult;
  position?: [number, number, number];
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const autoRotate = useAppStore((state) => state.autoRotate);
  const visualizationMode = useAppStore((state) => state.visualizationMode);
  const targetOffset = layer.explosionOffset;
  const currentOffsetRef = useRef(new THREE.Vector3(0, 0, 0));

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(layer.geometry.vertices, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(layer.geometry.normals, 3));
    geo.setIndex(new THREE.BufferAttribute(layer.geometry.indices, 1));

    const pseudoModel = {
      vertices: layer.geometry.vertices,
      indices: layer.geometry.indices,
      vertexCount: layer.geometry.vertexCount,
    } as ModelData;

    const colors = createDiffVertexColors(pseudoModel, diffResult);
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    return geo;
  }, [layer.geometry, diffResult]);

  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      metalness: 0.1,
      roughness: 0.7,
      side: THREE.DoubleSide,
      transparent: layer.opacity < 1,
      opacity: layer.opacity,
    });

    if (visualizationMode === 'wireframe') {
      mat.wireframe = true;
    } else if (visualizationMode === 'xray') {
      mat.transparent = true;
      mat.opacity = Math.min(mat.opacity, 0.5);
    }

    return mat;
  }, [visualizationMode, layer.opacity]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      const target = new THREE.Vector3(targetOffset.x, targetOffset.y, targetOffset.z);
      currentOffsetRef.current.lerp(target, Math.min(delta * 5, 1));
      groupRef.current.position.copy(currentOffsetRef.current);
    }

    if (autoRotate && meshRef.current) {
      meshRef.current.rotation.y += delta * 0.2;
    }
  });

  if (!layer.visible) return null;

  return (
    <group ref={groupRef} position={position}>
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        castShadow
        receiveShadow
      />
    </group>
  );
}

export function DiffModelMesh({ model, diffResult, position = [0, 0, 0], layers }: DiffModelMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const autoRotate = useAppStore((state) => state.autoRotate);
  const visualizationMode = useAppStore((state) => state.visualizationMode);
  const layersEnabled = useAppStore((state) => state.layersEnabled);
  const storeLayers = useAppStore((state) => state.modelLayers);

  const effectiveLayers = layers || storeLayers;
  const shouldUseLayers = layersEnabled && effectiveLayers.length > 0;

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(model.vertices, 3));
    geo.setIndex(new THREE.BufferAttribute(model.indices, 1));
    geo.computeVertexNormals();

    const colors = createDiffVertexColors(model, diffResult);
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    return geo;
  }, [model, diffResult]);

  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      metalness: 0.1,
      roughness: 0.7,
      side: THREE.DoubleSide,
    });

    if (visualizationMode === 'wireframe') {
      mat.wireframe = true;
    } else if (visualizationMode === 'xray') {
      mat.transparent = true;
      mat.opacity = 0.5;
    }

    return mat;
  }, [visualizationMode]);

  useFrame((_, delta) => {
    if (autoRotate && meshRef.current && !shouldUseLayers) {
      meshRef.current.rotation.y += delta * 0.2;
    }
  });

  if (shouldUseLayers) {
    return (
      <group position={position}>
        {effectiveLayers.map((layer) => (
          <DiffLayerMesh
            key={layer.id}
            layer={layer}
            diffResult={diffResult}
          />
        ))}
      </group>
    );
  }

  return (
    <mesh ref={meshRef} geometry={geometry} material={material} position={position} castShadow receiveShadow />
  );
}
