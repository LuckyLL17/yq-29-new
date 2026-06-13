import { create } from 'zustand';
import { estimateSurfaceArea, checkHoleCollision, autoAvoidCollision, generateRectangleArray, generateCircleArray } from '@/utils/drainHoles';
import type {
  ModelData,
  DraftAngleResult,
  WallThicknessResult,
  DrainHoleResult,
  DrainHole,
  MoldingCycleResult,
  MoldingCycleParameters,
  AnalysisMode,
  VisualizationMode,
  Vector3,
  SectionPlane,
  SectionResult,
  SectionAxis,
  CompareMode,
  ModelDiffResult,
  Annotation,
  AnnotationTool,
  AnnotationStyle,
  ModelLayer,
  LayerSplitStrategy,
  LayerSplitAxis,
  ThicknessColorScheme,
  HoleEditMode,
  ArrayDialogState,
  ArrayPatternType,
  ToastMessage,
  ToastType,
} from '@/types';

export type DialogType = 'none' | 'project' | 'settings' | 'help';

interface AppState {
  model: ModelData | null;
  modelFileName: string;
  model2: ModelData | null;
  model2FileName: string;
  isLoading: boolean;
  analysisMode: AnalysisMode;
  visualizationMode: VisualizationMode;
  compareMode: CompareMode;
  modelDiffResult: ModelDiffResult | null;
  model1Opacity: number;
  model2Opacity: number;
  model1Color: string;
  model2Color: string;
  isDarkMode: boolean;
  activeDialog: DialogType;
  toasts: ToastMessage[];

  draftAngleThreshold: number;
  draftDirection: Vector3;
  draftAngleResult: DraftAngleResult | null;
  selectedUndercutRegionId: string | null;
  highlightUndercuts: boolean;
  cameraFocusTarget: Vector3 | null;

  wallThicknessResult: WallThicknessResult | null;
  thicknessSampleCount: number;
  thicknessColorScheme: ThicknessColorScheme;
  showThicknessHeatmap: boolean;
  focusThicknessTarget: Vector3 | null;

  drainHoleResult: DrainHoleResult | null;
  holeDiameter: number;
  holeSpacing: number;
  holeDepth: number;
  selectedHoleId: string | null;
  holeEditMode: HoleEditMode;
  collisionEnabled: boolean;
  arrayDialog: ArrayDialogState;

  cycleParameters: MoldingCycleParameters;
  cycleResult: MoldingCycleResult | null;

  showGrid: boolean;
  showAxes: boolean;
  autoRotate: boolean;

  annotations: Annotation[];
  annotationTool: AnnotationTool;
  annotationStyle: AnnotationStyle;
  selectedAnnotationId: string | null;
  isDrawingFreehand: boolean;
  textAnnotationPrompt: {
    open: boolean;
    pendingPosition: Vector3 | null;
  };

  sectionPlane: SectionPlane;
  sectionResult: SectionResult | null;
  sectionThicknessResolution: number;

  setModel: (model: ModelData | null, fileName?: string) => void;
  setModel2: (model: ModelData | null, fileName?: string) => void;
  setIsLoading: (loading: boolean) => void;
  setAnalysisMode: (mode: AnalysisMode) => void;
  setVisualizationMode: (mode: VisualizationMode) => void;
  setCompareMode: (mode: CompareMode) => void;
  setModelDiffResult: (result: ModelDiffResult | null) => void;
  setModel1Opacity: (opacity: number) => void;
  setModel2Opacity: (opacity: number) => void;
  setModel1Color: (color: string) => void;
  setModel2Color: (color: string) => void;

  setDraftAngleThreshold: (threshold: number) => void;
  setDraftDirection: (direction: Vector3) => void;
  setDraftAngleResult: (result: DraftAngleResult | null) => void;
  setSelectedUndercutRegionId: (id: string | null) => void;
  setHighlightUndercuts: (highlight: boolean) => void;
  setCameraFocusTarget: (target: Vector3 | null) => void;
  focusOnUndercutRegion: (regionId: string) => void;

  setWallThicknessResult: (result: WallThicknessResult | null) => void;
  setThicknessSampleCount: (count: number) => void;
  setThicknessColorScheme: (scheme: ThicknessColorScheme) => void;
  setShowThicknessHeatmap: (show: boolean) => void;
  setFocusThicknessTarget: (target: Vector3 | null) => void;
  focusOnThinnestPoint: () => void;
  focusOnThickestPoint: () => void;

  setDrainHoleResult: (result: DrainHoleResult | null) => void;
  setHoleDiameter: (diameter: number) => void;
  setHoleSpacing: (spacing: number) => void;
  setHoleDepth: (depth: number) => void;
  setSelectedHoleId: (id: string | null) => void;
  setHoleEditMode: (mode: HoleEditMode) => void;
  setCollisionEnabled: (enabled: boolean) => void;
  addDrainHole: (hole: Partial<DrainHole>, skipCollision?: boolean) => void;
  removeDrainHole: (id: string) => void;
  updateDrainHole: (id: string, updates: Partial<DrainHole>, skipCollision?: boolean) => void;
  addDrainHoles: (holes: DrainHole[]) => void;
  clearDrainHoles: () => void;
  openArrayDialog: (patternType: ArrayPatternType) => void;
  closeArrayDialog: () => void;
  generateArray: (params: any) => void;

  setCycleParameters: (params: Partial<MoldingCycleParameters>) => void;
  setCycleResult: (result: MoldingCycleResult | null) => void;

  setSectionPlane: (plane: Partial<SectionPlane>) => void;
  setSectionResult: (result: SectionResult | null) => void;
  setSectionAxis: (axis: SectionAxis) => void;
  setSectionPosition: (position: number) => void;
  setSectionThicknessResolution: (resolution: number) => void;
  toggleSectionVisible: () => void;

  setShowGrid: (show: boolean) => void;
  setShowAxes: (show: boolean) => void;
  setAutoRotate: (auto: boolean) => void;
  toggleDarkMode: () => void;
  setActiveDialog: (dialog: DialogType) => void;
  closeDialog: () => void;
  showToast: (type: ToastType, message: string, duration?: number) => void;
  hideToast: (id: string) => void;

  addAnnotation: (annotation: Annotation) => void;
  removeAnnotation: (id: string) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  setAnnotationTool: (tool: AnnotationTool) => void;
  setAnnotationStyle: (style: Partial<AnnotationStyle>) => void;
  setSelectedAnnotationId: (id: string | null) => void;
  setIsDrawingFreehand: (drawing: boolean) => void;
  clearAnnotations: () => void;
  openTextAnnotationPrompt: (position: Vector3) => void;
  closeTextAnnotationPrompt: () => void;
  confirmTextAnnotation: (text: string) => void;

  resetAnalysis: () => void;

  modelLayers: ModelLayer[];
  layerSplitStrategy: LayerSplitStrategy;
  layerExplosionAmount: number;
  isLayerExploded: boolean;
  layersEnabled: boolean;

  setLayersEnabled: (enabled: boolean) => void;
  setModelLayers: (layers: ModelLayer[]) => void;
  setLayerSplitStrategy: (strategy: LayerSplitStrategy) => void;
  updateLayer: (id: string, updates: Partial<ModelLayer>) => void;
  setLayerVisibility: (id: string, visible: boolean) => void;
  setLayerOpacity: (id: string, opacity: number) => void;
  setLayerColor: (id: string, color: string) => void;
  setLayerExplosionAmount: (amount: number) => void;
  setIsLayerExploded: (exploded: boolean) => void;
  toggleLayerVisibility: (id: string) => void;
  showAllLayers: () => void;
  hideAllLayers: () => void;
  resetLayerColors: () => void;
  resetLayers: () => void;
  explodeLayersByAxis: (axis: LayerSplitAxis) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  model: null,
  modelFileName: '',
  model2: null,
  model2FileName: '',
  isLoading: false,
  analysisMode: 'none',
  visualizationMode: 'solid',
  compareMode: 'overlay',
  modelDiffResult: null,
  model1Opacity: 0.85,
  model2Opacity: 0.45,
  model1Color: '#6b8e9e',
  model2Color: '#e07a5f',

  draftAngleThreshold: 5,
  draftDirection: { x: 0, y: 1, z: 0 },
  draftAngleResult: null,
  selectedUndercutRegionId: null,
  highlightUndercuts: true,
  cameraFocusTarget: null,

  wallThicknessResult: null,
  thicknessSampleCount: 500,
  thicknessColorScheme: 'rainbow',
  showThicknessHeatmap: true,
  focusThicknessTarget: null,

  drainHoleResult: null,
  holeDiameter: 2,
  holeSpacing: 15,
  holeDepth: 5,
  selectedHoleId: null,
  holeEditMode: 'none',
  collisionEnabled: true,
  arrayDialog: {
    open: false,
    patternType: 'rectangle',
  },

  cycleParameters: {
    materialType: '甘蔗浆',
    targetThickness: 1.5,
    temperature: 180,
    pressure: 0.6,
    pulpConcentration: 1.2,
    vacuumDegree: -0.06,
  },
  cycleResult: null,

  showGrid: true,
  showAxes: true,
  autoRotate: false,
  isDarkMode: true,
  activeDialog: 'none',
  toasts: [],

  annotations: [],
  annotationTool: 'none',
  annotationStyle: {
    color: '#00ff88',
    fontSize: 3,
    fontFamily: 'sans-serif',
    lineWidth: 1,
  },
  selectedAnnotationId: null,
  isDrawingFreehand: false,
  textAnnotationPrompt: {
    open: false,
    pendingPosition: null,
  },

  sectionPlane: {
    axis: 'y',
    position: 0,
    visible: false,
  },
  sectionResult: null,
  sectionThicknessResolution: 50,

  modelLayers: [],
  layerSplitStrategy: { type: 'axis', axis: 'y', count: 4 },
  layerExplosionAmount: 20,
  isLayerExploded: false,
  layersEnabled: false,

  setLayersEnabled: (enabled) => set({ layersEnabled: enabled }),
  setModelLayers: (layers) => set({ modelLayers: layers }),
  setLayerSplitStrategy: (strategy) => set({ layerSplitStrategy: strategy }),
  updateLayer: (id, updates) =>
    set((state) => ({
      modelLayers: state.modelLayers.map((layer) =>
        layer.id === id ? { ...layer, ...updates } : layer
      ),
    })),
  setLayerVisibility: (id, visible) =>
    set((state) => ({
      modelLayers: state.modelLayers.map((layer) =>
        layer.id === id ? { ...layer, visible } : layer
      ),
    })),
  setLayerOpacity: (id, opacity) =>
    set((state) => ({
      modelLayers: state.modelLayers.map((layer) =>
        layer.id === id ? { ...layer, opacity } : layer
      ),
    })),
  setLayerColor: (id, color) =>
    set((state) => ({
      modelLayers: state.modelLayers.map((layer) =>
        layer.id === id ? { ...layer, color } : layer
      ),
    })),
  setLayerExplosionAmount: (amount) => {
    set({ layerExplosionAmount: amount });
    const isLayerExploded = get().isLayerExploded;
    if (isLayerExploded) {
      const model = get().model;
      if (model) {
        const strategy = get().layerSplitStrategy;
        const layers = get().modelLayers;
        const axis = strategy.type === 'axis' ? strategy.axis : 'y';
        const center = model.boundingBox.center;
        const axisIdx = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
        set({
          modelLayers: layers.map((layer) => {
            const layerCenter = layer.boundingBox.center;
            const centerArr = [center.x, center.y, center.z];
            const layerCenterArr = [layerCenter.x, layerCenter.y, layerCenter.z];
            const delta = layerCenterArr[axisIdx] - centerArr[axisIdx];
            const offset = { x: 0, y: 0, z: 0 };
            if (axis === 'x') offset.x = delta > 0 ? amount : delta < 0 ? -amount : 0;
            else if (axis === 'y') offset.y = delta > 0 ? amount : delta < 0 ? -amount : 0;
            else offset.z = delta > 0 ? amount : delta < 0 ? -amount : 0;
            return { ...layer, explosionOffset: offset };
          }),
        });
      }
    }
  },
  setIsLayerExploded: (exploded) => {
    const amount = get().layerExplosionAmount;
    const model = get().model;
    const strategy = get().layerSplitStrategy;
    const layers = get().modelLayers;
    if (exploded && model) {
      const axis = strategy.type === 'axis' ? strategy.axis : 'y';
      const center = model.boundingBox.center;
      const axisIdx = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
      set({
        isLayerExploded: true,
        modelLayers: layers.map((layer) => {
          const layerCenter = layer.boundingBox.center;
          const centerArr = [center.x, center.y, center.z];
          const layerCenterArr = [layerCenter.x, layerCenter.y, layerCenter.z];
          const delta = layerCenterArr[axisIdx] - centerArr[axisIdx];
          const offset = { x: 0, y: 0, z: 0 };
          if (axis === 'x') offset.x = delta > 0 ? amount : delta < 0 ? -amount : 0;
          else if (axis === 'y') offset.y = delta > 0 ? amount : delta < 0 ? -amount : 0;
          else offset.z = delta > 0 ? amount : delta < 0 ? -amount : 0;
          return { ...layer, explosionOffset: offset };
        }),
      });
    } else {
      set({
        isLayerExploded: false,
        modelLayers: layers.map((layer) => ({
          ...layer,
          explosionOffset: { x: 0, y: 0, z: 0 },
        })),
      });
    }
  },
  toggleLayerVisibility: (id) =>
    set((state) => ({
      modelLayers: state.modelLayers.map((layer) =>
        layer.id === id ? { ...layer, visible: !layer.visible } : layer
      ),
    })),
  showAllLayers: () =>
    set((state) => ({
      modelLayers: state.modelLayers.map((layer) => ({ ...layer, visible: true })),
    })),
  hideAllLayers: () =>
    set((state) => ({
      modelLayers: state.modelLayers.map((layer) => ({ ...layer, visible: false })),
    })),
  resetLayerColors: () => {
    const palette = ['#6b8e9e', '#e07a5f', '#81b29a', '#f2cc8f', '#3d405b', '#e07a9a', '#56a3a6', '#c8b6ff', '#f0a88a', '#45b7d1', '#96ceb4', '#ffeaa7'];
    set((state) => ({
      modelLayers: state.modelLayers.map((layer, i) => ({
        ...layer,
        color: palette[i % palette.length],
      })),
    }));
  },
  resetLayers: () =>
    set({
      modelLayers: [],
      layerExplosionAmount: 20,
      isLayerExploded: false,
      layersEnabled: false,
    }),
  explodeLayersByAxis: (axis) => {
    const amount = get().layerExplosionAmount;
    const model = get().model;
    const layers = get().modelLayers;
    const currentStrategy = get().layerSplitStrategy;
    if (model && layers.length > 0) {
      const center = model.boundingBox.center;
      const axisIdx = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
      set({
        isLayerExploded: true,
        layerSplitStrategy: { type: 'axis', axis, count: currentStrategy.type === 'axis' ? currentStrategy.count : 4 },
        modelLayers: layers.map((layer) => {
          const layerCenter = layer.boundingBox.center;
          const centerArr = [center.x, center.y, center.z];
          const layerCenterArr = [layerCenter.x, layerCenter.y, layerCenter.z];
          const delta = layerCenterArr[axisIdx] - centerArr[axisIdx];
          const offset = { x: 0, y: 0, z: 0 };
          if (axis === 'x') offset.x = delta > 0 ? amount : delta < 0 ? -amount : 0;
          else if (axis === 'y') offset.y = delta > 0 ? amount : delta < 0 ? -amount : 0;
          else offset.z = delta > 0 ? amount : delta < 0 ? -amount : 0;
          return { ...layer, explosionOffset: offset };
        }),
      });
    }
  },

  setModel: (model, fileName = '') =>
    set({ model, modelFileName: fileName, draftAngleResult: null, wallThicknessResult: null, drainHoleResult: null, cycleResult: null, sectionResult: null, modelDiffResult: null }),
  setModel2: (model2, fileName = '') =>
    set({ model2, model2FileName: fileName, modelDiffResult: null }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setAnalysisMode: (mode) => set({ analysisMode: mode }),
  setVisualizationMode: (mode) => set({ visualizationMode: mode }),
  setCompareMode: (mode) => set({ compareMode: mode }),
  setModelDiffResult: (result) => set({ modelDiffResult: result }),
  setModel1Opacity: (opacity) => set({ model1Opacity: opacity }),
  setModel2Opacity: (opacity) => set({ model2Opacity: opacity }),
  setModel1Color: (color) => set({ model1Color: color }),
  setModel2Color: (color) => set({ model2Color: color }),

  setDraftAngleThreshold: (threshold) => set({ draftAngleThreshold: threshold }),
  setDraftDirection: (direction) => set({ draftDirection: direction }),
  setDraftAngleResult: (result) => set({ draftAngleResult: result, selectedUndercutRegionId: null }),
  setSelectedUndercutRegionId: (id) => set({ selectedUndercutRegionId: id }),
  setHighlightUndercuts: (highlight) => set({ highlightUndercuts: highlight }),
  setCameraFocusTarget: (target) => set({ cameraFocusTarget: target }),
  focusOnUndercutRegion: (regionId) => {
    const state = get();
    const result = state.draftAngleResult;
    if (!result) return;
    
    const region = result.undercutRegions.find((r) => r.id === regionId);
    if (region) {
      set({
        selectedUndercutRegionId: regionId,
        cameraFocusTarget: { ...region.centroid },
      });
    }
  },

  setWallThicknessResult: (result) => set({ wallThicknessResult: result }),
  setThicknessSampleCount: (count) => set({ thicknessSampleCount: count }),
  setThicknessColorScheme: (scheme) => set({ thicknessColorScheme: scheme }),
  setShowThicknessHeatmap: (show) => set({ showThicknessHeatmap: show }),
  setFocusThicknessTarget: (target) => set({ focusThicknessTarget: target }),
  focusOnThinnestPoint: () => {
    const state = get();
    const result = state.wallThicknessResult;
    if (!result || result.samples.length === 0) return;
    let minSample = result.samples[0];
    for (const s of result.samples) {
      if (s.thickness < minSample.thickness) minSample = s;
    }
    set({
      focusThicknessTarget: { x: minSample.x, y: minSample.y, z: minSample.z },
      cameraFocusTarget: { x: minSample.x, y: minSample.y, z: minSample.z },
    });
  },
  focusOnThickestPoint: () => {
    const state = get();
    const result = state.wallThicknessResult;
    if (!result || result.samples.length === 0) return;
    let maxSample = result.samples[0];
    for (const s of result.samples) {
      if (s.thickness > maxSample.thickness) maxSample = s;
    }
    set({
      focusThicknessTarget: { x: maxSample.x, y: maxSample.y, z: maxSample.z },
      cameraFocusTarget: { x: maxSample.x, y: maxSample.y, z: maxSample.z },
    });
  },

  setDrainHoleResult: (result) => set({ drainHoleResult: result }),
  setHoleDiameter: (diameter) => set({ holeDiameter: diameter }),
  setHoleSpacing: (spacing) => set({ holeSpacing: spacing }),
  setHoleDepth: (depth) => set({ holeDepth: depth }),
  setSelectedHoleId: (id) => set({ selectedHoleId: id }),
  setHoleEditMode: (mode) => set({ holeEditMode: mode }),
  setCollisionEnabled: (enabled) => set({ collisionEnabled: enabled }),
  addDrainHole: (hole, skipCollision = false) =>
    set((state) => {
      const currentResult = state.drainHoleResult;
      const model = state.model;
      
      const newHoleBase: DrainHole = {
        id: `hole-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        position: hole.position || { x: 0, y: 0, z: 0 },
        normal: hole.normal || { x: 0, y: 1, z: 0 },
        diameter: hole.diameter || state.holeDiameter,
        type: hole.type || 'dewatering',
        depth: hole.depth || state.holeDepth,
      };

      let finalHole = newHoleBase;
      const existingHoles = currentResult?.holes || [];

      if (state.collisionEnabled && !skipCollision && existingHoles.length > 0) {
        const collision = checkHoleCollision(newHoleBase, existingHoles, state.holeSpacing);
        if (collision.hasCollision) {
          const avoided = autoAvoidCollision(newHoleBase, existingHoles, state.holeSpacing);
          if (avoided) {
            finalHole = { ...finalHole, position: avoided.position };
          } else {
            return {};
          }
        }
      }

      if (!currentResult) {
        return {
          drainHoleResult: {
            holes: [finalHole],
            totalCount: 1,
            totalArea: Math.PI * Math.pow(finalHole.diameter / 2, 2),
            suctionCount: finalHole.type === 'suction' ? 1 : 0,
            dewateringCount: finalHole.type === 'dewatering' ? 1 : 0,
            recommendedDensity: 0,
          },
        };
      }
      
      const newHoles = [...currentResult.holes, finalHole];
      const totalArea = newHoles.reduce(
        (sum, h) => sum + Math.PI * Math.pow(h.diameter / 2, 2),
        0
      );
      return {
        drainHoleResult: {
          ...currentResult,
          holes: newHoles,
          totalCount: newHoles.length,
          totalArea,
          suctionCount: newHoles.filter((h) => h.type === 'suction').length,
          dewateringCount: newHoles.filter((h) => h.type === 'dewatering').length,
        },
      };
    }),
  removeDrainHole: (id) =>
    set((state) => {
      const currentResult = state.drainHoleResult;
      if (!currentResult) return {};
      const newHoles = currentResult.holes.filter((h) => h.id !== id);
      const totalArea = newHoles.reduce(
        (sum, h) => sum + Math.PI * Math.pow(h.diameter / 2, 2),
        0
      );
      return {
        drainHoleResult: {
          ...currentResult,
          holes: newHoles,
          totalCount: newHoles.length,
          totalArea,
          suctionCount: newHoles.filter((h) => h.type === 'suction').length,
          dewateringCount: newHoles.filter((h) => h.type === 'dewatering').length,
        },
        selectedHoleId: state.selectedHoleId === id ? null : state.selectedHoleId,
      };
    }),
  updateDrainHole: (id, updates, skipCollision = false) =>
    set((state) => {
      const currentResult = state.drainHoleResult;
      if (!currentResult) return {};
      
      const oldHole = currentResult.holes.find((h) => h.id === id);
      if (!oldHole) return {};

      let updatedHole = { ...oldHole, ...updates };
      const otherHoles = currentResult.holes.filter((h) => h.id !== id);

      const needsCollisionCheck = updates.position !== undefined || updates.diameter !== undefined;
      
      if (state.collisionEnabled && !skipCollision && needsCollisionCheck && otherHoles.length > 0) {
        const collision = checkHoleCollision(updatedHole, otherHoles, state.holeSpacing);
        if (collision.hasCollision) {
          const avoided = autoAvoidCollision(updatedHole, otherHoles, state.holeSpacing);
          if (avoided) {
            updatedHole = { ...updatedHole, position: avoided.position };
          } else {
            return {};
          }
        }
      }

      const newHoles = currentResult.holes.map((h) =>
        h.id === id ? updatedHole : h
      );
      const totalArea = newHoles.reduce(
        (sum, h) => sum + Math.PI * Math.pow(h.diameter / 2, 2),
        0
      );
      return {
        drainHoleResult: {
          ...currentResult,
          holes: newHoles,
          totalCount: newHoles.length,
          totalArea,
          suctionCount: newHoles.filter((h) => h.type === 'suction').length,
          dewateringCount: newHoles.filter((h) => h.type === 'dewatering').length,
        },
      };
    }),
  addDrainHoles: (holes) =>
    set((state) => {
      const currentResult = state.drainHoleResult;
      const newHoles = currentResult
        ? [...currentResult.holes, ...holes]
        : holes;
      const totalArea = newHoles.reduce(
        (sum, h) => sum + Math.PI * Math.pow(h.diameter / 2, 2),
        0
      );
      const modelSurfaceArea = state.model ? estimateSurfaceArea(state.model) : 1;
      return {
        drainHoleResult: {
          holes: newHoles,
          totalCount: newHoles.length,
          totalArea,
          suctionCount: newHoles.filter((h) => h.type === 'suction').length,
          dewateringCount: newHoles.filter((h) => h.type === 'dewatering').length,
          recommendedDensity: (totalArea / modelSurfaceArea) * 100,
        },
      };
    }),
  clearDrainHoles: () =>
    set({
      drainHoleResult: null,
      selectedHoleId: null,
      holeEditMode: 'none',
    }),
  openArrayDialog: (patternType) =>
    set({
      arrayDialog: {
        open: true,
        patternType,
      },
    }),
  closeArrayDialog: () =>
    set((state) => ({
      arrayDialog: {
        ...state.arrayDialog,
        open: false,
      },
    })),
  generateArray: (params) =>
    set((state) => {
      const model = state.model;
      if (!model) return {};

      const center = params.center || {
        x: model.boundingBox.center.x,
        y: model.boundingBox.max.y,
        z: model.boundingBox.center.z,
      };
      const normal = params.normal || { x: 0, y: 1, z: 0 };

      let holes: DrainHole[] = [];
      
      if (params.type === 'rectangle') {
        holes = generateRectangleArray({
          type: 'rectangle',
          center,
          normal,
          xCount: params.xCount || 5,
          yCount: params.yCount || 4,
          xSpacing: params.xSpacing || state.holeSpacing,
          ySpacing: params.ySpacing || state.holeSpacing,
          diameter: params.diameter || state.holeDiameter,
          depth: params.depth || state.holeDepth,
          holeType: params.holeType || 'dewatering',
        });
      } else if (params.type === 'circle') {
        holes = generateCircleArray({
          type: 'circle',
          center,
          normal,
          radius: params.radius || 30,
          count: params.count || 12,
          diameter: params.diameter || state.holeDiameter,
          depth: params.depth || state.holeDepth,
          holeType: params.holeType || 'dewatering',
        });
      }

      if (state.collisionEnabled) {
        const existingHoles = state.drainHoleResult?.holes || [];
        holes = holes.filter((hole) => {
          const collision = checkHoleCollision(hole, existingHoles, state.holeSpacing);
          if (collision.hasCollision) {
            const avoided = autoAvoidCollision(hole, existingHoles, state.holeSpacing);
            if (avoided) {
              hole.position = avoided.position;
              return true;
            }
            return false;
          }
          return true;
        });
      }

      if (holes.length === 0) return {};

      const currentResult = state.drainHoleResult;
      const newHoles = currentResult
        ? [...currentResult.holes, ...holes]
        : holes;
      const totalArea = newHoles.reduce(
        (sum, h) => sum + Math.PI * Math.pow(h.diameter / 2, 2),
        0
      );
      const modelSurfaceArea = estimateSurfaceArea(model);

      return {
        arrayDialog: {
          ...state.arrayDialog,
          open: false,
        },
        drainHoleResult: {
          holes: newHoles,
          totalCount: newHoles.length,
          totalArea,
          suctionCount: newHoles.filter((h) => h.type === 'suction').length,
          dewateringCount: newHoles.filter((h) => h.type === 'dewatering').length,
          recommendedDensity: (totalArea / modelSurfaceArea) * 100,
        },
      };
    }),

  setCycleParameters: (params) =>
    set((state) => ({ cycleParameters: { ...state.cycleParameters, ...params } })),
  setCycleResult: (result) => set({ cycleResult: result }),

  setSectionPlane: (plane) =>
    set((state) => ({ sectionPlane: { ...state.sectionPlane, ...plane } })),
  setSectionResult: (result) => set({ sectionResult: result }),
  setSectionAxis: (axis) =>
    set((state) => ({ sectionPlane: { ...state.sectionPlane, axis } })),
  setSectionPosition: (position) =>
    set((state) => ({ sectionPlane: { ...state.sectionPlane, position } })),
  setSectionThicknessResolution: (resolution) =>
    set({ sectionThicknessResolution: resolution }),
  toggleSectionVisible: () =>
    set((state) => ({
      sectionPlane: { ...state.sectionPlane, visible: !state.sectionPlane.visible },
    })),

  setShowGrid: (show) => set({ showGrid: show }),
  setShowAxes: (show) => set({ showAxes: show }),
  setAutoRotate: (auto) => set({ autoRotate: auto }),
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  setActiveDialog: (dialog) => set({ activeDialog: dialog }),
  closeDialog: () => set({ activeDialog: 'none' }),
  showToast: (type, message, duration = 3000) =>
    set((state) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const newToast = { id, type, message, duration };
      if (duration > 0) {
        setTimeout(() => {
          const s = (useAppStore.getState() as any);
          if (s && s.hideToast) {
            s.hideToast(id);
          }
        }, duration);
      }
      return { toasts: [...state.toasts, newToast] };
    }),
  hideToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  addAnnotation: (annotation) =>
    set((state) => ({ annotations: [...state.annotations, annotation] })),
  removeAnnotation: (id) =>
    set((state) => ({
      annotations: state.annotations.filter((a) => a.id !== id),
      selectedAnnotationId: state.selectedAnnotationId === id ? null : state.selectedAnnotationId,
    })),
  updateAnnotation: (id, updates) =>
    set((state) => ({
      annotations: state.annotations.map((a) =>
        a.id === id ? ({ ...a, ...updates } as Annotation) : a
      ),
    })),
  setAnnotationTool: (tool) => set({ annotationTool: tool }),
  setAnnotationStyle: (style) =>
    set((state) => ({ annotationStyle: { ...state.annotationStyle, ...style } })),
  setSelectedAnnotationId: (id) => set({ selectedAnnotationId: id }),
  setIsDrawingFreehand: (drawing) => set({ isDrawingFreehand: drawing }),
  clearAnnotations: () =>
    set({ annotations: [], selectedAnnotationId: null }),
  openTextAnnotationPrompt: (position) =>
    set({
      textAnnotationPrompt: { open: true, pendingPosition: position },
    }),
  closeTextAnnotationPrompt: () =>
    set({
      textAnnotationPrompt: { open: false, pendingPosition: null },
    }),
  confirmTextAnnotation: (text) => {
    const state = get();
    const pos = state.textAnnotationPrompt.pendingPosition;
    if (!pos || !text.trim()) {
      set({
        textAnnotationPrompt: { open: false, pendingPosition: null },
      });
      return;
    }
    const id = `ann_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    set({
      annotations: [
        ...state.annotations,
        {
          id,
          type: 'text',
          position: pos,
          text: text.trim(),
          style: { ...state.annotationStyle },
        },
      ],
      textAnnotationPrompt: { open: false, pendingPosition: null },
    });
  },

  resetAnalysis: () =>
    set({
      draftAngleResult: null,
      wallThicknessResult: null,
      drainHoleResult: null,
      cycleResult: null,
    }),
}));
