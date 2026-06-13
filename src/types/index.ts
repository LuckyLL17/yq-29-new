export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface BoundingBox {
  min: Vector3;
  max: Vector3;
  center: Vector3;
  size: Vector3;
}

export interface ModelData {
  id: string;
  name: string;
  vertices: Float32Array;
  indices: Uint32Array | Uint16Array;
  normals: Float32Array;
  boundingBox: BoundingBox;
  faceCount: number;
  vertexCount: number;
}

export interface UndercutRegion {
  id: string;
  faceIndices: number[];
  vertexIndices: Set<number>;
  boundingBox: BoundingBox;
  centroid: Vector3;
  area: number;
  minAngle: number;
  maxAngle: number;
  avgAngle: number;
  dimensions: {
    width: number;
    height: number;
    depth: number;
    maxExtent: number;
  };
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface RepairSuggestion {
  id: string;
  regionId: string;
  type: 'add_draft' | 'fillet' | 'chamfer' | 'redesign' | 'split';
  title: string;
  description: string;
  estimatedImprovement: string;
  difficulty: 'easy' | 'medium' | 'hard';
  targetAngle?: number;
}

export interface DraftAngleResult {
  faceAngles: Float32Array;
  minAngle: number;
  maxAngle: number;
  avgAngle: number;
  undercutFaceCount: number;
  draftDirection: Vector3;
  threshold: number;
  angleDistribution: { range: string; count: number; percentage: number }[];
  undercutRegions: UndercutRegion[];
  repairSuggestions: RepairSuggestion[];
}

export interface WallThicknessSample {
  x: number;
  y: number;
  z: number;
  thickness: number;
}

export interface WallThicknessResult {
  samples: WallThicknessSample[];
  minThickness: number;
  maxThickness: number;
  avgThickness: number;
  thicknessDistribution: { range: string; count: number; percentage: number }[];
  sampleCount: number;
}

export type DrainHoleType = 'suction' | 'dewatering';

export interface DrainHole {
  id: string;
  position: Vector3;
  normal: Vector3;
  diameter: number;
  type: DrainHoleType;
  depth: number;
}

export interface DrainHoleResult {
  holes: DrainHole[];
  totalCount: number;
  totalArea: number;
  suctionCount: number;
  dewateringCount: number;
  recommendedDensity: number;
}

export type ArrayPatternType = 'rectangle' | 'circle';

export interface RectangleArrayParams {
  type: 'rectangle';
  center: Vector3;
  normal: Vector3;
  xCount: number;
  yCount: number;
  xSpacing: number;
  ySpacing: number;
  diameter: number;
  depth: number;
  holeType: DrainHoleType;
}

export interface CircleArrayParams {
  type: 'circle';
  center: Vector3;
  normal: Vector3;
  radius: number;
  count: number;
  diameter: number;
  depth: number;
  holeType: DrainHoleType;
}

export type ArrayParams = RectangleArrayParams | CircleArrayParams;

export interface ArrayDialogState {
  open: boolean;
  patternType: ArrayPatternType;
}

export type HoleExportFormat = 'dxf' | 'coords';

export interface CollisionCheckResult {
  hasCollision: boolean;
  collidingHoles: string[];
  minDistance: number;
}

export type HoleEditMode = 'none' | 'add' | 'move' | 'delete' | 'edit';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export interface MoldingCycleParameters {
  materialType: string;
  targetThickness: number;
  temperature: number;
  pressure: number;
  pulpConcentration: number;
  vacuumDegree: number;
}

export interface MoldingCycleResult {
  totalTime: number;
  suctionTime: number;
  pressingTime: number;
  dryingTime: number;
  demoldingTime: number;
  parameters: MoldingCycleParameters;
  sensitivityAnalysis: {
    factor: string;
    impact: number;
    description: string;
  }[];
}

export type AnalysisMode = 'none' | 'draft' | 'thickness' | 'holes' | 'cycle' | 'section' | 'compare';

export type VisualizationMode = 'solid' | 'wireframe' | 'xray';

export type CompareMode = 'overlay' | 'sidebyside' | 'diffcolormap';

export interface ModelDiffResult {
  vertexDistances: Float32Array;
  minDistance: number;
  maxDistance: number;
  avgDistance: number;
  positiveCount: number;
  negativeCount: number;
  zeroCount: number;
  distanceDistribution: { range: string; count: number; percentage: number }[];
}

export type AnnotationTool = 'text' | 'arrow' | 'dimension' | 'freehand' | 'none';

export interface AnnotationStyle {
  color: string;
  fontSize: number;
  fontFamily: string;
  lineWidth: number;
}

export interface TextAnnotation {
  id: string;
  type: 'text';
  position: Vector3;
  text: string;
  style: AnnotationStyle;
}

export interface ArrowAnnotation {
  id: string;
  type: 'arrow';
  start: Vector3;
  end: Vector3;
  style: AnnotationStyle;
}

export interface DimensionAnnotation {
  id: string;
  type: 'dimension';
  start: Vector3;
  end: Vector3;
  offset: number;
  style: AnnotationStyle;
}

export interface FreehandAnnotation {
  id: string;
  type: 'freehand';
  points: Vector3[];
  style: AnnotationStyle;
}

export type Annotation = TextAnnotation | ArrowAnnotation | DimensionAnnotation | FreehandAnnotation;

export interface TextAnnotationPrompt {
  open: boolean;
  pendingPosition: Vector3 | null;
}

export type SectionAxis = 'x' | 'y' | 'z';

export interface SectionPlane {
  axis: SectionAxis;
  position: number;
  visible: boolean;
}

export interface SectionContourPoint {
  x: number;
  y: number;
  z: number;
}

export interface SectionThicknessSample {
  position: number;
  thickness: number;
  normal: Vector3;
}

export interface SectionResult {
  contourPoints: SectionContourPoint[][];
  area: number;
  perimeter: number;
  thicknessSamples: SectionThicknessSample[];
  minThickness: number;
  maxThickness: number;
  avgThickness: number;
  thicknessDistribution: { range: string; count: number; percentage: number }[];
  plane: SectionPlane;
}

export type ThicknessColorScheme = 'rainbow' | 'coolwarm' | 'grayscale';

export type LayerSplitAxis = 'x' | 'y' | 'z';

export type LayerSplitStrategy =
  | { type: 'axis'; axis: LayerSplitAxis; count: number }
  | { type: 'manual'; boundaries: number[]; axis: LayerSplitAxis };

export interface ModelLayerGeometry {
  vertices: Float32Array;
  indices: Uint32Array | Uint16Array;
  normals: Float32Array;
  faceCount: number;
  vertexCount: number;
}

export interface ModelLayer {
  id: string;
  name: string;
  index: number;
  geometry: ModelLayerGeometry;
  color: string;
  opacity: number;
  visible: boolean;
  explosionOffset: Vector3;
  boundingBox: BoundingBox;
}

export interface LayerState {
  layers: ModelLayer[];
  splitStrategy: LayerSplitStrategy;
  explosionAmount: number;
  isExploded: boolean;
}
