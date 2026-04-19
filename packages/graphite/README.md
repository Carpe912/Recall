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
- 🎨 Custom node types with reactive data
- 📝 In-place text editing
- 🖼️ Built-in rich node types (table, progress, gauge, cards, timeline)

## Architecture

```
graphite/
├── core/              # Core data structures
│   ├── GraphicObject  # Base class for all objects
│   ├── Node           # Node implementation
│   ├── Edge           # Edge implementation
│   ├── CustomNode     # Custom node with reactive data
│   ├── NodeRegistry   # Node type registry
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

### Basic Usage

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

### Custom Node Types

Register custom node types with reactive data and custom rendering:

```typescript
import { NodeRegistry } from '@recall/graphite'

const registry = NodeRegistry.getInstance()

registry.register({
  name: 'progress',
  label: '进度条',
  description: 'A progress bar node',
  defaultSize: { width: 200, height: 60 },
  defaultData: {
    label: '进度',
    value: 60,
    max: 100
  },
  editable: {
    enabled: true,
    field: 'label',
    multiline: false,
    offsetX: 15,
    offsetY: 15,
    width: 160,
    height: 18,
    fontSize: 13,
    fontWeight: 'normal',
    textAlign: 'left'
  },
  render: ({ ctx, bounds, data }) => {
    const { label, value, max } = data
    // Custom rendering logic
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height)
    // ... draw progress bar
  }
})

// Create a custom node
const customNode = editor.createCustomNode({
  x: 200,
  y: 200,
  nodeType: 'progress'
})

// Update node data (triggers re-render automatically)
editor.updateCustomNodeData(customNode.id, { value: 80 })
```

### Generate Preview Thumbnails

Generate preview thumbnails for custom node types (useful for toolbars/palettes):

```typescript
import { NodeRegistry } from '@recall/graphite'

const registry = NodeRegistry.getInstance()
const nodeType = registry.get('progress')

// Generate a 80x60 preview thumbnail
const previewUrl = NodeRegistry.generatePreview(nodeType, { width: 80, height: 60 })

// Use in UI
const img = document.createElement('img')
img.src = previewUrl
```

### In-Place Text Editing

Double-click on editable custom nodes to edit text fields directly on the canvas. The editing experience uses a transparent textarea overlay that shows only the cursor, while the canvas re-renders the text in real-time.

Configure editable fields in the node type definition:

```typescript
editable: {
  enabled: true,
  field: 'label',           // data field to edit
  multiline: false,         // single or multi-line
  offsetX: 15,              // pixel offset from node top-left
  offsetY: 15,
  width: 160,               // input width
  height: 18,               // input height
  fontSize: 13,             // must match canvas font size
  fontWeight: 'normal',     // must match canvas font weight
  textAlign: 'left'         // must match canvas text alignment
}
```

### Built-in Node Types

Graphite includes 8 built-in rich node types:

- **table** - Data table with headers and rows
- **progress** - Progress bar with label and percentage
- **card** - Gradient card with icon, title, subtitle, and value
- **gauge** - Circular gauge/speedometer
- **user-card** - User profile card with avatar and status
- **image-card** - Image card with title, description, and tags
- **timeline** - Timeline with events and status indicators
- **stat-card** - Statistics card with trend indicator

All built-in types support in-place text editing on their primary text fields.

