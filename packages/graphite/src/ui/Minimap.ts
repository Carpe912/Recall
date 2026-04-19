import type { Node } from '../core/Node'
import type { Edge } from '../core/Edge'
import type { Camera } from '../renderer/Camera'

export class Minimap {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private container: HTMLDivElement
  private handle: HTMLDivElement
  private width: number = 200
  private height: number = 150
  private scale: number = 0.1

  // 画布内导航拖拽
  private isNavigating: boolean = false

  // 容器拖拽移动
  private isDraggingContainer: boolean = false
  private dragStartX: number = 0
  private dragStartY: number = 0
  private containerStartLeft: number = 0
  private containerStartTop: number = 0

  private boundOnDocMouseMove: (e: MouseEvent) => void
  private boundOnDocMouseUp: () => void

  constructor(parentCanvas: HTMLCanvasElement) {
    // 拖拽手柄
    this.handle = document.createElement('div')
    this.handle.style.cssText = `
      height: 22px;
      background: #f0f0f0;
      border-bottom: 1px solid #e0e0e0;
      cursor: move;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: #aaa;
      letter-spacing: 0.08em;
      user-select: none;
      flex-shrink: 0;
    `
    this.handle.textContent = '⠿ 小地图'

    // 小地图 canvas
    this.canvas = document.createElement('canvas')
    this.canvas.width = this.width
    this.canvas.height = this.height
    this.canvas.style.cssText = `
      display: block;
      cursor: crosshair;
    `

    const ctx = this.canvas.getContext('2d')
    if (!ctx) throw new Error('Failed to get 2D context for minimap')
    this.ctx = ctx

    // 容器：默认隐藏，初始放右下角
    this.container = document.createElement('div')
    this.container.style.cssText = `
      position: absolute;
      bottom: 20px;
      right: 20px;
      display: none;
      flex-direction: column;
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid #ddd;
      border-radius: 6px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
      overflow: hidden;
      user-select: none;
      z-index: 80;
    `

    this.container.appendChild(this.handle)
    this.container.appendChild(this.canvas)

    const parent = parentCanvas.parentElement
    if (parent) {
      parent.style.position = 'relative'
      parent.appendChild(this.container)
    }

    // 导航事件（canvas 内点击拖拽移动主视口）
    this.canvas.addEventListener('mousedown', (e) => {
      this.isNavigating = true
      this.navigate(e)
    })
    this.canvas.addEventListener('mousemove', (e) => {
      if (this.isNavigating) this.navigate(e)
    })
    this.canvas.addEventListener('mouseup', () => { this.isNavigating = false })
    this.canvas.addEventListener('mouseleave', () => { this.isNavigating = false })

    // 容器拖拽移动事件
    this.boundOnDocMouseMove = this.onDocMouseMove.bind(this)
    this.boundOnDocMouseUp = this.onDocMouseUp.bind(this)
    this.handle.addEventListener('mousedown', this.onHandleMouseDown.bind(this))
  }

  // 点击小地图导航主画布
  private navigate(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const worldX = (x - this.width / 2) / this.scale
    const worldY = (y - this.height / 2) / this.scale
    this.canvas.dispatchEvent(new CustomEvent('minimapClick', {
      detail: { x: worldX, y: worldY },
    }))
  }

  // 拖拽手柄 mousedown：切换到 top/left 定位，开始跟踪
  private onHandleMouseDown(e: MouseEvent): void {
    e.preventDefault()
    this.isDraggingContainer = true
    this.dragStartX = e.clientX
    this.dragStartY = e.clientY

    // 将 bottom/right 转换为 top/left（只做一次）
    const rect = this.container.getBoundingClientRect()
    const parentRect = this.container.parentElement!.getBoundingClientRect()
    this.containerStartLeft = rect.left - parentRect.left
    this.containerStartTop = rect.top - parentRect.top

    this.container.style.bottom = 'auto'
    this.container.style.right = 'auto'
    this.container.style.left = `${this.containerStartLeft}px`
    this.container.style.top = `${this.containerStartTop}px`

    document.addEventListener('mousemove', this.boundOnDocMouseMove)
    document.addEventListener('mouseup', this.boundOnDocMouseUp)
  }

  private onDocMouseMove(e: MouseEvent): void {
    if (!this.isDraggingContainer) return
    const dx = e.clientX - this.dragStartX
    const dy = e.clientY - this.dragStartY

    const parent = this.container.parentElement!
    const maxLeft = parent.offsetWidth - this.container.offsetWidth
    const maxTop = parent.offsetHeight - this.container.offsetHeight

    const newLeft = Math.max(0, Math.min(maxLeft, this.containerStartLeft + dx))
    const newTop = Math.max(0, Math.min(maxTop, this.containerStartTop + dy))

    this.container.style.left = `${newLeft}px`
    this.container.style.top = `${newTop}px`
  }

  private onDocMouseUp(): void {
    this.isDraggingContainer = false
    document.removeEventListener('mousemove', this.boundOnDocMouseMove)
    document.removeEventListener('mouseup', this.boundOnDocMouseUp)
  }

  render(nodes: Node[], edges: Edge[], camera: Camera, canvasWidth: number, canvasHeight: number): void {
    // 不可见时跳过渲染
    if (this.container.style.display === 'none') return

    this.ctx.clearRect(0, 0, this.width, this.height)
    this.ctx.fillStyle = '#f5f5f5'
    this.ctx.fillRect(0, 0, this.width, this.height)

    this.ctx.save()
    this.ctx.translate(this.width / 2, this.height / 2)
    this.ctx.scale(this.scale, this.scale)

    // 绘制边
    this.ctx.strokeStyle = '#999'
    this.ctx.lineWidth = 1 / this.scale
    edges.forEach(edge => {
      if (edge.points.length < 2) return
      this.ctx.beginPath()
      this.ctx.moveTo(edge.points[0].x, edge.points[0].y)
      for (let i = 1; i < edge.points.length; i++) {
        this.ctx.lineTo(edge.points[i].x, edge.points[i].y)
      }
      this.ctx.stroke()
    })

    // 绘制节点
    this.ctx.fillStyle = '#4A90E2'
    this.ctx.strokeStyle = '#333'
    this.ctx.lineWidth = 1 / this.scale
    nodes.forEach(node => {
      const bounds = node.getBounds()
      this.ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height)
      this.ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)
    })

    // 绘制视口框
    const viewportWidth = canvasWidth / camera.zoom
    const viewportHeight = canvasHeight / camera.zoom
    const viewportX = -camera.x / camera.zoom
    const viewportY = -camera.y / camera.zoom

    this.ctx.strokeStyle = '#FF6B6B'
    this.ctx.lineWidth = 2 / this.scale
    this.ctx.strokeRect(viewportX, viewportY, viewportWidth, viewportHeight)

    this.ctx.restore()
  }

  toggle(): void {
    if (this.container.style.display === 'none') {
      this.show()
    } else {
      this.hide()
    }
  }

  isVisible(): boolean {
    return this.container.style.display !== 'none'
  }

  show(): void {
    this.container.style.display = 'flex'
  }

  hide(): void {
    this.container.style.display = 'none'
  }

  setSize(width: number, height: number): void {
    this.width = width
    this.height = height
    this.canvas.width = width
    this.canvas.height = height
  }

  setScale(scale: number): void {
    this.scale = scale
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas
  }

  destroy(): void {
    document.removeEventListener('mousemove', this.boundOnDocMouseMove)
    document.removeEventListener('mouseup', this.boundOnDocMouseUp)
    this.container.remove()
  }
}
