import type {
  DraftAnglePayload,
  WallThicknessPayload,
  DrainHolesPayload,
  MoldingCyclePayload,
  SectionPayload,
  ModelDiffPayload,
  SplitLayersPayload,
} from './types';

import { analyzeDraftAngle } from '@/utils/draftAngle';
import { analyzeWallThickness } from '@/utils/wallThickness';
import { planDrainHoles } from '@/utils/drainHoles';
import { estimateMoldingCycle } from '@/utils/moldingCycle';
import { computeSection } from '@/utils/section';
import { computeModelDiff } from '@/utils/modelDiff';
import { splitModelByLayer } from '@/utils/layerSplitter';

const ctx: Worker = self as any;

ctx.addEventListener('message', async (e: MessageEvent) => {
  const { id, type, payload } = e.data;

  try {
    let result: any;

    switch (type) {
      case 'draftAngle':
        result = handleDraftAngle(payload);
        break;
      case 'wallThickness':
        result = handleWallThickness(payload);
        break;
      case 'drainHoles':
        result = handleDrainHoles(payload);
        break;
      case 'moldingCycle':
        result = handleMoldingCycle(payload);
        break;
      case 'section':
        result = handleSection(payload);
        break;
      case 'modelDiff':
        result = handleModelDiff(payload);
        break;
      case 'splitLayers':
        result = handleSplitLayers(payload);
        break;
      default:
        throw new Error(`Unknown task type: ${type}`);
    }

    ctx.postMessage({
      type: 'success',
      data: { id, result },
    });
  } catch (error: any) {
    ctx.postMessage({
      type: 'error',
      data: { id, error: error.message || String(error) },
    });
  }
});

function handleDraftAngle(payload: DraftAnglePayload) {
  return analyzeDraftAngle(payload.model, payload.draftDirection, payload.threshold);
}

function handleWallThickness(payload: WallThicknessPayload) {
  return analyzeWallThickness(payload.model, payload.sampleCount);
}

function handleDrainHoles(payload: DrainHolesPayload) {
  return planDrainHoles(payload.model, payload.holeDiameter, payload.holeSpacing, payload.holeDepth);
}

function handleMoldingCycle(payload: MoldingCyclePayload) {
  return estimateMoldingCycle(payload.parameters, payload.targetThickness);
}

function handleSection(payload: SectionPayload) {
  return computeSection(payload.model, payload.plane, payload.thicknessResolution);
}

function handleModelDiff(payload: ModelDiffPayload) {
  return computeModelDiff(payload.model1, payload.model2);
}

function handleSplitLayers(payload: SplitLayersPayload) {
  return splitModelByLayer(payload.model, payload.strategy);
}
