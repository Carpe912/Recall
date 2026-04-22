# 🚀 快速启动指南

## 问题诊断

你遇到的构建失败是因为 **Node.js 版本过低**。当前是 v14.21.3，需要 >= 18.0.0。

## 解决方案

### 方法 1: 使用启动脚本（推荐）

```bash
# 1. 先切换 Node.js 版本
nvm use 18

# 如果没有安装 Node.js 18
nvm install 18
nvm use 18

# 2. 运行启动脚本
./start.sh
```

### 方法 2: 手动执行

```bash
# 1. 切换 Node.js 版本
nvm use 18

# 2. 验证版本
node --version  # 应该显示 v18.x.x 或更高

# 3. 安装依赖
pnpm install

# 4. 构建 Prose 编辑器
cd packages/prose
pnpm build
cd ../..

# 5. 启动开发服务器
pnpm dev
```

## 常见问题

### Q: 提示 "nvm: command not found"
**A:** 需要先安装 nvm：
```bash
# macOS/Linux
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 重启终端后
nvm install 18
nvm use 18
```

### Q: pnpm 命令不存在
**A:** 安装 pnpm：
```bash
npm install -g pnpm
```

### Q: 构建时提示找不到模块
**A:** 确保依赖已安装：
```bash
# 清理并重新安装
rm -rf node_modules packages/*/node_modules apps/*/node_modules
pnpm install
```

### Q: 端口被占用
**A:** 修改端口或关闭占用进程：
```bash
# 查找占用 5173 端口的进程
lsof -ti:5173

# 关闭进程
kill -9 $(lsof -ti:5173)
```

## 验证安装

启动成功后，你应该看到：

```
  VITE v5.0.0  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

在浏览器中打开 http://localhost:5173，点击 **"Prose 编辑器"** 标签页。

## 测试新功能

### 分栏布局
1. 点击工具栏中的 **两栏按钮** (📊) 或 **三栏按钮** (📊)
2. 在每一栏中独立输入内容

### 高亮块
点击工具栏中的高亮块按钮：
- 📘 **信息块** - 蓝色背景
- ⚠️ **警告块** - 黄色背景  
- ✅ **成功块** - 绿色背景
- ❌ **错误块** - 红色背景
- 📝 **笔记块** - 灰色背景

## 开发模式

如果需要实时修改 Prose 编辑器代码：

```bash
# 终端 1: 监听 Prose 编辑器变化
cd packages/prose
pnpm dev

# 终端 2: 运行 playground
cd ../..
pnpm dev
```

## 项目结构

```
Recall/
├── packages/prose/              # Prose 编辑器包
│   ├── src/
│   │   ├── components/          # Vue 组件
│   │   ├── extensions/          # 自定义扩展
│   │   │   ├── Columns.ts       # 分栏功能
│   │   │   └── Callout.ts       # 高亮块功能
│   │   └── styles/              # 样式文件
│   └── package.json
├── apps/playground/             # 演示应用
│   └── src/App.vue
├── start.sh                     # 快速启动脚本
└── PROSE_SETUP.md              # 详细安装指南
```

## 需要帮助？

如果仍然遇到问题：

1. 确认 Node.js 版本：`node --version`
2. 确认 pnpm 版本：`pnpm --version`
3. 查看完整错误日志
4. 检查 [PROSE_SETUP.md](./PROSE_SETUP.md) 获取更多信息
