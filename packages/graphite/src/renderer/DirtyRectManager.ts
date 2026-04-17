import type { Rect } from '../types'

export class DirtyRectManager {
  private dirtyRegions: Rect[] = []
  private isDirty: boolean = false

  // 标记区域为脏
  markDirty(rect: Rect): void {
    this.dirtyRegions.push(rect)
    this.isDirty = true
  }

  // 标记整个画布为脏
  markAllDirty(width: number, height: number): void {
    this.dirtyRegions = [{ x: 0, y: 0, width, height }]
    this.isDirty = true
  }

  // 检查是否有脏区域
  hasDirtyRegions(): boolean {
    return this.isDirty
  }

  // 获取合并后的脏区域
  getDirtyRegions(): Rect[] {
    if (this.dirtyRegions.length === 0) {
      return []
    }

    // 简单实现：返回包含所有脏区域的最小矩形
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    this.dirtyRegions.forEach(rect => {
      minX = Math.min(minX, rect.x)
      minY = Math.min(minY, rect.y)
      maxX = Math.max(maxX, rect.x + rect.width)
      maxY = Math.max(maxY, rect.y + rect.height)
    })

    return [{
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    }]
  }

  // 清除脏区域
  clear(): void {
    this.dirtyRegions = []
    this.isDirty = false
  }
}
