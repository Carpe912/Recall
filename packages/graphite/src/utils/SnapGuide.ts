import type { Node } from '../core/Node'
import type { Point } from '../types'

export interface SnapResult {
  x: number
  y: number
  snappedX: boolean
  snappedY: boolean
  guides: { x: number[]; y: number[] }
}

export class SnapGuide {
  private threshold: number = 5 // 吸附阈值（像素）
  private gridSize: number = 20 // 网格大小
  private enableGrid: boolean = true
  private enableNodeSnap: boolean = true

  setThreshold(threshold: number): void {
    this.threshold = threshold
  }

  setGridSize(size: number): void {
    this.gridSize = size
  }

  setEnableGrid(enable: boolean): void {
    this.enableGrid = enable
  }

  setEnableNodeSnap(enable: boolean): void {
    this.enableNodeSnap = enable
  }

  // 计算吸附位置
  snap(
    node: Node,
    targetX: number,
    targetY: number,
    allNodes: Node[],
    zoom: number = 1
  ): SnapResult {
    const result: SnapResult = {
      x: targetX,
      y: targetY,
      snappedX: false,
      snappedY: false,
      guides: { x: [], y: [] }
    }

    const threshold = this.threshold / zoom
    const halfWidth = node.width / 2
    const halfHeight = node.height / 2

    // 节点的关键点（中心、左、右、上、下）
    const nodeLeft = targetX - halfWidth
    const nodeRight = targetX + halfWidth
    const nodeTop = targetY - halfHeight
    const nodeBottom = targetY + halfHeight
    const nodeCenter = { x: targetX, y: targetY }

    let snapX: number | null = null
    let snapY: number | null = null

    // 网格吸附
    if (this.enableGrid && this.gridSize > 0) {
      const gridSnapX = Math.round(targetX / this.gridSize) * this.gridSize
      const gridSnapY = Math.round(targetY / this.gridSize) * this.gridSize

      if (Math.abs(targetX - gridSnapX) < threshold) {
        snapX = gridSnapX
        result.guides.x.push(gridSnapX)
      }

      if (Math.abs(targetY - gridSnapY) < threshold) {
        snapY = gridSnapY
        result.guides.y.push(gridSnapY)
      }
    }

    // 节点吸附
    if (this.enableNodeSnap) {
      const otherNodes = allNodes.filter(n => n.id !== node.id)

      for (const other of otherNodes) {
        const otherCenter = other.getCenter()
        const otherHalfWidth = other.width / 2
        const otherHalfHeight = other.height / 2
        const otherLeft = otherCenter.x - otherHalfWidth
        const otherRight = otherCenter.x + otherHalfWidth
        const otherTop = otherCenter.y - otherHalfHeight
        const otherBottom = otherCenter.y + otherHalfHeight

        // X 轴吸附
        if (snapX === null) {
          // 左对齐
          if (Math.abs(nodeLeft - otherLeft) < threshold) {
            snapX = otherLeft + halfWidth
            result.guides.x.push(otherLeft)
          }
          // 右对齐
          else if (Math.abs(nodeRight - otherRight) < threshold) {
            snapX = otherRight - halfWidth
            result.guides.x.push(otherRight)
          }
          // 中心对齐
          else if (Math.abs(nodeCenter.x - otherCenter.x) < threshold) {
            snapX = otherCenter.x
            result.guides.x.push(otherCenter.x)
          }
          // 左边对齐其他节点右边
          else if (Math.abs(nodeLeft - otherRight) < threshold) {
            snapX = otherRight + halfWidth
            result.guides.x.push(otherRight)
          }
          // 右边对齐其他节点左边
          else if (Math.abs(nodeRight - otherLeft) < threshold) {
            snapX = otherLeft - halfWidth
            result.guides.x.push(otherLeft)
          }
        }

        // Y 轴吸附
        if (snapY === null) {
          // 上对齐
          if (Math.abs(nodeTop - otherTop) < threshold) {
            snapY = otherTop + halfHeight
            result.guides.y.push(otherTop)
          }
          // 下对齐
          else if (Math.abs(nodeBottom - otherBottom) < threshold) {
            snapY = otherBottom - halfHeight
            result.guides.y.push(otherBottom)
          }
          // 中心对齐
          else if (Math.abs(nodeCenter.y - otherCenter.y) < threshold) {
            snapY = otherCenter.y
            result.guides.y.push(otherCenter.y)
          }
          // 上边对齐其他节点下边
          else if (Math.abs(nodeTop - otherBottom) < threshold) {
            snapY = otherBottom + halfHeight
            result.guides.y.push(otherBottom)
          }
          // 下边对齐其他节点上边
          else if (Math.abs(nodeBottom - otherTop) < threshold) {
            snapY = otherTop - halfHeight
            result.guides.y.push(otherTop)
          }
        }

        if (snapX !== null && snapY !== null) break
      }
    }

    if (snapX !== null) {
      result.x = snapX
      result.snappedX = true
    }

    if (snapY !== null) {
      result.y = snapY
      result.snappedY = true
    }

    return result
  }
}
