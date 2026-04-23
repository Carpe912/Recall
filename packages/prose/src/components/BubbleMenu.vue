<template>
  <div v-if="editor" class="bubble-menu">

    <!-- 主行：始终可见 -->
    <div class="bubble-row">
      <button class="bb" :class="{ on: editor.isActive('bold') }"
        @mousedown.prevent="editor.chain().focus().toggleBold().run()" title="粗体">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
          <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
        </svg>
      </button>
      <button class="bb" :class="{ on: editor.isActive('italic') }"
        @mousedown.prevent="editor.chain().focus().toggleItalic().run()" title="斜体">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/>
          <line x1="15" y1="4" x2="9" y2="20"/>
        </svg>
      </button>
      <button class="bb" :class="{ on: editor.isActive('underline') }"
        @mousedown.prevent="editor.chain().focus().toggleUnderline().run()" title="下划线">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/>
          <line x1="4" y1="21" x2="20" y2="21"/>
        </svg>
      </button>
      <button class="bb" :class="{ on: editor.isActive('strike') }"
        @mousedown.prevent="editor.chain().focus().toggleStrike().run()" title="删除线">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M16 4H9a3 3 0 0 0-2.83 4"/><path d="M14 12a4 4 0 0 1 0 8H6"/>
          <line x1="4" y1="12" x2="20" y2="12"/>
        </svg>
      </button>
      <button class="bb" :class="{ on: editor.isActive('code') }"
        @mousedown.prevent="editor.chain().focus().toggleCode().run()" title="行内代码">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
        </svg>
      </button>

      <div class="bs"/>

      <button class="bb" :class="{ on: editor.isActive('link') }"
        @mousedown.prevent="toggleLink" title="链接">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
      </button>

      <div class="bs"/>

      <button class="bb bt" :class="{ on: editor.isActive('heading', { level: 1 }) }"
        @mousedown.prevent="editor.chain().focus().toggleHeading({ level: 1 }).run()" title="标题 1">H1</button>
      <button class="bb bt" :class="{ on: editor.isActive('heading', { level: 2 }) }"
        @mousedown.prevent="editor.chain().focus().toggleHeading({ level: 2 }).run()" title="标题 2">H2</button>
      <button class="bb bt" :class="{ on: editor.isActive('heading', { level: 3 }) }"
        @mousedown.prevent="editor.chain().focus().toggleHeading({ level: 3 }).run()" title="标题 3">H3</button>

      <div class="bs"/>

      <!-- 更多 -->
      <button class="bb bt" :class="{ on: showMore }"
        @mousedown.prevent="showMore = !showMore" title="更多选项">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
        </svg>
      </button>
    </div>

    <!-- 次行：颜色 / 对齐 / 清除 -->
    <template v-if="showMore">
      <div class="bh"/>
      <div class="bubble-row">
        <!-- 文字颜色 -->
        <label class="bb bb-color" title="文字颜色">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.1 2a1 1 0 0 0-.9.6L5.5 18H8l1.7-4.5h4.6L16 18h2.5L13 2.6a1 1 0 0 0-.9-.6zm-1.7 9.5L12 6.9l1.6 4.6H10.4z"/>
            <rect x="3" y="20" width="18" height="2.5" rx="1" :fill="currentTextColor"/>
          </svg>
          <input type="color" :value="currentTextColor" @input="setTextColor">
        </label>

        <!-- 高亮 -->
        <label class="bb bb-color" :class="{ on: editor.isActive('highlight') }" title="高亮颜色">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
              :fill="editor.isActive('highlight') ? currentHighlight : 'none'"/>
          </svg>
          <input type="color" :value="currentHighlight" @input="setHighlight">
        </label>

        <div class="bs"/>

        <!-- 对齐 -->
        <button class="bb" :class="{ on: editor.isActive({ textAlign: 'left' }) }"
          @mousedown.prevent="editor.chain().focus().setTextAlign('left').run()" title="左对齐">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="10" x2="15" y2="10"/>
            <line x1="3" y1="14" x2="21" y2="14"/><line x1="3" y1="18" x2="15" y2="18"/>
          </svg>
        </button>
        <button class="bb" :class="{ on: editor.isActive({ textAlign: 'center' }) }"
          @mousedown.prevent="editor.chain().focus().setTextAlign('center').run()" title="居中">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="10" x2="18" y2="10"/>
            <line x1="3" y1="14" x2="21" y2="14"/><line x1="6" y1="18" x2="18" y2="18"/>
          </svg>
        </button>
        <button class="bb" :class="{ on: editor.isActive({ textAlign: 'right' }) }"
          @mousedown.prevent="editor.chain().focus().setTextAlign('right').run()" title="右对齐">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="10" x2="21" y2="10"/>
            <line x1="3" y1="14" x2="21" y2="14"/><line x1="9" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        <div class="bs"/>

        <!-- 清除格式 -->
        <button class="bb"
          @mousedown.prevent="editor.chain().focus().clearNodes().unsetAllMarks().run()" title="清除格式">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            <line x1="3" y1="3" x2="21" y2="21"/>
          </svg>
        </button>
      </div>
    </template>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Editor } from '@tiptap/core'

const props = defineProps<{ editor: Editor | null }>()

const showMore = ref(false)

const currentTextColor = computed(() =>
  props.editor?.getAttributes('textStyle').color ?? '#1a1a1a'
)
const currentHighlight = computed(() =>
  props.editor?.getAttributes('highlight').color ?? '#fde68a'
)

const setTextColor = (e: Event) => {
  const color = (e.target as HTMLInputElement).value
  props.editor?.chain().focus().setColor(color).run()
}
const setHighlight = (e: Event) => {
  const color = (e.target as HTMLInputElement).value
  props.editor?.chain().focus().setHighlight({ color }).run()
}

const toggleLink = () => {
  if (!props.editor) return
  if (props.editor.isActive('link')) {
    props.editor.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }
  const url = window.prompt('输入链接地址:')
  if (url) props.editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}

</script>

<style scoped>
.bubble-menu {
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 4px 5px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04);
  user-select: none;
}

.bubble-row {
  display: flex;
  align-items: center;
  gap: 1px;
}

/* horizontal rule between rows */
.bh {
  height: 1px;
  background: #f0f0f0;
  margin: 3px -5px;
}

/* vertical separator */
.bs {
  width: 1px;
  height: 16px;
  background: #e5e7eb;
  margin: 0 3px;
  flex-shrink: 0;
}

.bb {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 27px;
  height: 27px;
  padding: 0;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  color: #6b7280;
  transition: background 0.1s, color 0.1s;
  flex-shrink: 0;
}

.bt {
  width: auto;
  padding: 0 5px;
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.03em;
  font-family: ui-sans-serif, system-ui, sans-serif;
}

.bb:hover { background: #f3f4f6; color: #111827; }
.bb.on   { background: #eff6ff; color: #2563eb; }

.bb-color {
  position: relative;
  overflow: hidden;
}

.bb-color input[type="color"] {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  border: none;
  padding: 0;
}
</style>
