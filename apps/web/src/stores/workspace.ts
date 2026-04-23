import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { foldersApi, documentsApi } from '../api'

export interface Folder {
  id: string
  name: string
  parentId: string | null
  order: number
}

export interface Document {
  id: string
  title: string
  type: 'prose' | 'whiteboard'
  folderId: string | null
  order: number
  updatedAt: string
}

export const useWorkspaceStore = defineStore('workspace', () => {
  const folders = ref<Folder[]>([])
  const documents = ref<Document[]>([])
  const activeDocId = ref<string | null>(null)
  const activeDoc = ref<any>(null)
  const loading = ref(false)

  const folderTree = computed(() => buildTree(folders.value))

  function buildTree(list: Folder[], parentId: string | null = null): any[] {
    return list
      .filter(f => f.parentId === parentId)
      .map(f => ({ ...f, children: buildTree(list, f.id) }))
  }

  async function loadAll() {
    loading.value = true
    try {
      const [fs, ds]: any = await Promise.all([foldersApi.list(), documentsApi.list()])
      folders.value = fs
      documents.value = ds
    } finally {
      loading.value = false
    }
  }

  async function openDocument(id: string) {
    if (activeDocId.value === id) return
    activeDocId.value = id
    activeDoc.value = null
    activeDoc.value = await documentsApi.get(id)
    // update list title reactively
    const idx = documents.value.findIndex(d => d.id === id)
    if (idx !== -1) documents.value[idx] = { ...documents.value[idx], ...activeDoc.value }
  }

  async function createDocument(type: 'prose' | 'whiteboard', folderId?: string) {
    const doc: any = await documentsApi.create({ type, folderId })
    documents.value.unshift(doc)
    await openDocument(doc.id)
    return doc
  }

  async function saveDocument(id: string, data: { title?: string; content?: string }) {
    await documentsApi.update(id, data)
    const idx = documents.value.findIndex(d => d.id === id)
    if (idx !== -1) documents.value[idx] = { ...documents.value[idx], ...data }
    if (activeDoc.value?.id === id) activeDoc.value = { ...activeDoc.value, ...data }
  }

  async function deleteDocument(id: string) {
    await documentsApi.remove(id)
    documents.value = documents.value.filter(d => d.id !== id)
    if (activeDocId.value === id) { activeDocId.value = null; activeDoc.value = null }
  }

  async function createFolder(name: string, parentId?: string) {
    const folder: any = await foldersApi.create(name, parentId)
    folders.value.push(folder)
    return folder
  }

  async function deleteFolder(id: string) {
    await foldersApi.remove(id)
    folders.value = folders.value.filter(f => f.id !== id)
  }

  async function renameFolder(id: string, name: string) {
    await foldersApi.update(id, { name })
    const idx = folders.value.findIndex(f => f.id === id)
    if (idx !== -1) folders.value[idx] = { ...folders.value[idx], name }
  }

  return {
    folders, documents, activeDocId, activeDoc, loading, folderTree,
    loadAll, openDocument, createDocument, saveDocument, deleteDocument,
    createFolder, deleteFolder, renameFolder,
  }
})
