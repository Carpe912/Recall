# Recall Prose 编辑器 - 安装指南

## 前置要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0

## 安装步骤

### 1. 切换 Node.js 版本

由于项目要求 Node.js >= 18.0.0，请使用 nvm 切换到合适的版本：

```bash
# 安装 Node.js 18 或更高版本
nvm install 18

# 使用 Node.js 18
nvm use 18

# 验证版本
node --version  # 应该显示 v18.x.x 或更高
```

### 2. 安装依赖

在项目根目录运行：

```bash
# 安装所有依赖（包括新的 Prose 编辑器包）
pnpm install
```

### 3. 构建 Prose 编辑器包

```bash
# 构建 Prose 编辑器
cd packages/prose
pnpm build

# 或者在根目录构建所有包
cd ../..
pnpm build
```

### 4. 启动开发服务器

```bash
# 启动 playground 演示应用
pnpm dev
```

然后在浏览器中打开 `http://localhost:5173`（或终端显示的地址）。

## 项目结构

```
Recall/
├── packages/
│   ├── graphite/          # 图形编辑器
│   └── prose/             # Prose 编辑器（新增）
│       ├── src/
│       │   ├── components/
│       │   │   ├── ProseEditor.vue          # 主编辑器组件
│       │   │   ├── ProseEditorComponent.vue # 核心编辑器
│       │   │   └── Toolbar.vue              # 工具栏组件
│       │   ├── extensions/
│       │   │   ├── Columns.ts               # 分栏扩展
│       │   │   └── Callout.ts               # 高亮块扩展
│       │   ├── styles/
│       │   │   └── editor.css               # 编辑器样式
│       │   ├── ProseEditor.ts               # 编辑器类
│       │   └── index.ts                     # 导出入口
│       ├── package.json
│       ├── vite.config.ts
│       ├── tsconfig.json
│       └── README.md
└── apps/
    └── playground/        # 演示应用
        └── src/
            ├── App.vue              # 主应用（已更新）
            └── GraphiteEditor.vue   # 图形编辑器组件
```

## 功能清单

Prose 编辑器包含以下功能：

### ✅ 文本格式
- 粗体、斜体、下划线、删除线
- 行内代码
- 文字颜色
- 背景高亮

### ✅ 标题
- H1-H6 多级标题

### ✅ 段落和对齐
- 左对齐、居中、右对齐、两端对齐
- 引用块
- 代码块
- 分割线

### ✅ 列表
- 无序列表
- 有序列表
- 任务列表（支持嵌套）

### ✅ 多媒体
- 链接插入和编辑
- 图片插入（URL 和 Base64）
- 表格（可调整大小）

### ✅ 自定义功能 ⭐
- **分栏布局**: 2 栏和 3 栏布局
- **高亮块**: 5 种类型（信息、警告、成功、错误、笔记）

### ✅ 编辑功能
- 撤销/重做（100 步历史）
- 占位符
- 拖放支持
- 清除格式

### ✅ UI 组件
- 完整的工具栏
- 图标按钮
- 颜色选择器
- 响应式设计

## 使用示例

在 playground 中，你可以看到两个编辑器的演示：

1. **图形编辑器**：原有的 Graphite 画布编辑器
2. **Prose 编辑器**：新的 Tiptap 散文编辑器，支持分栏和高亮块

切换顶部的标签页即可查看不同的编辑器。

## 开发模式

如果你想在开发模式下实时查看更改：

```bash
# 终端 1: 监听 Prose 编辑器的更改
cd packages/prose
pnpm dev

# 终端 2: 运行 playground
cd ../..
pnpm dev
```

## 故障排除

### 依赖安装失败

如果遇到依赖安装问题，尝试：

```bash
# 清理所有 node_modules
rm -rf node_modules packages/*/node_modules apps/*/node_modules

# 清理 pnpm 缓存
pnpm store prune

# 重新安装
pnpm install
```

### 构建失败

确保 Node.js 版本正确：

```bash
node --version  # 应该 >= 18.0.0
```

### 编辑器不显示

检查浏览器控制台是否有错误，确保：
1. 依赖已正确安装
2. Prose 编辑器包已构建
3. playground 应用已正确引入组件

## 新功能使用

### 分栏布局

点击工具栏中的分栏按钮：
- 📊 两栏按钮：插入 2 栏布局
- 📊 三栏按钮：插入 3 栏布局

### 高亮块

点击工具栏中的高亮块按钮：
- 📘 信息块：蓝色背景，用于提示信息
- ⚠️ 警告块：黄色背景，用于警告内容
- ✅ 成功块：绿色背景，用于成功状态
- ❌ 错误块：红色背景，用于错误信息
- 📝 笔记块：灰色背景，用于笔记内容

## 下一步

- 查看 [packages/prose/README.md](../packages/prose/README.md) 了解详细的 API 文档
- 探索 [apps/playground/src/App.vue](../apps/playground/src/App.vue) 查看使用示例
- 自定义编辑器样式和功能

## 需要帮助？

如果遇到问题，请检查：
1. Node.js 版本是否正确（>= 18.0.0）
2. 所有依赖是否已安装
3. 构建是否成功
4. 浏览器控制台是否有错误信息
