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
18. [自定义节点系统](#18-自定义节点系统)
19. [导入导出](#19-导入导出)
20. [事件总线](#20-事件总线)
21. [可拖动折点（Waypoint）](#21-可拖动折点waypoint)
22. [可配置连接点（Port）](#22-可配置连接点port)
23. [样式系统增强](#23-样式系统增强)
24. [连接规则校验（ConnectionValidator）](#24-连接规则校验connectionvalidator)
25. [事务机制（Transaction）](#25-事务机制transaction)
26. [序列化完整化（JSON v2）](#26-序列化完整化json-v2)
27. [UI 层：Playground（Vue 应用）](#27-ui-层playground-vue-应用)
28. [构建一个图形编辑器的完整路径](#28-构建一个图形编辑器的完整路径)

---

## 1. 整体架构概览

```
packages/graphite/src/
├── GraphiteEditor.ts           # 编辑器总入口（门面/Facade）
├── core/                       # 核心数据模型
│   ├── GraphicObject.ts        # 所有图形对象的抽象基类
│   ├── Node.ts                 # 普通节点
│   ├── CustomNode.ts           # 自定义节点（响应式数据）
│   ├── NodeRegistry.ts         # 节点类型注册表
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
│   ├── ConnectionValidator.ts  # 连接规则校验
│   ├── Animator.ts             # 动画工具
│   └── geometry.ts             # 几何工具函数
└── types/index.ts              # TypeScript 类型定义（含 PortDefinition, DashPreset）
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

### 4.3 DirtyRectManager（脏区域管理）

**文件：** [renderer/DirtyRectManager.ts](packages/graphite/src/renderer/DirtyRectManager.ts)

脏区域（Dirty Rect）是渲染性能优化的核心技术：只重绘内容发生变化的屏幕区域，跳过未变化的部分。

**问题背景：**

画布如果每帧全部清除并重绘，代价很高。例如 2000×1500 的画布上只移动了一个小节点，实际上只有那个节点占据的区域需要重绘。

**接口设计：**

```typescript
class DirtyRectManager {
  markDirty(rect: Rect): void      // 标记屏幕坐标区域为脏（已过 camera 转换）
  markAllDirty(w, h): void         // 标记整个画布为脏（全量重绘）
  needsFullRedraw(): boolean       // 是否需要全量重绘
  getDirtyRegions(padding): Rect[] // 获取合并后的脏区域（含 padding 防边缘裁切）
  clear(): void                    // 清空，等待下一帧
}
```

**Renderer 中的集成：**

`markDirty()` 接受可选的**世界坐标**包围盒：
- 不传 → `markAllDirty()`，下一帧全量重绘
- 传入 `worldRect` → 转换为屏幕坐标（含 DPR 缩放），写入 `DirtyRectManager`

```typescript
markDirty(worldRect?: Rect): void {
  if (!worldRect) {
    this.dirtyRectManager.markAllDirty(this.canvas.width, this.canvas.height)
    return
  }
  const dpr = window.devicePixelRatio || 1
  const topLeft = this.camera.worldToScreen({ x: worldRect.x, y: worldRect.y })
  const bottomRight = this.camera.worldToScreen({
    x: worldRect.x + worldRect.width,
    y: worldRect.y + worldRect.height,
  })
  this.dirtyRectManager.markDirty({
    x: topLeft.x * dpr,
    y: topLeft.y * dpr,
    width: (bottomRight.x - topLeft.x) * dpr,
    height: (bottomRight.y - topLeft.y) * dpr,
  })
}
```

`render()` 根据是否需要全量重绘走��同分支：

```typescript
render(nodes, edges, selectedNodeIds): void {
  if (!this.needsRender) return

  if (this.dirtyRectManager.needsFullRedraw()) {
    // 全量：清除整个画布，重绘所有内容
    this.ctx.fillRect(0, 0, canvas.width, canvas.height)
    // ... 绘制所有内容
  } else {
    const dirty = this.dirtyRectManager.getDirtyRegions()[0]

    // 局部：clip 到脏区域，只清除并重绘该矩形
    this.ctx.save()
    this.ctx.beginPath()
    this.ctx.rect(dirty.x, dirty.y, dirty.width, dirty.height)
    this.ctx.clip()  // 后续所有绘制都被限制在 dirty 范围内

    this.ctx.fillStyle = this.themeColors.background
    this.ctx.fillRect(dirty.x, dirty.y, dirty.width, dirty.height)
    this.drawBackground()
    this.camera.applyTransform(this.ctx)
    // ... 重绘所有图形（clip 保证超出范围的像素不被写入）
    this.ctx.restore()
  }

  this.dirtyRectManager.clear()
}
```

**GraphiteEditor 中的集成：**

`markDirtyForObjects()` 是私有辅助方法，计算一组节点和边的合并包围盒（世界坐标），再调用 `renderer.markDirty(worldRect)`：

```typescript
private markDirtyForObjects(nodes: Node[], edges: Edge[] = []): void {
  // 遍历所有对象，计算 minX/minY/maxX/maxY
  nodes.forEach(n => expand(n.getBounds()))
  edges.forEach(e => { if (e.points.length >= 2) expand(e.getBounds()) })

  const pad = 20  // 世界坐标 padding，防止阴影/边框被裁切
  this.renderer.markDirty({ x: minX - pad, y: minY - pad,
    width: maxX - minX + pad * 2, height: maxY - minY + pad * 2 })
}
```

**哪些操作走局部重绘，哪些走全量：**

| 操作 | 重绘策略 | 原因 |
|------|----------|------|
| 创建/更新单个节点或边 | 局部 | 影响范围明确 |
| 拖拽节点（含关联边） | 局部 | 只有被拖节点区域变化 |
| 调整节点大小（含关联边） | 局部 | 同上 |
| 更新节点/边样式 | 局部 | 影响范围明确 |
| 相机平移/缩放 | 全量 | 整个视口内容都变了 |
| 框选、hover、撤销/重做 | 全量 | 影响范围不确定 |
| 主题切换、尺寸调整 | 全量 | 全局样式变化 |

**`ctx.clip()` 的工作原理：**

`clip()` 会把当前路径设为裁切区域，此后所有绘制操作（包括 `fillRect`、`stroke`、`drawImage` 等）只有落在裁切区域内的像素才会被写入 Canvas。配合 `ctx.save()` / `ctx.restore()` 可以在局部重绘后恢复到无裁切状态。

```
全量重绘：清除整个 2000×1500 = 300万像素
局部重绘：clip 到 200×100 的脏矩形 = 2万像素（性能提升 15×）
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

## 18. 自定义节点系统

**文件：** [core/CustomNode.ts](packages/graphite/src/core/CustomNode.ts)，[core/NodeRegistry.ts](packages/graphite/src/core/NodeRegistry.ts)

自定义节点系统允许开发者注册带有自定义渲染逻辑和响应式数据的节点类型，无需修改核心代码即可扩展编辑器功能。

### 18.1 CustomNode：响应式数据节点

`CustomNode` 继承自 `Node`，核心特性是**响应式数据**：

```typescript
class CustomNode extends Node {
  nodeType: string
  data: Record<string, any>  // 响应式数据（Proxy 包装）
  private renderFunction: CustomRenderFunction | null
  
  constructor(nodeData: CustomNodeData, renderFn?: CustomRenderFunction) {
    super(nodeData)
    this.nodeType = nodeData.nodeType || 'custom'
    this.data = this.createReactiveData(nodeData.data || {})
    this.renderFunction = renderFn || null
  }
}
```

**响应式数据实现：**

使用 `Proxy` 拦截数据变化，自动触发重绘：

```typescript
private createReactiveData(data: Record<string, any>): Record<string, any> {
  const self = this
  return new Proxy(data, {
    set(target, property, value) {
      const oldValue = target[property as string]
      if (oldValue !== value) {
        target[property as string] = value
        // 触发数据变化回调
        self.dataChangeCallbacks.forEach(callback => {
          callback({ property, value, oldValue })
        })
        // 触发重绘
        self.emitNeedsRedraw()
      }
      return true
    }
  })
}
```

这意味着：`node.data.value = 80` 会自动触发 canvas 重绘，无需手动调用 `markDirty()`。

### 18.2 NodeRegistry：节点类型注册表

`NodeRegistry` 是单例模式，管理所有自定义节点类型的定义：

```typescript
interface NodeTypeDefinition {
  name: string                      // 节点类型标识符
  label: string                     // 侧边栏显示名称
  description?: string              // 可选的 tooltip 描述
  render: CustomRenderFunction      // 渲染函数
  preview?: CustomRenderFunction    // 可选的简化预览渲染（用于生成缩略图）
  defaultData?: Record<string, any> // 默认数据
  defaultSize?: { width: number; height: number }
  editable?: EditableConfig         // 文本编辑配置
}

const registry = NodeRegistry.getInstance()
registry.register({
  name: 'progress',
  label: '进度条',
  defaultSize: { width: 200, height: 60 },
  defaultData: { label: '进度', value: 60, max: 100 },
  render: ({ ctx, bounds, data }) => {
    // 自定义渲染逻辑
  }
})
```

### 18.3 自定义渲染函数

渲染函数接收一个 `RenderContext` 对象：

```typescript
interface RenderContext {
  ctx: CanvasRenderingContext2D
  bounds: { x: number; y: number; width: number; height: number }
  data: Record<string, any>
  isSelected: boolean
}
```

**关键点：** `bounds` 是**本地坐标系**，原点在节点左上角（不是中心）。这与 `Node.draw()` 中的中心坐标系不同，是为了让自定义渲染更直观：

```typescript
render: ({ ctx, bounds, data }) => {
  const { label, value, max } = data
  
  // 背景（从左上角开始）
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height)
  
  // 进度条（相对于 bounds 定位）
  const barY = bounds.y + 15 + 20
  const barWidth = bounds.width - 30
  const progress = value / max
  ctx.fillRect(bounds.x + 15, barY, barWidth * progress, 20)
}
```

### 18.4 文本编辑配置

`EditableConfig` 定义哪个数据字段可编辑，以及编辑框的位置和样式：

```typescript
interface EditableConfig {
  enabled: boolean
  field: string           // 要编辑的数据字段名（如 'label'）
  multiline?: boolean     // 是否支持多行
  offsetX?: number        // 输入框 x 偏移（像素，相对于节点左上角）
  offsetY?: number        // 输入框 y 偏移
  width?: number          // 输入框宽度
  height?: number         // 输入框高度
  fontSize?: number       // 字号（必须与 canvas 渲染一致）
  fontWeight?: string     // 字重（必须与 canvas 渲染一致）
  textAlign?: string      // 对齐方式（'left' | 'center' | 'right'）
}
```

**为什么 `fontSize`、`fontWeight`、`textAlign` 必须与 canvas 一致？**

双击节点时，会创建一个**透明的 textarea 覆盖层**，只显示光标，文字由 canvas 实时渲染。如果 textarea 的字体样式与 canvas 不匹配，光标位置会错位。

**文本编辑实现原理：**

```typescript
// 创建透明 textarea
textarea.style.cssText = `
  position: fixed;
  background: transparent;
  border: none;
  color: transparent;        // 文字透明
  caret-color: #333;         // 光标可见
  font-size: ${fontSize}px;
  font-weight: ${fontWeight};
  text-align: ${textAlign};
`

// 实时更新数据（触发 Proxy → 重绘）
textarea.addEventListener('input', () => {
  node.data[field] = textarea.value
})
```

### 18.5 预览缩略图生成

`NodeRegistry.generatePreview()` 用节点的 `render` 函数渲染一张缩略图，用于侧边栏展示：

```typescript
static generatePreview(
  definition: NodeTypeDefinition,
  size: { width: number; height: number } = { width: 80, height: 60 }
): string {
  const canvas = document.createElement('canvas')
  const dpr = window.devicePixelRatio || 1
  canvas.width = size.width * dpr
  canvas.height = size.height * dpr
  
  const ctx = canvas.getContext('2d')!
  ctx.scale(dpr, dpr)
  
  // 等比缩放节点到缩略图尺寸
  const nodeWidth = definition.defaultSize?.width || 120
  const nodeHeight = definition.defaultSize?.height || 80
  const scale = Math.min(
    (size.width - 8) / nodeWidth,
    (size.height - 8) / nodeHeight
  )
  
  ctx.save()
  ctx.translate(offsetX, offsetY)
  ctx.scale(scale, scale)
  
  // 使用 preview 或 render 函数绘制
  const renderFn = definition.preview ?? definition.render
  renderFn({
    ctx,
    bounds: { x: 0, y: 0, width: nodeWidth, height: nodeHeight },
    data: definition.defaultData ?? {},
    isSelected: false,
  })
  
  ctx.restore()
  return canvas.toDataURL()
}
```

**为什么需要 `preview` 函数？**

某些节点在小尺寸下细节太密（如仪表盘的刻度线），可以提供一个简化版的 `preview` 函数，只画主要元素。如果不提供，默认使用 `render` 函数。

### 18.6 内置节点类型

Graphite 内置了 8 种富节点类型，展示了自定义节点系统的能力：

| 节点类型 | 用途 | 可编辑字段 |
|---------|------|-----------|
| `table` | 数据表格 | 不可编辑 |
| `progress` | 进度条 | `label` |
| `card` | 渐变卡片 | `title` |
| `gauge` | 仪表盘 | `label` |
| `user-card` | 用户卡片 | `name` |
| `image-card` | 图片卡片 | `title` |
| `timeline` | 时间轴 | `title` |
| `stat-card` | 统计卡片 | `label` |

**示例：仪表盘节点**

```typescript
registry.register({
  name: 'gauge',
  label: '仪表盘',
  defaultSize: { width: 180, height: 180 },
  defaultData: {
    label: '速度',
    value: 65,
    max: 100,
    unit: 'km/h'
  },
  editable: {
    enabled: true,
    field: 'label',
    offsetX: 0,
    offsetY: 153,
    width: 180,
    height: 18,
    fontSize: 13,
    fontWeight: 'normal',
    textAlign: 'center'  // 居中对齐
  },
  render: ({ ctx, bounds, data }) => {
    const { label, value, max, unit } = data
    const centerX = bounds.x + bounds.width / 2
    const centerY = bounds.y + bounds.height / 2 + 20
    const radius = Math.min(bounds.width, bounds.height) / 2 - 30
    
    // 绘制刻度背景弧
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, startAngle, endAngle)
    ctx.strokeStyle = '#f0f0f0'
    ctx.lineWidth = 20
    ctx.stroke()
    
    // 绘制进度弧（渐变色）
    const progress = value / max
    const currentAngle = startAngle + (endAngle - startAngle) * progress
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, startAngle, currentAngle)
    const gradient = ctx.createLinearGradient(...)
    ctx.strokeStyle = gradient
    ctx.stroke()
    
    // 绘制指针、数值、标签...
  }
})
```

### 18.7 动态侧边栏

Playground 的侧边栏不再硬编码节点列表，而是动态从 `NodeRegistry` 读取：

```typescript
// App.vue
const customNodeTypes = ref<Array<NodeTypeDefinition & { previewUrl: string }>>([])

function loadCustomNodeTypes() {
  const types = NodeRegistry.getInstance().getAll()
  customNodeTypes.value = types.map((def: NodeTypeDefinition) => ({
    ...def,
    previewUrl: NodeRegistry.generatePreview(def, { width: 80, height: 60 }),
  }))
}

onMounted(() => {
  editor = new GraphiteEditor(canvasRef.value)
  loadCustomNodeTypes()  // 加载节点类型和缩略图
})
```

模板中使用 `v-for` 渲染：

```vue
<div v-for="nodeType in customNodeTypes" :key="nodeType.name">
  <img :src="nodeType.previewUrl" width="40" height="40" />
  <span>{{ nodeType.label }}</span>
</div>
```

这样，注册新节点类型后，侧边栏会自动出现对应的缩略图和名称，无需手动维护 UI。

### 18.8 使用自定义节点

```typescript
// 创建自定义节点
const progressNode = editor.createCustomNode({
  x: 200,
  y: 200,
  nodeType: 'progress'  // 不需要传 width/height，使用 defaultSize
})

// 更新节点数据（自动触发重绘）
editor.updateCustomNodeData(progressNode.id, { value: 80 })

// 双击节点可编辑 label 字段
```

### 18.9 设计要点

**为什么用 Proxy 而不是 Vue 的 reactive？**

`CustomNode` 是纯 TypeScript 类，不依赖任何框架。使用原生 `Proxy` 保持库的框架无关性。

**为什么 `bounds` 用本地坐标而不是中心坐标？**

中心坐标（`x: -width/2, y: -height/2`）对数学变换友好，但对 UI 绘制不直观。自定义节点的渲染函数通常由非图形专业的开发者编写，左上角坐标系更符合直觉。

**为什么 `editable.offsetY` 需要手动计算？**

因为 canvas 的 `textBaseline` 有多种模式（`'top'`、`'middle'`、`'alphabetic'`），不同模式下文字的视觉位置不同。`offsetY` 必须精确匹配 canvas 渲染的文字顶部位置，才能让 textarea 光标对齐。

**为什么不直接用 `contenteditable` div？**

`contenteditable` 的样式控制复杂，且在不同浏览器下行为不一致。`textarea` 更可控，配合透明样式 + canvas 实时渲染，体验更好。

---

## 19. 导入导出

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

## 20. 事件总线

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

## 21. 可拖动折点（Waypoint）

**文件：** [core/Edge.ts](packages/graphite/src/core/Edge.ts) · [interaction/Commands.ts](packages/graphite/src/interaction/Commands.ts)

折点（Waypoint）是用户手动设置的中间控制点，使连线可以按自定义路径弯折。

### 21.1 数据结构

```typescript
class Edge {
  points: Point[]      // 渲染用的最终路径（自动计算）
  waypoints: Point[]   // 用户定义的中间点（手动）
}
```

`updatePath()` 中的逻辑：
```typescript
if (this.waypoints.length > 0) {
  this.points = [start, ...this.waypoints, end]  // 直接使用手动点
  return
}
// 否则走自动路由（正交/智能路由）
```

### 21.2 初始化-on-首次拖拽模式

当用户第一次拖拽一条没有手动折点的边时，不需要预先设置 waypoints。代码从 `edge.points`（自动计算的路径）取出内部点，赋值给 `edge.waypoints`：

```typescript
if (edge.waypoints.length === 0 && edge.points.length > 2) {
  edge.waypoints = edge.points.slice(1, -1).map(p => ({ ...p }))
}
```

这样用户可以直接开始拖拽，系统将自动计算的折点"固化"为手动折点。

### 21.3 MoveWaypointCommand

```typescript
class MoveWaypointCommand implements ICommand {
  execute() { this.edge.waypoints[this.index] = { ...this.newPoint } }
  undo()    { this.edge.waypoints[this.index] = { ...this.oldPoint } }
}
```

### 21.4 视觉反馈

选中连线后，在每个 waypoint 位置绘制菱形控制柄（`drawSelection()` 中处理），用户可以直接拖拽。

---

## 22. 可配置连接点（Port）

**文件：** [core/Node.ts](packages/graphite/src/core/Node.ts) · [types/index.ts](packages/graphite/src/types/index.ts)

默认每个节点有上/右/下/左 4 个固定端口。通过 `PortDefinition` 可以任意自定义。

### 22.1 PortDefinition 接口

```typescript
interface PortDefinition {
  id: string               // 唯一标识符
  dx: number               // 归一化 X 偏移：-0.5 = 左边缘，+0.5 = 右边缘
  dy: number               // 归一化 Y 偏移：-0.5 = 上边缘，+0.5 = 下边缘
  type?: 'input' | 'output' | 'both'
  label?: string
}
```

> **归一化坐标的好处**：端口位置与节点尺寸无关。节点缩放后端口依然在正确位置，不需要重新计算。

### 22.2 世界坐标计算

```typescript
getPortPosition(id: string): Point {
  const port = this.ports.find(p => p.id === id)
  return {
    x: center.x + port.dx * this.width,
    y: center.y + port.dy * this.height,
  }
}
```

### 22.3 端口类型着色

```
input  → 绿色  （只能作为连线终点）
output → 橙色  （只能作为连线起点）
both   → 蓝色  （两者皆可，默认）
```

---

## 23. 样式系统增强

**文件：** [core/Node.ts](packages/graphite/src/core/Node.ts) · [core/Edge.ts](packages/graphite/src/core/Edge.ts) · [types/index.ts](packages/graphite/src/types/index.ts)

### 23.1 节点：fontFamily

```typescript
ctx.font = `${style.fontSize}px ${style.fontFamily}`
```

允许为每个节点设置不同的字体，例如代码节点用等宽字体、标题节点用衬线字体。

### 23.2 节点：strokeGradient（渐变边框）

```typescript
if (style.strokeGradient) {
  const [c1, c2] = style.strokeGradient
  const grad = ctx.createLinearGradient(-w/2, 0, w/2, 0)
  grad.addColorStop(0, c1)
  grad.addColorStop(1, c2)
  ctx.strokeStyle = grad
}
```

Canvas 2D 支持将渐变对象赋给 `strokeStyle`，这是一个常被忽略的特性。

### 23.3 连线：dashPreset

```typescript
const DASH_PRESETS = {
  'solid':     [],
  'dashed':    [8, 4],
  'dotted':    [2, 4],
  'long-dash': [16, 6],
  'dot-dash':  [8, 4, 2, 4],
}

ctx.setLineDash(DASH_PRESETS[style.dashPreset] ?? [])
```

命名预设比让用户手写 `strokeDasharray` 字符串更不易出错，且便于枚举。

---

## 24. 连接规则校验（ConnectionValidator）

**文件：** [utils/ConnectionValidator.ts](packages/graphite/src/utils/ConnectionValidator.ts)

### 24.1 设计动机

在 mxGraph 等成熟编辑器中，连线创建前会经过规则校验（例如：不允许自连、不允许超出连接数限制、端口类型必须匹配）。这类逻辑应该从编辑器核心中解耦出来，由外部配置。

### 24.2 规则签名

```typescript
type ConnectionRule = (
  fromNode: Node,
  toNode: Node,
  fromPortId: string,
  toPortId: string,
  existingEdges: Edge[]
) => true | false | string  // true = 允许，其他 = 拒绝（string 为原因）
```

### 24.3 使用方式

```typescript
const validator = new ConnectionValidator()
  .addRule('no-self-loop', ConnectionValidator.noSelfLoop)
  .addRule('max-degree',   (from, _to, _fp, _tp, edges) => {
    const out = edges.filter(e => e.fromNodeId === from.id).length
    return out < 5 ? true : '最多 5 条出边'
  })

editor.setConnectionValidator(validator)
editor.on('connectionRejected', ({ reason }) => showToast(reason))
```

### 24.4 双重校验点

- **`createEdge()` API**：校验失败时 throw Error，防止程序化创建非法连线
- **UI 拖拽路径**：校验失败时 emit `connectionRejected` 事件，不 throw，UI 可以显示提示

---

## 25. 事务机制（Transaction）

**文件：** [interaction/CommandManager.ts](packages/graphite/src/interaction/CommandManager.ts)

### 25.1 问题

默认情况下，`paste()` 粘贴 5 个节点 + 3 条边，需要按 8 次 Ctrl+Z 才能完全撤销。这不是用户期望的行为。

### 25.2 CompoundCommand

```typescript
class CompoundCommand implements ICommand {
  constructor(private commands: ICommand[], readonly label: string) {}
  execute() { this.commands.forEach(c => c.execute()) }
  undo()    { [...this.commands].reverse().forEach(c => c.undo()) }
}
```

多条命令捆绑为一条历史记录。注意 `undo()` 要**逆序**执行，确保正确撤销依赖关系。

### 25.3 事务 API

```typescript
// CommandManager 内部
private transactionDepth = 0
private pendingCommands: ICommand[] = []

beginTransaction() { this.transactionDepth++ }
commitTransaction() {
  if (--this.transactionDepth === 0) {
    const compound = new CompoundCommand(this.pendingCommands, label)
    this._addToHistory(compound)
    this.pendingCommands = []
  }
}

execute(cmd: ICommand) {
  cmd.execute()
  if (this.transactionDepth > 0) {
    this.pendingCommands.push(cmd)  // 事务中：暂存
  } else {
    this._addToHistory(cmd)          // 普通：直接入栈
  }
}
```

支持嵌套事务（`transactionDepth` 计数器），只有最外层 `commitTransaction` 才写入历史。

---

## 26. 序列化完整化（JSON v2）

**文件：** [GraphiteEditor.ts](packages/graphite/src/GraphiteEditor.ts)

### 26.1 问题

早期版本只序列化普通 `Node`，`CustomNode`（nodeType/data）、`ImageNode`（imageData）、折点（waypoints）、端口（ports）等都丢失了，reload 后画面面目全非。

### 26.2 exportToJSON 结构（v2）

```typescript
{
  version: 2,
  nodes: [{
    id, x, y, width, height, content, shape,
    style,           // 含 fontFamily, strokeGradient
    ports,           // PortDefinition[]
    nodeType,        // CustomNode 专有
    data,            // CustomNode 专有（Proxy 解包为普通对象）
    imageData,       // ImageNode 专有（base64 data URL）
  }],
  edges: [{
    id, from, to,
    style,           // 含 dashPreset
    waypoints,       // Point[]
    label,
  }]
}
```

### 26.3 importFromJSON 路由

```typescript
if (nodeData.imageData) {
  node = this.createImageNode(nodeData)      // ImageNode
} else if (nodeData.nodeType) {
  node = this.createCustomNode(nodeData)     // CustomNode
} else {
  node = this.createNode(nodeData)           // 普通 Node
}
node.id = nodeData.id  // 恢复原始 id（createXxx 会生成新 id）
```

---

## 27. UI 层：Playground（Vue 应用）

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
- 添加自定义节点（8 种内置富节点类型，动态侧边栏）
- 添加连线（支持线型：直线/曲线/折线 + 智能路由开关）
- 双击编辑文本（透明 textarea + canvas 实时渲染）
- 铅笔自由绘制
- 撤销/重做
- 自动布局（5 种算法）
- 对齐工具（左/右/上/下/水平居中/垂直居中/水平分布/垂直分布）
- 分组/取消分组
- 导入/导出（JSON/PNG/SVG）
- 主题切换（亮色/暗色）
- 右侧样式面板（选中节点后显示）

---

## 28. 构建一个图形编辑器的完整路径

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

### 阶段七：自定义节点系统（2-3 天）

36. 实现 `CustomNode` 类（响应式数据 Proxy）
37. 实现 `NodeRegistry` 单例（注册、查询节点类型）
38. 自定义渲染函数接口（`RenderContext`）
39. 文本编辑配置（`EditableConfig`）
40. 透明 textarea 覆盖层 + 实时 canvas 渲染
41. 预览缩略图生成（offscreen canvas）
42. 动态侧边栏（从 registry 读取并渲染）
43. 内置富节点类型（表格、进度条、仪表盘等）

### 阶段八：工程化增强（2-3 天）

44. `CompoundCommand` + `beginTransaction/commitTransaction`（批量原子撤销）
45. `PortDefinition`（归一化坐标的可配置连接点）
46. `ConnectionValidator`（命名规则注册表 + 内置规则）
47. 样式系统增强（fontFamily、strokeGradient、dashPreset）
48. JSON v2 序列化（保存/恢复 shape、ports、nodeType、data、imageData、waypoints）

### 常见坑和注意事项

- **坐标系**：始终区分屏幕坐标和世界坐标，每次鼠标事件都要先转换
- **渲染顺序**：后画的在上层，确保连线在节点下方，控制点在节点上方
- **DPI**：忘记处理高 DPI 会导致画面模糊
- **状态卡死**：`mouseup` 事件要同时监听 `window`（不只是 canvas），否则拖到 canvas 外松手会卡住
- **内存泄漏**：销毁时要移除所有事件监听器，特别是加在 `window` 上的
- **连线更新**：节点移动时要立即重新计算所有相关连线的路径
- **撤销边界**：拖拽结束才记录移动命令，否则 undo 会双倍还原
- **文本编辑光标对齐**：textarea 的 `fontSize`、`fontWeight`、`textAlign` 必须与 canvas 渲染完全一致
- **自定义节点坐标系**：render 函数的 `bounds` 是本地坐标（左上角为原点），不是中心坐标
- **响应式数据**：使用 Proxy 拦截 `data` 变化，自动触发重绘，避免手动 `markDirty()`
- **可拖动折点**：首次拖拽时才将自动路径复制为手动 waypoints（initialize-on-first-drag 模式）
- **端口归一化坐标**：`dx/dy` 范围 ±0.5，节点缩放后端口自动跟随，无需重新计算像素位置
- **渐变边框**：Canvas 的 `strokeStyle` 可以接受 `CanvasGradient` 对象，不只是颜色字符串
- **事务嵌套**：`transactionDepth` 计数器保证只有最外层 commit 才写入历史，内层 commit 只是计数

---

> 本文档基于 `packages/graphite` 源码整理，版本日期：2026-04-19。
