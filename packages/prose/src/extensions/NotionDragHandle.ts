import { Extension } from '@tiptap/core'
import type { Editor } from '@tiptap/core'
import { Plugin, PluginKey, NodeSelection } from '@tiptap/pm/state'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

const PLUGIN_KEY = new PluginKey('notionDragHandle')

// ─── helpers ────────────────────────────────────────────────────────────────

function getBlockAt(editorDom: HTMLElement, target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null
  let el: HTMLElement | null = target as HTMLElement
  while (el && el.parentElement !== editorDom) el = el.parentElement
  return el && editorDom.contains(el) ? el : null
}

function posOfElement(view: any, el: HTMLElement): number | null {
  const rect = el.getBoundingClientRect()
  // Clamp Y inside viewport and within the element so tall/partially-scrolled blocks work
  const y = Math.max(rect.top + 2, Math.min(rect.bottom - 2, window.innerHeight / 2))
  const found = view.posAtCoords({ left: rect.left + 16, top: y })
  if (!found) return null
  const $pos = view.state.doc.resolve(found.pos)
  for (let d = $pos.depth; d >= 1; d--) {
    if ($pos.node(d - 1).type.name === 'doc') return $pos.before(d)
  }
  return null
}

type Gap = { insertPos: number; lineY: number; gapY: number }

function getDropTarget(view: any, mouseY: number): { insertPos: number; lineY: number } | null {
  const editorEl = view.dom as HTMLElement
  const children = Array.from(editorEl.children) as HTMLElement[]
  if (children.length === 0) return null

  const blocks = children
    .map(el => ({ el, rect: el.getBoundingClientRect(), pos: posOfElement(view, el) }))
    .filter(b => b.pos !== null) as { el: HTMLElement; rect: DOMRect; pos: number }[]

  if (blocks.length === 0) return null

  const gaps: Gap[] = []
  gaps.push({ insertPos: blocks[0].pos, lineY: blocks[0].rect.top, gapY: blocks[0].rect.top })

  for (let i = 0; i < blocks.length; i++) {
    const curr = blocks[i]
    const next = blocks[i + 1]
    const node = view.state.doc.nodeAt(curr.pos)
    const insertPos = curr.pos + (node?.nodeSize ?? 1)
    const lineY = next ? (curr.rect.bottom + next.rect.top) / 2 : curr.rect.bottom
    gaps.push({ insertPos, lineY, gapY: lineY })
  }

  let closest = gaps[0]
  let minDist = Math.abs(mouseY - gaps[0].gapY)
  for (const gap of gaps) {
    const dist = Math.abs(mouseY - gap.gapY)
    if (dist < minDist) { minDist = dist; closest = gap }
  }
  return closest
}

function makeDragIcon(): SVGSVGElement {
  const ns = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(ns, 'svg')
  svg.setAttribute('viewBox', '0 0 10 16')
  svg.setAttribute('width', '10')
  svg.setAttribute('height', '16')
  svg.setAttribute('fill', 'currentColor')
  for (const cx of [3, 7]) {
    for (const cy of [3, 8, 13]) {
      const c = document.createElementNS(ns, 'circle')
      c.setAttribute('cx', String(cx))
      c.setAttribute('cy', String(cy))
      c.setAttribute('r', '1.5')
      svg.appendChild(c)
    }
  }
  return svg
}

// ─── Block context menu ──────────────────────────────────────────────────────

function buildBlockMenu(
  editor: Editor,
  view: any,
  pos: number,
  onClose: () => void,
): HTMLElement {
  const menu = document.createElement('div')
  menu.style.cssText = [
    'position:fixed',
    'background:#fff',
    'border:1px solid #e5e7eb',
    'border-radius:10px',
    'box-shadow:0 8px 24px rgba(0,0,0,0.10),0 2px 6px rgba(0,0,0,0.06)',
    'padding:4px',
    'min-width:192px',
    'z-index:200',
    'font-family:ui-sans-serif,system-ui,sans-serif',
    'font-size:13.5px',
    'color:#374151',
    'user-select:none',
  ].join(';')

  const run = (fn: () => void) => { onClose(); setTimeout(fn, 10) }

  // ── Divider
  const addDivider = () => {
    const el = document.createElement('div')
    el.style.cssText = 'height:1px;background:#f3f4f6;margin:4px 0;'
    menu.appendChild(el)
  }

  // ── Plain clickable item
  const addItem = (iconHtml: string, label: string, onClick: () => void, danger = false) => {
    const item = document.createElement('div')
    item.style.cssText = [
      'display:flex', 'align-items:center', 'gap:8px',
      'padding:5px 8px', 'border-radius:6px', 'cursor:pointer',
      `color:${danger ? '#ef4444' : '#374151'}`, 'transition:background 0.1s',
    ].join(';')

    const iconEl = document.createElement('span')
    iconEl.style.cssText = [
      'width:22px', 'height:22px', 'display:flex', 'align-items:center', 'justify-content:center',
      `background:${danger ? '#fef2f2' : '#f3f4f6'}`, 'border-radius:5px',
      'font-size:11px', 'font-weight:700', 'flex-shrink:0',
      `color:${danger ? '#ef4444' : '#6b7280'}`, 'letter-spacing:-0.02em',
    ].join(';')
    iconEl.innerHTML = iconHtml

    const labelEl = document.createElement('span')
    labelEl.style.cssText = 'flex:1;'
    labelEl.textContent = label

    item.appendChild(iconEl)
    item.appendChild(labelEl)
    item.addEventListener('mouseenter', () => { item.style.background = danger ? '#fef2f2' : '#f3f4f6' })
    item.addEventListener('mouseleave', () => { item.style.background = 'transparent' })
    item.addEventListener('mousedown', (e) => { e.preventDefault(); onClick() })
    menu.appendChild(item)
    return item
  }

  // ── Flyout submenu — hover trigger to show panel to the right
  const addSubmenu = (iconHtml: string, label: string): HTMLElement => {
    let hideTimer: number = 0

    const trigger = document.createElement('div')
    trigger.style.cssText = [
      'display:flex', 'align-items:center', 'gap:8px',
      'padding:5px 8px', 'border-radius:6px', 'cursor:default',
      'color:#374151', 'transition:background 0.1s',
    ].join(';')

    const iconEl = document.createElement('span')
    iconEl.style.cssText = [
      'width:22px', 'height:22px', 'display:flex', 'align-items:center', 'justify-content:center',
      'background:#f3f4f6', 'border-radius:5px', 'font-size:11px',
      'font-weight:700', 'flex-shrink:0', 'color:#6b7280', 'letter-spacing:-0.02em',
    ].join(';')
    iconEl.innerHTML = iconHtml

    const labelEl = document.createElement('span')
    labelEl.style.cssText = 'flex:1;'
    labelEl.textContent = label

    const chevron = document.createElement('span')
    chevron.style.cssText = 'color:#9ca3af;font-size:11px;flex-shrink:0;'
    chevron.textContent = '›'

    trigger.appendChild(iconEl)
    trigger.appendChild(labelEl)
    trigger.appendChild(chevron)

    // Panel is a fixed-position flyout, child of menu so it's removed when menu is removed
    const panel = document.createElement('div')
    panel.style.cssText = [
      'position:fixed',
      'background:#fff',
      'border:1px solid #e5e7eb',
      'border-radius:10px',
      'box-shadow:0 8px 24px rgba(0,0,0,0.10),0 2px 6px rgba(0,0,0,0.06)',
      'padding:4px',
      'min-width:160px',
      'z-index:201',
      'display:none',
      'font-family:ui-sans-serif,system-ui,sans-serif',
      'font-size:13.5px',
      'color:#374151',
      'user-select:none',
    ].join(';')

    const showPanel = () => {
      clearTimeout(hideTimer)
      const menuRect = menu.getBoundingClientRect()
      const triggerRect = trigger.getBoundingClientRect()
      panel.style.left = `${menuRect.right + 4}px`
      panel.style.top = `${triggerRect.top}px`
      panel.style.display = 'block'
      // Clamp bottom overflow
      const pr = panel.getBoundingClientRect()
      if (pr.bottom > window.innerHeight - 8) {
        panel.style.top = `${triggerRect.top - (pr.bottom - window.innerHeight + 8)}px`
      }
    }

    const scheduleHide = () => {
      clearTimeout(hideTimer)
      hideTimer = window.setTimeout(() => { panel.style.display = 'none' }, 200)
    }

    trigger.addEventListener('mouseenter', () => { trigger.style.background = '#f3f4f6'; showPanel() })
    trigger.addEventListener('mouseleave', () => { trigger.style.background = 'transparent'; scheduleHide() })
    panel.addEventListener('mouseenter', () => clearTimeout(hideTimer))
    panel.addEventListener('mouseleave', () => { trigger.style.background = 'transparent'; scheduleHide() })

    menu.appendChild(trigger)
    menu.appendChild(panel)
    return panel
  }

  // ── Item inside submenu panel
  const addAccordionItem = (body: HTMLElement, iconHtml: string, label: string, onClick: () => void) => {
    const item = document.createElement('div')
    item.style.cssText = [
      'display:flex', 'align-items:center', 'gap:8px',
      'padding:4px 8px', 'border-radius:6px', 'cursor:pointer',
      'color:#374151', 'transition:background 0.1s',
    ].join(';')

    const iconEl = document.createElement('span')
    iconEl.style.cssText = [
      'width:20px', 'height:20px', 'display:flex', 'align-items:center', 'justify-content:center',
      'background:#f3f4f6', 'border-radius:4px', 'font-size:10.5px',
      'font-weight:700', 'flex-shrink:0', 'color:#6b7280',
    ].join(';')
    iconEl.innerHTML = iconHtml

    const labelEl = document.createElement('span')
    labelEl.textContent = label

    item.appendChild(iconEl)
    item.appendChild(labelEl)
    item.addEventListener('mouseenter', () => { item.style.background = '#f3f4f6' })
    item.addEventListener('mouseleave', () => { item.style.background = 'transparent' })
    item.addEventListener('mousedown', (e) => { e.preventDefault(); onClick() })
    body.appendChild(item)
  }

  // ── Color swatch row inside accordion body
  const addColorSwatches = (
    body: HTMLElement,
    colors: { value: string; label: string }[],
    onPick: (color: string) => void,
    activeColor: string,
  ) => {
    const row = document.createElement('div')
    row.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;padding:4px 8px 6px;'

    // Preset color swatches
    for (const c of colors) {
      const swatch = document.createElement('div')
      const isActive = c.value !== '' && c.value === activeColor
      swatch.title = c.label
      swatch.style.cssText = [
        'width:20px', 'height:20px', 'border-radius:4px', 'cursor:pointer', 'flex-shrink:0',
        `background:${c.value || '#fff'}`,
        `border:${isActive ? '2px solid #2563eb' : '1.5px solid #e5e7eb'}`,
        'transition:transform 0.1s',
      ].join(';')
      if (c.value === '') {
        swatch.innerHTML = '<svg width="20" height="20" viewBox="0 0 20 20"><line x1="3" y1="17" x2="17" y2="3" stroke="#d1d5db" stroke-width="1.5"/></svg>'
      }
      swatch.addEventListener('mouseenter', () => { swatch.style.transform = 'scale(1.18)' })
      swatch.addEventListener('mouseleave', () => { swatch.style.transform = 'scale(1)' })
      swatch.addEventListener('mousedown', (e) => { e.preventDefault(); run(() => onPick(c.value)) })
      row.appendChild(swatch)
    }

    // Custom color picker button
    const pickerBtn = document.createElement('div')
    pickerBtn.title = '自定义颜色'
    pickerBtn.style.cssText = [
      'width:20px', 'height:20px', 'border-radius:4px', 'cursor:pointer', 'flex-shrink:0',
      'border:1.5px solid #e5e7eb', 'display:flex', 'align-items:center', 'justify-content:center',
      'background:#fff', 'transition:transform 0.1s',
    ].join(';')
    pickerBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8m-4-4h8"/></svg>'

    const hiddenInput = document.createElement('input')
    hiddenInput.type = 'color'
    hiddenInput.value = activeColor || '#000000'
    hiddenInput.style.cssText = 'position:fixed;opacity:0;pointer-events:none;width:0;height:0;'

    pickerBtn.addEventListener('mouseenter', () => { pickerBtn.style.transform = 'scale(1.18)' })
    pickerBtn.addEventListener('mouseleave', () => { pickerBtn.style.transform = 'scale(1)' })
    pickerBtn.addEventListener('mousedown', (e) => {
      e.preventDefault()
      const rect = pickerBtn.getBoundingClientRect()
      hiddenInput.style.left = `${rect.left}px`
      hiddenInput.style.top = `${rect.bottom}px`
      hiddenInput.click()
    })

    hiddenInput.addEventListener('change', (e) => {
      const color = (e.target as HTMLInputElement).value
      run(() => onPick(color))
    })

    row.appendChild(pickerBtn)
    row.appendChild(hiddenInput)
    body.appendChild(row)
  }

  // SVG icons
  const SVG_CONVERT = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 16V4m0 0L3 8m4-4l4 4"/><path d="M17 8v12m0 0l4-4m-4 4l-4-4"/></svg>'
  const SVG_ALIGN   = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="10" x2="15" y2="10"/><line x1="3" y1="14" x2="21" y2="14"/><line x1="3" y1="18" x2="13" y2="18"/></svg>'
  const SVG_COLOR   = '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12.1 2a1 1 0 0 0-.9.6L5.5 18H8l1.7-4.5h4.6L16 18h2.5L13 2.6a1 1 0 0 0-.9-.6zm-1.7 9.5L12 6.9l1.6 4.6H10.4z"/></svg>'
  const SVG_HL      = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" fill="currentColor" stroke="none"/></svg>'
  const SVG_AL      = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="10" x2="15" y2="10"/><line x1="3" y1="14" x2="21" y2="14"/><line x1="3" y1="18" x2="15" y2="18"/></svg>'
  const SVG_AC      = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="10" x2="18" y2="10"/><line x1="3" y1="14" x2="21" y2="14"/><line x1="6" y1="18" x2="18" y2="18"/></svg>'
  const SVG_AR      = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="10" x2="21" y2="10"/><line x1="3" y1="14" x2="21" y2="14"/><line x1="9" y1="18" x2="21" y2="18"/></svg>'

  // ── 转换为
  const convertBody = addSubmenu(SVG_CONVERT, '转换为')
  const convertItems = [
    { icon: '¶',   label: '正文',     cmd: () => editor.chain().focus().setTextSelection(pos + 1).setParagraph().run() },
    { icon: 'H1',  label: '标题 1',   cmd: () => editor.chain().focus().setTextSelection(pos + 1).setHeading({ level: 1 }).run() },
    { icon: 'H2',  label: '标题 2',   cmd: () => editor.chain().focus().setTextSelection(pos + 1).setHeading({ level: 2 }).run() },
    { icon: 'H3',  label: '标题 3',   cmd: () => editor.chain().focus().setTextSelection(pos + 1).setHeading({ level: 3 }).run() },
    { icon: '•',   label: '无序列表', cmd: () => editor.chain().focus().setTextSelection(pos + 1).toggleBulletList().run() },
    { icon: '1.',  label: '有序列表', cmd: () => editor.chain().focus().setTextSelection(pos + 1).toggleOrderedList().run() },
    { icon: '✓',   label: '任务列表', cmd: () => editor.chain().focus().setTextSelection(pos + 1).toggleTaskList().run() },
    { icon: '"',   label: '引用块',   cmd: () => editor.chain().focus().setTextSelection(pos + 1).toggleBlockquote().run() },
    { icon: '</>', label: '代码块',   cmd: () => editor.chain().focus().setTextSelection(pos + 1).toggleCodeBlock().run() },
    { icon: '⊞',   label: '表格',     cmd: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
    { icon: '⫿⫿',  label: '2 栏',    cmd: () => (editor.chain().focus() as any).setColumns(2).run() },
    { icon: '⫿⫿⫿', label: '3 栏',    cmd: () => (editor.chain().focus() as any).setColumns(3).run() },
    { icon: 'ℹ',   label: '信息块',   cmd: () => (editor.chain().focus() as any).setCallout('info').run() },
    { icon: '⚠',   label: '警告块',   cmd: () => (editor.chain().focus() as any).setCallout('warning').run() },
    { icon: '✅',  label: '成功块',   cmd: () => (editor.chain().focus() as any).setCallout('success').run() },
    { icon: '✗',   label: '错误块',   cmd: () => (editor.chain().focus() as any).setCallout('error').run() },
  ]
  for (const ci of convertItems) {
    addAccordionItem(convertBody, ci.icon, ci.label, () => run(ci.cmd))
  }

  // ── 对齐
  const alignBody = addSubmenu(SVG_ALIGN, '对齐')
  addAccordionItem(alignBody, SVG_AL, '靠左', () => run(() => editor.chain().focus().setTextSelection(pos + 1).setTextAlign('left').run()))
  addAccordionItem(alignBody, SVG_AC, '居中', () => run(() => editor.chain().focus().setTextSelection(pos + 1).setTextAlign('center').run()))
  addAccordionItem(alignBody, SVG_AR, '靠右', () => run(() => editor.chain().focus().setTextSelection(pos + 1).setTextAlign('right').run()))

  // ── 文字颜色
  const currentTextColor = editor.getAttributes('textStyle').color ?? ''
  const textColorBody = addSubmenu(SVG_COLOR, '文字颜色')
  addAccordionItem(textColorBody, 'A', '默认颜色', () => run(() => editor.chain().focus().unsetColor().run()))
  addColorSwatches(textColorBody, [
    { value: '#1a1a1a', label: '黑色' },
    { value: '#6b7280', label: '灰色' },
    { value: '#ef4444', label: '红色' },
    { value: '#f97316', label: '橙色' },
    { value: '#eab308', label: '黄色' },
    { value: '#22c55e', label: '绿色' },
    { value: '#3b82f6', label: '蓝色' },
    { value: '#8b5cf6', label: '紫色' },
  ], (color) => {
    editor.chain().focus().setColor(color).run()
  }, currentTextColor)

  // ── 高亮颜色
  const currentHighlight = editor.getAttributes('highlight').color ?? ''
  const hlBody = addSubmenu(SVG_HL, '高亮颜色')
  addAccordionItem(hlBody, '⊘', '清除高亮', () => run(() => editor.chain().focus().unsetHighlight().run()))
  addColorSwatches(hlBody, [
    { value: '#fde68a', label: '黄色' },
    { value: '#fed7aa', label: '橙色' },
    { value: '#fecaca', label: '红色' },
    { value: '#bbf7d0', label: '绿色' },
    { value: '#bfdbfe', label: '蓝色' },
    { value: '#e9d5ff', label: '紫色' },
    { value: '#f3f4f6', label: '灰色' },
  ], (color) => {
    editor.chain().focus().setHighlight({ color }).run()
  }, currentHighlight)

  addDivider()

  // ── 操作
  addItem('↑', '向上方插入', () => run(() => {
    const paragraph = view.state.schema.nodes.paragraph?.create()
    if (!paragraph) return
    const tr = view.state.tr.insert(pos, paragraph)
    view.dispatch(tr)
    editor.chain().focus().setTextSelection(pos + 1).run()
  }))

  addItem('↓', '向下方插入', () => run(() => {
    const nodeSize = view.state.doc.nodeAt(pos)?.nodeSize ?? 1
    const insertPos = pos + nodeSize
    const paragraph = view.state.schema.nodes.paragraph?.create()
    if (!paragraph) return
    const tr = view.state.tr.insert(insertPos, paragraph)
    view.dispatch(tr)
    editor.chain().focus().setTextSelection(insertPos + 1).run()
  }))

  addItem('⎘', '复制节点', () => run(() => {
    const n = view.state.doc.nodeAt(pos)
    if (!n) return
    const insertPos = pos + n.nodeSize
    const tr = view.state.tr.insert(insertPos, n)
    view.dispatch(tr)
  }))

  addDivider()

  addItem('✕', '删除节点', () => run(() => {
    const n = view.state.doc.nodeAt(pos)
    if (!n) return
    const tr = view.state.tr.delete(pos, pos + n.nodeSize)
    view.dispatch(tr)
  }), true)

  return menu
}

// ─── Extension ──────────────────────────────────────────────────────────────

export const NotionDragHandle = Extension.create({
  name: 'notionDragHandle',

  addProseMirrorPlugins() {
    const tiptapEditor = this.editor as Editor

    return [
      new Plugin({
        key: PLUGIN_KEY,

        view(view) {
          // ── Handle button
          const wrapper = document.createElement('div')
          wrapper.className = 'pm-drag-handle-wrapper'
          wrapper.style.cssText =
            'position:fixed;display:none;align-items:flex-start;z-index:100;pointer-events:none;'

          const btn = document.createElement('button')
          btn.type = 'button'
          btn.className = 'pm-drag-handle-btn'
          btn.setAttribute('aria-label', '块操作')
          btn.style.pointerEvents = 'auto'
          btn.style.cursor = 'grab'
          btn.appendChild(makeDragIcon())
          wrapper.appendChild(btn)
          document.body.appendChild(wrapper)

          // ── Drop indicator line
          const dropLine = document.createElement('div')
          dropLine.style.cssText =
            'position:fixed;height:2px;background:#94a3b8;border-radius:1px;z-index:99;pointer-events:none;display:none;'
          document.body.appendChild(dropLine)

          // ── Ghost element
          const ghost = document.createElement('div')
          ghost.style.cssText = [
            'position:fixed',
            'pointer-events:none',
            'z-index:98',
            'opacity:0.45',
            'border-radius:6px',
            'background:#fff',
            'box-shadow:0 4px 16px rgba(0,0,0,0.10)',
            'padding:6px 10px',
            'overflow:hidden',
            'display:none',
            'transform:rotate(1.2deg)',
          ].join(';')
          document.body.appendChild(ghost)

          // ── Context menu
          let contextMenu: HTMLElement | null = null
          let offClickHandler: ((e: MouseEvent) => void) | null = null

          const closeContextMenu = () => {
            if (contextMenu) { contextMenu.remove(); contextMenu = null }
            if (offClickHandler) {
              document.removeEventListener('mousedown', offClickHandler, true)
              offClickHandler = null
            }
          }

          const openContextMenu = (pos: number) => {
            closeContextMenu()

            // Select the node so the user sees which block is being operated on
            try {
              const sel = NodeSelection.create(view.state.doc, pos)
              view.dispatch(view.state.tr.setSelection(sel))
            } catch (_) {}

            const btnRect = btn.getBoundingClientRect()

            contextMenu = buildBlockMenu(tiptapEditor, view, pos, closeContextMenu)
            contextMenu.style.left = `${btnRect.right + 6}px`
            contextMenu.style.top = `${btnRect.top}px`
            document.body.appendChild(contextMenu)

            // Clamp bottom overflow
            const menuRect = contextMenu.getBoundingClientRect()
            const overflow = menuRect.bottom - window.innerHeight + 8
            if (overflow > 0) {
              contextMenu.style.top = `${btnRect.top - overflow}px`
            }

            offClickHandler = (e: MouseEvent) => {
              const target = e.target as Node
              if (e.target === btn) return
              if (contextMenu?.contains(target)) return
              closeContextMenu()
            }
            document.addEventListener('mousedown', offClickHandler, true)
          }

          // ── State
          let activePos: number | null = null
          let activeEl: HTMLElement | null = null
          let hideTimer = 0
          let isOverBtn = false
          let isDragging = false
          let draggingPos: number | null = null
          let draggingNode: ProseMirrorNode | null = null
          let currentDropTarget: { insertPos: number; lineY: number } | null = null
          let hasMoved = false
          let startX = 0
          let startY = 0

          const show = (el: HTMLElement, pos: number) => {
            clearTimeout(hideTimer)
            activePos = pos
            activeEl = el
            const rect = el.getBoundingClientRect()
            wrapper.style.display = 'flex'
            wrapper.style.top = `${rect.top}px`
            wrapper.style.left = `${rect.left - 28}px`
            wrapper.style.height = `${rect.height}px`
          }

          const scheduleHide = (delay = 200) => {
            clearTimeout(hideTimer)
            hideTimer = window.setTimeout(() => {
              if (!isOverBtn && !isDragging && !contextMenu) hide()
            }, delay)
          }

          const hide = () => {
            clearTimeout(hideTimer)
            wrapper.style.display = 'none'
            activePos = null
            activeEl = null
          }

          const showGhost = (sourceEl: HTMLElement, mouseX: number, mouseY: number) => {
            ghost.innerHTML = ''
            const proseMirrorWrap = document.createElement('div')
            proseMirrorWrap.className = 'ProseMirror'
            proseMirrorWrap.style.cssText = 'padding:0;margin:0;outline:none;pointer-events:none;'
            proseMirrorWrap.appendChild(sourceEl.cloneNode(true))
            ghost.style.width = `${sourceEl.offsetWidth}px`
            ghost.style.height = `${sourceEl.offsetHeight}px`
            ghost.style.overflow = 'hidden'
            ghost.appendChild(proseMirrorWrap)
            ghost.style.display = 'block'
            updateGhostPos(mouseX, mouseY)
          }

          const updateGhostPos = (mouseX: number, mouseY: number) => {
            ghost.style.left = `${mouseX + 16}px`
            ghost.style.top = `${mouseY - 12}px`
          }

          const hideGhost = () => {
            ghost.style.display = 'none'
            ghost.innerHTML = ''
          }

          // ── Editor hover
          const onEditorMouseMove = (e: MouseEvent) => {
            if (isDragging) return
            const el = getBlockAt(view.dom as HTMLElement, e.target)
            // Mouse is in editor padding / empty area — don't hide, wait for mouseleave
            if (!el) return
            const pos = posOfElement(view, el)
            // Can't resolve position but mouse is over a block — keep current state
            if (pos === null) return
            show(el, pos)
          }

          const onEditorMouseLeave = (e: MouseEvent) => {
            if (e.relatedTarget instanceof Node && wrapper.contains(e.relatedTarget)) return
            scheduleHide()
          }

          // ── Button hover
          btn.addEventListener('mouseenter', () => { isOverBtn = true; clearTimeout(hideTimer) })
          btn.addEventListener('mouseleave', () => { isOverBtn = false; scheduleHide(300) })

          // ── Button click / drag
          btn.addEventListener('mousedown', (e: MouseEvent) => {
            if (e.button !== 0) return
            e.preventDefault()
            e.stopPropagation()

            if (activePos === null) return
            const node = view.state.doc.nodeAt(activePos)
            if (!node) return

            const sourceEl = activeEl
            draggingPos = activePos
            draggingNode = node
            hasMoved = false
            startX = e.clientX
            startY = e.clientY

            const onDocMove = (e: MouseEvent) => {
              const dy = Math.abs(e.clientY - startY)
              const dx = Math.abs(e.clientX - startX)

              if (dy > 5 || dx > 5 || hasMoved) {
                if (!hasMoved) {
                  hasMoved = true
                  isDragging = true
                  btn.style.cursor = 'grabbing'
                  document.body.style.cursor = 'grabbing'
                  closeContextMenu()
                  if (sourceEl) showGhost(sourceEl, e.clientX, e.clientY)
                } else {
                  updateGhostPos(e.clientX, e.clientY)
                }

                const editorEl = view.dom as HTMLElement
                const editorRect = editorEl.getBoundingClientRect()
                const target = getDropTarget(view, e.clientY)

                if (target) {
                  currentDropTarget = target
                  dropLine.style.display = 'block'
                  dropLine.style.top = `${target.lineY - 1}px`
                  dropLine.style.left = `${editorRect.left}px`
                  dropLine.style.width = `${editorRect.width}px`
                } else {
                  currentDropTarget = null
                  dropLine.style.display = 'none'
                }
              }
            }

            const onDocUp = () => {
              document.removeEventListener('mousemove', onDocMove)
              document.removeEventListener('mouseup', onDocUp)

              btn.style.cursor = 'grab'
              document.body.style.cursor = ''
              dropLine.style.display = 'none'
              hideGhost()
              isDragging = false

              if (!hasMoved) {
                // Click → show context menu
                if (draggingPos !== null) {
                  const n = view.state.doc.nodeAt(draggingPos)
                  if (n) openContextMenu(draggingPos)
                }
              } else if (draggingPos !== null && draggingNode !== null && currentDropTarget !== null) {
                // Drop → move block
                const from = draggingPos
                const nodeSize = draggingNode.nodeSize
                const to = from + nodeSize
                let insertPos = currentDropTarget.insertPos

                if (insertPos > from) insertPos = Math.max(0, insertPos - nodeSize)

                if (insertPos !== from) {
                  let tr = view.state.tr.delete(from, to)
                  insertPos = Math.min(insertPos, tr.doc.content.size)
                  tr = tr.insert(insertPos, draggingNode)
                  try { tr = tr.setSelection(NodeSelection.create(tr.doc, insertPos)) } catch (_) {}
                  view.dispatch(tr.scrollIntoView())
                }
              }

              draggingPos = null
              draggingNode = null
              currentDropTarget = null
              hasMoved = false
            }

            document.addEventListener('mousemove', onDocMove)
            document.addEventListener('mouseup', onDocUp)
          })

          // ── Wire editor listeners
          const dom = view.dom as HTMLElement
          dom.addEventListener('mousemove', onEditorMouseMove)
          dom.addEventListener('mouseleave', onEditorMouseLeave)

          return {
            destroy() {
              dom.removeEventListener('mousemove', onEditorMouseMove)
              dom.removeEventListener('mouseleave', onEditorMouseLeave)
              clearTimeout(hideTimer)
              closeContextMenu()
              wrapper.remove()
              dropLine.remove()
              ghost.remove()
            },
          }
        },
      }),
    ]
  },
})
