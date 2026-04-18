import type { Node } from '../core/Node'
import type { Point } from '../types'
import { EventEmitter } from '../utils/EventEmitter'

export class DragManager extends EventEmitter {
  private readonly DRAG_THRESHOLD = 4 // 世界坐标像素，超过后才算真正拖拽

  private isPending: boolean = false   // startDrag 已调用，但还没超过阈值
  private isDragging: boolean = false  // 真正在移动节点
  private dragStartPoint: Point | null = null
  private draggedNodes: Node[] = []
  private initialPositions: Map<Node, Point> = new Map()

  // 开始拖拽（仅记录意图，不立刻移动节点）
  startDrag(nodes: Node[], startPoint: Point): void {
    this.isPending = true
    this.isDragging = false
    this.dragStartPoint = startPoint
    this.draggedNodes = nodes

    this.initialPositions.clear()
    nodes.forEach(node => {
      this.initialPositions.set(node, {
        x: node.transform.x,
        y: node.transform.y,
      })
    })
  }

  // 拖拽中（超过阈值后才真正移动）
  // currentPoint: 真实鼠标位置（用于判断阈值）
  // snapPoint:    可选，吸附后的目标位置（用于实际移动节点）
  drag(currentPoint: Point, snapPoint?: Point): void {
    if (!this.isPending && !this.isDragging) return
    if (!this.dragStartPoint) return

    const dx = currentPoint.x - this.dragStartPoint.x
    const dy = currentPoint.y - this.dragStartPoint.y

    // 未超过阈值，不移动
    if (!this.isDragging && Math.sqrt(dx * dx + dy * dy) < this.DRAG_THRESHOLD) return

    // 首次超过阈值，标记为真正拖拽
    if (!this.isDragging) {
      this.isDragging = true
      this.emit('dragStart', this.draggedNodes)
    }

    // 用 snap 位置计算实际偏移；没有 snap 时用真实鼠标位置
    const targetX = snapPoint ? snapPoint.x : currentPoint.x
    const targetY = snapPoint ? snapPoint.y : currentPoint.y
    const snapDx = targetX - this.dragStartPoint.x
    const snapDy = targetY - this.dragStartPoint.y

    this.draggedNodes.forEach(node => {
      const initial = this.initialPositions.get(node)
      if (initial) {
        node.setPosition(initial.x + snapDx, initial.y + snapDy)
      }
    })

    this.emit('drag', this.draggedNodes, snapDx, snapDy)
  }

  // 结束拖拽
  endDrag(currentPoint: Point): { dx: number; dy: number } | null {
    if (!this.isPending && !this.isDragging) return null
    if (!this.dragStartPoint) return null

    const dx = currentPoint.x - this.dragStartPoint.x
    const dy = currentPoint.y - this.dragStartPoint.y

    const wasActuallyDragging = this.isDragging

    this.isPending = false
    this.isDragging = false
    this.dragStartPoint = null
    const draggedNodes = this.draggedNodes
    this.draggedNodes = []
    this.initialPositions.clear()

    if (wasActuallyDragging) {
      this.emit('dragEnd', draggedNodes, dx, dy)
    }

    return { dx, dy }
  }

  // 取消拖拽（恢复初始位置）
  cancelDrag(): void {
    if (!this.isPending && !this.isDragging) return

    this.draggedNodes.forEach(node => {
      const initial = this.initialPositions.get(node)
      if (initial) {
        node.setPosition(initial.x, initial.y)
      }
    })

    this.isPending = false
    this.isDragging = false
    this.dragStartPoint = null
    this.draggedNodes = []
    this.initialPositions.clear()

    this.emit('dragCancel')
  }

  // 是否处于拖拽意图状态（startDrag 已调用，不管有没有超阈值）
  isDraggingActive(): boolean {
    return this.isPending || this.isDragging
  }

  // 是否真正在移动节点（超过阈值后）
  isActuallyDragging(): boolean {
    return this.isDragging
  }

  getDraggedNodes(): Node[] {
    return this.draggedNodes
  }
}

