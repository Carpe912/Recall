import { Node } from './Node'
import type { NodeData } from '../types'

export interface CustomNodeData extends Omit<NodeData, 'width' | 'height'> {
  nodeType?: string
  data?: Record<string, any>
  width?: number
  height?: number
}

export interface RenderContext {
  ctx: CanvasRenderingContext2D
  bounds: { x: number; y: number; width: number; height: number }
  data: Record<string, any>
  isSelected: boolean
}

export type CustomRenderFunction = (context: RenderContext) => void

/**
 * 自定义节点基类
 * 支持响应式数据和自定义渲染
 */
export class CustomNode extends Node {
  nodeType: string
  data: Record<string, any>
  private renderFunction: CustomRenderFunction | null = null
  private dataChangeCallbacks: Array<(change: { property: string | symbol; value: any; oldValue: any }) => void> = []

  constructor(nodeData: CustomNodeData, renderFn?: CustomRenderFunction) {
    super({ ...nodeData, width: nodeData.width ?? 120, height: nodeData.height ?? 80 })
    this.nodeType = nodeData.nodeType || 'custom'
    this.data = this.createReactiveData(nodeData.data || {})
    this.renderFunction = renderFn || null
  }

  /**
   * 创建响应式数据
   * 使用 Proxy 拦截数据变化
   */
  private createReactiveData(data: Record<string, any>): Record<string, any> {
    const self = this
    return new Proxy(data, {
      set(target, property, value) {
        const oldValue = target[property as string]
        if (oldValue !== value) {
          target[property as string] = value
          // 触发数据变化回调
          self.dataChangeCallbacks.forEach(callback => {
            callback({ property, value, oldValue })
          })
          // 触发重绘事件（通过父类的 emit）
          self.emitNeedsRedraw()
        }
        return true
      },
      get(target, property) {
        return target[property as string]
      }
    })
  }

  /**
   * 触发重绘事件
   */
  private emitNeedsRedraw(): void {
    // 通过自定义事件系统触发
    if ((this as any)._eventEmitter) {
      (this as any)._eventEmitter.emit('needsRedraw')
    }
  }

  /**
   * 设置自定义渲染函数
   */
  setRenderFunction(fn: CustomRenderFunction): void {
    this.renderFunction = fn
  }

  /**
   * 更新节点数据
   */
  updateData(newData: Partial<Record<string, any>>): void {
    Object.assign(this.data, newData)
  }

  /**
   * 监听数据变化
   */
  onDataChange(callback: (change: { property: string | symbol; value: any; oldValue: any }) => void): void {
    this.dataChangeCallbacks.push(callback)
  }

  /**
   * 绘制节点
   */
  draw(ctx: CanvasRenderingContext2D, showPorts: boolean = false): void {
    if (!this.visible) return

    ctx.save()

    // 如果有自定义渲染函数，使用自定义渲染
    if (this.renderFunction) {
      const bounds = this.getBounds()

      // 应用变换
      ctx.translate(this.transform.x, this.transform.y)
      ctx.rotate(this.transform.rotation)
      ctx.scale(this.transform.scaleX, this.transform.scaleY)

      this.renderFunction({
        ctx,
        bounds: {
          x: -this.width / 2,
          y: -this.height / 2,
          width: this.width,
          height: this.height
        },
        data: this.data,
        isSelected: false
      })

      // 绘制连接点
      if (showPorts) {
        this.drawCustomPorts(ctx)
      }
    } else {
      // 否则使用默认渲染
      super.draw(ctx, showPorts)
    }

    ctx.restore()
  }

  // 绘制连接点
  private drawCustomPorts(ctx: CanvasRenderingContext2D): void {
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

  /**
   * 克隆节点
   */
  clone(): CustomNode {
    const cloned = new CustomNode({
      x: this.transform.x,
      y: this.transform.y,
      width: this.width,
      height: this.height,
      content: this.content,
      style: { ...this.style },
      nodeType: this.nodeType,
      data: { ...this.data }
    }, this.renderFunction || undefined)
    return cloned
  }
}
