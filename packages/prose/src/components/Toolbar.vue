<script setup lang="ts">
import { Editor } from '@tiptap/core'
import { computed } from 'vue'

interface Props {
  editor: Editor | null | undefined
}

const props = defineProps<Props>()

const isActive = (name: string, attrs?: Record<string, any>) => {
  if (!props.editor) return false
  if (attrs) {
    return props.editor.isActive(name, attrs)
  }
  return props.editor.isActive(name)
}

const canUndo = computed(() => props.editor?.can().undo() || false)
const canRedo = computed(() => props.editor?.can().redo() || false)

const setLink = () => {
  const url = window.prompt('输入链接地址:')
  if (url) {
    props.editor?.chain().focus().setLink({ href: url }).run()
  }
}

const addImage = () => {
  const url = window.prompt('输入图片地址:')
  if (url) {
    props.editor?.chain().focus().setImage({ src: url }).run()
  }
}

const insertTable = () => {
  props.editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
}

const setColor = (color: string) => {
  props.editor?.chain().focus().setColor(color).run()
}

const setHighlight = (color: string) => {
  props.editor?.chain().focus().setHighlight({ color }).run()
}

const insertColumns = (count: number = 2) => {
  props.editor?.chain().focus().setColumns(count).run()
}

const insertCallout = (type: string = 'info') => {
  props.editor?.chain().focus().setCallout(type).run()
}
</script>

<template>
  <div class="toolbar">
    <div class="toolbar-group">
      <button
        @click="editor?.chain().focus().undo().run()"
        :disabled="!canUndo"
        title="撤销"
        class="toolbar-button"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 7v6h6" />
          <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" />
        </svg>
      </button>
      <button
        @click="editor?.chain().focus().redo().run()"
        :disabled="!canRedo"
        title="重做"
        class="toolbar-button"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 7v6h-6" />
          <path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7" />
        </svg>
      </button>
    </div>

    <div class="toolbar-divider"></div>

    <div class="toolbar-group">
      <button
        @click="editor?.chain().focus().toggleBold().run()"
        :class="{ 'is-active': isActive('bold') }"
        title="粗体"
        class="toolbar-button"
      >
        <strong>B</strong>
      </button>
      <button
        @click="editor?.chain().focus().toggleItalic().run()"
        :class="{ 'is-active': isActive('italic') }"
        title="斜体"
        class="toolbar-button"
      >
        <em>I</em>
      </button>
      <button
        @click="editor?.chain().focus().toggleUnderline().run()"
        :class="{ 'is-active': isActive('underline') }"
        title="下划线"
        class="toolbar-button"
      >
        <u>U</u>
      </button>
      <button
        @click="editor?.chain().focus().toggleStrike().run()"
        :class="{ 'is-active': isActive('strike') }"
        title="删除线"
        class="toolbar-button"
      >
        <s>S</s>
      </button>
      <button
        @click="editor?.chain().focus().toggleCode().run()"
        :class="{ 'is-active': isActive('code') }"
        title="行内代码"
        class="toolbar-button"
      >
        <code>&lt;/&gt;</code>
      </button>
    </div>

    <div class="toolbar-divider"></div>

    <div class="toolbar-group">
      <button
        @click="editor?.chain().focus().toggleHeading({ level: 1 }).run()"
        :class="{ 'is-active': isActive('heading', { level: 1 }) }"
        title="标题 1"
        class="toolbar-button"
      >
        H1
      </button>
      <button
        @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()"
        :class="{ 'is-active': isActive('heading', { level: 2 }) }"
        title="标题 2"
        class="toolbar-button"
      >
        H2
      </button>
      <button
        @click="editor?.chain().focus().toggleHeading({ level: 3 }).run()"
        :class="{ 'is-active': isActive('heading', { level: 3 }) }"
        title="标题 3"
        class="toolbar-button"
      >
        H3
      </button>
    </div>

    <div class="toolbar-divider"></div>

    <div class="toolbar-group">
      <button
        @click="editor?.chain().focus().setTextAlign('left').run()"
        :class="{ 'is-active': isActive('paragraph', { textAlign: 'left' }) || isActive('heading', { textAlign: 'left' }) }"
        title="左对齐"
        class="toolbar-button"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="17" y1="10" x2="3" y2="10" />
          <line x1="21" y1="6" x2="3" y2="6" />
          <line x1="21" y1="14" x2="3" y2="14" />
          <line x1="17" y1="18" x2="3" y2="18" />
        </svg>
      </button>
      <button
        @click="editor?.chain().focus().setTextAlign('center').run()"
        :class="{ 'is-active': isActive('paragraph', { textAlign: 'center' }) || isActive('heading', { textAlign: 'center' }) }"
        title="居中对齐"
        class="toolbar-button"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="10" x2="6" y2="10" />
          <line x1="21" y1="6" x2="3" y2="6" />
          <line x1="21" y1="14" x2="3" y2="14" />
          <line x1="18" y1="18" x2="6" y2="18" />
        </svg>
      </button>
      <button
        @click="editor?.chain().focus().setTextAlign('right').run()"
        :class="{ 'is-active': isActive('paragraph', { textAlign: 'right' }) || isActive('heading', { textAlign: 'right' }) }"
        title="右对齐"
        class="toolbar-button"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="21" y1="10" x2="7" y2="10" />
          <line x1="21" y1="6" x2="3" y2="6" />
          <line x1="21" y1="14" x2="3" y2="14" />
          <line x1="21" y1="18" x2="7" y2="18" />
        </svg>
      </button>
    </div>

    <div class="toolbar-divider"></div>

    <div class="toolbar-group">
      <button
        @click="editor?.chain().focus().toggleBulletList().run()"
        :class="{ 'is-active': isActive('bulletList') }"
        title="无序列表"
        class="toolbar-button"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <circle cx="4" cy="6" r="1" fill="currentColor" />
          <circle cx="4" cy="12" r="1" fill="currentColor" />
          <circle cx="4" cy="18" r="1" fill="currentColor" />
        </svg>
      </button>
      <button
        @click="editor?.chain().focus().toggleOrderedList().run()"
        :class="{ 'is-active': isActive('orderedList') }"
        title="有序列表"
        class="toolbar-button"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="10" y1="6" x2="21" y2="6" />
          <line x1="10" y1="12" x2="21" y2="12" />
          <line x1="10" y1="18" x2="21" y2="18" />
          <path d="M4 6h1v4" />
          <path d="M4 10h2" />
          <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
        </svg>
      </button>
      <button
        @click="editor?.chain().focus().toggleTaskList().run()"
        :class="{ 'is-active': isActive('taskList') }"
        title="任务列表"
        class="toolbar-button"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="5" width="6" height="6" rx="1" />
          <path d="M6 10l1 1 2-2" />
          <line x1="12" y1="8" x2="21" y2="8" />
          <rect x="3" y="13" width="6" height="6" rx="1" />
          <line x1="12" y1="16" x2="21" y2="16" />
        </svg>
      </button>
    </div>

    <div class="toolbar-divider"></div>

    <div class="toolbar-group">
      <button
        @click="editor?.chain().focus().toggleBlockquote().run()"
        :class="{ 'is-active': isActive('blockquote') }"
        title="引用"
        class="toolbar-button"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
          <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
        </svg>
      </button>
      <button
        @click="editor?.chain().focus().toggleCodeBlock().run()"
        :class="{ 'is-active': isActive('codeBlock') }"
        title="代码块"
        class="toolbar-button"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      </button>
      <button
        @click="editor?.chain().focus().setHorizontalRule().run()"
        title="分割线"
        class="toolbar-button"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="12" x2="21" y2="12" />
        </svg>
      </button>
    </div>

    <div class="toolbar-divider"></div>

    <div class="toolbar-group">
      <button
        @click="setLink"
        :class="{ 'is-active': isActive('link') }"
        title="插入链接"
        class="toolbar-button"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      </button>
      <button
        @click="addImage"
        title="插入图片"
        class="toolbar-button"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </button>
      <button
        @click="insertTable"
        title="插入表格"
        class="toolbar-button"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="3" y1="15" x2="21" y2="15" />
          <line x1="12" y1="3" x2="12" y2="21" />
        </svg>
      </button>
      <button
        @click="insertColumns(2)"
        title="插入两栏"
        class="toolbar-button"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="18" rx="1" />
          <rect x="14" y="3" width="7" height="18" rx="1" />
        </svg>
      </button>
      <button
        @click="insertColumns(3)"
        title="插入三栏"
        class="toolbar-button"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="2" y="3" width="5" height="18" rx="1" />
          <rect x="9.5" y="3" width="5" height="18" rx="1" />
          <rect x="17" y="3" width="5" height="18" rx="1" />
        </svg>
      </button>
    </div>

    <div class="toolbar-divider"></div>

    <div class="toolbar-group">
      <button
        @click="insertCallout('info')"
        title="信息块"
        class="toolbar-button"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      </button>
      <button
        @click="insertCallout('warning')"
        title="警告块"
        class="toolbar-button"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </button>
      <button
        @click="insertCallout('success')"
        title="成功块"
        class="toolbar-button"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </button>
      <button
        @click="insertCallout('error')"
        title="错误块"
        class="toolbar-button"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      </button>
      <button
        @click="insertCallout('note')"
        title="笔记块"
        class="toolbar-button"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <line x1="10" y1="9" x2="8" y2="9" />
        </svg>
      </button>
    </div>

    <div class="toolbar-divider"></div>

    <div class="toolbar-group">
      <div class="color-picker">
        <label title="文字颜色">
          A
          <input
            type="color"
            @input="(e) => setColor((e.target as HTMLInputElement).value)"
            value="#000000"
          />
        </label>
      </div>
      <div class="color-picker">
        <label title="背景高亮">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
          <input
            type="color"
            @input="(e) => setHighlight((e.target as HTMLInputElement).value)"
            value="#ffff00"
          />
        </label>
      </div>
    </div>

    <div class="toolbar-divider"></div>

    <div class="toolbar-group">
      <button
        @click="editor?.chain().focus().clearNodes().unsetAllMarks().run()"
        title="清除格式"
        class="toolbar-button"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 7h16" />
          <path d="M10 11v8" />
          <path d="M14 11v8" />
          <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12" />
          <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 8px;
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  align-items: center;
}

.toolbar-group {
  display: flex;
  gap: 2px;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: #dee2e6;
  margin: 0 4px;
}

.toolbar-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid transparent;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  color: #495057;
  transition: all 0.15s;
}

.toolbar-button:hover:not(:disabled) {
  background: #e9ecef;
  border-color: #dee2e6;
}

.toolbar-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.toolbar-button.is-active {
  background: #228be6;
  color: white;
  border-color: #228be6;
}

.color-picker {
  position: relative;
}

.color-picker label {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid transparent;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  color: #495057;
  transition: all 0.15s;
  font-weight: bold;
  font-size: 14px;
}

.color-picker label:hover {
  background: #e9ecef;
  border-color: #dee2e6;
}

.color-picker input[type="color"] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}
</style>
