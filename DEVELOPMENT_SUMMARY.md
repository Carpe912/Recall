# Graphite 编辑器开发总结

## 项目概述

Graphite 是一个基于 Canvas 的图形编辑器，支持节点、连线、分组、自动布局、实时协作等功能。

---

## 功能迭代记录

### 2026-04-19（最新）

#### 1. 折线可拖动折点（Waypoint）
- 选中连线后，内部控制点显示为菱形拖拽柄
- 首次拖拽时自动将自动计算的内部点复制为手动 waypoints
- `MoveWaypointCommand` 支持撤销/重做
- `edge.waypoints` 在 `updatePath()` 中优先于自动路由

#### 2. 可配置连接点（Port）
- 新增 `PortDefinition` 接口：`id / dx / dy / type / label`
- `dx / dy` 为归一化坐标（-0.5 到 0.5 相对于节点尺寸）
- 节点默认 4 端口，可通过 `setNodePorts()` 替换任意端口布局
- 端口按类型着色：input=绿、output=橙、both=蓝

#### 3. 样式系统增强
- **fontFamily**：节点文字字体族，直接写入 canvas `font` 字符串
- **strokeGradient**：`[color1, color2]` 水平线性渐变边框
- **dashPreset**：连线虚线命名预设（solid / dashed / dotted / long-dash / dot-dash）；优先级高于 `strokeDasharray`

#### 4. 连接规则校验（ConnectionValidator）
- `ConnectionValidator` 类：命名规则注册表，规则签名 `(fromNode, toNode, fromPortId, toPortId, edges) => true | string`
- 内置规则：`noSelfLoop` / `noDuplicateEdge` / `portTypeCompatibility`
- `createDefaultValidator()` 预装全部 3 条内置规则
- UI 拖拽连线时校验失败 → emit `'connectionRejected'` 事件
- `createEdge()` API 调用时校验失败 → throw Error

#### 5. 事务（Transaction）机制
- `CompoundCommand`：N 条子命令捆绑为一条历史记录，Ctrl+Z 一次性撤销
- `CommandManager` 新增：`beginTransaction / commitTransaction / rollbackTransaction`
- 支持嵌套事务（只有最外层 commit 才写入历史）
- `paste()` 和 `deleteSelected()` 已包裹在事务中

#### 6. 序列化完整化（JSON v2）
- `exportToJSON` 新增 `version: 2`，节点保存 `shape / ports`，CustomNode 额外保存 `nodeType / data`，ImageNode 保存 `imageData`；连线保存 `waypoints / label`
- `importFromJSON` 按 `imageData` → `nodeType` → 普通 Node 顺序路由恢复
- 节点 id 在创建后显式恢复，保证 import 后 id 一致

---

### 2026-04-18

#### 1. 文本编辑
- 双击节点进入编辑模式（textarea 透明覆盖层，实时回写 canvas）
- Enter 保存、Escape 取消、失焦保存
- CustomNode 支持通过 `editable` 配置字段、偏移、字体

#### 2. 多种形状
- 圆形、菱形、三角形 + 精确 hitTest
- `node.shape` 字段序列化并恢复

#### 3. 连线样式
- 直线 / 贝塞尔曲线 / 正交折线
- 工具栏切换；连线平行多边偏移

#### 4. 对齐与分布
- 左/右/顶/底/水平居中/垂直居中 对齐
- 水平分布/垂直分布

#### 5. 主题切换
- 亮色 / 暗色；保存到 localStorage

#### 6. 磁性吸附连接
- 30px 阈值自动吸附到最近端口

---

## 架构说明

### 命令模式（Command Pattern）

```
ICommand { execute() / undo() }
  ├── MoveCommand
  ├── CreateNodeCommand / DeleteNodeCommand
  ├── CreateEdgeCommand / DeleteEdgeCommand
  ├── MoveWaypointCommand
  └── CompoundCommand   ← 事务
```

`CommandManager` 维护 undo 栈和 redo 栈；事务期间命令进入 `pendingCommands[]`，commitTransaction 将其打包为一个 `CompoundCommand` 推入历史。

### 端口系统（PortDefinition）

```
PortDefinition {
  id: string          // 唯一标识
  dx: number          // 归一化 X（-0.5 = 左边缘，+0.5 = 右边缘）
  dy: number          // 归一化 Y（-0.5 = 上边缘，+0.5 = 下边缘）
  type?: 'input' | 'output' | 'both'
  label?: string
}
```

默认 4 端口：`{ id:'top', dx:0, dy:-0.5 }` 等。`getPortPosition(id)` 以世界坐标返回端口位置。

### 连接规则（ConnectionValidator）

```
ConnectionRule = (fromNode, toNode, fromPortId, toPortId, edges) => true | false | string
```

规则按注册顺序求值，第一条失败的规则短路返回。GraphiteEditor 同时在 `createEdge()` API 和 UI 拖拽路径中调用校验。

### 序列化格式（JSON v2）

```json
{
  "version": 2,
  "nodes": [
    {
      "id": "...", "x": 0, "y": 0, "width": 120, "height": 80,
      "content": "Hello", "shape": "rectangle",
      "style": { "fill": "#fff", "fontFamily": "sans-serif", "strokeGradient": ["#f00","#00f"] },
      "ports": [{ "id": "top", "dx": 0, "dy": -0.5, "type": "both" }],
      "nodeType": "progress",  // CustomNode 专有
      "data": { "value": 75 }, // CustomNode 专有
      "imageData": "data:..."  // ImageNode 专有
    }
  ],
  "edges": [
    {
      "id": "...", "from": "node1", "to": "node2",
      "style": { "dashPreset": "dashed" },
      "waypoints": [{ "x": 200, "y": 50 }],
      "label": ""
    }
  ]
}
```

---

## 修复的问题

### 1. 事件监听器清理
`destroy()` 中正确移除绑定到 `canvas` 和 `window` 的所有监听器；通过保存 `boundXxx` 引用实现精确移除。

### 2. 节点选择坐标错误
Sidebar 出现改变 canvas CSS 宽度但未触发 `resize` → 使用 `ResizeObserver` 监听 canvas 元素本身。

### 3. 右键菜单位置闪烁
先 `visibility: hidden` 测量尺寸，再计算位置，最后 `visibility: visible`。

### 4. 边路径更新不及时
对齐操作后 edge 节点引用可能为 null → `updateEdges()` 中检查并重新绑定 `fromNode / toNode`。

---

## 关键代码模式

### 透明文本编辑覆盖层

```typescript
const textarea = document.createElement('textarea')
textarea.style.cssText = `
  position: fixed;
  background: transparent;
  color: transparent;
  caret-color: #333;
  /* ... */
`
document.body.appendChild(textarea)
textarea.addEventListener('input', () => {
  node.setContent(textarea.value)
  renderer.markDirty()
})
```

### 脏矩形渲染

```typescript
// 任何状态变化时
this.renderer.markDirty()

// 渲染循环（requestAnimationFrame）
if (this.dirty) {
  this.dirty = false
  this.render()
}
```

### CompoundCommand 事务

```typescript
editor.beginTransaction('paste')
nodes.forEach(n => commandManager.execute(new CreateNodeCommand(n, nodeList)))
edges.forEach(e => commandManager.execute(new CreateEdgeCommand(e, edgeList)))
editor.commitTransaction()  // 一次 Ctrl+Z 撤销全部
```

---

## 文件结构

```
packages/graphite/src/
├── core/
│   ├── Node.ts              # ports[] 可配置
│   ├── Edge.ts              # waypoints[] + dashPreset
│   ├── CustomNode.ts
│   ├── NodeRegistry.ts
│   ├── Group.ts
│   ├── Path.ts
│   └── ImageNode.ts
├── renderer/
│   ├── Renderer.ts
│   ├── Camera.ts
│   └── DirtyRectManager.ts
├── interaction/
│   ├── CommandManager.ts    # CompoundCommand + 事务
│   ├── Commands.ts          # MoveWaypointCommand 等
│   ├── SelectionManager.ts
│   └── DragManager.ts
├── ui/
│   ├── ContextMenu.ts
│   └── Minimap.ts
├── utils/
│   ├── ConnectionValidator.ts   # ← 新增
│   ├── LayoutEngine.ts
│   ├── PathfindingRouter.ts
│   ├── SnapGuide.ts
│   ├── ThemeManager.ts
│   ├── AlignmentManager.ts
│   ├── EventEmitter.ts
│   ├── Animator.ts
│   └── geometry.ts
├── collaboration/
│   └── CollaborationProvider.ts
├── GraphiteEditor.ts
└── index.ts

apps/playground/src/
└── App.vue
```

---

## 未来改进方向

1. **性能**：WebGL 渲染器、虚拟化渲染、Web Worker 布局计算
2. **功能**：节点富文本编辑、PDF/Mermaid 导出、插件系统
3. **协作**：Yjs 完整绑定、用户光标显示、版本历史
4. **可访问性**：键盘导航、屏幕阅读器、高对比度模式
