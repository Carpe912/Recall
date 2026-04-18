import type { Node } from '../core/Node'
import type { Edge } from '../core/Edge'
import type { Camera } from '../renderer/Camera'

export class Minimap {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private container: HTMLDivElement
  private width: number = 200
  private height: number = 150
  private scale: number = 0.1
  private isDragging: boolean = false

  constructor(parentCanvas: HTMLCanvasElement) {
    // 创建容器
    this.container = document.createElement('div')
    this.container.style.cssText = `
      position: absolute;
      bottom: 20px;
      right: 20px;
      background: rgba(255, 255, 255, 0.9);
      border: 2px solid #ddd;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      overflow: hidden;
    `

    // 创建 canvas
    this.canvas = document.createElement('canvas')
    this.canvas.width = this.width
    this.canvas.height = this.height
    this.canvas.style.cssText = `
      display: block;
      cursor: pointer;
    `

    const ctx = this.canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Failed to get 2D context for minimap')
    }
    this.ctx = ctx

    this.container.appendChild(this.canvas)

    // 添加到父元素
    const parent = parentCanvas.parentElement
    if (parent) {
      parent.style.position = 'relative'
      parent.appendChild(this.container)
    }

    // 添加交互事件
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this))
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this))
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this))
    this.canvas.addEventListener('mouseleave', this.onMouseUp.bind(this))
  }

  private onMouseDown(e: MouseEvent): void {
    this.isDragging = true
    this.handleClick(e)
  }

  private onMouseMove(e: MouseEvent): void {
    if (this.isDragging) {
      this.handleClick(e)
    }
  }

  private onMouseUp(): void {
    this.isDragging = false
  }

  private handleClick(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // 转换为世界坐标
    const worldX = (x - this.width / 2) / this.scale
    const worldY = (y - this.height / 2) / this.scale

    // 触发相机移动事件
    this.canvas.dispatchEvent(new CustomEvent('minimapClick', {
      detail: { x: worldX, y: worldY }
    }))
  }

  render(nodes: Node[], edges: Edge[], camera: Camera, canvasWidth: number, canvasHeight: number): void {
    // 清空画布
    this.ctx.clearRect(0, 0, this.width, this.height)

    // 绘制背景
    this.ctx.fillStyle = '#f5f5f5'
    this.ctx.fillRect(0, 0, this.width, this.height)

    this.ctx.save()

    // 应用缩放和平移
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

  setSize(width: number, height: number): void {
    this.width = width
    this.height = height
    this.canvas.width = width
    this.canvas.height = height
  }

  setScale(scale: number): void {
    this.scale = scale
  }

  show(): void {
    this.container.style.display = 'block'
  }

  hide(): void {
    this.container.style.display = 'none'
  }

  destroy(): void {
    this.container.remove()
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas
  }
}
