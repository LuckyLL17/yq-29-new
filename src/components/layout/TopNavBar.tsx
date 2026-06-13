import { FileText, Settings, HelpCircle, Moon, Sun, Box } from 'lucide-react';
import { useAppStore, type DialogType } from '@/store/useAppStore';

function NavButton({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 text-content-muted hover:text-content-primary hover:bg-surface-hover rounded-lg transition-colors flex items-center gap-2 text-sm"
    >
      <Icon size={16} />
      <span>{label}</span>
    </button>
  );
}

function ThemeToggleButton() {
  const isDarkMode = useAppStore((state) => state.isDarkMode);
  const toggleDarkMode = useAppStore((state) => state.toggleDarkMode);

  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 text-content-muted hover:text-content-primary hover:bg-surface-hover rounded-lg transition-colors"
      title={isDarkMode ? '切换亮色模式' : '切换暗色模式'}
    >
      {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

export function TopNavBar() {
  const setActiveDialog = useAppStore((state) => state.setActiveDialog);

  const openDialog = (type: DialogType) => () => setActiveDialog(type);

  return (
    <header className="h-14 bg-surface-panel border-b border-edge-base flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Box size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-content-primary tracking-tight">
            纸浆模塑模具设计助手
          </h1>
          <p className="text-xs text-content-faint -mt-0.5">Pulp Molding Mold Designer</p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <NavButton icon={FileText} label="项目" onClick={openDialog('project')} />
        <NavButton icon={Settings} label="设置" onClick={openDialog('settings')} />
        <NavButton icon={HelpCircle} label="帮助" onClick={openDialog('help')} />

        <div className="w-px h-6 bg-edge-base mx-2" />

        <ThemeToggleButton />
      </div>
    </header>
  );
}
