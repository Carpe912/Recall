# Graphite 图形编辑器实现清单

## 阶段 1：核心架构 ✅

### 1.1 基础类型和接口
- [x] Point, Rect, Transform 等基础类型
- [x] GraphicObject 基类
- [x] EventEmitter 事件系统

### 1.2 核心对象
- [x] Node 节点类（矩形/圆形/菱形/三角形）
- [x] Edge 边类（直线/曲线/正交）
- [x] Port 连接点（可配置数量、位置、类型）
- [x] Group 分组
- [x] Path 自由绘制路径
- [x] ImageNode 图片节点
- [x] CustomNode 自定义节点（响应式数据）
- [x] NodeRegistry 节点类型注册表

### 1.3 渲染系统
- [x] Renderer 渲染器
- [x] Camera 视口管理（缩放、平移）
- [x] 脏矩形优化
- [x] 高 DPI 支持

## 阶段 2：交互系统 ✅

### 2.1 选择系统
- [x] SelectionManager 选择管理器
- [x] 单选、多选、框选
- [x] 选择框渲染

### 2.2 拖拽系统
- [x] DragManager 拖拽管理器
- [x] 节点拖拽（含多节点同时拖拽）
- [x] 画布平移（空格/中键）
- [x] 缩放（鼠标滚轮）
- [x] 调整大小（8 个控制点）
- [x] 折点（Waypoint）拖拽

### 2.3 命令系统
- [x] Command 接口
- [x] CommandManager 命令管理器
- [x] CompoundCommand（事务，批量原子 undo/redo）
- [x] 事务 API：beginTransaction / commitTransaction / rollbackTransaction
- [x] MoveCommand, CreateNodeCommand, DeleteNodeCommand
- [x] CreateEdgeCommand, DeleteEdgeCommand
- [x] MoveWaypointCommand
- [x] 撤销/重做（Ctrl/Cmd + Z / Shift + Z）

## 阶段 3：连接系统 ✅

### 3.1 连接点管理
- [x] 可配置 PortDefinition（dx/dy 归一化坐标、type）
- [x] 默认 4 端口布局（top/right/bottom/left）
- [x] 按类型着色（input=绿、output=橙、both=蓝）
- [x] setNodePorts() / resetNodePorts()

### 3.2 路径计算
- [x] 直线路径
- [x] 正交路径（直角折线）
- [x] 贝塞尔曲线
- [x] 可拖动折点（waypoints）
- [x] A* 智能路由（避开障碍节点）
- [x] 箭头渲染（arrow / circle / diamond / none）

### 3.3 连接规则校验
- [x] ConnectionValidator（命名规则注册表）
- [x] 内置规则：noSelfLoop / noDuplicateEdge / portTypeCompatibility
- [x] createDefaultValidator() 工厂函数
- [x] 校验失败 emit 'connectionRejected' 事件
- [x] addConnectionRule() / removeConnectionRule()

## 阶段 4：样式系统 ✅

### 4.1 节点样式
- [x] fill / stroke / strokeWidth / borderRadius / opacity
- [x] fontSize / fontColor / fontFamily（可配置字体族）
- [x] shadowBlur / shadowColor / shadowOffsetX / shadowOffsetY
- [x] strokeGradient（水平线性渐变边框）

### 4.2 连线样式
- [x] stroke / strokeWidth / opacity
- [x] dashPreset 命名预设（solid / dashed / dotted / long-dash / dot-dash）
- [x] strokeDasharray 原始值（兼容）
- [x] arrowType / arrowSize
- [x] lineStyle（straight / curved / orthogonal）

## 阶段 5：序列化 ✅（JSON v2）

- [x] exportToJSON：完整保存所有字段
  - Node: id / x / y / width / height / content / shape / style / ports
  - CustomNode: 额外保存 nodeType / data
  - ImageNode: 额外保存 imageData
  - Edge: id / from / to / style / waypoints / label
- [x] importFromJSON：按类型路由恢复
- [x] exportToPNG / exportToSVG

## 阶段 6：布局与工具 ✅

### 6.1 自动布局
- [x] 层次布局（Hierarchical）
- [x] 树形布局（Tree）
- [x] 力导向布局（Force-Directed）
- [x] 环形布局（Circular）
- [x] 网格布局（Grid）

### 6.2 对齐与分布
- [x] 左/右/顶部/底部/水平居中/垂直居中
- [x] 水平分布/垂直分布

### 6.3 工具
- [x] 吸附辅助线
- [x] 铅笔工具（Douglas-Peucker 路��简化）
- [x] 图片拖放
- [x] 节点分组
- [x] 小地图导航
- [x] 主题（亮色/暗色，localStorage 持久化）
- [x] 右键菜单

## 文件结构

```
packages/graphite/src/
├── types/
│   └── index.ts              # NodeData, EdgeData, PortDefinition, DashPreset…
├── core/
│   ├── GraphicObject.ts
│   ├── Node.ts               # 含可配置 ports[]
│   ├── Edge.ts               # 含 waypoints[]
│   ├── CustomNode.ts
│   ├── NodeRegistry.ts
│   ├── Group.ts
│   ├── Path.ts
│   ├── ImageNode.ts
│   └── Port.ts
├── renderer/
│   ├── Renderer.ts
│   ├── Camera.ts
│   └── DirtyRectManager.ts
├── interaction/
│   ├── CommandManager.ts     # CompoundCommand + 事务
│   ├── Commands.ts           # MoveWaypointCommand 等
│   ├── SelectionManager.ts
│   └── DragManager.ts
├── ui/
│   ├── ContextMenu.ts
│   └── Minimap.ts
├── utils/
│   ├── ConnectionValidator.ts  # ← 新增
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
```

## 后续可扩展方向

- [ ] WebGL 渲染器（处理万级节点）
- [ ] 虚拟化渲染（只渲染可见区域）
- [ ] 节点富文本编辑
- [ ] Yjs 实时协作（完整实现）
- [ ] 导出更多格式（PDF、Mermaid）
- [ ] 插件系统
- [ ] 撤销历史上限配置
- [ ] Web Worker 计算布局
