# 从零开始构建一个图形编辑器 —— Graphite 源码导读

> 本文以 `packages/graphite` 为教材，逐模块讲解一个基于 Canvas 的图形编辑器是如何从零搭建起来的。适合想动手做白板、流程图、思维导图等产品的开发者阅读。

---

## 目录

1. [整体架构概览](#1-整体架构概览)
2. [技术栈](#2-技术栈)
3. [数据模型：图形对象](#3-数据模型图形对象)
4. [渲染引擎：Camera + Renderer](#4-渲染引擎camera--renderer)
5. [交互系统：事件处理](#5-交互系统事件处理)
6. [命令模式：撤销与重做](#6-命令模式撤销与重做)
7. [选择管理](#7-选择管理)
8. [拖拽管理](#8-拖拽管理)
9. [连线（Edge）系统](#9-连线edge系统)
10. [智能路由：A* 寻路算法](#10-智能路由a-寻路算法)
11. [吸附辅助线](#11-吸附辅助线)
12. [自动布局引擎](#12-自动布局引擎)
13. [铅笔工具与路径简化](#13-铅笔工具与路径简化)
14. [图片节点](#14-图片节点)
15. [节点分组](#15-节点分组)
16. [小地图（Minimap）](#16-小地图minimap)
17. [主题系统](#17-主题系统)
18. [导入导出](#18-导入导出)
19. [事件总线](#19-事件总线)
20. [UI 层：Playground（Vue 应用）](#20-ui-层playground-vue-应用)
21. [构建一个图形编辑器的完整路径](#21-构建一个图形编辑器的完整路径)

---

## 1. 整体架构概览

```
packages/graphite/src/
├── GraphiteEditor.ts           # 编辑器总入口（门面/Facade）
├── core/                       # 核心数据模型
│   ├── GraphicObject.ts        # 所有图形对象的抽象基类
│   ├── Node.ts                 # 普通节点
│   ├── Edge.ts                 # 连线
│   ├── Group.ts                # 节点分组
│   ├── Path.ts                 # 自由绘制路径
│   ├── ImageNode.ts            # 图片节点
│   └── Port.ts                 # 连接点定义
├── renderer/                   # 渲染层
│   ├── Renderer.ts             # Canvas 渲染器
│   ├── Camera.ts               # 相机（平移/缩放）
│   └── DirtyRectManager.ts     # 脏区域管理（优化渲染）
├── interaction/                # 交互层
│   ├── CommandManager.ts       # 命令管理器（撤销/重做）
│   ├── Commands.ts             # 具体命令实现
│   ├── SelectionManager.ts     # 选择管理
│   └── DragManager.ts          # 拖拽管理
├── ui/
│   ├── ContextMenu.ts          # 右键菜单
│   └── Minimap.ts              # 小地图
├── utils/
│   ├── EventEmitter.ts         # 事件总线
│   ├── SnapGuide.ts            # 吸附辅助线
│   ├── LayoutEngine.ts         # 自动布局算法
│   ├── PathfindingRouter.ts    # A* 智能路由
│   ├── AlignmentManager.ts     # 对齐工具
│   ├── ThemeManager.ts         # 主题管理
│   ├── Animator.ts             # 动画工具
│   └── geometry.ts             # 几何工具函数
└── types/index.ts              # TypeScript 类型定义
```

**分层思路（重要）：**

| 层次 | 职责 |
|------|------|
| `core/` | 数据 —— 图形对象的属性和绘制逻辑 |
| `renderer/` | 渲染 —— 把数据画到 Canvas 上 |
| `interaction/` | 交互 —— 把鼠标/键盘事件翻译成操作 |
| `utils/` | 算法 —— 路由、布局、吸附等独立算法 |
| `GraphiteEditor.ts` | 门面 —— 把以上各层组合成对外暴露的 API |

---

## 2. 技术栈

| 工具 | 版本 | 用途 |
|------|------|------|
| TypeScript | 5.x | 语言 |
| Vite | 5.x | 构建工具（库模式） |
| Vue 3 | — | Playground 应用框架 |
| HTML5 Canvas | — | 2D 渲染（无第三方渲染库） |
| pnpm workspace | — | Monorepo 管理 |

> 核心渲染全部使用原生 Canvas 2D API，不依赖 Konva、Fabric.js 等库。这是学习图形编辑器的最佳方式，因为你需要亲自处理每一个细节。

---

## 3. 数据模型：图形对象

**文件：** [core/GraphicObject.ts](packages/graphite/src/core/GraphicObject.ts)

所有可绘制对象的抽象基类。学习要点：

### 3.1 Transform（变换）

每个对象都有一个 `transform` 属性，记录它在"世界坐标系"中的位置、缩放和旋转：

```typescript
interface Transform {
  x: number      // 世界坐标 X
  y: number      // 世界坐标 Y
  scaleX: number
  scaleY: number
  rotation: number
}
```

> **什么是世界坐标？** 画布本身有一个固定的坐标系，这个坐标系叫"世界坐标"。你在屏幕上看到的位置（"屏幕坐标"）会因为摄像机平移和缩放而变化，但世界坐标始终不变。

### 3.2 抽象方法

每个子类必须实现三个方法：

```typescript
abstract draw(ctx: CanvasRenderingContext2D): void  // 如何绘制自己
abstract hitTest(x: number, y: number): boolean    // 点是否在我身上
abstract getBounds(): Rect                          // 我的包围盒
```

这是图形编辑器中最核心的接口设计：让每个对象知道如何**画自己**、如何**被选中**、以及自己**占据多大区域**。

### 3.3 坐标转换

```typescript
// 本地坐标转世界坐标（考虑父子关系）
localToWorld(point: Point): Point

// 世界坐标转本地坐标（用于碰撞检测）
worldToLocal(point: Point): Point
```

为什么需要坐标转换？因为绘制时用 `ctx.translate()` 移到节点中心，此时 `(0, 0)` 就是节点中心（本地坐标）。而鼠标点击的位置是世界坐标，需要反变换才能做碰撞检测。

---

**文件：** [core/Node.ts](packages/graphite/src/core/Node.ts)

节点支持四种形状（`rectangle | circle | diamond | triangle`），对应不同的 Canvas 路径绘制方式：

```typescript
// 矩形：使用 quadraticCurveTo 实现圆角
ctx.moveTo(x + radius, y)
ctx.lineTo(x + width - radius, y)
ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
// ...

// 圆形：直接用 arc
ctx.arc(0, 0, radius, 0, Math.PI * 2)

// 菱形：四个顶点连线
ctx.moveTo(0, -halfHeight)
ctx.lineTo(halfWidth, 0)
// ...
```

**碰撞检测**也要对应形状处理：

```typescript
// 菱形碰撞：用"范数"判断
const dx = Math.abs(local.x) / halfWidth
const dy = Math.abs(local.y) / halfHeight
return dx + dy <= 1  // 满足这个条件就在菱形内

// 三角形碰撞：根据 y 坐标算出该行的最大宽度
const ratio = (local.y + halfHeight) / (2 * halfHeight)
const maxX = halfWidth * (1 - ratio * 2)
return Math.abs(local.x) <= Math.abs(maxX)
```

---

## 4. 渲染引擎：Camera + Renderer

### 4.1 Camera（相机）

**文件：** [renderer/Camera.ts](packages/graphite/src/renderer/Camera.ts)

相机是图形编辑器中最重要的概念之一。它管理"我们在哪看"和"看多大"。

```typescript
class Camera {
  x: number = 0      // 画布平移量
  y: number = 0
  zoom: number = 1   // 缩放比例（1 = 原始大小）
  minZoom: number = 0.1
  maxZoom: number = 5

  // 把相机变换应用到 Canvas 上下文
  applyTransform(ctx: CanvasRenderingContext2D): void {
    ctx.translate(this.x, this.y)
    ctx.scale(this.zoom, this.zoom)
  }
}
```

**最关键的两个方法：坐标转换**

```typescript
// 屏幕坐标 → 世界坐标（用于把鼠标位置转成画布内位置）
screenToWorld(point: Point): Point {
  return {
    x: (point.x - this.x) / this.zoom,
    y: (point.y - this.y) / this.zoom,
  }
}

// 世界坐标 → 屏幕坐标（用于把画布位置转成屏幕显示位置）
worldToScreen(point: Point): Point {
  return {
    x: point.x * this.zoom + this.x,
    y: point.y * this.zoom + this.y,
  }
}
```

**以鼠标为中心缩放**是很多人卡壳的地方，原理如下：

```typescript
scale(delta: number, centerX: number, centerY: number): void {
  const oldZoom = this.zoom
  const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom * (1 + delta)))

  // 鼠标在世界坐标中的位置（缩放前）
  const worldX = (centerX - this.x) / oldZoom
  const worldY = (centerY - this.y) / oldZoom

  this.zoom = newZoom

  // 保证鼠标对应的世界坐标点在屏幕上不动
  // 即：worldX * newZoom + newX = centerX
  this.x = centerX - worldX * newZoom
  this.y = centerY - worldY * newZoom
}
```

### 4.2 Renderer（渲染器）

**文件：** [renderer/Renderer.ts](packages/graphite/src/renderer/Renderer.ts)

渲染器负责每帧把场景画到 Canvas 上。

**高 DPI 处理：**

```typescript
private resize(): void {
  const dpr = window.devicePixelRatio || 1  // 视网膜屏是 2
  const rect = this.canvas.getBoundingClientRect()

  // Canvas 的实际像素数要乘以 dpr
  this.canvas.width = rect.width * dpr
  this.canvas.height = rect.height * dpr

  // CSS 显示尺寸保持不变
  this.canvas.style.width = `${rect.width}px`
  this.canvas.style.height = `${rect.height}px`

  // 全局缩放以抵消 dpr 影响（让坐标逻辑正常）
  this.ctx.scale(dpr, dpr)
}
```

**渲染循环：**

```typescript
startRenderLoop(renderCallback: () => void): void {
  const loop = () => {
    renderCallback()
    this.animationFrameId = requestAnimationFrame(loop)
  }
  loop()
}
```

使用 `requestAnimationFrame` 驱动渲染。`markDirty()` 设置标志位，只有标记了"需要重绘"时才真正绘制，避免每帧都重绘。

**渲染顺序（画家算法）：**

先画的在底层，后画的在上层。所以顺序是：

1. 背景色 + 网格
2. 连线（Edge）—— 在节点下方
3. 节点（Node）
4. 分组背景框
5. 选择框、调整大小控制点
6. 连线预览
7. 吸附辅助线
8. 小地图

**背景网格绘制：**

```typescript
// 计算当前视口范围内需要绘制哪些网格线
const startX = Math.floor(-camera.x / camera.zoom / gridSize) * gridSize
const endX = startX + (canvas.width / camera.zoom) + gridSize

for (let x = startX; x <= endX; x += gridSize) {
  ctx.beginPath()
  ctx.moveTo(x, startY)
  ctx.lineTo(x, endY)
  ctx.stroke()
}
```

注意：每条线宽要除以 zoom，否则缩小画布时线会变粗：
```typescript
ctx.lineWidth = 1 / camera.zoom
```

---

## 5. 交互系统：事件处理

**文件：** [GraphiteEditor.ts](packages/graphite/src/GraphiteEditor.ts)（核心交互逻辑）

图形编辑器的交互状态机是整个系统最复杂的部分。理解它的关键是：**同一时间只有一种交互模式在生效**。

### 5.1 交互状态变量

```typescript
// 画布平移
private isSpacePressed: boolean = false
private isPanning: boolean = false
private panStartPoint: Point | null = null

// 框选
private selectionBoxStart: Point | null = null
private selectionBoxEnd: Point | null = null

// 铅笔绘制
private isPencilMode: boolean = false
private isDrawing: boolean = false

// 创建连线
private isCreatingEdge: boolean = false
private edgeStartNode: Node | null = null

// 调整节点大小
private isResizing: boolean = false
private resizeHandle: string | null = null

// 悬浮状态（用于显示连接点）
private hoveredNode: Node | null = null
```

### 5.2 onMouseDown 的决策树

```
mousedown
├── 空格键按下 OR 中键 → 开始平移
├── 铅笔模式 → 开始绘制路径
└── 左键
    ├── 点击到节点
    │   ├── 点击到连接点 → 开始创建连线
    │   ├── 已选中 + 点击调整大小控制点 → 开始调整大小
    │   └── 其他 → 开始拖拽节点
    └── 点击空白处 → 开始框选
```

### 5.3 坐标转换流程

每次鼠标事件都要先做坐标转换：

```typescript
// 1. 获取鼠标在 canvas 元素内的位置
const point = this.getMousePosition(e)  // 屏幕坐标

// 2. 转换为世界坐标（考虑平移和缩放）
const worldPoint = this.renderer.getCamera().screenToWorld(point)

// 3. 使用世界坐标做碰撞检测、位置计算
const clickedNode = this.findNodeAt(worldPoint)
```

### 5.4 碰撞检测

查找鼠标点击了哪个节点：

```typescript
private findNodeAt(point: Point): Node | null {
  // 从后往前遍历（数组末尾的节点在屏幕最上层）
  for (let i = this.nodes.length - 1; i >= 0; i--) {
    if (this.nodes[i].hitTest(point.x, point.y)) {
      return this.nodes[i]
    }
  }
  return null
}
```

### 5.5 调整节点大小

节点四边和四角共有 8 个控制点（n/s/e/w/ne/nw/se/sw）。调整大小时要同时改变节点的**尺寸**和**位置**（因为位置是中心点）：

```typescript
case 'se': // 右下角拖拽
  node.width = Math.max(minSize, startWidth + dx)
  node.height = Math.max(minSize, startHeight + dy)
  // 中心点也要跟着移动
  node.setPosition(startX + dx / 2, startY + dy / 2)
  break
```

---

## 6. 命令模式：撤销与重做

**文件：** [interaction/CommandManager.ts](packages/graphite/src/interaction/CommandManager.ts)，[interaction/Commands.ts](packages/graphite/src/interaction/Commands.ts)

这是实现 Ctrl+Z / Ctrl+Shift+Z 的核心设计。

### 6.1 Command 接口

```typescript
interface ICommand {
  execute(): void  // 执行操作
  undo(): void     // 撤销操作
}
```

### 6.2 CommandManager

```typescript
class CommandManager {
  private history: ICommand[] = []
  private current: number = -1  // 当前位置指针

  execute(command: ICommand): void {
    command.execute()
    // 清除当前位置之后的历史（重做分支失效）
    this.history = this.history.slice(0, this.current + 1)
    this.history.push(command)
    this.current++
  }

  undo(): boolean {
    if (this.current < 0) return false
    this.history[this.current].undo()
    this.current--
    return true
  }

  redo(): boolean {
    if (this.current >= this.history.length - 1) return false
    this.current++
    this.history[this.current].execute()
    return true
  }
}
```

### 6.3 具体命令示例

```typescript
// 创建节点命令
class CreateNodeCommand implements ICommand {
  constructor(private node: Node, private nodes: Node[]) {}

  execute(): void {
    if (!this.nodes.includes(this.node)) {
      this.nodes.push(this.node)
    }
  }

  undo(): void {
    const index = this.nodes.indexOf(this.node)
    if (index !== -1) this.nodes.splice(index, 1)
  }
}

// 移动命令（注意：拖拽结束后才加入历史，而不是拖拽过程中）
class MoveCommand implements ICommand {
  private oldPositions: Point[]
  private newPositions: Point[]

  constructor(nodes: Node[], dx: number, dy: number) {
    this.oldPositions = nodes.map(n => ({ x: n.transform.x, y: n.transform.y }))
    this.newPositions = nodes.map(n => ({ x: n.transform.x + dx, y: n.transform.y + dy }))
  }
  // ...
}
```

> **关键细节：** 拖拽节点时，位置更新是实时的（不走 Command），拖拽结束后才创建一个 `MoveCommand` 并通过 `addToHistory()` 加入历史（不重复执行）。��则 undo 时会把位置还原两次。

---

## 7. 选择管理

**文件：** [interaction/SelectionManager.ts](packages/graphite/src/interaction/SelectionManager.ts)

```typescript
class SelectionManager extends EventEmitter {
  private selectedNodes: Set<Node> = new Set()
  private selectedEdges: Set<Edge> = new Set()

  selectNode(node: Node, multi: boolean = false): void {
    if (!multi) {
      // 单选时清除之前的选择
      this.selectedNodes.clear()
      this.selectedEdges.clear()
    }
    this.selectedNodes.add(node)
    this.emit('selectionChanged', this.getSelectedNodeIds())
  }

  // 框选：检查节点的包围盒是否与选框相交
  selectInRect(rect: Rect, nodes: Node[], edges: Edge[]): void {
    this.clear()
    nodes.forEach(node => {
      if (rectIntersects(node.getBounds(), rect)) {
        this.selectedNodes.add(node)
      }
    })
    // ...
  }
}
```

使用 `Set` 而不是数组，保证同一节点不会被重复添加，并且 O(1) 时间判断是否已选中。

---

## 8. 拖拽管理

**文件：** [interaction/DragManager.ts](packages/graphite/src/interaction/DragManager.ts)

拖拽管理器负责在鼠标移动时计算节点应该移动到哪里，并触发事件通知外部更新边的路径。

拖拽流程：
1. `mousedown` → `dragManager.startDrag(nodes, startPoint)` —— 记录起点
2. `mousemove` → `dragManager.drag(currentPoint)` —— 计算偏移，移动节点
3. `mouseup` → `dragManager.endDrag()` —— 触发 `dragEnd` 事件，外部创建 `MoveCommand`

**吸附集成：**

拖拽过程中，如果只拖一个节点，会先通过 `SnapGuide` 计算吸附结果，再把吸附后的目标坐标传给 `DragManager`：

```typescript
const snapResult = this.snapGuide.snap(node, worldPoint.x, worldPoint.y, this.nodes, zoom)
this.dragManager.drag(worldPoint, { x: snapResult.x, y: snapResult.y })
```

---

## 9. 连线（Edge）系统

**文件：** [core/Edge.ts](packages/graphite/src/core/Edge.ts)

### 9.1 连线的核心：路径点更新

连线的路径不是固定的，每次节点移动都要重新计算。`updatePath()` 方法负责此事：

```typescript
updatePath(allEdges: Edge[], allNodes: Node[]): void {
  const startCenter = this.fromNode.getCenter()
  const endCenter = this.toNode.getCenter()

  // 计算连线方向向量
  const dx = endCenter.x - startCenter.x
  const dy = endCenter.y - startCenter.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  const dirX = dx / distance
  const dirY = dy / distance

  // 从节点的真实边缘出发（不是从中心出发）
  // 用方向向量和节点半宽/半高计算边缘交点
  const fromOffset = Math.min(
    fromHalfWidth / Math.abs(dirX),
    fromHalfHeight / Math.abs(dirY)
  )
  const start = { x: startCenter.x + dirX * fromOffset, ... }
  // ...
}
```

### 9.2 平行边处理

两个节点之间可能有多条连线，需要错开绘制：

```typescript
const parallelEdges = allEdges.filter(e =>
  (e.fromNodeId === this.fromNodeId && e.toNodeId === this.toNodeId) ||
  (e.fromNodeId === this.toNodeId && e.toNodeId === this.fromNodeId)
)

if (parallelEdges.length > 1) {
  const spacing = 20
  const offset = (index - (totalEdges - 1) / 2) * spacing

  // 垂直方向偏移
  const perpX = -dirY
  const perpY = dirX
  start.x += perpX * offset
  end.x += perpX * offset
}
```

### 9.3 三种线型

| 线型 | 说明 | 实现方式 |
|------|------|----------|
| `straight` | 直线 | 两点连线 |
| `curved` | 贝塞尔曲线 | `quadraticCurveTo` |
| `orthogonal` | 正交折线 | 简单折线或 A* 路由 |

**贝塞尔曲线控制点计算：**

```typescript
const offset = distance * 0.2
const midX = (start.x + end.x) / 2
const midY = (start.y + end.y) / 2

// ���直于连线方向
const perpX = -dy / distance
const perpY = dx / distance

const cp1X = midX + perpX * offset
const cp1Y = midY + perpY * offset

ctx.quadraticCurveTo(cp1X, cp1Y, end.x, end.y)
```

### 9.4 箭头绘制

支持三种箭头类型：普通箭头（三角形）、圆形、菱形。

```typescript
// 普通箭头：在线段末尾绘制三角形
function drawArrow(ctx, from, to, size) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x)
  const p1 = { x: to.x - size * Math.cos(angle - π/6), y: ... }
  const p2 = { x: to.x - size * Math.cos(angle + π/6), y: ... }
  ctx.beginPath()
  ctx.moveTo(to.x, to.y)
  ctx.lineTo(p1.x, p1.y)
  ctx.lineTo(p2.x, p2.y)
  ctx.closePath()
  ctx.fill()
}
```

### 9.5 连接点（Port）与磁性吸附

每个节点有四个连接点（上下左右）。创建连线时，鼠标靠近目标节点的连接点会触发磁性吸附：

```typescript
// 在 onMouseMove 中
const closestPort = targetNode.getClosestPort(worldPoint)
const snapThreshold = 30 / camera.zoom  // 缩放后阈值不变

const distance = Math.sqrt(dx * dx + dy * dy)
if (distance < snapThreshold) {
  this.edgePreviewEnd = closestPort.point  // 吸附
} else {
  this.edgePreviewEnd = worldPoint         // 不吸附
}
```

---

## 10. 智能路由：A* 寻路算法

**文件：** [utils/PathfindingRouter.ts](packages/graphite/src/utils/PathfindingRouter.ts)

当连线样式为 `orthogonal` 且开启 `useSmartRouting` 时，连线会自动绕开其他节点。

### 10.1 工作流程

1. **建立网格**：把画布分成 20×20 的格子
2. **标记障碍物**：把所有节点占据的格子标记为不可通行
3. **A* 搜索**：从起点格子找到终点格子的最短路径
4. **坐标还原**：把格子路径还原成世界坐标
5. **路径简化**：用共线检测移除多余的中间点

### 10.2 A* 核心逻辑

```typescript
// f = g + h
// g: 从起点到当前点的实际代价（走了多少步）
// h: 从当前点到终点的估计代价（曼哈顿距离）

while (openList.length > 0) {
  // 取 f 值最小的节点（未优化：直接排序；优化版用优先队列）
  openList.sort((a, b) => a.f - b.f)
  const current = openList.shift()!

  if (current.x === end.x && current.y === end.y) {
    return reconstructPath(current)  // 到达终点，回溯路径
  }

  // 检查四个方向的邻居（只走上下左右，不走斜线）
  for (const neighbor of neighbors) {
    if (grid[neighbor.y][neighbor.x]) continue  // 障碍物，跳过
    const g = current.g + 1
    const h = Math.abs(neighbor.x - end.x) + Math.abs(neighbor.y - end.y)
    // 加入 openList...
  }
}
```

---

## 11. 吸附辅助线

**文件：** [utils/SnapGuide.ts](packages/graphite/src/utils/SnapGuide.ts)

拖拽单个节点时，会与其他节点的边缘、中心线对齐吸附。

吸附条件（X 轴举例）：

| 条件 | 吸附目标 |
|------|----------|
| 我的左边 ≈ 其他节点的左边 | 左对齐 |
| 我的右边 ≈ 其他节点的右边 | 右对齐 |
| 我的中心 ≈ 其他节点的中心 | 中心对齐 |
| 我的左边 ≈ 其他节点的右边 | 紧靠（左边紧接右边）|
| 我的右边 ≈ 其他节点的左边 | 紧靠（右边紧接左边）|

还支持**网格吸附**：取最近的网格点：

```typescript
const gridSnapX = Math.round(targetX / gridSize) * gridSize
if (Math.abs(targetX - gridSnapX) < threshold) {
  snapX = gridSnapX
}
```

---

## 12. 自动布局引擎

**文件：** [utils/LayoutEngine.ts](packages/graphite/src/utils/LayoutEngine.ts)

支持 5 种布局算法，一键整理混乱的图：

| 布局 | 适用场景 | 算法 |
|------|----------|------|
| `grid` | 无关系节点 | 按列数排方格 |
| `hierarchical` | 有向流程图 | BFS 分层 + 拓扑排序 |
| `tree` | 树状结构 | DFS 计算子树宽度 |
| `force` | 复杂关系图 | 力导向模拟 |
| `circular` | 星形/环形 | 等角分布在圆上 |

**力导向布局原理（最有趣）：**

每个节点既受到与其他节点的**排斥力**（防止重叠），又受到与有连线节点的**吸引力**（防止分散太远），经过多次迭代模拟后收敛到稳定位置：

```typescript
for (let iter = 0; iter < iterations; iter++) {
  // 排斥力：节点间距离越近，排斥力越大
  const force = repulsion / (dx * dx + dy * dy)

  // 吸引力：连线两端的节点，距离越远，吸引力越大
  const force = (distance - spacing) * attraction

  // 阻尼：随迭代次数增加而减小，让系统"冷却"收敛
  const damping = 1 - iter / iterations * 0.9
}
```

---

## 13. 铅笔工具与路径简化

**文件：** [core/Path.ts](packages/graphite/src/core/Path.ts)

铅笔工具在鼠标移动时持续记录点位，松开鼠标后用 **Douglas-Peucker 算法** 简化路径（去掉不重要的中间点），大幅减少点的数量同时保留形状。

Douglas-Peucker 算法原理：
1. 取起点和终点连一条线
2. 找到距这条线最远的点
3. 如果最远距离 > 阈值：保留该点，递归处理两段子路径
4. 如果最远距离 ≤ 阈值：丢弃所有中间点

```typescript
private douglasPeucker(points: Point[], tolerance: number): Point[] {
  // 找到距起终点连线最远的点
  let maxDistance = 0
  let maxIndex = 0
  for (let i = 1; i < points.length - 1; i++) {
    const distance = this.perpendicularDistance(points[i], start, end)
    if (distance > maxDistance) {
      maxDistance = distance
      maxIndex = i
    }
  }

  if (maxDistance > tolerance) {
    // 递归简化
    const left = this.douglasPeucker(points.slice(0, maxIndex + 1), tolerance)
    const right = this.douglasPeucker(points.slice(maxIndex), tolerance)
    return [...left.slice(0, -1), ...right]
  } else {
    return [start, end]  // 丢弃中间所有点
  }
}
```

---

## 14. 图片节点

**文件：** [core/ImageNode.ts](packages/graphite/src/core/ImageNode.ts)

`ImageNode` 继承自 `Node`，支持拖放图片文件到画布上。

图片加载是异步的，所以需要处理三种状态：

```typescript
draw(ctx) {
  if (!this.imageLoaded && !this.imageError) {
    // 显示"Loading..."
  } else if (this.imageLoaded && this.image) {
    ctx.drawImage(this.image, x, y, this.width, this.height)
  } else if (this.imageError) {
    // 显示错误提示
  }
}
```

拖放处理在 `GraphiteEditor.ts` 的 `onDrop()` 中：使用 `FileReader.readAsDataURL()` 将图片转为 Base64，然后创建 `ImageNode`。

---

## 15. 节点分组

**文件：** [core/Group.ts](packages/graphite/src/core/Group.ts)

分组在视觉上表现为一个带标题栏的矩形框，自动包围所在的子节点。

```typescript
updateBoundsFromNodes(): void {
  // 计算所有子节点的包围盒
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  this.nodes.forEach(node => {
    const bounds = node.getBounds()
    minX = Math.min(minX, bounds.x)
    // ...
  })
  // 加上 padding 和标题栏高度
  this.transform.x = minX - padding
  this.transform.y = minY - padding - titleHeight
  this.width = (maxX - minX) + padding * 2
  this.height = (maxY - minY) + padding * 2 + titleHeight
}
```

分组只在视觉上框住节点，不改变节点的父子关系，节点仍然可以独立移动。

---

## 16. 小地图（Minimap）

**文件：** [ui/Minimap.ts](packages/graphite/src/ui/Minimap.ts)

小地图是一个独立的小 Canvas，显示整个图的缩略图，以及当前视口在图中的位置（红框）。

```typescript
render(nodes, edges, camera, canvasWidth, canvasHeight): void {
  // 以缩放比例 0.1 绘制所有节点和连线

  // 绘制视口框（红框）
  const viewportWidth = canvasWidth / camera.zoom
  const viewportHeight = canvasHeight / camera.zoom
  const viewportX = -camera.x / camera.zoom
  const viewportY = -camera.y / camera.zoom

  ctx.strokeStyle = '#FF6B6B'
  ctx.strokeRect(viewportX, viewportY, viewportWidth, viewportHeight)
}
```

点击小地图时，通过 `CustomEvent` 将世界坐标传给主编辑器，实现导航：

```typescript
private handleClick(e: MouseEvent): void {
  const worldX = (x - this.width / 2) / this.scale
  const worldY = (y - this.height / 2) / this.scale

  this.canvas.dispatchEvent(new CustomEvent('minimapClick', {
    detail: { x: worldX, y: worldY }
  }))
}
```

---

## 17. 主题系统

**文件：** [utils/ThemeManager.ts](packages/graphite/src/utils/ThemeManager.ts)

支持亮色/暗色两套主题，颜色存储在 `themes` 常量中，通过 `localStorage` 持久化用户偏好。

```typescript
const themes = {
  light: {
    background: '#ffffff',
    grid: '#f0f0f0',
    nodeFill: '#ffffff',
    // ...
  },
  dark: {
    background: '#1e1e1e',
    grid: '#2d2d2d',
    nodeFill: '#2d2d2d',
    // ...
  }
}
```

切换主题时，主题颜色被传给 `Renderer`，由它统一应用到背景和网格的绘制中。

---

## 18. 导入导出

**文件：** [GraphiteEditor.ts](packages/graphite/src/GraphiteEditor.ts) 中的 `exportToJSON / importFromJSON / exportToPNG / exportToSVG`

### JSON 格式

```json
{
  "nodes": [
    { "id": "...", "x": 200, "y": 150, "width": 120, "height": 80, "content": "Node 1", "style": {} }
  ],
  "edges": [
    { "id": "...", "from": "nodeId1", "to": "nodeId2", "style": {} }
  ]
}
```

### 导出 PNG

创建一个临时 Canvas，将所有内容画上去，然后调用 `canvas.toDataURL('image/png')` 得到 Base64 图片。

### 导出 SVG

手动拼接 SVG 字符串：
- 每个节点转为 `<rect>` + `<text>`
- 每条连线转为 `<polyline>`
- 箭头转为 `<polygon>`

---

## 19. 事件总线

**文件：** [utils/EventEmitter.ts](packages/graphite/src/utils/EventEmitter.ts)

一个极简的发布订阅实现：

```typescript
class EventEmitter {
  private events: Map<string, EventCallback[]> = new Map()

  on(event: string, callback: EventCallback): void { ... }
  off(event: string, callback: EventCallback): void { ... }
  emit(event: string, ...args: any[]): void { ... }
}
```

`GraphiteEditor` 和 `SelectionManager`、`DragManager` 都继承自 `EventEmitter`，这样外部（如 Vue 组件）可以监听编辑器内部的状态变化：

```typescript
editor.on('selectionChanged', (nodeIds: string[]) => {
  // 更新 UI
})
```

---

## 20. UI 层：Playground（Vue 应用）

**文件：** [apps/playground/src/App.vue](apps/playground/src/App.vue)

Playground 是使用 Graphite 编辑器库的示例应用，展示了如何将库集成到 Vue 中：

```typescript
onMounted(() => {
  editor = new GraphiteEditor(canvasRef.value)  // 传入 canvas 元素

  editor.on('selectionChanged', (selection) => {
    selectedNodes.value = selection  // 响应式更新 UI
  })
})

onUnmounted(() => {
  editor?.destroy()  // 清理事件监听器，防止内存泄漏
})
```

UI 功能清单：
- 添加节点（支持形状选择：矩形/圆形/菱形/三角形）
- 添加连线（支持线型：直线/曲线/折线 + 智能路由开关）
- 铅笔自由绘制
- 撤销/重做
- 自动布局（5 种算法）
- 对齐工具（左/右/上/下/水平居中/垂直居中/水平分布/垂直分布）
- 分组/取消分组
- 导入/导出（JSON/PNG/SVG）
- 主题切换（亮色/暗色）
- 右侧样式面板（选中节点后显示）

---

## 21. 构建一个图形编辑器的完整路径

如果你要从零开始构建一个类似的图形编辑器，建议按以下顺序实现：

### 阶段一：基础渲染（1-2 天）

1. 创建 Canvas，实现 `requestAnimationFrame` 渲染循环
2. 实现 `Camera` 类（平移、以鼠标为中心缩放）
3. 定义 `GraphicObject` 抽象基类（`draw`、`hitTest`、`getBounds`）
4. 实现 `Node` 类（矩形节点，支持文字）
5. 绘制背景网格（注意 `lineWidth = 1 / zoom`）
6. 处理高 DPI 屏幕

### 阶段二：基础交互（2-3 天）

7. 鼠标事件转世界坐标
8. 单击选择节点（`hitTest`）、点击空白取消选择
9. 拖拽移动节点（`DragManager`）
10. 滚轮缩放
11. 空格 + 拖拽平移画布
12. 框选（矩形选框）
13. Delete 键删除节点

### 阶段三：连线（2-3 天）

14. 实现 `Edge` 类（连接两个节点）
15. 节点边缘的连接点（Port），hover 时显示
16. 从连接点拖出连线预览
17. 松手时创建连线，连线随节点移动更新
18. 支持多种线型（直线/曲线/折线）
19. 箭头绘制

### 阶段四：撤销重做（1 天）

20. 实现 `Command` 接口和 `CommandManager`
21. 为创建节点、删除节点、创建连线、移动节点包装命令
22. Ctrl+Z / Ctrl+Shift+Z 快捷键

### 阶段五：进阶功能（3-5 天）

23. 调整节点大小（8 个控制点）
24. 吸附辅助线（节点对齐、网格对齐）
25. 复制/粘贴/剪切
26. 右键菜单
27. 双击编辑文字
28. 层级管理（置顶/置底）
29. 小地图
30. 导入/导出 JSON、PNG、SVG

### 阶段六：高级算法（2-3 天）

31. A* 智能路由（连线绕开节点）
32. 自动布局（层次布局、力导向布局等）
33. 铅笔自由绘制 + Douglas-Peucker 路径简化
34. 图片节点（拖放图片文件）
35. 节点分组

### 常见坑和注意事项

- **坐标系**：始终区分屏幕坐标和世界坐标，每次鼠标事件都要先转换
- **渲染顺序**：后画的在上层，确保连线在节点下方，控制点在节点上方
- **DPI**：忘记处理高 DPI 会导致画面模糊
- **状态卡死**：`mouseup` 事件要同时监听 `window`（不只是 canvas），否则拖到 canvas 外松手会卡住
- **内存泄漏**：销毁时要移除所有事件监听器，特别是加在 `window` 上的
- **连线更新**：节点移动时要立即重新计算所有相关连线的路径
- **撤销边界**：拖拽结束才记录移动命令，否则 undo 会双倍还原

---

> 本文档基于 `packages/graphite` 源码整理，版本日期：2026-04-19。
