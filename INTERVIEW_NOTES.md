# Graphite 图形编辑器 —— 面试亮点与踩坑记录

> 个人项目，基于 HTML5 Canvas 从零实现的图形编辑器库。约 5000 行 TypeScript，支持节点连线、自动布局、自定义节点、协作等功能。

---

## 一、项目亮点（可重点展开）

### 1. 双坐标系设计与以鼠标为中心缩放

**能说什么：**

所有图形对象存储"世界坐标"，鼠标事件是"屏幕坐标"，每次处理鼠标事件都要经过 Camera 的 `screenToWorld()` 转换。这个区分是图形编辑器最基础也最容易忽略的设计。

以鼠标为中心缩放不是简单地调 zoom，需要保证鼠标指向的世界坐标点在屏幕上不动：

```
// 缩放后让鼠标所指的世界点保持屏幕位置不变
this.x = mouseScreenX - worldX * newZoom
this.y = mouseScreenY - worldY * newZoom
```

**为什么这么做：** 用户的直觉是"我在看哪里，哪里就是缩放中心"，否则每次缩放画面都会漂移，体验很差。

---

### 2. 命令模式 + 事务机制（Undo/Redo）

**能说什么：**

所有操作都封装为 `ICommand { execute() / undo() }`，`CommandManager` 维护历史栈。

关键细节：**拖拽过程中不入栈，只在 mouseup 时才创建 MoveCommand**。如果每次 mousemove 都入栈，undo 一次只还原 1px 移动，用户需要按几百次才能撤销一次拖拽。

事务机制解决了"粘贴 5 个节点 + 3 条边需要按 8 次 Ctrl+Z"的问题：

```typescript
beginTransaction()  → transactionDepth++
execute(cmd)        → 暂存到 pendingCommands[]（不入历史）
commitTransaction() → 打包为 CompoundCommand 一次性入栈
```

支持嵌套事务（计数器而不是 boolean），内层 commit 不触发写入历史。

**延伸追问应对：** "为什么不用状态快照而是命令模式？" —— 快照对大型图性能差（序列化整个图），命令模式每步只存 diff（旧位置→新位置），内存占用小且性能好。

---

### 3. 自定义节点系统（Proxy 响应式）

**能说什么：**

类似 Vue 的响应式，但用原生 `Proxy` 实现，保持库的框架无关性：

```typescript
this.data = new Proxy(rawData, {
  set(target, key, value) {
    target[key] = value
    triggerRedraw()   // 自动触发重绘，无需手动 markDirty
    return true
  }
})
```

用户只需 `node.data.value = 80`，画面自动更新。

还有一个有趣的细节：自定义节点渲染函数用的是**左上角坐标系**（`bounds.x/y` 是左上角），而内置 Node 的 `draw()` 用的是**中心坐标系**（canvas transform 移到中心后 `0,0` 是中心）。这是为了让自定义渲染函数对业务开发者更直观。

**延伸：** 还实现了缩略图预览生成（offscreen canvas，等比缩放 render 函数），侧边栏动态读 NodeRegistry 渲染，注册新类型后不需要改 UI 代码。

---

### 4. A* 智能路由

**能说什么：**

连线支持自动绕开障碍节点，核心是 A* 算法：

- 把画布切成 20px × 20px 的格子
- 把所有节点占的格子标记为障碍
- A* 搜索最短路径（曼哈顿距离做启发函数，只走四向不走斜线）
- 路径还原为世界坐标后用共线检测简化多余点

**踩过的坑：** 格子太密（10px）时搜索时间随节点数量指数上升，实际卡帧；改成 20px 后性能可接受，而且折线精度对用户来说足够。另外起点/终点所在格子要从障碍列表里排除，否则连接相邻节点时直接找不到路径。

---

### 5. 可配置端口（归一化坐标）

**能说什么：**

端口位置用归一化坐标（`dx/dy` 范围 ±0.5），而不是像素坐标：

```typescript
// 世界坐标 = 节点中心 + 归一化偏移 × 节点尺寸
x = center.x + port.dx * node.width
y = center.y + port.dy * node.height
```

好处是：节点缩放后端口自动跟随，不需要重新计算。默认 4 端口（top/right/bottom/left）向后兼容，老代码 `getPortPosition('top')` 仍然工作。

---

### 6. 铅笔工具 + Douglas-Peucker 路径简化

**能说什么：**

鼠标移动时每帧记录一个点，100ms 的拖动能产生几百个点。松手后用 Douglas-Peucker 算法简化：

- 取起点终点连线，找最远点
- 最远距离 > 阈值：保留，递归处理两段
- 最远距离 ≤ 阈值：丢弃中间所有点

通常能把 300+ 个点压缩到 20 个以内，形状基本不变。

---

### 7. 透明 textarea 文本编辑

**能说什么：**

Canvas 没有原生文本编辑能力。方案是在节点上方叠一个透明 `textarea`：

```css
color: transparent;    /* 文字透明，由 canvas 渲染 */
caret-color: #333;     /* 光标可见 */
background: transparent;
```

用户看到的是 canvas 渲染的文字，光标来自 textarea。input 事件实时回写 `node.data.field` → Proxy 触发重绘 → canvas 文字实时更新，光标和文字视觉上完全对齐。

**关键：** textarea 的 `fontSize`、`fontWeight`、`textAlign` 必须与 canvas `ctx.font` 完全一致，否则光标位置会偏移。这个细节调了好几次。

---

## 二、踩坑与解决方案

### 坑 1：mouseup 监听在 canvas 上导致"拖拽卡死"

**现象：** 鼠标快速拖拽移出 canvas 边界，松手后节点还在跟着鼠标走。

**原因：** `mouseup` 只绑定在 canvas 上，拖到 canvas 外面松手不触发。

**解决：** `mousedown` 时把 `mousemove` 和 `mouseup` 绑定到 `window`，mouseup 时再移除。这样不管在哪里松手都能正确结束拖拽。

---

### 坑 2：高 DPI 屏幕画面模糊

**现象：** 在 Retina 屏（devicePixelRatio = 2）上文字和线条明显模糊。

**原因：** Canvas 的实际像素数默认等于 CSS 像素数，而 Retina 屏每个 CSS 像素对应 2 个物理像素，canvas 被拉伸了。

**解决：**
```typescript
canvas.width = cssWidth * dpr
canvas.height = cssHeight * dpr
canvas.style.width = cssWidth + 'px'
canvas.style.height = cssHeight + 'px'
ctx.scale(dpr, dpr)  // 让后续绘制坐标仍然是 CSS 像素单位
```

---

### 坑 3：节点拖拽后连线没有更新

**现象：** 拖动节点，节点移动了，但连线还停在原来的位置。

**原因：** 连线存的是起点终点的**节点引用**（`fromNode` / `toNode`），`updatePath()` 调用 `fromNode.getCenter()` 时用的是已更新的坐标，理论上没问题。

**实际原因（更隐蔽）：** 对齐操作后，edge 的 `fromNode` / `toNode` 引用可能变成了 null（对齐时重建了节点列表但没有同步更新 edge 引用）。

**解决：** 在 `updateEdges()` 中检查引用有效性，无效时按 ID 重新绑定：
```typescript
if (!edge.fromNode || !this.nodes.includes(edge.fromNode)) {
  edge.fromNode = this.nodes.find(n => n.id === edge.fromNodeId) ?? null
}
```

---

### 坑 4：右键菜单位置闪烁

**现象：** 右键菜单第一次显示时会在左上角闪一下，然后跳到正确位置。

**原因：** 先 `display: block`，再量菜单尺寸，再计算位置，但第一帧已经渲染了错误位置。

**解决：** 先 `visibility: hidden` + `display: block`（此时可以量尺寸），计算好位置后再 `visibility: visible`，一帧完成，不闪。

---

### 坑 5：sidebar 改变 canvas 宽度后节点选择偏移

**现象：** 切换侧边栏显示/隐藏后，点击节点的碰撞检测位置偏移了。

**原因：** Canvas 的 CSS 宽度变了，但内部的 resize 没有触发，导致 `canvas.getBoundingClientRect()` 返回新尺寸，而 `canvas.width` 还是旧的，坐标换算出错。

**解决：** 用 `ResizeObserver` 监听 canvas 元素的尺寸变化，而不是监听 window resize：
```typescript
const observer = new ResizeObserver(() => this.renderer.resize())
observer.observe(this.canvas)
```

---

### 坑 6：undo 之后位置被还原两次

**现象：** 拖拽节点，Ctrl+Z，节点跑到意想不到的位置（偏移量是实际移动距离的两倍）。

**原因：** 拖拽过程中已经实时更新了节点位置（`node.transform.x += dx`），mouseup 时又执行了 MoveCommand 的 `execute()`，等于移动了两次。undo 时只还原一次，但实际上 execute 的效果已经在 mouseup 之前就生效了。

**解决：** mouseup 时用 `commandManager.addToHistory(cmd)` 而不是 `commandManager.execute(cmd)`，前者只入栈不再执行一遍 execute。

---

### 坑 7：A* 路由起点/终点被自己挡住

**现象：** 两个紧邻节点之间画正交连线，直接报"no path found"，连线消失。

**原因：** 建格子障碍时把所有节点都标记了，包括起点节点和终点节点，A* 起点就在障碍里，搜索直接失败。

**解决：** 标记障碍时跳过起点节点和终点节点，只把"中间"节点标记为不可通行：
```typescript
const obstacleNodes = allNodes.filter(n => n !== fromNode && n !== toNode)
```

---

### 坑 8：TypeScript 的 Required<T> 与可选渐变字段冲突

**现象：** 把 Node 的 `style` 字段类型改为 `Required<NodeStyle>` 后，`strokeGradient` 变成了必填，构造函数报错 TS2739。

**原因：** `strokeGradient?: [string, string]` 是可选字段，`Required<NodeStyle>` 会把它变成 `strokeGradient: [string, string]`（必填），但我们希望不传时为 `undefined`。

**解决：** 用 Omit + Pick 组合类型，把可选字段"挖出来"：
```typescript
type StyleWithDefaults = 
  Omit<Required<NodeStyle>, 'strokeGradient'> & 
  Pick<NodeStyle, 'strokeGradient'>
```

这样大部分字段强制有值（避免运行时 undefined 判断），少数几个确实需要可选的字段保留可选语义。

---

## 三、架构决策可以展开谈

| 决策 | 选择 | 理由 |
|------|------|------|
| 渲染方式 | Canvas 2D，不用 WebGL | 节点数 < 1000 时够用，开发成本低，可精确控制每个像素 |
| 响应式数据 | 原生 Proxy，不用 Vue reactive | 保持库框架无关，不引入额外依赖 |
| 端口坐标 | 归一化（±0.5），不用像素 | 节点缩放后端口自动跟随，无需重算 |
| 文本编辑 | 透明 textarea，不用 contenteditable | contenteditable 跨浏览器行为不一致，textarea 更可控 |
| 撤销粒度 | 命令模式，不用状态快照 | 大图快照性能差，命令只存 diff，内存友好 |
| 路由算法 | A* + 20px 格子，不用实时动态规划 | 格子太密卡帧，20px 精度对用户足够，性能可接受 |

---

## 四、数据结构可以聊

- **Node**: 世界坐标中心点 + 宽高，ports[] 归一化
- **Edge**: fromNodeId + toNodeId（弱引用，防内存泄漏）+ waypoints[]（手动折点）+ points[]（自动计算路径，每帧更新）
- **CommandManager**: history: ICommand[] + current: number 指针（支持 undo/redo 分支）
- **SelectionManager**: Set<Node> + Set<Edge>（O(1) 查重、O(1) 删除）
- **NodeRegistry**: Map<name, NodeTypeDefinition>（单例，全局注册表）

---

## 五、可以主动提到的数字

- 核心库约 **5000 行** TypeScript
- 支持 **5 种**自动布局算法
- 支持 **8 种**内置富节点类型
- 端口归一化坐标 **±0.5** 表示边缘
- A* 格子大小 **20px**（调优结果）
- 铅笔路径简化容差 **2px**（Douglas-Peucker threshold）
- 磁性吸附阈值 **30px / zoom**（保证缩放后体验一致）
- 撤销历史无上限（可配置）

---

## 六、如果被追问"和 tldraw 比有什么优势"

直接回答：**没有优势，tldraw 功能更强、生态更完善。**

但这个项目的价值不是替代 tldraw，而是：

1. **学习目的**：自己实现过图形编辑器，才真正理解坐标系、命令模式、碰撞检测这些概念；遇到 tldraw 的 bug 或需要定制时不会抓瞎。
2. **嵌入定制**：作为知识管理产品的图谱可视化模块，需要与自有数据模型深度集成（响应式 data、自定义节点类型系统），通用库的接口太重。
3. **技术储备**：图形编辑器的核心问题（双坐标系、undo/redo、碰撞检测）在地图、游戏、数据可视化中都会遇到，这是通用能力。

这个回答既诚实，又展示了技术判断力，面试官通常会认可。
