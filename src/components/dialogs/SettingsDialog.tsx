import { useAppStore } from '@/store/useAppStore';
import { Modal } from '@/components/layout/Modal';

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-content-secondary">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-10 h-5 rounded-full transition-colors ${value ? 'bg-cyan-500' : 'bg-surface-inset'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${value ? 'translate-x-5' : ''}`}
        />
      </button>
    </div>
  );
}

function SliderRow({ label, value, min, max, step, unit, onChange }: {
  label: string; value: number; min: number; max: number; step: number; unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-content-secondary">{label}</span>
        <span className="text-sm text-cyan-400 font-mono">{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-cyan-500"
      />
    </div>
  );
}

export function SettingsDialog() {
  const activeDialog = useAppStore((state) => state.activeDialog);
  const closeDialog = useAppStore((state) => state.closeDialog);

  const showGrid = useAppStore((state) => state.showGrid);
  const setShowGrid = useAppStore((state) => state.setShowGrid);
  const showAxes = useAppStore((state) => state.showAxes);
  const setShowAxes = useAppStore((state) => state.setShowAxes);
  const autoRotate = useAppStore((state) => state.autoRotate);
  const setAutoRotate = useAppStore((state) => state.setAutoRotate);

  const draftAngleThreshold = useAppStore((state) => state.draftAngleThreshold);
  const setDraftAngleThreshold = useAppStore((state) => state.setDraftAngleThreshold);
  const thicknessSampleCount = useAppStore((state) => state.thicknessSampleCount);
  const setThicknessSampleCount = useAppStore((state) => state.setThicknessSampleCount);
  const holeDiameter = useAppStore((state) => state.holeDiameter);
  const setHoleDiameter = useAppStore((state) => state.setHoleDiameter);
  const holeSpacing = useAppStore((state) => state.holeSpacing);
  const setHoleSpacing = useAppStore((state) => state.setHoleSpacing);

  return (
    <Modal isOpen={activeDialog === 'settings'} onClose={closeDialog} title="设置" width="max-w-md">
      <div className="space-y-5">
        <div>
          <h3 className="text-xs font-semibold text-content-muted uppercase tracking-wider mb-2">视图</h3>
          <div className="bg-surface-inset/30 rounded-lg px-4 py-1">
            <ToggleRow label="显示网格" value={showGrid} onChange={setShowGrid} />
            <ToggleRow label="显示坐标轴" value={showAxes} onChange={setShowAxes} />
            <ToggleRow label="自动旋转" value={autoRotate} onChange={setAutoRotate} />
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-content-muted uppercase tracking-wider mb-2">脱模角度</h3>
          <div className="bg-surface-inset/30 rounded-lg px-4 py-2">
            <SliderRow label="最小脱模角阈值" value={draftAngleThreshold} min={1} max={15} step={0.5} unit="°" onChange={setDraftAngleThreshold} />
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-content-muted uppercase tracking-wider mb-2">壁厚分析</h3>
          <div className="bg-surface-inset/30 rounded-lg px-4 py-2">
            <SliderRow label="采样点数" value={thicknessSampleCount} min={100} max={2000} step={100} unit="" onChange={setThicknessSampleCount} />
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-content-muted uppercase tracking-wider mb-2">滤水孔</h3>
          <div className="bg-surface-inset/30 rounded-lg px-4 py-2">
            <SliderRow label="默认孔径" value={holeDiameter} min={1} max={8} step={0.5} unit="mm" onChange={setHoleDiameter} />
            <SliderRow label="默认孔间距" value={holeSpacing} min={5} max={40} step={1} unit="mm" onChange={setHoleSpacing} />
          </div>
        </div>
      </div>
    </Modal>
  );
}
