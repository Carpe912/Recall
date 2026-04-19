# Recall

AI-driven collaborative knowledge platform

## Project Structure

```
Recall/
├── packages/
│   └── graphite/              # Canvas 图形编辑器库 (@recall/graphite)
│       └── src/
│           ├── GraphiteEditor.ts      # 编辑器总入口
│           ├── core/                  # 数据模型（Node, Edge, Group, Path, ImageNode）
│           ├── renderer/              # 渲染层（Camera, Renderer）
│           ├── interaction/           # 交互层（命令模式、选择、拖拽）
│           ├── ui/                    # UI 组件（Minimap, ContextMenu）
│           └── utils/                 # 算法工具（布局、寻路、吸附、主题、连接校验）
├── apps/
│   └── playground/            # Vue 3 开发演示应用
├── LEARNING_GUIDE.md          # 源码导读教程（适合学习图形编辑器开发）
├── DEVELOPMENT_SUMMARY.md     # 开发总结与技术细节
└── package.json
```

## 已实现功能

### 核心图形
- **节点**：矩形 / 圆形 / 菱形 / 三角形，支持调整大小、双击编辑文字、自定义样式
- **连线**：直线 / 贝塞尔曲线 / 正交折线，支持箭头、平行边错开、磁性吸附连接点
- **可拖动折点（Waypoint）**：选中连线后可拖拽中间控制点，支持撤销/重做
- **智能路由**：A* 寻路算法，连线自动绕开其他节点

### 连接系统
- **可配置连接点（Port）**：每个节点可自定义端口数量、位置（归一化坐标）和类型（input/output/both）
- **连接规则校验（ConnectionValidator）**：内置禁止自连、禁止重复边、端口类型兼容性规则；支持注册自定义规则

### 样式系统
- **节点样式**：填充色、边框色/宽度、圆角、阴影、透明度、字体族（fontFamily）、渐变边框（strokeGradient）
- **连线样式**：颜色、宽度、虚线预设（solid/dashed/dotted/long-dash/dot-dash）、箭头类型
- **主题**：亮色 / 暗色，持久化到 localStorage

### 交互
- 拖拽移动、框选、吸附辅助线
- **撤销/重做**：Command 模式 + CompoundCommand 事务，粘贴/批量删除一次撤销
- 画布控制：无限画布、平移缩放、小地图导航
- 铅笔工具：自由绘制，Douglas-Peucker 路径简化
- 图片节点：拖放图片文件到画布
- 分组：视觉分组，自动更新包围盒
- 对齐分布：左/右/上/下/居中/水平分布/垂直分布

### 剪贴板 & 导入导出
- 复制、剪切、粘贴（保留边关系）
- **JSON 序列化**（version 2）：完整保存 shape、nodeType、data（CustomNode）、imageData、waypoints、ports、label
- PNG / SVG 导出

### 扩展
- **自定义节点类型**：响应式数据 + 自定义 Canvas 渲染函数
- **事务 API**：`beginTransaction / commitTransaction / rollbackTransaction`
- 右键菜单：上下文相关操作

## Getting Started

```bash
# 安装依赖
pnpm install

# 启动开发演示
pnpm --filter playground dev

# 构建 graphite 库
pnpm --filter graphite build
```

## 学习资源

想了解各个功能的实现原理，请查看 [LEARNING_GUIDE.md](LEARNING_GUIDE.md)。

该文档按模块逐一讲解：Camera 相机、Command 模式、A* 路由、力导向布局、Douglas-Peucker 简化算法等，并提供从零构建图形编辑器的完整路径建议。

## Tech Stack

| 工具 | 用途 |
|------|------|
| TypeScript | 语言 |
| HTML5 Canvas 2D | 渲染（无第三方渲染库） |
| Vue 3 | Playground UI 框架 |
| Vite | 构建工具 |
| pnpm workspace | Monorepo 管理 |
