<template>
  <div>
    <div
      v-for="doc in docs"
      :key="doc.id"
      class="doc-item"
      :class="{ active: ws.activeDocId === doc.id }"
      @click="ws.openDocument(doc.id)"
    >
      <span class="doc-icon">{{ doc.type === 'whiteboard' ? '⬡' : '¶' }}</span>
      <span class="doc-title">{{ doc.title || '无标题' }}</span>
      <button class="doc-del" @click.stop="ws.deleteDocument(doc.id)" title="删除">✕</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useWorkspaceStore } from '../stores/workspace'
import type { Document } from '../stores/workspace'

defineProps<{ docs: Document[] }>()
const ws = useWorkspaceStore()
</script>

<style scoped>
.doc-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: #374151;
  user-select: none;
  position: relative;
}
.doc-item:hover { background: #f3f4f6; }
.doc-item.active { background: #eff6ff; color: #1d4ed8; }

.doc-icon { font-size: 11px; color: #9ca3af; flex-shrink: 0; }
.active .doc-icon { color: #93c5fd; }

.doc-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.doc-del {
  display: none;
  border: none;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  font-size: 10px;
  padding: 2px 4px;
  border-radius: 4px;
  flex-shrink: 0;
}
.doc-item:hover .doc-del { display: block; }
.doc-del:hover { background: #fee2e2; color: #ef4444; }
</style>
