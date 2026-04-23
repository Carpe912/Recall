<template>
  <div class="workspace">
    <Sidebar />

    <main class="main">
      <!-- Empty state -->
      <div v-if="!ws.activeDoc" class="empty-state">
        <div class="empty-icon">✦</div>
        <p class="empty-title">选择或新建一个文档</p>
        <p class="empty-sub">点击左侧文档，或使用「新建文档」按钮开始</p>
        <div class="empty-actions">
          <button class="btn-primary" @click="ws.createDocument('prose')">新建文档</button>
          <button class="btn-secondary" @click="ws.createDocument('whiteboard')">新建白板</button>
        </div>
      </div>

      <!-- Editor -->
      <DocumentEditor v-else :doc="ws.activeDoc" :key="ws.activeDoc.id" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useWorkspaceStore } from '../stores/workspace'
import Sidebar from '../components/Sidebar.vue'
import DocumentEditor from '../components/DocumentEditor.vue'

const ws = useWorkspaceStore()
onMounted(() => ws.loadAll())
</script>

<style scoped>
.workspace {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: #fff;
}

.main {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #6b7280;
}

.empty-icon {
  font-size: 36px;
  color: #d1d5db;
  margin-bottom: 8px;
}

.empty-title {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
}

.empty-sub {
  font-size: 13.5px;
  color: #9ca3af;
}

.empty-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.btn-primary {
  padding: 9px 20px;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
}
.btn-primary:hover { background: #1d4ed8; }

.btn-secondary {
  padding: 9px 20px;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
}
.btn-secondary:hover { background: #e5e7eb; }
</style>
