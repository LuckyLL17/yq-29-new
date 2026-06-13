import { useState, useRef } from 'react';
import {
  Layers,
  Eye,
  EyeOff,
  Palette,
  Box,
  ChevronDown,
  ChevronUp,
  Sliders,
  RotateCcw,
  Maximize2,
  Package,
  Sparkles,
  Settings2,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { splitModel } from '@/utils/layerSplitter';
import { createSampleBoxModel } from '@/utils/modelLoader';
import type { LayerSplitAxis } from '@/types';

const AXIS_OPTIONS: { value: LayerSplitAxis; label: string; desc: string }[] = [
  { value: 'x', label: 'X轴', desc: '左右分割' },
  { value: 'y', label: 'Y轴', desc: '上下分割' },
  { value: 'z', label: 'Z轴', desc: '前后分割' },
];

const COUNT_OPTIONS = [2, 3, 4, 5, 6, 8, 10, 12, 16];

export function LayerPanel() {
  const model = useAppStore((state) => state.model);
  const layersEnabled = useAppStore((state) => state.layersEnabled);
  const modelLayers = useAppStore((state) => state.modelLayers);
  const layerSplitStrategy = useAppStore((state) => state.layerSplitStrategy);
  const isLayerExploded = useAppStore((state) => state.isLayerExploded);
  const layerExplosionAmount = useAppStore((state) => state.layerExplosionAmount);

  const setLayersEnabled = useAppStore((state) => state.setLayersEnabled);
  const setModelLayers = useAppStore((state) => state.setModelLayers);
  const setLayerSplitStrategy = useAppStore((state) => state.setLayerSplitStrategy);
  const toggleLayerVisibility = useAppStore((state) => state.toggleLayerVisibility);
  const setLayerOpacity = useAppStore((state) => state.setLayerOpacity);
  const setLayerColor = useAppStore((state) => state.setLayerColor);
  const setLayerExplosionAmount = useAppStore((state) => state.setLayerExplosionAmount);
  const setIsLayerExploded = useAppStore((state) => state.setIsLayerExploded);
  const showAllLayers = useAppStore((state) => state.showAllLayers);
  const hideAllLayers = useAppStore((state) => state.hideAllLayers);
  const resetLayerColors = useAppStore((state) => state.resetLayerColors);
  const resetLayers = useAppStore((state) => state.resetLayers);
  const explodeLayersByAxis = useAppStore((state) => state.explodeLayersByAxis);

  const [showSettings, setShowSettings] = useState(true);
  const colorInputsRef = useRef<Map<string, HTMLInputElement>>(new Map());

  const displayModel = model || createSampleBoxModel();

  const handleApplyLayers = () => {
    try {
      const layers = splitModel(displayModel, layerSplitStrategy);
      setModelLayers(layers);
      setLayersEnabled(true);
    } catch (e) {
      console.error('Failed to split model:', e);
    }
  };

  const handleDisableLayers = () => {
    resetLayers();
  };

  const visibleCount = modelLayers.filter((l) => l.visible).length;

  return (
    <div className="w-full h-full bg-surface-panel flex flex-col overflow-hidden">
      <div className="p-4 border-b border-edge-subtle flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-cyan-400" />
          <h3 className="text-sm font-semibold text-content-secondary">图层管理</h3>
        </div>
        {layersEnabled && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            {modelLayers.length} 层
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {!layersEnabled && (
            <div className="bg-surface-elevated/50 rounded-xl p-4 border border-edge-subtle">
              <div className="flex items-start gap-3 mb-4">
                <Sparkles size={20} className="text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-content-secondary mb-1">
                    启用图层模式
                  </h4>
                  <p className="text-xs text-content-muted leading-relaxed">
                    将模型拆分为独立图层，支持分别控制各部分的显示、透明度、颜色及爆炸视图。
                  </p>
                </div>
              </div>

              <button
                onClick={handleApplyLayers}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-cyan-500/20"
              >
                启用图层并拆分模型
              </button>
            </div>
          )}

          {layersEnabled && (
            <>
              <div className="space-y-3">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="w-full flex items-center justify-between p-3 bg-surface-elevated/50 rounded-lg border border-edge-subtle hover:bg-surface-elevated transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Settings2 size={14} className="text-content-muted" />
                    <span className="text-xs font-medium text-content-secondary">
                      分层设置
                    </span>
                  </div>
                  {showSettings ? (
                    <ChevronUp size={14} className="text-content-faint" />
                  ) : (
                    <ChevronDown size={14} className="text-content-faint" />
                  )}
                </button>

                {showSettings && (
                  <div className="p-3 bg-surface-elevated/30 rounded-lg border border-edge-subtle space-y-4">
                    <div>
                      <label className="text-xs text-content-muted mb-2 block">
                        分割轴
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {AXIS_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() =>
                              setLayerSplitStrategy({
                                type: 'axis',
                                axis: opt.value,
                                count:
                                  layerSplitStrategy.type === 'axis'
                                    ? layerSplitStrategy.count
                                    : 4,
                              })
                            }
                            className={`flex flex-col items-center py-2 px-1 rounded-lg border transition-all text-xs ${
                              layerSplitStrategy.type === 'axis' &&
                              layerSplitStrategy.axis === opt.value
                                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                                : 'bg-surface-inset border-edge-subtle text-content-muted hover:border-edge-base'
                            }`}
                          >
                            <span className="font-semibold">{opt.label}</span>
                            <span className="text-[10px] opacity-75 mt-0.5">
                              {opt.desc}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-content-muted mb-2 block">
                        图层数量
                        {layerSplitStrategy.type === 'axis' && (
                          <span className="text-cyan-400 ml-1">
                            ({layerSplitStrategy.count}层)
                          </span>
                        )}
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {COUNT_OPTIONS.map((n) => (
                          <button
                            key={n}
                            onClick={() =>
                              setLayerSplitStrategy({
                                type: 'axis',
                                axis:
                                  layerSplitStrategy.type === 'axis'
                                    ? layerSplitStrategy.axis
                                    : 'y',
                                count: n,
                              })
                            }
                            className={`w-8 h-8 rounded-md text-xs font-medium transition-all ${
                              layerSplitStrategy.type === 'axis' &&
                              layerSplitStrategy.count === n
                                ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/30'
                                : 'bg-surface-inset text-content-muted hover:bg-surface-elevated hover:text-content-secondary border border-edge-subtle'
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleApplyLayers}
                      className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      重新分层
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-surface-elevated/50 rounded-lg border border-edge-subtle">
                  <div className="flex items-center gap-2">
                    <Box size={14} className="text-orange-400" />
                    <span className="text-xs font-medium text-content-secondary">
                      爆炸视图
                    </span>
                  </div>
                  <button
                    onClick={() => setIsLayerExploded(!isLayerExploded)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                      isLayerExploded
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                        : 'bg-surface-inset text-content-muted hover:bg-surface-elevated border border-edge-subtle'
                    }`}
                  >
                    {isLayerExploded ? '组装' : '拆解'}
                  </button>
                </div>

                {isLayerExploded && (
                  <div className="p-3 bg-surface-elevated/30 rounded-lg border border-edge-subtle space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-content-muted">拆解距离</span>
                        <span className="text-orange-400 font-mono font-medium">
                          {layerExplosionAmount.toFixed(0)} mm
                        </span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="100"
                        step="1"
                        value={layerExplosionAmount}
                        onChange={(e) =>
                          setLayerExplosionAmount(Number(e.target.value))
                        }
                        className="w-full h-1.5 bg-surface-inset rounded-full appearance-none cursor-pointer accent-orange-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-content-muted mb-1.5 block">
                        拆解方向
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {AXIS_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => explodeLayersByAxis(opt.value)}
                            className="py-1.5 px-2 rounded-md text-[11px] bg-surface-inset text-content-muted hover:bg-orange-500/20 hover:text-orange-400 border border-edge-subtle hover:border-orange-500/30 transition-all"
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={showAllLayers}
                  disabled={visibleCount === modelLayers.length}
                  className="flex-1 py-2 flex items-center justify-center gap-1.5 bg-surface-inset hover:bg-surface-elevated text-content-secondary text-xs rounded-lg border border-edge-subtle transition-colors disabled:opacity-50"
                >
                  <Eye size={12} />
                  全部显示
                </button>
                <button
                  onClick={hideAllLayers}
                  disabled={visibleCount === 0}
                  className="flex-1 py-2 flex items-center justify-center gap-1.5 bg-surface-inset hover:bg-surface-elevated text-content-secondary text-xs rounded-lg border border-edge-subtle transition-colors disabled:opacity-50"
                >
                  <EyeOff size={12} />
                  全部隐藏
                </button>
                <button
                  onClick={resetLayerColors}
                  className="py-2 px-3 flex items-center justify-center bg-surface-inset hover:bg-surface-elevated text-content-secondary text-xs rounded-lg border border-edge-subtle transition-colors"
                  title="重置颜色"
                >
                  <Palette size={12} />
                </button>
              </div>
            </>
          )}

          {layersEnabled && modelLayers.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs text-content-muted">
                  图层列表 ({visibleCount}/{modelLayers.length})
                </span>
              </div>

              <div className="space-y-1.5">
                {modelLayers.map((layer, index) => (
                  <div
                    key={layer.id}
                    className={`p-3 rounded-lg border transition-all ${
                      layer.visible
                        ? 'bg-surface-elevated/50 border-edge-subtle'
                        : 'bg-surface-inset/50 border-edge-subtle/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        onClick={() => toggleLayerVisibility(layer.id)}
                        className={`p-1 rounded transition-colors ${
                          layer.visible
                            ? 'text-cyan-400 hover:bg-cyan-500/20'
                            : 'text-content-faint hover:bg-surface-elevated'
                        }`}
                        title={layer.visible ? '隐藏' : '显示'}
                      >
                        {layer.visible ? (
                          <Eye size={14} />
                        ) : (
                          <EyeOff size={14} />
                        )}
                      </button>

                      <div
                        className="w-4 h-4 rounded-md border-2 border-white/20 flex-shrink-0 cursor-pointer shadow-sm"
                        style={{ backgroundColor: layer.color }}
                        onClick={() =>
                          colorInputsRef.current.get(layer.id)?.click()
                        }
                      />
                      <input
                        ref={(el) => {
                          if (el) colorInputsRef.current.set(layer.id, el);
                        }}
                        type="color"
                        value={layer.color}
                        onChange={(e) =>
                          setLayerColor(layer.id, e.target.value)
                        }
                        className="absolute opacity-0 w-0 h-0 pointer-events-none"
                      />

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-content-secondary truncate">
                          <span className="text-content-faint mr-1">
                            #{index + 1}
                          </span>
                          {layer.name}
                        </p>
                      </div>
                    </div>

                    <div className="ml-7 space-y-2">
                      <div className="flex items-center gap-2">
                        <Sliders size={10} className="text-content-faint flex-shrink-0" />
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={layer.opacity}
                            onChange={(e) =>
                              setLayerOpacity(
                                layer.id,
                                Number(e.target.value)
                              )
                            }
                            className="flex-1 h-1 bg-surface-inset rounded-full appearance-none cursor-pointer accent-cyan-500"
                          />
                          <span className="text-[10px] font-mono text-content-faint w-10 text-right">
                            {(layer.opacity * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-[10px] text-content-faint">
                        <span className="flex items-center gap-1">
                          <Package size={10} />
                          {layer.geometry.faceCount.toLocaleString()} 面
                        </span>
                        <span>
                          {layer.geometry.vertexCount.toLocaleString()} 顶点
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {layersEnabled && (
        <div className="p-3 border-t border-edge-subtle">
          <button
            onClick={handleDisableLayers}
            className="w-full py-2 flex items-center justify-center gap-1.5 text-xs text-content-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <RotateCcw size={12} />
            关闭图层模式，恢复整体模型
          </button>
        </div>
      )}
    </div>
  );
}
