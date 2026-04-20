import type { Rect } from '../types'

export class DirtyRectManager {
  private dirtyRegions: Rect[] = []
  private isDirty: boolean = false
  // 是否需要全量重绘（相机移动、主题切换等）
  private fullRedraw: boolean = false

  // 标记屏幕坐标区域为脏（已经过 camera 转换）
  markDirty(rect: Rect): void {
    this.dirtyRegions.push(rect)
    this.isDirty = true
  }

  // 标记整个画布为脏
  markAllDirty(width: number, height: number): void {
    this.dirtyRegions = [{ x: 0, y: 0, width, height }]
    this.fullRedraw = true
    this.isDirty = true
  }

  // 是否需要全量重绘
  needsFullRedraw(): boolean {
    return this.fullRedraw
  }

  // 检查是否有脏区域
  hasDirtyRegions(): boolean {
    return this.isDirty
  }

  // 获取合并后的脏区域（屏幕坐标，已加 padding 防止边缘裁切）
  getDirtyRegions(padding: number = 4): Rect[] {
    if (this.dirtyRegions.length === 0) {
      return []
    }

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
      x: minX - padding,
      y: minY - padding,
      width: maxX - minX + padding * 2,
      height: maxY - minY + padding * 2,
    }]
  }

  // 清除脏区域
  clear(): void {
    this.dirtyRegions = []
    this.isDirty = false
    this.fullRedraw = false
  }
}
