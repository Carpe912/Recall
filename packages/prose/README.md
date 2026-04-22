# Recall Prose 编辑器

基于 Tiptap 的功能丰富的散文编辑器，专为 Recall 协作知识平台打造。

## 功能特性

### 文本格式
- **基础格式**: 粗体、斜体、下划线、删除线
- **标题**: H1-H6 多级标题
- **行内代码**: 代码高亮显示
- **文本颜色**: 自定义文字颜色
- **背景高亮**: 多色背景高亮

### 段落和对齐
- **文本对齐**: 左对齐、居中、右对齐、两端对齐
- **引用块**: 优雅的引用样式
- **代码块**: 带语法高亮的代码块
- **分割线**: 水平分割线

### 列表
- **无序列表**: 项目符号列表
- **有序列表**: 数字编号列表
- **任务列表**: 可勾选的待办事项列表，支持嵌套

### 多媒体
- **链接**: 插入和编辑超链接
- **图片**: 支持 URL 和 Base64 图片
- **表格**: 可调整大小的表格，支持表头

### 自定义功能 ✨
- **分栏布局**: 支持 2 栏和 3 栏布局，适合并排展示内容
- **高亮块 (Callout)**: 5 种类型的信息块
  - 📘 **信息块** (info): 展示提示信息
  - ⚠️ **警告块** (warning): 显示警告内容
  - ✅ **成功块** (success): 标记成功状态
  - ❌ **错误块** (error): 突出错误信息
  - 📝 **笔记块** (note): 记录笔记内容

### 编辑功能
- **撤销/重做**: 完整的历史记录支持（100 步）
- **占位符**: 自定义占位符文本
- **拖放**: 拖放光标和间隙光标
- **清除格式**: 一键清除所有格式

## 安装

```bash
pnpm install @recall/prose
```

## 使用方法

### 基础用法

```vue
<script setup>
import { ref } from 'vue'
import { ProseEditor } from '@recall/prose'
import '@recall/prose/style.css'

const content = ref('<p>Hello World!</p>')
</script>

<template>
  <ProseEditor
    v-model="content"
    placeholder="开始输入..."
    :editable="true"
    :show-toolbar="true"
  />
</template>
```

## 工具栏功能

- 撤销/重做
- 文本格式（粗体、斜体、下划线、删除线、行内代码）
- 标题（H1、H2、H3）
- 文本对齐（左、中、右）
- 列表（无序、有序、任务）
- 引用块、代码块、分割线
- 链接、图片、表格
- **分栏**（2 栏、3 栏）
- **高亮块**（信息、警告、成功、错误、笔记）
- 文字颜色、背景高亮
- 清除格式

## 技术栈

- [Tiptap](https://tiptap.dev/) - 富文本编辑器框架
- [Vue 3](https://vuejs.org/) - 前端框架
- [TypeScript](https://www.typescriptlang.org/) - 类型支持
- [Vite](https://vitejs.dev/) - 构建工具

## 许可证

MIT
