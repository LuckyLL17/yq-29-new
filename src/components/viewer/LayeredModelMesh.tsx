import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '@/store/useAppStore';
import { createDraftAngleVertexColors } from '@/utils/draftAngle';
import { createThicknessVertexColors } from '@/utils/wallThickness';
import type { ModelLayer, ModelData, ThicknessColorScheme } from '@/types';

interface LayeredModelMeshProps {
  model: {
    vertices: Float32Array;
    indices: Uint32Array | Uint16Array;
    normals: Float32Array;
  };
  layers?: ModelLayer[];
  baseColor?: string;
  baseOpacity?: number;
  position?: [number, number, number];
  enableAnalysisOverlay?: boolean;
}

function LayerMesh({
  layer,
  clippingPlanes,
  baseColor,
  baseOpacity,
  enableAnalysisOverlay,
}: {
  layer: ModelLayer;
  clippingPlanes: THREE.Plane[];
  baseColor?: string;
  baseOpacity?: number;
  enableAnalysisOverlay?: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const analysisMode = useAppStore((state) => state.analysisMode);
  const visualizationMode = useAppStore((state) => state.visualizationMode);
  const draftAngleResult = useAppStore((state) => state.draftAngleResult);
  const wallThicknessResult = useAppStore((state) => state.wallThicknessResult);
  const thicknessColorScheme = useAppStore((state) => state.thicknessColorScheme);
  const showThicknessHeatmap = useAppStore((state) => state.showThicknessHeatmap);
  const autoRotate = useAppStore((state) => state.autoRotate);
  const targetOffset = layer.explosionOffset;
  const currentOffsetRef = useRef(new THREE.Vector3(0, 0, 0));

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(layer.geometry.vertices, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(layer.geometry.normals, 3));
    geo.setIndex(new THREE.BufferAttribute(layer.geometry.indices, 1));
    return geo;
  }, [layer.geometry.vertices, layer.geometry.indices, layer.geometry.normals]);

  const finalColor = baseColor || layer.color;
  const finalOpacity = baseOpacity !== undefined ? baseOpacity : layer.opacity;

  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(finalColor),
      metalness: 0.2,
      roughness: 0.5,
      side: THREE.DoubleSide,
      transparent: finalOpacity < 1,
      opacity: finalOpacity,
      depthWrite: finalOpacity >= 0.99,
      clippingPlanes: clippingPlanes,
      clipShadows: true,
    });

    if (enableAnalysisOverlay !== false && analysisMode === 'draft' && draftAngleResult) {
      const colors = createDraftAngleVertexColors(
        { vertices: layer.geometry.vertices, indices: layer.geometry.indices } as any,
        draftAngleResult
      );
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      mat.vertexColors = true;
      mat.metalness = 0.1;
      mat.roughness = 0.7;
    } else if (enableAnalysisOverlay !== false && analysisMode === 'thickness' && wallThicknessResult) {
      if (showThicknessHeatmap) {
        const colors = createThicknessVertexColors(
          { vertices: layer.geometry.vertices, indices: layer.geometry.indices },
          wallThicknessResult,
          thicknessColorScheme
        );
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        mat.vertexColors = true;
        mat.metalness = 0.05;
        mat.roughness = 0.85;
        mat.transparent = false;
      } else {
        if (geometry.getAttribute('color')) {
          geometry.deleteAttribute('color');
        }
        mat.color = new THREE.Color(0x4a90d9);
        mat.metalness = 0.1;
        mat.roughness = 0.7;
        mat.transparent = true;
        mat.opacity = Math.min(mat.opacity, 0.85);
        mat.vertexColors = false;
      }
    } else {
      if (geometry.getAttribute('color')) {
        geometry.deleteAttribute('color');
      }
      mat.vertexColors = false;
    }

    if (visualizationMode === 'wireframe') {
      mat.wireframe = true;
    } else if (visualizationMode === 'xray') {
      mat.transparent = true;
      mat.opacity = Math.min(mat.opacity, 0.3);
    }

    return mat;
  }, [
    finalColor,
    finalOpacity,
    analysisMode,
    visualizationMode,
    draftAngleResult,
    wallThicknessResult,
    thicknessColorScheme,
    showThicknessHeatmap,
    geometry,
    layer.geometry,
    clippingPlanes,
    enableAnalysisOverlay,
  ]);

  useEffect(() => {
    if (material) {
      material.clippingPlanes = clippingPlanes;
      material.needsUpdate = true;
    }
  }, [clippingPlanes, material]);

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
    <group ref={groupRef}>
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

export function LayeredModelMesh({
  model,
  layers: externalLayers,
  baseColor,
  baseOpacity,
  position = [0, 0, 0],
  enableAnalysisOverlay = true,
}: LayeredModelMeshProps) {
  const storeLayers = useAppStore((state) => state.modelLayers);
  const sectionPlane = useAppStore((state) => state.sectionPlane);
  const analysisMode = useAppStore((state) => state.analysisMode);
  const layersEnabled = useAppStore((state) => state.layersEnabled);

  const layers = externalLayers || storeLayers;
  const shouldUseLayers = layersEnabled && layers.length > 0;

  const clippingPlanes = useMemo(() => {
    if (analysisMode !== 'section' || !sectionPlane.visible) {
      return [];
    }

    const normal = new THREE.Vector3();
    switch (sectionPlane.axis) {
      case 'x':
        normal.set(1, 0, 0);
        break;
      case 'y':
        normal.set(0, 1, 0);
        break;
      case 'z':
        normal.set(0, 0, 1);
        break;
      default:
        normal.set(0, 1, 0);
    }

    return [new THREE.Plane(normal, -sectionPlane.position)];
  }, [analysisMode, sectionPlane.axis, sectionPlane.position, sectionPlane.visible]);

  if (!shouldUseLayers) {
    return (
      <FallbackModelMesh
        model={model}
        clippingPlanes={clippingPlanes}
        baseColor={baseColor}
        baseOpacity={baseOpacity}
        position={position}
        enableAnalysisOverlay={enableAnalysisOverlay}
      />
    );
  }

  return (
    <group position={position}>
      {layers.map((layer) => (
        <LayerMesh
          key={layer.id}
          layer={layer}
          clippingPlanes={clippingPlanes}
          baseColor={baseColor}
          baseOpacity={baseOpacity}
          enableAnalysisOverlay={enableAnalysisOverlay}
        />
      ))}
    </group>
  );
}

function FallbackModelMesh({
  model,
  clippingPlanes,
  baseColor,
  baseOpacity,
  position = [0, 0, 0],
  enableAnalysisOverlay = true,
}: {
  model: LayeredModelMeshProps['model'];
  clippingPlanes: THREE.Plane[];
  baseColor?: string;
  baseOpacity?: number;
  position?: [number, number, number];
  enableAnalysisOverlay?: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const analysisMode = useAppStore((state) => state.analysisMode);
  const visualizationMode = useAppStore((state) => state.visualizationMode);
  const draftAngleResult = useAppStore((state) => state.draftAngleResult);
  const wallThicknessResult = useAppStore((state) => state.wallThicknessResult);
  const thicknessColorScheme = useAppStore((state) => state.thicknessColorScheme);
  const showThicknessHeatmap = useAppStore((state) => state.showThicknessHeatmap);
  const autoRotate = useAppStore((state) => state.autoRotate);

  const finalColor = baseColor || '#6b8e9e';
  const finalOpacity = baseOpacity !== undefined ? baseOpacity : 1;

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(model.vertices, 3));
    geo.setIndex(new THREE.BufferAttribute(model.indices, 1));
    geo.computeVertexNormals();
    return geo;
  }, [model.vertices, model.indices]);

  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(finalColor),
      metalness: 0.2,
      roughness: 0.5,
      side: THREE.DoubleSide,
      transparent: finalOpacity < 1,
      opacity: finalOpacity,
      depthWrite: finalOpacity >= 0.99,
      clippingPlanes: clippingPlanes,
      clipShadows: true,
    });

    if (enableAnalysisOverlay !== false && analysisMode === 'draft' && draftAngleResult) {
      const colors = createDraftAngleVertexColors(
        { vertices: model.vertices, indices: model.indices } as any,
        draftAngleResult
      );
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      mat.vertexColors = true;
      mat.metalness = 0.1;
      mat.roughness = 0.7;
    } else if (enableAnalysisOverlay !== false && analysisMode === 'thickness' && wallThicknessResult) {
      if (showThicknessHeatmap) {
        const colors = createThicknessVertexColors(
          { vertices: model.vertices, indices: model.indices },
          wallThicknessResult,
          thicknessColorScheme
        );
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        mat.vertexColors = true;
        mat.metalness = 0.05;
        mat.roughness = 0.85;
        mat.transparent = false;
      } else {
        if (geometry.getAttribute('color')) {
          geometry.deleteAttribute('color');
        }
        mat.color = new THREE.Color(0x4a90d9);
        mat.metalness = 0.1;
        mat.roughness = 0.7;
        mat.transparent = true;
        mat.opacity = Math.min(mat.opacity, 0.85);
        mat.vertexColors = false;
      }
    } else {
      if (geometry.getAttribute('color')) {
        geometry.deleteAttribute('color');
      }
      mat.vertexColors = false;
    }

    if (visualizationMode === 'wireframe') {
      mat.wireframe = true;
    } else if (visualizationMode === 'xray') {
      mat.transparent = true;
      mat.opacity = Math.min(mat.opacity, 0.3);
    }

    return mat;
  }, [
    finalColor,
    finalOpacity,
    analysisMode,
    visualizationMode,
    draftAngleResult,
    wallThicknessResult,
    thicknessColorScheme,
    showThicknessHeatmap,
    geometry,
    model,
    clippingPlanes,
    enableAnalysisOverlay,
  ]);

  useEffect(() => {
    if (material) {
      material.clippingPlanes = clippingPlanes;
      material.needsUpdate = true;
    }
  }, [clippingPlanes, material]);

  useFrame((_, delta) => {
    if (autoRotate && meshRef.current) {
      meshRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={position}
      castShadow
      receiveShadow
    />
  );
}
