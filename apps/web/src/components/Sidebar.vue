<template>
  <div class="sidebar">
    <!-- Header -->
    <div class="sidebar-header">
      <div class="brand">
        <span class="brand-icon">✦</span>
        <span class="brand-name">Recall</span>
      </div>
      <button class="btn-icon" title="退出" @click="auth.logout(); $router.push('/login')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
      </button>
    </div>

    <!-- New buttons -->
    <div class="new-btns">
      <button class="btn-new" @click="ws.createDocument('prose')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        新建文档
      </button>
      <button class="btn-new btn-new-secondary" @click="ws.createDocument('whiteboard')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        新建白板
      </button>
    </div>

    <!-- Content -->
    <div class="sidebar-content">
      <!-- Root documents (no folder) -->
      <div class="section-label">文档</div>
      <DocList :docs="rootDocs" />

      <!-- Folders -->
      <template v-for="folder in ws.folderTree" :key="folder.id">
        <FolderItem :folder="folder" :all-docs="ws.documents" />
      </template>

      <!-- New folder -->
      <button class="btn-new-folder" @click="addFolder">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        新建文件夹
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useWorkspaceStore } from '../stores/workspace'
import DocList from './DocList.vue'
import FolderItem from './FolderItem.vue'

const auth = useAuthStore()
const ws = useWorkspaceStore()

const rootDocs = computed(() => ws.documents.filter(d => !d.folderId))

async function addFolder() {
  const name = prompt('文件夹名称')
  if (name?.trim()) await ws.createFolder(name.trim())
}
</script>

<style scoped>
.sidebar {
  width: 240px;
  min-width: 240px;
  height: 100vh;
  background: #f9fafb;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 14px 12px;
  flex-shrink: 0;
}

.brand {
  display: flex;
  align-items: center;
  gap: 6px;
}

.brand-icon { font-size: 16px; color: #2563eb; }
.brand-name { font-size: 15px; font-weight: 700; color: #111; letter-spacing: -0.02em; }

.btn-icon {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 5px;
  cursor: pointer;
  color: #9ca3af;
}
.btn-icon:hover { background: #e5e7eb; color: #374151; }

.new-btns {
  display: flex;
  gap: 6px;
  padding: 0 10px 10px;
  flex-shrink: 0;
}

.btn-new {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 7px 0;
  border: none;
  border-radius: 7px;
  font-size: 12.5px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  background: #2563eb;
  color: #fff;
  transition: background 0.15s;
}
.btn-new:hover { background: #1d4ed8; }
.btn-new-secondary { background: #f3f4f6; color: #374151; border: 1px solid #e5e7eb; }
.btn-new-secondary:hover { background: #e5e7eb; }

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 6px 16px;
}

.section-label {
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 10px 8px 4px;
}

.btn-new-folder {
  display: flex;
  align-items: center;
  gap: 5px;
  width: 100%;
  padding: 6px 8px;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-size: 12.5px;
  color: #9ca3af;
  cursor: pointer;
  font-family: inherit;
  margin-top: 4px;
}
.btn-new-folder:hover { background: #f3f4f6; color: #6b7280; }
</style>
