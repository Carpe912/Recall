import type { Node } from '../core/Node'
import type { Edge } from '../core/Edge'
import { Camera } from './Camera'
import { DirtyRectManager } from './DirtyRectManager'
import type { ThemeColors } from '../utils/ThemeManager'
import type { Rect } from '../types'

export class Renderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private camera: Camera
  private dirtyRectManager: DirtyRectManager
  private animationFrameId: number | null = null
  private needsRender: boolean = true
  private resizeObserver: ResizeObserver
  private themeColors: ThemeColors = {
    background: '#ffffff',
    grid: '#f0f0f0',
    text: '#333333',
    nodeFill: '#ffffff',
    nodeStroke: '#333333',
    edgeStroke: '#666666',
  }

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

    // 用 ResizeObserver 监听 canvas 尺寸变化（比 window resize 更及时，能感知布局变化）
    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(canvas)
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
  // rect 为世界坐标包围盒；不传则全量重绘
  markDirty(worldRect?: Rect): void {
    this.needsRender = true
    if (!worldRect) {
      this.dirtyRectManager.markAllDirty(this.canvas.width, this.canvas.height)
      return
    }
    // 世界坐标 → 屏幕坐标
    const dpr = window.devicePixelRatio || 1
    const topLeft = this.camera.worldToScreen({ x: worldRect.x, y: worldRect.y })
    const bottomRight = this.camera.worldToScreen({
      x: worldRect.x + worldRect.width,
      y: worldRect.y + worldRect.height,
    })
    this.dirtyRectManager.markDirty({
      x: topLeft.x * dpr,
      y: topLeft.y * dpr,
      width: (bottomRight.x - topLeft.x) * dpr,
      height: (bottomRight.y - topLeft.y) * dpr,
    })
  }

  // 渲染场景
  render(nodes: Node[], edges: Edge[], selectedNodeIds: string[] = []): void {
    if (!this.needsRender) return

    const fullRedraw = this.dirtyRectManager.needsFullRedraw()
    const dirtyRegions = this.dirtyRectManager.getDirtyRegions()

    if (fullRedraw || dirtyRegions.length === 0) {
      // 全量重绘
      this.ctx.save()
      this.ctx.fillStyle = this.themeColors.background
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
      this.drawBackground()
      this.camera.applyTransform(this.ctx)
      edges.forEach(edge => { if (edge.visible) edge.draw(this.ctx) })
      nodes.forEach(node => {
        if (node.visible) node.draw(this.ctx, selectedNodeIds.includes(node.id))
      })
      this.ctx.restore()
    } else {
      // 局部重绘：只清除并重绘脏区域
      const dirty = dirtyRegions[0]

      this.ctx.save()
      // clip 到脏区域，所有后续绘制都被裁切在此范围内
      this.ctx.beginPath()
      this.ctx.rect(dirty.x, dirty.y, dirty.width, dirty.height)
      this.ctx.clip()

      // 清除脏区域并填充背景色
      this.ctx.fillStyle = this.themeColors.background
      this.ctx.fillRect(dirty.x, dirty.y, dirty.width, dirty.height)

      // 重绘背景网格（clip 已限制范围，不会超出）
      this.drawBackground()

      // 应用相机变换后重绘所有图形（clip 保证只有脏区域内的像素被写入）
      this.camera.applyTransform(this.ctx)
      edges.forEach(edge => { if (edge.visible) edge.draw(this.ctx) })
      nodes.forEach(node => {
        if (node.visible) node.draw(this.ctx, selectedNodeIds.includes(node.id))
      })

      this.ctx.restore()
    }

    this.needsRender = false
    this.dirtyRectManager.clear()
  }

  // 绘制背景（网格）
  private drawBackground(): void {
    const gridSize = 20
    const gridColor = this.themeColors.grid

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

  // 设置主题颜色
  setThemeColors(colors: ThemeColors): void {
    this.themeColors = colors
    this.markDirty()
  }

  // 获取主题颜色
  getThemeColors(): ThemeColors {
    return this.themeColors
  }

  // 销毁
  destroy(): void {
    this.stopRenderLoop()
    this.resizeObserver.disconnect()
  }
}
