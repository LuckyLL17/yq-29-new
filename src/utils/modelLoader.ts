import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import type { ModelData } from '@/types';
import { geometryToModelData } from './geometry';

export async function loadModelFromFile(file: File): Promise<ModelData> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result;
        if (!content) {
          reject(new Error('无法读取文件内容'));
          return;
        }

        let geometry: THREE.BufferGeometry;

        if (extension === 'stl') {
          const loader = new STLLoader();
          geometry = loader.parse(content as ArrayBuffer);
        } else if (extension === 'obj') {
          const loader = new OBJLoader();
          const object = loader.parse(content as string);
          let firstGeometry: THREE.BufferGeometry | null = null;
          object.traverse((child) => {
            if (child instanceof THREE.Mesh && child.geometry) {
              firstGeometry = child.geometry;
            }
          });
          if (!firstGeometry) {
            reject(new Error('OBJ文件中未找到几何体'));
            return;
          }
          geometry = firstGeometry;
        } else {
          reject(new Error(`不支持的文件格式: ${extension}`));
          return;
        }

        geometry.center();
        geometry.computeVertexNormals();

        const modelData = geometryToModelData(geometry, file.name);
        resolve(modelData);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };

    if (extension === 'stl') {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  });
}

export function createSampleBowlModel(): ModelData {
  const geometry = new THREE.CylinderGeometry(30, 50, 40, 32, 1, true);
  geometry.translate(0, 20, 0);

  const bottomGeometry = new THREE.CircleGeometry(30, 32);
  bottomGeometry.rotateX(-Math.PI / 2);
  bottomGeometry.translate(0, 0, 0);

  const mergedGeometry = mergeGeometries([geometry, bottomGeometry]);
  mergedGeometry.computeVertexNormals();
  mergedGeometry.center();

  return geometryToModelData(mergedGeometry, '示例碗状模型');
}

export function createSampleBoxModel(): ModelData {
  const shape = new THREE.Shape();
  const outerWidth = 100;
  const outerDepth = 80;
  const innerWidth = 96;
  const innerDepth = 76;
  const height = 50;

  shape.moveTo(-outerWidth / 2, -outerDepth / 2);
  shape.lineTo(outerWidth / 2, -outerDepth / 2);
  shape.lineTo(outerWidth / 2, outerDepth / 2);
  shape.lineTo(-outerWidth / 2, outerDepth / 2);
  shape.lineTo(-outerWidth / 2, -outerDepth / 2);

  const holePath = new THREE.Path();
  holePath.moveTo(-innerWidth / 2, -innerDepth / 2);
  holePath.lineTo(innerWidth / 2, -innerDepth / 2);
  holePath.lineTo(innerWidth / 2, innerDepth / 2);
  holePath.lineTo(-innerWidth / 2, innerDepth / 2);
  holePath.lineTo(-innerWidth / 2, -innerDepth / 2);
  shape.holes.push(holePath);

  const extrudeSettings = {
    steps: 1,
    depth: height,
    bevelEnabled: false,
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geometry.rotateX(-Math.PI / 2);
  geometry.computeVertexNormals();
  geometry.center();

  return geometryToModelData(geometry, '示例盒状模型');
}

function mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const mergedGeometry = new THREE.BufferGeometry();

  let vertexCount = 0;
  let indexCount = 0;

  for (const geo of geometries) {
    vertexCount += geo.attributes.position.count;
    if (geo.index) {
      indexCount += geo.index.count;
    } else {
      indexCount += geo.attributes.position.count;
    }
  }

  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const indices = new Uint32Array(indexCount);

  let vertexOffset = 0;
  let indexOffset = 0;

  for (const geo of geometries) {
    const pos = geo.attributes.position.array as Float32Array;
    positions.set(pos, vertexOffset * 3);

    if (geo.attributes.normal) {
      const norm = geo.attributes.normal.array as Float32Array;
      normals.set(norm, vertexOffset * 3);
    }

    if (geo.index) {
      const idx = geo.index.array as Uint32Array;
      for (let i = 0; i < idx.length; i++) {
        indices[indexOffset + i] = idx[i] + vertexOffset;
      }
      indexOffset += idx.length;
    } else {
      for (let i = 0; i < geo.attributes.position.count; i++) {
        indices[indexOffset + i] = i + vertexOffset;
      }
      indexOffset += geo.attributes.position.count;
    }

    vertexOffset += geo.attributes.position.count;
  }

  mergedGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  mergedGeometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  mergedGeometry.setIndex(new THREE.BufferAttribute(indices, 1));

  return mergedGeometry;
}
