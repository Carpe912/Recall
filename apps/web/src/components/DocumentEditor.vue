<template>
  <div class="editor-wrap">
    <!-- 富文本编辑器 -->
    <template v-if="doc.type === 'prose'">
      <div class="prose-container">
        <div class="doc-title-wrap">
          <input
            class="doc-title-input"
            :value="doc.title"
            placeholder="无标题"
            @input="onTitleInput"
            @blur="flushTitle"
          />
        </div>
        <ProseEditor
          v-if="editorKey"
          :key="editorKey"
          v-model="localContent"
          placeholder="输入 / 打开命令菜单..."
          :editable="true"
          @update="onProseUpdate"
        />
      </div>
    </template>

    <!-- 白板编辑器 -->
    <template v-else-if="doc.type === 'whiteboard'">
      <div class="whiteboard-header">
        <input
          class="doc-title-input"
          :value="doc.title"
          placeholder="无标题"
          @input="onTitleInput"
          @blur="flushTitle"
        />
      </div>
      <div class="whiteboard-container">
        <!-- Graphite whiteboard placeholder — integrate actual component here -->
        <div class="whiteboard-placeholder">
          <p>🎨 白板编辑器</p>
          <p style="font-size:13px;color:#9ca3af;margin-top:8px;">Graphite 白板组件将在此处渲染</p>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ProseEditor } from '@recall/prose'
import { useWorkspaceStore } from '../stores/workspace'

const ws = useWorkspaceStore()

const props = defineProps<{ doc: any }>()

const localContent = ref('')
const editorKey = ref('')
let titleTimer = 0
let saveTimer = 0
let pendingTitle = ''

// Reset editor when doc changes
watch(() => props.doc?.id, (id) => {
  if (!id) return
  localContent.value = tryParseContent(props.doc.content)
  editorKey.value = id
  pendingTitle = ''
}, { immediate: true })

function tryParseContent(raw: string) {
  // ProseEditor accepts HTML string
  try {
    const parsed = JSON.parse(raw)
    // if it's PM JSON, return empty (ProseEditor expects HTML)
    return typeof parsed === 'object' ? '' : raw
  } catch {
    return raw || ''
  }
}

function onProseUpdate(val: { html: string }) {
  clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => {
    ws.saveDocument(props.doc.id, { content: val.html })
  }, 1000)
}

function onTitleInput(e: Event) {
  pendingTitle = (e.target as HTMLInputElement).value
  clearTimeout(titleTimer)
  titleTimer = window.setTimeout(flushTitle, 800)
}

function flushTitle() {
  if (pendingTitle && pendingTitle !== props.doc.title) {
    ws.saveDocument(props.doc.id, { title: pendingTitle })
  }
}
</script>

<style scoped>
.editor-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.prose-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.doc-title-wrap {
  padding: 32px 48px 0;
  flex-shrink: 0;
}

.doc-title-input {
  width: 100%;
  border: none;
  outline: none;
  font-size: 28px;
  font-weight: 700;
  color: #111;
  font-family: 'DM Sans', sans-serif;
  letter-spacing: -0.02em;
  background: transparent;
  padding: 0;
}

.doc-title-input::placeholder { color: #d1d5db; }

.whiteboard-header {
  padding: 20px 24px 12px;
  border-bottom: 1px solid #f3f4f6;
  flex-shrink: 0;
}

.whiteboard-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
}

.whiteboard-placeholder {
  text-align: center;
  color: #6b7280;
  font-size: 15px;
}
</style>
