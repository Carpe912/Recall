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
        <button @click="clear">Clear</button>
      </div>
    </div>
    <canvas ref="canvasRef" class="canvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { GraphiteEditor } from '@recall/graphite'

const canvasRef = ref<HTMLCanvasElement>()
let editor: GraphiteEditor | null = null
const selectedNodes = ref<string[]>([])

onMounted(() => {
  if (!canvasRef.value) return

  // Initialize editor
  editor = new GraphiteEditor(canvasRef.value)

  // Listen to selection changes
  editor.on('selectionChanged', (selection: string[]) => {
    selectedNodes.value = selection
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
    content: 'Node 2'
  })

  const node3 = editor.createNode({
    x: 300,
    y: 300,
    width: 120,
    height: 80,
    content: 'Node 3'
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
  editor?.autoLayout()
}

function clear() {
  editor?.clear()
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

.canvas {
  flex: 1;
  background: #fff;
}
</style>
