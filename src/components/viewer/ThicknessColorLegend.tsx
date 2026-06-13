import { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { getThicknessColorStops } from '@/utils/wallThickness';
import type { ThicknessColorScheme } from '@/types';

interface ThicknessColorLegendProps {
  minThickness: number;
  maxThickness: number;
  avgThickness?: number;
}

const schemeLabels: Record<ThicknessColorScheme, string> = {
  rainbow: '彩虹',
  coolwarm: '冷暖',
  grayscale: '灰度',
};

export function ThicknessColorLegend({
  minThickness,
  maxThickness,
  avgThickness,
}: ThicknessColorLegendProps) {
  const analysisMode = useAppStore((state) => state.analysisMode);
  const thicknessColorScheme = useAppStore((state) => state.thicknessColorScheme);
  const setThicknessColorScheme = useAppStore((state) => state.setThicknessColorScheme);
  const showThicknessHeatmap = useAppStore((state) => state.showThicknessHeatmap);
  const setShowThicknessHeatmap = useAppStore((state) => state.setShowThicknessHeatmap);

  const colorStops = useMemo(
    () => getThicknessColorStops(thicknessColorScheme),
    [thicknessColorScheme]
  );

  const gradientCss = useMemo(() => {
    const stops = colorStops.map((c, i) => `${c} ${(i / (colorStops.length - 1)) * 100}%`);
    return `linear-gradient(to bottom, ${stops.join(', ')})`;
  }, [colorStops]);

  if (analysisMode !== 'thickness') {
    return null;
  }

  const schemes: ThicknessColorScheme[] = ['rainbow', 'coolwarm', 'grayscale'];

  return (
    <div className="absolute top-4 right-4 bg-surface-panel/90 backdrop-blur-sm rounded-lg p-4 border border-edge-base shadow-lg w-52">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-content-secondary">壁厚热力图</h4>
        <button
          onClick={() => setShowThicknessHeatmap(!showThicknessHeatmap)}
          className="text-[10px] px-2 py-0.5 rounded bg-surface-elevated hover:bg-surface-hover text-content-muted hover:text-content-secondary transition-colors"
        >
          {showThicknessHeatmap ? '隐藏' : '显示'}
        </button>
      </div>

      <div className="mb-3">
        <p className="text-[10px] text-content-muted mb-1.5">配色方案</p>
        <div className="grid grid-cols-3 gap-1">
          {schemes.map((s) => (
            <button
              key={s}
              onClick={() => setThicknessColorScheme(s)}
              className={`text-[10px] px-1.5 py-1 rounded transition-colors ${
                thicknessColorScheme === s
                  ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                  : 'bg-surface-elevated/50 text-content-muted hover:bg-surface-hover hover:text-content-secondary border border-transparent'
              }`}
            >
              {schemeLabels[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-content-muted mb-1">
            {maxThickness.toFixed(2)} mm
          </span>
          <div
            className="w-5 h-28 rounded"
            style={{ background: gradientCss }}
          />
          {avgThickness !== undefined && (
            <span
              className="text-[9px] text-content-faint absolute"
              style={{
                top: `${100 - ((avgThickness - minThickness) / (maxThickness - minThickness)) * 100 + 24}%`,
              }}
            >
              —
            </span>
          )}
          <span className="text-[10px] text-content-muted mt-1">
            {minThickness.toFixed(2)} mm
          </span>
        </div>

        <div className="flex flex-col gap-1.5 text-[10px] text-content-muted flex-1 pt-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colorStops[0] }} />
            <span>最厚区域</span>
          </div>
          {avgThickness !== undefined && (
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colorStops[Math.floor(colorStops.length / 2)] }} />
              <span>均值 {avgThickness.toFixed(2)}mm</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colorStops[colorStops.length - 1] }} />
            <span>最薄区域</span>
          </div>
        </div>
      </div>
    </div>
  );
}
