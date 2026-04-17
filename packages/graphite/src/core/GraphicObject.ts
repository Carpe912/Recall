import type { IGraphicObject, Transform, Rect, Point } from '../types'
import { generateId } from '../utils/geometry'

export abstract class GraphicObject implements IGraphicObject {
  id: string
  type: string
  transform: Transform
  visible: boolean = true
  parent: GraphicObject | null = null
  children: GraphicObject[] = []

  constructor(type: string, id?: string) {
    this.id = id || generateId()
    this.type = type
    this.transform = {
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
    }
  }

  abstract draw(ctx: CanvasRenderingContext2D): void
  abstract hitTest(x: number, y: number): boolean
  abstract getBounds(): Rect
  abstract clone(): IGraphicObject

  // 添加子对象
  addChild(child: GraphicObject): void {
    if (child.parent) {
      child.parent.removeChild(child)
    }
    child.parent = this
    this.children.push(child)
  }

  // 移除子对象
  removeChild(child: GraphicObject): void {
    const index = this.children.indexOf(child)
    if (index !== -1) {
      this.children.splice(index, 1)
      child.parent = null
    }
  }

  // 本地坐标转世界坐标
  localToWorld(point: Point): Point {
    let current: GraphicObject | null = this
    let result = { ...point }

    while (current) {
      const t = current.transform

      // 应用旋转
      if (t.rotation !== 0) {
        const cos = Math.cos(t.rotation)
        const sin = Math.sin(t.rotation)
        const x = result.x * cos - result.y * sin
        const y = result.x * sin + result.y * cos
        result.x = x
        result.y = y
      }

      // 应用缩放
      result.x *= t.scaleX
      result.y *= t.scaleY

      // 应用平移
      result.x += t.x
      result.y += t.y

      current = current.parent
    }

    return result
  }

  // 世界坐标转本地坐标
  worldToLocal(point: Point): Point {
    const transforms: Transform[] = []
    let current: GraphicObject | null = this

    // 收集所有变换
    while (current) {
      transforms.unshift(current.transform)
      current = current.parent
    }

    let result = { ...point }

    // 反向应用变换
    for (let i = transforms.length - 1; i >= 0; i--) {
      const t = transforms[i]

      // 反向平移
      result.x -= t.x
      result.y -= t.y

      // 反向缩放
      result.x /= t.scaleX
      result.y /= t.scaleY

      // 反向旋转
      if (t.rotation !== 0) {
        const cos = Math.cos(-t.rotation)
        const sin = Math.sin(-t.rotation)
        const x = result.x * cos - result.y * sin
        const y = result.x * sin + result.y * cos
        result.x = x
        result.y = y
      }
    }

    return result
  }

  // 设置位置
  setPosition(x: number, y: number): void {
    this.transform.x = x
    this.transform.y = y
  }

  // 设置缩放
  setScale(scaleX: number, scaleY?: number): void {
    this.transform.scaleX = scaleX
    this.transform.scaleY = scaleY ?? scaleX
  }

  // 设置旋转
  setRotation(rotation: number): void {
    this.transform.rotation = rotation
  }
}
