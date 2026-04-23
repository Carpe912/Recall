<template>
  <div class="folder-wrap">
    <!-- Folder header -->
    <div class="folder-row" @click="open = !open">
      <span class="chevron" :class="{ rotated: open }">›</span>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;color:#f59e0b">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      </svg>
      <span class="folder-name">{{ folder.name }}</span>
      <div class="folder-actions">
        <button @click.stop="addDoc('prose')" title="新建文档">+¶</button>
        <button @click.stop="addDoc('whiteboard')" title="新建白板">+⬡</button>
        <button @click.stop="doRename" title="重命名">✎</button>
        <button @click.stop="ws.deleteFolder(folder.id)" title="删除" class="danger">✕</button>
      </div>
    </div>

    <!-- Folder contents -->
    <div v-if="open" class="folder-body">
      <DocList :docs="folderDocs" />
      <!-- Sub-folders -->
      <template v-for="sub in folder.children" :key="sub.id">
        <FolderItem :folder="sub" :all-docs="allDocs" />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useWorkspaceStore } from '../stores/workspace'
import DocList from './DocList.vue'

const props = defineProps<{ folder: any; allDocs: any[] }>()
const ws = useWorkspaceStore()
const open = ref(true)

const folderDocs = computed(() => props.allDocs.filter(d => d.folderId === props.folder.id))

async function addDoc(type: 'prose' | 'whiteboard') {
  await ws.createDocument(type, props.folder.id)
  open.value = true
}

async function doRename() {
  const name = prompt('重命名', props.folder.name)
  if (name?.trim()) await ws.renameFolder(props.folder.id, name.trim())
}
</script>

<style scoped>
.folder-wrap { margin-top: 2px; }

.folder-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 6px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: #374151;
  user-select: none;
}
.folder-row:hover { background: #f3f4f6; }

.chevron {
  font-size: 13px;
  color: #9ca3af;
  transition: transform 0.15s;
  display: inline-block;
  width: 12px;
  flex-shrink: 0;
}
.chevron.rotated { transform: rotate(90deg); }

.folder-name { flex: 1; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.folder-actions {
  display: none;
  gap: 2px;
}
.folder-row:hover .folder-actions { display: flex; }

.folder-actions button {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 11px;
  color: #9ca3af;
  padding: 2px 4px;
  border-radius: 4px;
}
.folder-actions button:hover { background: #e5e7eb; color: #374151; }
.folder-actions button.danger:hover { background: #fee2e2; color: #ef4444; }

.folder-body { padding-left: 14px; }
</style>
