import { Node } from './core/Node'
import { Edge } from './core/Edge'
import { Group } from './core/Group'
import { Renderer } from './renderer/Renderer'
import { SelectionManager } from './interaction/SelectionManager'
import { DragManager } from './interaction/DragManager'
import { CommandManager } from './interaction/CommandManager'
import { ContextMenu } from './ui/ContextMenu'
import { Minimap } from './ui/Minimap'
import { SnapGuide } from './utils/SnapGuide'
import {
  MoveCommand,
  CreateNodeCommand,
  DeleteNodeCommand,
  CreateEdgeCommand,
  DeleteEdgeCommand,
} from './interaction/Commands'
import { EventEmitter } from './utils/EventEmitter'
import { LayoutEngine } from './utils/LayoutEngine'
import type { NodeData, EdgeData, Point, NodeStyle, EdgeStyle } from './types'
import type { LayoutOptions } from './utils/LayoutEngine'

export class GraphiteEditor extends EventEmitter {
  private canvas: HTMLCanvasElement
  private renderer: Renderer
  private nodes: Node[] = []
  private edges: Edge[] = []
  private groups: Group[] = []
  private selectionManager: SelectionManager
  private dragManager: DragManager
  private commandManager: CommandManager
  private contextMenu: ContextMenu
  private snapGuide: SnapGuide
  private minimap: Minimap

  // 交互状态
  private isSpacePressed: boolean = false
  private isPanning: boolean = false
  private panStartPoint: Point | null = null
  private selectionBoxStart: Point | null = null
  private selectionBoxEnd: Point | null = null

  // 连线创建状态
  private isCreatingEdge: boolean = false
  private edgeStartNode: Node | null = null
  private edgeStartPort: 'top' | 'right' | 'bottom' | 'left' | null = null
  private edgePreviewEnd: Point | null = null
  private edgeTargetNode: Node | null = null // 连线目标节点（用于高亮）

  // 调整大小状态
  private isResizing: boolean = false
  private resizeNode: Node | null = null
  private resizeHandle: string | null = null
  private resizeStartPoint: Point | null = null
  private resizeStartSize: { width: number; height: number } | null = null
  private resizeStartPosition: Point | null = null

  // 悬浮状态
  private hoveredNode: Node | null = null

  // 吸附辅助线
  private snapGuides: { x: number[]; y: number[] } = { x: [], y: [] }

  // 剪贴板
  private clipboard: {
    nodes: Node[]
    edges: Edge[]
  } = { nodes: [], edges: [] }

  // 文本编辑状态
  private isEditingText: boolean = false
  private editingNode: Node | null = null
  private textInput: HTMLTextAreaElement | null = null

  // 保存绑定后的函数引用，用于注销事件
  private boundOnMouseMove: (e: MouseEvent) => void
  private boundOnMouseUp: (e: MouseEvent) => void
  private boundOnKeyDown: (e: KeyboardEvent) => void
  private boundOnKeyUp: (e: KeyboardEvent) => void

  constructor(canvas: HTMLCanvasElement) {
    super()
    this.canvas = canvas
    this.renderer = new Renderer(canvas)
    this.selectionManager = new SelectionManager()
    this.dragManager = new DragManager()
    this.commandManager = new CommandManager()
    this.contextMenu = new ContextMenu()
    this.snapGuide = new SnapGuide()
    this.minimap = new Minimap(canvas)

    this.boundOnMouseMove = this.onMouseMove.bind(this)
    this.boundOnMouseUp = this.onMouseUp.bind(this)
    this.boundOnKeyDown = this.onKeyDown.bind(this)
    this.boundOnKeyUp = this.onKeyUp.bind(this)

    this.setupEventListeners()
    this.startRenderLoop()

    // 监听小地图点击事件
    this.minimap.getCanvas().addEventListener('minimapClick', ((e: CustomEvent) => {
      const { x, y } = e.detail
      const camera = this.renderer.getCamera()
      camera.x = -x * camera.zoom
      camera.y = -y * camera.zoom
      this.renderer.markDirty()
    }) as EventListener)
  }

  // 设置事件监听
  private setupEventListeners(): void {
    // mousedown / mousemove 只在 canvas 上监听（hover 效果只在 canvas 内生效）
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this))
    this.canvas.addEventListener('dblclick', this.onDoubleClick.bind(this))
    this.canvas.addEventListener('mousemove', this.boundOnMouseMove)
    // mouseup 同时在 window 上监听，防止拖拽时移出 canvas 松手导致状态卡死
    this.canvas.addEventListener('mouseup', this.boundOnMouseUp)
    window.addEventListener('mouseup', this.boundOnMouseUp)
    this.canvas.addEventListener('wheel', this.onWheel.bind(this))
    this.canvas.addEventListener('contextmenu', this.onContextMenu.bind(this))

    // 键盘事件
    window.addEventListener('keydown', this.boundOnKeyDown)
    window.addEventListener('keyup', this.boundOnKeyUp)

    // 选择变化事件
    this.selectionManager.on('selectionChanged', (nodeIds: string[]) => {
      this.emit('selectionChanged', nodeIds)
      this.renderer.markDirty()
    })

    // 拖拽事件
    this.dragManager.on('drag', () => {
      this.updateEdges()
      this.renderer.markDirty()
    })

    this.dragManager.on('dragEnd', (nodes: Node[], dx: number, dy: number) => {
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        const command = new MoveCommand(nodes, dx, dy)
        // 注意：节点已经在拖拽过程中移动了，所以只添加到历史，不执行
        this.commandManager.addToHistory(command)
      }
    })
  }

  // 鼠标按下
  private onMouseDown(e: MouseEvent): void {
    const point = this.getMousePosition(e)
    const worldPoint = this.renderer.getCamera().screenToWorld(point)

    // 空格 + 鼠标左键 = 平移画布
    if (this.isSpacePressed || e.button === 1) {
      this.isPanning = true
      this.panStartPoint = point
      this.canvas.style.cursor = 'grabbing'
      return
    }

    // 左键
    if (e.button === 0) {
      // 检查是否点击了节点
      const clickedNode = this.findNodeAt(worldPoint)

      if (clickedNode) {
        // 检查连接点（任何节点都可以，不需要先选中）
        const port = clickedNode.hitTestPort(worldPoint.x, worldPoint.y)
        if (port) {
          // 点击了连接点，开始创建连线
          this.isCreatingEdge = true
          this.edgeStartNode = clickedNode
          this.edgeStartPort = port
          this.edgePreviewEnd = worldPoint
          this.canvas.style.cursor = 'crosshair'
          return
        }

        // 如果节点被选中，检查是否点击了调整大小控制点
        if (this.selectionManager.isNodeSelected(clickedNode)) {
          const resizeHandle = clickedNode.hitTestResizeHandle(worldPoint.x, worldPoint.y)
          if (resizeHandle) {
            this.isResizing = true
            this.resizeNode = clickedNode
            this.resizeHandle = resizeHandle
            this.resizeStartPoint = worldPoint
            this.resizeStartSize = {
              width: clickedNode.width,
              height: clickedNode.height,
            }
            this.resizeStartPosition = {
              x: clickedNode.transform.x,
              y: clickedNode.transform.y,
            }
            this.canvas.style.cursor = this.getResizeCursor(resizeHandle)
            return
          }
        }

        // 点击节点
        const isMultiSelect = e.ctrlKey || e.metaKey

        if (!this.selectionManager.isNodeSelected(clickedNode)) {
          this.selectionManager.selectNode(clickedNode, isMultiSelect)
        }

        // 开始拖拽
        const selectedNodes = this.selectionManager.getSelectedNodes()
        this.dragManager.startDrag(selectedNodes, worldPoint)
      } else {
        // 点击空白处，开始框选
        if (!e.ctrlKey && !e.metaKey) {
          this.selectionManager.clear()
        }
        this.selectionBoxStart = worldPoint
        this.selectionBoxEnd = worldPoint
      }
    }
  }

  // 鼠标移动
  private onMouseMove(e: MouseEvent): void {
    const point = this.getMousePosition(e)
    const worldPoint = this.renderer.getCamera().screenToWorld(point)
    const isOverCanvas = this.isPointOverCanvas(e)

    // 平移画布
    if (this.isPanning && this.panStartPoint) {
      const dx = point.x - this.panStartPoint.x
      const dy = point.y - this.panStartPoint.y
      this.renderer.getCamera().translate(dx, dy)
      this.panStartPoint = point
      this.renderer.markDirty()
      return
    }

    // 调整大小
    if (this.isResizing && this.resizeNode && this.resizeHandle && this.resizeStartPoint && this.resizeStartSize && this.resizeStartPosition) {
      const dx = worldPoint.x - this.resizeStartPoint.x
      const dy = worldPoint.y - this.resizeStartPoint.y

      this.handleResize(this.resizeNode, this.resizeHandle, dx, dy)
      this.updateEdges()
      this.renderer.markDirty()
      return
    }

    // 创建连线
    if (this.isCreatingEdge) {
      this.edgePreviewEnd = worldPoint

      // 检测是否悬浮在目标节点上
      const targetNode = this.findNodeAt(worldPoint)
      if (targetNode && targetNode !== this.edgeStartNode) {
        this.edgeTargetNode = targetNode
      } else {
        this.edgeTargetNode = null
      }

      this.renderer.markDirty()
      return
    }

    // 拖拽节点
    if (this.dragManager.isDraggingActive()) {
      const draggedNodes = this.dragManager.getDraggedNodes()

      // 如果只拖拽一个节点，应用吸附
      if (draggedNodes.length === 1) {
        const node = draggedNodes[0]
        const snapResult = this.snapGuide.snap(
          node,
          worldPoint.x,
          worldPoint.y,
          this.nodes,
          this.renderer.getCamera().zoom
        )

        this.dragManager.drag(worldPoint, { x: snapResult.x, y: snapResult.y })
        this.snapGuides = snapResult.snappedX || snapResult.snappedY ? snapResult.guides : { x: [], y: [] }
      } else {
        this.dragManager.drag(worldPoint)
        this.snapGuides = { x: [], y: [] }
      }

      return
    }

    // 框选
    if (this.selectionBoxStart) {
      this.selectionBoxEnd = worldPoint
      this.renderer.markDirty()
      return
    }

    // 以下是纯 hover 效果，只在 canvas 内有效
    if (!isOverCanvas) {
      this.hoveredNode = null
      this.canvas.style.cursor = 'default'
      return
    }

    // 更新悬浮节点和光标
    const hoveredNode = this.findNodeAt(worldPoint)
    this.hoveredNode = hoveredNode

    if (hoveredNode) {
      // 检查连接点
      const port = hoveredNode.hitTestPort(worldPoint.x, worldPoint.y)
      if (port) {
        this.canvas.style.cursor = 'crosshair'
        this.renderer.markDirty() // 重新渲染以显示连接点
        return
      }

      // 检查调整大小控制点（仅选中的节点）
      if (this.selectionManager.isNodeSelected(hoveredNode)) {
        const resizeHandle = hoveredNode.hitTestResizeHandle(worldPoint.x, worldPoint.y)
        if (resizeHandle) {
          this.canvas.style.cursor = this.getResizeCursor(resizeHandle)
          return
        }
        this.canvas.style.cursor = 'move'
      } else {
        this.canvas.style.cursor = 'pointer'
      }
    } else {
      this.canvas.style.cursor = 'default'
    }

    this.renderer.markDirty()
  }

  // 鼠标抬起
  private onMouseUp(e: MouseEvent): void {
    const point = this.getMousePosition(e)
    const worldPoint = this.renderer.getCamera().screenToWorld(point)

    // 结束平移
    if (this.isPanning) {
      this.isPanning = false
      this.panStartPoint = null
      this.canvas.style.cursor = 'default'
      return
    }

    // 结束调整大小
    if (this.isResizing) {
      this.isResizing = false
      this.resizeNode = null
      this.resizeHandle = null
      this.resizeStartPoint = null
      this.resizeStartSize = null
      this.resizeStartPosition = null
      this.canvas.style.cursor = 'default'
      this.renderer.markDirty()
      return
    }

    // 结束创建连线
    if (this.isCreatingEdge && this.edgeStartNode) {
      const targetNode = this.findNodeAt(worldPoint)

      if (targetNode && targetNode !== this.edgeStartNode) {
        // 创建连线
        try {
          this.createEdge({
            from: this.edgeStartNode.id,
            to: targetNode.id,
          })
        } catch (error) {
          console.error('Failed to create edge:', error)
        }
      }

      // 重置状态
      this.isCreatingEdge = false
      this.edgeStartNode = null
      this.edgeStartPort = null
      this.edgePreviewEnd = null
      this.edgeTargetNode = null
      this.canvas.style.cursor = 'default'
      this.renderer.markDirty()
      return
    }

    // 结束拖拽
    if (this.dragManager.isDraggingActive()) {
      this.dragManager.endDrag(worldPoint)
      this.snapGuides = { x: [], y: [] }
      return
    }

    // 结束框选
    if (this.selectionBoxStart && this.selectionBoxEnd) {
      const rect = {
        x: Math.min(this.selectionBoxStart.x, this.selectionBoxEnd.x),
        y: Math.min(this.selectionBoxStart.y, this.selectionBoxEnd.y),
        width: Math.abs(this.selectionBoxEnd.x - this.selectionBoxStart.x),
        height: Math.abs(this.selectionBoxEnd.y - this.selectionBoxStart.y),
      }

      if (rect.width > 5 || rect.height > 5) {
        this.selectionManager.selectInRect(rect, this.nodes, this.edges)
      }

      this.selectionBoxStart = null
      this.selectionBoxEnd = null
      this.renderer.markDirty()
    }
  }

  // 鼠标滚轮（缩放）
  private onWheel(e: WheelEvent): void {
    e.preventDefault()

    const point = this.getMousePosition(e)
    const delta = -e.deltaY * 0.001

    this.renderer.getCamera().scale(delta, point.x, point.y)
    this.renderer.markDirty()
  }

  // 双击事件（编辑文本）
  private onDoubleClick(e: MouseEvent): void {
    if (this.isEditingText) return

    const point = this.getMousePosition(e)
    const worldPoint = this.renderer.getCamera().screenToWorld(point)

    const clickedNode = this.findNodeAt(worldPoint)
    if (clickedNode) {
      this.startTextEditing(clickedNode)
    }
  }

  // 开始文本编辑
  private startTextEditing(node: Node): void {
    this.isEditingText = true
    this.editingNode = node

    // 创建 textarea
    const textarea = document.createElement('textarea')
    textarea.value = node.content
    textarea.style.cssText = `
      position: absolute;
      background: white;
      border: 2px solid #4A90E2;
      border-radius: 4px;
      padding: 4px;
      font-size: ${node.style.fontSize}px;
      font-family: sans-serif;
      color: ${node.style.fontColor};
      resize: none;
      outline: none;
      z-index: 1000;
      overflow: hidden;
    `

    // 计算 textarea 位置（屏幕坐标）
    const camera = this.renderer.getCamera()
    const center = node.getCenter()
    const screenPos = camera.worldToScreen(center)
    const rect = this.canvas.getBoundingClientRect()

    // 设置 textarea 尺寸和位置
    const width = node.width
    const height = node.height
    textarea.style.width = `${width}px`
    textarea.style.height = `${height}px`
    textarea.style.left = `${rect.left + screenPos.x - width / 2}px`
    textarea.style.top = `${rect.top + screenPos.y - height / 2}px`

    document.body.appendChild(textarea)
    this.textInput = textarea

    // 聚焦并选中所有文本
    textarea.focus()
    textarea.select()

    // 监听事件
    const finishEditing = () => {
      if (this.textInput && this.editingNode) {
        this.editingNode.setContent(this.textInput.value)
        this.renderer.markDirty()
      }
      this.endTextEditing()
    }

    textarea.addEventListener('blur', finishEditing)
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        finishEditing()
      }
      if (e.key === 'Escape') {
        this.endTextEditing()
      }
    })
  }

  // 结束文本编辑
  private endTextEditing(): void {
    if (this.textInput) {
      document.body.removeChild(this.textInput)
      this.textInput = null
    }
    this.isEditingText = false
    this.editingNode = null
  }

  // 右键菜单
  private onContextMenu(e: MouseEvent): void {
    e.preventDefault()

    const point = this.getMousePosition(e)
    const worldPoint = this.renderer.getCamera().screenToWorld(point)

    // 检查是否点击了节点
    const clickedNode = this.findNodeAt(worldPoint)

    const hasSelection = this.selectionManager.hasSelection()

    const menuItems = []

    if (clickedNode) {
      // 如果点击的节点未被选中，先选中它
      if (!this.selectionManager.isNodeSelected(clickedNode)) {
        this.selectionManager.selectNode(clickedNode, false)
      }

      menuItems.push(
        { label: '复制', action: () => this.copy() },
        { label: '剪切', action: () => this.cut() },
        { label: '删除', action: () => this.deleteSelected() },
        { divider: true as const },
        { label: '置于顶层', action: () => this.bringToFront() },
        { label: '置于底层', action: () => this.sendToBack() }
      )
    } else if (hasSelection) {
      menuItems.push(
        { label: '复制', action: () => this.copy() },
        { label: '剪切', action: () => this.cut() },
        { label: '删除', action: () => this.deleteSelected() }
      )
    } else {
      menuItems.push(
        { label: '粘贴', action: () => this.paste(), disabled: this.clipboard.nodes.length === 0 },
        { label: '全选', action: () => this.selectAll() },
        { divider: true as const },
        { label: '自动布局', action: () => this.autoLayout() }
      )
    }

    this.contextMenu.show(e.clientX, e.clientY, menuItems)
  }

  // 键盘按下
  private onKeyDown(e: KeyboardEvent): void {
    if (e.code === 'Space') {
      this.isSpacePressed = true
      if (!this.dragManager.isDraggingActive()) {
        this.canvas.style.cursor = 'grab'
      }
    }

    // Delete 键删除选中的对象
    if (e.code === 'Delete' || e.code === 'Backspace') {
      this.deleteSelected()
    }

    // Ctrl/Cmd + Z 撤销
    if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ' && !e.shiftKey) {
      e.preventDefault()
      this.undo()
    }

    // Ctrl/Cmd + Shift + Z 或 Ctrl/Cmd + Y 重做
    if ((e.ctrlKey || e.metaKey) && (e.shiftKey && e.code === 'KeyZ' || e.code === 'KeyY')) {
      e.preventDefault()
      this.redo()
    }

    // Ctrl/Cmd + C 复制
    if ((e.ctrlKey || e.metaKey) && e.code === 'KeyC') {
      e.preventDefault()
      this.copy()
    }

    // Ctrl/Cmd + X 剪切
    if ((e.ctrlKey || e.metaKey) && e.code === 'KeyX') {
      e.preventDefault()
      this.cut()
    }

    // Ctrl/Cmd + V 粘贴
    if ((e.ctrlKey || e.metaKey) && e.code === 'KeyV') {
      e.preventDefault()
      this.paste()
    }
  }

  // 键盘抬起
  private onKeyUp(e: KeyboardEvent): void {
    if (e.code === 'Space') {
      this.isSpacePressed = false
      if (!this.isPanning) {
        this.canvas.style.cursor = 'default'
      }
    }
  }

  // 获取鼠标位置
  private getMousePosition(e: MouseEvent): Point {
    const rect = this.canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  // 判断鼠标事件是否在 canvas 范围内
  private isPointOverCanvas(e: MouseEvent): boolean {
    const rect = this.canvas.getBoundingClientRect()
    return (
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom
    )
  }

  // 查找指定位置的节点
  private findNodeAt(point: Point): Node | null {
    // 从后往前查找（后面的节点在上层）
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      if (this.nodes[i].hitTest(point.x, point.y)) {
        return this.nodes[i]
      }
    }
    return null
  }

  // 处理调整大小
  private handleResize(node: Node, handle: string, dx: number, dy: number): void {
    if (!this.resizeStartSize || !this.resizeStartPosition) return

    const minSize = 40 // 最小尺寸

    switch (handle) {
      case 'se': // 右下角
        node.width = Math.max(minSize, this.resizeStartSize.width + dx)
        node.height = Math.max(minSize, this.resizeStartSize.height + dy)
        node.setPosition(
          this.resizeStartPosition.x + dx / 2,
          this.resizeStartPosition.y + dy / 2
        )
        break
      case 'sw': // 左下角
        node.width = Math.max(minSize, this.resizeStartSize.width - dx)
        node.height = Math.max(minSize, this.resizeStartSize.height + dy)
        node.setPosition(
          this.resizeStartPosition.x + dx / 2,
          this.resizeStartPosition.y + dy / 2
        )
        break
      case 'ne': // 右上角
        node.width = Math.max(minSize, this.resizeStartSize.width + dx)
        node.height = Math.max(minSize, this.resizeStartSize.height - dy)
        node.setPosition(
          this.resizeStartPosition.x + dx / 2,
          this.resizeStartPosition.y + dy / 2
        )
        break
      case 'nw': // 左上角
        node.width = Math.max(minSize, this.resizeStartSize.width - dx)
        node.height = Math.max(minSize, this.resizeStartSize.height - dy)
        node.setPosition(
          this.resizeStartPosition.x + dx / 2,
          this.resizeStartPosition.y + dy / 2
        )
        break
      case 'e': // 右边
        node.width = Math.max(minSize, this.resizeStartSize.width + dx)
        node.setPosition(this.resizeStartPosition.x + dx / 2, this.resizeStartPosition.y)
        break
      case 'w': // 左边
        node.width = Math.max(minSize, this.resizeStartSize.width - dx)
        node.setPosition(this.resizeStartPosition.x + dx / 2, this.resizeStartPosition.y)
        break
      case 's': // 下边
        node.height = Math.max(minSize, this.resizeStartSize.height + dy)
        node.setPosition(this.resizeStartPosition.x, this.resizeStartPosition.y + dy / 2)
        break
      case 'n': // 上边
        node.height = Math.max(minSize, this.resizeStartSize.height - dy)
        node.setPosition(this.resizeStartPosition.x, this.resizeStartPosition.y + dy / 2)
        break
    }
  }

  // 获取调整大小的光标样式
  private getResizeCursor(handle: string): string {
    const cursors: Record<string, string> = {
      'nw': 'nw-resize',
      'ne': 'ne-resize',
      'se': 'se-resize',
      'sw': 'sw-resize',
      'n': 'n-resize',
      'e': 'e-resize',
      's': 's-resize',
      'w': 'w-resize',
    }
    return cursors[handle] || 'default'
  }

  // 更新所有边的路径
  private updateEdges(): void {
    this.edges.forEach(edge => {
      edge.updatePath(this.edges)
    })
  }

  // 开始渲染循环
  private startRenderLoop(): void {
    this.renderer.startRenderLoop(() => {
      this.render()
    })
  }

  // 渲染
  private render(): void {
    // 传递悬浮节点的 ID 来显示连接点
    const hoveredNodeIds = this.hoveredNode ? [this.hoveredNode.id] : []
    this.renderer.render(this.nodes, this.edges, hoveredNodeIds)

    // 绘制分组（在节点下方）
    this.drawGroups()

    // 绘制选择框
    if (this.selectionBoxStart && this.selectionBoxEnd) {
      this.drawSelectionBox()
    }

    // 绘制选中状态
    this.drawSelection()

    // 绘制连线预览
    if (this.isCreatingEdge && this.edgeStartNode && this.edgePreviewEnd) {
      this.drawEdgePreview()
    }

    // 绘制吸附辅助线
    if (this.snapGuides.x.length > 0 || this.snapGuides.y.length > 0) {
      this.drawSnapGuides()
    }

    // 更新小地图
    this.minimap.render(
      this.nodes,
      this.edges,
      this.renderer.getCamera(),
      this.canvas.width,
      this.canvas.height
    )
  }

  // 绘制分组
  private drawGroups(): void {
    if (this.groups.length === 0) return

    const ctx = this.renderer.getContext()
    const camera = this.renderer.getCamera()

    ctx.save()
    camera.applyTransform(ctx)

    // 先更新分组边界，再绘制（绘制在最底层）
    this.groups.forEach(group => {
      group.updateBoundsFromNodes()
      group.draw(ctx)
    })

    ctx.restore()
  }

  // 绘制吸附辅助线
  private drawSnapGuides(): void {
    const ctx = this.renderer.getContext()
    const camera = this.renderer.getCamera()

    ctx.save()
    camera.applyTransform(ctx)

    ctx.strokeStyle = '#FF6B6B'
    ctx.lineWidth = 1 / camera.zoom
    ctx.setLineDash([5 / camera.zoom, 5 / camera.zoom])

    // 绘制垂直辅助线
    this.snapGuides.x.forEach(x => {
      ctx.beginPath()
      ctx.moveTo(x, -10000)
      ctx.lineTo(x, 10000)
      ctx.stroke()
    })

    // 绘制水平辅助线
    this.snapGuides.y.forEach(y => {
      ctx.beginPath()
      ctx.moveTo(-10000, y)
      ctx.lineTo(10000, y)
      ctx.stroke()
    })

    ctx.setLineDash([])
    ctx.restore()
  }

  // 绘制选择框
  private drawSelectionBox(): void {
    if (!this.selectionBoxStart || !this.selectionBoxEnd) return

    const ctx = this.renderer.getContext()
    const camera = this.renderer.getCamera()

    ctx.save()
    camera.applyTransform(ctx)

    const x = Math.min(this.selectionBoxStart.x, this.selectionBoxEnd.x)
    const y = Math.min(this.selectionBoxStart.y, this.selectionBoxEnd.y)
    const width = Math.abs(this.selectionBoxEnd.x - this.selectionBoxStart.x)
    const height = Math.abs(this.selectionBoxEnd.y - this.selectionBoxStart.y)

    ctx.strokeStyle = '#4A90E2'
    ctx.fillStyle = 'rgba(74, 144, 226, 0.1)'
    ctx.lineWidth = 1 / camera.zoom

    ctx.fillRect(x, y, width, height)
    ctx.strokeRect(x, y, width, height)

    ctx.restore()
  }

  // 绘制选中状态
  private drawSelection(): void {
    const ctx = this.renderer.getContext()
    const camera = this.renderer.getCamera()

    ctx.save()
    camera.applyTransform(ctx)

    // 绘制连线目标节点的高亮（绿色）
    if (this.edgeTargetNode) {
      const bounds = this.edgeTargetNode.getBounds()
      const padding = 6

      ctx.strokeStyle = '#52C41A' // 绿色
      ctx.lineWidth = 3 / camera.zoom
      ctx.setLineDash([])

      ctx.strokeRect(
        bounds.x - padding,
        bounds.y - padding,
        bounds.width + padding * 2,
        bounds.height + padding * 2
      )
    }

    // 绘制选中的节点
    this.selectionManager.getSelectedNodes().forEach(node => {
      const bounds = node.getBounds()
      const padding = 4

      ctx.strokeStyle = '#4A90E2'
      ctx.lineWidth = 2 / camera.zoom
      ctx.setLineDash([5 / camera.zoom, 5 / camera.zoom])

      ctx.strokeRect(
        bounds.x - padding,
        bounds.y - padding,
        bounds.width + padding * 2,
        bounds.height + padding * 2
      )

      ctx.setLineDash([])

      // 绘制调整大小的控制点
      node.drawResizeHandles(ctx)
    })

    ctx.restore()
  }

  // 绘制连线预览
  private drawEdgePreview(): void {
    if (!this.edgeStartNode || !this.edgeStartPort || !this.edgePreviewEnd) return

    const ctx = this.renderer.getContext()
    const camera = this.renderer.getCamera()

    ctx.save()
    camera.applyTransform(ctx)

    const startPoint = this.edgeStartNode.getPortPosition(this.edgeStartPort)

    // 绘制预览线
    ctx.beginPath()
    ctx.moveTo(startPoint.x, startPoint.y)
    ctx.lineTo(this.edgePreviewEnd.x, this.edgePreviewEnd.y)
    ctx.strokeStyle = '#4A90E2'
    ctx.lineWidth = 2 / camera.zoom
    ctx.setLineDash([5 / camera.zoom, 5 / camera.zoom])
    ctx.stroke()
    ctx.setLineDash([])

    ctx.restore()
  }

  // 创建节点
  createNode(data: NodeData): Node {
    const node = new Node(data)
    const command = new CreateNodeCommand(node, this.nodes)
    this.commandManager.execute(command)
    this.renderer.markDirty()
    return node
  }

  // 创建边
  createEdge(data: EdgeData): Edge {
    const edge = new Edge(data)

    // 查找节点
    const fromNode = this.nodes.find(n => n.id === data.from)
    const toNode = this.nodes.find(n => n.id === data.to)

    if (!fromNode || !toNode) {
      throw new Error('Cannot create edge: nodes not found')
    }

    edge.fromNode = fromNode
    edge.toNode = toNode

    const command = new CreateEdgeCommand(edge, this.edges)
    this.commandManager.execute(command)
    this.updateEdges()
    this.renderer.markDirty()
    return edge
  }

  // 删除选中的对象
  deleteSelected(): void {
    const selectedNodes = this.selectionManager.getSelectedNodes()
    const selectedEdges = this.selectionManager.getSelectedEdges()

    // 删除节点
    selectedNodes.forEach(node => {
      const command = new DeleteNodeCommand(node, this.nodes)
      this.commandManager.execute(command)

      // 删除相关的边
      const relatedEdges = this.edges.filter(
        edge => edge.fromNodeId === node.id || edge.toNodeId === node.id
      )
      relatedEdges.forEach(edge => {
        const edgeCommand = new DeleteEdgeCommand(edge, this.edges)
        this.commandManager.execute(edgeCommand)
      })
    })

    // 删除边
    selectedEdges.forEach(edge => {
      const command = new DeleteEdgeCommand(edge, this.edges)
      this.commandManager.execute(command)
    })

    this.selectionManager.clear()
    this.renderer.markDirty()
  }

  // 撤销
  undo(): void {
    if (this.commandManager.undo()) {
      this.updateEdges()
      this.renderer.markDirty()
    }
  }

  // 重做
  redo(): void {
    if (this.commandManager.redo()) {
      this.updateEdges()
      this.renderer.markDirty()
    }
  }

  // 自动布局
  autoLayout(options: LayoutOptions = { type: 'hierarchical' }): void {
    LayoutEngine.layout(this.nodes, this.edges, options)
    this.updateEdges()
    this.renderer.markDirty()
  }

  // 清空画布
  clear(): void {
    this.nodes = []
    this.edges = []
    this.groups = []
    this.selectionManager.clear()
    this.commandManager.clear()
    this.renderer.markDirty()
  }

  // 获取所有节点
  getNodes(): Node[] {
    return this.nodes
  }

  // 获取所有边
  getEdges(): Edge[] {
    return this.edges
  }

  // 更新节点样式
  updateNodeStyle(nodeId: string, style: Partial<NodeStyle>): void {
    const node = this.nodes.find(n => n.id === nodeId)
    if (!node) return

    Object.assign(node.style, style)
    this.renderer.markDirty()
  }

  // 批量更新节点样式
  updateNodesStyle(nodeIds: string[], style: Partial<NodeStyle>): void {
    nodeIds.forEach(id => this.updateNodeStyle(id, style))
  }

  // 更新边样式
  updateEdgeStyle(edgeId: string, style: Partial<EdgeStyle>): void {
    const edge = this.edges.find(e => e.id === edgeId)
    if (!edge) return

    Object.assign(edge.style, style)
    this.renderer.markDirty()
  }

  // 批量更新边样式
  updateEdgesStyle(edgeIds: string[], style: Partial<EdgeStyle>): void {
    edgeIds.forEach(id => this.updateEdgeStyle(id, style))
  }

  // 复制
  copy(): void {
    const selectedNodes = this.selectionManager.getSelectedNodes()
    const selectedEdges = this.selectionManager.getSelectedEdges()

    if (selectedNodes.length === 0 && selectedEdges.length === 0) return

    // 克隆选中的节点
    this.clipboard.nodes = selectedNodes.map(node => node.clone())

    // 克隆选中的边（只克隆两端都在选中节点中的边）
    const selectedNodeIds = new Set(selectedNodes.map(n => n.id))
    this.clipboard.edges = selectedEdges
      .filter(edge => selectedNodeIds.has(edge.fromNodeId) && selectedNodeIds.has(edge.toNodeId))
      .map(edge => edge.clone())
  }

  // 剪切
  cut(): void {
    this.copy()
    this.deleteSelected()
  }

  // 粘贴
  paste(): void {
    if (this.clipboard.nodes.length === 0) return

    // 清除当前选择
    this.selectionManager.clear()

    // 创建节点ID映射（旧ID -> 新ID）
    const idMap = new Map<string, string>()

    // 粘贴节点（偏移一定距离）
    const offset = 30
    const newNodes: Node[] = []

    this.clipboard.nodes.forEach(node => {
      const clonedNode = node.clone()
      const oldId = node.id

      // 生成新ID
      clonedNode.id = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
      idMap.set(oldId, clonedNode.id)

      // 偏移位置
      clonedNode.setPosition(
        clonedNode.transform.x + offset,
        clonedNode.transform.y + offset
      )

      // 添加到画布
      const command = new CreateNodeCommand(clonedNode, this.nodes)
      this.commandManager.execute(command)

      newNodes.push(clonedNode)
      this.selectionManager.selectNode(clonedNode, true)
    })

    // 粘贴边
    this.clipboard.edges.forEach(edge => {
      const newFromId = idMap.get(edge.fromNodeId)
      const newToId = idMap.get(edge.toNodeId)

      if (!newFromId || !newToId) return

      const fromNode = this.nodes.find(n => n.id === newFromId)
      const toNode = this.nodes.find(n => n.id === newToId)

      if (!fromNode || !toNode) return

      const clonedEdge = edge.clone()
      clonedEdge.id = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
      clonedEdge.fromNodeId = newFromId
      clonedEdge.toNodeId = newToId
      clonedEdge.fromNode = fromNode
      clonedEdge.toNode = toNode

      const command = new CreateEdgeCommand(clonedEdge, this.edges)
      this.commandManager.execute(command)
    })

    this.updateEdges()
    this.renderer.markDirty()
  }

  // 全选
  selectAll(): void {
    this.nodes.forEach(node => {
      this.selectionManager.selectNode(node, true)
    })
  }

  // 置于顶层
  bringToFront(): void {
    const selectedNodes = this.selectionManager.getSelectedNodes()
    selectedNodes.forEach(node => {
      const index = this.nodes.indexOf(node)
      if (index !== -1) {
        this.nodes.splice(index, 1)
        this.nodes.push(node)
      }
    })
    this.renderer.markDirty()
  }

  // 置于底层
  sendToBack(): void {
    const selectedNodes = this.selectionManager.getSelectedNodes()
    selectedNodes.forEach(node => {
      const index = this.nodes.indexOf(node)
      if (index !== -1) {
        this.nodes.splice(index, 1)
        this.nodes.unshift(node)
      }
    })
    this.renderer.markDirty()
  }

  // 分组选中节点
  groupSelected(label: string = 'Group'): Group | null {
    const selectedNodes = this.selectionManager.getSelectedNodes()
    if (selectedNodes.length < 2) return null

    const group = new Group(selectedNodes, label)
    this.groups.push(group)
    this.renderer.markDirty()
    return group
  }

  // 解除分组
  ungroup(group: Group): void {
    const idx = this.groups.indexOf(group)
    if (idx !== -1) {
      this.groups.splice(idx, 1)
      this.renderer.markDirty()
    }
  }

  // 解除选中节点所在的所有分组
  ungroupSelected(): void {
    const selectedNodes = this.selectionManager.getSelectedNodes()
    const groupsToRemove = this.groups.filter(g =>
      selectedNodes.some(n => g.containsNode(n))
    )
    groupsToRemove.forEach(g => this.ungroup(g))
  }

  // 获取所有分组
  getGroups(): Group[] {
    return this.groups
  }

  // 对齐工具
  alignLeft(): void {
    const selectedNodes = this.selectionManager.getSelectedNodes()
    if (selectedNodes.length < 2) return

    const minX = Math.min(...selectedNodes.map(n => n.transform.x - n.width / 2))
    selectedNodes.forEach(node => {
      node.setPosition(minX + node.width / 2, node.transform.y)
    })
    this.updateEdges()
    this.renderer.markDirty()
  }

  alignCenterHorizontal(): void {
    const selectedNodes = this.selectionManager.getSelectedNodes()
    if (selectedNodes.length < 2) return

    const avgX = selectedNodes.reduce((sum, n) => sum + n.transform.x, 0) / selectedNodes.length
    selectedNodes.forEach(node => {
      node.setPosition(avgX, node.transform.y)
    })
    this.updateEdges()
    this.renderer.markDirty()
  }

  alignRight(): void {
    const selectedNodes = this.selectionManager.getSelectedNodes()
    if (selectedNodes.length < 2) return

    const maxX = Math.max(...selectedNodes.map(n => n.transform.x + n.width / 2))
    selectedNodes.forEach(node => {
      node.setPosition(maxX - node.width / 2, node.transform.y)
    })
    this.updateEdges()
    this.renderer.markDirty()
  }

  alignTop(): void {
    const selectedNodes = this.selectionManager.getSelectedNodes()
    if (selectedNodes.length < 2) return

    const minY = Math.min(...selectedNodes.map(n => n.transform.y - n.height / 2))
    selectedNodes.forEach(node => {
      node.setPosition(node.transform.x, minY + node.height / 2)
    })
    this.updateEdges()
    this.renderer.markDirty()
  }

  alignCenterVertical(): void {
    const selectedNodes = this.selectionManager.getSelectedNodes()
    if (selectedNodes.length < 2) return

    const avgY = selectedNodes.reduce((sum, n) => sum + n.transform.y, 0) / selectedNodes.length
    selectedNodes.forEach(node => {
      node.setPosition(node.transform.x, avgY)
    })
    this.updateEdges()
    this.renderer.markDirty()
  }

  alignBottom(): void {
    const selectedNodes = this.selectionManager.getSelectedNodes()
    if (selectedNodes.length < 2) return

    const maxY = Math.max(...selectedNodes.map(n => n.transform.y + n.height / 2))
    selectedNodes.forEach(node => {
      node.setPosition(node.transform.x, maxY - node.height / 2)
    })
    this.updateEdges()
    this.renderer.markDirty()
  }

  distributeHorizontally(): void {
    const selectedNodes = this.selectionManager.getSelectedNodes()
    if (selectedNodes.length < 3) return

    const sorted = [...selectedNodes].sort((a, b) => a.transform.x - b.transform.x)
    const first = sorted[0]
    const last = sorted[sorted.length - 1]
    const totalSpace = last.transform.x - first.transform.x
    const spacing = totalSpace / (sorted.length - 1)

    sorted.forEach((node, index) => {
      if (index > 0 && index < sorted.length - 1) {
        node.setPosition(first.transform.x + spacing * index, node.transform.y)
      }
    })
    this.updateEdges()
    this.renderer.markDirty()
  }

  distributeVertically(): void {
    const selectedNodes = this.selectionManager.getSelectedNodes()
    if (selectedNodes.length < 3) return

    const sorted = [...selectedNodes].sort((a, b) => a.transform.y - b.transform.y)
    const first = sorted[0]
    const last = sorted[sorted.length - 1]
    const totalSpace = last.transform.y - first.transform.y
    const spacing = totalSpace / (sorted.length - 1)

    sorted.forEach((node, index) => {
      if (index > 0 && index < sorted.length - 1) {
        node.setPosition(node.transform.x, first.transform.y + spacing * index)
      }
    })
    this.updateEdges()
    this.renderer.markDirty()
  }

  // 销毁
  destroy(): void {
    this.canvas.removeEventListener('mousemove', this.boundOnMouseMove)
    this.canvas.removeEventListener('mouseup', this.boundOnMouseUp)
    window.removeEventListener('mouseup', this.boundOnMouseUp)
    window.removeEventListener('keydown', this.boundOnKeyDown)
    window.removeEventListener('keyup', this.boundOnKeyUp)
    this.renderer.destroy()
    this.contextMenu.destroy()
    this.minimap.destroy()
    this.clear()
  }

  // 导出为 JSON
  exportToJSON(): string {
    const data = {
      nodes: this.nodes.map(node => ({
        id: node.id,
        x: node.transform.x,
        y: node.transform.y,
        width: node.width,
        height: node.height,
        content: node.content,
        style: node.style,
      })),
      edges: this.edges.map(edge => ({
        id: edge.id,
        from: edge.fromNodeId,
        to: edge.toNodeId,
        style: edge.style,
      })),
    }
    return JSON.stringify(data, null, 2)
  }

  // 从 JSON 导入
  importFromJSON(json: string): void {
    try {
      const data = JSON.parse(json)

      // 清空当前画布
      this.clear()

      // 导入节点
      const nodeMap = new Map<string, Node>()
      data.nodes?.forEach((nodeData: any) => {
        const node = this.createNode(nodeData)
        nodeMap.set(nodeData.id, node)
      })

      // 导入边
      data.edges?.forEach((edgeData: any) => {
        this.createEdge(edgeData)
      })

      this.renderer.markDirty()
    } catch (error) {
      console.error('Failed to import JSON:', error)
      throw new Error('Invalid JSON format')
    }
  }

  // 导出为 PNG
  exportToPNG(): string {
    // 创建临时 canvas
    const tempCanvas = document.createElement('canvas')
    const bounds = this.getContentBounds()

    const padding = 50
    tempCanvas.width = bounds.width + padding * 2
    tempCanvas.height = bounds.height + padding * 2

    const ctx = tempCanvas.getContext('2d')
    if (!ctx) throw new Error('Failed to get 2D context')

    // 白色背景
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)

    // 平移到内容区域
    ctx.translate(padding - bounds.x, padding - bounds.y)

    // 绘制边
    this.edges.forEach(edge => {
      if (edge.visible) {
        edge.draw(ctx)
      }
    })

    // 绘制节点
    this.nodes.forEach(node => {
      if (node.visible) {
        node.draw(ctx, false)
      }
    })

    return tempCanvas.toDataURL('image/png')
  }

  // 导出为 SVG
  exportToSVG(): string {
    const bounds = this.getContentBounds()
    const padding = 50
    const width = bounds.width + padding * 2
    const height = bounds.height + padding * 2

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n`
    svg += `  <rect width="${width}" height="${height}" fill="white"/>\n`
    svg += `  <g transform="translate(${padding - bounds.x}, ${padding - bounds.y})">\n`

    // 绘制边
    this.edges.forEach(edge => {
      if (!edge.visible || edge.points.length < 2) return

      const points = edge.points.map(p => `${p.x},${p.y}`).join(' ')
      svg += `    <polyline points="${points}" fill="none" stroke="${edge.style.stroke}" stroke-width="${edge.style.strokeWidth}" opacity="${edge.style.opacity}"`

      if (edge.style.strokeDasharray) {
        svg += ` stroke-dasharray="${edge.style.strokeDasharray}"`
      }

      svg += `/>\n`

      // 绘制箭头（简化版）
      if (edge.style.arrowType === 'arrow' && edge.points.length >= 2) {
        const last = edge.points[edge.points.length - 1]
        const secondLast = edge.points[edge.points.length - 2]
        const angle = Math.atan2(last.y - secondLast.y, last.x - secondLast.x)
        const arrowSize = edge.style.arrowSize

        const p1x = last.x - arrowSize * Math.cos(angle - Math.PI / 6)
        const p1y = last.y - arrowSize * Math.sin(angle - Math.PI / 6)
        const p2x = last.x - arrowSize * Math.cos(angle + Math.PI / 6)
        const p2y = last.y - arrowSize * Math.sin(angle + Math.PI / 6)

        svg += `    <polygon points="${last.x},${last.y} ${p1x},${p1y} ${p2x},${p2y}" fill="${edge.style.stroke}" opacity="${edge.style.opacity}"/>\n`
      }
    })

    // 绘制节点
    this.nodes.forEach(node => {
      if (!node.visible) return

      const bounds = node.getBounds()
      svg += `    <rect x="${bounds.x}" y="${bounds.y}" width="${bounds.width}" height="${bounds.height}" fill="${node.style.fill}" stroke="${node.style.stroke}" stroke-width="${node.style.strokeWidth}" rx="${node.style.borderRadius}" opacity="${node.style.opacity}"/>\n`
      svg += `    <text x="${node.transform.x}" y="${node.transform.y}" text-anchor="middle" dominant-baseline="middle" font-size="${node.style.fontSize}" fill="${node.style.fontColor}">${node.content}</text>\n`
    })

    svg += `  </g>\n`
    svg += `</svg>`

    return svg
  }

  // 获取内容边界
  private getContentBounds(): { x: number; y: number; width: number; height: number } {
    if (this.nodes.length === 0) {
      return { x: 0, y: 0, width: 800, height: 600 }
    }

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    this.nodes.forEach(node => {
      const bounds = node.getBounds()
      minX = Math.min(minX, bounds.x)
      minY = Math.min(minY, bounds.y)
      maxX = Math.max(maxX, bounds.x + bounds.width)
      maxY = Math.max(maxY, bounds.y + bounds.height)
    })

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    }
  }
}
