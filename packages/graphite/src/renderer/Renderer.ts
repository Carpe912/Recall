import type { Node } from '../core/Node'
import type { Edge } from '../core/Edge'
import { Camera } from './Camera'
import { DirtyRectManager } from './DirtyRectManager'

export class Renderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private camera: Camera
  private dirtyRectManager: DirtyRectManager
  private animationFrameId: number | null = null
  private needsRender: boolean = true

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Failed to get 2D context')
    }
    this.ctx = ctx
    this.camera = new Camera()
    this.dirtyRectManager = new DirtyRectManager()

    // 设置 canvas 尺寸
    this.resize()

    // 监听窗口大小变化
    window.addEventListener('resize', () => this.resize())
  }

  // 调整 canvas 尺寸
  private resize(): void {
    const dpr = window.devicePixelRatio || 1
    const rect = this.canvas.getBoundingClientRect()

    this.canvas.width = rect.width * dpr
    this.canvas.height = rect.height * dpr

    this.canvas.style.width = `${rect.width}px`
    this.canvas.style.height = `${rect.height}px`

    this.ctx.scale(dpr, dpr)

    this.markDirty()
  }

  // 标记需要重新渲染
  markDirty(): void {
    this.needsRender = true
    this.dirtyRectManager.markAllDirty(this.canvas.width, this.canvas.height)
  }

  // 渲染场景
  render(nodes: Node[], edges: Edge[], selectedNodeIds: string[] = []): void {
    if (!this.needsRender) return

    this.ctx.save()

    // 清除画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    // 绘制背景
    this.drawBackground()

    // 应用相机变换
    this.camera.applyTransform(this.ctx)

    // 先绘制边
    edges.forEach(edge => {
      if (edge.visible) {
        edge.draw(this.ctx)
      }
    })

    // 再绘制节点
    nodes.forEach(node => {
      if (node.visible) {
        const showPorts = selectedNodeIds.includes(node.id)
        node.draw(this.ctx, showPorts)
      }
    })

    this.ctx.restore()

    this.needsRender = false
    this.dirtyRectManager.clear()
  }

  // 绘制背景（网格）
  private drawBackground(): void {
    const gridSize = 20
    const gridColor = '#f0f0f0'

    this.ctx.save()

    // 应用相机变换
    this.camera.applyTransform(this.ctx)

    // 计算可见区域
    const startX = Math.floor(-this.camera.x / this.camera.zoom / gridSize) * gridSize
    const startY = Math.floor(-this.camera.y / this.camera.zoom / gridSize) * gridSize
    const endX = startX + (this.canvas.width / this.camera.zoom) + gridSize
    const endY = startY + (this.canvas.height / this.camera.zoom) + gridSize

    // 绘制网格
    this.ctx.strokeStyle = gridColor
    this.ctx.lineWidth = 1 / this.camera.zoom

    // 垂直线
    for (let x = startX; x <= endX; x += gridSize) {
      this.ctx.beginPath()
      this.ctx.moveTo(x, startY)
      this.ctx.lineTo(x, endY)
      this.ctx.stroke()
    }

    // 水平线
    for (let y = startY; y <= endY; y += gridSize) {
      this.ctx.beginPath()
      this.ctx.moveTo(startX, y)
      this.ctx.lineTo(endX, y)
      this.ctx.stroke()
    }

    this.ctx.restore()
  }

  // 开始渲染循环
  startRenderLoop(renderCallback: () => void): void {
    const loop = () => {
      renderCallback()
      this.animationFrameId = requestAnimationFrame(loop)
    }
    loop()
  }

  // 停止渲染循环
  stopRenderLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  // 获取相机
  getCamera(): Camera {
    return this.camera
  }

  // 获取 Canvas 元素
  getCanvas(): HTMLCanvasElement {
    return this.canvas
  }

  // 获取上下文
  getContext(): CanvasRenderingContext2D {
    return this.ctx
  }

  // 销毁
  destroy(): void {
    this.stopRenderLoop()
    window.removeEventListener('resize', () => this.resize())
  }
}
