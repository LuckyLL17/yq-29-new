import { useAppStore } from '@/store/useAppStore';
import { Modal } from '@/components/layout/Modal';

const shortcuts = [
  { key: '鼠标左键', action: '旋转模型' },
  { key: '鼠标右键', action: '平移视图' },
  { key: '滚轮', action: '缩放视图' },
  { key: 'Esc', action: '关闭弹窗' },
];

const analysisSteps = [
  { step: 1, title: '导入模型', desc: '点击"导入模型"按钮上传 STL/OBJ 文件，或选择示例模型快速体验' },
  { step: 2, title: '脱模角度分析', desc: '设置脱模方向和最小角度阈值，系统自动计算并标记倒扣区域' },
  { step: 3, title: '壁厚分布检测', desc: '基于射线法自动检测壁厚分布，颜色映射显示厚薄区域' },
  { step: 4, title: '滤水孔规划', desc: '智能推荐滤水孔位置，支持调整孔径和间距' },
  { step: 5, title: '成型周期预估', desc: '根据材料和工艺参数预估吸浆、压制、干燥、脱模各阶段时间' },
  { step: 6, title: '导出报告', desc: '在右侧面板点击"导出报告"生成完整的文本分析报告' },
];

export function HelpDialog() {
  const activeDialog = useAppStore((state) => state.activeDialog);
  const closeDialog = useAppStore((state) => state.closeDialog);

  return (
    <Modal isOpen={activeDialog === 'help'} onClose={closeDialog} title="帮助" width="max-w-xl">
      <div className="space-y-6">
        <div>
          <h3 className="text-xs font-semibold text-content-muted uppercase tracking-wider mb-3">操作指南</h3>
          <div className="space-y-3">
            {analysisSteps.map((item) => (
              <div key={item.step} className="flex gap-3">
                <div className="flex-shrink-0 w-7 h-7 bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center text-sm font-bold">
                  {item.step}
                </div>
                <div>
                  <p className="text-sm font-medium text-content-secondary">{item.title}</p>
                  <p className="text-xs text-content-muted mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-content-muted uppercase tracking-wider mb-3">快捷操作</h3>
          <div className="bg-surface-inset/30 rounded-lg divide-y divide-edge-subtle">
            {shortcuts.map((item) => (
              <div key={item.key} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-sm text-content-secondary">{item.action}</span>
                <kbd className="px-2 py-0.5 bg-surface-active text-content-secondary text-xs rounded font-mono">
                  {item.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
          <p className="text-xs text-content-muted leading-relaxed">
            本工具基于浏览器端计算，所有分析均在本地完成，无需上传模型数据。
            支持 STL 和 OBJ 格式的三维模型文件导入。分析结果仅供参考，实际模具设计需结合工艺经验验证。
          </p>
        </div>
      </div>
    </Modal>
  );
}
