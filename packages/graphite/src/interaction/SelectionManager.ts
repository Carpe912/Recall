import type { Node } from '../core/Node'
import type { Edge } from '../core/Edge'
import type { Rect, Point } from '../types'
import { EventEmitter } from '../utils/EventEmitter'
import { pointInRect, rectIntersects } from '../utils/geometry'

export class SelectionManager extends EventEmitter {
  private selectedNodes: Set<Node> = new Set()
  private selectedEdges: Set<Edge> = new Set()

  // 选择节点
  selectNode(node: Node, multi: boolean = false): void {
    if (!multi) {
      this.clear()
    }
    this.selectedNodes.add(node)
    this.emit('selectionChanged', this.getSelectedNodeIds())
  }

  // 取消选择节点
  deselectNode(node: Node): void {
    this.selectedNodes.delete(node)
    this.emit('selectionChanged', this.getSelectedNodeIds())
  }

  // 选择边
  selectEdge(edge: Edge, multi: boolean = false): void {
    if (!multi) {
      this.clear()
    }
    this.selectedEdges.add(edge)
    this.emit('selectionChanged', this.getSelectedNodeIds())
  }

  // 取消选择边
  deselectEdge(edge: Edge): void {
    this.selectedEdges.delete(edge)
    this.emit('selectionChanged', this.getSelectedNodeIds())
  }

  // 框选
  selectInRect(rect: Rect, nodes: Node[], edges: Edge[]): void {
    this.clear()

    // 选择在矩形内的节点
    nodes.forEach(node => {
      const bounds = node.getBounds()
      if (rectIntersects(bounds, rect)) {
        this.selectedNodes.add(node)
      }
    })

    // 选择在矩形内的边
    edges.forEach(edge => {
      const bounds = edge.getBounds()
      if (rectIntersects(bounds, rect)) {
        this.selectedEdges.add(edge)
      }
    })

    this.emit('selectionChanged', this.getSelectedNodeIds())
  }

  // 清除选择
  clear(): void {
    this.selectedNodes.clear()
    this.selectedEdges.clear()
    this.emit('selectionChanged', [])
  }

  // 获取选中的节点
  getSelectedNodes(): Node[] {
    return Array.from(this.selectedNodes)
  }

  // 获取选中的边
  getSelectedEdges(): Edge[] {
    return Array.from(this.selectedEdges)
  }

  // 获取选中的节点 ID
  getSelectedNodeIds(): string[] {
    return Array.from(this.selectedNodes).map(node => node.id)
  }

  // 检查节点是否被选中
  isNodeSelected(node: Node): boolean {
    return this.selectedNodes.has(node)
  }

  // 检查边是否被选中
  isEdgeSelected(edge: Edge): boolean {
    return this.selectedEdges.has(edge)
  }

  // 获取选中数量
  getSelectionCount(): number {
    return this.selectedNodes.size + this.selectedEdges.size
  }

  // 是否有选中
  hasSelection(): boolean {
    return this.getSelectionCount() > 0
  }
}
