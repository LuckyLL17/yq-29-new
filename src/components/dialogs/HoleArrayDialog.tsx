import { useState, useEffect } from 'react';
import { X, Grid3X3, CircleDot } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { ArrayPatternType, DrainHoleType } from '@/types';

export function HoleArrayDialog() {
  const arrayDialog = useAppStore((s) => s.arrayDialog);
  const closeArrayDialog = useAppStore((s) => s.closeArrayDialog);
  const generateArray = useAppStore((s) => s.generateArray);
  const holeDiameter = useAppStore((s) => s.holeDiameter);
  const holeDepth = useAppStore((s) => s.holeDepth);
  const holeSpacing = useAppStore((s) => s.holeSpacing);
  const model = useAppStore((s) => s.model);

  const [patternType, setPatternType] = useState<ArrayPatternType>('rectangle');
  const [xCount, setXCount] = useState(5);
  const [yCount, setYCount] = useState(4);
  const [xSpacing, setXSpacing] = useState(holeSpacing);
  const [ySpacing, setYSpacing] = useState(holeSpacing);
  const [radius, setRadius] = useState(30);
  const [count, setCount] = useState(12);
  const [diameter, setDiameter] = useState(holeDiameter);
  const [depth, setDepth] = useState(holeDepth);
  const [holeType, setHoleType] = useState<DrainHoleType>('dewatering');

  useEffect(() => {
    if (arrayDialog.open) {
      setPatternType(arrayDialog.patternType);
      setXSpacing(holeSpacing);
      setYSpacing(holeSpacing);
      setDiameter(holeDiameter);
      setDepth(holeDepth);
    }
  }, [arrayDialog.open, arrayDialog.patternType, holeSpacing, holeDiameter, holeDepth]);

  if (!arrayDialog.open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!model) return;

    const center = {
      x: model.boundingBox.center.x,
      y: model.boundingBox.max.y,
      z: model.boundingBox.center.z,
    };
    const normal = { x: 0, y: 1, z: 0 };

    if (patternType === 'rectangle') {
      generateArray({
        type: 'rectangle',
        center,
        normal,
        xCount,
        yCount,
        xSpacing,
        ySpacing,
        diameter,
        depth,
        holeType,
      });
    } else {
      generateArray({
        type: 'circle',
        center,
        normal,
        radius,
        count,
        diameter,
        depth,
        holeType,
      });
    }
  };

  const totalHoles = patternType === 'rectangle' ? xCount * yCount : count;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-surface-panel border border-edge-subtle rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-edge-subtle bg-gradient-to-r from-cyan-900/40 to-emerald-900/30">
          <h2 className="text-sm font-semibold text-content-primary">
            {patternType === 'rectangle' ? '矩形阵列' : '环形阵列'} 参数设置
          </h2>
          <button
            onClick={closeArrayDialog}
            className="p-1 rounded-md text-content-muted hover:text-content-secondary hover:bg-surface-hover transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPatternType('rectangle')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border transition-all ${
                patternType === 'rectangle'
                  ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                  : 'bg-surface-elevated border-edge-subtle text-content-muted hover:text-content-secondary'
              }`}
            >
              <Grid3X3 size={18} />
              <span className="text-sm font-medium">矩形阵列</span>
            </button>
            <button
              type="button"
              onClick={() => setPatternType('circle')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border transition-all ${
                patternType === 'circle'
                  ? 'bg-cyan-600/20 border-cyan-500 text-cyan-400'
                  : 'bg-surface-elevated border-edge-subtle text-content-muted hover:text-content-secondary'
              }`}
            >
              <CircleDot size={18} />
              <span className="text-sm font-medium">环形阵列</span>
            </button>
          </div>

          {patternType === 'rectangle' ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-content-muted mb-2">
                  X 方向数量
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={xCount}
                  onChange={(e) => setXCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 bg-surface-elevated border border-edge-subtle rounded-lg text-sm text-content-primary focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-content-muted mb-2">
                  Y 方向数量
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={yCount}
                  onChange={(e) => setYCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 bg-surface-elevated border border-edge-subtle rounded-lg text-sm text-content-primary focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-content-muted mb-2">
                  X 方向间距 (mm)
                </label>
                <input
                  type="number"
                  min={2}
                  max={100}
                  step={0.5}
                  value={xSpacing}
                  onChange={(e) => setXSpacing(Math.max(2, parseFloat(e.target.value) || 2))}
                  className="w-full px-3 py-2 bg-surface-elevated border border-edge-subtle rounded-lg text-sm text-content-primary focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-content-muted mb-2">
                  Y 方向间距 (mm)
                </label>
                <input
                  type="number"
                  min={2}
                  max={100}
                  step={0.5}
                  value={ySpacing}
                  onChange={(e) => setYSpacing(Math.max(2, parseFloat(e.target.value) || 2))}
                  className="w-full px-3 py-2 bg-surface-elevated border border-edge-subtle rounded-lg text-sm text-content-primary focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-content-muted mb-2">
                  环形半径 (mm)
                </label>
                <input
                  type="number"
                  min={5}
                  max={200}
                  step={1}
                  value={radius}
                  onChange={(e) => setRadius(Math.max(5, parseFloat(e.target.value) || 5))}
                  className="w-full px-3 py-2 bg-surface-elevated border border-edge-subtle rounded-lg text-sm text-content-primary focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-content-muted mb-2">
                  孔数量
                </label>
                <input
                  type="number"
                  min={3}
                  max={100}
                  value={count}
                  onChange={(e) => setCount(Math.max(3, parseInt(e.target.value) || 3))}
                  className="w-full px-3 py-2 bg-surface-elevated border border-edge-subtle rounded-lg text-sm text-content-primary focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                />
              </div>
            </div>
          )}

          <div className="p-4 rounded-lg bg-surface-elevated/50 border border-edge-subtle">
            <h3 className="text-xs font-medium text-content-secondary mb-3">公共参数</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-content-muted mb-2">
                  孔径 (mm)
                </label>
                <input
                  type="number"
                  min={0.5}
                  max={10}
                  step={0.1}
                  value={diameter}
                  onChange={(e) => setDiameter(Math.max(0.5, parseFloat(e.target.value) || 0.5))}
                  className="w-full px-3 py-2 bg-surface-elevated border border-edge-subtle rounded-lg text-sm text-content-primary focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-content-muted mb-2">
                  孔深 (mm)
                </label>
                <input
                  type="number"
                  min={0.5}
                  max={50}
                  step={0.5}
                  value={depth}
                  onChange={(e) => setDepth(Math.max(0.5, parseFloat(e.target.value) || 0.5))}
                  className="w-full px-3 py-2 bg-surface-elevated border border-edge-subtle rounded-lg text-sm text-content-primary focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-xs text-content-muted mb-2">
                孔类型
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setHoleType('dewatering')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all border ${
                    holeType === 'dewatering'
                      ? 'bg-cyan-600/20 border-cyan-500 text-cyan-400'
                      : 'bg-surface-elevated border-edge-subtle text-content-muted hover:text-content-secondary'
                  }`}
                >
                  脱水孔
                </button>
                <button
                  type="button"
                  onClick={() => setHoleType('suction')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all border ${
                    holeType === 'suction'
                      ? 'bg-orange-600/20 border-orange-500 text-orange-400'
                      : 'bg-surface-elevated border-edge-subtle text-content-muted hover:text-content-secondary'
                  }`}
                >
                  吸水孔
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-emerald-900/20 to-cyan-900/20 border border-emerald-500/30">
            <span className="text-xs text-content-muted">预计生成孔数量</span>
            <span className="text-lg font-bold text-emerald-400">{totalHoles}</span>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={closeArrayDialog}
              className="flex-1 py-2 px-4 text-sm rounded-lg bg-surface-active text-content-secondary hover:bg-surface-inset transition-colors border border-edge-subtle"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!model}
              className="flex-1 py-2 px-4 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/30"
            >
              {model ? '生成阵列' : '请先加载模型'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
