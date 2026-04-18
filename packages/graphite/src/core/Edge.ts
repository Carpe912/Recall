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

    ctx.strokeStyle = this.style.stroke
    ctx.lineWidth = this.style.strokeWidth

    if (this.style.strokeDasharray) {
      const dashArray = this.style.strokeDasharray.split(',').map(Number)
      ctx.setLineDash(dashArray)
    }

    // 绘制路径（转角处使用圆角）
    const radius = 8 // 转角圆角半径
    ctx.beginPath()
    ctx.moveTo(this.points[0].x, this.points[0].y)

    for (let i = 1; i < this.points.length - 1; i++) {
      const prev = this.points[i - 1]
      const curr = this.points[i]
      const next = this.points[i + 1]

      // 计算圆角的控制点
      const d1 = Math.sqrt((curr.x - prev.x) ** 2 + (curr.y - prev.y) ** 2)
      const d2 = Math.sqrt((next.x - curr.x) ** 2 + (next.y - curr.y) ** 2)
      const r = Math.min(radius, d1 / 2, d2 / 2)

      // 进入转角前的点
      const t1x = curr.x - (curr.x - prev.x) / d1 * r
      const t1y = curr.y - (curr.y - prev.y) / d1 * r

      // 离开转角后的点
      const t2x = curr.x + (next.x - curr.x) / d2 * r
      const t2y = curr.y + (next.y - curr.y) / d2 * r

      ctx.lineTo(t1x, t1y)
      ctx.quadraticCurveTo(curr.x, curr.y, t2x, t2y)
    }

    ctx.lineTo(this.points[this.points.length - 1].x, this.points[this.points.length - 1].y)

    ctx.stroke()
    ctx.setLineDash([])

    // 绘制箭头
    const lastPoint = this.points[this.points.length - 1]
    const secondLastPoint = this.points[this.points.length - 2]
    ctx.fillStyle = this.style.stroke
    drawArrow(ctx, secondLastPoint, lastPoint, 10)

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
  updatePath(allEdges: Edge[] = []): void {
    if (!this.fromNode || !this.toNode) return

    const startCenter = this.fromNode.getCenter()
    const endCenter = this.toNode.getCenter()

    // 计算两节点中心的方向
    const dx = endCenter.x - startCenter.x
    const dy = endCenter.y - startCenter.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance === 0) return

    const dirX = dx / distance
    const dirY = dy / distance

    // 计算起点（从节点真实边缘开始）
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

    // 计算终点（到节点真实边缘结束）
    const toHalfWidth = this.toNode.width / 2
    const toHalfHeight = this.toNode.height / 2
    const toOffset = Math.min(
      Math.abs(dirX) > 0.001 ? toHalfWidth / Math.abs(dirX) : Infinity,
      Math.abs(dirY) > 0.001 ? toHalfHeight / Math.abs(dirY) : Infinity
    )

    const end = {
      x: endCenter.x - dirX * (toOffset + 5),
      y: endCenter.y - dirY * (toOffset + 5),
    }

    // 检查是否有多条边连接同样的两个节点
    const parallelEdges = allEdges.filter(edge => {
      return (
        (edge.fromNodeId === this.fromNodeId && edge.toNodeId === this.toNodeId) ||
        (edge.fromNodeId === this.toNodeId && edge.toNodeId === this.fromNodeId)
      )
    })

    // 如果有多条边，对边缘点做垂直偏移
    if (parallelEdges.length > 1) {
      const index = parallelEdges.indexOf(this)
      if (index === -1) return

      const totalEdges = parallelEdges.length
      const spacing = 20
      const offset = (index - (totalEdges - 1) / 2) * spacing

      // 使用统一的垂直方向（按节点ID排序保证方向一致）
      const useReversedDir = this.fromNodeId > this.toNodeId
      const perpX = useReversedDir ? dirY : -dirY
      const perpY = useReversedDir ? -dirX : dirX

      start.x += perpX * offset
      start.y += perpY * offset
      end.x += perpX * offset
      end.y += perpY * offset
    }

    this.points = [start, end]
  }
}
