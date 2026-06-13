import { useCallback, useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '@/store/useAppStore';
import type { AnnotationTool, Vector3 } from '@/types';

function useAnnotationInteraction() {
  const annotationTool = useAppStore((s) => s.annotationTool);
  const annotationStyle = useAppStore((s) => s.annotationStyle);
  const addAnnotation = useAppStore((s) => s.addAnnotation);
  const setIsDrawingFreehand = useAppStore((s) => s.setIsDrawingFreehand);
  const isDrawingFreehand = useAppStore((s) => s.isDrawingFreehand);
  const updateAnnotation = useAppStore((s) => s.updateAnnotation);
  const annotations = useAppStore((s) => s.annotations);
  const openTextAnnotationPrompt = useAppStore((s) => s.openTextAnnotationPrompt);
  const textAnnotationPrompt = useAppStore((s) => s.textAnnotationPrompt);

  const pendingArrowStart = useRef<Vector3 | null>(null);
  const pendingDimensionStart = useRef<Vector3 | null>(null);
  const currentFreehandId = useRef<string | null>(null);
  const pendingMouseDownPos = useRef<{ x: number; y: number } | null>(null);
  const { raycaster, camera, scene, gl } = useThree();

  const getModelIntersection = useCallback(
    (event: MouseEvent): Vector3 | null => {
      const rect = gl.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

      const meshes: THREE.Mesh[] = [];
      scene.traverse((child) => {
        const c = child as any;
        if (c.isMesh && !c.isAnnotation && !c.__annotationsGroupChild) {
          meshes.push(child as THREE.Mesh);
        }
      });

      const intersects = raycaster.intersectObjects(meshes, false);
      if (intersects.length > 0) {
        const p = intersects[0].point;
        return { x: p.x, y: p.y, z: p.z };
      }

      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const target = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, target);
      if (target) {
        return { x: target.x, y: target.y, z: target.z };
      }
      return null;
    },
    [raycaster, camera, scene, gl]
  );

  const handleClick = useCallback(
    (event: MouseEvent) => {
      if (annotationTool === 'none') return;
      if (textAnnotationPrompt.open) return;

      if (pendingMouseDownPos.current) {
        const dx = event.clientX - pendingMouseDownPos.current.x;
        const dy = event.clientY - pendingMouseDownPos.current.y;
        if (Math.sqrt(dx * dx + dy * dy) > 5) {
          pendingMouseDownPos.current = null;
          return;
        }
        pendingMouseDownPos.current = null;
      }

      const point = getModelIntersection(event);
      if (!point) return;

      const id = `ann_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      switch (annotationTool) {
        case 'text': {
          openTextAnnotationPrompt(point);
          break;
        }
        case 'arrow': {
          if (!pendingArrowStart.current) {
            pendingArrowStart.current = point;
          } else {
            addAnnotation({
              id,
              type: 'arrow',
              start: pendingArrowStart.current,
              end: point,
              style: { ...annotationStyle },
            });
            pendingArrowStart.current = null;
          }
          break;
        }
        case 'dimension': {
          if (!pendingDimensionStart.current) {
            pendingDimensionStart.current = point;
          } else {
            const s = pendingDimensionStart.current;
            const dir = new THREE.Vector3(point.x - s.x, point.y - s.y, point.z - s.z);
            const up = new THREE.Vector3(0, 1, 0);
            const perp = new THREE.Vector3().crossVectors(dir, up);
            const offset = Math.max(perp.length() * 0.3, 5);
            addAnnotation({
              id,
              type: 'dimension',
              start: pendingDimensionStart.current,
              end: point,
              offset,
              style: { ...annotationStyle },
            });
            pendingDimensionStart.current = null;
          }
          break;
        }
        case 'freehand': {
          break;
        }
      }
    },
    [annotationTool, annotationStyle, addAnnotation, getModelIntersection, openTextAnnotationPrompt, textAnnotationPrompt.open]
  );

  const handleMouseDown = useCallback(
    (event: MouseEvent) => {
      if (textAnnotationPrompt.open) return;

      pendingMouseDownPos.current = { x: event.clientX, y: event.clientY };

      if (annotationTool !== 'freehand') return;
      if (event.button !== 0) return;

      const point = getModelIntersection(event);
      if (!point) return;

      const id = `ann_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      currentFreehandId.current = id;
      setIsDrawingFreehand(true);

      addAnnotation({
        id,
        type: 'freehand',
        points: [point],
        style: { ...annotationStyle },
      });
    },
    [annotationTool, annotationStyle, addAnnotation, getModelIntersection, setIsDrawingFreehand, textAnnotationPrompt.open]
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!isDrawingFreehand || !currentFreehandId.current) return;

      const point = getModelIntersection(event);
      if (!point) return;

      const ann = annotations.find((a) => a.id === currentFreehandId.current);
      if (!ann || ann.type !== 'freehand') return;

      updateAnnotation(currentFreehandId.current, {
        points: [...ann.points, point],
      } as any);
    },
    [isDrawingFreehand, annotations, updateAnnotation, getModelIntersection]
  );

  const handleMouseUp = useCallback(() => {
    if (isDrawingFreehand) {
      setIsDrawingFreehand(false);
      currentFreehandId.current = null;
    }
  }, [isDrawingFreehand, setIsDrawingFreehand]);

  useEffect(() => {
    const canvas = gl.domElement;

    const preventOrbitWhenAnnotating = (e: Event) => {
      if (annotationTool !== 'none' && !textAnnotationPrompt.open) {
        e.stopImmediatePropagation();
      }
    };

    canvas.addEventListener('click', handleClick, true);
    canvas.addEventListener('mousedown', handleMouseDown, true);
    canvas.addEventListener('mousemove', handleMouseMove, true);
    canvas.addEventListener('mouseup', handleMouseUp, true);

    canvas.addEventListener('pointerdown', preventOrbitWhenAnnotating, true);
    canvas.addEventListener('pointermove', preventOrbitWhenAnnotating, true);
    canvas.addEventListener('pointerup', preventOrbitWhenAnnotating, true);

    return () => {
      canvas.removeEventListener('click', handleClick, true);
      canvas.removeEventListener('mousedown', handleMouseDown, true);
      canvas.removeEventListener('mousemove', handleMouseMove, true);
      canvas.removeEventListener('mouseup', handleMouseUp, true);
      canvas.removeEventListener('pointerdown', preventOrbitWhenAnnotating, true);
      canvas.removeEventListener('pointermove', preventOrbitWhenAnnotating, true);
      canvas.removeEventListener('pointerup', preventOrbitWhenAnnotating, true);
    };
  }, [gl, handleClick, handleMouseDown, handleMouseMove, handleMouseUp, annotationTool, textAnnotationPrompt.open]);

  return null;
}

export function AnnotationInteraction() {
  useAnnotationInteraction();
  return null;
}
