<template>
  <div class="playground">
    <div class="toolbar">
      <h1>Graphite Playground</h1>
      <div class="controls">
        <button @click="addNode">Add Node</button>
        <button @click="addEdge" :disabled="selectedNodes.length !== 2">Add Edge</button>
        <button @click="undo">Undo</button>
        <button @click="redo">Redo</button>
        <button @click="autoLayout">Auto Layout</button>
        <select v-model="layoutType" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
          <option value="hierarchical">层次布局</option>
          <option value="tree">树形布局</option>
          <option value="force">力导向布局</option>
          <option value="circular">环形布局</option>
          <option value="grid">网格布局</option>
        </select>
        <button @click="groupSelected" :disabled="selectedNodes.length < 2">Group</button>
        <button @click="ungroupSelected" :disabled="selectedNodes.length === 0">Ungroup</button>
        <button @click="clear">Clear</button>
        <button @click="exportJSON">Export JSON</button>
        <button @click="importJSON">Import JSON</button>
        <button @click="exportPNG">Export PNG</button>
        <button @click="exportSVG">Export SVG</button>
      </div>
    </div>
    <div class="main-content">
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
      <canvas ref="canvasRef" class="canvas"></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { GraphiteEditor } from '@recall/graphite'

const canvasRef = ref<HTMLCanvasElement>()
let editor: GraphiteEditor | null = null
const selectedNodes = ref<string[]>([])
const layoutType = ref<'hierarchical' | 'tree' | 'force' | 'circular' | 'grid'>('hierarchical')

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

  // Initialize editor
  editor = new GraphiteEditor(canvasRef.value)

  // Listen to selection changes
  editor.on('selectionChanged', (selection: string[]) => {
    selectedNodes.value = selection

    // 更新样式面板显示当前选中节点的样式
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

  // Create some initial nodes
  const node1 = editor.createNode({
    x: 200,
    y: 150,
    width: 120,
    height: 80,
    content: 'Node 1'
  })

  const node2 = editor.createNode({
    x: 400,
    y: 150,
    width: 120,
    height: 80,
    content: 'Node 2',
    style: {
      fill: '#e3f2fd',
      stroke: '#1976d2',
      shadowBlur: 10,
    }
  })

  const node3 = editor.createNode({
    x: 300,
    y: 300,
    width: 120,
    height: 80,
    content: 'Node 3',
    style: {
      fill: '#fff3e0',
      stroke: '#f57c00',
      borderRadius: 20,
    }
  })

  // Create edges
  editor.createEdge({ from: node1.id, to: node2.id })
  editor.createEdge({ from: node1.id, to: node3.id })
})

onUnmounted(() => {
  editor?.destroy()
})

function addNode() {
  if (!editor) return

  const x = Math.random() * 600 + 100
  const y = Math.random() * 400 + 100

  editor.createNode({
    x,
    y,
    width: 120,
    height: 80,
    content: `Node ${Date.now()}`
  })
}

function addEdge() {
  if (!editor || selectedNodes.value.length !== 2) return

  editor.createEdge({
    from: selectedNodes.value[0],
    to: selectedNodes.value[1]
  })
}

function undo() {
  editor?.undo()
}

function redo() {
  editor?.redo()
}

function autoLayout() {
  editor?.autoLayout({ type: layoutType.value })
}

function clear() {
  editor?.clear()
}

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
        const json = e.target?.result as string
        editor!.importFromJSON(json)
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

  const dataUrl = editor.exportToPNG()
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = `graphite-${Date.now()}.png`
  a.click()
}

function exportSVG() {
  if (!editor) return

  const svg = editor.exportToSVG()
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `graphite-${Date.now()}.svg`
  a.click()
  URL.revokeObjectURL(url)
}

function groupSelected() {
  editor?.groupSelected('Group')
}

function ungroupSelected() {
  editor?.ungroupSelected()
}
</script>

<style scoped>
.playground {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.toolbar {
  height: 60px;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.toolbar h1 {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.controls {
  display: flex;
  gap: 10px;
}

.controls button {
  padding: 8px 16px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.controls button:hover:not(:disabled) {
  background: #f0f0f0;
  border-color: #999;
}

.controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar {
  width: 250px;
  background: #fafafa;
  border-right: 1px solid #ddd;
  padding: 20px;
  overflow-y: auto;
}

.sidebar h3 {
  margin: 0 0 20px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.style-control {
  margin-bottom: 20px;
}

.style-control label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.style-control input[type="color"] {
  width: 100%;
  height: 36px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.style-control input[type="range"] {
  width: calc(100% - 50px);
  margin-right: 10px;
}

.style-control span {
  font-size: 12px;
  color: #666;
  min-width: 40px;
  display: inline-block;
}

.canvas {
  flex: 1;
  background: #fff;
}
</style>
