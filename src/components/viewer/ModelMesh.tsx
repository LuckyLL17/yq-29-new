import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '@/store/useAppStore';
import { createDraftAngleVertexColors } from '@/utils/draftAngle';
import { createThicknessVertexColors } from '@/utils/wallThickness';

interface ModelMeshProps {
  model: {
    vertices: Float32Array;
    indices: Uint32Array | Uint16Array;
    normals: Float32Array;
    boundingBox?: THREE.Box3;
  };
}

export function ModelMesh({ model }: ModelMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const analysisMode = useAppStore((state) => state.analysisMode);
  const visualizationMode = useAppStore((state) => state.visualizationMode);
  const draftAngleResult = useAppStore((state) => state.draftAngleResult);
  const highlightUndercuts = useAppStore((state) => state.highlightUndercuts);
  const wallThicknessResult = useAppStore((state) => state.wallThicknessResult);
  const thicknessColorScheme = useAppStore((state) => state.thicknessColorScheme);
  const showThicknessHeatmap = useAppStore((state) => state.showThicknessHeatmap);
  const sectionPlane = useAppStore((state) => state.sectionPlane);
  const autoRotate = useAppStore((state) => state.autoRotate);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(model.vertices, 3));
    geo.setIndex(new THREE.BufferAttribute(model.indices, 1));
    geo.computeVertexNormals();
    return geo;
  }, [model.vertices, model.indices]);

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

  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: 0x6b8e9e,
      metalness: 0.2,
      roughness: 0.5,
      side: THREE.DoubleSide,
      clippingPlanes: clippingPlanes,
      clipShadows: true,
    });

    if (analysisMode === 'draft' && draftAngleResult) {
      if (highlightUndercuts && draftAngleResult.undercutRegions.length > 0) {
        mat.color = new THREE.Color(0x4a5568);
        mat.transparent = true;
        mat.opacity = 0.35;
        mat.metalness = 0.1;
        mat.roughness = 0.8;
        if (geometry.getAttribute('color')) {
          geometry.deleteAttribute('color');
        }
      } else {
        const colors = createDraftAngleVertexColors(
          { vertices: model.vertices, indices: model.indices } as any,
          draftAngleResult
        );
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        mat.vertexColors = true;
        mat.metalness = 0.1;
        mat.roughness = 0.7;
      }
    } else if (analysisMode === 'thickness' && wallThicknessResult) {
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
        mat.opacity = 0.85;
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
      mat.opacity = 0.3;
    }

    return mat;
  }, [
    analysisMode,
    visualizationMode,
    draftAngleResult,
    wallThicknessResult,
    thicknessColorScheme,
    showThicknessHeatmap,
    geometry,
    model,
    clippingPlanes,
    highlightUndercuts,
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
    <mesh ref={meshRef} geometry={geometry} material={material} castShadow receiveShadow />
  );
}
