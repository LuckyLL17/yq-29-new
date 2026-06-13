import {
  Type,
  MoveRight,
  Ruler,
  Pencil,
  Trash2,
  X,
  Palette,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { AnnotationTool } from '@/types';

const annotationTools = [
  { id: 'text' as AnnotationTool, label: '文字', icon: Type },
  { id: 'arrow' as AnnotationTool, label: '箭头', icon: MoveRight },
  { id: 'dimension' as AnnotationTool, label: '尺寸', icon: Ruler },
  { id: 'freehand' as AnnotationTool, label: '笔画', icon: Pencil },
] as const;

const fontOptions = [
  { label: '无衬线', value: 'sans-serif' },
  { label: '等宽', value: 'monospace' },
  { label: '衬线', value: 'serif' },
];

export function AnnotationPanel() {
  const annotationTool = useAppStore((s) => s.annotationTool);
  const setAnnotationTool = useAppStore((s) => s.setAnnotationTool);
  const annotationStyle = useAppStore((s) => s.annotationStyle);
  const setAnnotationStyle = useAppStore((s) => s.setAnnotationStyle);
  const annotations = useAppStore((s) => s.annotations);
  const removeAnnotation = useAppStore((s) => s.removeAnnotation);
  const selectedAnnotationId = useAppStore((s) => s.selectedAnnotationId);
  const setSelectedAnnotationId = useAppStore((s) => s.setSelectedAnnotationId);
  const clearAnnotations = useAppStore((s) => s.clearAnnotations);

  const getToolHint = () => {
    switch (annotationTool) {
      case 'text':
        return '点击模型表面添加文字标注';
      case 'arrow':
        return '依次点击两点绘制箭头';
      case 'dimension':
        return '依次点击两点标注尺寸';
      case 'freehand':
        return '按住鼠标在模型上自由绘制';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-content-secondary mb-3">标注工具</h3>

      <div className="grid grid-cols-4 gap-1.5">
        {annotationTools.map((tool) => {
          const Icon = tool.icon;
          const isActive = annotationTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() =>
                setAnnotationTool(isActive ? 'none' : tool.id)
              }
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                isActive
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/50'
                  : 'bg-surface-elevated text-content-muted border border-edge-subtle hover:bg-surface-hover hover:text-content-secondary'
              }`}
            >
              <Icon size={16} />
              <span className="text-[10px] font-medium">{tool.label}</span>
            </button>
          );
        })}
      </div>

      {annotationTool !== 'none' && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2">
          <p className="text-xs text-emerald-400">{getToolHint()}</p>
        </div>
      )}

      <div className="space-y-2 pt-2 border-t border-edge-subtle">
        <div className="flex items-center gap-2">
          <Palette size={12} className="text-content-muted" />
          <span className="text-xs text-content-muted">样式设置</span>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-content-muted w-12">颜色</label>
          <input
            type="color"
            value={annotationStyle.color}
            onChange={(e) => setAnnotationStyle({ color: e.target.value })}
            className="w-8 h-6 rounded cursor-pointer bg-transparent border border-edge-subtle"
          />
          <span className="text-[10px] text-content-faint font-mono">
            {annotationStyle.color}
          </span>
        </div>

        <div>
          <label className="text-xs text-content-muted block mb-1">
            字号: {annotationStyle.fontSize}
          </label>
          <input
            type="range"
            min="1"
            max="10"
            step="0.5"
            value={annotationStyle.fontSize}
            onChange={(e) =>
              setAnnotationStyle({ fontSize: parseFloat(e.target.value) })
            }
            className="w-full h-1.5 bg-surface-active rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

        <div>
          <label className="text-xs text-content-muted block mb-1">
            线宽: {annotationStyle.lineWidth}
          </label>
          <input
            type="range"
            min="0.5"
            max="5"
            step="0.5"
            value={annotationStyle.lineWidth}
            onChange={(e) =>
              setAnnotationStyle({ lineWidth: parseFloat(e.target.value) })
            }
            className="w-full h-1.5 bg-surface-active rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

        <div>
          <label className="text-xs text-content-muted block mb-1">字体</label>
          <div className="flex gap-1.5">
            {fontOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setAnnotationStyle({ fontFamily: opt.value })}
                className={`flex-1 py-1 text-xs rounded transition-colors ${
                  annotationStyle.fontFamily === opt.value
                    ? 'bg-emerald-600 text-white'
                    : 'bg-surface-active text-content-secondary hover:bg-surface-inset'
                }`}
                style={{ fontFamily: opt.value }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {annotations.length > 0 && (
        <div className="pt-2 border-t border-edge-subtle space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-content-muted">
              标注列表 ({annotations.length})
            </span>
            <button
              onClick={clearAnnotations}
              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              <Trash2 size={12} />
              清空
            </button>
          </div>

          <div className="max-h-40 overflow-y-auto space-y-1">
            {annotations.map((ann) => {
              const isSelected = selectedAnnotationId === ann.id;
              const label =
                ann.type === 'text'
                  ? ann.text
                  : ann.type === 'arrow'
                    ? '箭头'
                    : ann.type === 'dimension'
                      ? `${Math.sqrt(
                          (ann.end.x - ann.start.x) ** 2 +
                            (ann.end.y - ann.start.y) ** 2 +
                            (ann.end.z - ann.start.z) ** 2
                        ).toFixed(1)} mm`
                      : `笔画 (${ann.points.length}点)`;

              return (
                <div
                  key={ann.id}
                  onClick={() =>
                    setSelectedAnnotationId(isSelected ? null : ann.id)
                  }
                  className={`flex items-center justify-between px-2 py-1.5 rounded text-xs cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-surface-elevated/50 text-content-secondary hover:bg-surface-hover'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: ann.style.color }}
                    />
                    <span className="truncate">{label}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAnnotation(ann.id);
                    }}
                    className="text-content-faint hover:text-red-400 transition-colors flex-shrink-0 ml-1"
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
