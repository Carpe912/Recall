import { GraphicObject } from './GraphicObject'
import type { NodeData, NodeStyle, PortDefinition, Rect, Point } from '../types'
/** Default 4-port layout (top / right / bottom / left) */
const DEFAULT_PORTS: PortDefinition[] = [
  { id: 'top',    dx: 0,    dy: -0.5, type: 'both' },
  { id: 'right',  dx: 0.5,  dy: 0,    type: 'both' },
  { id: 'bottom', dx: 0,    dy: 0.5,  type: 'both' },
  { id: 'left',   dx: -0.5, dy: 0,    type: 'both' },
]

export class Node extends GraphicObject {
  width: number
  height: number
  content: string
  shape: 'rectangle' | 'circle' | 'diamond' | 'triangle'
  style: Omit<Required<NodeStyle>, 'strokeGradient'> & Pick<NodeStyle, 'strokeGradient'>
  /** Configurable port list — defaults to 4 standard ports */
  ports: PortDefinition[]

  constructor(data: NodeData) {
    super('node', data.id)
    this.width = data.width
    this.height = data.height
    this.content = data.content
    this.shape = data.shape || 'rectangle'
    this.transform.x = data.x
    this.transform.y = data.y
    this.ports = data.ports ? data.ports.map(p => ({ ...p })) : DEFAULT_PORTS.map(p => ({ ...p }))

    // 默认样式
    this.style = {
      fill: data.style?.fill || '#ffffff',
      stroke: data.style?.stroke || '#333333',
      strokeWidth: data.style?.strokeWidth || 2,
      borderRadius: data.style?.borderRadius || 8,
      fontSize: data.style?.fontSize || 14,
      fontColor: data.style?.fontColor || '#333333',
      fontFamily: data.style?.fontFamily || 'sans-serif',
      shadowBlur: data.style?.shadowBlur || 0,
      shadowColor: data.style?.shadowColor || 'rgba(0, 0, 0, 0.2)',
      shadowOffsetX: data.style?.shadowOffsetX || 0,
      shadowOffsetY: data.style?.shadowOffsetY || 0,
      opacity: data.style?.opacity || 1,
      shape: data.style?.shape || this.shape,
      strokeGradient: data.style?.strokeGradient,
    }
  }

  draw(ctx: CanvasRenderingContext2D, showPorts: boolean = false): void {
    if (!this.visible) return

    ctx.save()

    // 应用变换
    ctx.translate(this.transform.x, this.transform.y)
    ctx.rotate(this.transform.rotation)
    ctx.scale(this.transform.scaleX, this.transform.scaleY)

    // 应用透明度
    ctx.globalAlpha = this.style.opacity

    // 应用阴影
    if (this.style.shadowBlur > 0) {
      ctx.shadowBlur = this.style.shadowBlur
      ctx.shadowColor = this.style.shadowColor
      ctx.shadowOffsetX = this.style.shadowOffsetX
      ctx.shadowOffsetY = this.style.shadowOffsetY
    }

    // 根据形状类型绘制
    const shape = this.style.shape || this.shape
    ctx.beginPath()

    switch (shape) {
      case 'circle':
        this.drawCircle(ctx)
        break
      case 'diamond':
        this.drawDiamond(ctx)
        break
      case 'triangle':
        this.drawTriangle(ctx)
        break
      case 'rectangle':
      default:
        this.drawRectangle(ctx)
        break
    }

    // 填充
    ctx.fillStyle = this.style.fill
    ctx.fill()

    // 描边（支持渐变色）
    if (this.style.strokeGradient) {
      const [c1, c2] = this.style.strokeGradient
      const grad = ctx.createLinearGradient(-this.width / 2, 0, this.width / 2, 0)
      grad.addColorStop(0, c1)
      grad.addColorStop(1, c2)
      ctx.strokeStyle = grad
    } else {
      ctx.strokeStyle = this.style.stroke
    }
    ctx.lineWidth = this.style.strokeWidth
    ctx.stroke()

    // 绘制文本
    ctx.fillStyle = this.style.fontColor
    ctx.font = `${this.style.fontSize}px ${this.style.fontFamily}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(this.content, 0, 0)

    // 绘制连接点
    if (showPorts) {
      this.drawPorts(ctx)
    }

    ctx.restore()
  }

  // 绘制矩形
  private drawRectangle(ctx: CanvasRenderingContext2D): void {
    const x = -this.width / 2
    const y = -this.height / 2
    const radius = this.style.borderRadius

    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + this.width - radius, y)
    ctx.quadraticCurveTo(x + this.width, y, x + this.width, y + radius)
    ctx.lineTo(x + this.width, y + this.height - radius)
    ctx.quadraticCurveTo(x + this.width, y + this.height, x + this.width - radius, y + this.height)
    ctx.lineTo(x + radius, y + this.height)
    ctx.quadraticCurveTo(x, y + this.height, x, y + this.height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
  }

  // 绘制圆形
  private drawCircle(ctx: CanvasRenderingContext2D): void {
    const radius = Math.min(this.width, this.height) / 2
    ctx.arc(0, 0, radius, 0, Math.PI * 2)
  }

  // 绘制菱形
  private drawDiamond(ctx: CanvasRenderingContext2D): void {
    const halfWidth = this.width / 2
    const halfHeight = this.height / 2

    ctx.moveTo(0, -halfHeight)           // 顶部
    ctx.lineTo(halfWidth, 0)             // 右侧
    ctx.lineTo(0, halfHeight)            // 底部
    ctx.lineTo(-halfWidth, 0)            // 左侧
    ctx.closePath()
  }

  // 绘制三角形
  private drawTriangle(ctx: CanvasRenderingContext2D): void {
    const halfWidth = this.width / 2
    const halfHeight = this.height / 2

    ctx.moveTo(0, -halfHeight)           // 顶部
    ctx.lineTo(halfWidth, halfHeight)    // 右下
    ctx.lineTo(-halfWidth, halfHeight)   // 左下
    ctx.closePath()
  }

  // 绘制连接点
  private drawPorts(ctx: CanvasRenderingContext2D): void {
    const portRadius = 6
    this.ports.forEach(port => {
      const px = port.dx * this.width
      const py = port.dy * this.height
      ctx.beginPath()
      ctx.arc(px, py, portRadius, 0, Math.PI * 2)
      ctx.fillStyle = port.type === 'input' ? '#52C41A' : port.type === 'output' ? '#FF7A45' : '#4A90E2'
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.stroke()
    })
  }

  // 绘制调整大小的控制点
  drawResizeHandles(ctx: CanvasRenderingContext2D): void {
    const handleSize = 8
    const halfWidth = this.width / 2
    const halfHeight = this.height / 2

    const handles = [
      { x: -halfWidth, y: -halfHeight },      // top-left
      { x: halfWidth, y: -halfHeight },       // top-right
      { x: halfWidth, y: halfHeight },        // bottom-right
      { x: -halfWidth, y: halfHeight },       // bottom-left
      { x: 0, y: -halfHeight },               // top
      { x: halfWidth, y: 0 },                 // right
      { x: 0, y: halfHeight },                // bottom
      { x: -halfWidth, y: 0 },                // left
    ]

    ctx.save()
    ctx.translate(this.transform.x, this.transform.y)

    handles.forEach(handle => {
      ctx.fillStyle = '#ffffff'
      ctx.strokeStyle = '#4A90E2'
      ctx.lineWidth = 2
      ctx.fillRect(
        handle.x - handleSize / 2,
        handle.y - handleSize / 2,
        handleSize,
        handleSize
      )
      ctx.strokeRect(
        handle.x - handleSize / 2,
        handle.y - handleSize / 2,
        handleSize,
        handleSize
      )
    })

    ctx.restore()
  }

  // 绘制旋转控制点
  drawRotateHandle(ctx: CanvasRenderingContext2D): void {
    const handleRadius = 8
    const handleDistance = 20
    const halfWidth = this.width / 2
    const halfHeight = this.height / 2

    ctx.save()
    ctx.translate(this.transform.x, this.transform.y)

    // 旋转控制点位置：右上角
    const handleX = halfWidth + handleDistance
    const handleY = -halfHeight - handleDistance

    // 绘制连接线
    ctx.beginPath()
    ctx.moveTo(halfWidth, -halfHeight)
    ctx.lineTo(handleX, handleY)
    ctx.strokeStyle = '#4A90E2'
    ctx.lineWidth = 2
    ctx.stroke()

    // 绘制旋转控制点（圆形背景）
    ctx.beginPath()
    ctx.arc(handleX, handleY, handleRadius, 0, Math.PI * 2)
    ctx.fillStyle = '#4A90E2'
    ctx.fill()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.stroke()

    // 绘制旋转图标（圆形箭头）
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(handleX, handleY, handleRadius * 0.5, -Math.PI * 0.7, Math.PI * 0.7, false)
    ctx.stroke()

    // 绘制箭头
    const arrowSize = 3
    const arrowAngle = Math.PI * 0.7
    const arrowX = handleX + Math.cos(arrowAngle) * handleRadius * 0.5
    const arrowY = handleY + Math.sin(arrowAngle) * handleRadius * 0.5

    ctx.beginPath()
    ctx.moveTo(arrowX, arrowY)
    ctx.lineTo(arrowX - arrowSize, arrowY - arrowSize * 0.5)
    ctx.lineTo(arrowX - arrowSize * 0.5, arrowY + arrowSize * 0.5)
    ctx.closePath()
    ctx.fillStyle = '#ffffff'
    ctx.fill()

    ctx.restore()
  }

  hitTest(x: number, y: number): boolean {
    const local = this.worldToLocal({ x, y })
    const shape = this.style.shape || this.shape

    switch (shape) {
      case 'circle': {
        const radius = Math.min(this.width, this.height) / 2
        const distance = Math.sqrt(local.x * local.x + local.y * local.y)
        return distance <= radius
      }
      case 'diamond': {
        const halfWidth = this.width / 2
        const halfHeight = this.height / 2
        // 菱形碰撞检测：点到四条边的距离
        const dx = Math.abs(local.x) / halfWidth
        const dy = Math.abs(local.y) / halfHeight
        return dx + dy <= 1
      }
      case 'triangle': {
        const halfWidth = this.width / 2
        const halfHeight = this.height / 2
        // 三角形碰撞检测：检查点是否在三角形内
        // 顶点：(0, -halfHeight), (halfWidth, halfHeight), (-halfWidth, halfHeight)
        if (local.y < -halfHeight || local.y > halfHeight) return false
        // 检查是否在左右边界内
        const ratio = (local.y + halfHeight) / (2 * halfHeight)
        const maxX = halfWidth * (1 - ratio * 2)
        return Math.abs(local.x) <= Math.abs(maxX)
      }
      case 'rectangle':
      default:
        return (
          Math.abs(local.x) <= this.width / 2 &&
          Math.abs(local.y) <= this.height / 2
        )
    }
  }

  getBounds(): Rect {
    return {
      x: this.transform.x - this.width / 2,
      y: this.transform.y - this.height / 2,
      width: this.width,
      height: this.height,
    }
  }

  clone(): Node {
    return new Node({
      x: this.transform.x,
      y: this.transform.y,
      width: this.width,
      height: this.height,
      content: this.content,
      shape: this.shape,
      style: { ...this.style },
      ports: this.ports.map(p => ({ ...p })),
    })
  }

  // 获取中心点
  getCenter(): Point {
    return {
      x: this.transform.x,
      y: this.transform.y,
    }
  }

  // 获取连接点位置（世界坐标）
  getPortPosition(positionOrId: 'top' | 'right' | 'bottom' | 'left' | string): Point {
    const center = this.getCenter()
    // Try to find by ID first
    const port = this.ports.find(p => p.id === positionOrId)
    if (port) {
      return { x: center.x + port.dx * this.width, y: center.y + port.dy * this.height }
    }
    // Legacy fallback for the 4 named positions
    const halfWidth = this.width / 2
    const halfHeight = this.height / 2
    switch (positionOrId) {
      case 'top':    return { x: center.x,             y: center.y - halfHeight }
      case 'right':  return { x: center.x + halfWidth, y: center.y              }
      case 'bottom': return { x: center.x,             y: center.y + halfHeight }
      case 'left':   return { x: center.x - halfWidth, y: center.y              }
      default:       return center
    }
  }

  // 获取最近的连接点
  getClosestPort(point: Point): { position: string; point: Point } {
    let closest: { position: string; point: Point } = { position: this.ports[0]?.id ?? 'top', point: this.getCenter() }
    let minDistance = Infinity

    this.ports.forEach(port => {
      const center = this.getCenter()
      const px = center.x + port.dx * this.width
      const py = center.y + port.dy * this.height
      const dx = point.x - px
      const dy = point.y - py
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < minDistance) {
        minDistance = dist
        closest = { position: port.id, point: { x: px, y: py } }
      }
    })

    return closest
  }

  // 检测点击的是哪个连接点（返回 port id）
  hitTestPort(x: number, y: number): string | null {
    const portRadius = 8
    const center = this.getCenter()
    for (const port of this.ports) {
      const px = center.x + port.dx * this.width
      const py = center.y + port.dy * this.height
      const dx = x - px
      const dy = y - py
      if (dx * dx + dy * dy <= portRadius * portRadius) {
        return port.id
      }
    }
    return null
  }

  /** Replace this node's port configuration */
  setPorts(ports: PortDefinition[]): void {
    this.ports = ports.map(p => ({ ...p }))
  }

  /** Reset to the default 4-port layout */
  resetPorts(): void {
    this.ports = DEFAULT_PORTS.map(p => ({ ...p }))
  }

  // 检测调整大小的控制点
  hitTestResizeHandle(x: number, y: number): string | null {
    const handleSize = 12
    const center = this.getCenter()
    const halfWidth = this.width / 2
    const halfHeight = this.height / 2

    const handles: Array<{ name: string, point: Point }> = [
      { name: 'nw', point: { x: center.x - halfWidth, y: center.y - halfHeight } },
      { name: 'ne', point: { x: center.x + halfWidth, y: center.y - halfHeight } },
      { name: 'se', point: { x: center.x + halfWidth, y: center.y + halfHeight } },
      { name: 'sw', point: { x: center.x - halfWidth, y: center.y + halfHeight } },
      { name: 'n', point: { x: center.x, y: center.y - halfHeight } },
      { name: 'e', point: { x: center.x + halfWidth, y: center.y } },
      { name: 's', point: { x: center.x, y: center.y + halfHeight } },
      { name: 'w', point: { x: center.x - halfWidth, y: center.y } },
    ]

    for (const handle of handles) {
      if (
        Math.abs(x - handle.point.x) <= handleSize / 2 &&
        Math.abs(y - handle.point.y) <= handleSize / 2
      ) {
        return handle.name
      }
    }

    return null
  }

  // 检测旋转控制点
  hitTestRotateHandle(x: number, y: number): boolean {
    const handleRadius = 12
    const handleDistance = 20
    const center = this.getCenter()
    const halfWidth = this.width / 2
    const halfHeight = this.height / 2

    const handlePoint = {
      x: center.x + halfWidth + handleDistance,
      y: center.y - halfHeight - handleDistance,
    }

    const dx = x - handlePoint.x
    const dy = y - handlePoint.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    return distance <= handleRadius
  }

  // 设置文本内容
  setContent(content: string): void {
    this.content = content
  }
}
