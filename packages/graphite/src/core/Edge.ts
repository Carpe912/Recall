import { GraphicObject } from './GraphicObject'
import type { EdgeData, EdgeStyle, Rect, Point } from '../types'
import type { Node } from './Node'
import { pointToLineDistance, drawArrow } from '../utils/geometry'
import { PathfindingRouter } from '../utils/PathfindingRouter'

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
      arrowType: data.style?.arrowType || 'arrow',
      arrowSize: data.style?.arrowSize || 10,
      opacity: data.style?.opacity || 1,
      lineStyle: data.style?.lineStyle || 'straight',
      useSmartRouting: data.style?.useSmartRouting || false,
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.visible || this.points.length < 2) return

    ctx.save()

    // 应用透明度
    ctx.globalAlpha = this.style.opacity

    ctx.strokeStyle = this.style.stroke
    ctx.lineWidth = this.style.strokeWidth

    if (this.style.strokeDasharray) {
      const dashArray = this.style.strokeDasharray.split(',').map(Number)
      ctx.setLineDash(dashArray)
    }

    // 根据线条样式绘制路径
    ctx.beginPath()

    const lineStyle = this.style.lineStyle || 'straight'

    if (lineStyle === 'curved' && this.points.length === 2) {
      // 简单曲线（两点）：使用贝塞尔曲线
      const start = this.points[0]
      const end = this.points[1]
      const dx = end.x - start.x
      const dy = end.y - start.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      // 控制点偏移量（垂直于连线方向）
      const offset = distance * 0.2
      const midX = (start.x + end.x) / 2
      const midY = (start.y + end.y) / 2

      // 垂直方向
      const perpX = -dy / distance
      const perpY = dx / distance

      const cp1X = midX + perpX * offset
      const cp1Y = midY + perpY * offset

      ctx.moveTo(start.x, start.y)
      ctx.quadraticCurveTo(cp1X, cp1Y, end.x, end.y)
    } else if (lineStyle === 'curved' && this.points.length > 2) {
      // 平滑曲线（多点，智能路由）：直接连接平滑后的点
      ctx.moveTo(this.points[0].x, this.points[0].y)
      for (let i = 1; i < this.points.length; i++) {
        ctx.lineTo(this.points[i].x, this.points[i].y)
      }
    } else {
      // 直线或正交线：直接连接点
      ctx.moveTo(this.points[0].x, this.points[0].y)
      for (let i = 1; i < this.points.length; i++) {
        ctx.lineTo(this.points[i].x, this.points[i].y)
      }
    }

    ctx.stroke()
    ctx.setLineDash([])

    // 绘制箭头
    if (this.style.arrowType !== 'none' && this.points.length >= 2) {
      const lastPoint = this.points[this.points.length - 1]
      const secondLastPoint = this.points[this.points.length - 2]

      ctx.fillStyle = this.style.stroke
      ctx.strokeStyle = this.style.stroke

      switch (this.style.arrowType) {
        case 'arrow':
          drawArrow(ctx, secondLastPoint, lastPoint, this.style.arrowSize)
          break
        case 'circle':
          this.drawCircleArrow(ctx, lastPoint, this.style.arrowSize)
          break
        case 'diamond':
          this.drawDiamondArrow(ctx, secondLastPoint, lastPoint, this.style.arrowSize)
          break
      }
    }

    ctx.restore()
  }

  // 绘制圆形箭头
  private drawCircleArrow(ctx: CanvasRenderingContext2D, point: Point, size: number): void {
    ctx.beginPath()
    ctx.arc(point.x, point.y, size / 2, 0, Math.PI * 2)
    ctx.fill()
  }

  // 绘制菱形箭头
  private drawDiamondArrow(ctx: CanvasRenderingContext2D, from: Point, to: Point, size: number): void {
    const angle = Math.atan2(to.y - from.y, to.x - from.x)

    ctx.save()
    ctx.translate(to.x, to.y)
    ctx.rotate(angle)

    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(-size, -size / 2)
    ctx.lineTo(-size * 1.5, 0)
    ctx.lineTo(-size, size / 2)
    ctx.closePath()
    ctx.fill()

    ctx.restore()
  }

  hitTest(x: number, y: number): boolean {
    if (this.points.length < 2) return false

    // 检查点是否在路径附近
    const threshold = this.style.strokeWidth + 5

    // 对于曲线，需要采样更多点来检测
    if (this.style.lineStyle === 'curved' && this.points.length === 2) {
      const start = this.points[0]
      const end = this.points[1]
      const dx = end.x - start.x
      const dy = end.y - start.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      // 计算控制点（与绘制时相同）
      const offset = distance * 0.2
      const midX = (start.x + end.x) / 2
      const midY = (start.y + end.y) / 2
      const perpX = -dy / distance
      const perpY = dx / distance
      const cp1X = midX + perpX * offset
      const cp1Y = midY + perpY * offset

      // 采样曲线上的点进行检测
      const samples = 20
      for (let i = 0; i < samples; i++) {
        const t1 = i / samples
        const t2 = (i + 1) / samples

        // 二次贝塞尔曲线公式
        const p1x = (1 - t1) * (1 - t1) * start.x + 2 * (1 - t1) * t1 * cp1X + t1 * t1 * end.x
        const p1y = (1 - t1) * (1 - t1) * start.y + 2 * (1 - t1) * t1 * cp1Y + t1 * t1 * end.y
        const p2x = (1 - t2) * (1 - t2) * start.x + 2 * (1 - t2) * t2 * cp1X + t2 * t2 * end.x
        const p2y = (1 - t2) * (1 - t2) * start.y + 2 * (1 - t2) * t2 * cp1Y + t2 * t2 * end.y

        const dist = pointToLineDistance(
          { x, y },
          { x: p1x, y: p1y },
          { x: p2x, y: p2y }
        )

        if (dist <= threshold) {
          return true
        }
      }
      return false
    }

    // 对于直线和折线，检查所有线段
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
  updatePath(allEdges: Edge[] = [], allNodes: Node[] = []): void {
    if (!this.fromNode || !this.toNode) return

    const startCenter = this.fromNode.getCenter()
    const endCenter = this.toNode.getCenter()

    // 计算两节点中心的方向
    const dx = endCenter.x - startCenter.x
    const dy = endCenter.y - startCenter.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    // 节点完全重叠时，直接将 points 设为两个相同的点并退出
    if (distance === 0) {
      this.points = [{ ...startCenter }, { ...endCenter }]
      return
    }

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

    // 根据线条样式生成路径点
    const lineStyle = this.style.lineStyle || 'straight'

    if (lineStyle === 'orthogonal') {
      // 正交线：检查是否使用智能路由
      if (this.style.useSmartRouting) {
        // 使用 A* 算法避开节点
        const router = new PathfindingRouter()
        // 过滤掉起点和终点节点
        const obstacleNodes = allNodes.filter(
          node => node.id !== this.fromNodeId && node.id !== this.toNodeId
        )
        this.points = router.findPath(start, end, obstacleNodes)
      } else {
        // 简单的正交路径
        this.points = this.calculateOrthogonalPath(start, end)
      }
    } else {
      // 直线或曲线：两点
      this.points = [start, end]
    }
  }

  // 计算正交路径（直角折线）
  private calculateOrthogonalPath(start: Point, end: Point): Point[] {
    const points: Point[] = [start]

    // 简单的正交路径：先水平后垂直，或先垂直后水平
    const dx = end.x - start.x
    const dy = end.y - start.y

    // 如果水平距离更大，先水平移动
    if (Math.abs(dx) > Math.abs(dy)) {
      const midX = start.x + dx / 2
      points.push({ x: midX, y: start.y })
      points.push({ x: midX, y: end.y })
    } else {
      // 否则先垂直移动
      const midY = start.y + dy / 2
      points.push({ x: start.x, y: midY })
      points.push({ x: end.x, y: midY })
    }

    points.push(end)
    return points
  }

  // 平滑路径（用于曲线智能路由）
  private smoothPath(points: Point[]): Point[] {
    if (points.length <= 2) return points

    // 使用 Catmull-Rom 样条曲线进行平滑
    const smoothed: Point[] = []

    // 对中间的每一段进行插值
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)]
      const p1 = points[i]
      const p2 = points[i + 1]
      const p3 = points[Math.min(points.length - 1, i + 2)]

      // 在每段之间插入多个点
      const segments = 10
      for (let t = 0; t <= segments; t++) {
        const u = t / segments

        // Catmull-Rom 样条公式
        const u2 = u * u
        const u3 = u2 * u

        const x = 0.5 * (
          (2 * p1.x) +
          (-p0.x + p2.x) * u +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * u2 +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * u3
        )

        const y = 0.5 * (
          (2 * p1.y) +
          (-p0.y + p2.y) * u +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * u2 +
          (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * u3
        )

        // 避免在段的起点重复添加（除了第一段）
        if (t > 0 || i === 0) {
          smoothed.push({ x, y })
        }
      }
    }

    return smoothed
  }
}
