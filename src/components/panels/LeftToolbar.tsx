import { useRef } from 'react';
import {
  Upload,
  Layers,
  Ruler,
  CircleDot,
  Clock,
  RotateCcw,
  Grid3X3,
  MoveUp,
  Eye,
  Play,
  Pause,
  Scissors,
  GitCompare,
  Palette,
  PenTool,
  Box,
  Maximize2,
  Plus,
  Trash2,
  Move,
  Download,
  Copy,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { loadModelFromFile, createSampleBoxModel, createSampleBowlModel } from '@/utils/modelLoader';
import { analyzeDraftAngles } from '@/utils/draftAngle';
import { analyzeWallThickness } from '@/utils/wallThickness';
import { planDrainHoles, exportToDXF, exportToCoordinates, downloadFile } from '@/utils/drainHoles';
import { estimateMoldingCycle, MATERIAL_OPTIONS } from '@/utils/moldingCycle';
import { computeSection, getPlaneBounds } from '@/utils/section';
import { computeModelDiff } from '@/utils/modelDiff';
import { splitModel } from '@/utils/layerSplitter';
import { AnnotationPanel } from './AnnotationPanel';
import type { AnalysisMode, VisualizationMode, SectionAxis, CompareMode, LayerSplitAxis, LayerSplitStrategy } from '@/types';

const tools = [
  { id: 'draft', label: '脱模角度', icon: MoveUp },
  { id: 'thickness', label: '壁厚分析', icon: Ruler },
  { id: 'holes', label: '滤水孔', icon: CircleDot },
  { id: 'cycle', label: '成型周期', icon: Clock },
  { id: 'section', label: '截面分析', icon: Scissors },
  { id: 'compare', label: '模型对比', icon: GitCompare },
] as const;

export function LeftToolbar() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInput2Ref = useRef<HTMLInputElement>(null);
  const model = useAppStore((state) => state.model);
  const model2 = useAppStore((state) => state.model2);
  const modelFileName = useAppStore((state) => state.modelFileName);
  const model2FileName = useAppStore((state) => state.model2FileName);
  const setModel = useAppStore((state) => state.setModel);
  const setModel2 = useAppStore((state) => state.setModel2);
  const setIsLoading = useAppStore((state) => state.setIsLoading);
  const analysisMode = useAppStore((state) => state.analysisMode);
  const setAnalysisMode = useAppStore((state) => state.setAnalysisMode);
  const visualizationMode = useAppStore((state) => state.visualizationMode);
  const setVisualizationMode = useAppStore((state) => state.setVisualizationMode);
  const compareMode = useAppStore((state) => state.compareMode);
  const setCompareMode = useAppStore((state) => state.setCompareMode);
  const modelDiffResult = useAppStore((state) => state.modelDiffResult);
  const setModelDiffResult = useAppStore((state) => state.setModelDiffResult);
  const model1Opacity = useAppStore((state) => state.model1Opacity);
  const model2Opacity = useAppStore((state) => state.model2Opacity);
  const setModel1Opacity = useAppStore((state) => state.setModel1Opacity);
  const setModel2Opacity = useAppStore((state) => state.setModel2Opacity);
  const model1Color = useAppStore((state) => state.model1Color);
  const model2Color = useAppStore((state) => state.model2Color);
  const setModel1Color = useAppStore((state) => state.setModel1Color);
  const setModel2Color = useAppStore((state) => state.setModel2Color);

  const draftAngleThreshold = useAppStore((state) => state.draftAngleThreshold);
  const setDraftAngleThreshold = useAppStore((state) => state.setDraftAngleThreshold);
  const draftDirection = useAppStore((state) => state.draftDirection);
  const setDraftDirection = useAppStore((state) => state.setDraftDirection);
  const setDraftAngleResult = useAppStore((state) => state.setDraftAngleResult);
  const highlightUndercuts = useAppStore((state) => state.highlightUndercuts);
  const setHighlightUndercuts = useAppStore((state) => state.setHighlightUndercuts);

  const thicknessSampleCount = useAppStore((state) => state.thicknessSampleCount);
  const setThicknessSampleCount = useAppStore((state) => state.setThicknessSampleCount);
  const setWallThicknessResult = useAppStore((state) => state.setWallThicknessResult);

  const holeDiameter = useAppStore((state) => state.holeDiameter);
  const setHoleDiameter = useAppStore((state) => state.setHoleDiameter);
  const holeSpacing = useAppStore((state) => state.holeSpacing);
  const setHoleSpacing = useAppStore((state) => state.setHoleSpacing);
  const holeDepth = useAppStore((state) => state.holeDepth);
  const setHoleDepth = useAppStore((state) => state.setHoleDepth);
  const holeEditMode = useAppStore((state) => state.holeEditMode);
  const setHoleEditMode = useAppStore((state) => state.setHoleEditMode);
  const collisionEnabled = useAppStore((state) => state.collisionEnabled);
  const setCollisionEnabled = useAppStore((state) => state.setCollisionEnabled);
  const setDrainHoleResult = useAppStore((state) => state.setDrainHoleResult);
  const addDrainHole = useAppStore((state) => state.addDrainHole);
  const clearDrainHoles = useAppStore((state) => state.clearDrainHoles);
  const addDrainHoles = useAppStore((state) => state.addDrainHoles);
  const openArrayDialog = useAppStore((state) => state.openArrayDialog);
  const selectedHoleId = useAppStore((state) => state.selectedHoleId);
  const setSelectedHoleId = useAppStore((state) => state.setSelectedHoleId);
  const drainHoleResult = useAppStore((state) => state.drainHoleResult);

  const cycleParameters = useAppStore((state) => state.cycleParameters);
  const setCycleParameters = useAppStore((state) => state.setCycleParameters);
  const setCycleResult = useAppStore((state) => state.setCycleResult);

  const sectionPlane = useAppStore((state) => state.sectionPlane);
  const setSectionPlane = useAppStore((state) => state.setSectionPlane);
  const setSectionAxis = useAppStore((state) => state.setSectionAxis);
  const setSectionPosition = useAppStore((state) => state.setSectionPosition);
  const setSectionResult = useAppStore((state) => state.setSectionResult);
  const toggleSectionVisible = useAppStore((state) => state.toggleSectionVisible);
  const sectionThicknessResolution = useAppStore((state) => state.sectionThicknessResolution);
  const setSectionThicknessResolution = useAppStore((state) => state.setSectionThicknessResolution);

  const showGrid = useAppStore((state) => state.showGrid);
  const setShowGrid = useAppStore((state) => state.setShowGrid);
  const showAxes = useAppStore((state) => state.showAxes);
  const setShowAxes = useAppStore((state) => state.setShowAxes);
  const autoRotate = useAppStore((state) => state.autoRotate);
  const setAutoRotate = useAppStore((state) => state.setAutoRotate);

  const layersEnabled = useAppStore((state) => state.layersEnabled);
  const setLayersEnabled = useAppStore((state) => state.setLayersEnabled);
  const setModelLayers = useAppStore((state) => state.setModelLayers);
  const layerSplitStrategy = useAppStore((state) => state.layerSplitStrategy);
  const setLayerSplitStrategy = useAppStore((state) => state.setLayerSplitStrategy);
  const isLayerExploded = useAppStore((state) => state.isLayerExploded);
  const setIsLayerExploded = useAppStore((state) => state.setIsLayerExploded);
  const explodeLayersByAxis = useAppStore((state) => state.explodeLayersByAxis);
  const resetLayers = useAppStore((state) => state.resetLayers);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const modelData = await loadModelFromFile(file);
      setModel(modelData, file.name);
    } catch (error) {
      console.error('模型加载失败:', error);
      alert('模型加载失败，请检查文件格式');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFile2Upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const modelData = await loadModelFromFile(file);
      setModel2(modelData, file.name);
    } catch (error) {
      console.error('模型2加载失败:', error);
      alert('模型加载失败，请检查文件格式');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSample = (type: 'box' | 'bowl') => {
    setIsLoading(true);
    setTimeout(() => {
      const sampleModel = type === 'box' ? createSampleBoxModel() : createSampleBowlModel();
      setModel(sampleModel, type === 'box' ? '示例盒状模型' : '示例碗状模型');
      setIsLoading(false);
    }, 300);
  };

  const handleLoadSample2 = (type: 'box' | 'bowl') => {
    setIsLoading(true);
    setTimeout(() => {
      const sampleModel = type === 'box' ? createSampleBoxModel() : createSampleBowlModel();
      setModel2(sampleModel, type === 'box' ? '示例盒状模型' : '示例碗状模型');
      setIsLoading(false);
    }, 300);
  };

  const runAnalysis = (mode: AnalysisMode) => {
    if (mode !== 'compare' && !model) {
      alert('请先导入模型');
      return;
    }

    if (mode === 'compare' && (!model || !model2)) {
      alert('请先导入两个模型');
      return;
    }

    setIsLoading(true);
    setAnalysisMode(mode);

    setTimeout(() => {
      try {
        switch (mode) {
          case 'draft': {
            const result = analyzeDraftAngles(model, draftDirection, draftAngleThreshold);
            setDraftAngleResult(result);
            break;
          }
          case 'thickness': {
            const result = analyzeWallThickness(model, thicknessSampleCount);
            setWallThicknessResult(result);
            break;
          }
          case 'holes': {
            const result = planDrainHoles(model, holeDiameter, holeSpacing, holeDepth);
            setDrainHoleResult(result);
            break;
          }
          case 'cycle': {
            const result = estimateMoldingCycle(cycleParameters, cycleParameters.targetThickness);
            setCycleResult(result);
            break;
          }
          case 'section': {
            const bounds = getPlaneBounds(model, sectionPlane.axis);
            const centerPos = (bounds.min + bounds.max) / 2;
            setSectionPlane({
              visible: true,
              position: centerPos,
              axis: sectionPlane.axis,
            });
            const result = computeSection(model, {
              ...sectionPlane,
              position: centerPos,
              visible: true,
            }, sectionThicknessResolution);
            setSectionResult(result);
            break;
          }
          case 'compare': {
            if (compareMode === 'diffcolormap' && model && model2) {
              const result = computeModelDiff(model, model2);
              setModelDiffResult(result);
            } else {
              setModelDiffResult(null);
            }
            break;
          }
        }
      } catch (error) {
        console.error('分析失败:', error);
        alert('分析失败，请重试');
      } finally {
        setIsLoading(false);
      }
    }, 100);
  };

  return (
    <div className="w-72 h-full bg-surface-panel border-r border-edge-base flex flex-col overflow-hidden">
      <div className="p-4 border-b border-edge-subtle">
        <h3 className="text-sm font-semibold text-content-secondary mb-3">模型导入</h3>
        <div className="space-y-2 mb-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".stl,.obj"
            onChange={handleFileUpload}
            className="hidden"
          />
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: model1Color }} />
            <span className="text-xs text-content-muted">模型1: {modelFileName || '未导入'}</span>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Upload size={14} />
            导入模型1
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => handleLoadSample('box')}
              className="flex-1 px-2 py-1.5 bg-surface-elevated hover:bg-surface-hover text-content-secondary text-xs rounded-lg transition-colors"
            >
              盒状
            </button>
            <button
              onClick={() => handleLoadSample('bowl')}
              className="flex-1 px-2 py-1.5 bg-surface-elevated hover:bg-surface-hover text-content-secondary text-xs rounded-lg transition-colors"
            >
              碗状
            </button>
          </div>
        </div>

        <div className="pt-3 border-t border-edge-subtle">
          <input
            ref={fileInput2Ref}
            type="file"
            accept=".stl,.obj"
            onChange={handleFile2Upload}
            className="hidden"
          />
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: model2Color }} />
            <span className="text-xs text-content-muted">模型2: {model2FileName || '未导入'}</span>
          </div>
          <button
            onClick={() => fileInput2Ref.current?.click()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Upload size={14} />
            导入模型2
          </button>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => handleLoadSample2('box')}
              className="flex-1 px-2 py-1.5 bg-surface-elevated hover:bg-surface-hover text-content-secondary text-xs rounded-lg transition-colors"
            >
              盒状
            </button>
            <button
              onClick={() => handleLoadSample2('bowl')}
              className="flex-1 px-2 py-1.5 bg-surface-elevated hover:bg-surface-hover text-content-secondary text-xs rounded-lg transition-colors"
            >
              碗状
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-sm font-semibold text-content-secondary mb-3">分析工具</h3>
        <div className="grid grid-cols-2 gap-2">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isActive = analysisMode === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => runAnalysis(tool.id as AnalysisMode)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/50'
                    : 'bg-surface-elevated text-content-muted border border-edge-subtle hover:bg-surface-hover hover:text-content-secondary'
                }`}
              >
                <Icon size={20} />
                <span className="text-xs font-medium">{tool.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        {analysisMode === 'draft' && (
          <div className="pb-4 mb-4 border-b border-edge-subtle">
            <h3 className="text-sm font-semibold text-content-secondary mb-3">脱模角度设置</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-content-muted block mb-1">
                  最小脱模角: {draftAngleThreshold}°
                </label>
                <input
                  type="range"
                  min="1"
                  max="15"
                  step="0.5"
                  value={draftAngleThreshold}
                  onChange={(e) => setDraftAngleThreshold(parseFloat(e.target.value))}
                  className="w-full h-2 bg-surface-active rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>
              <div>
                <label className="text-xs text-content-muted block mb-1">脱模方向</label>
                <div className="flex gap-2">
                  {[
                    { label: '+Y', dir: { x: 0, y: 1, z: 0 } },
                    { label: '-Y', dir: { x: 0, y: -1, z: 0 } },
                    { label: '+Z', dir: { x: 0, y: 0, z: 1 } },
                    { label: '-Z', dir: { x: 0, y: 0, z: -1 } },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => setDraftDirection(opt.dir)}
                      className={`flex-1 py-1.5 text-xs rounded transition-colors ${
                        draftDirection.y === opt.dir.y &&
                        draftDirection.z === opt.dir.z &&
                        draftDirection.x === opt.dir.x
                          ? 'bg-cyan-600 text-white'
                          : 'bg-surface-active text-content-secondary hover:bg-surface-inset'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-content-muted">3D高亮倒扣面</label>
                <button
                  onClick={() => setHighlightUndercuts(!highlightUndercuts)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${
                    highlightUndercuts ? 'bg-cyan-500' : 'bg-surface-active'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      highlightUndercuts ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              <button
                onClick={() => runAnalysis('draft')}
                className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm rounded-lg transition-colors"
              >
                重新计算
              </button>
            </div>
          </div>
        )}

        {analysisMode === 'thickness' && (
          <div className="pb-4 mb-4 border-b border-edge-subtle">
            <h3 className="text-sm font-semibold text-content-secondary mb-3">壁厚分析设置</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-content-muted block mb-1">
                  采样点数: {thicknessSampleCount}
                </label>
                <input
                  type="range"
                  min="100"
                  max="2000"
                  step="100"
                  value={thicknessSampleCount}
                  onChange={(e) => setThicknessSampleCount(parseInt(e.target.value))}
                  className="w-full h-2 bg-surface-active rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>
              <button
                onClick={() => runAnalysis('thickness')}
                className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm rounded-lg transition-colors"
              >
                重新计算
              </button>
            </div>
          </div>
        )}

        {analysisMode === 'holes' && (
          <div className="pb-4 mb-4 border-b border-edge-subtle space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-content-secondary mb-3">滤水孔设置</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-content-muted block mb-1">
                    孔径: {holeDiameter}mm
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    value={holeDiameter}
                    onChange={(e) => setHoleDiameter(parseFloat(e.target.value))}
                    className="w-full h-2 bg-surface-active rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-content-muted block mb-1">
                    孔深: {holeDepth}mm
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="0.5"
                    value={holeDepth}
                    onChange={(e) => setHoleDepth(parseFloat(e.target.value))}
                    className="w-full h-2 bg-surface-active rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-content-muted block mb-1">
                    孔间距: {holeSpacing}mm
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="1"
                    value={holeSpacing}
                    onChange={(e) => setHoleSpacing(parseInt(e.target.value))}
                    className="w-full h-2 bg-surface-active rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>
                <button
                  onClick={() => runAnalysis('holes')}
                  className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm rounded-lg transition-colors"
                >
                  自动规划
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-edge-subtle">
              <h4 className="text-xs font-medium text-content-secondary mb-2 flex items-center gap-1.5">
                <PenTool size={12} className="text-purple-400" />
                手动编辑
              </h4>
              <div className="grid grid-cols-4 gap-1.5 mb-3">
                {[
                  { id: 'none', label: '选择', icon: CircleDot },
                  { id: 'add', label: '添加', icon: Plus },
                  { id: 'delete', label: '删除', icon: Trash2 },
                  { id: 'move', label: '移动', icon: Move },
                ].map((tool) => {
                  const Icon = tool.icon;
                  const isActive = holeEditMode === tool.id;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => setHoleEditMode(tool.id as any)}
                      className={`flex flex-col items-center gap-1 py-2 rounded-lg transition-all text-[10px] ${
                        isActive
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                          : 'bg-surface-elevated/50 text-content-muted border border-transparent hover:bg-surface-elevated hover:text-content-secondary'
                      }`}
                    >
                      <Icon size={14} />
                      {tool.label}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-content-muted flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={collisionEnabled}
                    onChange={(e) => setCollisionEnabled(e.target.checked)}
                    className="accent-cyan-500"
                  />
                  碰撞检测
                </label>
                <button
                  onClick={() => {
                    if (confirm('确定要清空所有滤水孔吗？')) {
                      clearDrainHoles();
                    }
                  }}
                  disabled={!drainHoleResult || drainHoleResult.holes.length === 0}
                  className="text-[10px] px-2 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  清空全部
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-edge-subtle">
              <h4 className="text-xs font-medium text-content-secondary mb-2 flex items-center gap-1.5">
                <Grid3X3 size={12} className="text-orange-400" />
                阵列生成
              </h4>
              <div className="space-y-2">
                <button
                  onClick={() => openArrayDialog('rectangle')}
                  className="w-full py-2 bg-surface-elevated hover:bg-surface-hover text-content-secondary text-xs rounded-lg transition-colors flex items-center justify-center gap-2 border border-edge-subtle"
                >
                  <Grid3X3 size={12} />
                  矩形阵列
                </button>
                <button
                  onClick={() => openArrayDialog('circle')}
                  className="w-full py-2 bg-surface-elevated hover:bg-surface-hover text-content-secondary text-xs rounded-lg transition-colors flex items-center justify-center gap-2 border border-edge-subtle"
                >
                  <CircleDot size={12} />
                  环形阵列
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-edge-subtle">
              <h4 className="text-xs font-medium text-content-secondary mb-2 flex items-center gap-1.5">
                <Download size={12} className="text-green-400" />
                导出
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    if (!drainHoleResult || drainHoleResult.holes.length === 0) {
                      alert('没有可导出的滤水孔');
                      return;
                    }
                    const dxfContent = exportToDXF(drainHoleResult.holes);
                    downloadFile(dxfContent, '滤水孔.dxf', 'application/dxf');
                  }}
                  disabled={!drainHoleResult || drainHoleResult.holes.length === 0}
                  className="py-2 bg-green-500/15 hover:bg-green-500/25 text-green-400 text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-green-500/30 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Download size={12} />
                  DXF
                </button>
                <button
                  onClick={() => {
                    if (!drainHoleResult || drainHoleResult.holes.length === 0) {
                      alert('没有可导出的滤水孔');
                      return;
                    }
                    const coordsContent = exportToCoordinates(drainHoleResult.holes);
                    downloadFile(coordsContent, '滤水孔坐标.csv', 'text/csv');
                  }}
                  disabled={!drainHoleResult || drainHoleResult.holes.length === 0}
                  className="py-2 bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-blue-500/30 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Copy size={12} />
                  坐标列
                </button>
              </div>
            </div>
          </div>
        )}

        {analysisMode === 'cycle' && (
          <div className="pb-4 mb-4 border-b border-edge-subtle">
            <h3 className="text-sm font-semibold text-content-secondary mb-3">工艺参数</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-content-muted block mb-1">材料类型</label>
                <select
                  value={cycleParameters.materialType}
                  onChange={(e) => setCycleParameters({ materialType: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-input border border-edge-base rounded-lg text-sm text-content-secondary focus:outline-none focus:border-cyan-500"
                >
                  {MATERIAL_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-content-muted block mb-1">
                  目标壁厚: {cycleParameters.targetThickness}mm
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.1"
                  value={cycleParameters.targetThickness}
                  onChange={(e) =>
                    setCycleParameters({ targetThickness: parseFloat(e.target.value) })
                  }
                  className="w-full h-2 bg-surface-active rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>
              <div>
                <label className="text-xs text-content-muted block mb-1">
                  成型温度: {cycleParameters.temperature}°C
                </label>
                <input
                  type="range"
                  min="120"
                  max="250"
                  step="5"
                  value={cycleParameters.temperature}
                  onChange={(e) =>
                    setCycleParameters({ temperature: parseInt(e.target.value) })
                  }
                  className="w-full h-2 bg-surface-active rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>
              <div>
                <label className="text-xs text-content-muted block mb-1">
                  成型压力: {cycleParameters.pressure}MPa
                </label>
                <input
                  type="range"
                  min="0.2"
                  max="1.5"
                  step="0.1"
                  value={cycleParameters.pressure}
                  onChange={(e) =>
                    setCycleParameters({ pressure: parseFloat(e.target.value) })
                  }
                  className="w-full h-2 bg-surface-active rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>
              <button
                onClick={() => runAnalysis('cycle')}
                className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm rounded-lg transition-colors"
              >
                重新计算
              </button>
            </div>
          </div>
        )}

        {analysisMode === 'section' && (
          <div className="pb-4 mb-4 border-b border-edge-subtle">
            <h3 className="text-sm font-semibold text-content-secondary mb-3">截面分析设置</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-content-muted block mb-1">截面轴向</label>
                <div className="flex gap-2">
                  {[
                    { label: 'X轴', axis: 'x' },
                    { label: 'Y轴', axis: 'y' },
                    { label: 'Z轴', axis: 'z' },
                  ].map((opt) => (
                    <button
                      key={opt.axis}
                      onClick={() => {
                        setSectionAxis(opt.axis as SectionAxis);
                        if (model) {
                          const bounds = getPlaneBounds(model, opt.axis);
                          const centerPos = (bounds.min + bounds.max) / 2;
                          setSectionPosition(centerPos);
                        }
                      }}
                      className={`flex-1 py-1.5 text-xs rounded transition-colors ${
                        sectionPlane.axis === opt.axis
                          ? 'bg-cyan-600 text-white'
                          : 'bg-surface-active text-content-secondary hover:bg-surface-inset'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-content-muted block mb-1">
                  截面位置: {sectionPlane.position.toFixed(2)} mm
                </label>
                <input
                  type="range"
                  min={model ? getPlaneBounds(model, sectionPlane.axis).min : -100}
                  max={model ? getPlaneBounds(model, sectionPlane.axis).max : 100}
                  step={0.1}
                  value={sectionPlane.position}
                  onChange={(e) => {
                    const pos = parseFloat(e.target.value);
                    setSectionPosition(pos);
                  }}
                  className="w-full h-2 bg-surface-active rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-content-muted">精确输入:</span>
                  <input
                    type="number"
                    value={sectionPlane.position.toFixed(2)}
                    min={model ? getPlaneBounds(model, sectionPlane.axis).min : -100}
                    max={model ? getPlaneBounds(model, sectionPlane.axis).max : 100}
                    step={0.1}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) {
                        const bounds = model ? getPlaneBounds(model, sectionPlane.axis) : { min: -100, max: 100 };
                        const clamped = Math.max(bounds.min, Math.min(bounds.max, val));
                        setSectionPosition(clamped);
                      }
                    }}
                    className="flex-1 px-2 py-1 bg-surface-input border border-edge-base rounded text-xs text-content-secondary font-mono focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-xs text-content-faint">mm</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-content-muted block mb-1">
                  壁厚采样数: {sectionThicknessResolution}
                </label>
                <input
                  type="range"
                  min="10"
                  max="200"
                  step="10"
                  value={sectionThicknessResolution}
                  onChange={(e) => setSectionThicknessResolution(parseInt(e.target.value))}
                  className="w-full h-2 bg-surface-active rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    toggleSectionVisible();
                    if (!sectionPlane.visible && model) {
                      const result = computeSection(
                        model,
                        sectionPlane,
                        sectionThicknessResolution
                      );
                      setSectionResult(result);
                    }
                  }}
                  className={`flex-1 py-2 text-sm rounded-lg transition-colors ${
                    sectionPlane.visible
                      ? 'bg-cyan-600 text-white'
                      : 'bg-surface-elevated text-content-secondary hover:bg-surface-hover border border-edge-subtle'
                  }`}
                >
                  {sectionPlane.visible ? '隐藏截面' : '显示截面'}
                </button>
              </div>

              <button
                onClick={() => {
                  if (model) {
                    setIsLoading(true);
                    setTimeout(() => {
                      const result = computeSection(
                        model,
                        sectionPlane,
                        sectionThicknessResolution
                      );
                      setSectionResult(result);
                      setIsLoading(false);
                    }, 50);
                  }
                }}
                className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm rounded-lg transition-colors"
              >
                重新计算
              </button>
            </div>
          </div>
        )}

        {analysisMode === 'compare' && (
          <div className="pb-4 mb-4 border-b border-edge-subtle">
            <h3 className="text-sm font-semibold text-content-secondary mb-3">对比模式</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-content-muted block mb-2">显示方式</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'overlay', label: '叠加' },
                    { id: 'sidebyside', label: '并排' },
                    { id: 'diffcolormap', label: '差异色' },
                  ].map((mode) => {
                    const isActive = compareMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        onClick={() => {
                          setCompareMode(mode.id as CompareMode);
                          if (mode.id === 'diffcolormap' && model && model2) {
                            setIsLoading(true);
                            setTimeout(() => {
                              try {
                                const result = computeModelDiff(model, model2);
                                setModelDiffResult(result);
                              } catch (error) {
                                console.error('差异计算失败:', error);
                                alert('差异计算失败，请重试');
                              } finally {
                                setIsLoading(false);
                              }
                            }, 100);
                          } else {
                            setModelDiffResult(null);
                          }
                        }}
                        className={`py-2 text-xs rounded-lg transition-colors ${
                          isActive
                            ? 'bg-cyan-600 text-white'
                            : 'bg-surface-elevated text-content-secondary hover:bg-surface-hover border border-edge-subtle'
                        }`}
                      >
                        {mode.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {compareMode !== 'diffcolormap' && (
                <>
                  <div className="pt-2 border-t border-edge-subtle">
                    <label className="text-xs text-content-muted block mb-2">
                      模型颜色
                    </label>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: model1Color }} />
                          <span className="text-xs text-content-muted">模型1</span>
                        </div>
                        <input
                          type="color"
                          value={model1Color}
                          onChange={(e) => setModel1Color(e.target.value)}
                          className="w-full h-8 rounded cursor-pointer bg-transparent"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: model2Color }} />
                          <span className="text-xs text-content-muted">模型2</span>
                        </div>
                        <input
                          type="color"
                          value={model2Color}
                          onChange={(e) => setModel2Color(e.target.value)}
                          className="w-full h-8 rounded cursor-pointer bg-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-content-muted block mb-1">
                      模型1透明度: {model1Opacity.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={model1Opacity}
                      onChange={(e) => setModel1Opacity(parseFloat(e.target.value))}
                      className="w-full h-2 bg-surface-active rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-content-muted block mb-1">
                      模型2透明度: {model2Opacity.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={model2Opacity}
                      onChange={(e) => setModel2Opacity(parseFloat(e.target.value))}
                      className="w-full h-2 bg-surface-active rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>
                </>
              )}

              {compareMode === 'diffcolormap' && modelDiffResult && (
                <div className="pt-2 border-t border-edge-subtle space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-content-muted">最大凸出</span>
                    <span className="text-red-400 font-mono">{modelDiffResult.maxDistance.toFixed(2)} mm</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-content-muted">最大凹陷</span>
                    <span className="text-blue-400 font-mono">{modelDiffResult.minDistance.toFixed(2)} mm</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-content-muted">平均差异</span>
                    <span className="text-content-secondary font-mono">{modelDiffResult.avgDistance.toFixed(2)} mm</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-content-muted">凸出顶点数</span>
                    <span className="text-content-secondary font-mono">{modelDiffResult.positiveCount}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-content-muted">凹陷顶点数</span>
                    <span className="text-content-secondary font-mono">{modelDiffResult.negativeCount}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-content-muted">无差异顶点</span>
                    <span className="text-content-secondary font-mono">{modelDiffResult.zeroCount}</span>
                  </div>
                </div>
              )}

              {compareMode === 'diffcolormap' && (
                <button
                  onClick={() => runAnalysis('compare')}
                  className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm rounded-lg transition-colors"
                >
                  重新计算差异
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mb-5 pb-4 border-b border-edge-subtle">
          <AnnotationPanel />
        </div>

        <div className="mb-5 pb-4 border-b border-edge-subtle">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-content-secondary flex items-center gap-2">
              <Box size={16} className="text-purple-400" />
              图层模式
            </h3>
            <button
              onClick={() => {
                if (layersEnabled) {
                  resetLayers();
                } else if (model) {
                  try {
                    const layers = splitModel(model, layerSplitStrategy);
                    setModelLayers(layers);
                    setLayersEnabled(true);
                  } catch (e) {
                    console.error('Failed to split:', e);
                  }
                } else {
                  try {
                    const sampleModel = createSampleBoxModel();
                    const layers = splitModel(sampleModel, layerSplitStrategy);
                    setModelLayers(layers);
                    setLayersEnabled(true);
                  } catch (e) {
                    console.error('Failed to split:', e);
                  }
                }
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                layersEnabled
                  ? 'bg-purple-500 text-white shadow-md shadow-purple-500/30'
                  : 'bg-surface-elevated text-content-muted hover:text-content-secondary border border-edge-subtle hover:border-purple-500/30'
              }`}
            >
              {layersEnabled ? '关闭' : '开启'}
            </button>
          </div>

          {layersEnabled && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-content-muted block mb-1.5">
                  分割轴向
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['x', 'y', 'z'] as LayerSplitAxis[]).map((axis) => (
                    <button
                      key={axis}
                      onClick={() => {
                        const currentCount = layerSplitStrategy.type === 'axis' ? layerSplitStrategy.count : 4;
                        const newStrategy: LayerSplitStrategy = {
                          type: 'axis',
                          axis,
                          count: currentCount,
                        };
                        setLayerSplitStrategy(newStrategy);
                        const displayModel = model || createSampleBoxModel();
                        try {
                          const layers = splitModel(displayModel, newStrategy);
                          setModelLayers(layers);
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                      className={`py-1.5 text-xs rounded-md transition-all ${
                        layerSplitStrategy.type === 'axis' &&
                        layerSplitStrategy.axis === axis
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                          : 'bg-surface-inset text-content-muted hover:bg-surface-elevated border border-edge-subtle'
                      }`}
                    >
                      {axis.toUpperCase()}轴
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-content-muted block mb-1.5">
                  层数 (Y轴)
                  {layerSplitStrategy.type === 'axis' && (
                    <span className="text-purple-400 ml-1">
                      {layerSplitStrategy.count}
                    </span>
                  )}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[2, 3, 4, 6, 8, 10].map((n) => (
                    <button
                      key={n}
                      onClick={() => {
                        const currentAxis = layerSplitStrategy.type === 'axis' ? layerSplitStrategy.axis : 'y';
                        const newStrategy: LayerSplitStrategy = {
                          type: 'axis',
                          axis: currentAxis,
                          count: n,
                        };
                        setLayerSplitStrategy(newStrategy);
                        const displayModel = model || createSampleBoxModel();
                        try {
                          const layers = splitModel(displayModel, newStrategy);
                          setModelLayers(layers);
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                      className={`w-9 h-7 rounded text-[11px] font-medium transition-all ${
                        layerSplitStrategy.type === 'axis' &&
                        layerSplitStrategy.count === n
                          ? 'bg-purple-500 text-white shadow-md shadow-purple-500/30'
                          : 'bg-surface-inset text-content-muted hover:bg-surface-elevated border border-edge-subtle'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsLayerExploded(!isLayerExploded)}
                  className={`flex-1 py-1.5 flex items-center justify-center gap-1 rounded-md text-xs transition-all ${
                    isLayerExploded
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                      : 'bg-surface-inset text-content-muted hover:bg-surface-elevated border border-edge-subtle'
                  }`}
                >
                  <Maximize2 size={12} />
                  {isLayerExploded ? '组装' : '拆解'}
                </button>
                {isLayerExploded && (
                  <div className="flex gap-1">
                    {(['x', 'y', 'z'] as LayerSplitAxis[]).map((axis) => (
                      <button
                        key={axis}
                        onClick={() => explodeLayersByAxis(axis)}
                        className="w-8 h-7 rounded text-[10px] bg-surface-inset text-content-muted hover:bg-orange-500/20 hover:text-orange-400 border border-edge-subtle hover:border-orange-500/30 transition-all"
                      >
                        {axis.toUpperCase()}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <h3 className="text-sm font-semibold text-content-secondary mb-3">视图设置</h3>
        <div className="space-y-2">
          <div>
            <label className="text-xs text-content-muted block mb-1">显示模式</label>
            <div className="flex gap-2">
              {[
                { id: 'solid', label: '实体', icon: Layers },
                { id: 'wireframe', label: '线框', icon: Grid3X3 },
                { id: 'xray', label: 'X光', icon: Eye },
              ].map((mode) => {
                const Icon = mode.icon;
                const isActive = visualizationMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => setVisualizationMode(mode.id as VisualizationMode)}
                    className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/50'
                        : 'bg-surface-elevated text-content-muted border border-edge-subtle hover:bg-surface-hover'
                    }`}
                  >
                    <Icon size={16} />
                    <span className="text-xs">{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs transition-colors ${
                showGrid
                  ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/50'
                  : 'bg-surface-elevated text-content-muted border border-edge-subtle hover:bg-surface-hover'
              }`}
            >
              <Grid3X3 size={14} />
              网格
            </button>
            <button
              onClick={() => setShowAxes(!showAxes)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs transition-colors ${
                showAxes
                  ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/50'
                  : 'bg-surface-elevated text-content-muted border border-edge-subtle hover:bg-surface-hover'
              }`}
            >
              <RotateCcw size={14} />
              坐标轴
            </button>
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs transition-colors ${
                autoRotate
                  ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/50'
                  : 'bg-surface-elevated text-content-muted border border-edge-subtle hover:bg-surface-hover'
              }`}
            >
              {autoRotate ? <Pause size={14} /> : <Play size={14} />}
              旋转
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
