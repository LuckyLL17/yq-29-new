import {
  Info,
  Triangle,
  Ruler,
  CircleDot,
  Clock,
  Download,
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  TrendingUp,
  Minus,
  Scissors,
  Square,
  GitCompare,
  Maximize2,
  Lightbulb,
  Eye,
  EyeOff,
  Wrench,
  ChevronRight,
  ChevronDown,
  Crosshair,
  Palette,
  Plus,
  Trash2,
  Edit3,
  Settings,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { ThicknessColorScheme } from '@/types';
import { DraftAngleChart, ThicknessChart, CyclePieChart, SectionThicknessCurve } from '../charts/AnalysisCharts';

export function RightPanel() {
  const model = useAppStore((state) => state.model);
  const model2 = useAppStore((state) => state.model2);
  const modelFileName = useAppStore((state) => state.modelFileName);
  const model2FileName = useAppStore((state) => state.model2FileName);
  const analysisMode = useAppStore((state) => state.analysisMode);
  const compareMode = useAppStore((state) => state.compareMode);
  const modelDiffResult = useAppStore((state) => state.modelDiffResult);
  const draftAngleResult = useAppStore((state) => state.draftAngleResult);
  const selectedUndercutRegionId = useAppStore((state) => state.selectedUndercutRegionId);
  const highlightUndercuts = useAppStore((state) => state.highlightUndercuts);
  const focusOnUndercutRegion = useAppStore((state) => state.focusOnUndercutRegion);
  const setSelectedUndercutRegionId = useAppStore((state) => state.setSelectedUndercutRegionId);
  const setHighlightUndercuts = useAppStore((state) => state.setHighlightUndercuts);
  const wallThicknessResult = useAppStore((state) => state.wallThicknessResult);
  const thicknessColorScheme = useAppStore((state) => state.thicknessColorScheme);
  const setThicknessColorScheme = useAppStore((state) => state.setThicknessColorScheme);
  const showThicknessHeatmap = useAppStore((state) => state.showThicknessHeatmap);
  const setShowThicknessHeatmap = useAppStore((state) => state.setShowThicknessHeatmap);
  const focusOnThinnestPoint = useAppStore((state) => state.focusOnThinnestPoint);
  const focusOnThickestPoint = useAppStore((state) => state.focusOnThickestPoint);
  const drainHoleResult = useAppStore((state) => state.drainHoleResult);
  const selectedHoleId = useAppStore((state) => state.selectedHoleId);
  const setSelectedHoleId = useAppStore((state) => state.setSelectedHoleId);
  const updateDrainHole = useAppStore((state) => state.updateDrainHole);
  const removeDrainHole = useAppStore((state) => state.removeDrainHole);
  const setCameraFocusTarget = useAppStore((state) => state.setCameraFocusTarget);
  const cycleResult = useAppStore((state) => state.cycleResult);
  const sectionResult = useAppStore((state) => state.sectionResult);
  const sectionPlane = useAppStore((state) => state.sectionPlane);

  const exportReport = () => {
    const report = generateReport();
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '模具设计分析报告.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateReport = (): string => {
    let report = '========================================\n';
    report += '    纸浆模塑模具设计分析报告\n';
    report += '========================================\n\n';
    report += `模型文件: ${modelFileName || '示例模型'}\n`;
    report += `生成时间: ${new Date().toLocaleString()}\n\n`;

    if (model) {
      report += '--- 模型信息 ---\n';
      report += `顶点数: ${model.vertexCount}\n`;
      report += `面数: ${model.faceCount}\n`;
      report += `尺寸: ${model.boundingBox.size.x.toFixed(2)} × ${model.boundingBox.size.y.toFixed(2)} × ${model.boundingBox.size.z.toFixed(2)} mm\n\n`;
    }

    if (draftAngleResult) {
      report += '--- 脱模角度分析 ---\n';
      report += `最小脱模角: ${draftAngleResult.minAngle.toFixed(2)}°\n`;
      report += `最大脱模角: ${draftAngleResult.maxAngle.toFixed(2)}°\n`;
      report += `平均脱模角: ${draftAngleResult.avgAngle.toFixed(2)}°\n`;
      report += `倒扣面数量: ${draftAngleResult.undercutFaceCount}\n`;
      report += `脱模方向阈值: ${draftAngleResult.threshold}°\n`;
      
      if (draftAngleResult.undercutRegions.length > 0) {
        report += `\n--- 倒扣区域详情 (共 ${draftAngleResult.undercutRegions.length} 个) ---\n`;
        draftAngleResult.undercutRegions.forEach((region, idx) => {
          const severityMap: Record<string, string> = {
            critical: '严重',
            high: '高',
            medium: '中',
            low: '低',
          };
          report += `\n区域 ${idx + 1} (${region.id}):\n`;
          report += `  严重程度: ${severityMap[region.severity] || region.severity}\n`;
          report += `  平均角度: ${region.avgAngle.toFixed(2)}°\n`;
          report += `  面积: ${region.area.toFixed(2)} mm²\n`;
          report += `  尺寸: ${region.dimensions.width.toFixed(1)} × ${region.dimensions.height.toFixed(1)} × ${region.dimensions.depth.toFixed(1)} mm\n`;
          report += `  面数: ${region.faceIndices.length}\n`;
        });
      }
      
      if (draftAngleResult.repairSuggestions.length > 0) {
        report += `\n--- 修复建议 (共 ${draftAngleResult.repairSuggestions.length} 条) ---\n`;
        const typeMap: Record<string, string> = {
          add_draft: '增加脱模斜度',
          fillet: '增加圆角过渡',
          chamfer: '添加倒角',
          redesign: '重新设计',
          split: '滑块/抽芯结构',
        };
        const diffMap: Record<string, string> = {
          easy: '简单',
          medium: '中等',
          hard: '困难',
        };
        draftAngleResult.repairSuggestions.forEach((suggestion, idx) => {
          report += `\n建议 ${idx + 1}:\n`;
          report += `  类型: ${typeMap[suggestion.type] || suggestion.type}\n`;
          report += `  标题: ${suggestion.title}\n`;
          report += `  相关区域: ${suggestion.regionId}\n`;
          report += `  难度: ${diffMap[suggestion.difficulty] || suggestion.difficulty}\n`;
          report += `  描述: ${suggestion.description}\n`;
          report += `  预期效果: ${suggestion.estimatedImprovement}\n`;
        });
      }
      
      report += '\n';
    }

    if (wallThicknessResult) {
      report += '--- 壁厚分布分析 ---\n';
      report += `最小壁厚: ${wallThicknessResult.minThickness.toFixed(2)} mm\n`;
      report += `最大壁厚: ${wallThicknessResult.maxThickness.toFixed(2)} mm\n`;
      report += `平均壁厚: ${wallThicknessResult.avgThickness.toFixed(2)} mm\n`;
      report += `采样点数: ${wallThicknessResult.sampleCount}\n\n`;
    }

    if (drainHoleResult) {
      report += '--- 滤水孔规划 ---\n';
      report += `滤水孔总数: ${drainHoleResult.totalCount}\n`;
      report += `吸水孔数量: ${drainHoleResult.suctionCount}\n`;
      report += `脱水孔数量: ${drainHoleResult.dewateringCount}\n`;
      report += `总开孔面积: ${drainHoleResult.totalArea.toFixed(2)} mm²\n`;
      report += `开孔密度: ${drainHoleResult.recommendedDensity.toFixed(2)}%\n\n`;
    }

    if (cycleResult) {
      report += '--- 成型周期预估 ---\n';
      report += `总周期: ${cycleResult.totalTime.toFixed(1)} 秒\n`;
      report += `吸浆时间: ${cycleResult.suctionTime.toFixed(1)} 秒\n`;
      report += `压制时间: ${cycleResult.pressingTime.toFixed(1)} 秒\n`;
      report += `干燥时间: ${cycleResult.dryingTime.toFixed(1)} 秒\n`;
      report += `脱模时间: ${cycleResult.demoldingTime.toFixed(1)} 秒\n\n`;
      report += '--- 灵敏度分析 ---\n';
      for (const item of cycleResult.sensitivityAnalysis) {
        const sign = item.impact > 0 ? '+' : '';
        report += `${item.factor}: ${sign}${item.impact.toFixed(2)}%\n`;
      }
    }

    if (sectionResult) {
      report += '\n--- 截面分析 ---\n';
      report += `截面轴向: ${sectionResult.plane.axis.toUpperCase()}轴\n`;
      report += `截面位置: ${sectionResult.plane.position.toFixed(2)} mm\n`;
      report += `截面积: ${sectionResult.area.toFixed(2)} mm²\n`;
      report += `截面周长: ${sectionResult.perimeter.toFixed(2)} mm\n`;
      report += `轮廓数量: ${sectionResult.contourPoints.length}\n`;
      if (sectionResult.thicknessSamples.length > 0) {
        report += `最小壁厚: ${sectionResult.minThickness.toFixed(2)} mm\n`;
        report += `最大壁厚: ${sectionResult.maxThickness.toFixed(2)} mm\n`;
        report += `平均壁厚: ${sectionResult.avgThickness.toFixed(2)} mm\n`;
      }
    }

    if (modelDiffResult && model2) {
      report += '\n--- 模型对比分析 ---\n';
      report += `模型1: ${modelFileName || '示例模型'}\n`;
      report += `模型2: ${model2FileName || '示例模型'}\n`;
      report += `对比模式: ${compareMode === 'overlay' ? '叠加显示' : compareMode === 'sidebyside' ? '并排显示' : '差异颜色映射'}\n`;
      report += `最大凸出: ${modelDiffResult.maxDistance.toFixed(2)} mm\n`;
      report += `最大凹陷: ${modelDiffResult.minDistance.toFixed(2)} mm\n`;
      report += `平均差异: ${modelDiffResult.avgDistance.toFixed(2)} mm\n`;
      report += `凸出顶点数: ${modelDiffResult.positiveCount}\n`;
      report += `凹陷顶点数: ${modelDiffResult.negativeCount}\n`;
      report += `无差异顶点数: ${modelDiffResult.zeroCount}\n`;
    }

    report += '\n========================================\n';
    report += '报告结束\n';
    report += '========================================\n';

    return report;
  };

  return (
    <div className="w-full h-full bg-surface-panel flex flex-col overflow-hidden">
      <div className="p-4 border-b border-edge-subtle flex items-center justify-between">
        <h3 className="text-sm font-semibold text-content-secondary">分析结果</h3>
        <button
          onClick={exportReport}
          disabled={!draftAngleResult && !wallThicknessResult && !drainHoleResult && !cycleResult && !sectionResult && !modelDiffResult}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-elevated hover:bg-surface-hover text-content-secondary text-xs rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={14} />
          导出报告
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {analysisMode === 'none' && (
          <div className="p-4">
            <div className="bg-surface-elevated/50 rounded-xl p-4 border border-edge-subtle">
              <div className="flex items-start gap-3">
                <Info size={20} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-content-secondary mb-1">使用说明</h4>
                  <p className="text-xs text-content-muted leading-relaxed">
                    请从左侧工具栏选择分析工具，系统将自动计算并显示分析结果。
                    支持脱模角度分析、壁厚分布检测、滤水孔规划和成型周期预估。
                  </p>
                </div>
              </div>
            </div>

            {model && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-content-secondary mb-3 flex items-center gap-2">
                  <Triangle size={14} className="text-cyan-400" />
                  模型信息
                </h4>
                <div className="bg-surface-elevated/30 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-content-muted">文件名</span>
                    <span className="text-content-secondary font-mono">{modelFileName || '示例模型'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-content-muted">顶点数</span>
                    <span className="text-content-secondary font-mono">{model.vertexCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-content-muted">面数</span>
                    <span className="text-content-secondary font-mono">{model.faceCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-content-muted">尺寸</span>
                    <span className="text-content-secondary font-mono text-right">
                      {model.boundingBox.size.x.toFixed(1)} × {model.boundingBox.size.y.toFixed(1)} × {model.boundingBox.size.z.toFixed(1)} mm
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {analysisMode === 'draft' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Triangle size={16} className="text-orange-400" />
              <h4 className="text-sm font-medium text-content-secondary">脱模角度分析</h4>
            </div>

            {draftAngleResult ? (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-surface-elevated/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-content-muted mb-1">最小</p>
                    <p className="text-lg font-bold text-orange-400 font-mono">
                      {draftAngleResult.minAngle.toFixed(1)}°
                    </p>
                  </div>
                  <div className="bg-surface-elevated/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-content-muted mb-1">平均</p>
                    <p className="text-lg font-bold text-cyan-400 font-mono">
                      {draftAngleResult.avgAngle.toFixed(1)}°
                    </p>
                  </div>
                  <div className="bg-surface-elevated/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-content-muted mb-1">最大</p>
                    <p className="text-lg font-bold text-green-400 font-mono">
                      {draftAngleResult.maxAngle.toFixed(1)}°
                    </p>
                  </div>
                </div>

                <div
                  className={`rounded-lg p-3 flex items-start gap-2 ${
                    draftAngleResult.undercutFaceCount > 0
                      ? 'bg-orange-500/10 border border-orange-500/30'
                      : 'bg-green-500/10 border border-green-500/30'
                  }`}
                >
                  {draftAngleResult.undercutFaceCount > 0 ? (
                    <AlertTriangle size={18} className="text-orange-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle size={18} className="text-green-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-xs font-medium text-content-secondary">
                      {draftAngleResult.undercutFaceCount > 0
                        ? '存在倒扣区域'
                        : '脱模角度合格'}
                    </p>
                    <p className="text-xs text-content-muted mt-0.5">
                      共 {draftAngleResult.undercutFaceCount} 个面小于 {draftAngleResult.threshold}°
                      {draftAngleResult.undercutRegions.length > 0 && `，分为 ${draftAngleResult.undercutRegions.length} 个连通区域`}
                    </p>
                  </div>
                  {draftAngleResult.undercutRegions.length > 0 && (
                    <button
                      onClick={() => setHighlightUndercuts(!highlightUndercuts)}
                      className="text-xs px-2 py-1 rounded bg-surface-elevated hover:bg-surface-hover text-content-secondary transition-colors"
                      title={highlightUndercuts ? '关闭3D高亮' : '开启3D高亮'}
                    >
                      {highlightUndercuts ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                  )}
                </div>

                <div>
                  <p className="text-xs text-content-muted mb-2">角度分布</p>
                  <DraftAngleChart result={draftAngleResult} />
                </div>

                {draftAngleResult.undercutRegions.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Maximize2 size={14} className="text-orange-400" />
                        <h5 className="text-xs font-medium text-content-secondary">倒扣区域列表</h5>
                        <span className="text-[10px] px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded">
                          {draftAngleResult.undercutRegions.length}
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedUndercutRegionId(null)}
                        className="text-[10px] text-content-muted hover:text-content-secondary transition-colors"
                      >
                        取消选中
                      </button>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {draftAngleResult.undercutRegions.map((region) => {
                        const isSelected = selectedUndercutRegionId === region.id;
                        const severityColors: Record<string, string> = {
                          critical: 'bg-red-500',
                          high: 'bg-orange-500',
                          medium: 'bg-yellow-500',
                          low: 'bg-green-500',
                        };
                        const severityLabels: Record<string, string> = {
                          critical: '严重',
                          high: '高',
                          medium: '中',
                          low: '低',
                        };

                        return (
                          <div
                            key={region.id}
                            className={`rounded-lg border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-orange-500/15 border-orange-500/50'
                                : 'bg-surface-elevated/30 border-edge-subtle hover:bg-surface-elevated/50 hover:border-edge-base'
                            }`}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedUndercutRegionId(null);
                              } else {
                                focusOnUndercutRegion(region.id);
                              }
                            }}
                          >
                            <div className="p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className={`w-2.5 h-2.5 rounded-full ${severityColors[region.severity]}`} />
                                  <span className="text-xs font-semibold text-content-secondary">
                                    {region.id.toUpperCase()}
                                  </span>
                                  <span className="text-[10px] px-1.5 py-0.5 bg-surface-active rounded text-content-muted">
                                    {severityLabels[region.severity]}
                                  </span>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    focusOnUndercutRegion(region.id);
                                  }}
                                  className="p-1 rounded hover:bg-surface-hover text-content-muted hover:text-cyan-400 transition-colors"
                                  title="定位到该区域"
                                >
                                  <Crosshair size={12} />
                                </button>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-[10px]">
                                <div className="bg-surface-inset/50 rounded px-2 py-1">
                                  <span className="text-content-muted">角度</span>
                                  <p className="text-content-secondary font-mono mt-0.5">
                                    {region.avgAngle.toFixed(1)}°
                                  </p>
                                </div>
                                <div className="bg-surface-inset/50 rounded px-2 py-1">
                                  <span className="text-content-muted">面积</span>
                                  <p className="text-content-secondary font-mono mt-0.5">
                                    {region.area.toFixed(1)}mm²
                                  </p>
                                </div>
                                <div className="bg-surface-inset/50 rounded px-2 py-1">
                                  <span className="text-content-muted">尺寸</span>
                                  <p className="text-content-secondary font-mono mt-0.5">
                                    {region.dimensions.width.toFixed(0)}×{region.dimensions.height.toFixed(0)}×{region.dimensions.depth.toFixed(0)}
                                  </p>
                                </div>
                                <div className="bg-surface-inset/50 rounded px-2 py-1">
                                  <span className="text-content-muted">面数</span>
                                  <p className="text-content-secondary font-mono mt-0.5">
                                    {region.faceIndices.length}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {draftAngleResult.repairSuggestions.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Lightbulb size={14} className="text-yellow-400" />
                      <h5 className="text-xs font-medium text-content-secondary">修复建议</h5>
                      <span className="text-[10px] px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded">
                        {draftAngleResult.repairSuggestions.length}
                      </span>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {draftAngleResult.repairSuggestions.map((suggestion) => {
                        const typeIcons: Record<string, React.ReactNode> = {
                          add_draft: <Triangle size={12} />,
                          fillet: <Square size={12} />,
                          chamfer: <Minus size={12} />,
                          redesign: <Wrench size={12} />,
                          split: <Scissors size={12} />,
                        };
                        const difficultyColors: Record<string, string> = {
                          easy: 'text-green-400 bg-green-500/20',
                          medium: 'text-yellow-400 bg-yellow-500/20',
                          hard: 'text-red-400 bg-red-500/20',
                        };
                        const difficultyLabels: Record<string, string> = {
                          easy: '简单',
                          medium: '中等',
                          hard: '困难',
                        };
                        const relatedRegion = draftAngleResult.undercutRegions.find(
                          (r) => r.id === suggestion.regionId
                        );

                        return (
                          <div
                            key={suggestion.id}
                            className="bg-surface-elevated/30 rounded-lg border border-edge-subtle overflow-hidden"
                          >
                            <div
                              className="p-3 cursor-pointer hover:bg-surface-elevated/50 transition-colors"
                              onClick={() => {
                                if (relatedRegion) {
                                  focusOnUndercutRegion(suggestion.regionId);
                                }
                              }}
                            >
                              <div className="flex items-start gap-2">
                                <div className="p-1.5 bg-cyan-500/20 rounded text-cyan-400 mt-0.5">
                                  {typeIcons[suggestion.type] || <Lightbulb size={12} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-medium text-content-secondary">
                                      {suggestion.title}
                                    </span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${difficultyColors[suggestion.difficulty]}`}>
                                      {difficultyLabels[suggestion.difficulty]}
                                    </span>
                                    {relatedRegion && (
                                      <span className="text-[10px] px-1.5 py-0.5 bg-surface-active rounded text-content-muted">
                                        {relatedRegion.id.toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-content-muted leading-relaxed">
                                    {suggestion.description}
                                  </p>
                                  <div className="mt-2 flex items-center gap-2">
                                    <CheckCircle size={10} className="text-green-400 flex-shrink-0" />
                                    <span className="text-[10px] text-green-400">
                                      预期效果: {suggestion.estimatedImprovement}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-content-faint text-sm">
                正在计算...
              </div>
            )}
          </div>
        )}

        {analysisMode === 'thickness' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ruler size={16} className="text-cyan-400" />
                <h4 className="text-sm font-medium text-content-secondary">壁厚分布分析</h4>
              </div>
              <button
                onClick={() => setShowThicknessHeatmap(!showThicknessHeatmap)}
                className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-surface-elevated hover:bg-surface-hover text-content-muted hover:text-content-secondary transition-colors"
                title={showThicknessHeatmap ? '隐藏表面热力图' : '显示表面热力图'}
              >
                {showThicknessHeatmap ? <Eye size={12} /> : <EyeOff size={12} />}
                {showThicknessHeatmap ? '热力图开' : '热力图关'}
              </button>
            </div>

            {wallThicknessResult ? (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-surface-elevated/50 rounded-lg p-3 text-center relative">
                    <p className="text-xs text-content-muted mb-1">最薄</p>
                    <p className="text-lg font-bold text-red-400 font-mono">
                      {wallThicknessResult.minThickness.toFixed(2)}
                    </p>
                    <p className="text-xs text-content-faint">mm</p>
                    <button
                      onClick={focusOnThinnestPoint}
                      className="absolute top-1 right-1 p-1 rounded hover:bg-surface-hover text-content-muted hover:text-red-400 transition-colors"
                      title="定位到最薄位置"
                    >
                      <Crosshair size={11} />
                    </button>
                  </div>
                  <div className="bg-surface-elevated/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-content-muted mb-1">平均</p>
                    <p className="text-lg font-bold text-cyan-400 font-mono">
                      {wallThicknessResult.avgThickness.toFixed(2)}
                    </p>
                    <p className="text-xs text-content-faint">mm</p>
                  </div>
                  <div className="bg-surface-elevated/50 rounded-lg p-3 text-center relative">
                    <p className="text-xs text-content-muted mb-1">最厚</p>
                    <p className="text-lg font-bold text-blue-400 font-mono">
                      {wallThicknessResult.maxThickness.toFixed(2)}
                    </p>
                    <p className="text-xs text-content-faint">mm</p>
                    <button
                      onClick={focusOnThickestPoint}
                      className="absolute top-1 right-1 p-1 rounded hover:bg-surface-hover text-content-muted hover:text-blue-400 transition-colors"
                      title="定位到最厚位置"
                    >
                      <Crosshair size={11} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={focusOnThinnestPoint}
                    className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 transition-colors"
                  >
                    <Crosshair size={11} />
                    定位最薄点
                  </button>
                  <button
                    onClick={focusOnThickestPoint}
                    className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/30 transition-colors"
                  >
                    <Crosshair size={11} />
                    定位最厚点
                  </button>
                </div>

                <div className="bg-surface-elevated/30 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Palette size={12} className="text-cyan-400" />
                    <span className="text-xs text-content-muted">配色方案</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['rainbow', 'coolwarm', 'grayscale'] as ThicknessColorScheme[]).map((scheme) => {
                      const labels: Record<ThicknessColorScheme, string> = {
                        rainbow: '彩虹',
                        coolwarm: '冷暖',
                        grayscale: '灰度',
                      };
                      const active = thicknessColorScheme === scheme;
                      return (
                        <button
                          key={scheme}
                          onClick={() => setThicknessColorScheme(scheme)}
                          className={`text-[11px] px-2 py-1.5 rounded-md transition-colors font-medium ${
                            active
                              ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/50'
                              : 'bg-surface-elevated/60 text-content-muted hover:bg-surface-elevated hover:text-content-secondary border border-transparent'
                          }`}
                        >
                          {labels[scheme]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-surface-elevated/30 rounded-lg p-3">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-content-muted">采样点数</span>
                    <span className="text-content-secondary font-mono">
                      {wallThicknessResult.sampleCount}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-content-muted">壁厚均匀度</span>
                    <span className="text-content-secondary">
                      {wallThicknessResult.maxThickness > 0
                        ? (
                            (1 -
                              (wallThicknessResult.maxThickness -
                                wallThicknessResult.minThickness) /
                                wallThicknessResult.avgThickness) *
                            100
                          ).toFixed(1)
                        : 0}
                      %
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-content-muted mb-2">壁厚分布</p>
                  <ThicknessChart result={wallThicknessResult} />
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-content-faint text-sm">
                正在计算...
              </div>
            )}
          </div>
        )}

        {analysisMode === 'holes' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CircleDot size={16} className="text-purple-400" />
                <h4 className="text-sm font-medium text-content-secondary">滤水孔规划</h4>
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full">
                {drainHoleResult?.totalCount || 0} 个
              </span>
            </div>

            {drainHoleResult ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-surface-elevated/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-content-muted mb-1">总孔数</p>
                    <p className="text-2xl font-bold text-purple-400 font-mono">
                      {drainHoleResult.totalCount}
                    </p>
                  </div>
                  <div className="bg-surface-elevated/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-content-muted mb-1">开孔面积</p>
                    <p className="text-2xl font-bold text-cyan-400 font-mono">
                      {drainHoleResult.totalArea.toFixed(0)}
                    </p>
                    <p className="text-xs text-content-faint">mm²</p>
                  </div>
                </div>

                <div className="bg-surface-elevated/30 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500" />
                      <span className="text-content-muted">吸水孔</span>
                    </div>
                    <span className="text-content-secondary font-mono">{drainHoleResult.suctionCount} 个</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-cyan-500" />
                      <span className="text-content-muted">脱水孔</span>
                    </div>
                    <span className="text-content-secondary font-mono">{drainHoleResult.dewateringCount} 个</span>
                  </div>
                </div>

                <div className="bg-surface-elevated/30 rounded-lg p-3">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-content-muted">开孔密度</span>
                    <span className="text-content-secondary font-mono">
                      {drainHoleResult.recommendedDensity.toFixed(2)}%
                    </span>
                  </div>
                  <div className="w-full bg-surface-inset rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-purple-500 h-2 rounded-full"
                      style={{ width: `${Math.min(drainHoleResult.recommendedDensity * 10, 100)}%` }}
                    />
                  </div>
                </div>

                {selectedHoleId && (
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-medium text-purple-400 flex items-center gap-1.5">
                        <Edit3 size={12} />
                        孔参数编辑
                      </h5>
                      <button
                        onClick={() => setSelectedHoleId(null)}
                        className="text-[10px] text-content-muted hover:text-content-secondary transition-colors"
                      >
                        关闭
                      </button>
                    </div>
                    {(() => {
                      const hole = drainHoleResult.holes.find((h) => h.id === selectedHoleId);
                      if (!hole) return null;
                      return (
                        <>
                          <div>
                            <label className="text-[10px] text-content-muted block mb-1">
                              直径: {hole.diameter.toFixed(1)} mm
                            </label>
                            <input
                              type="range"
                              min="1"
                              max="10"
                              step="0.5"
                              value={hole.diameter}
                              onChange={(e) => {
                                updateDrainHole(selectedHoleId, {
                                  diameter: parseFloat(e.target.value),
                                });
                              }}
                              className="w-full h-1.5 bg-surface-active rounded-lg appearance-none cursor-pointer accent-purple-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-content-muted block mb-1">
                              深度: {hole.depth.toFixed(1)} mm
                            </label>
                            <input
                              type="range"
                              min="1"
                              max="20"
                              step="0.5"
                              value={hole.depth}
                              onChange={(e) => {
                                updateDrainHole(selectedHoleId, {
                                  depth: parseFloat(e.target.value),
                                });
                              }}
                              className="w-full h-1.5 bg-surface-active rounded-lg appearance-none cursor-pointer accent-purple-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-content-muted block mb-1.5">
                              孔类型
                            </label>
                            <div className="flex gap-2">
                              {[
                                { id: 'dewatering', label: '脱水孔' },
                                { id: 'suction', label: '吸水孔' },
                              ].map((type) => (
                                <button
                                  key={type.id}
                                  onClick={() => {
                                    updateDrainHole(selectedHoleId, {
                                      type: type.id as any,
                                    });
                                  }}
                                  className={`flex-1 py-1.5 text-[10px] rounded transition-colors ${
                                    hole.type === type.id
                                      ? type.id === 'suction'
                                        ? 'bg-orange-500/25 text-orange-400 border border-orange-500/50'
                                        : 'bg-cyan-500/25 text-cyan-400 border border-cyan-500/50'
                                      : 'bg-surface-elevated/60 text-content-muted hover:bg-surface-elevated border border-transparent'
                                  }`}
                                >
                                  {type.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-[10px]">
                            <div className="bg-surface-inset/50 rounded px-2 py-1.5">
                              <span className="text-content-muted">X</span>
                              <p className="text-content-secondary font-mono mt-0.5">
                                {hole.position.x.toFixed(1)}
                              </p>
                            </div>
                            <div className="bg-surface-inset/50 rounded px-2 py-1.5">
                              <span className="text-content-muted">Y</span>
                              <p className="text-content-secondary font-mono mt-0.5">
                                {hole.position.y.toFixed(1)}
                              </p>
                            </div>
                            <div className="bg-surface-inset/50 rounded px-2 py-1.5">
                              <span className="text-content-muted">Z</span>
                              <p className="text-content-secondary font-mono mt-0.5">
                                {hole.position.z.toFixed(1)}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setCameraFocusTarget({ ...hole.position });
                              }}
                              className="flex-1 py-1.5 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 text-[10px] rounded transition-colors flex items-center justify-center gap-1"
                            >
                              <Crosshair size={10} />
                              定位
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('确定删除该滤水孔？')) {
                                  removeDrainHole(selectedHoleId);
                                }
                              }}
                              className="flex-1 py-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-400 text-[10px] rounded transition-colors flex items-center justify-center gap-1"
                            >
                              <Trash2 size={10} />
                              删除
                            </button>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-medium text-content-secondary flex items-center gap-1.5">
                      <Settings size={12} className="text-purple-400" />
                      孔列表
                    </h5>
                    <span className="text-[10px] text-content-muted">
                      点击选中编辑
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                    {drainHoleResult.holes.map((hole, index) => {
                      const isSelected = selectedHoleId === hole.id;
                      return (
                        <div
                          key={hole.id}
                          onClick={() => {
                            setSelectedHoleId(isSelected ? null : hole.id);
                          }}
                          className={`rounded-lg p-2.5 cursor-pointer transition-all border ${
                            isSelected
                              ? 'bg-purple-500/15 border-purple-500/50'
                              : 'bg-surface-elevated/30 border-transparent hover:bg-surface-elevated/50 hover:border-edge-subtle'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-3 h-3 rounded-full ${
                                  hole.type === 'suction' ? 'bg-orange-500' : 'bg-cyan-500'
                                }`}
                              />
                              <span className="text-xs font-medium text-content-secondary font-mono">
                                #{index + 1}
                              </span>
                            </div>
                            <span className="text-[10px] text-content-muted">
                              {hole.type === 'suction' ? '吸水孔' : '脱水孔'}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-[10px]">
                            <div>
                              <span className="text-content-muted">直径</span>
                              <p className="text-content-secondary font-mono">
                                {hole.diameter.toFixed(1)}mm
                              </p>
                            </div>
                            <div>
                              <span className="text-content-muted">深度</span>
                              <p className="text-content-secondary font-mono">
                                {hole.depth.toFixed(1)}mm
                              </p>
                            </div>
                            <div className="text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCameraFocusTarget({ ...hole.position });
                                }}
                                className="p-1 rounded hover:bg-surface-hover text-content-muted hover:text-cyan-400 transition-colors"
                                title="定位到该孔"
                              >
                                <Crosshair size={10} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-content-faint text-sm">
                正在计算...
              </div>
            )}
          </div>
        )}

        {analysisMode === 'cycle' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-green-400" />
              <h4 className="text-sm font-medium text-content-secondary">成型周期预估</h4>
            </div>

            {cycleResult ? (
              <>
                <div className="bg-gradient-to-br from-green-500/20 to-cyan-500/20 rounded-xl p-4 border border-green-500/30 text-center">
                  <p className="text-xs text-content-muted mb-1">预估总周期</p>
                  <p className="text-3xl font-bold text-content-primary font-mono">
                    {cycleResult.totalTime.toFixed(1)}
                  </p>
                  <p className="text-sm text-content-muted">秒</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-cyan-500" />
                      <span className="text-content-muted">吸浆</span>
                    </div>
                    <span className="text-content-secondary font-mono">{cycleResult.suctionTime.toFixed(1)}s</span>
                  </div>
                  <div className="w-full bg-surface-inset rounded-full h-1.5">
                    <div
                      className="bg-cyan-500 h-1.5 rounded-full"
                      style={{ width: `${(cycleResult.suctionTime / cycleResult.totalTime) * 100}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs mt-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-purple-500" />
                      <span className="text-content-muted">压制</span>
                    </div>
                    <span className="text-content-secondary font-mono">{cycleResult.pressingTime.toFixed(1)}s</span>
                  </div>
                  <div className="w-full bg-surface-inset rounded-full h-1.5">
                    <div
                      className="bg-purple-500 h-1.5 rounded-full"
                      style={{ width: `${(cycleResult.pressingTime / cycleResult.totalTime) * 100}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs mt-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-orange-500" />
                      <span className="text-content-muted">干燥</span>
                    </div>
                    <span className="text-content-secondary font-mono">{cycleResult.dryingTime.toFixed(1)}s</span>
                  </div>
                  <div className="w-full bg-surface-inset rounded-full h-1.5">
                    <div
                      className="bg-orange-500 h-1.5 rounded-full"
                      style={{ width: `${(cycleResult.dryingTime / cycleResult.totalTime) * 100}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs mt-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-green-500" />
                      <span className="text-content-muted">脱模</span>
                    </div>
                    <span className="text-content-secondary font-mono">{cycleResult.demoldingTime.toFixed(1)}s</span>
                  </div>
                  <div className="w-full bg-surface-inset rounded-full h-1.5">
                    <div
                      className="bg-green-500 h-1.5 rounded-full"
                      style={{ width: `${(cycleResult.demoldingTime / cycleResult.totalTime) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <p className="text-xs text-content-muted mb-2">周期分布</p>
                  <CyclePieChart result={cycleResult} />
                </div>

                <div>
                  <p className="text-xs text-content-muted mb-2">灵敏度分析</p>
                  <div className="space-y-1.5">
                    {cycleResult.sensitivityAnalysis.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between text-xs bg-surface-elevated/50 rounded px-2 py-1.5"
                      >
                        <span className="text-content-muted">{item.factor}</span>
                        <div className="flex items-center gap-1">
                          {item.impact < -1 ? (
                            <TrendingDown size={12} className="text-green-400" />
                          ) : item.impact > 1 ? (
                            <TrendingUp size={12} className="text-red-400" />
                          ) : (
                            <Minus size={12} className="text-content-faint" />
                          )}
                          <span
                            className={`font-mono ${
                              item.impact < 0 ? 'text-green-400' : 'text-red-400'
                            }`}
                          >
                            {item.impact > 0 ? '+' : ''}
                            {item.impact.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-content-faint text-sm">
                正在计算...
              </div>
            )}
          </div>
        )}

        {analysisMode === 'section' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Scissors size={16} className="text-cyan-400" />
              <h4 className="text-sm font-medium text-content-secondary">截面分析</h4>
            </div>

            {sectionResult ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-surface-elevated/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-content-muted mb-1">截面积</p>
                    <p className="text-lg font-bold text-cyan-400 font-mono">
                      {sectionResult.area.toFixed(1)}
                    </p>
                    <p className="text-xs text-content-faint">mm²</p>
                  </div>
                  <div className="bg-surface-elevated/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-content-muted mb-1">周长</p>
                    <p className="text-lg font-bold text-purple-400 font-mono">
                      {sectionResult.perimeter.toFixed(1)}
                    </p>
                    <p className="text-xs text-content-faint">mm</p>
                  </div>
                </div>

                <div className="bg-surface-elevated/30 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <Square size={12} className="text-cyan-400" />
                      <span className="text-content-muted">截面轴向</span>
                    </div>
                    <span className="text-content-secondary font-mono">
                      {sectionResult.plane.axis.toUpperCase()}轴
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-content-muted">截面位置</span>
                    <span className="text-content-secondary font-mono">
                      {sectionResult.plane.position.toFixed(2)} mm
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-content-muted">轮廓数量</span>
                    <span className="text-content-secondary font-mono">
                      {sectionResult.contourPoints.length}
                    </span>
                  </div>
                </div>

                {sectionResult.thicknessSamples.length > 0 && (
                  <>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-surface-elevated/50 rounded-lg p-2 text-center">
                        <p className="text-xs text-content-muted mb-1">最薄</p>
                        <p className="text-base font-bold text-red-400 font-mono">
                          {sectionResult.minThickness.toFixed(2)}
                        </p>
                        <p className="text-[10px] text-content-faint">mm</p>
                      </div>
                      <div className="bg-surface-elevated/50 rounded-lg p-2 text-center">
                        <p className="text-xs text-content-muted mb-1">平均</p>
                        <p className="text-base font-bold text-cyan-400 font-mono">
                          {sectionResult.avgThickness.toFixed(2)}
                        </p>
                        <p className="text-[10px] text-content-faint">mm</p>
                      </div>
                      <div className="bg-surface-elevated/50 rounded-lg p-2 text-center">
                        <p className="text-xs text-content-muted mb-1">最厚</p>
                        <p className="text-base font-bold text-blue-400 font-mono">
                          {sectionResult.maxThickness.toFixed(2)}
                        </p>
                        <p className="text-[10px] text-content-faint">mm</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-content-muted mb-2">壁厚曲线（沿截面轮廓）</p>
                      <SectionThicknessCurve
                        samples={sectionResult.thicknessSamples}
                        minThickness={sectionResult.minThickness}
                        maxThickness={sectionResult.maxThickness}
                        avgThickness={sectionResult.avgThickness}
                      />
                    </div>

                    <div>
                      <p className="text-xs text-content-muted mb-2">壁厚分布</p>
                      <ThicknessChart result={{
                        samples: [],
                        minThickness: sectionResult.minThickness,
                        maxThickness: sectionResult.maxThickness,
                        avgThickness: sectionResult.avgThickness,
                        thicknessDistribution: sectionResult.thicknessDistribution,
                        sampleCount: sectionResult.thicknessSamples.length,
                      }} />
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-content-faint text-sm">
                正在计算...
              </div>
            )}
          </div>
        )}

        {analysisMode === 'compare' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <GitCompare size={16} className="text-cyan-400" />
              <h4 className="text-sm font-medium text-content-secondary">模型对比分析</h4>
            </div>

            <div className="bg-surface-elevated/30 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#6b8e9e' }} />
                <span className="text-xs text-content-muted">模型1</span>
                <span className="text-xs text-content-secondary font-mono ml-auto truncate max-w-[150px]">
                  {modelFileName || '未导入'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#e07a5f' }} />
                <span className="text-xs text-content-muted">模型2</span>
                <span className="text-xs text-content-secondary font-mono ml-auto truncate max-w-[150px]">
                  {model2FileName || '未导入'}
                </span>
              </div>
            </div>

            <div className="bg-surface-elevated/30 rounded-lg p-3">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-content-muted">对比模式</span>
                <span className="text-content-secondary font-medium">
                  {compareMode === 'overlay' && '叠加显示'}
                  {compareMode === 'sidebyside' && '并排显示'}
                  {compareMode === 'diffcolormap' && '差异颜色映射'}
                </span>
              </div>
            </div>

            {modelDiffResult && compareMode === 'diffcolormap' ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-surface-elevated/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-content-muted mb-1">最大凸出</p>
                    <p className="text-lg font-bold text-red-400 font-mono">
                      {modelDiffResult.maxDistance.toFixed(2)}
                    </p>
                    <p className="text-xs text-content-faint">mm</p>
                  </div>
                  <div className="bg-surface-elevated/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-content-muted mb-1">最大凹陷</p>
                    <p className="text-lg font-bold text-blue-400 font-mono">
                      {Math.abs(modelDiffResult.minDistance).toFixed(2)}
                    </p>
                    <p className="text-xs text-content-faint">mm</p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-xl p-4 border border-cyan-500/30 text-center">
                  <p className="text-xs text-content-muted mb-1">平均几何差异</p>
                  <p className="text-2xl font-bold text-content-primary font-mono">
                    {modelDiffResult.avgDistance.toFixed(2)}
                  </p>
                  <p className="text-sm text-content-muted">mm</p>
                </div>

                <div className="bg-surface-elevated/30 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="text-content-muted">凸出顶点</span>
                    </div>
                    <span className="text-content-secondary font-mono">{modelDiffResult.positiveCount} 个</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-content-muted">凹陷顶点</span>
                    </div>
                    <span className="text-content-secondary font-mono">{modelDiffResult.negativeCount} 个</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-500" />
                      <span className="text-content-muted">无差异顶点</span>
                    </div>
                    <span className="text-content-secondary font-mono">{modelDiffResult.zeroCount} 个</span>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-content-muted mb-2">差异分布</p>
                  <ThicknessChart result={{
                    samples: [],
                    minThickness: modelDiffResult.minDistance,
                    maxThickness: modelDiffResult.maxDistance,
                    avgThickness: modelDiffResult.avgDistance,
                    thicknessDistribution: modelDiffResult.distanceDistribution,
                    sampleCount: modelDiffResult.vertexDistances.length,
                  }} />
                </div>
              </>
            ) : (
              !model || !model2 ? (
                <div className="text-center py-8 text-content-faint text-sm">
                  请先导入两个模型
                </div>
              ) : compareMode !== 'diffcolormap' ? (
                <div className="text-center py-4 text-content-muted text-xs">
                  选择「差异色」模式可查看几何差异分析结果
                </div>
              ) : (
                <div className="text-center py-8 text-content-faint text-sm">
                  正在计算差异...
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
