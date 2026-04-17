import { GraphicObject } from './GraphicObject'
import type { EdgeData, EdgeStyle, Rect, Point } from '../types'
import type { Node } from './Node'
import { pointToLineDistance, drawArrow } from '../utils/geometry'

export class Edge extends GraphicObject {
  fromNodeId: string
  toNodeId: string
  fromNode: Node | null = null
  toNode: Node | null = null
  points: Point[] = []
  style: Required<EdgeStyle>

  constructor(data: EdgeData) {
    super('edge', data.id)
    this.fromNodeId = data.from
    this.toNodeId = data.to

    // 默认样式
    this.style = {
      stroke: data.style?.stroke || '#666666',
      strokeWidth: data.style?.strokeWidth || 2,
      strokeDasharray: data.style?.strokeDasharray || '',
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.visible || this.points.length < 2) return

    ctx.save()

    // 绘制路径
    ctx.beginPath()
    ctx.moveTo(this.points[0].x, this.points[0].y)

    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y)
    }

    ctx.strokeStyle = this.style.stroke
    ctx.lineWidth = this.style.strokeWidth

    if (this.style.strokeDasharray) {
      const dashArray = this.style.strokeDasharray.split(',').map(Number)
      ctx.setLineDash(dashArray)
    }

    ctx.stroke()
    ctx.setLineDash([])

    // 绘制箭头
    if (this.points.length >= 2) {
      const lastPoint = this.points[this.points.length - 1]
      const secondLastPoint = this.points[this.points.length - 2]

      ctx.fillStyle = this.style.stroke
      drawArrow(ctx, secondLastPoint, lastPoint, 10)
    }

    ctx.restore()
  }

  hitTest(x: number, y: number): boolean {
    if (this.points.length < 2) return false

    // 检查点是否在路径附近
    const threshold = this.style.strokeWidth + 5

    for (let i = 0; i < this.points.length - 1; i++) {
      const distance = pointToLineDistance(
        { x, y },
        this.points[i],
        this.points[i + 1]
      )

      if (distance <= threshold) {
        return true
      }
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

  clone(): Edge {
    const edge = new Edge({
      from: this.fromNodeId,
      to: this.toNodeId,
      style: { ...this.style },
    })
    edge.points = this.points.map(p => ({ ...p }))
    return edge
  }

  // 更新路径
  updatePath(): void {
    if (!this.fromNode || !this.toNode) return

    const startCenter = this.fromNode.getCenter()
    const endCenter = this.toNode.getCenter()

    // 计算方向
    const dx = endCenter.x - startCenter.x
    const dy = endCenter.y - startCenter.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance === 0) return

    // 归一化方向向量
    const dirX = dx / distance
    const dirY = dy / distance

    // 计算起点（从节点边缘开始）
    const fromHalfWidth = this.fromNode.width / 2
    const fromHalfHeight = this.fromNode.height / 2
    const fromOffset = Math.min(
      Math.abs(dirX) > 0.001 ? fromHalfWidth / Math.abs(dirX) : Infinity,
      Math.abs(dirY) > 0.001 ? fromHalfHeight / Math.abs(dirY) : Infinity
    )

    const start = {
      x: startCenter.x + dirX * fromOffset,
      y: startCenter.y + dirY * fromOffset,
    }

    // 计算终点（到节点边缘结束）
    const toHalfWidth = this.toNode.width / 2
    const toHalfHeight = this.toNode.height / 2
    const toOffset = Math.min(
      Math.abs(dirX) > 0.001 ? toHalfWidth / Math.abs(dirX) : Infinity,
      Math.abs(dirY) > 0.001 ? toHalfHeight / Math.abs(dirY) : Infinity
    )

    const end = {
      x: endCenter.x - dirX * toOffset,
      y: endCenter.y - dirY * toOffset,
    }

    // 简单的直线路径
    this.points = [start, end]
  }

  // 计算正交路径（直角连线）
  calculateOrthogonalPath(): void {
    if (!this.fromNode || !this.toNode) return

    const start = this.fromNode.getCenter()
    const end = this.toNode.getCenter()

    // 简单的正交路径：中间点
    const midX = (start.x + end.x) / 2

    this.points = [
      start,
      { x: midX, y: start.y },
      { x: midX, y: end.y },
      end,
    ]
  }
}
