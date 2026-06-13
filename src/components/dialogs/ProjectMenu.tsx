import { useRef } from 'react';
import { FilePlus, FolderOpen, RotateCcw } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { loadModelFromFile, createSampleBoxModel, createSampleBowlModel } from '@/utils/modelLoader';
import { Modal } from '@/components/layout/Modal';

export function ProjectMenu() {
  const activeDialog = useAppStore((state) => state.activeDialog);
  const closeDialog = useAppStore((state) => state.closeDialog);
  const setModel = useAppStore((state) => state.setModel);
  const setIsLoading = useAppStore((state) => state.setIsLoading);
  const resetAnalysis = useAppStore((state) => state.resetAnalysis);
  const model = useAppStore((state) => state.model);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    closeDialog();
    try {
      const modelData = await loadModelFromFile(file);
      setModel(modelData, file.name);
    } catch (err) {
      console.error('模型加载失败:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewProject = () => {
    resetAnalysis();
    setModel(null, '');
    closeDialog();
  };

  const handleLoadSample = (type: 'box' | 'bowl') => {
    setIsLoading(true);
    closeDialog();
    setTimeout(() => {
      const m = type === 'box' ? createSampleBoxModel() : createSampleBowlModel();
      setModel(m, type === 'box' ? '示例盒状模型' : '示例碗状模型');
      setIsLoading(false);
    }, 300);
  };

  const handleReset = () => {
    resetAnalysis();
    closeDialog();
  };

  return (
    <>
      <input ref={fileInputRef} type="file" accept=".stl,.obj" onChange={handleImport} className="hidden" />
      <Modal isOpen={activeDialog === 'project'} onClose={closeDialog} title="项目管理">
        <div className="space-y-3">
          <button
            onClick={handleNewProject}
            className="w-full flex items-center gap-3 px-4 py-3 bg-surface-inset/50 hover:bg-surface-hover rounded-lg transition-colors text-left"
          >
            <FilePlus size={20} className="text-cyan-400" />
            <div>
              <p className="text-sm font-medium text-content-secondary">新建项目</p>
              <p className="text-xs text-content-muted">清空当前模型和分析结果</p>
            </div>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center gap-3 px-4 py-3 bg-surface-inset/50 hover:bg-surface-hover rounded-lg transition-colors text-left"
          >
            <FolderOpen size={20} className="text-green-400" />
            <div>
              <p className="text-sm font-medium text-content-secondary">打开模型文件</p>
              <p className="text-xs text-content-muted">支持 STL / OBJ 格式</p>
            </div>
          </button>

          <div className="border-t border-edge-subtle pt-3">
            <p className="text-xs text-content-faint mb-2 px-1">示例模型</p>
            <div className="flex gap-2">
              <button
                onClick={() => handleLoadSample('box')}
                className="flex-1 py-2.5 bg-surface-inset/50 hover:bg-surface-hover rounded-lg text-sm text-content-secondary transition-colors"
              >
                盒状模型
              </button>
              <button
                onClick={() => handleLoadSample('bowl')}
                className="flex-1 py-2.5 bg-surface-inset/50 hover:bg-surface-hover rounded-lg text-sm text-content-secondary transition-colors"
              >
                碗状模型
              </button>
            </div>
          </div>

          {model && (
            <button
              onClick={handleReset}
              className="w-full flex items-center gap-3 px-4 py-3 bg-surface-inset/50 hover:bg-orange-900/30 border border-edge-base hover:border-orange-700 rounded-lg transition-colors text-left"
            >
              <RotateCcw size={20} className="text-orange-400" />
              <div>
                <p className="text-sm font-medium text-content-secondary">重置分析结果</p>
                <p className="text-xs text-content-muted">保留模型，清除所有分析数据</p>
              </div>
            </button>
          )}
        </div>
      </Modal>
    </>
  );
}
