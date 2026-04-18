import { GraphicObject } from './GraphicObject'
import type { Node } from './Node'
import type { Rect, Point } from '../types'
import { generateId } from '../utils/geometry'

export interface GroupStyle {
  fill: string
  stroke: string
  strokeWidth: number
  borderRadius: number
  opacity: number
  titleHeight: number
  titleFontSize: number
  titleColor: string
  titleFill: string
}

export class Group extends GraphicObject {
  label: string
  nodes: Node[]
  style: GroupStyle
  private padding: number = 30

  constructor(nodes: Node[], label: string = 'Group', id?: string) {
    super('group', id || generateId())
    this.label = label
    this.nodes = [...nodes]

    this.style = {
      fill: 'rgba(74, 144, 226, 0.05)',
      stroke: '#4A90E2',
      strokeWidth: 2,
      borderRadius: 8,
      opacity: 1,
      titleHeight: 28,
      titleFontSize: 13,
      titleColor: '#ffffff',
      titleFill: '#4A90E2',
    }

    this.updateBoundsFromNodes()
  }

  // 根据子节点重新计算边界
  updateBoundsFromNodes(): void {
    if (this.nodes.length === 0) return

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    this.nodes.forEach(node => {
      const bounds = node.getBounds()
      minX = Math.min(minX, bounds.x)
      minY = Math.min(minY, bounds.y)
      maxX = Math.max(maxX, bounds.x + bounds.width)
      maxY = Math.max(maxY, bounds.y + bounds.height)
    })

    const p = this.padding
    const titleH = this.style.titleHeight
    this.transform.x = minX - p
    this.transform.y = minY - p - titleH
    this.width = maxX - minX + p * 2
    this.height = maxY - minY + p * 2 + titleH
  }

  width: number = 0
  height: number = 0

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.visible) return

    ctx.save()
    ctx.globalAlpha = this.style.opacity

    const x = this.transform.x
    const y = this.transform.y
    const w = this.width
    const h = this.height
    const r = this.style.borderRadius
    const titleH = this.style.titleHeight

    // Draw group background
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()

    ctx.fillStyle = this.style.fill
    ctx.fill()
    ctx.strokeStyle = this.style.stroke
    ctx.lineWidth = this.style.strokeWidth
    ctx.stroke()

    // Draw title bar
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + titleH)
    ctx.lineTo(x, y + titleH)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()

    ctx.fillStyle = this.style.titleFill
    ctx.fill()

    // Draw label
    ctx.fillStyle = this.style.titleColor
    ctx.font = `${this.style.titleFontSize}px sans-serif`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(this.label, x + 10, y + titleH / 2)

    ctx.restore()
  }

  hitTest(x: number, y: number): boolean {
    const titleH = this.style.titleHeight
    // Only hit-test the title bar (to allow clicking through to nodes below)
    return (
      x >= this.transform.x &&
      x <= this.transform.x + this.width &&
      y >= this.transform.y &&
      y <= this.transform.y + titleH
    )
  }

  getBounds(): Rect {
    return {
      x: this.transform.x,
      y: this.transform.y,
      width: this.width,
      height: this.height,
    }
  }

  clone(): Group {
    const g = new Group(this.nodes, this.label)
    g.style = { ...this.style }
    return g
  }

  addNode(node: Node): void {
    if (!this.nodes.includes(node)) {
      this.nodes.push(node)
      this.updateBoundsFromNodes()
    }
  }

  removeNode(node: Node): void {
    const idx = this.nodes.indexOf(node)
    if (idx !== -1) {
      this.nodes.splice(idx, 1)
      this.updateBoundsFromNodes()
    }
  }

  containsNode(node: Node): boolean {
    return this.nodes.includes(node)
  }
}
