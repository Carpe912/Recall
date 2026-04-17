import type { Point, Rect } from '../types'

// 生成唯一 ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// 点是否在矩形内
export function pointInRect(point: Point, rect: Rect): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  )
}

// 两个矩形是否相交
export function rectIntersects(a: Rect, b: Rect): boolean {
  return !(
    a.x + a.width < b.x ||
    b.x + b.width < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
  )
}

// 矩形是否包含另一个矩形
export function rectContains(outer: Rect, inner: Rect): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.width <= outer.x + outer.width &&
    inner.y + inner.height <= outer.y + outer.height
  )
}

// 计算两点之间的距离
export function distance(a: Point, b: Point): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  return Math.sqrt(dx * dx + dy * dy)
}

// 计算点到线段的距离
export function pointToLineDistance(
  point: Point,
  lineStart: Point,
  lineEnd: Point
): number {
  const dx = lineEnd.x - lineStart.x
  const dy = lineEnd.y - lineStart.y
  const lengthSquared = dx * dx + dy * dy

  if (lengthSquared === 0) {
    return distance(point, lineStart)
  }

  let t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lengthSquared
  t = Math.max(0, Math.min(1, t))

  const projection = {
    x: lineStart.x + t * dx,
    y: lineStart.y + t * dy,
  }

  return distance(point, projection)
}

// 绘制箭头
export function drawArrow(
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  arrowSize: number = 10
): void {
  const angle = Math.atan2(to.y - from.y, to.x - from.x)

  ctx.save()
  ctx.translate(to.x, to.y)
  ctx.rotate(angle)

  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(-arrowSize, -arrowSize / 2)
  ctx.lineTo(-arrowSize, arrowSize / 2)
  ctx.closePath()
  ctx.fill()

  ctx.restore()
}

// 计算矩形的中心点
export function getRectCenter(rect: Rect): Point {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  }
}
