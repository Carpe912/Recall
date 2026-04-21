# Graphite 图形编辑器 - 功能完成清单

## 项目概览

Graphite 是一个基于 Canvas 的协作式图形编辑器，专为知识管理打造。

**项目地址：** `/Users/coopwire-test/remote-project/Recall`

---

## 已完成功能

### ✅ 核心架构

- [x] 基础类型和接口（Point, Rect, Transform, PortDefinition, DashPreset…）
- [x] GraphicObject 基类（场景图）
- [x] EventEmitter 事件系统
- [x] 坐标转换系统（屏幕 ↔ 世界坐标）

### ✅ 核心对象

- [x] Node（矩形/圆形/菱形/三角形，可配置端口）
- [x] Edge（直线/曲线/正交，waypoints 支持）
- [x] CustomNode（响应式数据 + 自定义渲染）
- [x] NodeRegistry（节点类型注册表）
- [x] Group（视觉分组）
- [x] Path（自由绘制路径）
- [x] ImageNode（图片节点）

### ✅ 渲染系统

- [x] Renderer 渲染器（requestAnimationFrame）
- [x] Camera 视口管理（缩放、平移）
- [x] 脏矩形优化
- [x] 高 DPI 屏幕支持

### ✅ 交互系统

- [x] SelectionManager：单选、多选（Ctrl/Cmd）、框选
- [x] DragManager：节点拖拽、多节点拖拽
- [x] 折点拖拽（Waypoint drag）：选中连线后拖拽菱形控制柄
- [x] 调整大小（8 个控制点）
- [x] 画布平移（空格 + 拖拽 / 鼠标中键）
- [x] 画布缩放（鼠标滚轮）

### ✅ 命令系统（Command Pattern）

- [x] CommandManager：撤销/重做栈
- [x] CompoundCommand：多命令捆绑为一条历史记录
- [x] 事务 API：`beginTransaction / commitTransaction / rollbackTransaction`
- [x] MoveCommand / CreateNodeCommand / DeleteNodeCommand
- [x] CreateEdgeCommand / DeleteEdgeCommand
- [x] MoveWaypointCommand

### ✅ 连接系统

- [x] 可配置端口（PortDefinition：id / dx / dy / type / label）
- [x] 默认 4 端口（top / right / bottom / left）
- [x] 端口类型着色（input=绿、output=橙、both=蓝）
- [x] 磁性吸附（30px 阈值）
- [x] ConnectionValidator：命名规则注册表
  - 内置：noSelfLoop / noDuplicateEdge / portTypeCompatibility
  - `createDefaultValidator()` 工厂函数
  - 校验失败 emit `connectionRejected` 事件
- [x] A\* 智能路由（绕开障碍节点）

### ✅ 样式系统

- [x] 节点：fill / stroke / strokeWidth / borderRadius / opacity / shadow
- [x] 节点：**fontFamily**（可配置字体族）
- [x] 节点：**strokeGradient** [color1, color2]（水平线性渐变边框）
- [x] 连线：**dashPreset**（solid / dashed / dotted / long-dash / dot-dash）
- [x] 连线：arrowType（arrow / circle / diamond / none）

### ✅ 序列化（JSON v2）

- [x] exportToJSON：保存 shape / style / ports / nodeType / data / imageData / waypoints / label
- [x] importFromJSON：按类型路由恢复（ImageNode / CustomNode / Node）
- [x] exportToPNG / exportToSVG

### ✅ 布局与工具

- [x] 5 种自动布局（层次/树形/力导向/环形/网格）
- [x] 对齐（左/右/上/下/水平居中/垂直居中）
- [x] 分布（水平/垂直）
- [x] 吸附辅助线
- [x] 铅笔工具（Douglas-Peucker 路径简化）
- [x] 图片拖放
- [x] 节点分组
- [x] 小地图导航
- [x] 主题切换（亮色/暗色，localStorage 持久化）
- [x] 右键菜单（上下文相关）
- [x] 剪贴板（复制/剪切/粘贴，保留边关系）

---

## 项目结构

```
Recall/
├── packages/
│   └── graphite/                    # 图形编辑器核心库
│       ├── src/
│       │   ├── types/index.ts       # 所有类型定义
│       │   ├── core/                # 核心对象
│       │   ├── renderer/            # 渲染系统
│       │   ├── interaction/         # 交互 + 命令系统
│       │   ├── ui/                  # ContextMenu, Minimap
│       │   ├── utils/               # 布局、路由、校验、主题…
│       │   ├── collaboration/       # Yjs 协作（接口存根）
│       │   ├── GraphiteEditor.ts    # 门面 API
│       │   └── index.ts             # 公共导出
│       ├── README.md
│       └── CUSTOM_NODES.md
├── apps/
│   └── playground/                  # Vue 3 开发测试环境
├── README.md
├── IMPLEMENTATION.md
├── DEVELOPMENT_SUMMARY.md
├── LEARNING_GUIDE.md
└── COMPLETED.md
```

---

## 快速上手

```bash
pnpm install
pnpm --filter playground dev    # http://localhost:3000/
pnpm --filter graphite build
```

### 基本用法

```typescript
import { GraphiteEditor, createDefaultValidator } from "@recall/graphite";

const editor = new GraphiteEditor(canvas);

// 连接规则
editor.setConnectionValidator(createDefaultValidator());

// 创建节点
const a = editor.createNode({
  x: 100,
  y: 100,
  width: 120,
  height: 60,
  content: "A",
});
const b = editor.createNode({
  x: 300,
  y: 100,
  width: 120,
  height: 60,
  content: "B",
});

// 自定义端口
editor.setNodePorts(a.id, [{ id: "out", dx: 0.5, dy: 0, type: "output" }]);
editor.setNodePorts(b.id, [{ id: "in", dx: -0.5, dy: 0, type: "input" }]);

// 创建连线
editor.createEdge({ from: a.id, to: b.id, fromPort: "out", toPort: "in" });

// 样式
editor.updateNodeStyle(a.id, {
  fontFamily: "Georgia, serif",
  strokeGradient: ["#667eea", "#764ba2"],
});
editor.updateEdgeStyle(edge.id, { dashPreset: "dashed" });

// 事务
editor.beginTransaction("bulk");
// ... 多步操作 ...
editor.commitTransaction(); // 一次 Ctrl+Z 全部撤销

// 序列化
const json = editor.exportToJSON();
editor.importFromJSON(json);
```

### 键盘快捷键

| 快捷键                 | 功能     |
| ---------------------- | -------- |
| `Ctrl/Cmd + Z`         | 撤销     |
| `Ctrl/Cmd + Shift + Z` | 重做     |
| `Ctrl/Cmd + C`         | 复制     |
| `Ctrl/Cmd + X`         | 剪切     |
| `Ctrl/Cmd + V`         | 粘贴     |
| `Delete / Backspace`   | 删除选中 |
| `Space + 拖拽`         | 平移画布 |

<!-- 屏幕坐标，世界坐标，本地坐标 之间都是什么，又怎样的联系？ -->

### 坐标系统详解

在 Graphite 编辑器中，存在三种坐标系统：

#### 1. 屏幕坐标（Screen Coordinates）
- **定义**：相对于 Canvas 元素左上角的像素坐标
- **获取方式**：`getMousePosition(e)` 返回 `{ x: e.clientX - rect.left, y: e.clientY - rect.top }`
- **特点**：
  - 原点在 Canvas 元素的左上角
  - 单位是屏幕像素
  - 会随着画布的缩放和平移而改变（同一个世界坐标点在不同视口状态下的屏幕坐标不同）
- **用途**：处理鼠标事件、UI 元素定位

#### 2. 世界坐标（World Coordinates）
- **定义**：无限画布空间中的绝对坐标系统
- **转换方式**：`camera.screenToWorld(screenPoint)` → `{ x: (screenX - camera.x) / camera.zoom, y: (screenY - camera.y) / camera.zoom }`
- **特点**：
  - 不受画布缩放（zoom）和平移（pan）影响
  - 节点的 `transform.x` 和 `transform.y` 存储的就是世界坐标
  - 是对象的"真实"位置
- **用途**：存储节点位置、计算对象之间的关系、碰撞检测

#### 3. 本地坐标（Local Coordinates）
- **定义**：相对于父对象或自身中心点的坐标
- **在本项目中的体现**：
  - 节点的 `transform.x/y` 是其**中心点**的世界坐标
  - 节点的 `width/height` 定义了相对于中心的尺寸
  - 端口的 `dx/dy` 是相对于节点中心的归一化偏移（-0.5 到 0.5）
- **用途**：定义对象内部元素的相对位置（如端口、调整大小控制点）

#### 坐标转换关系

```
屏幕坐标 ←→ 世界坐标 ←→ 本地坐标
    ↑           ↑           ↑
  Camera    节点位置    相对偏移
```

**屏幕 → 世界**：
```typescript
worldX = (screenX - camera.x) / camera.zoom
worldY = (screenY - camera.y) / camera.zoom
```

**世界 → 屏幕**：
```typescript
screenX = worldX * camera.zoom + camera.x
screenY = worldY * camera.zoom + camera.y
```

**世界 → 本地**（以节点为例）：
```typescript
localX = worldX - node.transform.x
localY = worldY - node.transform.y
```

#### 实际应用示例

在 [GraphiteEditor.ts:190-194](packages/graphite/src/GraphiteEditor.ts#L190-L194) 的 `onMouseDown` 方法中：

```typescript
const point = this.getMousePosition(e)           // 屏幕坐标
const worldPoint = this.renderer.getCamera().screenToWorld(point)  // 世界坐标
```

1. 鼠标点击时，先获取**屏幕坐标**（相对于 Canvas）
2. 通过 Camera 转换为**世界坐标**（用于判断点击了哪个节点）
3. 节点内部使用**本地坐标**判断是否点击了端口或调整大小控制点

这种分层设计使得：
- 画布可以自由缩放和平移（只需修改 Camera 的 x, y, zoom）
- 节点位置保持稳定（存储在世界坐标系中）
- 对象内部结构独立（使用本地坐标定义）

<!-- 拖拽画布之后的流程是什么，和坐标系，Camera 有什么关系，都改变了什么？ -->

### 拖拽画布流程详解

拖拽画布（Pan）是通过修改 Camera 的位置来实现的视口移动，整个流程如下：

#### 1. 触发条件
在 [GraphiteEditor.ts:197-202](packages/graphite/src/GraphiteEditor.ts#L197-L202) 中：
- **空格键 + 鼠标左键拖拽**
- **鼠标中键拖拽**（`e.button === 1`）

```typescript
if (this.isSpacePressed || e.button === 1) {
  this.isPanning = true
  this.panStartPoint = point  // 记录起始屏幕坐标
  this.canvas.style.cursor = 'grabbing'
}
```

#### 2. 拖拽过程（onMouseMove）
在 [GraphiteEditor.ts:364-371](packages/graphite/src/GraphiteEditor.ts#L364-L371) 中：

```typescript
if (this.isPanning && this.panStartPoint) {
  const dx = point.x - this.panStartPoint.x  // 计算屏幕坐标的偏移量
  const dy = point.y - this.panStartPoint.y
  this.renderer.getCamera().translate(dx, dy)  // 更新 Camera 位置
  this.panStartPoint = point  // 更新起始点为当前点（实现连续拖拽）
  this.renderer.markDirty()  // 标记需要重绘
}
```

#### 3. Camera 的变化
在 [Camera.ts:27-30](packages/graphite/src/renderer/Camera.ts#L27-L30) 中：

```typescript
translate(dx: number, dy: number): void {
  this.x += dx  // Camera 的 x 偏移量增加
  this.y += dy  // Camera 的 y 偏移量增加
}
```

**关键点**：
- `Camera.x` 和 `Camera.y` 表示**世界坐标原点在屏幕上的位置**
- 向右拖拽画布时，`dx > 0`，`Camera.x` 增加，世界坐标原点向右移动
- 这会让所有对象看起来向右移动（实际上是视口向右移动）

#### 4. 坐标转换的影响
Camera 的 `x, y` 改变后，坐标转换公式也随之改变：

**屏幕 → 世界**（[Camera.ts:11-16](packages/graphite/src/renderer/Camera.ts#L11-L16)）：
```typescript
screenToWorld(point: Point): Point {
  return {
    x: (point.x - this.x) / this.zoom,  // Camera.x 改变，转换结果改变
    y: (point.y - this.y) / this.zoom,
  }
}
```

**世界 → 屏幕**（[Camera.ts:19-24](packages/graphite/src/renderer/Camera.ts#L19-L24)）：
```typescript
worldToScreen(point: Point): Point {
  return {
    x: point.x * this.zoom + this.x,  // Camera.x 改变，渲染位置改变
    y: point.y * this.zoom + this.y,
  }
}
```

#### 5. 渲染变换
在 [Camera.ts:60-63](packages/graphite/src/renderer/Camera.ts#L60-L63) 中，Camera 将变换应用到 Canvas 上下文：

```typescript
applyTransform(ctx: CanvasRenderingContext2D): void {
  ctx.translate(this.x, this.y)  // 先平移
  ctx.scale(this.zoom, this.zoom)  // 再缩放
}
```

这样，所有在世界坐标系中绘制的对象都会自动应用 Camera 的变换。

#### 总结：拖拽画布改变了什么？

| 改变的内容 | 说明 |
|-----------|------|
| **Camera.x, Camera.y** | 视口的偏移量增加，表示世界坐标原点在屏幕上的新位置 |
| **屏幕坐标 ↔ 世界坐标转换** | 同一个屏幕点对应的世界坐标改变了 |
| **渲染位置** | 所有对象在屏幕上的渲染位置改变（通过 `ctx.translate`） |
| **节点的世界坐标** | **不变**！节点的 `transform.x/y` 保持不变 |
| **对象之间的关系** | **不变**！节点之间的距离、连线的路径都不变 |

**核心理解**：
- 拖拽画布只改变了"观察视角"（Camera），不改变"世界中的对象"（节点位置）
- 就像移动相机拍照，物体本身没有移动，只是相机的位置变了
- 这种设计使得画布可以无限大，用户可以自由浏览不同区域

<!-- 拖拽节点是一个怎样的流程， 都有哪些东西发生了改变？ -->

### 拖拽节点流程详解

拖拽节点是通过 DragManager 管理的交互流程，涉及节点位置更新、边路径重算、吸附辅助线显示和撤销历史记录。整个流程分为三个阶段：

#### 1. 开始拖拽（onMouseDown）

在 [GraphiteEditor.ts:190-266](packages/graphite/src/GraphiteEditor.ts#L190-L266) 中：

```typescript
const point = this.getMousePosition(e)           // 获取屏幕坐标
const worldPoint = this.renderer.getCamera().screenToWorld(point)  // 转换为世界坐标

const clickedNode = this.findNodeAt(worldPoint)  // 查找点击的节点

if (clickedNode) {
  // 如果节点未被选中，先选中它
  if (!this.selectionManager.isNodeSelected(clickedNode)) {
    this.selectionManager.selectNode(clickedNode, isMultiSelect)
  }
  
  // 开始拖拽所有选中的节点
  const selectedNodes = this.selectionManager.getSelectedNodes()
  this.dragManager.startDrag(selectedNodes, worldPoint)
}
```

**DragManager.startDrag** 做了什么（[DragManager.ts:15-28](packages/graphite/src/interaction/DragManager.ts#L15-L28)）：
- 记录拖拽起始点（世界坐标）
- 保存所有被拖拽节点的初始位置到 `initialPositions` Map
- 设置 `isPending = true`（拖拽意图状态）
- **注意**：此时节点还没有移动，只是记录了拖拽意图

#### 2. 拖拽过程（onMouseMove）

在 [GraphiteEditor.ts:425-449](packages/graphite/src/GraphiteEditor.ts#L425-L449) 中：

```typescript
if (this.dragManager.isDraggingActive()) {
  const draggedNodes = this.dragManager.getDraggedNodes()
  
  // 单个节点：应用吸附辅助线
  if (draggedNodes.length === 1) {
    const node = draggedNodes[0]
    const snapResult = this.snapGuide.snap(
      node, worldPoint.x, worldPoint.y, this.nodes, camera.zoom
    )
    this.dragManager.drag(worldPoint, { x: snapResult.x, y: snapResult.y })
    this.snapGuides = snapResult.snappedX || snapResult.snappedY 
      ? snapResult.guides 
      : { x: [], y: [] }
  } else {
    // 多个节点：应用网格吸附
    const gridSize = this.snapGuide.getGridSize()
    const snapX = Math.round(worldPoint.x / gridSize) * gridSize
    const snapY = Math.round(worldPoint.y / gridSize) * gridSize
    this.dragManager.drag(worldPoint, { x: snapX, y: snapY })
  }
}
```

**DragManager.drag** 做了什么（[DragManager.ts:33-63](packages/graphite/src/interaction/DragManager.ts#L33-L63)）：

1. **阈值检测**（防止误触）：
   - 计算鼠标移动距离：`Math.sqrt(dx * dx + dy * dy)`
   - 如果小于 `DRAG_THRESHOLD`（4px），不移动节点
   - 超过阈值后，设置 `isDragging = true`，触发 `dragStart` 事件

2. **更新节点位置**：
   ```typescript
   const snapDx = targetX - this.dragStartPoint.x  // 计算偏移量
   const snapDy = targetY - this.dragStartPoint.y
   
   this.draggedNodes.forEach(node => {
     const initial = this.initialPositions.get(node)
     if (initial) {
       node.setPosition(initial.x + snapDx, initial.y + snapDy)  // 更新世界坐标
     }
   })
   ```

3. **触发 drag 事件**，在 [GraphiteEditor.ts:171-178](packages/graphite/src/GraphiteEditor.ts#L171-L178) 中监听：
   ```typescript
   this.dragManager.on('drag', () => {
     const draggedNodes = this.dragManager.getDraggedNodes()
     const relatedEdges = this.edges.filter(e =>
       draggedNodes.some(n => n.id === e.fromNodeId || n.id === e.toNodeId)
     )
     this.updateEdges()  // 重新计算所有边的路径
     this.markDirtyForObjects(draggedNodes, relatedEdges)  // 标记脏区域重绘
   })
   ```

#### 3. 结束拖拽（onMouseUp）

在 [GraphiteEditor.ts:597-600](packages/graphite/src/GraphiteEditor.ts#L597-L600) 中：

```typescript
if (this.dragManager.isDraggingActive()) {
  this.dragManager.endDrag(worldPoint)
  this.snapGuides = { x: [], y: [] }  // 清除吸附辅助线
}
```

**DragManager.endDrag** 做了什么（[DragManager.ts:66-87](packages/graphite/src/interaction/DragManager.ts#L66-L87)）：
- 计算最终偏移量 `{ dx, dy }`
- 清空拖拽状态（`isPending = false`, `isDragging = false`）
- 触发 `dragEnd` 事件

**dragEnd 事件处理**（[GraphiteEditor.ts:180-186](packages/graphite/src/GraphiteEditor.ts#L180-L186)）：
```typescript
this.dragManager.on('dragEnd', (nodes: Node[], dx: number, dy: number) => {
  if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
    const command = new MoveCommand(nodes, dx, dy)
    // 节点已经在拖拽过程中移动了，所以只添加到历史，不执行
    this.commandManager.addToHistory(command)
  }
})
```

#### 总结：拖拽节点改变了什么？

| 改变的内容 | 说明 | 位置 |
|-----------|------|------|
| **节点的世界坐标** | `node.transform.x/y` 更新为新位置 | [DragManager.ts:58](packages/graphite/src/interaction/DragManager.ts#L58) |
| **相关边的路径** | 所有连接到被拖拽节点的边重新计算 `edge.points` | [GraphiteEditor.ts:176](packages/graphite/src/GraphiteEditor.ts#L176) |
| **吸附辅助线** | 单节点拖拽时显示对齐辅助线 `snapGuides` | [GraphiteEditor.ts:440](packages/graphite/src/GraphiteEditor.ts#L440) |
| **脏区域标记** | 触发局部重绘（节点 + 相关边的包围盒） | [GraphiteEditor.ts:177](packages/graphite/src/GraphiteEditor.ts#L177) |
| **撤销历史** | 拖拽结束时添加 `MoveCommand` 到历史栈 | [GraphiteEditor.ts:182-184](packages/graphite/src/GraphiteEditor.ts#L182-L184) |

**不变的内容**：
- **Camera 的位置和缩放**：拖拽节点不改变视口
- **节点的尺寸**：`width/height` 保持不变（调整大小是另一个交互）
- **节点的样式**：`style` 对象不变
- **其他未选中节点**：位置完全不受影响

#### 关键设计细节

1. **阈值机制**（4px）：防止点击时的微小抖动被误判为拖拽
2. **初始位置缓存**：拖拽过程中始终基于 `initialPositions` 计算新位置，避免累积误差
3. **吸附优先级**：
   - 单节点：吸附到其他节点的边界（对齐辅助线）
   - 多节点：吸附到网格（保持相对位置）
4. **命令模式**：拖拽结束后才创建 `MoveCommand`，支持 Ctrl+Z 撤销
5. **增量渲染**：只重绘被拖拽节点和相关边的区域，不是全画布重绘

#### 与拖拽画布的对比

| 特性 | 拖拽节点 | 拖拽画布 |
|-----|---------|---------|
| **触发条件** | 点击节点 + 拖拽 | 空格键 + 拖拽 / 鼠标中键 |
| **改变对象** | 节点的世界坐标 | Camera 的 x, y |
| **坐标系影响** | 节点世界坐标改变，屏幕坐标随 Camera 变化 | 世界坐标不变，屏幕坐标改变 |
| **撤销支持** | 支持（MoveCommand） | 不支持（视口操作不记录历史） |
| **关联更新** | 需要更新相关边的路径 | 不需要更新任何对象 |
