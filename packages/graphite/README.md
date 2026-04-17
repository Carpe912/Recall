# Graphite

A collaborative canvas editor for knowledge management.

石墨 - 为知识管理打造的协作画布编辑器

## Features

- 🎨 Canvas-based rendering
- 🔗 Nodes and edges
- 🖱️ Interactive (drag, select, resize, rotate)
- ↩️ Undo/Redo
- 🎯 Spatial indexing (QuadTree)
- 🔄 Collaboration ready (Yjs integration)
- 🎭 Layout algorithms (hierarchical, force-directed)

## Architecture

```
graphite/
├── core/              # Core data structures
│   ├── GraphicObject  # Base class for all objects
│   ├── Node           # Node implementation
│   ├── Edge           # Edge implementation
│   └── Transform      # Transform system
├── renderer/          # Rendering system
│   ├── Renderer       # Main renderer
│   └── Camera         # Viewport management
├── interaction/       # Interaction system
│   ├── SelectionManager
│   ├── DragManager
│   └── CommandManager
├── layout/            # Layout algorithms
└── index.ts           # Main entry
```

## Usage

```typescript
import { GraphiteEditor } from '@recall/graphite'

const canvas = document.getElementById('canvas') as HTMLCanvasElement
const editor = new GraphiteEditor(canvas)

// Create a node
const node = editor.createNode({
  x: 100,
  y: 100,
  width: 120,
  height: 80,
  content: 'Hello World'
})

// Create an edge
const edge = editor.createEdge({
  from: node1.id,
  to: node2.id
})
```
