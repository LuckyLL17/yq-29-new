import { useEffect, useState } from 'react';
import { TopNavBar } from '@/components/layout/TopNavBar';
import { StatusBar } from '@/components/layout/StatusBar';
import { LeftToolbar } from '@/components/panels/LeftToolbar';
import { RightPanel } from '@/components/panels/RightPanel';
import { LayerPanel } from '@/components/panels/LayerPanel';
import { ModelViewer } from '@/components/viewer/ModelViewer';
import { ProjectMenu } from '@/components/dialogs/ProjectMenu';
import { SettingsDialog } from '@/components/dialogs/SettingsDialog';
import { HelpDialog } from '@/components/dialogs/HelpDialog';
import { useAppStore } from '@/store/useAppStore';
import { Layers, BarChart3 } from 'lucide-react';

type RightPanelTab = 'analysis' | 'layers';

function ThemeClassSync() {
  const isDarkMode = useAppStore((state) => state.isDarkMode);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    document.documentElement.classList.toggle('light', !isDarkMode);
  }, [isDarkMode]);

  return null;
}

export default function Home() {
  const [rightTab, setRightTab] = useState<RightPanelTab>('analysis');
  const layersEnabled = useAppStore((state) => state.layersEnabled);
  const modelLayers = useAppStore((state) => state.modelLayers);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-surface-base">
      <ThemeClassSync />
      <TopNavBar />

      <div className="flex-1 flex overflow-hidden">
        <LeftToolbar />
        <main className="flex-1 relative overflow-hidden">
          <ModelViewer />
        </main>
        <div className="flex flex-col w-80 border-l border-edge-base bg-surface-panel">
          <div className="flex border-b border-edge-subtle">
            <button
              onClick={() => setRightTab('analysis')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors relative ${
                rightTab === 'analysis'
                  ? 'text-cyan-400'
                  : 'text-content-muted hover:text-content-secondary'
              }`}
            >
              <BarChart3 size={14} />
              分析结果
            </button>
            <button
              onClick={() => setRightTab('layers')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors relative ${
                rightTab === 'layers'
                  ? 'text-purple-400'
                  : 'text-content-muted hover:text-content-secondary'
              }`}
            >
              <Layers size={14} />
              图层管理
              {layersEnabled && modelLayers.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  {modelLayers.length}
                </span>
              )}
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            {rightTab === 'analysis' ? <RightPanelEmbedded /> : <LayerPanelEmbedded />}
          </div>
        </div>
      </div>

      <StatusBar />

      <ProjectMenu />
      <SettingsDialog />
      <HelpDialog />
    </div>
  );
}

function RightPanelEmbedded() {
  return <RightPanel />;
}

function LayerPanelEmbedded() {
  return <LayerPanel />;
}
