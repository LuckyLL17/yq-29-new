import { Suspense, useRef, useEffect, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, Html, Center } from '@react-three/drei';
import { EffectComposer, Bloom, SSAO } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useAppStore } from '@/store/useAppStore';
import { ModelMesh } from './ModelMesh';
import { LayeredModelMesh } from './LayeredModelMesh';
import { splitModel } from '@/utils/layerSplitter';
import { DiffModelMesh } from './DiffModelMesh';
import { DiffColorLegend } from './DiffColorLegend';
import { DrainHolesDisplay } from './DrainHolesDisplay';
import { ThicknessSamplesDisplay } from './ThicknessSamplesDisplay';
import { ThicknessColorLegend } from './ThicknessColorLegend';
import { SectionPlane } from './SectionPlane';
import { SectionContour } from './SectionContour';
import { Annotations3D } from './Annotations3D';
import { AnnotationInteraction } from './AnnotationInteraction';
import { DrainHoleInteraction } from './DrainHoleInteraction';
import { UndercutRegionsDisplay } from './UndercutRegionsDisplay';
import { TextAnnotationDialog } from '@/components/dialogs/TextAnnotationDialog';
import { HoleArrayDialog } from '@/components/dialogs/HoleArrayDialog';
import { createSampleBoxModel } from '@/utils/modelLoader';
import { useAnalysisWorker } from '@/hooks/useAnalysisWorker';

function SceneBackground() {
  const isDarkMode = useAppStore((state) => state.isDarkMode);
  const { scene, gl } = useThree();

  useEffect(() => {
    const bgColor = isDarkMode ? '#0f172a' : '#e2e8f0';
    const fogColor = isDarkMode ? '#0f172a' : '#e2e8f0';
    scene.background = new THREE.Color(bgColor);
    if (scene.fog instanceof THREE.Fog) {
      scene.fog.color.set(fogColor);
    }
  }, [isDarkMode, scene]);

  return null;
}

function SceneClippingSetup() {
  const { gl, scene } = useThree();
  const analysisMode = useAppStore((state) => state.analysisMode);
  const sectionPlane = useAppStore((state) => state.sectionPlane);
  const model = useAppStore((state) => state.model);

  const displayModel = model || createSampleBoxModel();

  useEffect(() => {
    if (analysisMode === 'section' && sectionPlane.visible) {
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

      const worldPos = sectionPlane.position;
      const plane = new THREE.Plane(normal, -worldPos);
      gl.clippingPlanes = [plane];
      gl.localClippingEnabled = true;
    } else {
      gl.clippingPlanes = [];
      gl.localClippingEnabled = false;
    }

    return () => {
      gl.clippingPlanes = [];
      gl.localClippingEnabled = false;
    };
  }, [analysisMode, sectionPlane.axis, sectionPlane.position, sectionPlane.visible, gl, displayModel]);

  return null;
}

function CompareScene() {
  const model = useAppStore((state) => state.model);
  const model2 = useAppStore((state) => state.model2);
  const modelFileName = useAppStore((state) => state.modelFileName);
  const model2FileName = useAppStore((state) => state.model2FileName);
  const compareMode = useAppStore((state) => state.compareMode);
  const modelDiffResult = useAppStore((state) => state.modelDiffResult);
  const model1Color = useAppStore((state) => state.model1Color);
  const model2Color = useAppStore((state) => state.model2Color);
  const model1Opacity = useAppStore((state) => state.model1Opacity);
  const model2Opacity = useAppStore((state) => state.model2Opacity);
  const showGrid = useAppStore((state) => state.showGrid);
  const showAxes = useAppStore((state) => state.showAxes);
  const visualizationMode = useAppStore((state) => state.visualizationMode);
  const isDarkMode = useAppStore((state) => state.isDarkMode);
  const layersEnabled = useAppStore((state) => state.layersEnabled);
  const layerSplitStrategy = useAppStore((state) => state.layerSplitStrategy);

  const displayModel = model || createSampleBoxModel();
  const displayModel2 = model2 || createSampleBoxModel();

  const model2Layers = useMemo(() => {
    if (!layersEnabled) return [];
    try {
      return splitModel(displayModel2, layerSplitStrategy);
    } catch (e) {
      console.error('Failed to split model 2:', e);
      return [];
    }
  }, [layersEnabled, displayModel2, layerSplitStrategy]);

  const offsetX = useMemo(() => {
    if (compareMode !== 'sidebyside') return 0;
    const maxSize = Math.max(
      displayModel.boundingBox.size.x,
      displayModel2.boundingBox.size.x
    );
    return maxSize * 0.8;
  }, [compareMode, displayModel.boundingBox.size.x, displayModel2.boundingBox.size.x]);

  const model1LabelY = displayModel.boundingBox.size.y / 2 + 15;
  const model2LabelY = displayModel2.boundingBox.size.y / 2 + 15;

  const model2DiffMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(model2Color),
      metalness: 0.2,
      roughness: 0.6,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      wireframe: visualizationMode === 'wireframe',
    });
  }, [model2Color, visualizationMode]);

  const gridY = -Math.max(displayModel.boundingBox.size.y, displayModel2.boundingBox.size.y) / 2 - 1;

  const model1Label = modelFileName ? modelFileName.split('.')[0] : '模型1';
  const model2Label = model2FileName ? model2FileName.split('.')[0] : '模型2';

  return (
    <>
      <SceneClippingSetup />
      <SceneBackground />
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[100, 150, 100]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight position={[-80, 60, -80]} intensity={0.5} />
      <pointLight position={[0, 80, 0]} intensity={0.3} color="#06b6d4" />

      {compareMode === 'diffcolormap' && modelDiffResult ? (
        <group>
          <DiffModelMesh model={displayModel} diffResult={modelDiffResult} position={[-offsetX, 0, 0]} />
          {model2 && (
            <LayeredModelMesh
              model={displayModel2}
              layers={model2Layers}
              position={[offsetX, 0, 0]}
              baseColor={model2Color}
              baseOpacity={0.2}
              enableAnalysisOverlay={false}
            />
          )}
          <Html position={[-offsetX, model1LabelY, 0]} center distanceFactor={100} style={{ pointerEvents: 'none' }}>
            <div style={{
              padding: '6px 16px',
              background: 'rgba(239, 68, 68, 0.9)',
              color: 'white',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              border: '2px solid rgba(255,255,255,0.3)',
            }}>
              {model1Label} (差异色)
            </div>
          </Html>
          {model2 && (
            <Html position={[offsetX, model2LabelY, 0]} center distanceFactor={100} style={{ pointerEvents: 'none' }}>
              <div style={{
                padding: '6px 16px',
                background: model2Color,
                color: 'white',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                border: '2px solid rgba(255,255,255,0.3)',
                opacity: 0.7,
              }}>
                {model2Label} (参考)
              </div>
            </Html>
          )}
          <Annotations3D />
        </group>
      ) : (
        <group>
          <LayeredModelMesh
            model={displayModel}
            position={[-offsetX, 0, 0]}
            baseColor={model1Color}
            baseOpacity={model1Opacity}
            enableAnalysisOverlay={false}
          />
          {model2 && (
            <LayeredModelMesh
              model={displayModel2}
              layers={model2Layers}
              position={[offsetX, 0, 0]}
              baseColor={model2Color}
              baseOpacity={model2Opacity}
              enableAnalysisOverlay={false}
            />
          )}
          <Html position={[-offsetX, model1LabelY, 0]} center distanceFactor={100} style={{ pointerEvents: 'none' }}>
            <div style={{
              padding: '6px 16px',
              background: model1Color,
              color: 'white',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              border: '2px solid rgba(255,255,255,0.3)',
            }}>
              {model1Label}
            </div>
          </Html>
          {model2 && (
            <Html position={[offsetX, model2LabelY, 0]} center distanceFactor={100} style={{ pointerEvents: 'none' }}>
              <div style={{
                padding: '6px 16px',
                background: model2Color,
                color: 'white',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                border: '2px solid rgba(255,255,255,0.3)',
              }}>
                {model2Label}
              </div>
            </Html>
          )}
          <Annotations3D />
        </group>
      )}

      <AnnotationInteraction />
      <DrainHoleInteraction />

      {showGrid && (
        <Grid
          position={[0, gridY, 0]}
          args={[400, 400]}
          cellSize={5}
          cellThickness={0.5}
          cellColor={isDarkMode ? '#1e293b' : '#cbd5e1'}
          sectionSize={25}
          sectionThickness={1}
          sectionColor={isDarkMode ? '#334155' : '#94a3b8'}
          fadeDistance={500}
          fadeStrength={1}
          followCamera={false}
          infiniteGrid
        />
      )}

      {showAxes && (
        <>
          <axesHelper args={[50]} position={[-80 - offsetX, gridY + 1, -60]} />
          {compareMode === 'sidebyside' && model2 && (
            <axesHelper args={[50]} position={[-80 + offsetX, gridY + 1, -60]} />
          )}
        </>
      )}

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={30}
        maxDistance={800}
        autoRotate={false}
        autoRotateSpeed={0.5}
      />

      <EffectComposer>
        <Bloom
          intensity={0.3}
          luminanceThreshold={0.9}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

function Scene() {
  const model = useAppStore((state) => state.model);
  const analysisMode = useAppStore((state) => state.analysisMode);
  const drainHoleResult = useAppStore((state) => state.drainHoleResult);
  const wallThicknessResult = useAppStore((state) => state.wallThicknessResult);
  const thicknessColorScheme = useAppStore((state) => state.thicknessColorScheme);
  const showThicknessHeatmap = useAppStore((state) => state.showThicknessHeatmap);
  const sectionResult = useAppStore((state) => state.sectionResult);
  const sectionPlane = useAppStore((state) => state.sectionPlane);
  const sectionThicknessResolution = useAppStore((state) => state.sectionThicknessResolution);
  const setSectionResult = useAppStore((state) => state.setSectionResult);
  const showGrid = useAppStore((state) => state.showGrid);
  const showAxes = useAppStore((state) => state.showAxes);
  const autoRotate = useAppStore((state) => state.autoRotate);
  const layersEnabled = useAppStore((state) => state.layersEnabled);
  const modelLayers = useAppStore((state) => state.modelLayers);
  const layerSplitStrategy = useAppStore((state) => state.layerSplitStrategy);
  const setModelLayers = useAppStore((state) => state.setModelLayers);
  const draftAngleResult = useAppStore((state) => state.draftAngleResult);
  const highlightUndercuts = useAppStore((state) => state.highlightUndercuts);
  const selectedUndercutRegionId = useAppStore((state) => state.selectedUndercutRegionId);
  const cameraFocusTarget = useAppStore((state) => state.cameraFocusTarget);
  const setSelectedUndercutRegionId = useAppStore((state) => state.setSelectedUndercutRegionId);
  const setCameraFocusTarget = useAppStore((state) => state.setCameraFocusTarget);
  const { runAnalysis } = useAnalysisWorker();

  const displayModel = model || createSampleBoxModel();

  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  const focusAnimRef = useRef<{ target: THREE.Vector3; progress: number } | null>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (layersEnabled && displayModel && modelLayers.length === 0) {
      try {
        const layers = splitModel(displayModel, layerSplitStrategy);
        setModelLayers(layers);
      } catch (e) {
        console.error('Failed to split model:', e);
      }
    }
  }, [layersEnabled, displayModel, layerSplitStrategy, modelLayers.length, setModelLayers]);

  const computeSectionAsync = useCallback(async () => {
    if (analysisMode !== 'section' || !displayModel || !sectionPlane.visible) return;

    try {
      const result = await runAnalysis('section', {
        model: displayModel,
        plane: sectionPlane,
        thicknessResolution: sectionThicknessResolution,
      });
      setSectionResult(result);
    } catch (e) {
      console.error('Section computation failed:', e);
    }
  }, [analysisMode, displayModel, sectionPlane, sectionThicknessResolution, runAnalysis, setSectionResult]);

  useEffect(() => {
    if (analysisMode !== 'section' || !displayModel || !sectionPlane.visible) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(() => {
      computeSectionAsync();
    }, 100);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [sectionPlane.position, sectionPlane.axis, analysisMode, displayModel, sectionPlane.visible, sectionThicknessResolution, computeSectionAsync]);

  useEffect(() => {
    if (cameraFocusTarget && controlsRef.current) {
      const target = new THREE.Vector3(
        cameraFocusTarget.x,
        cameraFocusTarget.y,
        cameraFocusTarget.z
      );
      focusAnimRef.current = {
        target,
        progress: 0,
      };
    }
  }, [cameraFocusTarget]);

  useFrame((_, delta) => {
    if (focusAnimRef.current && controlsRef.current) {
      focusAnimRef.current.progress += delta * 2;
      const t = Math.min(focusAnimRef.current.progress, 1);
      const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      const currentTarget = new THREE.Vector3();
      controlsRef.current.target.clone(currentTarget);
      
      const newTarget = currentTarget.lerp(focusAnimRef.current.target, easeT);
      controlsRef.current.target.copy(newTarget);

      const offset = new THREE.Vector3(0, 30, 60);
      const desiredCamPos = newTarget.clone().add(offset);
      camera.position.lerp(desiredCamPos, easeT * 0.5);

      if (t >= 1) {
        focusAnimRef.current = null;
        setCameraFocusTarget(null);
      }
    }
  });

  const handleRegionClick = (regionId: string) => {
    if (selectedUndercutRegionId === regionId) {
      setSelectedUndercutRegionId(null);
    } else {
      setSelectedUndercutRegionId(regionId);
    }
  };

  return (
    <>
      <SceneClippingSetup />
      <SceneBackground />
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[100, 150, 100]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight position={[-80, 60, -80]} intensity={0.5} />
      <pointLight position={[0, 80, 0]} intensity={0.3} color="#06b6d4" />

      <group>
        {layersEnabled ? (
          <LayeredModelMesh
            model={{
              vertices: displayModel.vertices,
              indices: displayModel.indices,
              normals: displayModel.normals,
            }}
          />
        ) : (
          <ModelMesh
            model={{
              vertices: displayModel.vertices,
              indices: displayModel.indices,
              normals: displayModel.normals,
            }}
          />
        )}

        {analysisMode === 'holes' && drainHoleResult && (
          <DrainHolesDisplay holes={drainHoleResult.holes} />
        )}

        {analysisMode === 'thickness' && wallThicknessResult && (
          <ThicknessSamplesDisplay
            samples={wallThicknessResult.samples}
            minThickness={wallThicknessResult.minThickness}
            maxThickness={wallThicknessResult.maxThickness}
            colorScheme={thicknessColorScheme}
            visible={!showThicknessHeatmap}
          />
        )}

        {analysisMode === 'draft' && draftAngleResult && highlightUndercuts && draftAngleResult.undercutRegions.length > 0 && (
          <UndercutRegionsDisplay
            regions={draftAngleResult.undercutRegions}
            selectedRegionId={selectedUndercutRegionId}
            vertices={displayModel.vertices}
            indices={displayModel.indices}
            onRegionClick={handleRegionClick}
          />
        )}

        {analysisMode === 'section' && (
          <>
            <SectionPlane
              modelSize={displayModel.boundingBox.size}
              modelCenter={displayModel.boundingBox.center}
            />
            <SectionContour result={sectionResult} />
          </>
        )}

        <Annotations3D />
      </group>

      <AnnotationInteraction />
      <DrainHoleInteraction />

      {showGrid && (
        <Grid
          position={[0, -displayModel.boundingBox.size.y / 2 - 1, 0]}
          args={[200, 200]}
          cellSize={5}
          cellThickness={0.5}
          cellColor={useAppStore.getState().isDarkMode ? '#1e293b' : '#cbd5e1'}
          sectionSize={25}
          sectionThickness={1}
          sectionColor={useAppStore.getState().isDarkMode ? '#334155' : '#94a3b8'}
          fadeDistance={300}
          fadeStrength={1}
          followCamera={false}
          infiniteGrid
        />
      )}

      {showAxes && <axesHelper args={[50]} position={[-80, -displayModel.boundingBox.size.y / 2, -60]} />}

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={30}
        maxDistance={500}
        autoRotate={autoRotate}
        autoRotateSpeed={0.5}
      />

      <EffectComposer>
        <Bloom
          intensity={0.3}
          luminanceThreshold={0.9}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

export function ModelViewer() {
  const isLoading = useAppStore((state) => state.isLoading);
  const analysisMode = useAppStore((state) => state.analysisMode);
  const modelDiffResult = useAppStore((state) => state.modelDiffResult);
  const wallThicknessResult = useAppStore((state) => state.wallThicknessResult);
  const annotationTool = useAppStore((state) => state.annotationTool);

  return (
    <div className="w-full h-full relative bg-surface-base">
      <Canvas
        shadows
        camera={{ position: [120, 100, 120], fov: 45 }}
        gl={{ antialias: true, alpha: false, localClippingEnabled: true }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#0f172a']} />
        <fog attach="fog" args={['#0f172a', 200, 500]} />
        <SceneBackground />
        <Suspense fallback={null}>
          {analysisMode === 'compare' ? <CompareScene /> : <Scene />}
        </Suspense>
      </Canvas>

      <TextAnnotationDialog />
      <HoleArrayDialog />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-panel/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
            <p className="text-cyan-400 font-medium">正在计算分析...</p>
          </div>
        </div>
      )}

      {analysisMode === 'compare' && modelDiffResult && (
        <DiffColorLegend
          minDistance={modelDiffResult.minDistance}
          maxDistance={modelDiffResult.maxDistance}
        />
      )}

      {analysisMode === 'thickness' && wallThicknessResult && (
        <ThicknessColorLegend
          minThickness={wallThicknessResult.minThickness}
          maxThickness={wallThicknessResult.maxThickness}
          avgThickness={wallThicknessResult.avgThickness}
        />
      )}

      {annotationTool !== 'none' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-emerald-600/90 backdrop-blur-sm rounded-lg text-sm text-white font-medium shadow-lg border border-emerald-400/30">
          标注模式: {{
            text: '文字标注 - 点击添加',
            arrow: '箭头标注 - 点击两点',
            dimension: '尺寸标注 - 点击两点',
            freehand: '自由笔画 - 按住拖动',
          }[annotationTool]}
        </div>
      )}

      <div className="absolute bottom-4 left-4 flex gap-2">
        <div className="px-3 py-1.5 bg-surface-elevated/90 backdrop-blur-sm rounded-lg text-xs text-content-muted border border-edge-subtle">
          左键旋转 | 右键平移 | 滚轮缩放
        </div>
      </div>
    </div>
  );
}
