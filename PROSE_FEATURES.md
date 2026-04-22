# Prose 编辑器新功能

## ✅ 已完成的功能

### 1. 任务列表对齐修复
- 修复了任务列表的复选框和文本对齐问题
- 现在复选框和文本完美对齐

### 2. 两栏布局（富文本 + Markdown）
- **左侧**：富文本编辑器，支持所有 Tiptap 功能
- **右侧**：Markdown 编辑器，实时同步
- 左右两栏内容实时联动
- 支持双向编辑：
  - 在富文本编辑器中编辑 → 自动转换为 Markdown
  - 在 Markdown 编辑器中编辑 → 自动转换为富文本

### 3. 选中文本悬浮工具栏（Bubble Menu）
- 选中文本后自动显示悬浮工具栏
- 支持的快捷操作：
  - **粗体** (B)
  - *斜体* (I)
  - <u>下划线</u> (U)
  - ~~删除线~~ (S)
  - `代码` (</>)
  - 🔗 链接
  - ✨ 高亮

### 4. 节点拖拽功能
- 使用 Tiptap 内置的 `dropcursor` 扩展
- 可以拖拽段落、标题、列表等节点重新排序
- 拖拽时显示蓝色光标指示插入位置

### 5. 斜线菜单（Slash Commands）
- 输入 `/` 打开命令菜单
- 支持的命令：
  - **标题**：H1, H2, H3
  - **列表**：无序列表、有序列表、任务列表
  - **块元素**：引用块、代码块、分割线、表格
  - **布局**：2 栏布局、3 栏布局
  - **高亮块**：信息块、警告块、成功块、错误块、笔记块
- 支持搜索过滤
- 键盘导航：
  - ↑/↓ 选择命令
  - Enter 执行命令
  - Esc 关闭菜单

## 🎨 使用方法

### 访问编辑器
1. 启动开发服务器：`pnpm dev`
2. 访问 Prose 编辑器：http://localhost:3001/prose.html

### 功能演示

#### 斜线菜单
1. 在编辑器中输入 `/`
2. 菜单自动弹出
3. 输入关键词搜索（如 "标题"、"列表"）
4. 使用方向键选择，Enter 执行

#### 悬浮工具栏
1. 选中任意文本
2. 悬浮工具栏自动出现在选中文本上方
3. 点击按钮快速格式化

#### 拖拽节点
1. 鼠标悬停在段落左侧
2. 按住鼠标左键拖拽
3. 蓝色光标显示插入位置
4. 释放鼠标完成移动

#### Markdown 联动
1. 在左侧富文本编辑器中输入内容
2. 右侧 Markdown 编辑器实时显示对应的 Markdown 代码
3. 也可以在右侧直接编辑 Markdown，左侧会实时更新

## 📦 新增依赖

```json
{
  "@tiptap/extension-bubble-menu": "^2.2.4",
  "@tiptap/suggestion": "^2.2.4",
  "tippy.js": "^6.3.7"
}
```

## 📁 新增文件

- `packages/prose/src/extensions/SlashCommands.ts` - 斜线菜单扩展
- `packages/prose/src/components/SlashMenu.vue` - 斜线菜单 UI 组件
- `packages/prose/src/components/BubbleMenu.vue` - 悬浮工具栏组件

## 🔧 修改的文件

- `packages/prose/src/components/ProseEditorComponent.vue` - 集成新功能
- `packages/prose/src/styles/editor.css` - 修复任务列表对齐
- `packages/prose/src/index.ts` - 导出新组件
- `apps/playground/src/Prose.vue` - 实现两栏布局
- `packages/prose/package.json` - 添加新依赖
- `apps/playground/package.json` - 添加新依赖
- `packages/prose/vite.config.ts` - 标记新依赖为外部依赖

## 🎯 技术要点

### Bubble Menu
- 使用 `@tiptap/extension-bubble-menu` 和 `@tiptap/vue-3` 的 `BubbleMenu` 组件
- 通过 `should-show` 属性控制显示条件
- 使用 `tippy.js` 实现定位和动画

### Slash Commands
- 使用 `@tiptap/suggestion` 实现建议系统
- 通过 `VueRenderer` 渲染 Vue 组件
- 使用 `tippy.js` 实现弹出菜单定位

### 拖拽功能
- 使用 Tiptap 内置的 `dropcursor` 扩展（已在 StarterKit 中包含）
- 无需额外配置即可使用

### Markdown 转换
- 实现了简单的 HTML ↔ Markdown 双向转换
- 支持常用的 Markdown 语法
- 实时同步编辑内容

祝你使用愉快！🎉
