import { Extension } from '@tiptap/core'
import { Plugin, PluginKey, NodeSelection } from '@tiptap/pm/state'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

const key = new PluginKey('notionDragHandle')

function withinEditor(root: HTMLElement, el: Element | null): el is HTMLElement {
  return !!el && el instanceof HTMLElement && root.contains(el)
}

function findBlockElement(root: HTMLElement, target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null

  // 常用块节点（扩展可按需补充）
  const el = target.closest('p,h1,h2,h3,h4,h5,h6,blockquote,pre,li,table') as HTMLElement | null
  if (!withinEditor(root, el)) return null
  return el
}

function posOfBlock(view: any, el: HTMLElement): number | null {
  // 找到该 DOM 节点对应的最外层 block 的位置
  const rect = el.getBoundingClientRect()
  const coords = { left: rect.left + 8, top: rect.top + 8 }
  const found = view.posAtCoords(coords)
  if (!found) return null

  const $pos = view.state.doc.resolve(found.pos)
  for (let d = $pos.depth; d > 0; d -= 1) {
    const node = $pos.node(d)
    if (node.isBlock) {
      return $pos.before(d)
    }
  }
  return null
}

function blockPosAtCoords(view: any, x: number, y: number): number | null {
  const found = view.posAtCoords({ left: x, top: y })
  if (!found) return null

  const $pos = view.state.doc.resolve(found.pos)
  for (let d = $pos.depth; d > 0; d -= 1) {
    const node = $pos.node(d)
    if (node.isBlock) return $pos.before(d)
  }
  return null
}

export const NotionDragHandle = Extension.create({
  name: 'notionDragHandle',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key,
        view: (view) => {
          const handle = document.createElement('button')
          handle.type = 'button'
          handle.className = 'custom-drag-handle'
          handle.setAttribute('aria-label', '拖拽排序')
          handle.draggable = true

          // 让 handle 可被拖拽但不影响编辑
          handle.addEventListener('mousedown', (e) => {
            e.preventDefault()
            e.stopPropagation()
            if (currentPos == null) return
            view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, currentPos)))
            view.focus()
          })

          handle.addEventListener('dragstart', (e) => {
            if (currentPos == null) return
            const state = view.state
            const node = state.doc.nodeAt(currentPos)
            if (!node) return
            draggingPos = currentPos
            draggingNode = node

            // 确保是 node selection
            const tr = state.tr.setSelection(NodeSelection.create(state.doc, currentPos))
            view.dispatch(tr)

            const slice = view.state.selection.content()
            view.dragging = { slice, move: true }

            // 仅用于满足部分浏览器对 dataTransfer 的要求
            // ProseMirror 实际使用 view.dragging 来完成编辑器内拖拽移动
            e.dataTransfer?.setData('text/plain', ' ')
            if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
            e.dataTransfer?.setDragImage(handle, 10, 10)
          })

          handle.addEventListener('dragend', () => {
            draggingPos = null
            draggingNode = null
            hide()
          })

          let currentPos: number | null = null
          let draggingPos: number | null = null
          let draggingNode: ProseMirrorNode | null = null

          const hide = () => {
            handle.style.display = 'none'
            currentPos = null
          }

          const showFor = (el: HTMLElement, pos: number) => {
            const rect = el.getBoundingClientRect()
            currentPos = pos

            handle.style.display = 'flex'
            handle.style.position = 'fixed'
            handle.style.top = `${rect.top + 6}px`
            handle.style.left = `${rect.left - 30}px`
            handle.style.zIndex = '2147483647'
          }

          const onMouseMove = (event: MouseEvent) => {
            const root = view.dom as HTMLElement
            const blockEl = findBlockElement(root, event.target)
            if (!blockEl) {
              hide()
              return
            }

            // Notion-like：只有在靠近左侧时才显示
            const rect = blockEl.getBoundingClientRect()
            const nearLeft = event.clientX <= rect.left + 28
            if (!nearLeft) {
              hide()
              return
            }

            const pos = posOfBlock(view, blockEl)
            if (pos == null) {
              hide()
              return
            }

            showFor(blockEl, pos)
          }

          const onMouseLeave = () => hide()

          const onDragOver = (event: DragEvent) => {
            if (draggingPos == null) return
            event.preventDefault()
          }

          const onDrop = (event: DragEvent) => {
            if (draggingPos == null || !draggingNode) return
            event.preventDefault()

            const targetPos = blockPosAtCoords(view, event.clientX, event.clientY)
            if (targetPos == null) {
              draggingPos = null
              draggingNode = null
              return
            }

            if (targetPos === draggingPos) {
              draggingPos = null
              draggingNode = null
              return
            }

            const state = view.state
            const from = draggingPos
            const to = draggingPos + draggingNode.nodeSize

            // 删除原节点，再在目标位置插入，实现稳定块重排
            let insertPos = targetPos
            if (targetPos > from) {
              insertPos = Math.max(0, targetPos - draggingNode.nodeSize)
            }

            let tr = state.tr.delete(from, to)
            tr = tr.insert(insertPos, draggingNode)
            tr = tr.setSelection(NodeSelection.create(tr.doc, insertPos))
            view.dispatch(tr.scrollIntoView())

            draggingPos = null
            draggingNode = null
            hide()
          }

          document.body.appendChild(handle)
          hide()

          view.dom.addEventListener('mousemove', onMouseMove)
          view.dom.addEventListener('mouseleave', onMouseLeave)
          view.dom.addEventListener('dragover', onDragOver)
          view.dom.addEventListener('drop', onDrop)

          return {
            destroy: () => {
              view.dom.removeEventListener('mousemove', onMouseMove)
              view.dom.removeEventListener('mouseleave', onMouseLeave)
              view.dom.removeEventListener('dragover', onDragOver)
              view.dom.removeEventListener('drop', onDrop)
              handle.remove()
            },
          }
        },
      }),
    ]
  },
})

