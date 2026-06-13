import { useAppStore } from '@/store/useAppStore';
import { Box, Layers, Zap } from 'lucide-react';

export function StatusBar() {
  const model = useAppStore((state) => state.model);
  const analysisMode = useAppStore((state) => state.analysisMode);
  const visualizationMode = useAppStore((state) => state.visualizationMode);
  const isLoading = useAppStore((state) => state.isLoading);

  const modeLabels: Record<string, string> = {
    none: '待分析',
    draft: '脱模角度分析',
    thickness: '壁厚分布分析',
    holes: '滤水孔规划',
    cycle: '成型周期预估',
  };

  const visLabels: Record<string, string> = {
    solid: '实体模式',
    wireframe: '线框模式',
    xray: 'X光模式',
  };

  return (
    <footer className="h-7 bg-surface-panel border-t border-edge-base flex items-center justify-between px-4 text-xs">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-content-muted">
          <Box size={12} />
          <span>
            {model
              ? `${model.faceCount.toLocaleString()} 面 / ${model.vertexCount.toLocaleString()} 顶点`
              : '未加载模型'}
          </span>
        </div>

        <div className="w-px h-3 bg-edge-base" />

        <div className="flex items-center gap-1.5 text-content-muted">
          <Layers size={12} />
          <span>{visLabels[visualizationMode] || '实体模式'}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div
            className={`w-2 h-2 rounded-full ${
              isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'
            }`}
          />
          <span className="text-content-muted">
            {isLoading ? '计算中...' : modeLabels[analysisMode]}
          </span>
        </div>

        <div className="w-px h-3 bg-edge-base" />

        <div className="flex items-center gap-1.5 text-content-faint">
          <Zap size={12} />
          <span>v1.0.0</span>
        </div>
      </div>
    </footer>
  );
}
