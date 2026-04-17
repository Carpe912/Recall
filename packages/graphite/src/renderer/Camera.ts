import type { Point } from '../types'

export class Camera {
  x: number = 0
  y: number = 0
  zoom: number = 1
  minZoom: number = 0.1
  maxZoom: number = 5

  // 屏幕坐标转世界坐标
  screenToWorld(point: Point): Point {
    return {
      x: (point.x - this.x) / this.zoom,
      y: (point.y - this.y) / this.zoom,
    }
  }

  // 世界坐标转屏幕坐标
  worldToScreen(point: Point): Point {
    return {
      x: point.x * this.zoom + this.x,
      y: point.y * this.zoom + this.y,
    }
  }

  // 平移
  translate(dx: number, dy: number): void {
    this.x += dx
    this.y += dy
  }

  // 缩放
  scale(delta: number, centerX: number, centerY: number): void {
    const oldZoom = this.zoom
    const newZoom = Math.max(
      this.minZoom,
      Math.min(this.maxZoom, this.zoom * (1 + delta))
    )

    if (newZoom === oldZoom) return

    // 以鼠标位置为中心缩放
    const worldX = (centerX - this.x) / oldZoom
    const worldY = (centerY - this.y) / oldZoom

    this.zoom = newZoom

    this.x = centerX - worldX * newZoom
    this.y = centerY - worldY * newZoom
  }

  // 重置
  reset(): void {
    this.x = 0
    this.y = 0
    this.zoom = 1
  }

  // 应用变换到 Canvas 上下文
  applyTransform(ctx: CanvasRenderingContext2D): void {
    ctx.translate(this.x, this.y)
    ctx.scale(this.zoom, this.zoom)
  }
}
