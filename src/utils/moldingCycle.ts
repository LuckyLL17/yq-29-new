import type { MoldingCycleParameters, MoldingCycleResult } from '@/types';

const MATERIAL_COEFFICIENTS: Record<string, { diffusion: number; density: number; thermal: number }> = {
  甘蔗浆: { diffusion: 0.85, density: 0.65, thermal: 0.12 },
  竹浆: { diffusion: 0.92, density: 0.7, thermal: 0.14 },
  木浆: { diffusion: 1.0, density: 0.75, thermal: 0.15 },
  废纸浆: { diffusion: 0.75, density: 0.6, thermal: 0.1 },
  混合浆: { diffusion: 0.82, density: 0.65, thermal: 0.12 },
};

export function estimateMoldingCycle(
  parameters: MoldingCycleParameters,
  avgWallThickness: number = 1.5
): MoldingCycleResult {
  const material = MATERIAL_COEFFICIENTS[parameters.materialType] || MATERIAL_COEFFICIENTS['甘蔗浆'];
  const thickness = avgWallThickness / 1000;

  const suctionTime = calculateSuctionTime(parameters, material, thickness);
  const pressingTime = calculatePressingTime(parameters, material, thickness);
  const dryingTime = calculateDryingTime(parameters, material, thickness);
  const demoldingTime = 8;

  const totalTime = suctionTime + pressingTime + dryingTime + demoldingTime;

  const sensitivityAnalysis = calculateSensitivity(
    parameters,
    material,
    thickness,
    totalTime
  );

  return {
    totalTime,
    suctionTime,
    pressingTime,
    dryingTime,
    demoldingTime,
    parameters: { ...parameters },
    sensitivityAnalysis,
  };
}

function calculateSuctionTime(
  params: MoldingCycleParameters,
  material: { diffusion: number; density: number; thermal: number },
  thickness: number
): number {
  const baseTime = 15;
  const thicknessFactor = Math.pow(thickness * 1000, 1.5) / 2;
  const concentrationFactor = 1.2 / params.pulpConcentration;
  const vacuumFactor = -0.06 / params.vacuumDegree;
  const diffusionFactor = 1 / material.diffusion;

  return baseTime * thicknessFactor * concentrationFactor * vacuumFactor * diffusionFactor;
}

function calculatePressingTime(
  params: MoldingCycleParameters,
  material: { diffusion: number; density: number; thermal: number },
  thickness: number
): number {
  const baseTime = 10;
  const thicknessFactor = thickness * 1000 / 2;
  const pressureFactor = 0.6 / params.pressure;
  const densityFactor = material.density / 0.65;

  return baseTime * thicknessFactor * pressureFactor * densityFactor;
}

function calculateDryingTime(
  params: MoldingCycleParameters,
  material: { diffusion: number; density: number; thermal: number },
  thickness: number
): number {
  const baseTime = 120;
  const thicknessFactor = Math.pow(thickness * 1000, 2) / 4;
  const tempFactor = 180 / params.temperature;
  const thermalFactor = 0.12 / material.thermal;

  return baseTime * thicknessFactor * tempFactor * thermalFactor;
}

function calculateSensitivity(
  params: MoldingCycleParameters,
  material: { diffusion: number; density: number; thermal: number },
  thickness: number,
  baseTotalTime: number
): { factor: string; impact: number; description: string }[] {
  const result = [];

  const thickParams = { ...params };
  const thickTime = estimateTotalTime(thickParams, material, thickness * 1.1);
  result.push({
    factor: '壁厚',
    impact: ((thickTime - baseTotalTime) / baseTotalTime) * 100,
    description: '壁厚增加10%，成型周期变化',
  });

  const tempParams = { ...params, temperature: params.temperature * 1.1 };
  const tempTime = estimateTotalTime(tempParams, material, thickness);
  result.push({
    factor: '温度',
    impact: ((tempTime - baseTotalTime) / baseTotalTime) * 100,
    description: '温度升高10%，成型周期变化',
  });

  const pressureParams = { ...params, pressure: params.pressure * 1.1 };
  const pressureTime = estimateTotalTime(pressureParams, material, thickness);
  result.push({
    factor: '压力',
    impact: ((pressureTime - baseTotalTime) / baseTotalTime) * 100,
    description: '压力增加10%，成型周期变化',
  });

  const concParams = { ...params, pulpConcentration: params.pulpConcentration * 1.1 };
  const concTime = estimateTotalTime(concParams, material, thickness);
  result.push({
    factor: '纸浆浓度',
    impact: ((concTime - baseTotalTime) / baseTotalTime) * 100,
    description: '纸浆浓度增加10%，成型周期变化',
  });

  return result;
}

function estimateTotalTime(
  params: MoldingCycleParameters,
  material: { diffusion: number; density: number; thermal: number },
  thickness: number
): number {
  const suction = calculateSuctionTime(params, material, thickness);
  const pressing = calculatePressingTime(params, material, thickness);
  const drying = calculateDryingTime(params, material, thickness);
  const demolding = 8;
  return suction + pressing + drying + demolding;
}

export const MATERIAL_OPTIONS = [
  '甘蔗浆',
  '竹浆',
  '木浆',
  '废纸浆',
  '混合浆',
];
