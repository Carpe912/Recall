import type { Node } from '../core/Node'
import type { Point } from '../types'
import { EventEmitter } from '../utils/EventEmitter'

export class DragManager extends EventEmitter {
  private isDragging: boolean = false
  private dragStartPoint: Point | null = null
  private draggedNodes: Node[] = []
  private initialPositions: Map<Node, Point> = new Map()

  // 开始拖拽
  startDrag(nodes: Node[], startPoint: Point): void {
    this.isDragging = true
    this.dragStartPoint = startPoint
    this.draggedNodes = nodes

    // 记录初始位置
    this.initialPositions.clear()
    nodes.forEach(node => {
      this.initialPositions.set(node, {
        x: node.transform.x,
        y: node.transform.y,
      })
    })

    this.emit('dragStart', nodes)
  }

  // 拖拽中
  drag(currentPoint: Point): void {
    if (!this.isDragging || !this.dragStartPoint) return

    const dx = currentPoint.x - this.dragStartPoint.x
    const dy = currentPoint.y - this.dragStartPoint.y

    // 更新节点位置
    this.draggedNodes.forEach(node => {
      const initial = this.initialPositions.get(node)
      if (initial) {
        node.setPosition(initial.x + dx, initial.y + dy)
      }
    })

    this.emit('drag', this.draggedNodes, dx, dy)
  }

  // 结束拖拽
  endDrag(currentPoint: Point): { dx: number; dy: number } | null {
    if (!this.isDragging || !this.dragStartPoint) return null

    const dx = currentPoint.x - this.dragStartPoint.x
    const dy = currentPoint.y - this.dragStartPoint.y

    this.isDragging = false
    this.dragStartPoint = null
    const draggedNodes = this.draggedNodes
    this.draggedNodes = []
    this.initialPositions.clear()

    this.emit('dragEnd', draggedNodes, dx, dy)

    return { dx, dy }
  }

  // 取消拖拽
  cancelDrag(): void {
    if (!this.isDragging) return

    // 恢复初始位置
    this.draggedNodes.forEach(node => {
      const initial = this.initialPositions.get(node)
      if (initial) {
        node.setPosition(initial.x, initial.y)
      }
    })

    this.isDragging = false
    this.dragStartPoint = null
    this.draggedNodes = []
    this.initialPositions.clear()

    this.emit('dragCancel')
  }

  // 是否正在拖拽
  isDraggingActive(): boolean {
    return this.isDragging
  }

  // 获取拖拽的节点
  getDraggedNodes(): Node[] {
    return this.draggedNodes
  }
}
