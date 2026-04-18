<template>
  <div class="playground">
    <div class="main-content">
      <canvas ref="canvasRef" class="canvas"></canvas>

      <!-- 右侧样式面板 -->
      <div class="sidebar" v-if="selectedNodes.length > 0">
        <h3>节点样式</h3>
        <div class="style-control">
          <label>填充颜色</label>
          <input type="color" v-model="nodeStyle.fill" @input="updateSelectedNodesStyle">
        </div>
        <div class="style-control">
          <label>边框颜色</label>
          <input type="color" v-model="nodeStyle.stroke" @input="updateSelectedNodesStyle">
        </div>
        <div class="style-control">
          <label>边框宽度</label>
          <input type="range" min="0" max="10" v-model.number="nodeStyle.strokeWidth" @input="updateSelectedNodesStyle">
          <span>{{ nodeStyle.strokeWidth }}px</span>
        </div>
        <div class="style-control">
          <label>圆角</label>
          <input type="range" min="0" max="50" v-model.number="nodeStyle.borderRadius" @input="updateSelectedNodesStyle">
          <span>{{ nodeStyle.borderRadius }}px</span>
        </div>
        <div class="style-control">
          <label>阴影模糊</label>
          <input type="range" min="0" max="30" v-model.number="nodeStyle.shadowBlur" @input="updateSelectedNodesStyle">
          <span>{{ nodeStyle.shadowBlur }}px</span>
        </div>
        <div class="style-control">
          <label>透明度</label>
          <input type="range" min="0" max="1" step="0.1" v-model.number="nodeStyle.opacity" @input="updateSelectedNodesStyle">
          <span>{{ nodeStyle.opacity }}</span>
        </div>
      </div>

      <!-- 底部浮动工具栏 -->
      <div class="floating-toolbar">

        <!-- 节点 / 连线 -->
        <button class="icon-btn" @click="addNode">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="2"/>
            <line x1="12" y1="9" x2="12" y2="15"/>
            <line x1="9" y1="12" x2="15" y2="12"/>
          </svg>
          <div class="btn-tip">添加节点</div>
        </button>
        <select v-model="nodeShape" class="shape-select" title="节点形状">
          <option value="rectangle">矩形</option>
          <option value="circle">圆形</option>
          <option value="diamond">菱形</option>
          <option value="triangle">三角形</option>
        </select>
        <button class="icon-btn" @click="addEdge" :disabled="selectedNodes.length !== 2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="5" cy="12" r="2.5"/>
            <circle cx="19" cy="12" r="2.5"/>
            <line x1="7.5" y1="12" x2="14" y2="12"/>
            <polyline points="13 9 16.5 12 13 15"/>
          </svg>
          <div class="btn-tip">添加连线（先选中 2 个节点）</div>
        </button>
        <select v-model="edgeLineStyle" class="shape-select" title="连线样式">
          <option value="straight">直线</option>
          <option value="curved">曲线</option>
          <option value="orthogonal">折线</option>
        </select>

        <div class="toolbar-sep"></div>

        <!-- 撤销 / 重做 -->
        <button class="icon-btn" @click="undo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9h13a5 5 0 0 1 0 10H7"/>
            <polyline points="3 5 3 9 7 9"/>
          </svg>
          <div class="btn-tip">撤销 <kbd>Ctrl Z</kbd></div>
        </button>
        <button class="icon-btn" @click="redo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 9H8a5 5 0 0 0 0 10h9"/>
            <polyline points="21 5 21 9 17 9"/>
          </svg>
          <div class="btn-tip">重做 <kbd>Ctrl ⇧ Z</kbd></div>
        </button>

        <div class="toolbar-sep"></div>

        <!-- 自动布局 -->
        <select v-model="layoutType" @change="autoLayout" class="layout-select">
          <option value="hierarchical">层次</option>
          <option value="tree">树形</option>
          <option value="force">力导向</option>
          <option value="circular">环形</option>
          <option value="grid">网格</option>
        </select>
        <button class="icon-btn" @click="autoLayout">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <rect x="8" y="2" width="8" height="5" rx="1"/>
            <rect x="2" y="17" width="8" height="5" rx="1"/>
            <rect x="14" y="17" width="8" height="5" rx="1"/>
            <line x1="12" y1="7" x2="12" y2="13"/>
            <line x1="12" y1="13" x2="6" y2="17"/>
            <line x1="12" y1="13" x2="18" y2="17"/>
          </svg>
          <div class="btn-tip">重新应用布局</div>
        </button>

        <div class="toolbar-sep"></div>

        <!-- 分组 / 取消分组 -->
        <button class="icon-btn" @click="groupSelected" :disabled="selectedNodes.length < 2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="2" stroke-dasharray="3 2"/>
            <rect x="5" y="5" width="6" height="6" rx="1"/>
            <rect x="13" y="13" width="6" height="6" rx="1"/>
          </svg>
          <div class="btn-tip">分组（需选中 2 个以上节点）</div>
        </button>
        <button class="icon-btn" @click="ungroupSelected" :disabled="selectedNodes.length === 0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <rect x="5" y="5" width="6" height="6" rx="1"/>
            <rect x="13" y="13" width="6" height="6" rx="1"/>
            <line x1="2" y1="2" x2="6" y2="6"/>
            <line x1="22" y1="2" x2="18" y2="6"/>
            <line x1="22" y1="22" x2="18" y2="18"/>
            <line x1="2" y1="22" x2="6" y2="18"/>
          </svg>
          <div class="btn-tip">取消分组</div>
        </button>

        <div class="toolbar-sep"></div>

        <!-- 导入 / 导出 -->
        <button class="icon-btn" @click="importJSON">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <div class="btn-tip">导入 JSON</div>
        </button>
        <div class="dropdown-group" @mouseenter="showExportMenu = true" @mouseleave="showExportMenu = false">
          <button class="icon-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <div class="btn-tip">导出</div>
          </button>
          <div class="export-menu" v-show="showExportMenu" @mouseenter="showExportMenu = true" @mouseleave="showExportMenu = false">
            <div class="export-item" @click="exportJSON(); showExportMenu = false">
              <span>导出 JSON</span>
            </div>
            <div class="export-item" @click="exportPNG(); showExportMenu = false">
              <span>导出 PNG</span>
            </div>
            <div class="export-item" @click="exportSVG(); showExportMenu = false">
              <span>导出 SVG</span>
            </div>
          </div>
        </div>

        <div class="toolbar-sep"></div>

        <!-- 清空 -->
        <button class="icon-btn danger" @click="clear">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
          <div class="btn-tip">清空画布</div>
        </button>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { GraphiteEditor } from '@recall/graphite'

const showExportMenu = ref(false)

const canvasRef = ref<HTMLCanvasElement>()
let editor: GraphiteEditor | null = null
const selectedNodes = ref<string[]>([])
const layoutType = ref<'hierarchical' | 'tree' | 'force' | 'circular' | 'grid'>('hierarchical')
const nodeShape = ref<'rectangle' | 'circle' | 'diamond' | 'triangle'>('rectangle')
const edgeLineStyle = ref<'straight' | 'curved' | 'orthogonal'>('straight')

const nodeStyle = ref({
  fill: '#ffffff',
  stroke: '#333333',
  strokeWidth: 2,
  borderRadius: 8,
  shadowBlur: 0,
  opacity: 1,
})

onMounted(() => {
  if (!canvasRef.value) return

  editor = new GraphiteEditor(canvasRef.value)

  editor.on('selectionChanged', (selection: string[]) => {
    selectedNodes.value = selection

    if (selection.length > 0) {
      const nodes = editor!.getNodes()
      const firstSelected = nodes.find(n => n.id === selection[0])
      if (firstSelected) {
        nodeStyle.value = {
          fill: firstSelected.style.fill,
          stroke: firstSelected.style.stroke,
          strokeWidth: firstSelected.style.strokeWidth,
          borderRadius: firstSelected.style.borderRadius,
          shadowBlur: firstSelected.style.shadowBlur,
          opacity: firstSelected.style.opacity,
        }
      }
    }
  })

  const node1 = editor.createNode({ x: 200, y: 150, width: 120, height: 80, content: 'Node 1' })
  const node2 = editor.createNode({
    x: 400, y: 150, width: 120, height: 80, content: 'Node 2',
    style: { fill: '#e3f2fd', stroke: '#1976d2', shadowBlur: 10 }
  })
  const node3 = editor.createNode({
    x: 300, y: 300, width: 120, height: 80, content: 'Node 3',
    style: { fill: '#fff3e0', stroke: '#f57c00', borderRadius: 20 }
  })

  editor.createEdge({ from: node1.id, to: node2.id })
  editor.createEdge({ from: node1.id, to: node3.id })
})

onUnmounted(() => {
  editor?.destroy()
})

function addNode() {
  if (!editor) return
  editor.createNode({
    x: Math.random() * 600 + 100,
    y: Math.random() * 400 + 100,
    width: 120,
    height: 80,
    content: `Node ${Date.now()}`,
    shape: nodeShape.value
  })
}

function addEdge() {
  if (!editor || selectedNodes.value.length !== 2) return
  editor.createEdge({
    from: selectedNodes.value[0],
    to: selectedNodes.value[1],
    style: { lineStyle: edgeLineStyle.value }
  })
}

function undo() { editor?.undo() }
function redo() { editor?.redo() }
function autoLayout() { editor?.autoLayout({ type: layoutType.value }) }
function clear() { editor?.clear() }

function updateSelectedNodesStyle() {
  if (!editor || selectedNodes.value.length === 0) return
  editor.updateNodesStyle(selectedNodes.value, nodeStyle.value)
}

function exportJSON() {
  if (!editor) return
  const json = editor.exportToJSON()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `graphite-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function importJSON() {
  if (!editor) return
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        editor!.importFromJSON(e.target?.result as string)
      } catch (error) {
        alert('导入失败：' + error)
      }
    }
    reader.readAsText(file)
  }
  input.click()
}

function exportPNG() {
  if (!editor) return
  const a = document.createElement('a')
  a.href = editor.exportToPNG()
  a.download = `graphite-${Date.now()}.png`
  a.click()
}

function exportSVG() {
  if (!editor) return
  const blob = new Blob([editor.exportToSVG()], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `graphite-${Date.now()}.svg`
  a.click()
  URL.revokeObjectURL(url)
}

function groupSelected() { editor?.groupSelected('Group') }
function ungroupSelected() { editor?.ungroupSelected() }
</script>

<style scoped>
.playground {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  display: flex;
  position: relative;
}

.canvas {
  flex: 1;
  min-width: 0;
  background: #fff;
}

/* 右侧样式面板 */
.sidebar {
  width: 240px;
  min-width: 240px;
  flex-shrink: 0;
  background: #fafafa;
  border-left: 1px solid #e5e5e5;
  padding: 16px;
  overflow-y: auto;
}

.sidebar h3 {
  margin: 0 0 16px 0;
  font-size: 13px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.style-control {
  margin-bottom: 16px;
}

.style-control label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  color: #666;
}

.style-control input[type="color"] {
  width: 100%;
  height: 32px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.style-control input[type="range"] {
  width: calc(100% - 44px);
  margin-right: 8px;
  vertical-align: middle;
}

.style-control span {
  font-size: 11px;
  color: #888;
  min-width: 36px;
  display: inline-block;
}

/* 浮动工具栏 */
.floating-toolbar {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 1px;
  background: #ffffff;
  border: 1px solid #e2e2e2;
  border-radius: 12px;
  padding: 4px 6px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.10), 0 1px 4px rgba(0, 0, 0, 0.06);
  z-index: 100;
  user-select: none;
  /* 防止工具栏过宽时出界 */
  max-width: calc(100% - 40px);
  flex-wrap: nowrap;
}

.icon-btn {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 7px;
  cursor: pointer;
  color: #555;
  transition: background 0.12s, color 0.12s;
  flex-shrink: 0;
  padding: 0;
  position: relative;
}

.icon-btn:hover:not(:disabled) {
  background: #f2f2f2;
  color: #111;
}

.icon-btn:active:not(:disabled) {
  background: #e8e8e8;
}

.icon-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.icon-btn.danger:hover:not(:disabled) {
  background: #fff0f0;
  color: #d93025;
}

.toolbar-sep {
  width: 1px;
  height: 20px;
  background: #e5e5e5;
  margin: 0 4px;
  flex-shrink: 0;
}

.layout-select {
  height: 30px;
  padding: 0 6px;
  border: 1px solid #e2e2e2;
  border-radius: 6px;
  font-size: 12px;
  color: #555;
  background: transparent;
  cursor: pointer;
  outline: none;
  flex-shrink: 0;
  margin-right: 1px;
}

.shape-select {
  height: 30px;
  padding: 0 6px;
  border: 1px solid #e2e2e2;
  border-radius: 6px;
  font-size: 12px;
  color: #555;
  background: transparent;
  cursor: pointer;
  outline: none;
  flex-shrink: 0;
  margin-left: 1px;
}

.shape-select:hover,
.layout-select:hover {
  border-color: #bbb;
  background: #f2f2f2;
}

/* 自定义 tooltip */
.btn-tip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: rgba(30, 30, 30, 0.85);
  color: #fff;
  font-size: 11px;
  line-height: 1.4;
  padding: 4px 8px;
  border-radius: 5px;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s;
  z-index: 200;
}

.icon-btn:hover .btn-tip {
  opacity: 1;
}

.btn-tip kbd {
  display: inline-block;
  font-family: inherit;
  font-size: 10px;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 3px;
  padding: 0 4px;
  margin-left: 4px;
}

/* 导出下拉 */
.dropdown-group {
  position: relative;
  display: flex;
  align-items: center;
}

.export-menu {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: #fff;
  border: 1px solid #e2e2e2;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  padding: 4px 0;
  min-width: 120px;
  z-index: 300;
}

.export-item {
  padding: 8px 14px;
  font-size: 12px;
  color: #333;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.12s;
}

.export-item:hover {
  background: #f5f5f5;
}
</style>
