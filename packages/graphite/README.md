# Graphite

A collaborative canvas editor for knowledge management.

石墨 — 为知识管理打造的协作画布编辑器

## Features

- **Nodes** — rectangle / circle / diamond / triangle, resizable, double-click text editing
- **Edges** — straight / Bézier / orthogonal, arrows, parallel-edge offset, magnetic port snapping
- **Draggable waypoints** — drag interior control points on any edge; undo/redo supported
- **Configurable ports** — define any number of ports per node with normalized position and type (input / output / both)
- **Connection validation** — built-in rules (no self-loop, no duplicate, port-type compatibility) plus custom rule registration
- **Rich style system** — font family, gradient border (`strokeGradient`), named dash presets (`solid / dashed / dotted / long-dash / dot-dash`)
- **Transaction API** — `beginTransaction / commitTransaction / rollbackTransaction` for atomic undo/redo
- **Complete serialization** — JSON v2 preserves shape, nodeType, data, imageData, waypoints, ports, label
- **Smart routing** — A\* pathfinding around obstacles
- **Layout algorithms** — hierarchical / tree / force-directed / circular / grid
- **Custom node types** — reactive data + custom Canvas render function
- **In-place text editing** — transparent textarea overlay, real-time canvas re-render
- **Minimap** — overview navigation
- **Themes** — light / dark, persisted to localStorage
- **Clipboard** — copy / cut / paste (preserves edge relationships)
- **Collaboration-ready** — Yjs CRDT interface stubs included

## Architecture

```
graphite/src/
├── GraphiteEditor.ts         # Façade — single public API entry point
├── core/
│   ├── GraphicObject.ts      # Abstract base for all scene objects
│   ├── Node.ts               # Node with configurable ports
│   ├── Edge.ts               # Edge with waypoints support
│   ├── CustomNode.ts         # Custom node with reactive data
│   ├── NodeRegistry.ts       # Node type registry
│   ├── Group.ts              # Visual grouping
│   ├── Path.ts               # Freehand drawing path
│   └── ImageNode.ts          # Image node
├── renderer/
│   ├── Renderer.ts           # Canvas renderer
│   ├── Camera.ts             # Viewport (pan / zoom)
│   └── DirtyRectManager.ts   # Dirty-rect optimisation
├── interaction/
│   ├── CommandManager.ts     # Undo/redo + transaction support
│   ├── Commands.ts           # Move, Create, Delete, MoveWaypoint
│   ├── SelectionManager.ts
│   └── DragManager.ts
├── ui/
│   ├── ContextMenu.ts
│   └── Minimap.ts
├── utils/
│   ├── ConnectionValidator.ts  # Connection rule engine
│   ├── LayoutEngine.ts
│   ├── PathfindingRouter.ts    # A* smart routing
│   ├── SnapGuide.ts
│   ├── ThemeManager.ts
│   ├── EventEmitter.ts
│   └── geometry.ts
└── index.ts                  # Public exports
```

## Usage

### Basic Usage

```typescript
import { GraphiteEditor } from '@recall/graphite'

const canvas = document.getElementById('canvas') as HTMLCanvasElement
const editor = new GraphiteEditor(canvas)

// Create nodes
const node1 = editor.createNode({
  x: 100, y: 100, width: 120, height: 80, content: 'Start'
})
const node2 = editor.createNode({
  x: 300, y: 100, width: 120, height: 80, content: 'End'
})

// Create an edge
editor.createEdge({ from: node1.id, to: node2.id })
```

### Configurable Ports

```typescript
import type { PortDefinition } from '@recall/graphite'

// Custom port layout — entry on left, exit on right (no top/bottom)
editor.setNodePorts(node1.id, [
  { id: 'in',  dx: -0.5, dy: 0, type: 'input'  },
  { id: 'out', dx:  0.5, dy: 0, type: 'output' },
])

// Reset to default 4-port layout
editor.resetNodePorts(node1.id)
```

### Connection Validation

```typescript
import { createDefaultValidator } from '@recall/graphite'

// Pre-built validator: no self-loop + no duplicate + port-type compat
const validator = createDefaultValidator()
editor.setConnectionValidator(validator)

// Add a project-specific rule
editor.addConnectionRule('max-out-degree', (fromNode, _to, _fp, _tp, edges) => {
  const outCount = edges.filter(e => e.fromNodeId === fromNode.id).length
  if (outCount >= 3) return 'A node may have at most 3 outgoing connections'
  return true
})

// Listen for rejections in the UI
editor.on('connectionRejected', ({ reason }) => {
  alert(reason)
})
```

### Draggable Waypoints

Waypoints are interactive automatically — select an edge, then drag the diamond handle on any interior point. Use undo/redo (Ctrl+Z) to revert.

```typescript
// Programmatically set waypoints
const edge = editor.createEdge({ from: node1.id, to: node2.id })
edge.waypoints = [{ x: 200, y: 50 }]  // fixed via point
```

### Style System

```typescript
// Font family
editor.updateNodeStyle(node1.id, { fontFamily: 'Georgia, serif' })

// Gradient border (horizontal, left → right)
editor.updateNodeStyle(node1.id, { strokeGradient: ['#667eea', '#764ba2'] })

// Named dash presets on edges
editor.updateEdgeStyle(edge.id, { dashPreset: 'dashed' })
// Presets: 'solid' | 'dashed' | 'dotted' | 'long-dash' | 'dot-dash'
```

### Transaction API

```typescript
editor.beginTransaction('bulk-create')
try {
  const a = editor.createNode({ x: 0,   y: 0,   width: 100, height: 60, content: 'A' })
  const b = editor.createNode({ x: 200, y: 0,   width: 100, height: 60, content: 'B' })
  const c = editor.createNode({ x: 100, y: 150, width: 100, height: 60, content: 'C' })
  editor.createEdge({ from: a.id, to: c.id })
  editor.createEdge({ from: b.id, to: c.id })
  editor.commitTransaction()        // one entry in undo history
} catch (e) {
  editor.rollbackTransaction()      // undo everything
}
```

### Serialization (JSON v2)

```typescript
// Export — includes ports, waypoints, shape, nodeType, imageData
const json = editor.exportToJSON()

// Import — fully restores all node/edge types
editor.importFromJSON(json)
```

### Custom Node Types

```typescript
import type { NodeTypeDefinition } from '@recall/graphite'

editor.registerNodeType({
  name: 'progress',
  defaultSize: { width: 200, height: 60 },
  defaultData: { label: 'Loading…', value: 0, max: 100 },
  editable: { enabled: true, field: 'label', offsetX: 12, offsetY: 10, fontSize: 13 },
  render: ({ ctx, bounds, data }) => {
    const pct = data.value / data.max
    ctx.fillStyle = '#f0f0f0'
    ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height)
    ctx.fillStyle = '#4A90E2'
    ctx.fillRect(bounds.x, bounds.y, bounds.width * pct, bounds.height)
    ctx.fillStyle = '#333'
    ctx.font = '13px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(data.label, bounds.x + 12, bounds.y + 20)
  }
})

const node = editor.createCustomNode({ x: 100, y: 100, nodeType: 'progress' })
editor.updateCustomNodeData(node.id, { value: 75 })
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` | Redo |
| `Ctrl/Cmd + C` | Copy |
| `Ctrl/Cmd + X` | Cut |
| `Ctrl/Cmd + V` | Paste |
| `Delete / Backspace` | Delete selected |
| `Space + drag` | Pan canvas |

## Exports

```typescript
// Classes
export { GraphiteEditor, Node, Edge, CustomNode, NodeRegistry, Group }
export { Renderer, Camera, CommandManager, CompoundCommand }
export { ConnectionValidator, createDefaultValidator }
export { LayoutEngine, EventEmitter, Animator }

// Types
export type {
  NodeData, NodeStyle, EdgeData, EdgeStyle,
  PortDefinition, DashPreset,
  ConnectionRule, ValidationResult,
  Point, Rect, Transform, ICommand, LayoutOptions
}
```
