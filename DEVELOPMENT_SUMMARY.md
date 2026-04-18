# Graphite 编辑器开发总结

## 项目概述

Graphite 是一个基于 Canvas 的图形编辑器，支持节点、连线、分组、自动布局等功能。本文档总结了开发过程中实现的功能和修复的问题。

## 最新功能（2026-04-18）

### 1. 文本编辑
- 双击节点进入编辑模式
- 创建 textarea 覆盖层，定位在节点上方
- 支持 Enter 保存、Escape 取消、失焦保存
- 防止编辑时触发其他交互

### 2. 多种形状支持
- 新增圆形、菱形、三角形节点
- 每种形状有独立的渲染方法
- 精确的碰撞检测（hitTest）
- 工具栏形状选择器

### 3. 连线样式
- **直线**：默认样式，两点直连
- **曲线**：贝塞尔曲线，控制点垂直于连线方向
- **折线**：正交路径，先水平后垂直或先垂直后水平
- 工具栏连线样式选择器

### 4. 对齐和分布工具
- **对齐**：左、右、顶部、底部、水平居中、垂直居中
- **分布**：水平分布、垂直分布
- 8个对齐按钮，需要2+节点选中（分布需要3+）
- 自动更新连线位置

### 5. 主题切换
- **浅色主题**：白色背景、浅灰网格
- **深色主题**：深色背景、深灰网格
- 主题保存到 localStorage
- 工具栏太阳/月亮图标切换

### 6. 箭头自动连接增强
- 磁性吸附到最近的连接点（30px 阈值）
- 自动计算最近端口
- 预览线吸附到端口位置
- 改进连接目标视觉反馈

## 核心功能实现

### 1. 导入/导出功能
- **JSON 导入/导出**：支持完整的图形数据序列化
- **PNG 导出**：将画布内容导出为 PNG 图片
- **SVG 导出**：导出为矢量 SVG 格式

### 2. 自动布局算法
实现了 5 种布局算法：
- **层次布局 (Hierarchical)**：适合树状结构，从上到下分层
- **树形布局 (Tree)**：经典树形结构
- **力导向布局 (Force-Directed)**：基于物理模拟的自然布局
- **环形布局 (Circular)**：节点沿圆形排列
- **网格布局 (Grid)**：规则的网格排列

### 3. 节点分组 (Group)
- 支持多选节点后创建分组
- 分组可视化显示（虚线边框）
- 支持取消分组操作

### 4. 协作功能 (Yjs CRDT)
- 集成 Yjs 实现实时协作
- 采用零运行时依赖模式（TypeScript 接口存根）
- 支持多用户同时编辑

### 5. 交互功能
- **节点拖拽**：支持单选/多选拖拽，带 4px 阈值防误触
- **吸附辅助线**：拖拽时显示对齐参考线
- **调整大小**：8 个控制点调整节点尺寸
- **连线创建**：从节点连接点拖拽创建连线
- **框选**：拖拽空白区域框选多个节点
- **右键菜单**：上下文菜单支持复制、粘贴、删除等操作
- **键盘快捷键**：
  - `Ctrl+Z` / `Cmd+Z`：撤销
  - `Ctrl+Shift+Z` / `Cmd+Shift+Z`：重做
  - `Ctrl+C` / `Cmd+C`：复制
  - `Ctrl+X` / `Cmd+X`：剪切
  - `Ctrl+V` / `Cmd+V`：粘贴
  - `Delete` / `Backspace`：删除
  - `Space + 拖拽`：平移画布

### 6. UI 改进

#### 浮动工具栏
- 位置：底部居中浮动
- 样式：圆角卡片，带阴影
- 图标按钮：所有操作都使用 SVG 图标
- 分组：用分隔线区分不同功能区

#### 导出下拉菜单
- 将 3 个导出按钮合并为 1 个下拉菜单
- 鼠标悬浮显示菜单，包含：
  - 导出 JSON
  - 导出 PNG
  - 导出 SVG

#### 自定义 Tooltip
- 替换原生 `title` 属性
- 深色半透明背景
- 显示操作名称和键盘快捷键
- 支持 disabled 状态按钮显示提示

#### 样式面板
- 位置：右侧边栏
- 仅在选中节点时显示
- 支持调整：
  - 填充颜色
  - 边框颜色和宽度
  - 圆角
  - 阴影模糊
  - 透明度

## 修复的问题

### 1. 事件监听器清理问题
**问题**：`destroy()` 方法中尝试从 `window` 移除 `mousemove` 监听器，但实际监听器绑定在 `canvas` 上。

**修复**：
```typescript
destroy(): void {
  this.canvas.removeEventListener('mousemove', this.boundOnMouseMove)
  this.canvas.removeEventListener('mouseup', this.boundOnMouseUp)
  window.removeEventListener('mouseup', this.boundOnMouseUp)
  // ...
}
```

### 2. 节点选择坐标错误
**问题**：Node 2 和 Node 3 鼠标移到文字处无法选中。

**原因**：Sidebar 出现时改变了 canvas 的 CSS 宽度，但 `window.resize` 事件不会触发，导致 `canvas.width`（物理像素）与 CSS 宽度不匹配，坐标映射错误。

**修复**：使用 `ResizeObserver` 监听 canvas 元素本身：
```typescript
this.resizeObserver = new ResizeObserver(() => this.resize())
this.resizeObserver.observe(canvas)
```

### 3. 右键菜单位置闪烁
**问题**：菜单先显示在旧位置，然后跳到正确位置。

**修复**：使用 `visibility: hidden` 预测量尺寸：
```typescript
this.element.style.visibility = 'hidden'
this.element.style.display = 'block'
const menuWidth = this.element.offsetWidth
// ... 计算位置 ...
this.element.style.visibility = 'visible'
```

### 4. 布局选项不生效
**问题**：用户点击"自动布局"按钮后切换布局类型，但没有重新应用。

**修复**：
- 调整 UI 顺序：布局选择器在按钮之前
- 给 `<select>` 添加 `@change="autoLayout"`，切换时立即应用

### 5. 导出菜单无法点击
**问题**：鼠标移到菜单上时，离开了 `dropdown-group`，触发 `mouseleave` 导致菜单消失。

**修复**：给菜单本身也添加鼠标事件：
```vue
<div class="export-menu" 
     v-show="showExportMenu" 
     @mouseenter="showExportMenu = true" 
     @mouseleave="showExportMenu = false">
```

### 6. Disabled 按钮不显示 Tooltip
**问题**：CSS 选择器 `.icon-btn:hover:not(:disabled) .btn-tip` 阻止了 disabled 按钮显示提示。

**修复**：移除 `:not(:disabled)` 限制：
```css
.icon-btn:hover .btn-tip {
  opacity: 1;
}
```

### 7. Tooltip 被裁剪
**问题**：`.main-content` 的 `overflow: hidden` 裁剪了向上弹出的 tooltip。

**修复**：移除 `overflow: hidden` 属性。

## 技术细节

### Canvas 渲染
- **DPR 缩放**：`ctx.scale(dpr, dpr)` 适配高分辨率屏幕
- **相机系统**：支持平移和缩放
- **脏矩形优化**：只在需要时重新渲染
- **渲染循环**：使用 `requestAnimationFrame`

### 坐标系统
- **屏幕坐标**：鼠标事件坐标（相对于 canvas 元素）
- **世界坐标**：场景中的实际坐标（考虑相机变换）
- **转换**：`camera.screenToWorld(point)`

### 拖拽系统
- **两阶段拖拽**：
  1. `pending`：已按下但未超过阈值
  2. `dragging`：超过 4px 阈值，真正移动节点
- **吸附**：单节点拖拽时自动对齐到其他节点

### 命令模式
- 所有操作（创建、删除、移动）都封装为 Command
- 支持撤销/重做
- 历史记录管理

## 文件结构

```
packages/graphite/src/
├── core/
│   ├── Node.ts              # 节点类
│   ├── Edge.ts              # 连线类
│   └── Group.ts             # 分组类
├── renderer/
│   ├── Renderer.ts          # 渲染器
│   ├── Camera.ts            # 相机系统
│   └── DirtyRectManager.ts  # 脏矩形管理
├── interaction/
│   ├── SelectionManager.ts  # 选择管理
│   ├── DragManager.ts       # 拖拽管理
│   ├── CommandManager.ts    # 命令管理
│   └── Commands.ts          # 命令实现
├── ui/
│   ├── ContextMenu.ts       # 右键菜单
│   └── Minimap.ts           # 小地图
├── utils/
│   ├── LayoutEngine.ts      # 布局引擎
│   ├── SnapGuide.ts         # 吸附辅助
│   └── EventEmitter.ts      # 事件系统
└── GraphiteEditor.ts        # 主编辑器类

apps/playground/src/
└── App.vue                  # Vue 应用界面
```

## 关键代码模式

### 1. ResizeObserver 监听布局变化
```typescript
this.resizeObserver = new ResizeObserver(() => this.resize())
this.resizeObserver.observe(canvas)
```

### 2. 事件监听器清理
```typescript
// 保存绑定后的函数引用
private boundOnMouseMove: (e: MouseEvent) => void

constructor() {
  this.boundOnMouseMove = this.onMouseMove.bind(this)
  this.canvas.addEventListener('mousemove', this.boundOnMouseMove)
}

destroy() {
  this.canvas.removeEventListener('mousemove', this.boundOnMouseMove)
}
```

### 3. 自定义 Tooltip
```vue
<button class="icon-btn">
  <svg><!-- icon --></svg>
  <div class="btn-tip">操作名称 <kbd>快捷键</kbd></div>
</button>
```

```css
.btn-tip {
  position: absolute;
  bottom: calc(100% + 8px);
  opacity: 0;
  transition: opacity 0.15s;
}

.icon-btn:hover .btn-tip {
  opacity: 1;
}
```

### 4. 下拉菜单
```vue
<div class="dropdown-group" 
     @mouseenter="showMenu = true" 
     @mouseleave="showMenu = false">
  <button>触发按钮</button>
  <div class="menu" 
       v-show="showMenu"
       @mouseenter="showMenu = true" 
       @mouseleave="showMenu = false">
    <!-- 菜单项 -->
  </div>
</div>
```

## 性能优化

1. **脏矩形渲染**：只在状态变化时标记需要重绘
2. **事件节流**：拖拽时使用 `requestAnimationFrame`
3. **对象池**：复用节点和边对象
4. **Canvas 分层**：主画布 + 小地图分离渲染

## 浏览器兼容性

- 现代浏览器（Chrome, Firefox, Safari, Edge）
- 需要支持：
  - Canvas 2D API
  - ResizeObserver
  - ES6+ 语法
  - CSS Flexbox

## 未来改进方向

1. **性能**：
   - 虚拟化渲染（只渲染可见区域）
   - WebGL 渲染器（处理大量节点）
   - Web Worker 计算布局

2. **功能**：
   - 更多布局算法
   - 节点模板系统
   - 主题切换
   - 导出更多格式（PDF, Mermaid）

3. **协作**：
   - 用户光标显示
   - 实时聊天
   - 版本历史

4. **可访问性**：
   - 键盘导航
   - 屏幕阅读器支持
   - 高对比度模式

## 总结

本项目实现了一个功能完整的图形编辑器，包含节点编辑、自动布局、协作功能等核心特性。通过解决坐标系统、事件管理、UI 交互等关键问题，提供了流畅的用户体验。代码结构清晰，采用命令模式、事件驱动等设计模式，具有良好的可维护性和扩展性。
