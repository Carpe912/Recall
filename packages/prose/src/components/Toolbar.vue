<script setup lang="ts">
import { computed } from 'vue'
import type { Editor } from '@tiptap/core'

const props = defineProps<{ editor: Editor | null | undefined }>()

const active = (name: string, attrs?: Record<string, any>) =>
  props.editor ? (attrs ? props.editor.isActive(name, attrs) : props.editor.isActive(name)) : false

const canUndo = computed(() => props.editor?.can().undo() ?? false)
const canRedo = computed(() => props.editor?.can().redo() ?? false)

const setLink = () => {
  const prev = props.editor?.getAttributes('link').href as string | undefined
  const url = window.prompt('输入链接地址:', prev ?? '')
  if (url === null) return
  if (url === '') {
    props.editor?.chain().focus().extendMarkRange('link').unsetLink().run()
  } else {
    props.editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }
}

const addImage = () => {
  const url = window.prompt('输入图片地址:')
  if (url) props.editor?.chain().focus().setImage({ src: url }).run()
}

const setColor = (e: Event) => {
  const color = (e.target as HTMLInputElement).value
  props.editor?.chain().focus().setColor(color).run()
}

const setHighlight = (e: Event) => {
  const color = (e.target as HTMLInputElement).value
  props.editor?.chain().focus().setHighlight({ color }).run()
}
</script>

<template>
  <div class="toolbar" v-if="editor">
    <!-- History -->
    <button class="tb-btn" :disabled="!canUndo" @click="editor.chain().focus().undo().run()" title="撤销">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
        <path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/>
      </svg>
    </button>
    <button class="tb-btn" :disabled="!canRedo" @click="editor.chain().focus().redo().run()" title="重做">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
        <path d="M21 7v6h-6"/><path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7"/>
      </svg>
    </button>

    <div class="tb-sep"/>

    <!-- Text style -->
    <button class="tb-btn" :class="{ 'is-active': active('bold') }" @click="editor.chain().focus().toggleBold().run()" title="粗体">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
        <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
      </svg>
    </button>
    <button class="tb-btn" :class="{ 'is-active': active('italic') }" @click="editor.chain().focus().toggleItalic().run()" title="斜体">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/>
        <line x1="15" y1="4" x2="9" y2="20"/>
      </svg>
    </button>
    <button class="tb-btn" :class="{ 'is-active': active('underline') }" @click="editor.chain().focus().toggleUnderline().run()" title="下划线">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/>
        <line x1="4" y1="21" x2="20" y2="21"/>
      </svg>
    </button>
    <button class="tb-btn" :class="{ 'is-active': active('strike') }" @click="editor.chain().focus().toggleStrike().run()" title="删除线">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M16 4H9a3 3 0 0 0-2.83 4"/><path d="M14 12a4 4 0 0 1 0 8H6"/>
        <line x1="4" y1="12" x2="20" y2="12"/>
      </svg>
    </button>
    <button class="tb-btn" :class="{ 'is-active': active('code') }" @click="editor.chain().focus().toggleCode().run()" title="行内代码">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
      </svg>
    </button>

    <div class="tb-sep"/>

    <!-- Headings -->
    <button class="tb-btn tb-btn--text" :class="{ 'is-active': active('heading', { level: 1 }) }" @click="editor.chain().focus().toggleHeading({ level: 1 }).run()" title="标题 1">H1</button>
    <button class="tb-btn tb-btn--text" :class="{ 'is-active': active('heading', { level: 2 }) }" @click="editor.chain().focus().toggleHeading({ level: 2 }).run()" title="标题 2">H2</button>
    <button class="tb-btn tb-btn--text" :class="{ 'is-active': active('heading', { level: 3 }) }" @click="editor.chain().focus().toggleHeading({ level: 3 }).run()" title="标题 3">H3</button>

    <div class="tb-sep"/>

    <!-- Align -->
    <button class="tb-btn" :class="{ 'is-active': active('paragraph', { textAlign: 'left' }) || active('heading', { textAlign: 'left' }) }" @click="editor.chain().focus().setTextAlign('left').run()" title="左对齐">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
        <line x1="21" y1="6" x2="3" y2="6"/><line x1="17" y1="10" x2="3" y2="10"/>
        <line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/>
      </svg>
    </button>
    <button class="tb-btn" :class="{ 'is-active': active('paragraph', { textAlign: 'center' }) || active('heading', { textAlign: 'center' }) }" @click="editor.chain().focus().setTextAlign('center').run()" title="居中">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
        <line x1="21" y1="6" x2="3" y2="6"/><line x1="18" y1="10" x2="6" y2="10"/>
        <line x1="21" y1="14" x2="3" y2="14"/><line x1="18" y1="18" x2="6" y2="18"/>
      </svg>
    </button>
    <button class="tb-btn" :class="{ 'is-active': active('paragraph', { textAlign: 'right' }) || active('heading', { textAlign: 'right' }) }" @click="editor.chain().focus().setTextAlign('right').run()" title="右对齐">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
        <line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="10" x2="7" y2="10"/>
        <line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="7" y2="18"/>
      </svg>
    </button>

    <div class="tb-sep"/>

    <!-- Lists -->
    <button class="tb-btn" :class="{ 'is-active': active('bulletList') }" @click="editor.chain().focus().toggleBulletList().run()" title="无序列表">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
        <line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/>
        <line x1="9" y1="18" x2="20" y2="18"/>
        <circle cx="4" cy="6" r="1.5" fill="currentColor"/><circle cx="4" cy="12" r="1.5" fill="currentColor"/>
        <circle cx="4" cy="18" r="1.5" fill="currentColor"/>
      </svg>
    </button>
    <button class="tb-btn" :class="{ 'is-active': active('orderedList') }" @click="editor.chain().focus().toggleOrderedList().run()" title="有序列表">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
        <line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/>
        <line x1="10" y1="18" x2="21" y2="18"/>
        <path d="M4 6h1v4"/><path d="M4 10h2"/>
        <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>
      </svg>
    </button>
    <button class="tb-btn" :class="{ 'is-active': active('taskList') }" @click="editor.chain().focus().toggleTaskList().run()" title="任务列表">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
        <rect x="3" y="5" width="6" height="6" rx="1"/>
        <path d="M6 10l1 1 2-2"/>
        <line x1="13" y1="8" x2="21" y2="8"/>
        <rect x="3" y="13" width="6" height="6" rx="1"/>
        <line x1="13" y1="16" x2="21" y2="16"/>
      </svg>
    </button>

    <div class="tb-sep"/>

    <!-- Block elements -->
    <button class="tb-btn" :class="{ 'is-active': active('blockquote') }" @click="editor.chain().focus().toggleBlockquote().run()" title="引用">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
        <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>
        <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>
      </svg>
    </button>
    <button class="tb-btn" :class="{ 'is-active': active('codeBlock') }" @click="editor.chain().focus().toggleCodeBlock().run()" title="代码块">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
        <rect x="2" y="4" width="20" height="16" rx="3"/>
        <path d="M9 9l-3 3 3 3"/><path d="M15 9l3 3-3 3"/>
      </svg>
    </button>
    <button class="tb-btn" @click="editor.chain().focus().setHorizontalRule().run()" title="分割线">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
        <line x1="3" y1="12" x2="21" y2="12"/>
      </svg>
    </button>

    <div class="tb-sep"/>

    <!-- Insert -->
    <button class="tb-btn" :class="{ 'is-active': active('link') }" @click="setLink" title="链接">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </svg>
    </button>
    <button class="tb-btn" @click="addImage" title="图片">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
      </svg>
    </button>
    <button class="tb-btn" @click="editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()" title="表格">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/>
        <line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/>
      </svg>
    </button>

    <div class="tb-sep"/>

    <!-- Columns -->
    <button class="tb-btn" @click="editor.chain().focus().setColumns(2).run()" title="2 栏布局">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
        <rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="18" rx="1"/>
      </svg>
    </button>
    <button class="tb-btn" @click="editor.chain().focus().setColumns(3).run()" title="3 栏布局">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
        <rect x="2" y="3" width="5" height="18" rx="1"/><rect x="9.5" y="3" width="5" height="18" rx="1"/>
        <rect x="17" y="3" width="5" height="18" rx="1"/>
      </svg>
    </button>

    <div class="tb-sep"/>

    <!-- Callout -->
    <button class="tb-btn" @click="editor.chain().focus().setCallout('info').run()" title="信息块">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.2">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
    </button>
    <button class="tb-btn" @click="editor.chain().focus().setCallout('warning').run()" title="警告块">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    </button>
    <button class="tb-btn" @click="editor.chain().focus().setCallout('success').run()" title="成功块">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    </button>
    <button class="tb-btn" @click="editor.chain().focus().setCallout('error').run()" title="错误块">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.2">
        <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    </button>

    <div class="tb-sep"/>

    <!-- Colors -->
    <label class="tb-color-btn" title="文字颜色">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.1 2a1 1 0 0 0-.9.6L5.5 18H8l1.7-4.5h4.6L16 18h2.5L13 2.6a1 1 0 0 0-.9-.6zm-1.7 9.5L12 6.9l1.6 4.6H10.4z"/>
        <rect x="3" y="20" width="18" height="2.5" rx="1"/>
      </svg>
      <input type="color" @input="setColor" value="#1a1a1a">
    </label>
    <label class="tb-color-btn" title="背景高亮">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
      <input type="color" @input="setHighlight" value="#fde68a">
    </label>

    <div class="tb-sep"/>

    <!-- Clear -->
    <button class="tb-btn" @click="editor.chain().focus().clearNodes().unsetAllMarks().run()" title="清除格式">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
        <line x1="3" y1="3" x2="21" y2="21"/>
      </svg>
    </button>

  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1px;
  padding: 6px 12px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.tb-sep {
  width: 1px;
  height: 20px;
  background: #e8e8e8;
  margin: 0 4px;
  flex-shrink: 0;
}

.tb-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  border: none;
  background: transparent;
  border-radius: 5px;
  cursor: pointer;
  color: #4b5563;
  transition: background 0.12s, color 0.12s;
  flex-shrink: 0;
}

.tb-btn--text {
  width: auto;
  padding: 0 6px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.tb-btn:hover:not(:disabled) {
  background: #f3f4f6;
  color: #111;
}

.tb-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.tb-btn.is-active {
  background: #eff6ff;
  color: #2563eb;
}

.tb-color-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  background: transparent;
  border-radius: 5px;
  cursor: pointer;
  color: #4b5563;
  transition: background 0.12s;
  position: relative;
  flex-shrink: 0;
}

.tb-color-btn:hover {
  background: #f3f4f6;
  color: #111;
}

.tb-color-btn input[type="color"] {
  position: absolute;
  inset: 0;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
  border: none;
  padding: 0;
}
</style>
