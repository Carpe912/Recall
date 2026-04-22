<template>
  <div class="bubble-menu" v-if="editor">
    <button
      @click="editor.chain().focus().toggleBold().run()"
      :class="{ 'is-active': editor.isActive('bold') }"
      title="粗体"
    >
      <strong>B</strong>
    </button>
    <button
      @click="editor.chain().focus().toggleItalic().run()"
      :class="{ 'is-active': editor.isActive('italic') }"
      title="斜体"
    >
      <em>I</em>
    </button>
    <button
      @click="editor.chain().focus().toggleUnderline().run()"
      :class="{ 'is-active': editor.isActive('underline') }"
      title="下划线"
    >
      <u>U</u>
    </button>
    <button
      @click="editor.chain().focus().toggleStrike().run()"
      :class="{ 'is-active': editor.isActive('strike') }"
      title="删除线"
    >
      <s>S</s>
    </button>
    <div class="separator"></div>
    <button
      @click="editor.chain().focus().toggleCode().run()"
      :class="{ 'is-active': editor.isActive('code') }"
      title="代码"
    >
      &lt;/&gt;
    </button>
    <button
      @click="setLink"
      :class="{ 'is-active': editor.isActive('link') }"
      title="链接"
    >
      🔗
    </button>
    <button
      @click="editor.chain().focus().toggleHighlight().run()"
      :class="{ 'is-active': editor.isActive('highlight') }"
      title="高亮"
    >
      ✨
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Editor } from '@tiptap/core'

const props = defineProps<{
  editor: Editor | null
}>()

const setLink = () => {
  if (!props.editor) return

  const previousUrl = props.editor.getAttributes('link').href
  const url = window.prompt('输入链接地址:', previousUrl)

  if (url === null) {
    return
  }

  if (url === '') {
    props.editor.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }

  props.editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}
</script>

<style scoped>
.bubble-menu {
  display: flex;
  align-items: center;
  gap: 2px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 4px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.bubble-menu button {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #495057;
  transition: all 0.15s;
}

.bubble-menu button:hover {
  background: #f5f5f5;
  color: #212529;
}

.bubble-menu button.is-active {
  background: #228be6;
  color: white;
}

.separator {
  width: 1px;
  height: 20px;
  background: #e0e0e0;
  margin: 0 4px;
}
</style>
