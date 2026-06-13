import { useCallback, useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '@/store/useAppStore';
import type { Vector3, HoleEditMode } from '@/types';
import { checkHoleCollision, autoAvoidCollision } from '@/utils/drainHoles';

function useDrainHoleInteraction() {
  const holeEditMode = useAppStore((s) => s.holeEditMode);
  const addDrainHole = useAppStore((s) => s.addDrainHole);
  const updateDrainHole = useAppStore((s) => s.updateDrainHole);
  const selectedHoleId = useAppStore((s) => s.selectedHoleId);
  const drainHoleResult = useAppStore((s) => s.drainHoleResult);
  const holeDiameter = useAppStore((s) => s.holeDiameter);
  const holeDepth = useAppStore((s) => s.holeDepth);
  const collisionEnabled = useAppStore((s) => s.collisionEnabled);
  const holeSpacing = useAppStore((s) => s.holeSpacing);

  const { raycaster, camera, scene, gl } = useThree();
  const pendingMouseDownPos = useRef<{ x: number; y: number } | null>(null);
  const isDragging = useRef<boolean>(false);
  const dragStartPos = useRef<Vector3 | null>(null);

  const getModelIntersection = useCallback(
    (event: MouseEvent): { point: Vector3; normal: Vector3 } | null => {
      const rect = gl.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

      const meshes: THREE.Mesh[] = [];
      scene.traverse((child) => {
        const c = child as any;
        if (c.isMesh && !c.isAnnotation && !c.__annotationsGroupChild && !c.userData?.holeType) {
          meshes.push(child as THREE.Mesh);
        }
      });

      const intersects = raycaster.intersectObjects(meshes, false);
      if (intersects.length > 0) {
        const p = intersects[0].point;
        const n = intersects[0].face?.normal || new THREE.Vector3(0, 1, 0);
        const worldNormal = n.clone();
        if (intersects[0].object) {
          worldNormal.transformDirection(intersects[0].object.matrixWorld);
        }
        return {
          point: { x: p.x, y: p.y, z: p.z },
          normal: { x: worldNormal.x, y: worldNormal.y, z: worldNormal.z },
        };
      }
      return null;
    },
    [raycaster, camera, scene, gl]
  );

  const handleClick = useCallback(
    (event: MouseEvent) => {
      if (holeEditMode === 'none' || holeEditMode === 'delete') return;

      if (pendingMouseDownPos.current) {
        const dx = event.clientX - pendingMouseDownPos.current.x;
        const dy = event.clientY - pendingMouseDownPos.current.y;
        if (Math.sqrt(dx * dx + dy * dy) > 5) {
          pendingMouseDownPos.current = null;
          return;
        }
        pendingMouseDownPos.current = null;
      }

      if (isDragging.current) {
        isDragging.current = false;
        return;
      }

      if (holeEditMode === 'add') {
        const intersection = getModelIntersection(event);
        if (!intersection) return;

        const { point, normal } = intersection;
        const existingHoles = drainHoleResult?.holes || [];
        
        let newHole = {
          position: point,
          normal,
          diameter: holeDiameter,
          depth: holeDepth,
          type: 'dewatering' as const,
        };

        if (collisionEnabled) {
          const collision = checkHoleCollision(newHole, existingHoles, holeSpacing);
          if (collision.hasCollision) {
            const avoided = autoAvoidCollision(newHole, existingHoles, holeSpacing);
            if (avoided) {
              newHole.position = avoided.position;
            } else {
              return;
            }
          }
        }

        addDrainHole(newHole);
      }
    },
    [holeEditMode, getModelIntersection, addDrainHole, drainHoleResult, holeDiameter, holeDepth, collisionEnabled, holeSpacing]
  );

  const handleMouseDown = useCallback(
    (event: MouseEvent) => {
      if (event.button !== 0) return;
      pendingMouseDownPos.current = { x: event.clientX, y: event.clientY };

      if (holeEditMode === 'move' && selectedHoleId) {
        const intersection = getModelIntersection(event);
        if (intersection) {
          isDragging.current = true;
          dragStartPos.current = intersection.point;
        }
      }
    },
    [holeEditMode, selectedHoleId, getModelIntersection]
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!isDragging.current || !selectedHoleId || holeEditMode !== 'move') return;

      const intersection = getModelIntersection(event);
      if (!intersection || !drainHoleResult) return;

      const hole = drainHoleResult.holes.find((h) => h.id === selectedHoleId);
      if (!hole) return;

      let newPosition = intersection.point;
      let newNormal = intersection.normal;

      if (collisionEnabled) {
        const otherHoles = drainHoleResult.holes.filter((h) => h.id !== selectedHoleId);
        const collision = checkHoleCollision(
          { ...hole, position: newPosition },
          otherHoles,
          holeSpacing
        );
        if (collision.hasCollision) {
          const avoided = autoAvoidCollision(
            { ...hole, position: newPosition },
            otherHoles,
            holeSpacing
          );
          if (avoided) {
            newPosition = avoided.position;
          } else {
            return;
          }
        }
      }

      updateDrainHole(selectedHoleId, {
        position: newPosition,
        normal: newNormal,
      });
    },
    [isDragging, selectedHoleId, holeEditMode, getModelIntersection, drainHoleResult, collisionEnabled, holeSpacing, updateDrainHole]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging.current) {
      isDragging.current = false;
      dragStartPos.current = null;
    }
    pendingMouseDownPos.current = null;
  }, []);

  useEffect(() => {
    const canvas = gl.domElement;

    const preventOrbitWhenEditing = (e: Event) => {
      if (holeEditMode !== 'none') {
        e.stopImmediatePropagation();
      }
    };

    const shouldIntercept = (mode: HoleEditMode) => {
      return mode === 'add' || mode === 'move';
    };

    if (shouldIntercept(holeEditMode)) {
      canvas.addEventListener('click', handleClick, true);
      canvas.addEventListener('mousedown', handleMouseDown, true);
      canvas.addEventListener('mousemove', handleMouseMove, true);
      canvas.addEventListener('mouseup', handleMouseUp, true);
      canvas.addEventListener('pointerdown', preventOrbitWhenEditing, true);
      canvas.addEventListener('pointermove', preventOrbitWhenEditing, true);
      canvas.addEventListener('pointerup', preventOrbitWhenEditing, true);
    }

    return () => {
      canvas.removeEventListener('click', handleClick, true);
      canvas.removeEventListener('mousedown', handleMouseDown, true);
      canvas.removeEventListener('mousemove', handleMouseMove, true);
      canvas.removeEventListener('mouseup', handleMouseUp, true);
      canvas.removeEventListener('pointerdown', preventOrbitWhenEditing, true);
      canvas.removeEventListener('pointermove', preventOrbitWhenEditing, true);
      canvas.removeEventListener('pointerup', preventOrbitWhenEditing, true);
    };
  }, [gl, handleClick, handleMouseDown, handleMouseMove, handleMouseUp, holeEditMode]);

  return null;
}

export function DrainHoleInteraction() {
  useDrainHoleInteraction();
  return null;
}
