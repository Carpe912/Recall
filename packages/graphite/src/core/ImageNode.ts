import { Node } from './Node'
import type { NodeData, Point } from '../types'

export interface ImageNodeData extends NodeData {
  imageData: string // base64 or URL
}

export class ImageNode extends Node {
  imageData: string
  private image: HTMLImageElement | null = null
  private imageLoaded: boolean = false
  private imageError: boolean = false

  constructor(data: ImageNodeData) {
    super(data)
    this.imageData = data.imageData
    this.loadImage()
  }

  private loadImage(): void {
    this.image = new Image()
    this.image.onload = () => {
      this.imageLoaded = true
      this.imageError = false
    }
    this.image.onerror = () => {
      this.imageError = true
      this.imageLoaded = false
    }
    this.image.src = this.imageData
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

    // 绘制边框
    const x = -this.width / 2
    const y = -this.height / 2

    // 绘制背景（如果图片未加载）
    if (!this.imageLoaded) {
      ctx.fillStyle = this.style.fill
      ctx.fillRect(x, y, this.width, this.height)
    }

    // 绘制图片
    if (this.imageLoaded && this.image) {
      ctx.drawImage(this.image, x, y, this.width, this.height)
    }

    // 绘制加载状态
    if (!this.imageLoaded && !this.imageError) {
      ctx.fillStyle = this.style.fontColor
      ctx.font = `${this.style.fontSize}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('Loading...', 0, 0)
    }

    // 绘制错误状态
    if (this.imageError) {
      ctx.fillStyle = '#ff0000'
      ctx.font = `${this.style.fontSize}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('Failed to load image', 0, 0)
    }

    // 绘制边框
    ctx.strokeStyle = this.style.stroke
    ctx.lineWidth = this.style.strokeWidth
    ctx.strokeRect(x, y, this.width, this.height)

    // 绘制连接点
    if (showPorts) {
      this.drawPortsInternal(ctx)
    }

    ctx.restore()
  }

  private drawPortsInternal(ctx: CanvasRenderingContext2D): void {
    const portRadius = 6
    const ports = [
      { x: 0, y: -this.height / 2 },           // top
      { x: this.width / 2, y: 0 },             // right
      { x: 0, y: this.height / 2 },            // bottom
      { x: -this.width / 2, y: 0 },            // left
    ]

    ports.forEach(port => {
      ctx.beginPath()
      ctx.arc(port.x, port.y, portRadius, 0, Math.PI * 2)
      ctx.fillStyle = '#4A90E2'
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.stroke()
    })
  }

  clone(): ImageNode {
    return new ImageNode({
      x: this.transform.x,
      y: this.transform.y,
      width: this.width,
      height: this.height,
      content: this.content,
      shape: this.shape,
      style: { ...this.style },
      imageData: this.imageData,
    })
  }
}
