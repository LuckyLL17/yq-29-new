import { useAppStore } from '@/store/useAppStore';

interface DiffColorLegendProps {
  minDistance: number;
  maxDistance: number;
}

export function DiffColorLegend({ minDistance, maxDistance }: DiffColorLegendProps) {
  const compareMode = useAppStore((state) => state.compareMode);

  if (compareMode !== 'diffcolormap') {
    return null;
  }

  const maxAbs = Math.max(Math.abs(minDistance), Math.abs(maxDistance));

  return (
    <div className="absolute top-4 right-4 bg-surface-panel/90 backdrop-blur-sm rounded-lg p-4 border border-edge-base shadow-lg">
      <h4 className="text-sm font-semibold text-content-secondary mb-3">几何差异</h4>
      
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center">
          <span className="text-xs text-content-muted mb-1">{maxAbs.toFixed(2)} mm</span>
          <div 
            className="w-6 h-32 rounded"
            style={{
              background: 'linear-gradient(to bottom, #ff4444, #ffaa44, #888888, #44aaff, #4444ff)'
            }}
          />
          <span className="text-xs text-content-muted mt-1">{(-maxAbs).toFixed(2)} mm</span>
        </div>
        
        <div className="flex flex-col gap-2 text-xs text-content-muted">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span>向外凸出</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gray-500" />
            <span>无差异</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span>向内凹陷</span>
          </div>
        </div>
      </div>
    </div>
  );
}
