import type {
  ModelData,
  DraftAngleResult,
  WallThicknessResult,
  DrainHoleResult,
  MoldingCycleResult,
  MoldingCycleParameters,
  SectionResult,
  SectionPlane,
  ModelDiffResult,
  ModelLayer,
  LayerSplitStrategy,
  Vector3,
} from '@/types';

export type AnalysisTaskType =
  | 'draftAngle'
  | 'wallThickness'
  | 'drainHoles'
  | 'moldingCycle'
  | 'section'
  | 'modelDiff'
  | 'splitLayers';

export interface WorkerRequest {
  id: string;
  type: AnalysisTaskType;
  payload: any;
}

export interface WorkerProgress {
  id: string;
  progress: number;
  message?: string;
}

export interface WorkerSuccess {
  id: string;
  result: any;
}

export interface WorkerError {
  id: string;
  error: string;
}

export type WorkerResponse =
  | { type: 'progress'; data: WorkerProgress }
  | { type: 'success'; data: WorkerSuccess }
  | { type: 'error'; data: WorkerError };

export interface DraftAnglePayload {
  model: ModelData;
  draftDirection: Vector3;
  threshold: number;
}

export interface WallThicknessPayload {
  model: ModelData;
  sampleCount: number;
}

export interface DrainHolesPayload {
  model: ModelData;
  holeDiameter: number;
  holeSpacing: number;
  holeDepth: number;
}

export interface MoldingCyclePayload {
  parameters: MoldingCycleParameters;
  targetThickness: number;
}

export interface SectionPayload {
  model: ModelData;
  plane: SectionPlane;
  thicknessResolution: number;
}

export interface ModelDiffPayload {
  model1: ModelData;
  model2: ModelData;
}

export interface SplitLayersPayload {
  model: ModelData;
  strategy: LayerSplitStrategy;
}
