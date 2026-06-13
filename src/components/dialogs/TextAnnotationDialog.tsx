import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export function TextAnnotationDialog() {
  const prompt = useAppStore((s) => s.textAnnotationPrompt);
  const confirm = useAppStore((s) => s.confirmTextAnnotation);
  const close = useAppStore((s) => s.closeTextAnnotationPrompt);
  const annotationStyle = useAppStore((s) => s.annotationStyle);

  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (prompt.open) {
      setText('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [prompt.open]);

  if (!prompt.open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    confirm(text);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-surface-panel border border-edge-subtle rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-edge-subtle bg-gradient-to-r from-cyan-900/40 to-emerald-900/30">
          <h2 className="text-sm font-semibold text-content-primary">
            添加文字标注
          </h2>
          <button
            onClick={close}
            className="p-1 rounded-md text-content-muted hover:text-content-secondary hover:bg-surface-hover transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-content-muted mb-2">
              标注文字内容
            </label>
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="请输入要标注的文字..."
              maxLength={100}
              className="w-full px-3 py-2 bg-surface-elevated border border-edge-subtle rounded-lg text-sm text-content-primary placeholder:text-content-faint focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
            />
            <div className="mt-1 flex justify-end">
              <span className="text-[10px] text-content-faint">
                {text.length}/100
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-elevated/50 border border-edge-subtle">
            <div
              className="w-6 h-6 rounded-md border border-white/20 flex-shrink-0"
              style={{ backgroundColor: annotationStyle.color }}
            />
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-medium truncate"
                style={{ color: annotationStyle.color, fontFamily: annotationStyle.fontFamily }}
              >
                {text || '预览文字效果'}
              </p>
              <p className="text-[10px] text-content-faint mt-0.5">
                字号 {annotationStyle.fontSize} · 线宽 {annotationStyle.lineWidth} · {
                  annotationStyle.fontFamily === 'monospace' ? '等宽' :
                  annotationStyle.fontFamily === 'serif' ? '衬线' : '无衬线'
                }
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={close}
              className="flex-1 py-2 px-4 text-sm rounded-lg bg-surface-active text-content-secondary hover:bg-surface-inset transition-colors border border-edge-subtle"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!text.trim()}
              className="flex-1 py-2 px-4 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/30"
            >
              确定添加
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
