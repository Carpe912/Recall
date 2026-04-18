import { GraphicObject } from './GraphicObject'
import type { Point, Rect } from '../types'

export interface PathData {
  id?: string
  points: Point[]
  style?: PathStyle
}

export interface PathStyle {
  stroke?: string
  strokeWidth?: number
  fill?: string
  opacity?: number
  lineCap?: 'butt' | 'round' | 'square'
  lineJoin?: 'miter' | 'round' | 'bevel'
}

export class Path extends GraphicObject {
  points: Point[] = []
  style: Required<PathStyle>

  constructor(data: PathData) {
    super('path', data.id)
    this.points = data.points || []

    // 默认样式
    this.style = {
      stroke: data.style?.stroke || '#333333',
      strokeWidth: data.style?.strokeWidth || 2,
      fill: data.style?.fill || 'none',
      opacity: data.style?.opacity || 1,
      lineCap: data.style?.lineCap || 'round',
      lineJoin: data.style?.lineJoin || 'round',
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.visible || this.points.length < 2) return

    ctx.save()

    // 应用透明度
    ctx.globalAlpha = this.style.opacity

    ctx.strokeStyle = this.style.stroke
    ctx.lineWidth = this.style.strokeWidth
    ctx.lineCap = this.style.lineCap
    ctx.lineJoin = this.style.lineJoin

    // 绘制路径
    ctx.beginPath()
    ctx.moveTo(this.points[0].x, this.points[0].y)

    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y)
    }

    ctx.stroke()

    // 如果有填充色，闭合路径并填充
    if (this.style.fill !== 'none') {
      ctx.closePath()
      ctx.fillStyle = this.style.fill
      ctx.fill()
    }

    ctx.restore()
  }

  hitTest(x: number, y: number): boolean {
    if (this.points.length < 2) return false

    const threshold = this.style.strokeWidth + 5

    // 检查点是否在路径附近
    for (let i = 0; i < this.points.length - 1; i++) {
      const p1 = this.points[i]
      const p2 = this.points[i + 1]

      // 计算点到线段的距离
      const dx = p2.x - p1.x
      const dy = p2.y - p1.y
      const lengthSquared = dx * dx + dy * dy

      if (lengthSquared === 0) {
        // 线段退化为点
        const distance = Math.sqrt((x - p1.x) ** 2 + (y - p1.y) ** 2)
        if (distance <= threshold) return true
        continue
      }

      // 计算投影参数 t
      const t = Math.max(0, Math.min(1, ((x - p1.x) * dx + (y - p1.y) * dy) / lengthSquared))

      // 计算最近点
      const nearestX = p1.x + t * dx
      const nearestY = p1.y + t * dy

      // 计算距离
      const distance = Math.sqrt((x - nearestX) ** 2 + (y - nearestY) ** 2)

      if (distance <= threshold) return true
    }

    return false
  }

  getBounds(): Rect {
    if (this.points.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 }
    }

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    this.points.forEach(point => {
      minX = Math.min(minX, point.x)
      minY = Math.min(minY, point.y)
      maxX = Math.max(maxX, point.x)
      maxY = Math.max(maxY, point.y)
    })

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    }
  }

  clone(): Path {
    return new Path({
      points: this.points.map(p => ({ ...p })),
      style: { ...this.style },
    })
  }

  // 添加点
  addPoint(point: Point): void {
    this.points.push(point)
  }

  // 简化路径（Douglas-Peucker 算法）
  simplify(tolerance: number = 2): void {
    if (this.points.length <= 2) return

    this.points = this.douglasPeucker(this.points, tolerance)
  }

  private douglasPeucker(points: Point[], tolerance: number): Point[] {
    if (points.length <= 2) return points

    // 找到距离起点和终点连线最远的点
    let maxDistance = 0
    let maxIndex = 0

    const start = points[0]
    const end = points[points.length - 1]

    for (let i = 1; i < points.length - 1; i++) {
      const distance = this.perpendicularDistance(points[i], start, end)
      if (distance > maxDistance) {
        maxDistance = distance
        maxIndex = i
      }
    }

    // 如果最大距离大于阈值，递归简化
    if (maxDistance > tolerance) {
      const left = this.douglasPeucker(points.slice(0, maxIndex + 1), tolerance)
      const right = this.douglasPeucker(points.slice(maxIndex), tolerance)

      // 合并结果（去掉重复的中间点）
      return [...left.slice(0, -1), ...right]
    } else {
      // 否则只保留起点和终点
      return [start, end]
    }
  }

  private perpendicularDistance(point: Point, lineStart: Point, lineEnd: Point): number {
    const dx = lineEnd.x - lineStart.x
    const dy = lineEnd.y - lineStart.y

    if (dx === 0 && dy === 0) {
      // 线段退化为点
      return Math.sqrt((point.x - lineStart.x) ** 2 + (point.y - lineStart.y) ** 2)
    }

    // 计算垂直距离
    const numerator = Math.abs(dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x)
    const denominator = Math.sqrt(dx * dx + dy * dy)

    return numerator / denominator
  }
}
