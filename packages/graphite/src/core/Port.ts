import type { PortData, Point } from '../types'
import type { Node } from './Node'

export class Port {
  id: string
  nodeId: string
  position: 'top' | 'right' | 'bottom' | 'left'
  type: 'input' | 'output' | 'both'
  node: Node | null = null

  constructor(data: PortData) {
    this.id = data.id
    this.nodeId = data.nodeId
    this.position = data.position
    this.type = data.type
  }

  // 获取端口的世界坐标
  getWorldPosition(): Point {
    if (!this.node) {
      throw new Error('Port is not attached to a node')
    }

    return this.node.getPortPosition(this.position)
  }

  // 检查是否可以连接到另一个端口
  canConnectTo(other: Port): boolean {
    // 不能连接到自己
    if (this.nodeId === other.nodeId) {
      return false
    }

    // 检查类型兼容性
    if (this.type === 'input' && other.type === 'input') {
      return false
    }

    if (this.type === 'output' && other.type === 'output') {
      return false
    }

    return true
  }
}
