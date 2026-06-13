import { useMemo } from 'react';
import * as THREE from 'three';
import type { WallThicknessSample, ThicknessColorScheme } from '@/types';
import { getThicknessColor } from '@/utils/wallThickness';

interface ThicknessSamplesDisplayProps {
  samples: WallThicknessSample[];
  minThickness: number;
  maxThickness: number;
  colorScheme?: ThicknessColorScheme;
  visible?: boolean;
}

export function ThicknessSamplesDisplay({
  samples,
  minThickness,
  maxThickness,
  colorScheme = 'rainbow',
  visible = true,
}: ThicknessSamplesDisplayProps) {
  const pointsGeometry = useMemo(() => {
    const positions = new Float32Array(samples.length * 3);
    const colors = new Float32Array(samples.length * 3);

    samples.forEach((sample, index) => {
      positions[index * 3] = sample.x;
      positions[index * 3 + 1] = sample.y;
      positions[index * 3 + 2] = sample.z;

      const color = getThicknessColor(sample.thickness, minThickness, maxThickness, colorScheme);
      colors[index * 3] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    return geometry;
  }, [samples, minThickness, maxThickness, colorScheme]);

  if (!visible) return null;

  return (
    <points geometry={pointsGeometry}>
      <pointsMaterial
        size={1.5}
        vertexColors
        sizeAttenuation
        transparent
        opacity={0.9}
      />
    </points>
  );
}
